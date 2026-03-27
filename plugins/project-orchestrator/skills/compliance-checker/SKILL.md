---
name: compliance-checker
description: Validate compliance with GDPR, CCPA, HIPAA, PCI-DSS, SOC2. Check data handling, consent flows, audit logging, and data retention. Use when the user mentions regulatory compliance or needs to ensure their application meets legal requirements.
allowed-tools: Read, Grep, Glob, Bash
---

# Compliance Checker Skill

## Step 1 — Identify Applicable Frameworks

Read `project-config.md` to determine which regulations apply. If the project handles:
- EU user data -> GDPR
- California residents' data -> CCPA
- Health information (US) -> HIPAA
- Payment card data -> PCI-DSS
- Enterprise SaaS customers -> SOC 2

If `project-config.md` doesn't specify, scan for indicators:

```bash
# PII fields in models/schemas
grep -rn "email\|phone\|ssn\|social_security\|date_of_birth\|address\|ip_address\|firstName\|lastName\|creditCard" --include="*.ts" --include="*.py" --include="*.prisma" --include="*.graphql" --include="*.proto"

# Health data indicators
grep -rn "diagnosis\|patient\|medical\|prescription\|health_record\|PHI\|ePHI" --include="*.ts" --include="*.py" --include="*.prisma"

# Payment handling
grep -rn "stripe\|braintree\|paypal\|card_number\|cvv\|payment_intent\|charge\.create" --include="*.ts" --include="*.py" --include="*.go"

# Cookie/consent banners
grep -rn "cookie\|consent\|gdpr\|opt.out\|opt.in\|tracking\|analytics" --include="*.ts" --include="*.tsx" --include="*.jsx" --include="*.html"

# Audit logging
grep -rn "audit\|activityLog\|event_log\|createAuditEntry\|log_action" --include="*.ts" --include="*.py" --include="*.go"

# Data retention / deletion
grep -rn "softDelete\|deletedAt\|purge\|retention\|TTL\|expir" --include="*.ts" --include="*.py" --include="*.prisma"
```

## Step 2 — Run Framework-Specific Checks

### GDPR Checks

**Consent collection** — find every form that collects PII and verify explicit opt-in:
```bash
grep -rn "checkbox\|Checkbox\|consent\|opt.in\|agree" --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.html"
```
Violation: pre-checked consent boxes, bundled consent (one checkbox for multiple purposes), or no consent record stored.

**Right to erasure** — verify hard-delete or anonymization exists for user records:
```bash
grep -rn "deleteUser\|removeUser\|anonymize\|eraseUser\|purgeUser\|gdprDelete" --include="*.ts" --include="*.py" --include="*.go"
```
Check that the deletion cascades to ALL related tables/collections. A user delete that orphans records in `orders`, `comments`, `audit_logs` is a violation.

**Data encryption at rest** — check ORM/model layer:

Django example (compliant):
```python
from django_cryptography.fields import encrypt
class UserProfile(models.Model):
    ssn = encrypt(models.CharField(max_length=11))
    date_of_birth = encrypt(models.DateField())
```

Prisma example (requires application-level encryption):
```typescript
// In the service layer, encrypt before save
import { createCipheriv, createDecipheriv } from 'crypto';
const encrypted = encrypt(user.ssn, process.env.FIELD_ENCRYPTION_KEY);
await prisma.user.create({ data: { ...user, ssn: encrypted } });
```

TypeORM example (compliant — use transformer):
```typescript
@Column({
  type: 'varchar',
  transformer: new EncryptionTransformer({
    key: process.env.FIELD_ENCRYPTION_KEY,
    algorithm: 'aes-256-gcm',
  }),
})
ssn: string;
```

### CCPA Checks

**"Do Not Sell" mechanism:**
```bash
grep -rn "doNotSell\|do_not_sell\|optOut\|opt_out\|ccpa" --include="*.ts" --include="*.tsx" --include="*.py"
```
Must find: a user-facing toggle, a stored preference, and enforcement in any data-sharing code paths.

**Data inventory** — every third-party SDK that receives user data must be catalogued:
```bash
grep -rn "analytics\|segment\|mixpanel\|amplitude\|google.*tag\|facebook.*pixel\|intercom\|hubspot" --include="*.ts" --include="*.tsx" --include="*.html"
```
Each hit = a data processor that must appear in the privacy policy.

### HIPAA Checks

**Access controls** — every endpoint touching health data must have role-based guards:

NestJS example (compliant):
```typescript
@UseGuards(AuthGuard, RolesGuard)
@Roles('physician', 'nurse')
@Get('patient/:id/records')
async getPatientRecords(@Param('id') id: string) { ... }
```

**Audit trail** — every read/write of PHI must be logged with who, what, when:
```bash
grep -rn "patient\|medical\|prescription\|diagnosis" --include="*.controller.ts" --include="*.resolver.ts" --include="*.views.py"
```
For every hit, verify the handler calls an audit-log function before returning. No audit log = HIPAA violation.

**Transmission encryption** — verify TLS enforcement:
```bash
grep -rn "http://" --include="*.ts" --include="*.py" --include="*.env*" --include="*.yml"
```
Any non-localhost `http://` URL is a finding.

### PCI-DSS Checks

**Card data storage** — must NEVER store raw card numbers:
```bash
grep -rn "card_number\|cardNumber\|pan\|credit_card\|cc_number" --include="*.ts" --include="*.py" --include="*.prisma" --include="*.sql"
```
Any hit in a model/schema/migration is a critical violation. Only tokenized references (e.g., Stripe `pm_` or `tok_` IDs) are acceptable.

### SOC 2 Checks

**Change management** — verify CI/CD enforces review:
```bash
# Check for branch protection config
find . -name "*.yml" -path "*/.github/*" | head -20
grep -rn "required_approving_review_count\|CODEOWNERS\|protected_branch" --include="*.yml" --include="*.json"
```

**Monitoring and alerting:**
```bash
grep -rn "sentry\|datadog\|newrelic\|pagerduty\|alert\|monitor\|healthcheck\|health_check" --include="*.ts" --include="*.py" --include="*.yml" --include="*.yaml"
```

## Output Format

Write to `.claude/specs/{feature}/compliance-report.md`:

```markdown
# Compliance Report — {Project Name}

**Date:** {YYYY-MM-DD}
**Frameworks evaluated:** {GDPR, CCPA, HIPAA, PCI-DSS, SOC 2}
**Overall status:** {PASS / FAIL — number of critical findings}

## Compliance Matrix

| # | Requirement | Framework | Status | Evidence | File(s) | Remediation |
|---|-------------|-----------|--------|----------|---------|-------------|
| 1 | Explicit consent collection | GDPR Art. 7 | PASS/FAIL | {what was found or missing} | {file:line} | {specific fix if FAIL} |
| 2 | Right to erasure | GDPR Art. 17 | PASS/FAIL | ... | ... | ... |

## PII Inventory

| Field | Model/Table | Encrypted at Rest | Encrypted in Transit | Retention Policy | Deletion Cascade |
|-------|-------------|-------------------|----------------------|------------------|------------------|
| email | User | No | Yes (TLS) | Indefinite | Yes |
| ssn | UserProfile | Yes (AES-256) | Yes (TLS) | 7 years | Yes |

## Third-Party Data Processors

| Service | Data Shared | Purpose | Privacy Policy Link | Opt-Out Mechanism |
|---------|-------------|---------|--------------------|--------------------|
| Segment | user events | Analytics | {URL} | {doNotSell flag / none} |

## Critical Violations (Must Fix Before Deploy)

1. **{Title}** — {framework reference, e.g., GDPR Art. 17}
   - **Finding:** {what is wrong, with file:line}
   - **Risk:** {what happens if not fixed}
   - **Fix:** {exact code change}

## Recommendations (Non-Blocking)

1. {Improvement with specific implementation guidance}
```

## Constraints

- Never mark a requirement as PASS without citing the file and line that implements it. "Assumed compliant" is not evidence.
- If a framework does not apply (e.g., HIPAA for a blog), explicitly state it is not applicable and why. Do not silently skip it.
- Do not reproduce regulation text. The agent's job is to find code-level evidence, not teach law.
- PII fields discovered in Step 1 that lack encryption MUST appear as findings, even if the developer says "it's fine." Compliance is binary.
- If the codebase has no audit logging at all, that is a single critical finding, not one finding per endpoint. Don't inflate the report.

## Anti-Patterns

- **Assumed compliance** — marking requirements as PASS without code evidence; every PASS needs a file:line citation
- **Copy-pasting regulation text** — reproducing legal language instead of checking code; the agent finds evidence, not teaches law
- **Inflating findings** — creating one finding per endpoint for a systemic issue; "no audit logging" is one finding, not twenty
- **Ignoring N/A frameworks** — silently skipping non-applicable regulations; explicitly state why a framework doesn't apply
- **Compliance without consent** — checking data handling without verifying consent mechanisms exist
- **No data flow tracing** — checking storage encryption without tracing where PII enters, flows, and exits the system

## Checklist

- [ ] Applicable regulations identified (GDPR, CCPA, HIPAA, PCI-DSS, SOC2)
- [ ] PII fields discovered and cataloged
- [ ] Data flow traced (ingress, storage, processing, egress)
- [ ] Encryption verified for PII at rest and in transit
- [ ] Consent mechanisms checked (opt-in, opt-out, data deletion)
- [ ] Audit logging verified for sensitive operations
- [ ] Data retention policies documented
- [ ] Every PASS finding cites specific file:line evidence
- [ ] Non-applicable frameworks explicitly noted with rationale
- [ ] Report saved to `.claude/specs/[feature]/compliance-report.md`
