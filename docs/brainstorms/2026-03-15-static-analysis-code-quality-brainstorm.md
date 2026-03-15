# Brainstorm: Static Analysis & Code Quality Pipeline

**Date:** 2026-03-15
**Status:** Decided
**Next:** `/ce:plan` to implement

---

## What We're Building

Add a `static-analyzer` agent to Phase 6 (review-team) that runs **tool-based** code quality checks alongside the existing LLM-based reviewers. This fills the gap where project-config.md captures tool preferences (SonarQube, ESLint, etc.) but no agent actually runs them for quality analysis.

The agent produces an **advisory report** (not a blocking gate) covering:
1. **Code duplication** — copy-paste detection across files
2. **Cyclomatic/cognitive complexity** — overly complex functions
3. **Dead code** — unused functions, exports, imports, variables
4. **Code smells / anti-patterns** — long methods, deep nesting, magic numbers, god classes

Security is already covered by Phase 5 (security-auditor). This agent focuses on **quality and maintainability**.

### Current Problems

| Problem | Impact |
|---|---|
| project-config.md captures quality tool preferences but no agent runs them | Config is dead — users configure SonarQube but it never executes |
| review-team is 100% LLM-based — no tool-based analysis | Misses mechanical issues (exact duplication %, complexity scores) that tools catch reliably |
| No duplication detection anywhere in the pipeline | Copy-paste code accumulates silently |
| No complexity metrics | Overly complex functions only caught by human-style code review (inconsistent) |
| No dead code detection | Unused exports, functions, and imports accumulate as tech debt |
| No Detekt support for Kotlin/KMP | KMP developer runs tests but no Kotlin-specific quality checks |
| Feature-team lint commands are hardcoded | Doesn't adapt to project-config.md tool choices |

---

## Why This Approach

**Approach A: Add static-analyzer to review-team** selected over two alternatives:

- **Approach B (Separate Phase 5.5):** Adds a sequential phase — rejected because advisory output doesn't warrant pipeline latency. Phase 6 already runs multiple reviewers in parallel.
- **Approach C (Expand Phase 3):** Slows the build phase and makes feature-team even larger (450+ lines). Quality analysis is a review concern, not a build concern.

**Rationale:** review-team already coordinates 3-5 parallel reviewers. Adding a 6th reviewer that runs tools (not LLM review) is natural. The static analysis results inform code-reviewer's findings — e.g., "performance-reviewer flagged an N+1 query AND static-analyzer found the same module has cyclomatic complexity 25."

---

## Key Decisions

### 1. Add `static-analyzer` agent to review-team
- New agent dispatched by review-team alongside existing reviewers
- Runs tool-based analysis (not LLM — deterministic tool output)
- Results appear in review-team's combined report under a "Static Analysis" section
- **Advisory only** — does NOT block the pipeline or fail Gate 4

### 2. Tools by check type

| Check | Tool | Command | Languages |
|---|---|---|---|
| Code duplication | jscpd | `jscpd --format json --output jscpd-report.json .` | All (JS, TS, Python, Go, Kotlin, Dart, etc.) |
| Complexity | Semgrep `p/maintainability` | `semgrep scan --config p/maintainability --json .` | All |
| Complexity (JS/TS) | ESLint `complexity` rule | `npx eslint --rule 'complexity: [warn, 15]' --format json src/` | JS/TS |
| Complexity (Python) | Ruff `C901` | `ruff check --select C901 --output-format json src/` | Python |
| Complexity (Kotlin) | Detekt | `detekt --report json:detekt-report.json` | Kotlin/KMP |
| Dead code (JS/TS) | knip | `npx knip --reporter json` | JS/TS |
| Dead code (Python) | vulture | `vulture src/ --min-confidence 80` | Python |
| Dead code (Go) | deadcode | `deadcode ./...` | Go |
| Code smells | Semgrep `p/best-practices` | `semgrep scan --config p/best-practices --json .` | All |
| Code smells (Kotlin) | Detekt | Uses `complexity`, `style`, `potential-bugs` rulesets | Kotlin |

### 3. Stack-agnostic — read from project-config.md
- Read tech stack from project-config.md to determine which tools to run
- If Kotlin/KMP present → run Detekt
- If Python present → run Ruff C901 + vulture
- If JS/TS present → run ESLint complexity + knip
- If Go present → run deadcode
- jscpd and Semgrep quality rules run for ALL projects (language-agnostic)

### 4. Output format — section in review-team's combined report

The static-analyzer returns findings to review-team, which includes them in the combined report:

```markdown
## Static Analysis (tool-based)

### Code Duplication
- **Duplication:** 3.2% (12 duplicate blocks across 8 files)
- **Largest duplicate:** 45 lines in `services/core-service/src/orders/order.service.ts` ↔ `services/core-service/src/invoices/invoice.service.ts`

### Complexity
| File | Function | Complexity | Threshold | Status |
|---|---|---|---|---|
| order.service.ts:47 | processOrder | 22 | 15 | WARN |
| auth.controller.ts:89 | validateToken | 18 | 15 | WARN |

### Dead Code
| Type | Name | File | Confidence |
|---|---|---|---|
| Unused export | `formatCurrency` | utils/format.ts:12 | HIGH |
| Unused function | `legacy_handler` | ai-service/handlers.py:45 | HIGH |

### Code Smells
- 3 findings from Semgrep `p/best-practices`
- 2 findings from Detekt `complexity` ruleset
```

### 5. Advisory only — no quality gate
- Results included in review-team's combined report
- Review-team's code-reviewer can reference static analysis findings in their review
- Gate 4 includes static analysis summary but does NOT auto-fail on quality metrics
- Future: could add configurable quality gates in project-config.md (deferred)

### 6. Detekt support for Kotlin/KMP
- Detekt runs when project-config.md includes Kotlin or KMP in the tech stack
- Uses `complexity`, `style`, `potential-bugs`, and `naming` rulesets
- Output formatted as JSON for the static-analyzer to parse
- This also fills the gap where kmp-developer has no Kotlin-specific quality checks

---

## Changes Required

### New files to create
- `plugins/project-orchestrator/agents/static-analyzer.md` — new agent (~80-100 lines)
- `plugins/project-orchestrator/skills/static-analysis/SKILL.md` — new skill with tool commands and output parsing

### Files to modify
- `agents/review-team.md` — add static-analyzer to team composition and dispatch
- `agents/project-orchestrator.md` — update Phase 6 description in pipeline diagram (add static-analyzer to review-team listing)
- `.claude-plugin/plugin.json` — update agent count (34 → 35)
- `README.md` — update agent count

---

## Resolved Questions
- *Where does code quality analysis live?* → Phase 6 review-team as a parallel reviewer
- *Blocking or advisory?* → Advisory only (no quality gate)
- *Which tools?* → jscpd (duplication), Semgrep quality rules (complexity/smells), ESLint/Ruff/Detekt (language-specific complexity), knip/vulture/deadcode (dead code)
- *Stack-agnostic?* → Yes, reads project-config.md to determine which tools apply
- *Detekt for Kotlin?* → Yes, runs when KMP/Kotlin present
- *Does it overlap with Phase 5?* → No. Phase 5 = security. Static-analyzer = quality/maintainability.

## Open Questions

None — all questions resolved during brainstorm.
