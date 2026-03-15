# Phase 0.75: Brainstorming

**Executor:** project-orchestrator (uses brainstorming skill)

## Preconditions
- `.claude/specs/[feature]/project-config.md` exists (Phase 0.5)

## Dispatch Instructions

Read project-config.md for task_size, then apply brainstorming depth:

| Task Size | Brainstorming Depth |
|-----------|-------------------|
| SMALL | SKIP — proceed directly to Phase 1 |
| MEDIUM | Light brainstorm — 2-3 questions to clarify scope and approach. Use AskUserQuestion. |
| BIG | Full brainstorm — explore alternatives, trade-offs, and user intent before committing to a direction. Use the brainstorming skill if available. Write findings to `.claude/specs/[feature]/brainstorm.md`. |

**For MEDIUM:**
```
AskUserQuestion(
  question="Before we plan [feature], a few quick questions:
  1. [Most impactful scope question based on the request]
  2. [Key trade-off or preference question]",
  options=["Answer inline", "Skip — use your best judgment", "Let's do a full brainstorm"]
)
```

**For BIG:**
Invoke the brainstorming skill or conduct a structured exploration:
- What problem does this solve? Who benefits?
- What are 2-3 alternative approaches?
- What are the key trade-offs?
- What's the MVP vs full vision?

Write findings to `.claude/specs/[feature]/brainstorm.md`.

## Expected Outputs
- SMALL: None (phase skipped)
- MEDIUM: Clarified scope (captured in conversation context)
- BIG: `.claude/specs/[feature]/brainstorm.md`

## Content Validation
- SMALL: N/A
- MEDIUM: User answered or explicitly skipped
- BIG: `brainstorm.md` contains at least 3 sections (problem, approaches, trade-offs)

## Conditional Logic
- SMALL tasks: skip entirely
