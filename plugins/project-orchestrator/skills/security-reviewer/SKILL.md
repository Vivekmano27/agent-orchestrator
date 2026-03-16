---
name: security-reviewer
description: Review code for security vulnerabilities — OWASP Top 10, injection attacks, broken auth, XSS, CSRF, secrets in code, insecure dependencies. Outputs severity-rated report. Use when the user says "security review", "check vulnerabilities", "OWASP audit", "security scan", or before deploying to production.
allowed-tools: Read, Grep, Glob, Bash
---

# Security Reviewer Skill

Comprehensive security code review following OWASP guidelines.

## Review Checklist (OWASP Top 10 2021)

### A01: Broken Access Control
- [ ] Authorization checks on every endpoint
- [ ] Resource ownership validation (user can only access own data)
- [ ] Role-based access properly enforced
- [ ] No direct object references without auth checks

### A02: Cryptographic Failures
- [ ] Passwords hashed with bcrypt/argon2 (not MD5/SHA)
- [ ] Sensitive data encrypted at rest (AES-256)
- [ ] TLS 1.3 for all data in transit
- [ ] No secrets in code or config files

### A03: Injection
- [ ] Parameterized queries (no string concatenation for SQL)
- [ ] Input validation and sanitization
- [ ] Output encoding for HTML (prevent XSS)
- [ ] Command injection prevention

### A04: Insecure Design
- [ ] Rate limiting present on business-critical flows (login, signup, payment, password reset)
- [ ] Account lockout / brute force protection implemented
- [ ] CAPTCHA on sensitive forms (signup, password reset)
- [ ] Transaction/quantity limits on e-commerce flows
- [ ] Absence detection: `grep -rn "rateLimit\|throttle\|ThrottlerModule" src/` — flag MEDIUM if absent

### A05: Security Misconfiguration
- [ ] Debug mode disabled in production configs (`DEBUG=True`, `NODE_ENV=development`)
- [ ] No default credentials in non-test code (`admin:admin`, `password123`, `root:root`)
- [ ] CORS not overly permissive (`Access-Control-Allow-Origin: *`)
- [ ] Security headers present (helmet/CSP/HSTS/X-Frame-Options) — flag if absent
- [ ] Stack traces not exposed to clients in error responses
- [ ] Directory listing disabled (`autoindex on`, `Options +Indexes`)
- [ ] TLS verification not disabled (`verify=False`, `rejectUnauthorized: false`, `InsecureSkipVerify: true`)
- [ ] Unnecessary features disabled in production (Swagger/GraphQL Playground/phpinfo)
- [ ] IaC misconfig scan: `trivy fs --scanners misconfig --format json .`

### A06: Vulnerable and Outdated Components
- [ ] Defer to **dependency-audit** skill for CVE scanning
- [ ] Verify dependency-audit was run and findings addressed
- [ ] Check lockfile exists and is committed (supply chain protection)
- [ ] Check for unpinned dependencies (`"^"`, `"~"`, `"*"` in package.json)
- [ ] Check for vendored/copied libraries not tracked by package managers

### A07: Authentication Failures
- [ ] Strong password requirements enforced
- [ ] Rate limiting on login attempts
- [ ] Secure session management
- [ ] MFA support (or plan for it)

### A08: Software and Data Integrity Failures
- [ ] No unsafe deserialization (`pickle.load`, `yaml.load(` without SafeLoader, `eval(`, `ObjectInputStream`, `BinaryFormatter`)
- [ ] Subresource Integrity (SRI) on CDN scripts — `<script src="http...">` must have `integrity=` attribute
- [ ] CI/CD pipeline security: no script injection (`${{ github.event }}` in `run:` blocks)
- [ ] GitHub Actions pinned to SHA (not `@master` / `@latest` / `@v1`)
- [ ] No `curl | bash` pattern in CI/CD scripts
- [ ] Docker base images pinned (not `:latest`)
- [ ] Semgrep: `semgrep scan --config p/github-actions --json .github/`

### A09: Security Logging and Monitoring Failures
- [ ] No PII/secrets in log statements (`log.*password`, `log.*secret`, `log.*token`, `console.log.*apiKey`)
- [ ] Authentication events ARE logged (login, logout, auth failure) — flag MEDIUM if absent
- [ ] Failed input validation IS logged — flag if absent
- [ ] No `console.log` in production TypeScript/JavaScript (use structured logger)
- [ ] Structured logging configured (winston/pino/bunyan for JS, structlog for Python, zap for Go)
- [ ] Log injection prevention: user input not directly interpolated into log messages

### A10: Server-Side Request Forgery (SSRF)
- [ ] User input not flowing directly into HTTP request functions (`requests.get(req.body.url)`, `fetch(req.query.url)`)
- [ ] Cloud metadata endpoint blocking: check for `169.254.169.254`, `metadata.google` — flag if absent in apps making outbound HTTP
- [ ] URL scheme validation: block `file://`, `gopher://`, `dict://` protocols
- [ ] URL allowlist/denylist implementation for outbound requests
- [ ] Redirect following configured safely (no redirect to internal IPs)
- [ ] Image/file proxy endpoints validated against SSRF

## Tool Commands

```bash
# Primary SAST scan (covers A01-A10 patterns)
semgrep scan --config p/owasp-top-ten --config p/security-audit --json --output semgrep-report.json .

# GitHub Actions CI/CD security (A08)
semgrep scan --config p/github-actions --json --output semgrep-actions.json .github/

# Python-specific (A03, A05, A08)
bandit -r ./src -f json -o bandit-report.json

# JavaScript/TypeScript-specific (A03, A05)
npx eslint --plugin security --config plugin:security/recommended --format json --output-file eslint-security.json src/

# Go-specific (A01, A03)
gosec -fmt=json -out=gosec-results.json ./...

# Infrastructure misconfiguration (A05)
trivy fs --scanners misconfig --format json --output trivy-misconfig.json .
```

## Report Template
```markdown
# Security Review Report
**Date:** [date]
**Reviewer:** security-reviewer agent
**Scope:** [files/modules reviewed]

## Findings

### [CRITICAL] [Title]
**File:** [path:line]
**Description:** [what's wrong]
**Impact:** [what could happen]
**Fix:** [specific code change]

### [HIGH] [Title]
[same format]
```
