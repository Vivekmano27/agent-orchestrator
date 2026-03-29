# Dependency Audit Report: NestJS Backend + React Frontend Monorepo (npm Workspaces)

**Date:** 2026-03-27
**Scope:** Full dependency audit covering vulnerabilities, outdated packages, and license compliance
**Stack:** NestJS (backend), React (frontend), npm workspaces monorepo
**Audit type:** Guidance and remediation plan (no live tooling executed)

---

## Table of Contents

1. [Audit Methodology](#1-audit-methodology)
2. [Vulnerability Scanning](#2-vulnerability-scanning)
3. [Outdated Package Detection](#3-outdated-package-detection)
4. [License Compliance](#4-license-compliance)
5. [Supply Chain Risk Assessment](#5-supply-chain-risk-assessment)
6. [Priority Matrix](#6-priority-matrix)
7. [Remediation Plan](#7-remediation-plan)
8. [Automation Recommendations](#8-automation-recommendations)

---

## 1. Audit Methodology

### Commands to Execute

Run all commands from the monorepo root. npm workspaces ensures `npm audit` and `npm outdated` traverse all workspaces automatically.

```bash
# Vulnerability audit (all workspaces)
npm audit --workspaces

# Vulnerability audit with JSON output for parsing
npm audit --workspaces --json > audit-results.json

# Outdated packages (all workspaces)
npm outdated --workspaces

# List all dependencies with licenses
npx license-checker --json > licenses.json

# Alternative: more detailed license analysis
npx license-checker --summary
npx license-checker --failOn "GPL-2.0;GPL-3.0;AGPL-3.0;SSPL-1.0"
```

### Workspace-Specific Audits

If you need per-workspace granularity:

```bash
# Backend only
npm audit --workspace=packages/backend
npm outdated --workspace=packages/backend

# Frontend only
npm audit --workspace=packages/frontend
npm outdated --workspace=packages/frontend

# Shared packages (if any)
npm audit --workspace=packages/shared
```

---

## 2. Vulnerability Scanning

### What to Check

| Check | Command | Why It Matters |
|-------|---------|----------------|
| Known CVEs | `npm audit --workspaces` | Identifies packages with published security advisories |
| Critical/High severity | `npm audit --workspaces --audit-level=high` | Filters for actionable, high-risk vulnerabilities |
| Production-only | `npm audit --workspaces --omit=dev` | Focuses on what ships to production |
| Detailed advisory info | `npm audit --workspaces --json` | Provides GHSA IDs, CVSS scores, affected versions, and patch info |

### High-Risk Areas for NestJS + React Stacks

**NestJS Backend (higher priority -- server-side exposure):**

| Package Category | Common Vulnerabilities | Severity |
|-----------------|----------------------|----------|
| `@nestjs/platform-express` / Express | Prototype pollution, ReDoS in URL parsing | High |
| `class-transformer` | Prototype pollution via `plainToInstance` | Critical |
| `class-validator` | ReDoS in validation decorators | Medium |
| TypeORM / Prisma | SQL injection if raw queries used, connection pool exhaustion | High |
| `jsonwebtoken` / `passport-jwt` | Algorithm confusion attacks, key handling flaws | Critical |
| `helmet` / `cors` | Misconfiguration rather than CVEs, but outdated versions lack protections | Medium |
| `multer` (file uploads) | Path traversal, denial of service via large files | High |
| `axios` / `node-fetch` | SSRF if user input reaches URLs, redirect following | Medium |
| `bcrypt` / `bcryptjs` | Rarely vulnerable, but outdated versions may have timing attacks | Low |

**React Frontend (lower severity -- client-side):**

| Package Category | Common Vulnerabilities | Severity |
|-----------------|----------------------|----------|
| `react-scripts` / Webpack | Prototype pollution in loaders, dev server open redirect | Medium |
| `postcss` / `css-loader` | ReDoS in CSS parsing | Low |
| `nth-check` (via css-select) | ReDoS (frequently flagged, low real-world impact) | Low |
| `semver` | ReDoS in version parsing | Low |
| Markdown renderers (`react-markdown`, `marked`) | XSS if rendering untrusted content | High |
| Rich text editors (Quill, Slate, TipTap) | XSS through crafted content | High |
| `axios` (if used client-side) | SSRF not applicable client-side, but credential leakage in error logs | Medium |

### Transitive Dependency Risks

Many vulnerabilities come from transitive (indirect) dependencies. Key areas to investigate:

```bash
# Find why a vulnerable package is installed
npm explain <package-name>

# Example: find all paths to a vulnerable lodash
npm explain lodash
```

Common transitive vulnerability chains:
- `react-scripts` -> `webpack-dev-server` -> `express` (old version)
- `@nestjs/cli` -> `@angular-devkit/schematics` -> `glob` (old version)
- Any package -> `minimist` / `qs` / `semver` (frequently flagged)

---

## 3. Outdated Package Detection

### Commands

```bash
# Check all workspaces for outdated packages
npm outdated --workspaces

# Show only packages with major version bumps (manual review needed)
npm outdated --workspaces --long
```

### Interpreting Output

| Column | Meaning | Action |
|--------|---------|--------|
| Current | What you have installed | -- |
| Wanted | Latest version satisfying your semver range | Safe to update: `npm update` |
| Latest | Absolute latest version on npm | May require migration work |
| Red text | Current is behind Wanted | Update immediately |
| Yellow text | Current matches Wanted but behind Latest | Evaluate major version upgrade |

### Priority Categories for Updates

**Tier 1 -- Update Immediately (same day):**
- Any package with a known CVE in the current version
- `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express` if behind the latest minor
- `react`, `react-dom` if behind the latest patch
- Authentication packages (`passport`, `jsonwebtoken`, `bcrypt`)
- Database drivers (`pg`, `mysql2`, `@prisma/client`)

**Tier 2 -- Update This Sprint (within 1-2 weeks):**
- `@nestjs/*` minor version bumps (e.g., 10.3 -> 10.4)
- `react` minor version bumps
- Testing frameworks (`jest`, `@testing-library/*`, `supertest`)
- Build tools (`typescript`, `eslint`, `prettier`)
- State management (`@reduxjs/toolkit`, `zustand`, `react-query`)

**Tier 3 -- Plan for Next Cycle (1-2 months):**
- Major version upgrades (`@nestjs/core` 10.x -> 11.x, `react` 18 -> 19)
- Build tool migrations (`webpack` -> `vite`, `create-react-app` -> `next`)
- ORM major versions (`typeorm` 0.3 -> 1.0, `prisma` major bumps)

**Tier 4 -- Evaluate and Decide (quarterly):**
- Deprecated packages needing replacement
- Packages with declining maintenance (check GitHub activity)
- Packages where alternatives have become standard

### NestJS-Specific Update Considerations

- NestJS packages must all be on the same major version. Never mix `@nestjs/core@10` with `@nestjs/common@9`.
- When upgrading NestJS major versions, also upgrade `@nestjs/cli`, `@nestjs/schematics`, and `@nestjs/testing`.
- Check the NestJS migration guide for breaking changes before any major bump.

### React-Specific Update Considerations

- `react` and `react-dom` must always be the same version.
- React 18 -> 19 introduces breaking changes around refs, context, and removed legacy APIs. Plan a dedicated migration sprint.
- If using `react-scripts`, consider migrating to Vite or Next.js rather than updating CRA (which is no longer actively maintained).

---

## 4. License Compliance

### Scanning Commands

```bash
# Full license report
npx license-checker --json > licenses.json

# Summary by license type
npx license-checker --summary

# Fail on copyleft licenses (CI integration)
npx license-checker --failOn "GPL-2.0-only;GPL-2.0-or-later;GPL-3.0-only;GPL-3.0-or-later;AGPL-3.0-only;AGPL-3.0-or-later;SSPL-1.0"

# Alternative tool with better categorization
npx legally
```

### License Risk Categories

| Risk Level | Licenses | Action Required |
|-----------|----------|----------------|
| **Safe** (permissive) | MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0, 0BSD, Unlicense, CC0-1.0 | No action needed. These are fully compatible with commercial use. |
| **Low risk** (attribution required) | Apache-2.0, MPL-2.0 | Include license text and attribution in your distribution. Apache-2.0 includes a patent grant. |
| **Medium risk** (weak copyleft) | LGPL-2.1, LGPL-3.0, MPL-2.0 | Safe if used as a library (linked, not modified). If you modify the source, you must release modifications under the same license. Verify usage pattern. |
| **High risk** (strong copyleft) | GPL-2.0, GPL-3.0 | Your entire application may need to be released under GPL if you distribute it. Must replace or get legal review. |
| **Critical risk** (network copyleft) | AGPL-3.0, SSPL-1.0 | Even SaaS usage (no distribution) triggers copyleft obligations. Must replace immediately or open-source your application. |
| **Unknown / Custom** | No license, custom license, "SEE LICENSE IN..." | Must investigate manually. No license means "all rights reserved" by default -- you may not legally use it. |

### Common Problem Packages in NestJS + React Stacks

| Package | License | Risk | Notes |
|---------|---------|------|-------|
| `caniuse-lite` | CC-BY-4.0 | Low | Attribution required; generally fine |
| `@mapbox/node-pre-gyp` | BSD-3-Clause | Safe | Sometimes flagged due to sub-dependencies |
| `node-forge` | BSD-3-Clause + GPL-2.0 | Medium | Dual-licensed; use under BSD |
| `colors` (if present) | MIT | Safe but risky | Maintainer sabotaged v1.4.1; pin to 1.4.0 |
| `faker` (if present) | MIT | Safe but risky | Maintainer deleted; use `@faker-js/faker` instead |
| `sharp` | Apache-2.0 | Safe | Native dependency; verify build works |

### What to Do About License Issues

1. **Unknown licenses:** Run `npx license-checker --unknown` to find packages with no detected license. Check each package's GitHub repository manually.
2. **GPL-family in production deps:** If found, either (a) replace with a permissive alternative, (b) isolate in a separate process with IPC, or (c) get legal counsel.
3. **AGPL/SSPL in any deps:** Replace immediately. Common offenders: MongoDB driver (the server is SSPL but the driver is Apache-2.0 -- verify which you have).

---

## 5. Supply Chain Risk Assessment

### What to Check

```bash
# Check for packages with install scripts (potential attack vector)
npm query ':attr(scripts, [preinstall])' --workspaces
npm query ':attr(scripts, [postinstall])' --workspaces
npm query ':attr(scripts, [install])' --workspaces

# Check for packages that were recently transferred to new maintainers
# (manual check via npm registry)

# Check package provenance (npm v9+)
npm audit signatures --workspaces

# Check for typosquatting risks
# Review package names manually for common typosquats
```

### Supply Chain Risk Indicators

| Indicator | How to Check | Why It Matters |
|-----------|-------------|----------------|
| Install scripts | `npm query` commands above | Arbitrary code execution during `npm install` |
| Single maintainer | Check npm registry page | Bus factor risk; account compromise risk |
| Recent maintainer change | npm registry page + GitHub | Potential hostile takeover |
| No 2FA on publish | Cannot check externally | Higher risk of account compromise |
| Unpinned dependencies | Check your `package.json` | You may silently get malicious versions |
| No lockfile integrity | Verify `package-lock.json` has `integrity` hashes | Prevents substitution attacks |

### Recommendations

1. **Use a lockfile and commit it.** Ensure `package-lock.json` is in source control.
2. **Enable npm audit signatures** to verify package provenance.
3. **Pin critical dependencies** (auth, crypto, database) to exact versions in `package.json`.
4. **Use `npm ci`** in CI/CD instead of `npm install` to ensure lockfile is respected.
5. **Consider Socket.dev** or **Snyk** for deeper supply chain analysis.

---

## 6. Priority Matrix

### Severity x Exploitability Framework

Prioritize findings using this matrix:

```
                    Easy to Exploit    Hard to Exploit
                  +------------------+------------------+
  Critical Impact | P0 - FIX NOW     | P1 - Fix today   |
                  +------------------+------------------+
  High Impact     | P1 - Fix today   | P2 - Fix this    |
                  |                  |     sprint       |
                  +------------------+------------------+
  Medium Impact   | P2 - Fix this    | P3 - Plan fix    |
                  |     sprint       |                  |
                  +------------------+------------------+
  Low Impact      | P3 - Plan fix    | P4 - Backlog     |
                  +------------------+------------------+
```

### Priority Definitions

| Priority | Timeline | Examples |
|----------|----------|---------|
| **P0** | Within hours | RCE in production dependency, auth bypass, SQL injection in ORM |
| **P1** | Within 24 hours | Prototype pollution in server-side code, JWT algorithm confusion, XSS in user-facing content |
| **P2** | Within current sprint | ReDoS in request parsing, outdated TLS config, CSRF bypass |
| **P3** | Within 1-2 months | ReDoS in dev-only tooling, low-impact info disclosure, outdated minor versions |
| **P4** | Quarterly review | Dev dependency CVEs with no production path, cosmetic license attribution gaps |

### What Goes Where (NestJS + React Context)

**P0 (Immediate):**
- Any critical CVE in `@nestjs/platform-express`, `express`, `jsonwebtoken`, `passport`, database drivers
- Known RCE in any production dependency
- Credentials or secrets found in `package.json` or lockfile

**P1 (Today):**
- High-severity CVE in `class-transformer`, `class-validator`, `helmet`, `cors`
- GPL/AGPL license in production dependencies
- Packages with known supply chain compromises

**P2 (This Sprint):**
- Medium-severity CVEs in backend packages
- Outdated NestJS packages (behind latest minor)
- Missing security headers packages

**P3 (Next Cycle):**
- Frontend-only CVEs (ReDoS in CSS parsers, dev server issues)
- Packages behind by one major version
- License attribution gaps

**P4 (Backlog):**
- Dev-only dependency CVEs with no install scripts
- Informational advisories
- Packages where update is available but current version has no known issues

---

## 7. Remediation Plan

### Phase 1: Immediate Actions (Day 1)

```bash
# 1. Run the full audit
npm audit --workspaces --json > audit-$(date +%Y%m%d).json
npm outdated --workspaces > outdated-$(date +%Y%m%d).txt

# 2. Auto-fix what npm can handle (non-breaking)
npm audit fix --workspaces

# 3. Check what remains after auto-fix
npm audit --workspaces

# 4. Review force-fixable items (CAUTION: may include breaking changes)
npm audit fix --workspaces --dry-run --force
# Only run without --dry-run after reviewing each change
```

### Phase 2: Manual Vulnerability Remediation (Days 2-3)

For each remaining vulnerability after `npm audit fix`:

1. **Check if it's a production dependency:**
   ```bash
   npm audit --workspaces --omit=dev
   ```
   If it only appears in devDependencies, deprioritize it.

2. **Check if the vulnerable code path is reachable:**
   - Read the advisory (GHSA link in audit output).
   - Determine if your code actually uses the vulnerable function.
   - If not reachable, document and accept the risk.

3. **Resolution strategies (in order of preference):**

   | Strategy | When to Use | Command |
   |----------|------------|---------|
   | Update direct dependency | Direct dep has a fix | `npm install <package>@latest -w <workspace>` |
   | Override transitive dependency | Fix is in a nested dep your direct dep hasn't updated | Add `overrides` in root `package.json` |
   | Replace package | No fix available, package abandoned | Find alternative, refactor usage |
   | Accept risk | Dev-only, unreachable code path, low severity | Document in `audit-exceptions.json` |

4. **Using npm overrides for transitive dependencies:**
   ```json
   // package.json (root)
   {
     "overrides": {
       "vulnerable-package": ">=2.1.0",
       // Or for a specific parent:
       "parent-package": {
         "vulnerable-package": ">=2.1.0"
       }
     }
   }
   ```

### Phase 3: Outdated Package Updates (Days 3-5)

```bash
# Step 1: Update all patch versions (safe)
npm update --workspaces

# Step 2: Update minor versions one workspace at a time
npm install <package>@latest -w packages/backend
npm test -w packages/backend
# If tests pass, continue. If not, revert and investigate.

# Step 3: For major version upgrades, create a dedicated branch
git checkout -b chore/upgrade-nestjs-11
npm install @nestjs/core@11 @nestjs/common@11 @nestjs/platform-express@11 -w packages/backend
# Run full test suite, fix breaking changes, then PR
```

### Phase 4: License Remediation (Days 5-7)

1. Generate the license report:
   ```bash
   npx license-checker --json --production > prod-licenses.json
   ```

2. Filter for problematic licenses:
   ```bash
   npx license-checker --production --failOn "GPL-2.0-only;GPL-3.0-only;AGPL-3.0-only;SSPL-1.0"
   ```

3. For each flagged package:
   - Verify the license detection is correct (check the package's actual LICENSE file).
   - If dual-licensed, document which license you're using.
   - If truly GPL in production deps, find a permissive replacement.

4. Create a `LICENSE-THIRD-PARTY.md` file listing all production dependency licenses.

### Phase 5: Supply Chain Hardening (Days 7-10)

1. **Enable lockfile-only installs in CI:**
   ```yaml
   # GitHub Actions example
   - run: npm ci --workspaces
   ```

2. **Pin critical packages to exact versions:**
   ```json
   {
     "dependencies": {
       "jsonwebtoken": "9.0.2",
       "bcrypt": "5.1.1",
       "@prisma/client": "5.10.2"
     }
   }
   ```

3. **Add npm audit to CI pipeline:**
   ```yaml
   # .github/workflows/security.yml
   name: Security Audit
   on:
     push:
       branches: [main]
     pull_request:
     schedule:
       - cron: '0 6 * * 1'  # Weekly Monday 6am UTC

   jobs:
     audit:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - run: npm ci
         - run: npm audit --workspaces --audit-level=high
         - run: npx license-checker --production --failOn "GPL-2.0-only;GPL-3.0-only;AGPL-3.0-only;SSPL-1.0"
   ```

4. **Set up Dependabot or Renovate for automated PRs:**

   ```yaml
   # .github/dependabot.yml
   version: 2
   updates:
     - package-ecosystem: "npm"
       directory: "/"
       schedule:
         interval: "weekly"
       groups:
         nestjs:
           patterns:
             - "@nestjs/*"
         react:
           patterns:
             - "react"
             - "react-dom"
             - "@types/react*"
         testing:
           patterns:
             - "jest"
             - "@testing-library/*"
             - "supertest"
       open-pull-requests-limit: 10
   ```

---

## 8. Automation Recommendations

### Ongoing Monitoring

| Tool | Purpose | Integration |
|------|---------|-------------|
| `npm audit` | Built-in vulnerability scanning | CI pipeline (see above) |
| **Dependabot** | Automated dependency update PRs | GitHub native, free |
| **Renovate** | More configurable alternative to Dependabot | GitHub App, free for open source |
| **Snyk** | Deep vulnerability scanning + container scanning | GitHub integration, free tier available |
| **Socket.dev** | Supply chain attack detection | GitHub App, detects install scripts + typosquatting |
| `license-checker` | License compliance | CI pipeline |
| **FOSSA** | Enterprise license compliance + SBOM | For compliance-heavy environments |

### Recommended CI Pipeline Order

```
1. npm ci (lockfile-only install)
2. npm audit --audit-level=high (fail on high/critical)
3. npx license-checker --failOn <copyleft-licenses>
4. npm run lint (all workspaces)
5. npm run test (all workspaces)
6. npm run build (all workspaces)
```

### SBOM Generation (if required for compliance)

```bash
# Generate CycloneDX SBOM
npx @cyclonedx/cyclonedx-npm --output-file sbom.json

# Generate SPDX SBOM
npx spdx-sbom-generator
```

---

## Summary

| Audit Area | Key Actions | Timeline |
|-----------|-------------|----------|
| Vulnerabilities | Run `npm audit`, fix critical/high immediately, override transitive deps | Days 1-3 |
| Outdated Packages | Patch/minor updates immediately, plan major upgrades as dedicated sprints | Days 3-5 |
| License Compliance | Scan with `license-checker`, remove or replace GPL/AGPL deps | Days 5-7 |
| Supply Chain | Pin critical deps, enforce `npm ci` in CI, set up Dependabot/Renovate | Days 7-10 |
| Automation | Add security audit to CI, schedule weekly scans, configure Dependabot groups | Day 10+ |

The highest-priority action is running `npm audit --workspaces --omit=dev` to identify production vulnerabilities, then working through the priority matrix above. Backend (NestJS) vulnerabilities take precedence over frontend (React) because they are server-side and directly exposed to attackers.
