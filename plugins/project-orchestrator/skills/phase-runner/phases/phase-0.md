# Phase 0: Spec Setup

**Executor:** project-orchestrator (YOU — no subagent needed)

## Preconditions
- User request received
- No prior files required

## Dispatch Instructions

0a. Create the spec directory:
```bash
mkdir -p .claude/specs/[feature-name]
```

0b. Create initial `progress.md` with Phase 0 complete and Phase 0.5 as next.

## Expected Outputs
- `.claude/specs/[feature-name]/` directory exists
- `.claude/specs/[feature-name]/progress.md` exists

## Content Validation
- `progress.md` contains `Phase: 0` and `Status: COMPLETE`

## Conditional Logic
- None — always runs
