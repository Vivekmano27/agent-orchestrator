# Phase 8: Documentation

**Executor:** technical-writer agent (single agent)

## Preconditions
- Implementation complete (Phase 3)
- Testing complete (Phase 4)
- For MEDIUM/BIG: review-report.md exists (Phase 6)

## Dispatch Instructions

```
Agent(
  subagent_type="project-orchestrator:technical-writer",
  prompt="Generate README, API docs, architecture docs, changelog, and deployment runbook for [feature]. All specs are in .claude/specs/[feature]/.
          IMPORTANT: Read deploy-monitoring.md and deployment-plan.md (if they exist) and use them as source material for docs/DEPLOYMENT.md."
)
```

Wait for completion.

## Expected Outputs
- `README.md` exists
- For MEDIUM/BIG: at least 2 of 3 exist: `docs/API.md`, `docs/DEPLOYMENT.md`, `CHANGELOG.md`

## Content Validation
- `README.md` is not empty and contains at least installation/usage sections
- For MEDIUM/BIG: spot-check that at least 2 of the 3 doc files exist

## Conditional Logic
- None — always runs
