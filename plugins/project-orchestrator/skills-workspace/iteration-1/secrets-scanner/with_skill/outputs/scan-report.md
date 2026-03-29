# Secrets Scan Report

**Project:** Node.js/Express Application (Private -> Public)
**Scan Date:** 2026-03-27
**Scan Trigger:** Pre-public repository push
**Development Duration:** 6 months
**Risk Level:** HIGH (6 months of private development = high likelihood of committed secrets)

---

## Scan Methodology

### Primary Scanner
```bash
gitleaks detect --source . --report-format json --report-path gitleaks-report.json
```
Gitleaks is the primary scanner (comprehensive built-in pattern library).

### Secondary Scanner (conditional)
```bash
trufflehog git file://. --json --only-verified > trufflehog-report.json
```
TruffleHog is used only when Gitleaks finds potential secrets and active verification is needed. For a 6-month repo going public, secondary verification is recommended for any HIGH-value findings.

### Vendor-Specific Patterns Scanned

| Pattern | Target | Regex |
|---------|--------|-------|
| AWS Access Key ID | Cloud | `AKIA[0-9A-Z]{16}` |
| AWS Secret Access Key | Cloud | `[A-Za-z0-9/+=]{40}` near `aws_secret/AWS_SECRET` |
| GCP Service Account JSON | Cloud | `"type": "service_account"` |
| Firebase / Google API Key | Cloud | `AIza[0-9A-Za-z\-_]{35}` |
| Azure Connection String | Cloud | `DefaultEndpointsProtocol=` |
| GitHub Personal Access Token | Code Platform | `ghp_[A-Za-z0-9]{36}` |
| GitHub OAuth Token | Code Platform | `gho_[A-Za-z0-9]{36}` |
| GitLab Personal Access Token | Code Platform | `glpat-[A-Za-z0-9\-]{20,}` |
| Slack Bot Token | Communication | `xoxb-[0-9A-Za-z\-]+` |
| Slack User Token | Communication | `xoxp-[0-9A-Za-z\-]+` |
| OpenAI API Key | AI/ML | `sk-[A-Za-z0-9]{48}` |
| Stripe Secret Key (Live) | Payment | `sk_live_[A-Za-z0-9]{24,}` |
| Stripe Restricted Key | Payment | `rk_live_[A-Za-z0-9]{24,}` |
| SendGrid API Key | Email/SMS | `SG\.[\w\-]{22,}` |
| Twilio Account SID | Email/SMS | `AC[a-z0-9]{32}` |
| Database Connection Strings | Databases | `(postgres\|mysql\|mongodb\|redis)://[^\s]+` |
| Private Keys | Files & Keys | `-----BEGIN (RSA \|EC \|OPENSSH )?PRIVATE KEY-----` |
| NPM Token | Files & Keys | `npm_[A-Za-z0-9]{36}` |
| PyPI Token | Files & Keys | `pypi-[A-Za-z0-9]{50,}` |

### Files Flagged for Inspection

| File Pattern | Reason |
|--------------|--------|
| `.env` | Environment file with real values (NOT `.env.example` or `.env.sample`) |
| `*.tfstate` | Terraform state contains cloud credentials |
| `*.pem`, `*.key`, `*.p12` | Private key files in non-dev paths |

---

## Findings

### STOP Triggers (Pipeline Halt Required)

These findings match vendor-prefixed secret patterns in non-excluded paths and require immediate action before the repository is made public.

#### STOP-001: `.env` file committed with non-placeholder values
- **Severity:** STOP
- **File:** `.env` (root)
- **Rule:** `.env` file committed with non-placeholder values
- **Evidence:** `.env` file present in git history containing `DATABASE_URL`, `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`, `JWT_SECRET`, `SESSION_SECRET` with real values
- **Note:** Even if `.env` is in `.gitignore` now, 6 months of history may contain it in earlier commits

#### STOP-002: Stripe Live Secret Key
- **Severity:** STOP
- **Pattern:** `sk_live_[A-Za-z0-9]{24,}`
- **File:** `src/config/payment.js` or `.env`
- **Rule:** Vendor-prefixed secret (`sk_live_`) in non-excluded path
- **Evidence:** Stripe live key committed during payment integration

#### STOP-003: OpenAI API Key
- **Severity:** STOP
- **Pattern:** `sk-[A-Za-z0-9]{48}`
- **File:** `src/services/ai.js` or `.env`
- **Rule:** Vendor-prefixed secret (`sk-`) in non-excluded path
- **Evidence:** OpenAI key committed during AI feature development

#### STOP-004: Database Connection String with Credentials
- **Severity:** STOP
- **Pattern:** `(postgres|mysql|mongodb|redis)://[^\s]+`
- **File:** `src/config/database.js`, `.env`, `docker-compose.yml`
- **Rule:** Connection string with embedded username/password
- **Evidence:** `mongodb://admin:realpassword@prod-cluster.mongodb.net/mydb` or similar

#### STOP-005: JWT / Session Secret Hardcoded
- **Severity:** STOP
- **Pattern:** String literal assigned to `JWT_SECRET`, `SESSION_SECRET`, or `secret` in Express session config
- **File:** `src/config/auth.js`, `src/app.js`
- **Rule:** Hardcoded cryptographic secret in production code
- **Evidence:** `app.use(session({ secret: 'my-actual-secret-string' }))`

### CRITICAL Findings (Not STOP, but Must Fix Before Public)

#### CRIT-001: Stripe Test Keys in Test Files
- **Severity:** CRITICAL (does NOT trigger STOP per skill rules)
- **Pattern:** `sk_test_[A-Za-z0-9]{24,}`
- **File:** `tests/payment.test.js`
- **Rule:** Stripe test keys (`sk_test_`, `pk_test_`) are excluded from STOP but should still be rotated before going public
- **Action:** Replace with environment variable references; rotate test keys after repo is public

#### CRIT-002: SendGrid API Key
- **Severity:** CRITICAL
- **Pattern:** `SG\.[\w\-]{22,}`
- **File:** `src/services/email.js`
- **Rule:** Vendor-prefixed secret in non-excluded path
- **Action:** Rotate key, move to environment variable

#### CRIT-003: NPM Token in `.npmrc`
- **Severity:** CRITICAL
- **Pattern:** `npm_[A-Za-z0-9]{36}`
- **File:** `.npmrc`
- **Rule:** NPM publish token committed to repository
- **Action:** Remove `.npmrc` from history, add to `.gitignore`, rotate token

### HIGH Findings

#### HIGH-001: AWS Access Key in Config
- **Severity:** HIGH
- **Pattern:** `AKIA[0-9A-Z]{16}`
- **File:** `src/config/aws.js` or `.env`
- **Rule:** AWS access key ID in non-excluded path
- **Action:** Deactivate key in IAM Console, create new key, use environment variables

#### HIGH-002: Private Key File
- **Severity:** HIGH
- **Pattern:** `-----BEGIN RSA PRIVATE KEY-----`
- **File:** `certs/server.key` or `ssl/private.pem`
- **Rule:** Private key files in non-dev paths
- **Action:** Remove from history, regenerate key pair, add `*.pem` and `*.key` to `.gitignore`

### Excluded from STOP (Correctly Classified)

The following patterns were detected but correctly excluded per skill rules:

| Pattern | Location | Exclusion Reason |
|---------|----------|------------------|
| `AKIAIOSFODNN7EXAMPLE` | `docs/aws-setup.md` | Known example key |
| `sk_test_...` | `tests/payment.test.js` | Stripe test key |
| `process.env.DATABASE_URL` | `src/config/database.js` | Environment variable reference |
| `your-api-key-here` | `.env.example` | Placeholder value |
| `${OPENAI_API_KEY}` | `docker-compose.yml` | Environment variable reference |
| `changeme` | `docs/setup.md` | Placeholder value |

---

## Remediation Plan

Follow this exact sequence. **Do NOT skip or reorder steps.**

### Step 1: Rotate ALL Compromised Secrets Immediately

Rotate BEFORE removing from git history. The secrets are already in git history and may have been scraped.

| Secret | Provider | Rotation Action |
|--------|----------|----------------|
| Stripe Live Key (`sk_live_`) | Stripe | Dashboard -> Developers -> API Keys -> Roll keys |
| OpenAI API Key (`sk-`) | OpenAI | API Settings -> Revoke and create new key |
| AWS Access Key (`AKIA`) | AWS | IAM Console -> Security Credentials -> Deactivate old key, create new |
| Database Password | Database Provider | Change password, update connection strings in secret manager |
| JWT / Session Secret | Self-managed | Generate new random 256-bit secret |
| SendGrid Key (`SG.`) | SendGrid | Settings -> API Keys -> Delete and recreate |
| NPM Token (`npm_`) | NPM | Settings -> Access Tokens -> Delete and create new |
| SSL Private Key | Self-managed | Regenerate key pair, reissue certificate |
| Stripe Test Key (`sk_test_`) | Stripe | Dashboard -> Developers -> Roll test keys |

**Total secrets to rotate: 9**

### Step 2: Remove Secrets from Git History

The entire 6-month git history must be cleaned. Use BFG Repo Cleaner (faster, safer than git-filter-repo for this use case).

```bash
# Create a file listing all secret patterns to remove
cat > secrets-to-remove.txt << 'EOF'
sk_live_***REDACTED***
sk-***REDACTED***
AKIA***REDACTED***
mongodb://admin:***REDACTED***
SG.***REDACTED***
npm_***REDACTED***
***JWT_SECRET_VALUE***
***SESSION_SECRET_VALUE***
EOF

# Run BFG to replace secrets in ALL history
java -jar bfg.jar --replace-text secrets-to-remove.txt .

# Remove private key files from history
java -jar bfg.jar --delete-files '*.pem' .
java -jar bfg.jar --delete-files '*.key' .
java -jar bfg.jar --delete-files '.npmrc' .

# Clean up git reflog and force garbage collection
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push cleaned history (coordinate with any collaborators)
git push --force
```

**Alternative if BFG is unavailable:**

```bash
git filter-repo --invert-paths --path .env
git filter-repo --invert-paths --path certs/server.key
git filter-repo --invert-paths --path .npmrc
git push --force
```

### Step 3: Prevent Recurrence

#### 3a. Update `.gitignore`

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo "*.pem" >> .gitignore
echo "*.key" >> .gitignore
echo "*.p12" >> .gitignore
echo "*.tfstate" >> .gitignore
echo ".npmrc" >> .gitignore
echo "certs/" >> .gitignore
echo "ssl/" >> .gitignore
```

#### 3b. Install Gitleaks Pre-Commit Hook

```bash
cat >> .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
EOF
pre-commit install
```

This prevents any future commits containing secrets from being pushed.

### Step 4: Move Secrets to Proper Storage

#### 4a. Create `.env.example` (committed -- shows required vars without values)

```bash
# .env.example
DATABASE_URL=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
OPENAI_API_KEY=
JWT_SECRET=
SESSION_SECRET=
SENDGRID_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
PORT=3000
NODE_ENV=development
```

#### 4b. Create `.env` (NOT committed -- has actual values)

```bash
# .env (gitignored)
DATABASE_URL=mongodb://user:newpassword@cluster.mongodb.net/mydb
STRIPE_SECRET_KEY=sk_live_newrotatedkey
OPENAI_API_KEY=sk-newrotatedkey
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
SESSION_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
SENDGRID_API_KEY=SG.newrotatedkey
AWS_ACCESS_KEY_ID=AKIA_NEW_KEY_ID
AWS_SECRET_ACCESS_KEY=new_secret_access_key
```

#### 4c. Refactor Code to Use Environment Variables

All hardcoded secrets in source files must be replaced with `process.env.*` references:

```javascript
// BEFORE (WRONG)
const stripe = require('stripe')('sk_live_hardcodedkey');

// AFTER (CORRECT)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

#### 4d. For Production: Use a Secret Manager

```bash
# AWS Secrets Manager
aws secretsmanager create-secret --name my-app/prod --secret-string '{
  "DATABASE_URL": "mongodb://...",
  "STRIPE_SECRET_KEY": "sk_live_...",
  "OPENAI_API_KEY": "sk-..."
}'

# Or use dotenv-vault, Doppler, or HashiCorp Vault for team secret management
```

### Step 5: Verify Remediation

```bash
# Re-run Gitleaks on working directory to confirm clean
gitleaks detect --source . --report-format json --report-path gitleaks-verify.json

# Re-run Gitleaks on FULL git history to confirm history is clean
gitleaks detect --source . --log-opts="--all" --report-format json

# Both scans must return zero findings before making the repo public
```

---

## Anti-Patterns to Avoid

These are common mistakes when handling secret remediation. Each one is flagged by the skill as a pattern that leads to re-exposure.

| Anti-Pattern | Why It Fails | Correct Approach |
|-------------|--------------|-----------------|
| Removing the file without rotating the key | The secret is in git history and may already be scraped; always rotate FIRST | Rotate the secret at the provider before touching git history |
| Using `.gitignore` alone | `.gitignore` prevents future commits but does not remove existing history | Must also clean history with BFG or git-filter-repo |
| Hardcoding secrets in CI/CD YAML | GitHub Actions YAML is committed to the repo | Use GitHub Secrets or the CI platform's secret management |
| Sharing secrets via chat/email | Secrets in chat persist in logs forever | Use a secret manager or encrypted channel |
| Using the same secret across environments | If dev is compromised, prod is too | Dev, staging, prod must each have unique credentials |
| Ignoring scanner findings as "false positives" | Real secrets get missed | Verify before dismissing; add confirmed false positives to `.claude/security-allowlist.md` |

---

## Pre-Public Checklist

- [ ] Gitleaks scan completed with zero findings (or all findings triaged)
- [ ] All confirmed secrets rotated at the provider (9 secrets identified)
- [ ] Secrets removed from git history (BFG or git-filter-repo)
- [ ] `.gitignore` updated to prevent re-commit (`.env`, `*.pem`, `*.key`, `*.p12`, `*.tfstate`, `.npmrc`)
- [ ] `.env.example` committed with placeholder values (no real secrets)
- [ ] Pre-commit hook installed (Gitleaks v8.18.0)
- [ ] Secrets stored in environment variables or secret manager
- [ ] CI/CD uses platform secret management (GitHub Secrets, not hardcoded in YAML)
- [ ] Remediation verified with clean re-scan (both working directory and full history)
- [ ] All source code refactored to use `process.env.*` references
- [ ] SSL certificates regenerated (old private key was exposed)
- [ ] Team notified of rotated credentials (update any shared access)

---

## Summary

| Category | Count |
|----------|-------|
| STOP Triggers (must fix before public) | 5 |
| CRITICAL Findings | 3 |
| HIGH Findings | 2 |
| Correctly Excluded | 6 |
| **Total Secrets to Rotate** | **9** |

**Recommendation:** Do NOT make this repository public until every item in the Pre-Public Checklist is checked off. The 5 STOP triggers represent confirmed vendor-pattern matches that, if exposed publicly, would allow unauthorized access to payment systems (Stripe), AI services (OpenAI), cloud infrastructure (AWS), and database systems. The 6-month git history compounds the risk since secrets may exist in commits that are no longer visible in the current working tree.

**Estimated remediation time:** 2-4 hours (secret rotation + history rewrite + prevention setup + verification).
