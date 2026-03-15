# Phase 5: Security Audit

**Executor:** security-auditor agent (single agent)

## Preconditions
- `.claude/specs/[feature]/test-report.md` exists (Phase 4), OR testing was skipped
- Phase 4 completed or skipped

## Dispatch Instructions

```
Agent(
  subagent_type="agent-orchestrator:security-auditor",
  prompt="Run Phase 5 Security Audit for [feature].
  Task size: [SMALL/MEDIUM/BIG].
  Spec directory: .claude/specs/[feature]/
  Files changed: [Phase 3 files + Phase 4→3 fix files — complete list].
  Tech stack and compliance: Read from project-config.md.

  Run full execution protocol (STEPs 1-4).
  Write security-audit.md to spec directory.
  Return: status (COMPLETE/STOPPED/FAILED/PARTIAL), severity summary,
  CRITICAL/HIGH finding list (if any) for Phase 5→3 routing."
)
```

Wait for completion. Read its report.

## Expected Outputs
- `.claude/specs/[feature]/security-audit.md`

## Content Validation
- `security-audit.md` exists and contains a status (COMPLETE/STOPPED/FAILED/PARTIAL)
- Contains severity summary section

## Status Handling
- **COMPLETE** → if CRITICAL/HIGH > 0 → trigger Phase 5→3 Feedback Loop
- **STOPPED** → present STOP handler to user (actively exploitable vulnerability)
- **FAILED** → retry once. If still failing, present as infrastructure issue.
- **PARTIAL** → proceed (skips were intentional per task size)

## Conditional Logic
- Always runs (verification phase)
