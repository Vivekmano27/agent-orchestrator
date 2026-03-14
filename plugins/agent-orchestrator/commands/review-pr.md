---
description: "Comprehensive PR review using the review-team — code quality, security audit, and performance analysis in parallel."
argument-hint: "<branch name or 'current'>"
disable-model-invocation: true
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Spawn the review-team to perform a comprehensive review of the current branch.

## Steps
1. Identify changed files: `git diff main...HEAD --name-only`
2. Spawn review-team with 3 parallel reviewers:
   - code-reviewer: correctness, patterns, testing, readability
   - security-auditor: OWASP, secrets, auth, injection
   - performance-reviewer: N+1, re-renders, indexes, caching
3. Collect all findings
4. Produce combined report sorted by severity
5. Present summary with action items

## Output
Combined report with: ✅ Approve / 🔄 Request Changes
