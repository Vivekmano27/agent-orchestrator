---
name: phase-runner
description: "Just-in-time phase instruction loader for the project-orchestrator. Reads focused ~40-line phase files instead of holding the entire 1094-line prompt in active attention. Each phase file contains preconditions, expected outputs, content validation, dispatch instructions, and conditional logic."
---

# Phase Runner — Just-in-Time Phase Instructions

## How to Use

For each phase in the pipeline, read the corresponding phase file before executing:

```
Read("${CLAUDE_PLUGIN_ROOT}/skills/phase-runner/phases/phase-{N}.md")
```

Phase files are named: `phase-0.md`, `phase-0-5.md`, `phase-0-75.md`, `phase-1.md`, `phase-2.md`, `phase-2-1.md`, `phase-2-5.md`, `phase-3.md`, `phase-4.md`, `phase-5.md`, `phase-6.md`, `phase-7.md`, `phase-8.md`

## Execution Loop

For EACH phase in order [0, 0.5, 0.75, 1, 2, 2.1, 2.5, 3, 4, 5, 6, 7, 8]:

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
| 0.5 | phase-0-5.md | Project setup (tech stack interview) |
| 0.75 | phase-0-75.md | Brainstorming |
| 1 | phase-1.md | Planning (via planning-team) |
| 2 | phase-2.md | Design via design-team |
| 2.1 | phase-2-1.md | Task decomposition |
| 2.5 | phase-2-5.md | Git setup |
| 3 | phase-3.md | Build via feature-team |
| 4 | phase-4.md | Testing via quality-team |
| 5 | phase-5.md | Security audit |
| 6 | phase-6.md | Code review via review-team |
| 7 | phase-7.md | DevOps & deployment |
| 8 | phase-8.md | Documentation |
