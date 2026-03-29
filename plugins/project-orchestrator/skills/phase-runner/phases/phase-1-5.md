# Phase 1.5: Tech Stack Interview

**Executor:** project-setup agent (subagent)

## Preconditions
- `.claude/specs/[feature]/requirements.md` exists (Phase 1)
- Requirements are approved (Phase 1 gate passed)

## Dispatch Instructions

### Check for existing project-config.md first

```
Read(".claude/specs/[feature]/project-config.md")
```

### Path A — Existing config found (file exists and is non-empty)

```
Agent(
  subagent_type="project-orchestrator:project-setup",
  prompt="An existing project-config.md was found at .claude/specs/[feature]/project-config.md.
          Read it and present the key tech stack decisions to the user.
          CRITICAL: You MUST use the AskUserQuestion tool for EVERY question. NEVER output questions as plain text.
          Ask whether to: proceed with existing config, modify specific sections, or start fresh.
          One AskUserQuestion call per decision point. Wait for each response.
          User request: [ORIGINAL USER REQUEST].
          Requirements are at .claude/specs/[feature]/requirements.md — read them to ensure tech choices fit the features.
          Output to .claude/specs/[feature]/project-config.md"
)
```

### Path B — No existing config (file missing or empty)

```
Agent(
  subagent_type="project-orchestrator:project-setup",
  prompt="Interview the user about project infrastructure and tech stack for: [ORIGINAL USER REQUEST].
          Requirements are at .claude/specs/[feature]/requirements.md — READ THEM FIRST to understand what we're building before asking about tech stack.
          CRITICAL: You MUST use the AskUserQuestion tool for EVERY question — one question at a time, never as plain text.
          NEVER combine multiple questions into a single text block.
          Each question = one AskUserQuestion tool call. Wait for the user's response before asking the next question.
          Output to .claude/specs/[feature]/project-config.md"
)
```

Wait for completion. Verify `.claude/specs/[feature]/project-config.md` exists.

## Expected Outputs
- `.claude/specs/[feature]/project-config.md`

## Content Validation
- `project-config.md` is not empty
- Contains at least: `Architecture`, `Backend`, `Frontend` or `Mobile` sections
- User approved the configuration (project-setup agent handles this internally)

## Conditional Logic
- If `.claude/specs/[feature]/project-config.md` exists and is non-empty → dispatch Path A
- Otherwise → dispatch Path B (full tech stack interview)
