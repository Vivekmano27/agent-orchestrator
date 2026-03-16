---
name: code-review
description: Perform thorough code review — logic errors, naming quality, duplication, complexity, test coverage, performance, and security. Uses a fresh context for objectivity. Use when the user says "review this code", "PR review", "code quality check", or needs a second pair of eyes on implementation.
allowed-tools: Read, Grep, Glob, Bash
---

# Code Review Skill

## Pre-Review Setup

1. Read `.claude/specs/[feature]/security-audit.md` if it exists — incorporate any flagged concerns into this review.
2. Determine task size from the orchestrator context (SMALL / MEDIUM / BIG). This controls review scope below.
3. Collect the file list to review via `git diff --name-only` against the base branch.

## Review Scope by Task Size

| Task Size | Dimensions to Cover | Depth |
|-----------|---------------------|-------|
| SMALL (1-3 files) | Correctness, Error handling | Line-level only — skip architecture commentary |
| MEDIUM (4-10 files) | Correctness, Error handling, Security, Performance, Testing | File-level patterns, flag cross-file inconsistencies |
| BIG (10+ files) | ALL dimensions below | Full architecture review, dependency analysis, API surface audit |

## Review Dimensions

1. **Correctness** — Does it do what it claims? Off-by-one errors, null/undefined paths, race conditions, unhandled promise rejections.
2. **Security** — Run the security grep patterns below. Check every finding.
3. **Performance** — N+1 queries, unnecessary re-renders, missing DB indexes, unbounded list fetches, synchronous I/O in hot paths.
4. **Readability** — Functions over 40 lines get flagged. Single-letter variables outside loop counters get flagged. Boolean parameters without named options get flagged.
5. **Testing** — Missing edge case coverage, mocks that hide real bugs (e.g., mocking the function under test), snapshot tests without assertion on key fields.
6. **Architecture** — (BIG only) Follows project patterns from `project-config.md`, proper separation of concerns, no cross-boundary imports.
7. **Error Handling** — Catch blocks must do something (log, rethrow, return error response). Empty catch = automatic Critical.
8. **Documentation** — Public APIs missing doc comments, stale TODO/FIXME without ticket refs, commented-out code blocks.

## Security Grep Patterns

Run these against the changed files using `grep` or the Grep tool. Every match requires manual verdict (false positive or real issue):

**What to search for:**

| # | Category | Search Pattern (regex) | Exclude Patterns |
|---|----------|----------------------|-----------------|
| 1 | SQL injection | `query\s*\(` in .ts/.js files | Lines containing `parameterized`, `placeholder`, `$1`, `?` |
| 2 | Command injection | `execSync\|spawnSync\|child_process` in .ts/.js files | — |
| 3 | Path traversal | `readFile\|writeFile\|createReadStream` in .ts/.js files | Lines containing `__dirname`, `path.join`, `path.resolve` |
| 4 | Auth bypass | `router\.(get\|post\|put\|delete\|patch)` in .ts/.js files | Lines containing `auth`, `protect`, `guard`, `middleware` |
| 5 | Hardcoded secrets | `password\s*=\s*["']\|api_key\s*=\s*["']` in .ts/.js/.py files | — |
| 6 | Open redirect | `redirect\(\|location\s*=` in .ts/.js files | Lines containing `safeRedirect`, `allowedHosts` |
| 7 | Dynamic code execution | Search for uses of dynamic code evaluation functions that execute arbitrary strings | — |
| 8 | Missing rate limiting | `login\|signup\|register\|reset-password` in .ts/.js files | Lines containing `rateLimit`, `throttle` |

## Constraint: No Praise Without Substance

Do NOT list generic positives like "good code structure" or "nice naming." Every positive observation must cite a specific pattern and why it matters (e.g., "Input validation on line 42 of `auth.ts` prevents the email injection vector from #789").

## Output Format

Write findings to `.claude/specs/[feature]/code-review.md` using this exact structure:

```markdown
## Code Review: [PR/feature name]
**Reviewer:** code-review skill | **Date:** [ISO date] | **Scope:** [SMALL|MEDIUM|BIG]
**Base branch:** [branch] | **Files reviewed:** [N]

### Severity Table

| # | Severity | File:Line | Issue | Fix |
|---|----------|-----------|-------|-----|
| 1 | CRITICAL | `src/auth.ts:45` | Raw SQL interpolation with user input | Use parameterized query: `db.query('SELECT * FROM users WHERE id = $1', [userId])` |
| 2 | HIGH | `src/api/orders.ts:112` | Empty catch block swallows database errors | Rethrow as `ServiceError` or log with correlation ID and return 500 |
| 3 | MEDIUM | `src/utils/format.ts:23` | Function is 87 lines with 4 levels of nesting | Extract validation into `validateInput()` and formatting into `applyFormat()` |
| 4 | LOW | `src/components/Table.tsx:5` | Unused import `useState` | Remove import |

### Severity Definitions
- **CRITICAL** — Security vulnerability, data loss risk, or crash in production. Blocks merge.
- **HIGH** — Incorrect behavior, missing error handling, or failing edge case. Blocks merge.
- **MEDIUM** — Code smell, maintainability concern, or missing test. Should fix before merge.
- **LOW** — Style nit, minor improvement. Fix at author's discretion.

### Security Findings
| Pattern | Files Matched | Verdict |
|---------|--------------|---------|
| SQL injection | `src/auth.ts` | REAL — line 45 uses string interpolation |
| Command injection | — | No matches |
| Auth bypass | `src/api/public.ts` | FALSE POSITIVE — intentionally public endpoint |

### Notable Positives
- [Specific positive with file reference and why it matters]

### Recommendation
**[APPROVE | REQUEST CHANGES | BLOCK]**

Blocking issues: [count] | Non-blocking issues: [count]
```

### Severity Escalation Rules
- Any CRITICAL finding = automatic BLOCK recommendation
- 3+ HIGH findings = REQUEST CHANGES even if individually non-blocking
- Security grep match confirmed as real = always CRITICAL
