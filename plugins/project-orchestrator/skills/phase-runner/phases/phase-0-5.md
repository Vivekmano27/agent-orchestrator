# Phase 0.5: Brainstorming

**Executor:** project-orchestrator (YOU — no subagent needed)

## Preconditions
- `.claude/specs/[feature]/` directory exists (Phase 0)
- `progress.md` exists

## Dispatch Instructions

Classify the task size first (from the user's request), then apply brainstorming depth:

| Task Size | Brainstorming Depth |
|-----------|-------------------|
| SMALL | SKIP — proceed directly to Phase 1 |
| MEDIUM | Light brainstorm — 2-3 scope questions via AskUserQuestion |
| BIG | Full brainstorm — explore alternatives, trade-offs, and user intent. Write brainstorm.md. |

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
Conduct a structured exploration via AskUserQuestion:
- What problem does this solve? Who benefits?
- What are 2-3 alternative approaches?
- What are the key trade-offs?
- MVP or production-ready? What should we cut?

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
