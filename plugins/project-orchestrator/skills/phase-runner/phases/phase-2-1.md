# Phase 2.1: Task Decomposition

**Executor:** task-decomposer agent (subagent)

## Preconditions
- `.claude/specs/[feature]/SUMMARY.md` exists (Phase 2)
- `.claude/specs/[feature]/architecture.md` exists (Phase 2)
- `.claude/specs/[feature]/api-spec.md` exists (Phase 2)
- `.claude/specs/[feature]/schema.md` exists (Phase 2)

## Dispatch Instructions

```
Agent(
  subagent_type="project-orchestrator:task-decomposer",
  prompt="Read all specs in .claude/specs/[feature]/: project-config.md, requirements.md, business-rules.md, architecture.md, api-spec.md, schema.md, design.md, agent-spec.md (if exists).
          Decompose into ordered, dependency-aware implementation tasks with agent assignments.
          Output to .claude/specs/[feature]/tasks.md"
)
```

Wait for completion. Verify `.claude/specs/[feature]/tasks.md` exists.

## Expected Outputs
- `.claude/specs/[feature]/tasks.md`

## Content Validation
- `tasks.md` contains at least 3 tasks (TASK-NNN format)
- Each task has: Description, Agent assignment, Files, Verification
- Tasks have dependency ordering

If validation fails → re-dispatch with: "tasks.md is incomplete. Ensure each task has TASK-NNN ID, Description, Agent, Files, and Verification."

## Approval Gate (size-dependent)
- **SMALL:** Auto-approve — no gate.
- **MEDIUM:** Merged with Phase 2 gate (single gate showing design + tasks).
- **BIG:** Separate Gate 2.1 — present task summary, options: Approve / Modify tasks / Simplify / Add detail / Go back to design / Cancel.

## Conditional Logic
- None — always runs
