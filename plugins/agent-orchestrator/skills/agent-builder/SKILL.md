---
name: agent-builder
description: Build Claude Code agents — .md agent definitions, frontmatter configuration, tool selection, model routing, subagent dispatch, and multi-agent coordination. Use when creating or modifying agents, configuring agent teams, or designing orchestration flows.
---

# Agent Builder Skill

Patterns for building Claude Code agent definitions (the `.md` files in `agents/`).

## When to Use
- Creating a new agent `.md` file in the `agents/` directory
- Configuring frontmatter (tools, model, permissions) for an agent
- Designing multi-agent orchestration with subagent dispatch
- Writing agent descriptions for accurate routing by the orchestrator

## Agent File Structure
Every agent is a markdown file with YAML frontmatter followed by instructions.

```markdown
---
name: my-agent-name
description: >
  One-paragraph description that the orchestrator uses for routing.
  Include trigger words and differentiate from peer agents.
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - Agent
model: claude-sonnet-4-20250514
maxTurns: 30
skills:
  - nestjs-patterns
  - react-patterns
memory: project
permissionMode: auto
---

# Agent Name

## Role
What this agent does and when it is activated.

## Instructions
Step-by-step behavior the agent must follow.

## Rules
Hard constraints the agent must never violate.
```

## Frontmatter Fields Reference

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | Unique identifier, kebab-case |
| `description` | Yes | Routing text -- orchestrator reads this to decide dispatch |
| `tools` | Yes | Array of tools the agent can use |
| `model` | No | Model override (defaults to session model) |
| `maxTurns` | No | Maximum conversation turns before stopping |
| `skills` | No | Array of skill names to load as context |
| `memory` | No | File paths loaded into context at startup |
| `permissionMode` | No | `auto` (no confirmations) or `default` (ask user) |

## Tool Selection by Role

**Implementer agents** (write code):
```yaml
tools: [Read, Write, Edit, Bash, Grep, Glob]
```

**Reviewer agents** (read-only analysis):
```yaml
tools: [Read, Grep, Glob, Bash]
```
Never give Write/Edit to reviewers -- enforces separation of concerns.

**Orchestrator agents** (delegate work):
```yaml
tools: [Read, Grep, Glob, Agent, Bash]
```
Orchestrators dispatch via the `Agent` tool, rarely write code directly.

**Explorer agents** (research and planning):
```yaml
tools: [Read, Grep, Glob, WebSearch, WebFetch, Bash]
```

## Model Routing

| Agent Role | Recommended Model | Reason |
|------------|-------------------|--------|
| Orchestrator | `claude-opus-4-20250514` | Complex planning, multi-step reasoning |
| Senior engineer | `claude-opus-4-20250514` | Architecture decisions, code review |
| Implementer | `claude-sonnet-4-20250514` | Fast, accurate code generation |
| Explorer/researcher | `claude-sonnet-4-20250514` | Efficient information gathering |
| Simple utility | `claude-haiku-235-20250514` | File scanning, formatting, classification |

## Writing Descriptions for Routing

The `description` field is the single most important field for routing. The orchestrator reads descriptions of all agents to decide which one handles a task.

**Good description (specific triggers, clear scope):**
```yaml
description: >
  Implement NestJS backend features -- controllers, services, DTOs,
  database entities, and unit tests. Handles API endpoints, middleware,
  guards, and Prisma/TypeORM integration. Does NOT handle frontend,
  mobile, or infrastructure.
```

**Bad description (vague, overlaps with peers):**
```yaml
description: >
  A helpful developer agent that writes code and fixes bugs.
```

**Routing tips:**
- Include technology keywords the orchestrator will match on (NestJS, React, Flutter)
- State what the agent does NOT do to prevent false matches
- Use action verbs: "implement", "review", "deploy", "test"
- Differentiate from peer agents explicitly

## Subagent Dispatch Pattern
Orchestrators use the `Agent` tool to delegate to specialists:
- Set `subagent_type` to the agent name from `agents/` directory
- Set `prompt` to a clear task with file paths and acceptance criteria
- For cross-service tasks, dispatch sequentially: backend first, then frontend
- After each subagent completes, verify output before dispatching next

## Agent Teams (Experimental)
For peer-to-peer coordination, agents use `SendMessage` instead of going through an orchestrator. Backend agent sends API contract updates to frontend agent; each agent operates autonomously but stays synchronized.

## Anti-Patterns
- **God agent** with all tools and no focus -- split into specialist roles
- **Missing negative routing** in description -- causes false dispatch matches
- **Write/Edit tools on reviewer agents** -- reviewers must be read-only
- **Haiku for orchestrators** -- orchestrators need strong reasoning (use Opus)
- **No maxTurns limit** -- always set a ceiling to prevent runaway agents
- **Hardcoded file paths** in agent instructions -- use Grep/Glob to discover paths
- **Skills list with 10+ entries** -- agents with too much context lose focus

## Checklist
- [ ] Agent name is unique and kebab-case
- [ ] Description includes trigger words for accurate routing
- [ ] Description states what the agent does NOT handle
- [ ] Tool selection matches the agent's role (implementer vs reviewer)
- [ ] Model selection justified (Opus for reasoning, Sonnet for execution)
- [ ] `maxTurns` is set (recommended: 15-30 for implementers, 50 for orchestrators)
- [ ] Skills list is focused (3-5 relevant skills, not everything)
- [ ] Memory files exist and are relevant to the agent's domain
- [ ] Agent instructions include explicit rules and constraints
- [ ] Tested: orchestrator routes to this agent for expected trigger phrases
