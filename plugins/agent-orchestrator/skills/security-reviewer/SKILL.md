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

### A07: Authentication Failures
- [ ] Strong password requirements enforced
- [ ] Rate limiting on login attempts
- [ ] Secure session management
- [ ] MFA support (or plan for it)

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
