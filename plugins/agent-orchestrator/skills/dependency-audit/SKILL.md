---
name: dependency-audit
description: Scan dependencies for vulnerabilities, outdated packages, license conflicts, and supply chain risks. Use when the user says "audit dependencies", "check vulnerabilities", "update packages", "npm audit", "supply chain security".
allowed-tools: Read, Bash, Grep, Glob
---

# Dependency Audit Skill

Scan and secure project dependencies.

## Audit Process
1. Run `npm audit` / `pip audit` / `cargo audit`
2. Check for outdated packages
3. Review license compatibility
4. Identify abandoned/unmaintained packages
5. Check for known supply chain attacks

## Commands by Ecosystem
| Ecosystem | Audit | Update | Check Outdated |
|-----------|-------|--------|----------------|
| Node.js | `npm audit` | `npm update` | `npm outdated` |
| Python | `pip-audit` | `pip install -U` | `pip list --outdated` |
| Rust | `cargo audit` | `cargo update` | `cargo outdated` |
| Go | `govulncheck ./...` | `go get -u` | `go list -m -u all` |
