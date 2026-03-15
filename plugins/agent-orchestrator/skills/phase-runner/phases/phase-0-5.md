# Phase 0.5: Project Setup

**Executor:** project-setup agent (subagent)

## Preconditions
- `.claude/specs/[feature]/` directory exists (Phase 0)
- `progress.md` exists

## Dispatch Instructions

```
Agent(
  subagent_type="agent-orchestrator:project-setup",
  prompt="Interview the user about project infrastructure and tech stack decisions for: [ORIGINAL USER REQUEST].
          Offer presets or custom configuration.
          Cover: architecture, backend, frontend, mobile, database, auth, CI/CD, testing, code quality, cloud, naming conventions.
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
- None — always runs
