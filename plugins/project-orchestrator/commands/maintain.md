---
description: "Run a maintenance cycle on the existing codebase — dependency audit, static analysis, security re-scan, and code health check. Produces a prioritized maintenance report with optional auto-fix for low-risk items."
argument-hint: "[scope: all | security | deps | quality]"
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.

## Mission

Run a lightweight, non-pipeline maintenance cycle on an existing codebase. Reuses existing skills to audit health across 4 dimensions: dependencies, code quality, security, and technical debt. Unlike `/new` or `/build-feature`, this does NOT create specs or run the 9-phase pipeline.

## Scope Options

| Scope | What It Checks | Agents/Skills Used |
|-------|---------------|-------------------|
| `all` (default) | Everything below | All below |
| `security` | Vulnerabilities, secrets, OWASP | security-auditor agent |
| `deps` | Outdated packages, CVEs, license conflicts | dependency-audit skill |
| `quality` | Complexity, dead code, duplication | static-analysis skill, code-simplify skill |

## Steps

### STEP 1 — Read project context

```bash
# Find project-config.md
Glob(".claude/specs/*/project-config.md")
# If not found, scan for package.json, requirements.txt, pubspec.yaml, build.gradle.kts to infer stack
```

Read the project-config.md (or infer tech stack from project files) to determine:
- Which package managers to audit (npm, pip, pub, gradle)
- Which linters/analyzers are configured
- Which security tools are available

### STEP 2 — Dependency Audit

Skip if scope is `security` or `quality`.

Run the appropriate package audit commands:
```bash
# Node.js
npm audit --json 2>/dev/null || true
npx npm-check-updates --format json 2>/dev/null || true

# Python
pip audit --format json 2>/dev/null || true
pip list --outdated --format json 2>/dev/null || true

# Flutter/Dart
dart pub outdated --json 2>/dev/null || true

# Go
go list -m -u all 2>/dev/null || true
```

Classify findings:
- **Critical**: Known CVEs with exploits
- **High**: Outdated major versions with security patches
- **Medium**: Outdated minor versions
- **Low**: Patch-level updates available

### STEP 3 — Static Analysis (Code Quality)

Skip if scope is `security` or `deps`.

Run available analyzers:
```bash
# Duplication detection
npx jscpd --min-lines 5 --reporters json src/ 2>/dev/null || true

# Complexity (ESLint for JS/TS)
npx eslint --format json src/ 2>/dev/null || true

# Dead code (TypeScript)
npx knip --reporter json 2>/dev/null || true

# Python complexity
ruff check --select C901 --format json . 2>/dev/null || true

# Python dead code
vulture . --min-confidence 80 2>/dev/null || true
```

Classify findings:
- **High**: Cyclomatic complexity > 20, large duplicated blocks (> 30 lines)
- **Medium**: Cyclomatic complexity 10-20, unused exports, moderate duplication
- **Low**: Minor style issues, small unused variables

### STEP 4 — Security Re-Scan

Skip if scope is `deps` or `quality`.

Dispatch the security-auditor agent in focused mode:
```
Agent(
  subagent_type="project-orchestrator:security-auditor",
  prompt="Run a MAINTENANCE security scan (not a full Phase 5 audit).
          Focus on: secrets in code (grep for API keys, tokens, passwords),
          dependency vulnerabilities (from Step 2 if available),
          and any new OWASP Top 10 issues in recently changed files.
          Write findings to .claude/maintenance-report-security.md.
          Be concise — this is a health check, not a full audit."
)
```

### STEP 5 — Generate Maintenance Report

Write `.claude/maintenance-report.md`:
```markdown
# Maintenance Report — [date]

## Summary
| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Dependencies | [n] | [n] | [n] | [n] |
| Code Quality | [n] | [n] | [n] | [n] |
| Security | [n] | [n] | [n] | [n] |
| **Total** | **[n]** | **[n]** | **[n]** | **[n]** |

## Critical & High Findings (Action Required)

### [Finding 1]
- **Category:** [deps/quality/security]
- **Severity:** [Critical/High]
- **Description:** [what's wrong]
- **Fix:** [recommended action]
- **Auto-fixable:** [Yes/No]

## Medium & Low Findings (Recommended)
[Grouped list]

## Auto-Fix Candidates
These items can be fixed automatically with low risk:
- [ ] Update [package] from [old] to [new] (patch version)
- [ ] Remove unused import in [file]
- [ ] Format [N] files with prettier/ruff
```

### STEP 6 — Present results and offer auto-fix

```
AskUserQuestion(
  question="Maintenance scan complete:
  - [N] critical, [N] high, [N] medium, [N] low findings
  - [N] items are auto-fixable (low risk)

  Full report: .claude/maintenance-report.md

  What would you like to do?",
  options=[
    "Auto-fix low-risk items (patch updates, formatting, dead imports)",
    "Show me the critical/high findings in detail",
    "Create tasks for manual fixes",
    "Done — I'll review the report later"
  ]
)
```

If "Auto-fix": run safe updates (patch-level dep bumps, formatting, dead import removal). Commit with `chore(maintenance): auto-fix low-risk items`.

If "Create tasks": write a `maintenance-tasks.md` with checkable items for each finding.

## Rules
- NEVER auto-fix major version bumps or security-critical changes without user approval
- NEVER modify business logic — only formatting, imports, and dependency versions
- If no issues found: report "Clean bill of health" and stop
- Maintenance report goes to `.claude/` not `.claude/specs/` (it's not a feature spec)
