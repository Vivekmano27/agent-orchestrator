---
name: release-manager
description: Manage releases — semantic versioning, changelog generation, release notes, git tags, and rollback procedures. Use when the user says "create release", "version bump", "changelog", "release notes", or needs to ship a new version.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Release Manager Skill

Structured release management with semantic versioning.

## Semantic Versioning
```
MAJOR.MINOR.PATCH
  │      │     └── Bug fixes (backward compatible)
  │      └──────── New features (backward compatible)
  └─────────────── Breaking changes
```

## Release Checklist
1. [ ] All tests passing on main branch
2. [ ] Changelog updated
3. [ ] Version bumped in package.json / build file
4. [ ] Migration guide written (if breaking changes)
5. [ ] Git tag created: `git tag -a v1.2.0 -m "Release 1.2.0"`
6. [ ] Release notes published
7. [ ] Deployment to production completed
8. [ ] Monitoring verified (no error spikes)
9. [ ] Stakeholders notified

## Changelog Format (Keep a Changelog)
```markdown
## [1.2.0] - 2026-03-14
### Added
- User profile page with avatar upload (#123)
### Changed
- Improved search performance by 3x (#456)
### Fixed
- Login redirect loop on expired sessions (#789)
### Security
- Updated dependency X to patch CVE-2026-XXXX
```
