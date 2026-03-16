---
description: "Generate a DIGEST.md summary of the current session — key decisions, files modified, current state, pending items. Enables quick re-contextualization in future sessions."
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Create a DIGEST.md file that captures the current session state for future re-contextualization.

## Content to Include
1. **Session Date & Branch**: current date, git branch
2. **What Was Accomplished**: list of completed tasks/features
3. **Files Modified**: git diff --name-only against main
4. **Key Decisions Made**: any architecture or design decisions
5. **Current State**: what's working, what's in progress
6. **Pending Items**: unfinished tasks, known issues, TODOs
7. **Context for Next Session**: what the next developer (you, tomorrow) needs to know

## Output: Write to DIGEST.md in project root
```markdown
# Session Digest — [DATE]

## Branch: [branch-name]

## Accomplished
- [What was built/fixed/improved]

## Files Changed ([N] files)
- [list of modified files grouped by service]

## Decisions
- [Any architectural or design decisions made]

## Current State
- [What's working]
- [What's partially done]

## Pending
- [ ] [Task/issue that needs attention]
- [ ] [Known bug or TODO]

## Context for Next Session
[What you need to know to continue effectively]
```
