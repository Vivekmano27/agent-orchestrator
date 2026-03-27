---
name: secrets-scanner
description: "Detect accidentally committed secrets — API keys, passwords, tokens, private keys, database URLs in code and config. Use when the user says \"scan for secrets\", \"check for leaked keys\", \"secrets audit\", or before any public repository push. Also use when setting up pre-commit hooks for secret prevention or when onboarding a new project to verify no secrets are committed."
allowed-tools: Read, Grep, Glob, Bash
---

# Secrets Scanner Skill

Find and remediate leaked secrets in code. Runs FIRST in the security audit pipeline because committed secrets can trigger STOP (immediate pipeline halt).

## When to Use

- Before making a repository public
- During security audit (Phase 5 of the pipeline)
- Setting up a new project's secret management
- After a developer reports they may have committed a secret
- Periodic scanning as part of CI/CD
- When onboarding a project that hasn't been audited

## Tool Commands

```bash
# Primary scanner (fast, pattern-based)
gitleaks detect --source . --report-format json --report-path gitleaks-report.json

# Optional secondary (verifies if secrets are ACTIVE — slower, use for HIGH-value findings)
trufflehog git file://. --json --only-verified > trufflehog-report.json
```

Gitleaks is the primary scanner (comprehensive built-in pattern library). TruffleHog is optional for active verification of found secrets. Do not run both on every audit — use TruffleHog only when Gitleaks finds potential secrets and verification is needed.

## Vendor-Specific Patterns

```regex
# Cloud Providers
AKIA[0-9A-Z]{16}                              # AWS Access Key ID
[A-Za-z0-9/+=]{40}  (near aws_secret/AWS_SECRET)  # AWS Secret Access Key
"type": "service_account"                      # GCP Service Account JSON
AIza[0-9A-Za-z\-_]{35}                         # Firebase / Google API Key
DefaultEndpointsProtocol=                      # Azure Connection String

# Code Platforms
ghp_[A-Za-z0-9]{36}                           # GitHub Personal Access Token
gho_[A-Za-z0-9]{36}                           # GitHub OAuth Token
glpat-[A-Za-z0-9\-]{20,}                      # GitLab Personal Access Token

# Communication
xoxb-[0-9A-Za-z\-]+                           # Slack Bot Token
xoxp-[0-9A-Za-z\-]+                           # Slack User Token

# AI/ML
sk-[A-Za-z0-9]{48}                            # OpenAI API Key

# Payment
sk_live_[A-Za-z0-9]{24,}                      # Stripe Secret Key
rk_live_[A-Za-z0-9]{24,}                      # Stripe Restricted Key

# Email/SMS
SG\.[\w\-]{22,}                               # SendGrid API Key
AC[a-z0-9]{32}                                # Twilio Account SID

# Databases
(postgres|mysql|mongodb|redis)://[^\s]+        # Connection strings with credentials

# Files & Keys
-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----  # Private keys
npm_[A-Za-z0-9]{36}                              # NPM Token
pypi-[A-Za-z0-9]{50,}                            # PyPI Token
```

## Files to Flag

- `.env` (NOT `.env.example` or `.env.sample`)
- `*.tfstate` (Terraform state — contains cloud credentials)
- `*.pem`, `*.key`, `*.p12` (private key files in non-dev paths)

## STOP Trigger Rules

**Triggers STOP (confirmed vendor-pattern match in production code):**
- Vendor-prefixed secret (`AKIA`, `sk_live_`, `ghp_`, `xoxb-`, `sk-`) in non-excluded path
- `.env` file committed with non-placeholder values
- Private key files in non-dev paths
- `*.tfstate` committed to repository

**Does NOT trigger STOP (report as CRITICAL or HIGH instead):**
- Files in `docs/**`, `examples/**`, `*.example`, `*.sample`
- Test files (`tests/**`, `*.test.*`, `*.spec.*`, `fixtures/**`)
- Known example keys (`AKIAIOSFODNN7EXAMPLE`)
- Placeholder values (`changeme`, `your-api-key-here`, `xxx`, `REPLACE_ME`)
- Environment variable references (`${...}`, `process.env.`, `os.environ`)
- Stripe test keys (`sk_test_`, `pk_test_`)

## Remediation Workflow

When a secret is found, follow this exact sequence:

### Step 1: Rotate the Secret Immediately

Do this BEFORE removing from git history. The secret is already exposed.

| Provider | Rotation Action |
|----------|----------------|
| AWS | IAM Console → Security Credentials → Deactivate old key, create new |
| GitHub | Settings → Developer Settings → Personal Access Tokens → Regenerate |
| Stripe | Dashboard → Developers → API Keys → Roll keys |
| OpenAI | API Settings → Revoke and create new key |
| Database | Change password, update connection strings in secret manager |

### Step 2: Remove from Git History

```bash
# Option A: BFG Repo Cleaner (recommended — faster, safer)
java -jar bfg.jar --replace-text secrets-to-remove.txt .
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force

# Option B: git-filter-repo (if BFG unavailable)
git filter-repo --invert-paths --path path/to/secret-file
git push --force
```

### Step 3: Prevent Recurrence

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo "*.pem" >> .gitignore
echo "*.tfstate" >> .gitignore

# Install Gitleaks pre-commit hook
cat >> .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
EOF
pre-commit install
```

### Step 4: Move Secrets to Proper Storage

```bash
# Environment variables (local development)
# .env.example (committed — shows required vars without values)
DATABASE_URL=
STRIPE_SECRET_KEY=
OPENAI_API_KEY=

# .env (NOT committed — has actual values)
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
STRIPE_SECRET_KEY=sk_live_xxx
OPENAI_API_KEY=sk-xxx

# For production: use a secret manager
# AWS: aws secretsmanager create-secret --name my-app/prod --secret-string '...'
# GCP: gcloud secrets create my-secret --data-file=secret.txt
# Vault: vault kv put secret/my-app api_key=xxx
```

### Step 5: Verify Remediation

```bash
# Re-run scan to confirm clean
gitleaks detect --source . --report-format json --report-path gitleaks-verify.json

# Check git history is clean
gitleaks detect --source . --log-opts="--all" --report-format json
```

## Anti-Patterns

- **Removing the file without rotating the key** — the secret is in git history and may already be scraped; always rotate FIRST
- **Using .gitignore alone** — .gitignore prevents future commits but doesn't remove existing history; must also clean history
- **Hardcoding secrets in CI/CD YAML** — use CI platform's secret management (GitHub Secrets, GitLab CI Variables)
- **Sharing secrets via chat/email** — use a secret manager or encrypted channel; secrets in chat persist in logs
- **Using the same secret across environments** — dev, staging, prod must each have unique credentials
- **Ignoring scanner findings as "false positives"** — verify before dismissing; add confirmed false positives to `.claude/security-allowlist.md`

## Checklist

- [ ] Gitleaks scan completed with zero findings (or all findings triaged)
- [ ] All confirmed secrets rotated at the provider
- [ ] Secret removed from git history (BFG or git-filter-repo)
- [ ] `.gitignore` updated to prevent re-commit
- [ ] `.env.example` committed with placeholder values
- [ ] Pre-commit hook installed (Gitleaks)
- [ ] Secrets stored in environment variables or secret manager
- [ ] CI/CD uses platform secret management (not hardcoded)
- [ ] Remediation verified with clean re-scan
