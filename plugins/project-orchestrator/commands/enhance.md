---
description: "Add a feature to an existing, already-deployed app using a lightweight pipeline. Skips setup/brainstorming phases — reads existing project-config.md and codebase patterns directly. For small-to-medium enhancements that don't need the full 9-phase pipeline."
argument-hint: "<feature description>"
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.

## Mission

A streamlined pipeline for adding features to existing, already-configured projects. Skips Phases 0, 0.5, and 0.75 (spec setup, tech stack interview, brainstorming) because the project already exists with a known tech stack. Faster than `/new` or `/build-feature`, but more structured than `/quick-fix`.

## When to Use `/enhance` vs Other Commands

| Scenario | Command |
|----------|---------|
| Brand new project or first feature | `/new` or `/build-feature` |
| Adding a feature to existing project (no project-config.md) | `/build-feature` |
| Adding a feature to existing project (project-config.md exists) | **`/enhance`** |
| Small bug fix (1-3 files, root cause known) | `/quick-fix` |
| Bug investigation (root cause unknown) | `/debug` |
| Adding a feature mid-pipeline | `/add-feature` |

## Preconditions

The project MUST have an existing `.claude/specs/*/project-config.md`. If not found:
```
"No project-config.md found. This project hasn't been set up yet.
Use /build-feature instead (it includes the setup interview)."
```

## Steps

### STEP 1 — Read existing context (parallel reads)

```bash
# Find the most recent project-config.md
Glob(".claude/specs/*/project-config.md")

# Scan existing codebase patterns
Grep("@Controller|@ApiTags|router\\.get|app\\.route", output_mode="files_with_matches")
Glob("**/prisma/schema.prisma")
Glob("**/models.py")
Glob("**/components/**/*.tsx")
```

Read:
- `project-config.md` — tech stack, architecture, conventions
- Existing code patterns — how routes, models, and components are structured
- Existing tests — what test framework and patterns are used

### STEP 2 — Lightweight requirements (1-3 questions max)

```
AskUserQuestion(
  question="I'll enhance the existing project. Quick questions about: $ARGUMENTS

  1. What's the user-facing behavior? (what should the user see/do?)
  2. Any constraints I should know about?",
  options=[
    "Let me describe in detail",
    "Just do it — the description is sufficient",
    "I want to add multiple things — let me list them"
  ]
)
```

If "Just do it": proceed with the feature description as-is.
If "Let me describe": accept free-text response, then proceed.

### STEP 3 — Quick design (inline, no separate agents)

Based on the feature description and existing codebase patterns, create a lightweight spec:

Write `.claude/specs/[feature]/enhance-spec.md`:
```markdown
# Enhancement: [feature name]

## Changes Required
- **Backend:** [new endpoints / modified endpoints / none]
- **Frontend:** [new components / modified components / none]
- **Database:** [new tables / new columns / migrations / none]
- **Tests:** [what to test]

## Files to Create/Modify
1. [file path] — [what changes]
2. [file path] — [what changes]

## Approach
[1-2 sentences on implementation strategy, following existing patterns]
```

Present for quick approval:
```
AskUserQuestion(
  question="Here's my plan for [feature]:
  [summary from enhance-spec.md]
  [N] files to modify/create.

  Proceed?",
  options=["Yes, build it", "Modify the plan", "Cancel"]
)
```

### STEP 4 — Build (dispatch appropriate agents)

Based on what's needed, dispatch the minimum agents:

**Backend only:**
```
Agent(
  subagent_type="project-orchestrator:backend-developer",
  prompt="Implement [feature] following existing patterns. Spec at .claude/specs/[feature]/enhance-spec.md.
          Read project-config.md for tech stack. Follow TDD. Commit after each logical unit."
)
```

**Frontend only:**
```
Agent(
  subagent_type="project-orchestrator:frontend-developer",
  prompt="Implement [feature] UI following existing patterns. Spec at .claude/specs/[feature]/enhance-spec.md.
          Read project-config.md for tech stack. Match existing component style."
)
```

**Both:** Backend first, then frontend (same as feature-team wave ordering).

### STEP 5 — Test + Review (lightweight)

Dispatch test-engineer for the changed files only:
```
Agent(
  subagent_type="project-orchestrator:test-engineer",
  prompt="Write unit + integration tests for [feature]. Changed files: [list].
          Focus on: happy path, key edge cases, regression coverage. Target 80% coverage on changed files."
)
```

Quick code review:
```
Agent(
  subagent_type="project-orchestrator:code-reviewer",
  prompt="Review changes for [feature]. Files: [list]. Quick review — correctness, patterns, security basics."
)
```

### STEP 6 — Report

```
AskUserQuestion(
  question="Enhancement complete:
  - Feature: [description]
  - Files changed: [count]
  - Tests: [pass count] passing, [coverage]% coverage
  - Review: [summary]

  What next?",
  options=[
    "Commit and done",
    "Show me the diff",
    "Run the full test suite",
    "Something's not right — let me explain"
  ]
)
```

## Rules
- NEVER run the full 9-phase pipeline — that's what `/build-feature` is for
- NEVER re-interview for tech stack — read existing project-config.md
- If the enhancement turns out to be > 10 files, suggest switching to `/build-feature`
- If no project-config.md exists, redirect to `/build-feature`
- Commit message format: `feat(scope): description`
