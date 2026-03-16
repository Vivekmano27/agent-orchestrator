---
name: secrets-scanner
description: Detect accidentally committed secrets — API keys, passwords, tokens, private keys, database URLs in code and config. Use when the user says "scan for secrets", "check for leaked keys", "secrets audit", or before any public repository push.
allowed-tools: Read, Grep, Glob, Bash
---

# Secrets Scanner Skill

Find and remediate leaked secrets in code. Runs FIRST in the security audit pipeline because committed secrets can trigger STOP (immediate pipeline halt).

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
GOOG[\w]{10,}                                  # GCP API Key
AIza[0-9A-Za-z\-_]{35}                         # Firebase / Google API Key
DefaultEndpointsProtocol=                      # Azure Connection String
AccountKey=                                    # Azure Storage Key

# Code Platforms
ghp_[A-Za-z0-9]{36}                           # GitHub Personal Access Token
gho_[A-Za-z0-9]{36}                           # GitHub OAuth Token
ghs_[A-Za-z0-9]{36}                           # GitHub Server-to-Server Token
glpat-[A-Za-z0-9\-]{20,}                      # GitLab Personal Access Token

# Communication
xoxb-[0-9A-Za-z\-]+                           # Slack Bot Token
xoxp-[0-9A-Za-z\-]+                           # Slack User Token

# AI/ML
sk-[A-Za-z0-9]{48}                            # OpenAI API Key

# Payment
sk_live_[A-Za-z0-9]{24,}                      # Stripe Secret Key
pk_live_[A-Za-z0-9]{24,}                      # Stripe Publishable Key
rk_live_[A-Za-z0-9]{24,}                      # Stripe Restricted Key

# Email/SMS
SG\.[\w\-]{22,}                               # SendGrid API Key
AC[a-z0-9]{32}                                # Twilio Account SID
SK[a-z0-9]{32}                                # Twilio Auth Token
key-[a-z0-9]{32}                              # Mailgun API Key

# Databases
(postgres|mysql|mongodb|redis)://[^\s]+        # Connection strings with embedded credentials

# Files & Tokens
-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----  # Private keys
eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+           # JWT Tokens
npm_[A-Za-z0-9]{36}                              # NPM Token
pypi-[A-Za-z0-9]{50,}                            # PyPI Token
hvs\.[A-Za-z0-9]{24,}                            # HashiCorp Vault Token
```

## Files to Flag (committed accidentally)
- `.env` (NOT `.env.example` or `.env.sample`)
- `*.tfstate` (Terraform state — contains cloud credentials)
- `*.pem`, `*.key`, `*.p12` (private key files in non-dev paths)

## STOP Trigger Rules

Distinguish confirmed secrets from false positives BEFORE triggering STOP:

**Triggers STOP (confirmed vendor-pattern match in production code):**
- Vendor-prefixed secret (`AKIA`, `sk_live_`, `ghp_`, `xoxb-`, `sk-`) in non-excluded path
- `.env` file committed (not `.env.example`) with non-placeholder values
- Private key files in non-dev paths
- `*.tfstate` committed to repository

**Does NOT trigger STOP (report as CRITICAL or HIGH instead):**

Path exclusions:
- `*.md`, `*.rst`, `docs/**`, `examples/**` (documentation)
- `*.example`, `*.sample`, `*.template` (template files)
- `tests/**`, `test/**`, `__tests__/**`, `*_test.*`, `*.test.*`, `*.spec.*`, `fixtures/**`, `mocks/**`

Content exclusions:
- Known example keys: `AKIAIOSFODNN7EXAMPLE`, `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
- Placeholder values: `changeme`, `your-api-key-here`, `xxx`, `REPLACE_ME`, `TODO`, `FIXME`, `fake`, `dummy`, `test`, `mock`, `sample`, `NOT_REAL`
- Environment variable references: `${...}`, `process.env.`, `os.environ`, `os.getenv(`
- Hashes (not secrets): strings starting with `$2b$`, `$argon2`, `sha256:`

Vendor exclusions:
- Stripe test keys: `sk_test_`, `pk_test_`, `rk_test_`
- Firebase/Google API keys (`AIza...`) in client-side code (designed to be public)

Content in `.claude/security-allowlist.md` (previously reviewed false positives, matched by content hash).

## Remediation Steps
1. Rotate the exposed secret immediately
2. Remove from git history: `git filter-branch` or BFG Repo Cleaner
3. Add pattern to `.gitignore`
4. Move secret to environment variable or secret manager
5. Set up pre-commit hook to prevent future leaks (Gitleaks pre-commit)
