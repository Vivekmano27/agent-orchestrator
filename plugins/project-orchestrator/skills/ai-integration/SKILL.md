---
name: ai-integration
description: Integrate LLM APIs — prompt engineering, streaming, function calling, token management, cost optimization, fallback strategies. Supports Claude, OpenAI, Gemini. Use when building AI features, agents, integrations, or automation workflows.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# AI Integration Skill

Patterns for integrating LLMs into the Python/Django AI service with production-grade reliability.

## When to Use
- Adding Claude/LLM capabilities to the AI service (`services/ai-service/`)
- Building RAG pipelines with LangChain
- Implementing streaming responses (SSE) for real-time AI output
- Managing prompts, token budgets, and API costs

## Model Selection Framework

| Model | Use Case | Latency | Cost |
|-------|----------|---------|------|
| Claude Opus | Complex reasoning, multi-step analysis, code generation | Higher | $$$ |
| Claude Sonnet | General tasks, summarization, structured extraction | Medium | $$ |
| Claude Haiku | Classification, routing, simple Q&A, validation | Low | $ |

**Rule:** Start with Haiku. Escalate to Sonnet/Opus only when output quality requires it.

## Claude API Integration (Anthropic SDK)
```python
# services/ai-service/app/integrations/claude_client.py
import anthropic
from django.conf import settings

class ClaudeClient:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    def complete(self, prompt: str, model: str = "claude-sonnet-4-20250514",
                 max_tokens: int = 1024, system: str | None = None) -> dict:
        try:
            msg = self.client.messages.create(
                model=model, max_tokens=max_tokens, system=system or "",
                messages=[{"role": "user", "content": prompt}],
            )
            return {"content": msg.content[0].text, "model": msg.model,
                    "usage": {"input_tokens": msg.usage.input_tokens,
                              "output_tokens": msg.usage.output_tokens}}
        except anthropic.RateLimitError:
            raise ServiceUnavailableError("Rate limited by Claude API")
        except anthropic.APIStatusError as e:
            raise ExternalAPIError(f"Claude API error: {e.status_code}")
```

## Streaming with SSE
```python
# services/ai-service/app/api/views.py
from django.http import StreamingHttpResponse

def stream_completion(request):
    prompt = request.data["prompt"]
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    def event_stream():
        with client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingHttpResponse(event_stream(), content_type="text/event-stream")
```

## Prompt Management
```python
# services/ai-service/app/services/prompt_manager.py
from pathlib import Path
from string import Template

PROMPT_DIR = Path(__file__).parent.parent / "prompts"

class PromptManager:
    """Load prompts from versioned template files, never hardcode."""

    @staticmethod
    def render(template_name: str, **variables) -> str:
        path = PROMPT_DIR / f"{template_name}.txt"
        if not path.exists():
            raise FileNotFoundError(f"Prompt template not found: {template_name}")
        template = Template(path.read_text())
        return template.safe_substitute(**variables)
```
Store prompts in `services/ai-service/app/prompts/` as `.txt` files. Version them in git. Never inline prompt strings in business logic.

## RAG Pipeline with LangChain
```python
# services/ai-service/app/services/rag_service.py
from langchain_anthropic import ChatAnthropic
from langchain.chains import RetrievalQA
from langchain_community.vectorstores import PGVector

class RAGService:
    def __init__(self):
        self.llm = ChatAnthropic(model="claude-sonnet-4-20250514", temperature=0)
        self.vectorstore = PGVector(
            connection_string=settings.DATABASE_URL,
            collection_name="documents",
            embedding_function=self._get_embeddings(),
        )

    def query(self, question: str, k: int = 5) -> dict:
        retriever = self.vectorstore.as_retriever(search_kwargs={"k": k})
        chain = RetrievalQA.from_chain_type(llm=self.llm, retriever=retriever)
        return chain.invoke({"query": question})
```

## Cost Tracking
```python
# services/ai-service/app/services/usage_tracker.py
MODEL_COSTS_PER_1K = {
    "claude-opus-4-20250514": {"input": 0.015, "output": 0.075},
    "claude-sonnet-4-20250514": {"input": 0.003, "output": 0.015},
    "claude-haiku-235-20250514": {"input": 0.00025, "output": 0.00125},
}

def track_usage(model: str, input_tokens: int, output_tokens: int,
                user_id: str, feature: str) -> None:
    costs = MODEL_COSTS_PER_1K.get(model, {"input": 0, "output": 0})
    estimated_cost = ((input_tokens / 1000) * costs["input"]
                      + (output_tokens / 1000) * costs["output"])
    APIUsageLog.objects.create(model=model, input_tokens=input_tokens,
        output_tokens=output_tokens, estimated_cost=estimated_cost,
        user_id=user_id, feature=feature)
    logger.info("usage: model=%s tokens=%d+%d cost=$%.4f", model,
                input_tokens, output_tokens, estimated_cost)
```

## Anti-Patterns
- **Hardcoded prompts** in view functions -- use PromptManager templates instead
- **No token limits** -- always set `max_tokens` to prevent runaway costs
- **Swallowing API errors** -- catch specific exceptions, log them, re-raise as domain errors
- **Synchronous heavy inference** -- use Celery tasks for requests expected to exceed 5 seconds
- **No cost tracking** -- every API call must be logged with token counts
- **Single model for everything** -- use Haiku for routing/classification, Sonnet for general, Opus for complex

## Checklist
- [ ] API key stored in environment variable, never in code
- [ ] Streaming endpoint uses SSE format with `[DONE]` sentinel
- [ ] All prompts stored as templates in `app/prompts/`
- [ ] Token usage logged for every API call
- [ ] Rate limit errors handled with retry or graceful degradation
- [ ] Timeout set on all API calls (default 30s, max 120s for Opus)
- [ ] Model selection justified per endpoint (Haiku/Sonnet/Opus)
- [ ] Long-running inference dispatched to Celery, not handled in request cycle
