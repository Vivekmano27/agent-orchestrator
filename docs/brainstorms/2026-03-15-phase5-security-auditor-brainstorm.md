# Brainstorm: Phase 5 Security Auditor Redesign

**Date:** 2026-03-15
**Status:** Decided
**Next:** `/ce:plan` to implement

---

## What We're Building

Redesign Phase 5 (Security) to match the structured quality of Phase 4 (quality-team). The security-auditor agent gets an execution protocol, structured security-audit.md template with severity classification, Phase 5→3 fix routing for CRITICAL/HIGH issues, stack-agnostic checks from project-config.md, and a STOP policy. All 5 security skills are expanded to full coverage.

### Current Problems

| Problem | Impact |
|---|---|
| security-auditor is only 73 lines — thinnest agent in the pipeline | No execution protocol, no structured output, no failure handling |
| No security-audit.md template defined | Orchestrator and Gate 4 parse free-text — fragile and unstructured |
| No severity classification in output | Can't distinguish CRITICAL (block deployment) from LOW (nice-to-have) |
| No Phase 5→3 fix routing | CRITICAL security issues found but no mechanism to route fixes back to implementation |
| Per-service checks hardcoded to NestJS/React/Flutter/Python | Violates stack-agnostic principle — doesn't read from project-config.md |
| security-reviewer skill skips 6/10 OWASP categories | Only covers A01, A02, A03, A07 — missing A04-A06, A08-A10 |
| compliance-checker missing HIPAA/CCPA/SOC2 | Description mentions them but skill only covers GDPR and PCI-DSS |
| No STOP policy for critical vulnerabilities | No equivalent of quality-team's "catastrophic" detection |

---

## Why This Approach

**Approach A: Full Structured Redesign** selected over two alternatives:

- **Approach B (Agent only, skills later):** Defers skill expansion — rejected because thin skills (20-54 lines) make the execution protocol less effective. Agent says "run OWASP check" but the skill only covers 4/10 categories.
- **Approach C (Merge into quality-team):** Already rejected twice (brainstorm 2026-03-15 + plan 005). Security deserves its own phase with full depth.

**Rationale:** Phase 4 went from 2 thin agents to a full quality-team with structured artifacts. Phase 5 has the same structural problems but with only 1 agent — so the fix is simpler (no team wrapper needed, just expand the agent and skills).

---

## Key Decisions

### 1. Add step-by-step execution protocol to security-auditor
- Match quality-team's pattern: numbered steps with clear inputs/outputs
- Step sequence: read specs → determine scope (task size) → run audit skills → classify findings → write security-audit.md → route CRITICAL/HIGH fixes → report to orchestrator
- Each step specifies which skills to invoke and in what order

### 2. Structured security-audit.md template with severity classification
- Write to `.claude/specs/[feature]/security-audit.md`
- Severity levels: CRITICAL (block deployment), HIGH (fix before merge), MEDIUM (fix in follow-up), LOW (suggestion)
- Each finding: severity, OWASP/STRIDE category, file:line, description, impact, recommended fix
- Summary table at top for Gate 4 to read
- Template structure:
  ```markdown
  # Security Audit — [feature-name]

  ## Summary
  | Severity | Count | Action |
  |---|---|---|
  | CRITICAL | [N] | BLOCK — fix immediately via Phase 5→3 |
  | HIGH | [N] | Fix before merge via Phase 5→3 |
  | MEDIUM | [N] | Fix in follow-up PR |
  | LOW | [N] | Suggestion — optional |

  ## Audit Scope
  - Task size: [SMALL/MEDIUM/BIG]
  - Services audited: [list from project-config.md]
  - Audit levels: [which skills ran]

  ## Findings
  ### [SEC-001] [CRITICAL] SQL Injection in user lookup
  **OWASP:** A03 Injection
  **File:** services/core-service/src/users/user.service.ts:47
  **Description:** Raw SQL query with string interpolation
  **Impact:** Full database compromise
  **Fix:** Use parameterized queries via Prisma/TypeORM

  ## Dependency Audit
  | Package | Severity | CVE | Fix |
  |---|---|---|---|
  | [package] | [severity] | [CVE-ID] | Upgrade to [version] |

  ## Secrets Scan
  | Finding | File | Action |
  |---|---|---|
  | [type] | [path:line] | [rotate/remove/move to env] |

  ## Compliance (BIG tasks only)
  | Standard | Status | Gaps |
  |---|---|---|
  | GDPR | PASS/FAIL | [gaps] |

  ## Recommendations
  - [prioritized list]
  ```

### 3. Phase 5→3 fix routing for CRITICAL/HIGH findings
- CRITICAL findings: block deployment, automatically route to feature-team for fix
- HIGH findings: route to feature-team for fix before merge
- MEDIUM/LOW: included in report, addressed in follow-up PRs
- Fix routing through feature-team (using targeted fix mode, same as Phase 4→3)
- Max **1 round-trip** (security fixes should be surgical — if it needs 2 rounds, escalate to user)
- Dispatch prompt: "PHASE 5→3 FEEDBACK: Security audit found CRITICAL/HIGH issues. [finding list]. Fix these security vulnerabilities."

### 4. Stack-agnostic checks from project-config.md
- Read tech stack from `.claude/specs/[feature]/project-config.md`
- Map framework to security concerns dynamically:
  - NestJS/Express → A01 (access control), A03 (injection via ORM), A07 (JWT validation)
  - Django → A03 (ORM injection), A05 (CSRF middleware), A07 (session auth)
  - React/Next.js → A03 (XSS), A07 (token storage), CSP headers
  - Flutter/KMP → secure storage, cert pinning, obfuscation
  - Python AI → prompt injection, API key exposure, cost control
- Remove hardcoded per-service audit table from agent
- Add "Security Concerns by Framework" lookup that reads project-config.md

### 5. Expand all 5 security skills to full coverage

**security-reviewer:** Add missing OWASP categories:
- A04: Insecure Design (threat modeling references)
- A05: Security Misconfiguration (default credentials, unnecessary features, stack traces)
- A06: Vulnerable and Outdated Components (link to dependency-audit)
- A08: Software and Data Integrity Failures (CI/CD pipeline security, unsigned updates)
- A09: Security Logging and Monitoring Failures (audit logging, alerting)
- A10: Server-Side Request Forgery (SSRF) (URL validation, allowlists)

**compliance-checker:** Add missing standards:
- HIPAA: PHI handling, access controls, audit trails, encryption at rest
- CCPA: data collection disclosure, opt-out, deletion rights
- SOC2: access management, change management, availability, encryption

**threat-modeling:** Add execution steps:
- Create data flow diagram (DFD) from architecture.md
- Apply STRIDE to each DFD element
- Rank threats by risk (likelihood × impact)
- Output structured threat table

**dependency-audit:** Add structured output table:
- Package, current version, vulnerability, CVE, severity, fix version
- License compatibility check

**secrets-scanner:** Add more patterns:
- GCP service account keys, Azure connection strings
- Stripe keys, Twilio credentials, SendGrid API keys
- Private key files (.pem, .key), certificate files
- .env files committed accidentally

### 6. STOP policy for critical vulnerabilities
- If audit finds a vulnerability that is **actively exploitable in production** (e.g., secrets committed, SQL injection on public endpoint, auth bypass) → STOP
- Report to orchestrator immediately — do not wait for remaining audit steps
- Orchestrator blocks entire pipeline and presents to user

### 7. Gate 4 reads from structured security-audit.md
- Gate 4 already combines Phase 4+5+6 results
- Update Gate 4 to read severity counts from security-audit.md Summary table
- If CRITICAL > 0, Gate 4 automatically selects "More testing needed" (security variant)

---

## Changes Required

### Files to modify
- `agents/security-auditor.md` — Full rewrite: execution protocol, structured output, Phase 5→3 routing, STOP policy, stack-agnostic
- `agents/project-orchestrator.md` — Add Phase 5→3 feedback loop, update Gate 4 to read security-audit.md
- `skills/security-reviewer/SKILL.md` — Add OWASP A04-A06, A08-A10
- `skills/compliance-checker/SKILL.md` — Add HIPAA, CCPA, SOC2
- `skills/threat-modeling/SKILL.md` — Add execution steps, DFD creation, structured output
- `skills/dependency-audit/SKILL.md` — Add structured output table
- `skills/secrets-scanner/SKILL.md` — Add more patterns (GCP, Azure, Stripe, etc.)

### No new files needed
- security-auditor stays as single agent (no team wrapper)
- No new skills needed — expand existing 5

---

## Resolved Questions
- *Should Phase 5 use a team wrapper?* → No. Single agent with expanded execution protocol is sufficient.
- *Should security merge into quality-team?* → No. Already rejected twice. Security deserves its own phase.
- *What severity levels?* → CRITICAL/HIGH/MEDIUM/LOW matching review-team's report format.
- *How deep should fix routing go?* → CRITICAL + HIGH auto-route to feature-team. Max 1 round-trip.
- *Should checks be stack-agnostic?* → Yes. Read from project-config.md.
- *Which OWASP categories are missing?* → A04, A05, A06, A08, A09, A10.
- *Which compliance standards are missing?* → HIPAA, CCPA, SOC2.

## Open Questions

None — all questions resolved during brainstorm.
