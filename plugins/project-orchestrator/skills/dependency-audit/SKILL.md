---
name: dependency-audit
description: "Scan dependencies for vulnerabilities, outdated packages, license conflicts, and supply chain risks. Use when the user says \"audit dependencies\", \"check vulnerabilities\", \"update packages\", \"npm audit\", \"supply chain security\", \"CVE check\", or needs to verify project dependencies are secure before deployment."
allowed-tools: Read, Bash, Grep, Glob
---

# Dependency Audit Skill

Scan and secure project dependencies. Covers vulnerability detection, outdated package identification, license compliance, and supply chain risk assessment.

## When to Use

- Before deploying to production or making a release
- During security audit (Phase 5 of the pipeline)
- When `npm audit` or `pip-audit` reports vulnerabilities
- After adding new dependencies to the project
- When a new CVE is announced for a common package
- Periodic scheduled audits (monthly recommended)

## Audit Process

1. Read project-config.md to determine which ecosystems are present
2. Run vulnerability scan per ecosystem
3. Triage findings by severity and reachability
4. Check for outdated packages with known CVEs
5. Review license compatibility
6. Check for supply chain risks (unpinned deps, missing lockfiles)
7. Create remediation plan for findings
8. Output structured findings table

## Commands by Ecosystem

| Ecosystem | Audit Command | Output |
|-----------|---------------|--------|
| Node.js | `npm audit --json > npm-audit.json` | JSON with CVE details |
| Python | `pip-audit -f json -o pip-audit.json` | JSON with CVE details |
| Go | `govulncheck -json ./... > govulncheck.json` | JSON with reachability analysis |
| Rust | `cargo audit --json > cargo-audit.json` | JSON with advisory details |
| Multi | `trivy fs --scanners vuln --format json --output trivy-deps.json .` | All ecosystems |

**Note:** `govulncheck` performs reachability analysis — it only reports vulnerabilities in code paths that are actually called. This is a strength: a CRITICAL CVE in an unused function is lower risk than a MEDIUM CVE in a hot path.

## Triage Framework

Not all vulnerabilities are equal. Triage by severity AND reachability:

| CVSS Score | Base Severity | Reachable? | Action |
|-----------|--------------|------------|--------|
| 9.0+ | CRITICAL | Yes | Fix immediately — blocks deployment |
| 9.0+ | CRITICAL | No | Downgrade to HIGH, fix within 1 week |
| 7.0-8.9 | HIGH | Yes | Fix within 1 week |
| 7.0-8.9 | HIGH | No | Downgrade to MEDIUM, fix within 2 weeks |
| 4.0-6.9 | MEDIUM | Yes/No | Fix within 1 month |
| 0.1-3.9 | LOW | Yes/No | Track, fix during next maintenance |

### How to Check Reachability

```bash
# Go: built-in reachability analysis
govulncheck ./...

# Node.js: check if vulnerable function is imported
grep -r "require.*vulnerable-package" src/
grep -r "from.*vulnerable-package" src/

# Python: check if vulnerable module is used
grep -r "import vulnerable_package" src/
grep -r "from vulnerable_package" src/
```

## Remediation Strategies

### Strategy 1: Direct Upgrade (Preferred)

```bash
# Node.js
npm update affected-package
# If major version: npm install affected-package@latest

# Python
pip install --upgrade affected-package
# Or update requirements.txt/pyproject.toml constraint

# Go
go get affected-package@latest
go mod tidy
```

### Strategy 2: Patch via Override (When Direct Upgrade Breaks Things)

```json
// package.json — force a transitive dependency to a fixed version
{
  "overrides": {
    "vulnerable-transitive-dep": ">=2.1.1"
  }
}
```

```toml
# pyproject.toml — constraint on transitive dependency
[tool.pip-audit]
ignore = ["PYSEC-2024-XXX"]  # Only if confirmed unreachable
```

### Strategy 3: Replace Package (When No Fix Available)

If the package is abandoned or the maintainer won't patch:

1. Search for maintained alternatives (`npm search`, `pip search`)
2. Evaluate alternatives for API compatibility
3. Create migration task with estimated effort
4. Replace and verify all tests pass

## Supply Chain Checks

- [ ] Lockfile exists and is committed (`package-lock.json`, `yarn.lock`, `Pipfile.lock`, `go.sum`)
- [ ] No unpinned dependencies (`"^"`, `"~"`, `"*"` ranges in package.json)
- [ ] No suspicious `postinstall`/`preinstall` scripts in dependencies
- [ ] Registries point to official sources (no untrusted private registries)
- [ ] Docker base images pinned to specific SHA or version tag (not `:latest`)
- [ ] Dependencies downloaded over HTTPS (no HTTP registry URLs)

## License Compliance

```bash
# Node.js: check all licenses
npx license-checker --summary --production

# Python
pip-licenses --format=table --with-urls
```

| License | Compatibility | Notes |
|---------|--------------|-------|
| MIT, ISC, BSD-2, BSD-3 | Compatible with all | No restrictions |
| Apache-2.0 | Compatible with most | Requires attribution |
| LGPL-2.1, LGPL-3.0 | Use with caution | Dynamic linking OK, static linking requires LGPL |
| GPL-2.0, GPL-3.0 | Restrictive | Viral — your code must also be GPL |
| AGPL-3.0 | Very restrictive | Network use triggers copyleft |
| Unlicensed / No License | Block | No license = no permission to use |

## Structured Output

```markdown
## Dependency Audit Results

| Package | Ecosystem | Current | Vulnerability | CVE | Severity | Fix Version | Reachable? |
|---------|-----------|---------|---------------|-----|----------|-------------|------------|
| express | npm | 4.17.1 | Prototype pollution | CVE-2024-XXXX | HIGH | 4.18.0 | Yes |
| requests | pip | 2.28.0 | SSRF via redirect | CVE-2023-XXXX | MEDIUM | 2.31.0 | Unknown |

### Summary
- **Total vulnerabilities:** 5
- **Critical (reachable):** 0
- **High (reachable):** 1 — blocks deployment
- **Outdated packages:** 12 (3 with security implications)
- **License issues:** 0
- **Supply chain risks:** 1 (missing lockfile for Python service)
```

## Anti-Patterns

- **Ignoring audit output** — running `npm audit` and dismissing all findings without triage; every finding needs a decision (fix, accept risk, or mark unreachable)
- **Force-resolving without understanding** — using `npm audit fix --force` blindly; this can introduce breaking changes from major version bumps
- **Unpinned dependencies in production** — using `^` or `~` ranges means builds are non-deterministic; pin exact versions for production
- **No lockfile committed** — without a lockfile, every `npm install` or `pip install` can pull different versions
- **Ignoring transitive vulnerabilities** — "it's not our code" is not an excuse; you ship the transitive dependency to your users
- **Using abandoned packages** — packages with no commits in 2+ years and open CVEs should be replaced

## Checklist

- [ ] Vulnerability scan completed for all ecosystems in project-config.md
- [ ] All CRITICAL and HIGH findings triaged (reachability checked)
- [ ] Remediation plan created for findings above MEDIUM
- [ ] Lockfiles exist and are committed for all ecosystems
- [ ] No unpinned dependencies in production configs
- [ ] License compatibility verified (no GPL/AGPL in proprietary code)
- [ ] Supply chain checks passed (no suspicious scripts, official registries only)
- [ ] Outdated packages identified with upgrade timeline
- [ ] Findings documented in structured output format
