# Phase 4: Testing — via quality-team

**Executor:** quality-team agent (manages test-engineer + qa-automation)

## Preconditions
- `.claude/specs/[feature]/api-contracts.md` exists (Phase 3)
- Phase 3 build report received
- Implementation code exists (verified in Phase 3 validation)

## Dispatch Instructions

```
Agent(
  subagent_type="project-orchestrator:quality-team",
  prompt="Run Phase 4 Testing for [feature].
  Task size: [SMALL/MEDIUM/BIG].
  Spec directory: .claude/specs/[feature]/
  Implementation report: [summary from Phase 3 feature-team].
  Files changed: [list].
  Coverage thresholds: Read from .claude/specs/[feature]/project-config.md.

  Steps:
  1. Create test-plan.md (skip on re-runs)
  2. Present Gate 3.5 for user approval (skip on re-runs)
  3. Dispatch test-engineer + qa-automation per plan
  4. Collect results, write test-report.md
  5. If failures: classify and route (test bugs internally, impl bugs report back)

  Return: test-report.md summary, overall status, impl bug list (if any)."
)
```

Wait for quality-team to complete. Read its report.

## Expected Outputs
- `.claude/specs/[feature]/test-plan.md`
- `.claude/specs/[feature]/test-report.md`

## Content Validation
- `test-plan.md` contains scope assignments for test-engineer and qa-automation
- `test-report.md` contains a Summary table with pass/fail counts
- `test-report.md` Overall Status is present

If impl bugs found → trigger Phase 4→3 Feedback Loop (see orchestrator).

## Conditional Logic
- qa-automation skipped for SMALL tasks
- qa-automation skipped if no frontend AND no mobile in project-config.md
