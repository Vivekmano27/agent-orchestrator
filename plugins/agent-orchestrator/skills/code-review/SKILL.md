---
name: code-review
description: Perform thorough code review — logic errors, naming quality, duplication, complexity, test coverage, performance, and security. Uses a fresh context for objectivity. Use when the user says "review this code", "PR review", "code quality check", or needs a second pair of eyes on implementation.
allowed-tools: Read, Grep, Glob, Bash
---

# Code Review Skill

Structured code review covering all quality dimensions.

## Review Dimensions
1. **Correctness** — Does it do what it claims? Edge cases handled?
2. **Security** — Injection risks, auth gaps, data exposure?
3. **Performance** — N+1 queries, unnecessary re-renders, missing indexes?
4. **Readability** — Clear naming, reasonable function length, comments where needed?
5. **Testing** — Adequate coverage, edge cases tested, mocks appropriate?
6. **Architecture** — Follows project patterns, proper separation of concerns?
7. **Error handling** — Graceful failures, meaningful error messages?

## Review Output Format
```markdown
## Code Review: [PR/feature name]

### ✅ What's Good
- [Positive observations]

### 🔴 Must Fix (blocking)
- **[File:line]** — [Issue description] → [Suggested fix]

### 🟡 Should Fix (non-blocking)
- **[File:line]** — [Issue description] → [Suggested fix]

### 💡 Suggestions (optional improvements)
- [Nice-to-have improvements]

### 📊 Summary
- Files reviewed: [N]
- Issues found: [N critical, N warning, N suggestion]
- Recommendation: Approve / Request changes
```
