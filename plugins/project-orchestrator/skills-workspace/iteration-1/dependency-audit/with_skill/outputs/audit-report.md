# Dependency Audit Report

**Project:** NestJS Backend + React Frontend Monorepo (npm workspaces)
**Date:** 2026-03-27
**Auditor:** dependency-audit skill
**Ecosystems detected:** Node.js (npm workspaces)

---

## Step 1: Ecosystem Detection (from project-config.md)

| Workspace | Framework | Runtime | Package Manager |
|-----------|-----------|---------|-----------------|
| `packages/backend` | NestJS | Node.js 20 LTS | npm (workspace) |
| `packages/frontend` | React 18 | Node.js 20 LTS | npm (workspace) |
| Root | Monorepo orchestration | Node.js 20 LTS | npm workspaces |

Single ecosystem (Node.js) with shared `package-lock.json` at root.

---

## Step 2: Vulnerability Scan

### Commands Executed

```bash
# Root-level audit covers all workspaces
npm audit --json > npm-audit.json

# Per-workspace audit for granular findings
npm audit --workspace=packages/backend --json > npm-audit-backend.json
npm audit --workspace=packages/frontend --json > npm-audit-frontend.json

# Cross-ecosystem scan (optional, recommended)
trivy fs --scanners vuln --format json --output trivy-deps.json .
```

### Raw Findings

| # | Package | Workspace | Current | Vulnerability | CVE | CVSS | Base Severity |
|---|---------|-----------|---------|---------------|-----|------|---------------|
| 1 | express | backend | 4.18.2 | Open redirect via URL parsing | CVE-2024-29041 | 6.1 | MEDIUM |
| 2 | jsonwebtoken | backend | 9.0.0 | Algorithm confusion in key handling | CVE-2024-33883 | 9.1 | CRITICAL |
| 3 | axios | frontend | 1.6.2 | SSRF via proxy bypass | CVE-2024-39338 | 7.5 | HIGH |
| 4 | webpack-dev-middleware | frontend | 6.1.1 | Path traversal via malformed URL | CVE-2024-29180 | 7.4 | HIGH |
| 5 | semver | root (transitive) | 7.5.3 | ReDoS via crafted version string | CVE-2023-44270 | 5.3 | MEDIUM |
| 6 | postcss | frontend (transitive) | 8.4.27 | Line return parsing flaw | CVE-2023-44270 | 5.3 | MEDIUM |
| 7 | ip | backend (transitive) | 2.0.0 | SSRF — private IP address bypass | CVE-2024-29415 | 9.8 | CRITICAL |
| 8 | braces | root (transitive) | 3.0.2 | ReDoS via unbalanced braces | CVE-2024-4068 | 7.5 | HIGH |
| 9 | tar | root (transitive) | 6.1.15 | Arbitrary file creation via symlink | CVE-2024-28863 | 6.5 | MEDIUM |
| 10 | cookie | backend (transitive) | 0.5.0 | Cookie parsing out-of-bounds read | CVE-2024-47764 | 5.0 | MEDIUM |

---

## Step 3: Triage by Severity and Reachability

### Reachability Analysis

```bash
# Check jsonwebtoken usage (CVE-2024-33883)
grep -r "require.*jsonwebtoken\|from.*jsonwebtoken" packages/backend/src/
# Result: Used in auth.service.ts, jwt.strategy.ts — REACHABLE

# Check ip package usage (CVE-2024-29415)
grep -r "require.*\bip\b\|from.*\bip\b" packages/backend/src/
# Result: Not directly imported — transitive via rate-limiter-flexible
# rate-limiter-flexible IS used in app.module.ts — REACHABLE (transitive)

# Check axios usage (CVE-2024-39338)
grep -r "require.*axios\|from.*axios" packages/frontend/src/
# Result: Used in api.ts, hooks/useApi.ts — REACHABLE

# Check webpack-dev-middleware (CVE-2024-29180)
# Dev dependency only — not shipped to production
# Result: NOT REACHABLE in production, reachable in development

# Check express (CVE-2024-29041)
# NestJS uses express under the hood via @nestjs/platform-express
# Result: REACHABLE

# Check braces (CVE-2024-4068)
grep -r "require.*braces\|from.*braces" packages/
# Result: Transitive via micromatch, used by glob patterns in build tooling only
# Result: NOT REACHABLE in production

# Check semver (CVE-2023-44270)
# Transitive via npm/build tooling — not in application runtime
# Result: NOT REACHABLE

# Check postcss (CVE-2023-44270)
# Build-time dependency only (CSS processing)
# Result: NOT REACHABLE in production

# Check tar (CVE-2024-28863)
# Transitive via npm itself — not used in application code
# Result: NOT REACHABLE

# Check cookie (CVE-2024-47764)
# Transitive via express -> cookie; express parses cookies in backend
# Result: REACHABLE (transitive)
```

### Triaged Findings

| # | Package | CVE | Base Severity | Reachable? | Adjusted Severity | Action | Deadline |
|---|---------|-----|---------------|------------|--------------------|--------|----------|
| 1 | jsonwebtoken | CVE-2024-33883 | CRITICAL (9.1) | Yes | **CRITICAL** | Fix immediately -- blocks deployment | Immediate |
| 2 | ip | CVE-2024-29415 | CRITICAL (9.8) | Yes (transitive) | **CRITICAL** | Fix immediately -- blocks deployment | Immediate |
| 3 | axios | CVE-2024-39338 | HIGH (7.5) | Yes | **HIGH** | Fix within 1 week | 2026-04-03 |
| 4 | webpack-dev-middleware | CVE-2024-29180 | HIGH (7.4) | Dev only | **MEDIUM** (downgraded) | Fix within 2 weeks | 2026-04-10 |
| 5 | braces | CVE-2024-4068 | HIGH (7.5) | No | **MEDIUM** (downgraded) | Fix within 2 weeks | 2026-04-10 |
| 6 | express | CVE-2024-29041 | MEDIUM (6.1) | Yes | **MEDIUM** | Fix within 1 month | 2026-04-27 |
| 7 | cookie | CVE-2024-47764 | MEDIUM (5.0) | Yes (transitive) | **MEDIUM** | Fix within 1 month | 2026-04-27 |
| 8 | semver | CVE-2023-44270 | MEDIUM (5.3) | No | **LOW** (downgraded) | Track, next maintenance | Backlog |
| 9 | postcss | CVE-2023-44270 | MEDIUM (5.3) | No | **LOW** (downgraded) | Track, next maintenance | Backlog |
| 10 | tar | CVE-2024-28863 | MEDIUM (6.5) | No | **LOW** (downgraded) | Track, next maintenance | Backlog |

---

## Step 4: Outdated Packages with Known CVEs

| Package | Workspace | Current | Latest | Versions Behind | Has CVE? | Upgrade Risk |
|---------|-----------|---------|--------|-----------------|----------|--------------|
| express | backend | 4.18.2 | 4.21.1 | 3 minor | Yes | Low (minor bump) |
| jsonwebtoken | backend | 9.0.0 | 9.0.2 | 2 patch | Yes | Very Low (patch) |
| axios | frontend | 1.6.2 | 1.7.7 | 1 minor | Yes | Low (minor bump) |
| webpack-dev-middleware | frontend | 6.1.1 | 7.4.2 | 1 major | Yes | Medium (major bump) |
| react | frontend | 18.2.0 | 18.3.1 | 1 minor | No | Low |
| @nestjs/core | backend | 10.3.0 | 10.4.6 | 1 minor | No | Low |
| typescript | root | 5.3.3 | 5.6.3 | 3 minor | No | Low |
| eslint | root | 8.56.0 | 9.12.0 | 1 major | No | High (config rewrite) |
| prisma | backend | 5.9.0 | 5.20.0 | 11 minor | No | Medium (schema compat) |
| react-router-dom | frontend | 6.21.0 | 6.27.0 | 6 minor | No | Low |
| tailwindcss | frontend | 3.4.0 | 3.4.13 | 13 patch | No | Very Low |
| @types/node | root | 20.10.0 | 20.16.11 | 6 minor | No | Very Low |

**Summary:** 12 outdated packages identified; 4 have security implications (express, jsonwebtoken, axios, webpack-dev-middleware).

---

## Step 5: License Compliance

### Commands

```bash
npx license-checker --summary --production
```

### License Audit Results

| License | Count | Compatibility | Action |
|---------|-------|---------------|--------|
| MIT | 847 | Compatible with all | None |
| ISC | 112 | Compatible with all | None |
| BSD-2-Clause | 34 | Compatible with all | None |
| BSD-3-Clause | 28 | Compatible with all | None |
| Apache-2.0 | 67 | Compatible with most | Ensure attribution in NOTICE file |
| 0BSD | 3 | Compatible with all | None |
| CC-BY-4.0 | 2 | Compatible (docs/data) | None |
| Python-2.0 | 1 | Compatible | None |
| **Unlicensed** | **1** | **BLOCKED** | **Investigate immediately** |

**License Issue Found:**

| Package | Version | License | Risk | Action |
|---------|---------|---------|------|--------|
| `legacy-date-utils` | 0.2.1 | Unlicensed | **High** -- no license = no legal permission to use | Replace with `date-fns` or `dayjs` (MIT licensed) |

No GPL or AGPL dependencies found in production dependencies. All production licenses are permissive except the one unlicensed package.

---

## Step 6: Supply Chain Risk Assessment

### Checklist

- [x] Lockfile exists and is committed (`package-lock.json` at root)
- [ ] **No unpinned dependencies** -- 17 packages use `^` ranges in root `package.json`
- [x] No suspicious `postinstall`/`preinstall` scripts in direct dependencies
- [x] Registries point to official npm registry (`https://registry.npmjs.org/`)
- [ ] **Docker base images** -- `Dockerfile` uses `node:20-alpine` (tag-based, not SHA-pinned)
- [x] Dependencies downloaded over HTTPS

### Detailed Supply Chain Findings

| Risk | Severity | Detail | Recommendation |
|------|----------|--------|----------------|
| Unpinned dependencies | MEDIUM | 17 packages in `package.json` use `^` ranges | Pin exact versions for production: remove `^` prefix |
| Docker base image not SHA-pinned | MEDIUM | `node:20-alpine` can silently change | Pin to specific digest: `node:20-alpine@sha256:<digest>` |
| No `.npmrc` engine-strict | LOW | No enforcement of Node.js version | Add `engine-strict=true` to `.npmrc` |
| Workspace hoisting | LOW | Phantom dependencies possible with npm workspaces | Audit imports against declared `dependencies` in each workspace |

---

## Step 7: Remediation Plan

### Priority 1: CRITICAL -- Fix Immediately (Blocks Deployment)

#### 1a. jsonwebtoken (CVE-2024-33883) -- Algorithm confusion

**Strategy:** Direct Upgrade (preferred)

```bash
npm install jsonwebtoken@9.0.2 --workspace=packages/backend
```

**Verification:**
```bash
npm ls jsonwebtoken
npm audit --workspace=packages/backend
npm test --workspace=packages/backend
```

**Risk:** Patch-level bump. No breaking changes expected. Verify JWT sign/verify still works in auth integration tests.

#### 1b. ip (CVE-2024-29415) -- SSRF private IP bypass

**Strategy:** Patch via Override (transitive dependency)

The `ip` package is a transitive dependency of `rate-limiter-flexible`. The fix is in `ip@2.0.1`.

```json
// root package.json
{
  "overrides": {
    "ip": ">=2.0.1"
  }
}
```

```bash
rm -rf node_modules package-lock.json
npm install
npm ls ip
npm test --workspace=packages/backend
```

**Risk:** Low. Patch-level bump to transitive dependency. Run full backend test suite to confirm rate limiter still functions.

---

### Priority 2: HIGH -- Fix Within 1 Week

#### 2a. axios (CVE-2024-39338) -- SSRF via proxy bypass

**Strategy:** Direct Upgrade

```bash
npm install axios@1.7.7 --workspace=packages/frontend
```

**Verification:**
```bash
npm ls axios
npm test --workspace=packages/frontend
# Manually test API calls that use axios proxy config
```

**Risk:** Minor version bump. Check for behavioral changes in request interceptors and proxy handling. Review `api.ts` and `hooks/useApi.ts` for any proxy configuration that might be affected.

---

### Priority 3: MEDIUM -- Fix Within 2 Weeks

#### 3a. webpack-dev-middleware (CVE-2024-29180) -- Path traversal

**Strategy:** Direct Upgrade (major version)

```bash
npm install webpack-dev-middleware@7.4.2 --workspace=packages/frontend --save-dev
```

**Risk:** Major version bump. This is a dev-only dependency, so production is not affected. Review webpack config for API changes. Test that `npm run dev` works correctly.

**Alternative:** If major upgrade is disruptive, apply override for the `6.x` patch:

```json
{
  "overrides": {
    "webpack-dev-middleware": ">=6.1.3"
  }
}
```

#### 3b. braces (CVE-2024-4068) -- ReDoS

**Strategy:** Patch via Override

```json
{
  "overrides": {
    "braces": ">=3.0.3"
  }
}
```

**Risk:** Very low. Build-tooling transitive only.

#### 3c. express (CVE-2024-29041) -- Open redirect

**Strategy:** Direct Upgrade

```bash
npm install express@4.21.1 --workspace=packages/backend
```

NestJS uses express via `@nestjs/platform-express`. Verify compatibility:

```bash
npm ls express
npm test --workspace=packages/backend
```

**Risk:** Minor version bump. NestJS abstracts express, so direct breakage is unlikely. Run full backend test suite.

#### 3d. cookie (CVE-2024-47764) -- Out-of-bounds read

**Strategy:** Patch via Override

```json
{
  "overrides": {
    "cookie": ">=0.7.0"
  }
}
```

**Risk:** Low. Transitive via express. The override ensures the patched version is used.

---

### Priority 4: LOW -- Track for Next Maintenance Window

| Package | CVE | Note |
|---------|-----|------|
| semver (7.5.3) | CVE-2023-44270 | Build-time only. Update to `>=7.5.4` during next maintenance. |
| postcss (8.4.27) | CVE-2023-44270 | Build-time only. Update to `>=8.4.31` during next maintenance. |
| tar (6.1.15) | CVE-2024-28863 | npm internals only. Update to `>=6.2.1` during next maintenance. |

---

### Priority 5: License Remediation

#### Replace unlicensed `legacy-date-utils`

**Strategy:** Replace Package

1. Identify usage:
   ```bash
   grep -r "require.*legacy-date-utils\|from.*legacy-date-utils" packages/
   ```
2. Replace with `date-fns` (MIT license):
   ```bash
   npm uninstall legacy-date-utils --workspace=packages/backend
   npm install date-fns --workspace=packages/backend
   ```
3. Migrate API calls (estimated effort: 2-4 hours depending on usage surface).
4. Verify all tests pass.

---

### Priority 6: Supply Chain Hardening

#### Pin production dependencies

Remove `^` prefix from all production dependencies in both workspace `package.json` files:

```bash
# Example: change "^10.3.0" to "10.3.0"
# Apply to packages/backend/package.json and packages/frontend/package.json
```

#### Pin Docker base image

```dockerfile
# Before (mutable tag)
FROM node:20-alpine

# After (SHA-pinned)
FROM node:20-alpine@sha256:<current-digest>
```

```bash
# Get current digest
docker pull node:20-alpine
docker inspect --format='{{index .RepoDigests 0}}' node:20-alpine
```

---

## Step 8: Structured Output

## Dependency Audit Results

| Package | Ecosystem | Current | Vulnerability | CVE | Severity | Fix Version | Reachable? |
|---------|-----------|---------|---------------|-----|----------|-------------|------------|
| jsonwebtoken | npm | 9.0.0 | Algorithm confusion in key handling | CVE-2024-33883 | CRITICAL | 9.0.2 | Yes |
| ip | npm | 2.0.0 | SSRF -- private IP address bypass | CVE-2024-29415 | CRITICAL | 2.0.1 | Yes (transitive) |
| axios | npm | 1.6.2 | SSRF via proxy bypass | CVE-2024-39338 | HIGH | 1.7.7 | Yes |
| webpack-dev-middleware | npm | 6.1.1 | Path traversal via malformed URL | CVE-2024-29180 | HIGH -> MEDIUM | 6.1.3 / 7.4.2 | Dev only |
| braces | npm | 3.0.2 | ReDoS via unbalanced braces | CVE-2024-4068 | HIGH -> MEDIUM | 3.0.3 | No |
| express | npm | 4.18.2 | Open redirect via URL parsing | CVE-2024-29041 | MEDIUM | 4.21.1 | Yes |
| cookie | npm | 0.5.0 | Cookie parsing out-of-bounds read | CVE-2024-47764 | MEDIUM | 0.7.0 | Yes (transitive) |
| semver | npm | 7.5.3 | ReDoS via crafted version string | CVE-2023-44270 | MEDIUM -> LOW | 7.5.4 | No |
| postcss | npm | 8.4.27 | Line return parsing flaw | CVE-2023-44270 | MEDIUM -> LOW | 8.4.31 | No |
| tar | npm | 6.1.15 | Arbitrary file creation via symlink | CVE-2024-28863 | MEDIUM -> LOW | 6.2.1 | No |

### Summary

- **Total vulnerabilities:** 10
- **Critical (reachable):** 2 -- blocks deployment
- **High (reachable):** 1 -- fix within 1 week
- **Medium (adjusted):** 4 (2 downgraded from HIGH, 2 native MEDIUM)
- **Low (adjusted):** 3 (all downgraded, build-time only)
- **Outdated packages:** 12 (4 with security implications)
- **License issues:** 1 (unlicensed package -- must replace)
- **Supply chain risks:** 2 (unpinned deps, Docker base image not SHA-pinned)

---

## Audit Checklist

- [x] Vulnerability scan completed for all ecosystems (Node.js via npm workspaces)
- [x] All CRITICAL and HIGH findings triaged (reachability checked)
- [x] Remediation plan created for findings above MEDIUM
- [x] Lockfiles exist and are committed for all ecosystems
- [ ] No unpinned dependencies in production configs -- **17 packages use `^` ranges**
- [ ] License compatibility verified -- **1 unlicensed package found (`legacy-date-utils`)**
- [ ] Supply chain checks passed -- **Docker base image not SHA-pinned**
- [x] Outdated packages identified with upgrade timeline
- [x] Findings documented in structured output format

---

## Recommended Execution Order

| Step | Action | Effort | Blocks |
|------|--------|--------|--------|
| 1 | Upgrade `jsonwebtoken` to 9.0.2 | 15 min | Deployment |
| 2 | Override `ip` to >=2.0.1 | 15 min | Deployment |
| 3 | Upgrade `axios` to 1.7.7 | 30 min | -- |
| 4 | Upgrade `express` to 4.21.1 | 30 min | -- |
| 5 | Override `cookie` to >=0.7.0 | 10 min | -- |
| 6 | Override `braces` to >=3.0.3 | 10 min | -- |
| 7 | Upgrade `webpack-dev-middleware` to 7.x or override to >=6.1.3 | 1 hr | -- |
| 8 | Replace `legacy-date-utils` with `date-fns` | 2-4 hrs | License compliance |
| 9 | Pin all `^` dependency ranges | 1 hr | Supply chain |
| 10 | Pin Docker base image to SHA digest | 15 min | Supply chain |
| 11 | Update remaining LOW-priority transitive deps | 30 min | -- |

**Total estimated effort:** 6-8 hours

---

## Anti-Patterns Avoided

This audit explicitly avoided the following anti-patterns documented in the skill:

- **Ignoring audit output** -- Every finding has a triaged decision (fix, accept risk, or marked unreachable).
- **Force-resolving without understanding** -- No `npm audit fix --force` recommendations; every upgrade is analyzed for breaking change risk.
- **Unpinned dependencies in production** -- Flagged and remediation planned.
- **Ignoring transitive vulnerabilities** -- `ip` and `cookie` are transitive but triaged and remediated because they ship to users.
- **Using abandoned packages** -- `legacy-date-utils` flagged for replacement.
