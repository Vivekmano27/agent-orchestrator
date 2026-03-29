# Phase 1: Planning

**Executor:** planning-team (single dispatch — manages PM, BA, UX internally)

**INVARIANT: planning-team handles all internal sequencing.** The orchestrator dispatches one agent and waits for it to return.

## Preconditions
- `.claude/specs/[feature]/` directory exists (Phase 0)
- For BIG: `.claude/specs/[feature]/brainstorm.md` exists (Phase 0.5)

## Dispatch Instructions

**Dispatch planning-team (synchronous):**
```
Agent(
  subagent_type="project-orchestrator:planning-team",
  prompt="Run Phase 1 Planning for: [ORIGINAL USER REQUEST].
          Task size: [SMALL/MEDIUM/BIG].
          Spec directory: .claude/specs/[feature]/.
          [IF BIG: brainstorm.md exists at .claude/specs/[feature]/brainstorm.md]
          NOTE: Tech stack has NOT been decided yet — it will be chosen in Phase 1.5 after requirements are done.
          Focus on WHAT to build (features, user stories, acceptance criteria), NOT how to build it.
          Do NOT ask about or assume any tech stack, framework, or infrastructure.
          Follow your protocol. Return when complete."
)
```

## Expected Outputs
- `.claude/specs/[feature]/requirements.md` (all sizes)
- `.claude/specs/[feature]/business-rules.md` (MEDIUM/BIG only)
- `.claude/specs/[feature]/ux.md` (MEDIUM/BIG only)
- `.claude/specs/[feature]/research-context.md` (MEDIUM/BIG only)
- `.claude/specs/[feature]/requirements-review.md` (MEDIUM/BIG only)
- `.claude/specs/[feature]/phase-1-summary.md` (MEDIUM/BIG only)

## Content Validation
- `requirements.md` contains at least 2 user stories with acceptance criteria
- `requirements.md` does NOT contain `## Status: INCOMPLETE`
- `business-rules.md` is not empty (MEDIUM/BIG)
- `ux.md` is not empty (MEDIUM/BIG)

If `requirements.md` fails validation → re-dispatch planning-team with resume prompt (1 retry).

## Conditional Logic
- None — always runs
