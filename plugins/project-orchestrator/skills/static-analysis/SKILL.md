---
name: static-analysis
description: Run tool-based static analysis for code quality — duplication detection (jscpd), complexity metrics (Semgrep/ESLint/Ruff/Detekt), dead code detection (knip/vulture/deadcode), and code smells (Semgrep best-practices). Use when the user says "code quality", "check duplication", "complexity analysis", "dead code", "static analysis".
allowed-tools: Read, Bash, Grep, Glob
---

# Static Analysis Skill

Tool-based code quality analysis. Read project-config.md to determine which tools apply. Run only tools relevant to the project's tech stack.

## Tool Commands by Check Type

### 1. Code Duplication (all projects)
```bash
# jscpd — multi-language copy-paste detection
npx jscpd --format json --output jscpd-report.json --min-lines 5 --min-tokens 50 \
  --ignore "node_modules,dist,build,coverage,.next,vendor,*.lock" .
```
Reports duplication percentage and exact duplicate block locations.

### 2. Complexity Analysis

```bash
# Semgrep maintainability rules (all languages)
semgrep scan --config p/maintainability --json --output semgrep-quality.json .

# JavaScript/TypeScript — ESLint complexity rule
npx eslint --rule 'complexity: [warn, 15]' --format json --output-file eslint-complexity.json src/

# Python — Ruff cognitive complexity (C901)
ruff check --select C901 --output-format json src/

# Kotlin/KMP — Detekt
detekt --report json:detekt-report.json

# Go — gocyclo
gocyclo -over 15 ./...
```
Flag functions with cyclomatic complexity > 15 as WARN.

### 3. Dead Code Detection

```bash
# JavaScript/TypeScript — knip (unused exports, files, dependencies)
npx knip --reporter json

# Python — vulture (unused functions, variables, imports)
vulture src/ --min-confidence 80

# Go — deadcode
deadcode ./...
```

### 4. Code Smells / Anti-Patterns

```bash
# Semgrep best-practices (all languages)
semgrep scan --config p/best-practices --json --output semgrep-smells.json .

# Kotlin/KMP — Detekt rulesets
detekt --report json:detekt-report.json  # Uses complexity, style, potential-bugs, naming rulesets
```

## Which Tools to Run (read from project-config.md)

| Tech Stack | Duplication | Complexity | Dead Code | Smells |
|---|---|---|---|---|
| ALL projects | jscpd | Semgrep `p/maintainability` | — | Semgrep `p/best-practices` |
| JS/TS (NestJS, React, Next.js) | — | ESLint complexity | knip | — |
| Python (Django, FastAPI, AI) | — | Ruff C901 | vulture | — |
| Kotlin/KMP | — | Detekt | — | Detekt |
| Go | — | gocyclo | deadcode | — |
| Flutter/Dart | — | `dart analyze` (built-in) | — | `dart analyze` |

Skip tools for ecosystems NOT present in project-config.md.

## Output Format

Return findings as structured text for the static-analyzer agent to include in review-team's combined report:

```markdown
### Code Duplication
- **Duplication:** [X]% ([N] duplicate blocks across [M] files)
- **Largest duplicate:** [N] lines in [file1] ↔ [file2]

### Complexity
| File | Function | Complexity | Status |
|---|---|---|---|
| [path:line] | [function] | [score] | WARN (> 15) |

### Dead Code
| Type | Name | File | Confidence |
|---|---|---|---|
| Unused export | [name] | [path:line] | HIGH/MEDIUM |

### Code Smells
- [N] findings from Semgrep best-practices
- [N] findings from Detekt (if applicable)
- [details of top 5 most impactful smells]
```
