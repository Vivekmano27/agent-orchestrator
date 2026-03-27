---
name: release-manager
description: Manage releases — semantic versioning, changelog generation, release notes, git tags, and rollback procedures. Use when the user says "create release", "version bump", "changelog", "release notes", or needs to ship a new version.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Release Manager Skill

## Step 1: Determine Version Bump

Read the commit log since the last tag and classify every commit. Use the highest-priority match:

```
git log $(git describe --tags --abbrev=0 2>/dev/null || echo "")..HEAD --oneline
```

### Semantic Version Decision Tree

```
Has any commit message or BREAKING CHANGE footer indicating a breaking change?
  ├── YES → MAJOR bump (X.0.0)
  │         Examples: removed API endpoint, renamed public function,
  │         changed response shape, dropped support for Node < 18
  └── NO
      Has any commit with type feat or feat(scope)?
        ├── YES → MINOR bump (x.Y.0)
        │         Examples: new endpoint, new CLI flag, new optional config field
        └── NO → PATCH bump (x.y.Z)
                  Examples: bug fix, performance improvement, dependency update,
                  docs change, refactor with no public API change
```

### Constraint: Never Auto-Bump Major

If the decision tree yields MAJOR, stop and present the breaking changes to the user for confirmation before proceeding. List every breaking commit with its hash and description.

## Step 2: Update Version in Source Files

Detect the project type and update the version string:

```bash
# Node.js — update package.json (and package-lock.json via npm)
npm version <major|minor|patch> --no-git-tag-version

# Python — update pyproject.toml or setup.cfg
# Look for: version = "x.y.z" and replace in-place

# Gradle — update build.gradle or gradle.properties
# Look for: version = 'x.y.z' or VERSION_NAME=x.y.z

# Rust — update Cargo.toml
# Look for: version = "x.y.z" under [package]

# Flutter/Dart — update pubspec.yaml
# Look for: version: x.y.z+buildnumber
```

## Step 3: Generate Changelog

Write or update `CHANGELOG.md` at the project root following the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format exactly. Group commits by type:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2026-03-15

### Added
- User profile page with avatar upload (#123)
- Bulk export endpoint for admin dashboard (#145)

### Changed
- Improved search query performance by 3x via compound index (#156)

### Deprecated
- `GET /api/v1/users/search` — use `GET /api/v2/users/search` instead (#160)

### Removed
- Legacy XML response format (#134)

### Fixed
- Login redirect loop on expired sessions (#189)
- Race condition in concurrent order placement (#192)

### Security
- Updated jsonwebtoken to 9.0.1 to patch CVE-2026-12345 (#200)

## [1.2.0] - 2026-02-20
...

[Unreleased]: https://github.com/org/repo/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/org/repo/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/org/repo/compare/v1.1.0...v1.2.0
```

### Changelog Rules
- The `[Unreleased]` section always exists and is always at the top (below the header).
- Comparison links at the bottom are mandatory — they make the changelog navigable on GitHub.
- Each entry references the PR/issue number in parentheses.
- Commit type mapping: `feat` -> Added, `fix` -> Fixed, `perf/refactor` -> Changed, `security/deps with CVE` -> Security, `BREAKING` -> Removed or Changed with migration note.

## Step 4: Create Git Tag and Release

```bash
# Create annotated tag (never lightweight)
git tag -a v1.3.0 -m "Release v1.3.0

Highlights:
- User profile page with avatar upload
- 3x search performance improvement
- Fixed login redirect loop

Breaking changes: none"

# Push tag
git push origin v1.3.0

# Create GitHub release from tag (if gh CLI available)
gh release create v1.3.0 \
  --title "v1.3.0" \
  --notes-file .claude/specs/[feature]/release-notes.md
```

## Step 5: Write Release Notes

Output to `.claude/specs/[feature]/release-notes.md`:

```markdown
# Release v1.3.0

**Date:** 2026-03-15 | **Previous:** v1.2.0 | **Commits:** 47

## Highlights
- User profile page with avatar upload
- 3x search performance improvement

## Breaking Changes
_None in this release._

<!-- If breaking changes exist, use this format:
### `GET /api/v1/users/search` removed
**Migration:** Replace with `GET /api/v2/users/search`. The `q` parameter is now `query`.
Response shape changed from `{ results: [] }` to `{ data: [], meta: { total, page } }`.
-->

## What's New
- User profile page with avatar upload (#123)
- Bulk export endpoint for admin dashboard (#145)

## Bug Fixes
- Login redirect loop on expired sessions (#189)
- Race condition in concurrent order placement (#192)

## Security
- Updated jsonwebtoken to 9.0.1 (CVE-2026-12345)

## Upgrade Guide
1. Run `npm install` to get updated dependencies
2. Run `npm run migrate` for new profile table
3. Update API clients if using deprecated search endpoint

## Rollback Procedure
If this release causes issues:
\```bash
# Revert to previous version
git checkout v1.2.0
# Redeploy (adjust for your deployment method)
npm ci && npm run build && npm start
# If database migrations were applied, run rollback
npm run migrate:down
\```
```

## Constraint: No Release Without Passing CI

Before creating the tag, verify CI status:
```bash
# Check if current commit passes CI
gh run list --branch main --limit 1 --json status,conclusion
```
If the latest run is not `success`, stop and report the failure. Do not create a release from a failing build.

## Anti-Patterns

- **Releasing from a failing build** — creating a release when CI is red; always verify CI passes first
- **No changelog** — releasing without documenting what changed; users and developers need to know what's in each version
- **Skipping semver** — bumping versions randomly instead of following semver rules (breaking = major, feature = minor, fix = patch)
- **No git tag** — releasing without a corresponding git tag; tags are the source of truth for what code is in a release
- **Manual version bumps** — editing version numbers by hand in multiple files; automate via scripts or CI
- **No rollback procedure** — releasing without knowing how to revert to the previous version

## Checklist

- [ ] CI passes on the release commit
- [ ] Version bumped following semver (major/minor/patch)
- [ ] CHANGELOG.md updated with grouped entries (Added/Changed/Fixed/Security)
- [ ] Git tag created (v{version})
- [ ] GitHub release created with release notes
- [ ] All release artifacts built and published
- [ ] Rollback procedure documented (which tag to revert to)
- [ ] Team notified of the release
