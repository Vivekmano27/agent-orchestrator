# Phase 6: Code Review — via review-team

**Executor:** review-team agent (manages parallel reviewers)

## Preconditions
- `.claude/specs/[feature]/security-audit.md` exists (Phase 5), OR Phase 5 was PARTIAL
- Implementation code exists (Phase 3)

## Dispatch Instructions

Read project-config.md to determine conditional reviewers:
- If NO agent-native features (no `.claude/agents/` directory) → skip agent-native-reviewer

```
Agent(
  subagent_type="project-orchestrator:review-team",
  prompt="Review all code changes for [feature]. Files changed: [list].
          Write combined severity-organized report (Critical/High/Medium/Low) to .claude/specs/[feature]/review-report.md.
          [IF no agent-native features]: Skip agent-native-reviewer — no agent artifacts to review.
          [IF SMALL task]: Skip spec-tracer."
)
```

Wait for review-team to complete. Read report.

## Expected Outputs
- `.claude/specs/[feature]/review-report.md`

## Content Validation
- `review-report.md` exists and contains a recommendation (APPROVE / APPROVE WITH CONDITIONS / REQUEST CHANGES / BLOCK)
- Contains severity-organized findings section (may be empty if clean)

## Recommendation Handling
- **APPROVE** → proceed to Phase 7
- **APPROVE WITH CONDITIONS** → proceed to Phase 7 (conditions logged)
- **REQUEST CHANGES (CRITICAL/HIGH found)** → trigger Phase 6→3 Feedback Loop
- **BLOCK** → escalate to user immediately

## Phase 6→3 Feedback Loop
1. Read finding list from review-report.md
2. Re-dispatch feature-team with targeted fix prompt
3. Scoped re-review (code-reviewer + performance-reviewer only)
4. Regression detection → CLEAN/PARTIAL/REGRESSION/STUCK
5. Max 1 round-trip; escalate if unresolved

## Conditional Logic
- Skip agent-native-reviewer if no agent-native features
- Skip spec-tracer for SMALL tasks
