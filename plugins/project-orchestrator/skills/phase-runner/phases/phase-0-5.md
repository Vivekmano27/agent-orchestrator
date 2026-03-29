# Phase 0.5: Brainstorming

**Executor:** project-orchestrator (YOU — no subagent needed)

## Preconditions
- `.claude/specs/[feature]/` directory exists (Phase 0)
- `progress.md` exists

## MANDATORY RULES
1. **Use the AskUserQuestion TOOL for every question.** Do NOT write questions as plain text or markdown. Every question = one AskUserQuestion tool call.
2. **Do NOT ask about tech stack, frameworks, deployment, cloud, CI/CD, or infrastructure.** Those are Phase 1.5 questions. This phase is ONLY about WHAT to build, not HOW.
3. **Max 2-3 questions** for MEDIUM. Max 4 questions for BIG. Do NOT dump 6+ questions at once.

## Dispatch Instructions

Classify the task size first (from the user's request), then apply brainstorming depth:

| Task Size | Brainstorming Depth |
|-----------|-------------------|
| SMALL | SKIP — proceed directly to Phase 1 |
| MEDIUM | Light brainstorm — 2-3 scope questions via AskUserQuestion |
| BIG | Full brainstorm — explore scope, alternatives, trade-offs via AskUserQuestion. Write brainstorm.md. |

**For MEDIUM — use AskUserQuestion tool (NOT plain text):**

Call the AskUserQuestion tool with:
- question: "Before we plan [feature], a couple of scope questions: [most impactful scope question]"
- options: 2-4 concrete choices for the user to pick from

Example topics to ask about (pick 2-3 most relevant):
- MVP vs full system?
- Which user roles matter most?
- What's the most critical feature?
- Any existing system to integrate with?

**NEVER ask about:** frameworks, databases, cloud providers, deployment, CI/CD, auth libraries, Docker — all of that is Phase 1.5.

**For BIG — use AskUserQuestion tool for EACH question (one at a time):**

Ask these via separate AskUserQuestion calls (not all at once as plain text):

1. Call AskUserQuestion: "What problem does this solve? Who benefits most?"
2. Call AskUserQuestion: "MVP first or production-ready? What should we cut for v1?"
3. Call AskUserQuestion: "Any constraints I should know about? (timeline, budget, existing systems)"
4. Call AskUserQuestion: "What does success look like? How will you know this works?"

After answers, write findings to `.claude/specs/[feature]/brainstorm.md`.

## Expected Outputs
- SMALL: None (phase skipped)
- MEDIUM: Clarified scope (captured in conversation context)
- BIG: `.claude/specs/[feature]/brainstorm.md`

## Content Validation
- SMALL: N/A
- MEDIUM: User answered at least one AskUserQuestion (not skipped)
- BIG: `brainstorm.md` contains at least 3 sections (problem, scope, constraints)

## Conditional Logic
- SMALL tasks: skip entirely
