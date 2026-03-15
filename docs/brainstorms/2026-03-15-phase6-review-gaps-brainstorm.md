# Brainstorm: Phase 6 Review Pipeline Gaps

**Date:** 2026-03-15
**Status:** Ready for implementation

## What We're Building

Close 8 gaps in the Phase 6 (Review) pipeline to bring it to the same reliability standard as Phases 4 and 5. Phase 6 currently runs 6 reviewers but lacks formal feedback routing, output file persistence, failure detection, and has several stale references.

## Why This Matters

Phase 4→3 and Phase 5→3 both have detailed multi-step feedback loop protocols. Phase 6 has only a one-liner ("route back to owning agent"). This means CRITICAL review findings have no defined path to resolution — the orchestrator doesn't know how to structure the fix request, which agent to dispatch, how to scope re-review, or when to stop retrying. Additionally, the combined report has no output file path, so it's ephemeral and can't be verified by the orchestrator's failure detection system.

## Key Decisions

1. **Phase 6→3 feedback loop follows the Phase 5→3 pattern** — max 1 round-trip (review findings are typically simpler than security vulnerabilities), structured finding list with stable IDs (REV-NNN), route through feature-team (not individual agents), scoped re-review after fix (only code-reviewer + performance-reviewer on changed files; skip static-analyzer, spec-tracer, agent-native-reviewer).

2. **Combined report writes to `review-report.md`** — consistent with `test-report.md` (Phase 4) and `security-audit.md` (Phase 5). Added to subagent failure verification.

3. **Spec-tracer output goes to `spec-traceability.md`** — avoids collision with `code-review.md` that the normal code-reviewer writes.

4. **SMALL tasks: auto-fix then notify** — when Phase 6 finds CRITICAL issues on SMALL tasks, auto-trigger the Phase 6→3 feedback loop (1 round-trip). If fix succeeds, proceed silently. If fix fails, escalate to user. No gate for clean reviews (keeps SMALL tasks autonomous).

5. **Agent Teams mode: all 6 reviewers participate** — expand the experimental teams section to include all reviewers in the peer-debate pattern.

## Changes Required

### Gap 1: Phase 6→3 Feedback Loop (project-orchestrator.md)
Add a formal "Phase 6→3 Feedback Loop" section after Phase 6 dispatch, modeled on Phase 5→3:
- Step 1: Read review-team's combined report from `review-report.md`, extract CRITICAL/HIGH findings
- Step 2: Re-dispatch feature-team with structured finding list (REV-NNN IDs, file:line, description, reviewer source)
- Step 3: Scoped re-review — only code-reviewer + performance-reviewer on changed files (skip static-analyzer, spec-tracer, agent-native-reviewer)
- Max 1 round-trip, then escalate to user
- Stuck/regression detection (same pattern as Phase 4→3)
- SMALL tasks: auto-trigger this loop when CRITICAL found; if fix succeeds proceed silently, if fails escalate to user

### Gap 2: Output File Path (review-team.md)
- Add instruction: write combined report to `.claude/specs/[feature]/review-report.md`
- Update STEP 3 template to include the file write instruction

### Gap 3: Subagent Failure Detection (project-orchestrator.md)
- Add Phase 6 to the failure verification table
- Expected file: `.claude/specs/[feature]/review-report.md`

### Gap 4: check-agents.md Member Count
- Fix review-team member list to include static-analyzer
- Correct count to reflect actual composition (6 dispatches, 5 unique agents + spec-tracer reuse)

### Gap 5: Orchestrator Example Walkthrough (project-orchestrator.md)
- Update the example to show all Phase 6 reviewers that actually run

### Gap 6: Agent Teams Mode (review-team.md)
- Expand the Agent Teams section to include all 6 reviewers in the peer-debate pattern
- All reviewers participate: code-reviewer, security-auditor, performance-reviewer, static-analyzer, agent-native-reviewer, spec-tracer

### Gap 7: Spec-tracer File Collision (review-team.md)
- Override spec-tracer prompt to write output to `.claude/specs/[feature]/spec-traceability.md`

### Gap 8: SMALL Task Gate (project-orchestrator.md)
- Add a conditional gate after Phase 6 for SMALL tasks: only triggers if CRITICAL findings exist
- If no CRITICAL findings, proceed silently (keeps SMALL tasks autonomous)

## Open Questions

None — all decisions resolved.
