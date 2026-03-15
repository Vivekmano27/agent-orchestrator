---
name: changelog-generator
description: Auto-generate changelogs from git commits using conventional commit format. Groups by Added/Changed/Fixed/Security. Use when the user says "generate changelog", "CHANGELOG.md", "release notes from commits", "what changed", or needs to create a changelog for a release.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Changelog Generator Skill

Auto-generate changelogs from git history using conventional commit format. Parses commit messages, groups them by type and scope, and produces a CHANGELOG.md following the Keep a Changelog standard.

## When to Use

- A release is being prepared and a changelog is needed
- User asks to generate or update the CHANGELOG.md
- A version tag is about to be created
- Stakeholders need a summary of what changed since the last release
- CI/CD pipeline needs automated release notes

## Patterns

### Conventional Commit Parsing

Map commit prefixes to changelog sections:

| Commit Prefix | Changelog Section | Semver Impact |
|---------------|-------------------|---------------|
| `feat`        | Added             | minor         |
| `fix`         | Fixed             | patch         |
| `refactor`    | Changed           | patch         |
| `perf`        | Changed           | patch         |
| `docs`        | Documentation     | none          |
| `security`    | Security          | patch         |
| `BREAKING CHANGE` | Breaking Changes | major     |
| `deprecate`   | Deprecated        | minor         |
| `revert`      | Reverted          | patch         |

Commits with `chore`, `ci`, `test`, or `build` prefixes are excluded from user-facing changelogs.

### Extract Commits Since Last Tag

```bash
# Get the latest tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

# List commits since that tag (or all commits if no tag exists)
if [ -n "$LAST_TAG" ]; then
  git log "${LAST_TAG}..HEAD" --pretty=format:"%h|%s|%an|%ad" --date=short
else
  git log --pretty=format:"%h|%s|%an|%ad" --date=short
fi
```

### Grouping by Scope

When the project is a monorepo, group entries by scope derived from the conventional commit:

```
feat(core-service): add project archiving endpoint
fix(ai-service): handle timeout on large inference requests
feat(web): add dark mode toggle to settings page
fix(mobile): correct bottom nav badge count on iOS
```

This produces a changelog organized by service:

```markdown
### Core Service
- **Added:** Project archiving endpoint (#142)

### AI Service
- **Fixed:** Handle timeout on large inference requests (#156)

### Web
- **Added:** Dark mode toggle to settings page (#161)

### Mobile
- **Fixed:** Correct bottom nav badge count on iOS (#158)
```

### Version Numbering (Semver)

Determine the next version automatically:

```bash
# If any commit contains "BREAKING CHANGE" or has a "!" after the type → major bump
# If any commit starts with "feat" → minor bump
# Otherwise → patch bump
```

Example logic:

```bash
COMMITS=$(git log "${LAST_TAG}..HEAD" --pretty=format:"%s")

if echo "$COMMITS" | grep -qE "^.*!:|BREAKING CHANGE"; then
  BUMP="major"
elif echo "$COMMITS" | grep -qE "^feat"; then
  BUMP="minor"
else
  BUMP="patch"
fi
```

### CHANGELOG.md Template (Keep a Changelog)

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-03-14

### Added
- Project archiving endpoint with soft-delete support (#142)
- Dark mode toggle to settings page (#161)

### Fixed
- Handle timeout on large AI inference requests (#156)
- Correct bottom nav badge count on iOS (#158)

### Changed
- Refactor user authentication flow to use refresh token rotation (#149)

### Security
- Upgrade jsonwebtoken to patch CVE-2026-XXXX (#163)

## [1.1.0] - 2026-02-28
...
```

### Linking to Commits and PRs

Always include the short hash or PR number so readers can trace changes:

```markdown
- **Added:** User profile avatars ([#134](https://github.com/org/repo/pull/134))
- **Fixed:** Race condition in queue consumer (`a1b2c3d`)
```

## Anti-patterns

- **Manual changelogs** — hand-writing entries leads to drift and missing items; always generate from git history
- **No version tags** — without tags there is no anchor for "since last release"; tag every release
- **Mixing unrelated changes in one release** — prefer single-responsibility releases; if scope is too broad, split the release
- **Including internal chores** — `chore`, `ci`, `test` commits clutter user-facing changelogs; filter them out
- **No PR or commit references** — entries without traceability make debugging regressions harder
- **Inconsistent date format** — always use ISO 8601 (`YYYY-MM-DD`)

## Checklist

- [ ] All commits since the last tag follow conventional commit format
- [ ] Commits are parsed and grouped into the correct changelog sections
- [ ] Version bump is calculated from commit types (major/minor/patch)
- [ ] Entries are grouped by scope (service) in monorepo projects
- [ ] Each entry includes a PR number or commit hash for traceability
- [ ] `chore`, `ci`, `test`, and `build` commits are excluded
- [ ] CHANGELOG.md follows Keep a Changelog format
- [ ] Date uses ISO 8601 format
- [ ] New version is prepended (not appended) to the changelog
- [ ] A git tag is created for the new version after the changelog is finalized
