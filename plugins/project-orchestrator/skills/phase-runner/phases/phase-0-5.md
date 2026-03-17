# Phase 0.5: Project Setup

**Executor:** project-setup agent (subagent)

## Preconditions
- `.claude/specs/[feature]/` directory exists (Phase 0)
- `progress.md` exists

## Dispatch Instructions

### Check for existing project-config.md first

Before dispatching the project-setup agent, check if a config already exists:

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
          Follow your Step 0 instructions exactly — one AskUserQuestion call per decision point.
          User request: [ORIGINAL USER REQUEST].
          Output to .claude/specs/[feature]/project-config.md"
)
```

### Path B — No existing config (file missing or empty)

```
Agent(
  subagent_type="project-orchestrator:project-setup",
  prompt="Interview the user about project infrastructure and tech stack decisions for: [ORIGINAL USER REQUEST].
          CRITICAL: You MUST use the AskUserQuestion tool for EVERY question — one question at a time, never as plain text.
          NEVER combine multiple questions into a single text block. NEVER output tables with all decisions at once.
          Follow your Step 1 instructions exactly: Q1 (app type) → Q2 (scale) → Q3 (preset or custom).
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
- If `.claude/specs/[feature]/project-config.md` exists and is non-empty → dispatch Path A (confirm/modify existing config)
- Otherwise → dispatch Path B (full tech stack interview)
