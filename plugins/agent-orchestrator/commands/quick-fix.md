---
description: "Quick autonomous bug fix — the ONLY command that does NOT run the full pipeline. Uses minimal agents for speed: finds bug, fixes it, writes regression test, commits. No approval needed."
argument-hint: "<error message or bug description>"
disable-model-invocation: true
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
This is the ONE exception to the full pipeline rule. For small bug fixes (1-3 files), we skip the full pipeline for speed.

## Agents Used (minimal for speed)
1. senior-engineer OR backend-developer → find and fix the bug
2. test-engineer → write regression test
3. code-reviewer → quick review

## Steps (fully autonomous)
1. Analyze the error/description
2. Search codebase for relevant files
3. Identify root cause
4. Implement fix following project patterns
5. Write regression test
6. Run tests to verify fix
7. Quick code review
8. Commit: `fix(scope): description`
9. Report what was fixed

## Rules
- ONLY for bugs (not new features — use /build-feature for those)
- ONLY if fix is 1-3 files
- If fix requires > 3 files → escalate to /build-feature (full pipeline)
- ALWAYS write a regression test
