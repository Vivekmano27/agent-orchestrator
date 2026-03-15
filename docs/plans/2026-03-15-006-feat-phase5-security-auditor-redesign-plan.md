---
title: "feat: Phase 5 Security Auditor Redesign"
type: feat
status: completed
date: 2026-03-15
origin: docs/brainstorms/2026-03-15-phase5-security-auditor-brainstorm.md
---

# Phase 5 Security Auditor Redesign

## Enhancement Summary

**Deepened on:** 2026-03-15
**Research agents used:** architecture-strategist, code-simplicity-reviewer, security-sentinel

### Key Improvements
1. **Split into 2 PRs** — PR1: agent rewrite + 3 core skills (security-reviewer, dependency-audit, secrets-scanner) + orchestrator updates. PR2 (follow-up): compliance-checker + threat-modeling expansion + project-setup compliance fields.
2. **Collapse 6 execution steps to 4** — merge classify+write and route+report into single steps
3. **Remove Framework-to-OWASP mapping table** — replaces one hardcoded table with another; skills already contain framework-specific knowledge
4. **Fix tool commands** — TruffleHog flag (`--only-verified` not `--results=verified`), Bandit remove `-ll` filter, ESLint use full plugin config, add Semgrep `--json` output
5. **STOP triggers at 2 points** — during secrets-scanner (committed secrets) AND during security-reviewer (auth bypass with live deployment)
6. **Add missing secret patterns** — GitHub (`ghp_`), Slack (`xoxb-`), OpenAI (`sk-`), Firebase (`AIza`), AWS secret key, Terraform state files
7. **Compliance reports PARTIAL** — not PASS/FAIL for standards where >50% checks are manual
8. **Add regression detection** to Phase 5→3 loop (even with 1 round-trip)
9. **"Accept risk" writes permanent audit trail** to security-audit.md

### Scope Adjustment (from simplicity review)
- **PR1 (this plan):** security-auditor rewrite, security-reviewer expansion, dependency-audit expansion, secrets-scanner expansion, orchestrator updates, feature-team update — **6 files**
- **PR2 (deferred):** compliance-checker expansion (HIPAA/CCPA/SOC2), threat-modeling expansion (DFD/structured output), project-setup compliance fields — **3 files**

## Overview

Redesign Phase 5 (Security) from a thin 73-line agent with no execution protocol to a structured, tool-aware security auditor matching Phase 4's quality standard. Adds step-by-step execution, structured security-audit.md with severity classification (CRITICAL/HIGH/MEDIUM/LOW), Phase 5→3 fix routing through feature-team, stack-agnostic checks from project-config.md, STOP policy for exploitable vulnerabilities, and expands all 5 security skills to full OWASP/compliance coverage with concrete tool commands.

## Problem Statement

Security-auditor is the **thinnest agent** (73 lines) handling the **most critical verification** in the pipeline. It has no execution protocol, no output template, no severity classification, no fix routing, and hardcoded tech stack checks. Its 5 skills are incomplete (4/10 OWASP categories, 2/5 compliance standards). (see brainstorm: `docs/brainstorms/2026-03-15-phase5-security-auditor-brainstorm.md`)

## Proposed Solution

Expand security-auditor to ~180 lines with structured execution protocol. Expand all 5 skills with complete coverage and tool commands. Add Phase 5→3 fix routing to project-orchestrator.md. Keep as single agent — no team wrapper needed.

## Technical Approach

### Implementation Phases

#### Phase 1: Expand security skills (5 files)

**1a. `skills/security-reviewer/SKILL.md`** — Add missing OWASP categories:

Current: A01, A02, A03, A07 (4/10). Add:
- **A04: Insecure Design** — threat modeling references, architecture review checklist
- **A05: Security Misconfiguration** — default credentials, unnecessary features, stack traces exposed, debug mode, directory listing
- **A06: Vulnerable Components** — defer to dependency-audit skill; verify dependency-audit was run
- **A08: Software and Data Integrity Failures** — CI/CD pipeline security, unsigned updates, deserialization
- **A09: Security Logging and Monitoring Failures** — audit logging exists, alerting configured, no PII in logs
- **A10: Server-Side Request Forgery (SSRF)** — URL validation, allowlists, internal network protection

Add tool commands (corrected per security review):
```bash
# Semgrep OWASP scan (JSON output for structured parsing)
semgrep scan --config p/owasp-top-ten --config p/security-audit --config p/secrets --json --output semgrep-report.json .
# Bandit (Python — no severity filter, let agent classify)
bandit -r ./src -f json -o bandit-report.json
# ESLint security (JS/TS — full plugin, not single rule)
npx eslint --plugin security --config plugin:security/recommended --format json --output-file eslint-security.json src/
# gosec (Go)
gosec -fmt=json -out=gosec-results.json ./...
```

**1b. `skills/compliance-checker/SKILL.md`** — Add missing standards:

Current: GDPR (8 items), PCI-DSS (5 items). Add:
- **HIPAA** (8 items): PHI encrypted at rest/transit, access controls, audit trails, session timeout, unique user ID, BAA reference, risk analysis reference, minimum necessary principle
- **CCPA** (5 items): data collection disclosure, "do not sell" opt-out endpoint, deletion rights endpoint, data export endpoint, non-discrimination
- **SOC2** (6 items): RBAC implementation, change management (PR reviews enforced), encryption, health check endpoints, incident response reference, access review reference

Add note: "Agent can verify automated checks. Items marked 'reference' require human/legal review — flag as MEDIUM and note in recommendations."

Add project-config.md integration: "Read applicable compliance standards from project-config.md `compliance` field. Only run checks for applicable standards."

**1c. `skills/threat-modeling/SKILL.md`** — Add execution steps:

Current: Just a STRIDE table (19 lines). Add:
1. Read `architecture.md` to identify system boundaries, data flows, trust zones
2. Create a text-based Data Flow Diagram (DFD): actors → entry points → services → data stores
3. Apply STRIDE to each DFD element — generate threat table
4. Rank threats by risk = likelihood × impact (HIGH/MEDIUM/LOW)
5. Map each threat to a mitigation (existing or recommended)
6. Output structured threat table:

```markdown
| ID | Element | STRIDE | Threat | Risk | Mitigation | Status |
|---|---|---|---|---|---|---|
| T-001 | API Gateway | Spoofing | JWT forgery | HIGH | JWT validation with RS256 | Verify |
```

Add fallback: "If architecture.md is missing or insufficient, skip DFD creation and apply STRIDE to known services from project-config.md."

**1d. `skills/dependency-audit/SKILL.md`** — Add structured output and commands:

Add per-ecosystem commands:
```bash
# Node.js
npm audit --json > npm-audit.json
# Python
pip-audit -f json -o pip-audit.json
# Go
govulncheck -json ./... > govulncheck.json
# Multi-purpose
trivy fs --scanners vuln --format json --output trivy-deps.json .
```

Add structured output table:
```markdown
| Package | Current | Vulnerability | CVE | Severity | Fix Version |
|---|---|---|---|---|---|
```

Add license compatibility check step. Add note: "Skip ecosystems not present in project-config.md."

**1e. `skills/secrets-scanner/SKILL.md`** — Add patterns and tool commands:

Add patterns for:
- GCP: `"type": "service_account"`, `GOOG[\w]{10,}`
- Azure: `DefaultEndpointsProtocol=`, `AccountKey=`
- Stripe: `sk_live_`, `pk_live_`, `rk_live_`
- Twilio: `AC[a-z0-9]{32}`, `SK[a-z0-9]{32}`
- SendGrid: `SG\.[\w\-]{22,}`
- GitHub tokens: `ghp_[A-Za-z0-9]{36}`, `gho_`, `ghs_`, `ghr_`
- Slack tokens: `xoxb-`, `xoxp-`, `xoxs-`
- OpenAI API keys: `sk-[A-Za-z0-9]{48}`
- Firebase/Google API keys: `AIza[0-9A-Za-z\-_]{35}`
- AWS Secret Access Key (in proximity to `aws_secret` or `AWS_SECRET`)
- Private key files: `*.pem`, `*.key`, `*.p12`
- Terraform state files: `*.tfstate`
- `.env` files committed: `.env`, `.env.local`, `.env.production`

Add tool commands (corrected per security review):
```bash
# Gitleaks (fast, CI-friendly — primary scanner)
gitleaks detect --source . --report-format json --report-path gitleaks-report.json
# TruffleHog (optional — verifies if secrets are active, use for HIGH-value findings)
trufflehog git file://. --json --only-verified > trufflehog-report.json
```

Note: Gitleaks is the primary scanner (fast, pattern-based). TruffleHog is optional secondary (slower, but verifies if secrets are live). Running both on every audit is redundant — use TruffleHog only when Gitleaks finds potential secrets and verification is needed.

When reporting findings, distinguish confirmed vendor-pattern matches (e.g., `AKIA...`, `sk_live_...`, `ghp_...`) from generic pattern matches. Only trigger STOP for confirmed vendor-pattern matches, not generic long strings.

---

#### Phase 2: Rewrite security-auditor.md

**File:** `plugins/agent-orchestrator/agents/security-auditor.md`

Expand from 73 to ~180 lines. Keep existing frontmatter fields. Add:

**Execution Protocol (6 steps):**

**STEP 1 — Read specs and determine scope**
Read from `.claude/specs/[feature]/`:
- `project-config.md` — tech stack, compliance standards, service structure
- `architecture.md` — service boundaries, data flows (for threat modeling)
- `requirements.md` — security-relevant requirements
- `tasks.md` — which files were changed
- `test-report.md` — Phase 4 results (if available)

Read `task_size` from orchestrator dispatch. Apply audit depth scaling (existing table, already correct).

Read tech stack from project-config.md and pass it as context to each skill. Skills already contain framework-specific knowledge — do NOT maintain a separate mapping table (avoids duplicating coupling).

### Research Insight (simplicity review)
The original plan had a Framework-to-OWASP mapping table that replaced one hardcoded table with another. Removed — skills contain the framework knowledge, agent passes tech stack context.

**STEP 2 — Run audit skills (in order)**
1. **secrets-scanner** — always runs first (fastest, most critical)
2. **dependency-audit** — always runs (skip ecosystems not in project-config.md)
3. **security-reviewer** — OWASP checks scaled by task size
4. **threat-modeling** — BIG tasks only (or risk-override escalation)
5. **compliance-checker** — BIG tasks only, standards from project-config.md `compliance` field

STOP can trigger at **two points** during STEP 2:
- During **secrets-scanner** (STEP 2.1): if a confirmed vendor-pattern secret is found (not placeholder/test value). Heuristic: length > 20, high entropy, does not match common placeholders (`changeme`, `your-api-key-here`, `xxx`, `REPLACE_ME`).
- During **security-reviewer** (STEP 2.3): if an auth bypass is found on a public endpoint AND project-config.md has a live deployment target.

On STOP: write partial security-audit.md with findings from already-completed skills, set `Status: STOPPED`, return immediately.

**STEP 3 — Classify findings by severity**

| Severity | Criteria | Action |
|---|---|---|
| CRITICAL | Exploitable vulnerability: SQL injection on public endpoint, auth bypass, committed production secret | Route to orchestrator for Phase 5→3 |
| HIGH | Significant risk: missing RBAC, weak crypto, HIGH CVE dependency, missing rate limiting | Route to orchestrator for Phase 5→3 |
| MEDIUM | Moderate risk: missing security headers, medium CVE, incomplete logging | Document in report, fix in follow-up PR |
| LOW | Minor: informational, best-practice suggestion, low CVE | Document in report, optional fix |

Assign stable IDs: SEC-001, SEC-002, etc.

**STEP 4 — Write security-audit.md**

Write to `.claude/specs/[feature]/security-audit.md`:
```markdown
# Security Audit — [feature-name]
## Round-trip: [0 = initial | 1 = after fix]
## Status: COMPLETE / STOPPED

## Summary
| Severity | Count | Action |
|---|---|---|
| CRITICAL | [N] | BLOCK — fix via Phase 5→3 |
| HIGH | [N] | Fix before merge via Phase 5→3 |
| MEDIUM | [N] | Fix in follow-up PR |
| LOW | [N] | Suggestion — optional |

## Audit Scope
- Task size: [SMALL/MEDIUM/BIG]
- Services audited: [list from project-config.md]
- Skills run: [list]
- Compliance standards checked: [from project-config.md]
- Files audited: [count] ([Phase 3 files + Phase 4→3 fix files])

## Findings
### [SEC-001] [CRITICAL] [Title]
**OWASP:** [category]
**File:** [path:line]
**Description:** [what's wrong]
**Impact:** [what could happen]
**Fix:** [specific recommended change]

## Dependency Audit
| Package | Severity | CVE | Current | Fix Version |
|---|---|---|---|---|
| [package] | [severity] | [CVE-ID] | [current] | [fix version] |

## Secrets Scan
| Finding | File | Confidence | Action |
|---|---|---|---|
| [type] | [path:line] | HIGH/MED/LOW | [rotate/remove/move to env] |

## Compliance ([standards from project-config.md])
| Standard | Status | Automated Checks | Gaps (needs human review) |
|---|---|---|---|
| [GDPR/HIPAA/etc.] | PASS/FAIL | [N] passed | [list] |

## Fix History (appended on round-trip 1)
### Round-trip 1
- **Findings addressed:** [SEC-001, SEC-003]
- **Files changed:** [list]
- **Result:** [SEC-001 resolved, SEC-003 persists]
```

**STEP 5 — Route CRITICAL/HIGH findings**
If CRITICAL or HIGH findings exist:
- Return structured finding list to orchestrator for Phase 5→3 routing
- Include: finding ID, severity, file:line, description, recommended fix
- Orchestrator handles feature-team dispatch (security-auditor does NOT dispatch directly)

If MEDIUM/LOW only → return clean report, no fix routing needed.

**STEP 6 — Report to orchestrator**
Return:
- Whether security-audit.md was written (and Status: COMPLETE or STOPPED)
- Severity summary (CRITICAL/HIGH/MEDIUM/LOW counts)
- If CRITICAL/HIGH found: structured finding list for Phase 5→3 routing
- Compliance summary (if applicable)

**Dual-mode behavior (preserve existing Dispatch Context):**
- **Phase 5 (orchestrator dispatch):** Full execution protocol (STEPs 1-6)
- **Phase 6 (review-team dispatch):** Focused spot-check of code changes only. Skip execution protocol. Do NOT write or overwrite security-audit.md. Return inline findings to review-team.

**STOP Policy:**
If during STEP 2 (secrets-scanner), a HIGH-confidence real secret is found:
1. Write partial security-audit.md with `Status: STOPPED` and the finding
2. Return immediately to orchestrator with STOP signal
3. Do NOT continue to remaining audit skills

STOP criteria:
- Real secret committed (not placeholder/test value) — regardless of deployment status
- Auth bypass on a public-facing endpoint with live deployment target in project-config.md

---

#### Phase 3: Update project-orchestrator.md

**3a. Update Phase 5 dispatch prompt** (currently lines 563-569):

Replace minimal dispatch with full context:
```
### Phase 5: Security — single agent
```
Agent(
  subagent_type="agent-orchestrator:security-auditor",
  prompt="Run Phase 5 Security Audit for [feature].
  Task size: [SMALL/MEDIUM/BIG].
  Spec directory: .claude/specs/[feature]/
  Files changed: [Phase 3 files + Phase 4→3 fix files — complete list].
  Coverage thresholds and tech stack: Read from project-config.md.

  Run full execution protocol (STEPs 1-6).
  Write security-audit.md to spec directory.
  Return: severity summary, CRITICAL/HIGH finding list (if any) for Phase 5→3 routing."
)
```
```

**3b. Add Phase 5→3 Feedback Loop** (after the Phase 4→3 section):

```markdown
### Phase 5→3 Feedback Loop (Security Fix Routing)
When security-auditor reports CRITICAL or HIGH findings:

**Step 1 — Read security-auditor's finding list:**
Structured list with stable IDs (SEC-NNN), severity, file:line, description, recommended fix.

**Step 2 — Re-dispatch feature-team:**
```
Agent(
  subagent_type="agent-orchestrator:feature-team",
  prompt="PHASE 5→3 FEEDBACK: Security audit found CRITICAL/HIGH vulnerabilities.
  Feature: [feature-name]. Spec directory: .claude/specs/[feature]/

  SECURITY FINDINGS TO FIX:
  [structured finding list from security-audit.md]

  RULES:
  - Fix ONLY the identified security vulnerabilities
  - Follow file ownership matrix
  - Surgical fixes — minimum code change necessary
  - Do NOT bundle refactoring with security fixes
  - Run tests locally before marking done
  - Commit as: fix(security): [description]
  - This is a TARGETED SECURITY FIX, not a full re-implementation

  Previous security-audit.md: .claude/specs/[feature]/security-audit.md"
)
```

**Step 3 — Scoped re-audit:**
After feature-team completes, re-dispatch security-auditor:
- Re-check ONLY the specific findings that were routed (by SEC-NNN ID)
- Quick scan of changed files for regressions (new vulnerabilities introduced by fix)
- Do NOT run full audit depth again
- Write updated security-audit.md with Round-trip: 1 and Fix History

**Step 4 — Max retries:**
- Allow **1 Phase 5→3 round-trip** maximum (security fixes should be surgical)
- If still CRITICAL/HIGH after 1 loop → escalate to user:
  ```
  AskUserQuestion(
    question="Security vulnerabilities persist after 1 fix attempt.
    Remaining: [finding list from security-audit.md].
    These issues BLOCK deployment.",
    options=[
      "Let me fix manually — show me the findings",
      "Accept risk and proceed (not recommended — documents risk acceptance)",
      "Re-audit with different approach",
      "Cancel feature"
    ]
  )
  ```
```

**3c. Add STOP handler** (after Phase 5→3 section):

```markdown
### Handling STOP from security-auditor
When security-auditor reports STOP (actively exploitable vulnerability):
```
AskUserQuestion(
  question="SECURITY STOP: [finding description].
  [file:line]. The pipeline is halted.
  This vulnerability requires immediate attention.",
  options=[
    "I'll fix this immediately — show details",
    "Rotate compromised credentials and re-audit",
    "This is a false positive — downgrade to CRITICAL",
    "Cancel feature"
  ]
)
```
- **"Fix immediately"** → show finding details, wait for user to fix, then re-dispatch security-auditor (full run)
- **"Rotate and re-audit"** → user rotates credentials externally, then re-dispatch security-auditor
- **"False positive"** → downgrade to CRITICAL, route through Phase 5→3 loop
- **"Cancel"** → standard cancel handler
```

**3d. Update Gate 4** to read structured security-audit.md:

Gate 4 should read severity counts from security-audit.md Summary table. If CRITICAL > 0 (meaning Phase 5→3 was exhausted), present with strong recommendation:
```
options=["Security issues must be resolved — fix manually", "Accept risk and proceed to DevOps", "Re-audit", "Cancel"]
```
This is a user choice with recommendation, NOT an auto-action.

**3e. Update feature-team.md** — generalize targeted fix mode:

Change the prefix recognition from "PHASE 4→3 FEEDBACK" to any "PHASE N→3 FEEDBACK":
```
When dispatched with a prompt containing **"PHASE 4→3 FEEDBACK"** or **"PHASE 5→3 FEEDBACK"**, enter simplified targeted-fix mode.
```
For Phase 5→3: read findings from security-audit.md (not test-report.md).

**3f. Add `compliance` field to project-setup.md:**

In the project-config.md template, add after the Testing section:
```markdown
## Compliance & Regulatory
- **Applicable Standards:** [GDPR / HIPAA / PCI-DSS / SOC2 / CCPA / none]
- **Handles PII:** [yes / no]
- **Handles Payment Data:** [yes / no]
- **Handles Health Data (PHI):** [yes / no]
- **Has Live Deployment Target:** [yes (URL) / no (local only)]
```

---

## Acceptance Criteria

### Functional Requirements
- [ ] security-auditor.md rewritten with 6-step execution protocol (~180 lines)
- [ ] Structured security-audit.md template with CRITICAL/HIGH/MEDIUM/LOW severity, stable IDs (SEC-NNN), fix recommendations
- [ ] Round-trip versioning and Fix History in security-audit.md
- [ ] Phase 5→3 feedback loop in project-orchestrator.md (through feature-team, max 1 round-trip)
- [ ] STOP policy with partial security-audit.md (Status: STOPPED) and orchestrator handler
- [ ] Stack-agnostic checks read from project-config.md (remove hardcoded per-service table)
- [ ] Dual-mode preserved: Phase 5 = full protocol, Phase 6 = spot-check (no overwrite)
- [ ] Phase 5 dispatch prompt includes task_size, spec directory, complete file list (Phase 3 + Phase 4→3 fixes)
- [ ] Gate 4 reads severity counts from structured security-audit.md
- [ ] feature-team.md generalized to recognize "PHASE 5→3 FEEDBACK" prefix
- [ ] project-setup.md adds compliance/regulatory fields to project-config.md template
- [ ] security-reviewer skill: complete OWASP Top 10 (A01-A10) with Semgrep/Bandit/ESLint/gosec commands
- [ ] compliance-checker skill: GDPR + HIPAA + PCI-DSS + CCPA + SOC2 with automatable vs human-review distinction
- [ ] threat-modeling skill: DFD creation steps, structured threat table output, fallback for missing architecture.md
- [ ] dependency-audit skill: per-ecosystem commands (npm audit, pip-audit, govulncheck, Trivy), structured output table, license check
- [ ] secrets-scanner skill: expanded patterns (GCP, Azure, Stripe, Twilio, SendGrid, .env files), confidence scoring (HIGH/MED/LOW), tool commands (Gitleaks, TruffleHog)
- [ ] Escalation AskUserQuestion templates for Phase 5→3 exhaustion and STOP

### Quality Gates
- [ ] Plugin validation passes: `bash plugins/agent-orchestrator/validate-plugin.sh`
- [ ] No hardcoded tech stack references in security-auditor.md
- [ ] All 5 skills have concrete tool commands (not just checklists)
- [ ] security-audit.md template has severity, stable IDs, file:line, and fix recommendations

## Files Changed Summary

### PR1 — This Implementation (6 files)

| File | Action | Changes |
|---|---|---|
| `agents/security-auditor.md` | REWRITE | 73→~130 lines: 4-step execution protocol, structured output, dual-mode, STOP policy (2 trigger points), stack-agnostic |
| `agents/project-orchestrator.md` | MODIFY | Phase 5 dispatch prompt (add task_size, file list), Phase 5→3 feedback loop with regression detection, STOP handler, Gate 4 reads security-audit.md |
| `agents/feature-team.md` | MODIFY | Generalize targeted fix mode to recognize "PHASE 5→3 FEEDBACK" |
| `skills/security-reviewer/SKILL.md` | EXPAND | Add OWASP A04-A06, A08-A10 with corrected tool commands |
| `skills/dependency-audit/SKILL.md` | EXPAND | Add per-ecosystem commands, structured output, skip absent ecosystems |
| `skills/secrets-scanner/SKILL.md` | EXPAND | Add vendor patterns (GitHub, Slack, OpenAI, Firebase, AWS secret key, Terraform), corrected Gitleaks/TruffleHog commands |

### PR2 — Deferred Follow-Up (3 files)

| File | Action | Changes |
|---|---|---|
| `skills/compliance-checker/SKILL.md` | EXPAND | Add HIPAA, CCPA, SOC2 with PARTIAL reporting (not PASS/FAIL) |
| `skills/threat-modeling/SKILL.md` | EXPAND | Add DFD creation, structured threat table, fallback behavior |
| `agents/project-setup.md` | MODIFY | Add compliance/regulatory fields to project-config.md template |

## Research Insights — Simplicity Considerations

| Concern | Simplicity Argument | Resolution |
|---|---|---|
| ~180 lines for single agent | Review-team coordinates 3-5 agents in 150 lines. Single agent should be lighter. | Target ~130 lines. Compress template to bullet points. Agent is an LLM, not a template engine. |
| All 5 skills in one PR | 9 files is a large blast radius. compliance-checker + threat-modeling only run for BIG tasks. | Split: PR1 = 3 core skills (run for ALL sizes). PR2 = 2 BIG-only skills. |
| Framework-to-OWASP table | Replaces one hardcoded table with a bigger one. Skills already know framework-specific checks. | Removed. Skills read project-config.md directly. |
| Formal confidence scoring taxonomy | The skill is consumed by an LLM, not a SARIF parser. | Simplified to single instruction: "distinguish vendor-pattern matches from generic matches." |
| 6 execution steps | Steps 3-4 and 5-6 are logically one step each. | Collapsed to 4 steps: read scope → run skills → classify + write report → return results. |
| Compliance fields in project-setup | No project uses compliance checking today. Adding 5 interview questions is premature. | Deferred to PR2 with compliance-checker expansion. |

## Research Insights — Security Corrections

| Finding | Severity | Fix Applied |
|---|---|---|
| TruffleHog `--results=verified` is incorrect flag | HIGH | Changed to `--only-verified` |
| STOP only triggers during secrets-scanner but auth bypass found during security-reviewer | HIGH | Added second STOP trigger point during security-reviewer |
| Bandit `-ll` filters out MEDIUM findings | MEDIUM | Removed `-ll` flag |
| ESLint command enables only 1 security rule | MEDIUM | Changed to `plugin:security/recommended` for full coverage |
| Missing GitHub, Slack, OpenAI, Firebase secret patterns | MEDIUM | Added to secrets-scanner expansion |
| Missing AWS Secret Access Key pattern (only had key ID) | HIGH | Added AWS secret key pattern with proximity heuristic |
| No heuristics for real vs placeholder secrets | HIGH | Added placeholder detection: `changeme`, `your-api-key-here`, `xxx`, `REPLACE_ME` |
| Compliance PASS/FAIL gives false assurance on manual items | MEDIUM | Changed to PARTIAL reporting for standards with >50% manual checks |
| "Accept risk" option lacks audit trail | MEDIUM | Added: writes permanent record to security-audit.md |

## Deep Research Findings (Round 2)

### Appendix A: OWASP A04-A10 Concrete Automated Checks

For each category, the security-reviewer skill should include these grep patterns and Semgrep rules:

**A04 (Insecure Design):** Absence detection — search for patterns that SHOULD exist:
- Rate limiting: `grep -rn "rateLimit\|throttle\|ThrottlerModule" src/` — flag MEDIUM if absent
- Account lockout: `grep -rn "maxAttempts\|lockout\|failedAttempts" src/`
- CAPTCHA: `grep -rn "captcha\|recaptcha\|hCaptcha" src/`

**A05 (Security Misconfiguration):** Pattern detection:
- Debug mode: `grep -rn "DEBUG\s*=\s*True\|debug:\s*true\|NODE_ENV.*development" src/` (exclude test/dev configs)
- Default credentials: `grep -rn "admin:admin\|password123\|root:root" src/` (exclude test fixtures)
- Permissive CORS: `grep -rn "Access-Control-Allow-Origin.*\*\|origin:\s*true" src/`
- Missing security headers: `grep -rn "helmet\|SecurityMiddleware\|X-Frame-Options" src/` — flag if absent
- TLS skip: `grep -rn "verify\s*=\s*False\|rejectUnauthorized.*false\|InsecureSkipVerify.*true" src/`
- IaC misconfig: `trivy fs --scanners misconfig --format json --output trivy-misconfig.json .`

**A08 (Software/Data Integrity):** Deserialization + CI/CD:
- Unsafe deserialization: `grep -rn "pickle\.load\|yaml\.load(\|eval(\|ObjectInputStream\|BinaryFormatter" src/`
- Missing SRI: `grep -rn '<script.*src=.*http' --include="*.html" . | grep -v "integrity="`
- CI/CD injection: `grep -rn '\${{.*github\.event' .github/workflows/` + Semgrep `p/github-actions`
- Unpinned Actions: `grep -rn "uses:.*@\(master\|main\|latest\)" .github/workflows/`

**A09 (Logging/Monitoring Failures):** PII leak + absence detection:
- PII in logs: `grep -rn "log.*\(password\|secret\|ssn\|creditCard\|token\|authorization\)" src/`
- Auth events logged: `grep -rn "log.*\(login\|auth.*fail\|access.denied\)" src/` — flag MEDIUM if absent
- console.log in production: `grep -rn "console\.log" --include="*.ts" src/ | grep -v ".test.\|.spec."`

**A10 (SSRF):** URL validation:
- User input in HTTP calls: `grep -rn "requests\.get.*request\.\|fetch(.*req\.\|axios.*req\." src/`
- Cloud metadata blocking: `grep -rn "169\.254\.169\.254\|metadata\.google" src/` — flag if absent in apps making outbound HTTP
- URL scheme validation: `grep -rn "file://\|gopher://\|dict://" src/`

### Appendix B: STOP Policy Edge Cases

**Status State Machine (4 values):**

| Status | Meaning | Orchestrator Action |
|---|---|---|
| `COMPLETE` | All skills ran | Proceed to Gate 4 normally |
| `STOPPED` | Halted due to STOP-level finding | Present STOP handler to user |
| `FAILED` | Tool crashed or returned unusable output | Retry once, then escalate as infrastructure issue |
| `PARTIAL` | Some skills skipped by task-size scaling | Proceed normally (intentional) |

**False Positive Downgrade: Resume, Don't Restart**
When user selects "False positive — downgrade to CRITICAL":
1. Add finding to `.claude/security-allowlist.md` (content-hash-based, not git-fingerprint-based — survives rebase/squash)
2. Update security-audit.md: Status → RESUMED, reclassify finding to CRITICAL
3. Resume from the NEXT skill after the one that triggered STOP (don't re-run completed skills)
4. On completion, set Status → COMPLETE

**STOP Exclusion Rules (check BEFORE triggering STOP):**
- **Path exclusions:** `*.md`, `docs/**`, `*.example`, `tests/**`, `fixtures/**`, `mocks/**`
- **Content exclusions:** AWS example keys (`AKIAIOSFODNN7EXAMPLE`), placeholder strings (`changeme`, `your-api-key-here`, `xxx`, `REPLACE_ME`, `TODO`), env var references (`${...}`, `process.env.`, `os.getenv(`)
- **Vendor exclusions:** Stripe test keys (`sk_test_`), Firebase API keys in client-side code (designed to be public)
- **Hash exclusions:** bcrypt/argon2 hashes (not secrets), content hashes matching `.claude/security-allowlist.md`

**Entropy thresholds (detect-secrets calibration):**
- < 3.0: not a secret (dictionary words, repeated chars)
- 3.5-4.5: gray zone — needs vendor prefix or context
- \> 4.5: likely real secret — flag as HIGH confidence

### Appendix C: Phase 5→3 Scoped Re-Audit Dispatch Prompt

```
Agent(
  subagent_type="agent-orchestrator:security-auditor",
  prompt="PHASE 5→3 SCOPED RE-AUDIT for [feature].
  Spec directory: .claude/specs/[feature]/
  Round-trip: 1

  ORIGINAL FINDINGS ROUTED FOR FIX:
  [SEC-001] [CRITICAL] [title] — [file:line]
  [SEC-003] [HIGH] [title] — [file:line]

  FILES CHANGED BY FIX: [list]

  SCOPED RE-AUDIT PROTOCOL (do NOT run full audit):
  1. VERIFY FIXES: Re-check SEC-001 and SEC-003 at original locations.
     Mark each as RESOLVED or PERSISTS.
  2. REGRESSION SCAN: Run security-reviewer on ALL changed files.
     Use Semgrep diff-aware: semgrep scan --config p/owasp-top-ten --baseline-commit [PRE_FIX_COMMIT] .
  3. DEPENDENCY RE-CHECK: If package.json/requirements.txt/go.mod changed,
     re-run dependency-audit on changed files only.
  4. DO NOT re-run: secrets-scanner (unless new files created),
     threat-modeling, compliance-checker.
  5. UPDATE security-audit.md with Round-trip: 1 and Fix History.
  6. RETURN: per-finding status, new findings count, regression detected Y/N,
     overall: CLEAN / PARTIAL / REGRESSION / STUCK."
)
```

**Orchestrator decision after re-audit:**

| Result | Action |
|---|---|
| CLEAN | Proceed to Phase 6. Security resolved. |
| PARTIAL | Escalate to user. Max 1 round-trip exhausted. Show remaining findings. |
| REGRESSION | Hard stop. Fix introduced NEW vulnerabilities. Escalate immediately. |
| STUCK | Escalate to user. Fix did not resolve the original finding. |

## Sources & References

### Origin
- **Brainstorm:** [docs/brainstorms/2026-03-15-phase5-security-auditor-brainstorm.md](docs/brainstorms/2026-03-15-phase5-security-auditor-brainstorm.md) — Key decisions: structured report with severity, Phase 5→3 routing for CRITICAL/HIGH, expand all 5 skills, stack-agnostic, STOP policy

### External References
- OWASP Top 10 2021 — complete category coverage
- CVSS v3.1 severity bands (CRITICAL 9.0-10.0, HIGH 7.0-8.9, MEDIUM 4.0-6.9, LOW 0.1-3.9)
- Semgrep rulesets: `p/owasp-top-ten`, `p/security-audit`, `p/secrets`
- Trivy: multi-purpose scanner (vulnerabilities, secrets, misconfigurations, SBOM)
- Gitleaks/TruffleHog: secret scanning with verification
- SARIF: Static Analysis Results Interchange Format (industry standard)

### SpecFlow Gaps Resolved
- Orchestrator dispatches feature-team for Phase 5→3 (not security-auditor)
- Re-audit is scoped (not full) after fix — re-check specific findings + changed files only
- STOP vs CRITICAL: STOP = real secret committed OR auth bypass with live deployment target
- Feature-team generalized to recognize "PHASE 5→3 FEEDBACK"
- Gate 4: user choice with recommendation, not auto-action
- security-audit.md has round-trip versioning and Fix History
- Compliance field added to project-config.md for standard selection
- STOP writes partial security-audit.md with Status: STOPPED
- Phase 5 dispatch includes Phase 4→3 fix files
- Dual-mode (Phase 5 full / Phase 6 spot-check) preserved
- A06 defers to dependency-audit (no duplicate scanning)
- Secrets-scanner has confidence scoring to reduce false positives
- Environment detection: skip tools for ecosystems not in project-config.md
