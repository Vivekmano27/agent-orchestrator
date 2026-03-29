# Secrets Scan Report: Pre-Public Repository Audit

**Date:** 2026-03-27
**Context:** Node.js/Express application, 6 months of private development, preparing for public release on GitHub.

---

## 1. What to Scan For

### 1.1 API Keys and Tokens

| Secret Type | Common Patterns to Search For |
|---|---|
| AWS credentials | `AKIA[0-9A-Z]{16}`, `aws_access_key_id`, `aws_secret_access_key` |
| Google Cloud / Firebase | `AIza[0-9A-Za-z\\-_]{35}`, `GOOG[\w]+`, `firebase`, service account JSON files |
| Stripe keys | `sk_live_[0-9a-zA-Z]{24,}`, `sk_test_`, `pk_live_`, `rk_live_` |
| SendGrid | `SG\.[0-9A-Za-z\\-_]{22}\.[0-9A-Za-z\\-_]{43}` |
| Twilio | `SK[0-9a-fA-F]{32}`, `AC[0-9a-fA-F]{32}` |
| Slack tokens | `xoxb-`, `xoxp-`, `xoxo-`, `xapp-` |
| GitHub tokens | `ghp_[0-9a-zA-Z]{36}`, `gho_`, `ghs_`, `ghr_`, `github_pat_` |
| Generic API keys | `api_key`, `apikey`, `api-key`, `x-api-key` |
| OAuth secrets | `client_secret`, `oauth_token`, `access_token`, `refresh_token` |

### 1.2 Database Connection Strings

| Secret Type | Common Patterns to Search For |
|---|---|
| PostgreSQL | `postgres://`, `postgresql://` with embedded passwords |
| MongoDB | `mongodb://`, `mongodb+srv://` with embedded credentials |
| MySQL | `mysql://` with embedded passwords |
| Redis | `redis://` with passwords, `REDIS_PASSWORD` |
| Generic DSN | Any URI with `username:password@host` pattern |

### 1.3 Private Keys and Certificates

| Secret Type | Common Patterns to Search For |
|---|---|
| RSA private keys | `-----BEGIN RSA PRIVATE KEY-----` |
| EC private keys | `-----BEGIN EC PRIVATE KEY-----` |
| Generic private keys | `-----BEGIN PRIVATE KEY-----` |
| PGP private keys | `-----BEGIN PGP PRIVATE KEY BLOCK-----` |
| SSH private keys | `-----BEGIN OPENSSH PRIVATE KEY-----`, files named `id_rsa`, `id_ed25519` |
| SSL certificates | `.pem`, `.p12`, `.pfx`, `.key` files |
| JWT signing secrets | `JWT_SECRET`, `TOKEN_SECRET`, long random strings assigned to secret variables |

### 1.4 Passwords and Credentials

| Secret Type | Common Patterns to Search For |
|---|---|
| Hardcoded passwords | `password =`, `passwd`, `pwd =`, `pass =` (with actual values, not env refs) |
| Basic auth headers | `Authorization: Basic [base64]` |
| Bearer tokens | `Authorization: Bearer [token]` |
| Admin credentials | `admin_password`, `root_password`, `default_password` |
| SMTP credentials | `SMTP_PASSWORD`, `EMAIL_PASSWORD`, `MAIL_PASS` |

### 1.5 Environment and Configuration Files

| File Type | Why It Matters |
|---|---|
| `.env` | Contains all application secrets; must NEVER be committed |
| `.env.local`, `.env.production`, `.env.staging` | Environment-specific secrets |
| `config.json`, `config.yaml` with real values | May contain hardcoded credentials |
| `docker-compose.yml` | Often contains database passwords, API keys in environment sections |
| `.npmrc` with auth tokens | NPM registry authentication tokens |
| `firebase.json`, `serviceAccountKey.json` | Firebase/GCP service account credentials |
| `amplify/team-provider-info.json` | AWS Amplify secrets |

### 1.6 Internal/Infrastructure URLs

| Item | Why It Matters |
|---|---|
| Internal hostnames | `*.internal`, `*.local`, `10.x.x.x`, `192.168.x.x` |
| Staging/dev URLs | Reveals internal infrastructure |
| VPN endpoints | Security-sensitive network information |
| Internal API endpoints | Exposes attack surface |

---

## 2. Where to Scan

### 2.1 Current Codebase (Working Tree)

Scan these locations with highest priority:

- **Root directory:** `.env`, `.env.*`, `*.key`, `*.pem`, `*.p12`
- **Config directories:** `config/`, `src/config/`, `settings/`
- **Source code:** All `.js`, `.ts`, `.json`, `.yaml`, `.yml` files
- **Docker files:** `Dockerfile`, `docker-compose*.yml`
- **CI/CD config:** `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`
- **Test fixtures:** `test/`, `__tests__/`, `spec/` -- test files often contain real credentials used during development
- **Scripts:** `scripts/`, `bin/` -- deployment and setup scripts
- **Documentation:** `docs/` -- sometimes contains real credentials in examples

### 2.2 Git History (Critical)

Removing a secret from the current code is NOT enough. If it was ever committed, it lives in git history forever.

Scan the full git history for secrets that were:
- Committed and then deleted in a later commit
- Present in earlier branches that were merged
- Added in commits that were later reverted

### 2.3 Other Locations

- **Git stash:** `git stash list` -- stashed changes may contain secrets
- **Git tags:** Tagged releases may reference commits with secrets
- **Submodules:** If any submodules exist, scan those too
- **Package lock files:** `package-lock.json` can contain registry tokens

---

## 3. Recommended Scanning Tools

### 3.1 Pre-Scan (Run Before Going Public)

| Tool | What It Does | Command |
|---|---|---|
| **git-secrets** (AWS) | Scans commits, commit messages, and merges for secrets | `git secrets --scan-history` |
| **truffleHog** | Scans git history for high-entropy strings and known patterns | `trufflehog git file://. --since-commit=HEAD~1000 --only-verified` |
| **gitleaks** | Fast, regex-based scanning of git repos | `gitleaks detect --source . -v` |
| **detect-secrets** (Yelp) | Baseline-driven secret detection with plugin architecture | `detect-secrets scan --all-files` |
| **GitHub secret scanning** | Automatic scanning when repo becomes public (but reactive, not proactive) | Enabled in repo settings |

### 3.2 Recommended Approach: Use Multiple Tools

No single tool catches everything. Run at least two:

```bash
# 1. Scan current files
gitleaks detect --source . -v --report-format json --report-path gitleaks-report.json

# 2. Scan full git history
trufflehog git file://. --json > trufflehog-report.json

# 3. Generate a baseline for ongoing monitoring
detect-secrets scan --all-files > .secrets.baseline
```

---

## 4. Remediation Plan

### Phase 1: Immediate (Before Going Public)

#### Step 1: Verify .gitignore

Confirm these entries exist in `.gitignore`:

```gitignore
# Environment files
.env
.env.*
!.env.example

# Private keys and certificates
*.pem
*.key
*.p12
*.pfx
*.jks

# IDE and OS files
.idea/
.vscode/settings.json
.DS_Store

# Logs (may contain request data with auth headers)
*.log
logs/

# Build artifacts
node_modules/
dist/
build/

# Firebase / GCP
serviceAccountKey.json
firebase-adminsdk*.json

# Docker override (may contain passwords)
docker-compose.override.yml
```

#### Step 2: Create .env.example

Create a `.env.example` file with placeholder values so contributors know what variables are needed without exposing real values:

```bash
# .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-here
API_KEY=your-api-key-here
SMTP_HOST=smtp.example.com
SMTP_PASSWORD=your-smtp-password
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

#### Step 3: Scan and Catalog All Secrets in History

Run the scanning tools from Section 3 against the full git history. Create a list of every secret found, including:

- What the secret is (API key, password, etc.)
- Which commit introduced it
- Which file it was in
- Whether it is still present in the current tree or was deleted

#### Step 4: Rotate All Exposed Secrets

**Every secret that has ever appeared in git history must be considered compromised.** Even if you rewrite history, someone may have already cloned the repo. Rotate in this order:

1. **Database passwords** -- Change immediately, update connection strings
2. **API keys** -- Regenerate in each provider's dashboard (AWS, Stripe, SendGrid, etc.)
3. **JWT/session secrets** -- Generate new secrets (this will invalidate existing sessions)
4. **OAuth client secrets** -- Regenerate in the OAuth provider
5. **SMTP credentials** -- Change email service password
6. **SSH/deploy keys** -- Generate new key pairs, update authorized_keys on servers

#### Step 5: Rewrite Git History (If Secrets Were Committed)

If secrets were found in git history, you have two options:

**Option A: BFG Repo-Cleaner (Recommended for speed)**

```bash
# Clone a fresh mirror
git clone --mirror git@github.com:your-org/your-repo.git

# Remove files containing secrets
bfg --delete-files .env
bfg --delete-files serviceAccountKey.json

# Remove specific strings
bfg --replace-text passwords.txt  # file with one secret per line

# Clean and push
cd your-repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

**Option B: git filter-repo (More flexible)**

```bash
git filter-repo --path .env --invert-paths
git filter-repo --path config/secrets.json --invert-paths
```

**Important caveats:**
- Force-pushing rewrites history for ALL collaborators
- All collaborators must re-clone after history rewrite
- Forked repos will retain the old history
- This is why rotating secrets is non-negotiable regardless of history rewrite

**Option C: Start Fresh (Nuclear option)**

If the history is heavily contaminated:

1. Copy the current clean codebase
2. Create a new repository
3. Make a single initial commit
4. Push to a new remote
5. Archive or delete the old repository

### Phase 2: Pre-Publication Checklist

Before making the repo public, verify each item:

- [ ] All `.env` files are in `.gitignore` and NOT in the repository
- [ ] `.env.example` exists with placeholder values only
- [ ] No hardcoded credentials in source code (use `process.env.VARIABLE_NAME` everywhere)
- [ ] No private keys or certificates in the repository
- [ ] No internal URLs, IP addresses, or hostnames in code or config
- [ ] `docker-compose.yml` uses environment variable references, not hardcoded passwords
- [ ] CI/CD configs reference GitHub Secrets, not inline values
- [ ] Test fixtures use fake/mock credentials, not real ones
- [ ] `package-lock.json` does not contain private registry auth tokens
- [ ] README does not contain real credentials in examples
- [ ] Git history has been cleaned (if secrets were previously committed)
- [ ] All previously exposed secrets have been rotated
- [ ] Scanning tools report zero findings on the clean repository

### Phase 3: Ongoing Protection (Post-Publication)

#### 3a. Pre-commit Hooks

Install pre-commit hooks to prevent future secret commits:

```bash
# Using pre-commit framework
pip install pre-commit

# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks

  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

#### 3b. GitHub Settings

Once the repo is public, enable these GitHub features:

1. **Secret scanning:** Settings > Code security > Secret scanning (Enable)
2. **Push protection:** Settings > Code security > Push protection (Enable) -- blocks pushes containing known secret patterns
3. **Dependabot alerts:** Settings > Code security > Dependabot alerts (Enable)
4. **Branch protection:** Require PR reviews before merging to main

#### 3c. CI/CD Secret Scanning

Add secret scanning to your CI pipeline:

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 5. Common Mistakes in Node.js/Express Projects

These are patterns commonly found in Express apps after months of private development:

1. **Hardcoded JWT secret in auth middleware:**
   ```js
   // BAD: jwt.sign(payload, 'my-super-secret-key-12345')
   // GOOD: jwt.sign(payload, process.env.JWT_SECRET)
   ```

2. **Database URL in ORM config file:**
   ```js
   // BAD: Sequelize config with plain-text credentials in config/config.json
   // GOOD: Use environment variables in config, add config.json to .gitignore
   ```

3. **CORS whitelist revealing internal domains:**
   ```js
   // BAD: origin: ['https://staging.internal.company.com']
   // GOOD: origin: process.env.ALLOWED_ORIGINS.split(',')
   ```

4. **Seed scripts with real user data or passwords:**
   ```js
   // BAD: Real email addresses, real API responses in seed data
   // GOOD: Use faker.js for generated data, sanitize all seed files
   ```

5. **Error messages leaking stack traces or internal paths:**
   ```js
   // BAD: res.status(500).json({ error: err.stack })
   // GOOD: res.status(500).json({ error: 'Internal server error' })
   // Log the full error server-side only
   ```

6. **Logging middleware capturing auth headers:**
   ```js
   // BAD: morgan(':method :url :req[authorization]')
   // GOOD: Redact sensitive headers in request logging
   ```

7. **Third-party callback URLs hardcoded:**
   ```js
   // BAD: callbackURL: 'https://myapp.com/auth/google/callback'
   // GOOD: callbackURL: process.env.OAUTH_CALLBACK_URL
   ```

8. **Comments containing credentials:**
   ```js
   // BAD: // Use admin/password123 to test login
   // GOOD: Remove all credential comments before going public
   ```

---

## 6. Priority Summary

| Priority | Action | Risk if Skipped |
|---|---|---|
| **P0 - Critical** | Scan git history for secrets | Leaked API keys, database takeover |
| **P0 - Critical** | Rotate ALL secrets found in history | Compromised accounts even after cleanup |
| **P0 - Critical** | Verify .gitignore blocks .env and key files | Immediate exposure on push |
| **P1 - High** | Rewrite git history or start fresh | Historical secrets permanently accessible |
| **P1 - High** | Audit hardcoded credentials in source code | Credential theft from code review |
| **P2 - Medium** | Install pre-commit hooks | Future accidental commits |
| **P2 - Medium** | Enable GitHub secret scanning and push protection | Reactive vs proactive protection |
| **P3 - Low** | Remove internal URLs and infrastructure details | Information disclosure |
| **P3 - Low** | Sanitize test fixtures and seed data | PII exposure, internal data leakage |

---

## 7. Key Takeaway

**Removing a secret from the latest commit is not enough.** Git stores full history. If a secret was ever committed -- even briefly, even on a branch that was deleted -- it exists in the repository's object database. Anyone who clones the repo after it goes public gets the full history.

The only safe approach is:
1. **Scan** the entire history
2. **Rotate** every secret found (treat them as compromised)
3. **Rewrite** history to remove the secrets (or start a fresh repo)
4. **Prevent** future leaks with pre-commit hooks and CI scanning
