---
name: phase-runner
description: "Just-in-time phase instruction loader for the project-orchestrator pipeline. Reads focused ~40-line phase files instead of holding the entire prompt in active attention. Use when running the build pipeline, executing phases, dispatching agents per phase, resuming a stalled pipeline, or when the orchestrator says 'run phase', 'execute pipeline', 'next phase', 'phase transition'. Each phase file contains preconditions, expected outputs, content validation, dispatch instructions, and conditional logic."
---

# Phase Runner — Just-in-Time Phase Instructions

## How to Use

For each phase in the pipeline, read the corresponding phase file before executing:

```
Read("${CLAUDE_PLUGIN_ROOT}/skills/phase-runner/phases/phase-{N}.md")
```

Phase files are named: `phase-0.md`, `phase-0-5.md`, `phase-1.md`, `phase-1-5.md`, `phase-2.md`, `phase-2-05.md`, `phase-2-1.md`, `phase-2-5.md`, `phase-2-75.md`, `phase-3.md`, `phase-4.md`, `phase-5.md`, `phase-6.md`, `phase-7.md`, `phase-8.md`, `phase-9.md`

## Execution Loop

For EACH phase in order [0, 0.5, 1, 1.5, 2, 2.05, 2.1, 2.5, 2.75, 3, 4, 5, 6, 7, 8, 9]:

1. **Read** the phase file: `Read("${CLAUDE_PLUGIN_ROOT}/skills/phase-runner/phases/phase-{N}.md")`
2. **Check preconditions** — verify required files exist
3. **Check conditional logic** — skip if project-config.md says N/A
4. **Execute** — dispatch agents per instructions
5. **Validate outputs** — check files exist AND pass content validation
6. **Update progress.md** — mark phase COMPLETE, set next phase pointer
7. **Phase transition gate** — `AskUserQuestion` (MANDATORY for all sizes)
8. **Approval gate** — if applicable for task size (see orchestrator gate definitions)

If content validation fails, re-dispatch the responsible agent with a retry prompt (1 retry max).

## Phase File Map

| Phase | File | Description |
|-------|------|-------------|
| 0 | phase-0.md | Spec directory setup |
| 0.5 | phase-0-5.md | Brainstorming |
| 1 | phase-1.md | Planning (via planning-team) |
| 1.5 | phase-1-5.md | Tech stack interview (after requirements) |
| 2 | phase-2.md | Design via design-team |
| 2.05 | phase-2-05.md | Spec reconciliation (mandatory) |
| 2.1 | phase-2-1.md | Task decomposition |
| 2.5 | phase-2-5.md | Git setup |
| 2.75 | phase-2-75.md | Prototype (clickable UI with dummy data) |
| 3 | phase-3.md | Build via feature-team |
| 4 | phase-4.md | Testing via quality-team |
| 5 | phase-5.md | Security audit |
| 6 | phase-6.md | Code review via review-team |
| 7 | phase-7.md | DevOps & deployment |
| 8 | phase-8.md | Documentation |
| 9 | phase-9.md | Post-deploy verification |

## Anti-Patterns

- **Skipping precondition checks** — executing a phase without verifying required input files exist; causes cascading failures downstream
- **Not updating progress.md** — running a phase without marking it complete; the orchestrator loses track of pipeline state
- **Skipping phase transition gates** — advancing without the mandatory AskUserQuestion gate; users lose visibility
- **Retrying infinitely** — retrying a failed phase more than once; after 1 retry, escalate to the user
- **Running phases out of order** — jumping to Phase 3 without Phase 2 outputs
- **Not reading the phase file** — executing from memory instead of reading the current phase file; files evolve

## Checklist

- [ ] Phase file read from `${CLAUDE_PLUGIN_ROOT}/skills/phase-runner/phases/`
- [ ] Preconditions checked (required input files exist)
- [ ] Conditional logic evaluated (skip if project-config.md says N/A)
- [ ] Agents dispatched per phase instructions
- [ ] Output files validated (exist AND pass content checks)
- [ ] progress.md updated with phase status
- [ ] Phase transition gate executed (AskUserQuestion)
- [ ] Approval gate executed if required for task size
