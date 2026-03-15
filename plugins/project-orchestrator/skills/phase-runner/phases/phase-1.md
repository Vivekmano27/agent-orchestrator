# Phase 1: Planning

**Executor:** product-manager (sync) → business-analyst + ux-researcher (parallel)

**INVARIANT: product-manager MUST complete before BA and UX start.** BA and UX read requirements.md, which PM writes.

## Preconditions
- `.claude/specs/[feature]/project-config.md` exists (Phase 0.5)
- For BIG: `.claude/specs/[feature]/brainstorm.md` exists (Phase 0.75)

## Dispatch Instructions

**1a. Spawn product-manager FIRST (synchronous):**
```
Agent(
  subagent_type="project-orchestrator:product-manager",
  prompt="Write a complete PRD for: [ORIGINAL USER REQUEST].
          Task size: [SMALL/MEDIUM/BIG].
          Tech stack and infrastructure are already decided — see .claude/specs/[feature]/project-config.md.
          [IF BIG: Also read .claude/specs/[feature]/brainstorm.md for scope decisions.]
          Focus on WHAT to build (features, user stories, acceptance criteria).
          Do NOT ask about tech stack, auth strategy, CI/CD, or infrastructure — those are in project-config.md.
          Run your adaptive requirements discovery, then output to .claude/specs/[feature]/requirements.md"
)
```

**1a-resume.** If PM output is incomplete (check for `## Status: INCOMPLETE`), re-spawn with resume prompt.

**1b. Spawn business-analyst + ux-researcher IN PARALLEL:**
```
Agent(
  subagent_type="project-orchestrator:business-analyst",
  run_in_background=True,
  prompt="Read the PRD at .claude/specs/[feature]/requirements.md. Deepen business logic — do NOT re-ask product questions the PM already covered. Ask only about workflow/approval gaps. Output to .claude/specs/[feature]/business-rules.md"
)

Agent(
  subagent_type="project-orchestrator:ux-researcher",
  run_in_background=True,
  prompt="Read the PRD at .claude/specs/[feature]/requirements.md. Ask only about design system, accessibility level, and visual style (skip if PM already captured design direction). Output to .claude/specs/[feature]/ux.md"
)
```

**1c.** Wait for both to complete.

## Expected Outputs
- `.claude/specs/[feature]/requirements.md`
- `.claude/specs/[feature]/business-rules.md`
- `.claude/specs/[feature]/ux.md`

## Content Validation
- `requirements.md` contains at least 2 user stories with acceptance criteria
- `requirements.md` does NOT contain `## Status: INCOMPLETE`
- `business-rules.md` is not empty
- `ux.md` is not empty

If `requirements.md` fails validation → re-dispatch PM with resume prompt (1 retry).

## Conditional Logic
- None — always runs
