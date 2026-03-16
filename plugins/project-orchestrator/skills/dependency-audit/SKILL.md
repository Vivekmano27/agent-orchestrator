---
name: dependency-audit
description: Scan dependencies for vulnerabilities, outdated packages, license conflicts, and supply chain risks. Use when the user says "audit dependencies", "check vulnerabilities", "update packages", "npm audit", "supply chain security".
allowed-tools: Read, Bash, Grep, Glob
---

# Dependency Audit Skill

Scan and secure project dependencies. Skip ecosystems not present in project-config.md.

## Audit Process
1. Read project-config.md to determine which ecosystems are present
2. Run vulnerability scan per ecosystem (commands below)
3. Check for outdated packages with known CVEs
4. Review license compatibility
5. Identify abandoned/unmaintained packages
6. Check for supply chain risks (unpinned deps, missing lockfiles, suspicious install scripts)
7. Output structured findings table

## Commands by Ecosystem (with structured JSON output)

| Ecosystem | Audit Command | Output |
|---|---|---|
| Node.js | `npm audit --json > npm-audit.json` | JSON with CVE details |
| Python | `pip-audit -f json -o pip-audit.json` | JSON with CVE details |
| Go | `govulncheck -json ./... > govulncheck.json` | JSON (includes reachability analysis) |
| Rust | `cargo audit --json > cargo-audit.json` | JSON with advisory details |
| Multi-ecosystem | `trivy fs --scanners vuln --format json --output trivy-deps.json .` | JSON covering all ecosystems |

**Note:** `govulncheck` already performs reachability analysis — it only reports vulnerabilities in code paths that are actually called. Flag this as a strength when presenting Go findings.

## Structured Output Table

Report findings in this format for security-auditor to aggregate:

```markdown
## Dependency Audit Results

| Package | Ecosystem | Current | Vulnerability | CVE | Severity | Fix Version | Reachable? |
|---|---|---|---|---|---|---|---|
| express | npm | 4.17.1 | Prototype pollution | CVE-2024-XXXX | HIGH | 4.18.0 | Yes |
| requests | pip | 2.28.0 | SSRF via redirect | CVE-2023-XXXX | MEDIUM | 2.31.0 | Unknown |
```

## Supply Chain Checks

- [ ] Lockfile exists and is committed (`package-lock.json`, `yarn.lock`, `Pipfile.lock`, `go.sum`)
- [ ] No unpinned dependencies (`"^"`, `"~"`, `"*"` in package.json ranges)
- [ ] Check for suspicious `postinstall`/`preinstall` scripts in dependencies
- [ ] Registries point to official sources (no untrusted private registries in `.npmrc`/`pip.conf`)
- [ ] Docker base images pinned to specific SHA or version tag (not `:latest`)

## Severity Mapping

Use the CVE's CVSS score directly. If the vulnerable code path is NOT reachable (govulncheck confirms), downgrade one level:
- CRITICAL (CVSS 9.0+) unreachable → report as HIGH
- HIGH (CVSS 7.0-8.9) unreachable → report as MEDIUM
