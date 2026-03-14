---
name: git-workflow
description: Manage Git operations -- branching strategies, conventional commits, PR workflow, rebase, conflict resolution, and feature branch lifecycle. Use when setting up or managing the development workspace and tooling.
allowed-tools: Read, Bash, Grep, Glob
---

# Git Workflow Skill

Git workflow conventions for this microservices project.

## When to Use
- Creating feature branches or fixing bugs
- Writing commit messages
- Opening or reviewing pull requests
- Resolving merge conflicts or rebasing

## Branch Naming

Format: `type/short-description`

| Prefix | Use Case | Example |
|--------|----------|---------|
| `feature/` | New functionality | `feature/user-authentication` |
| `fix/` | Bug fixes | `fix/order-total-calculation` |
| `chore/` | Maintenance, deps | `chore/upgrade-nestjs-10` |
| `refactor/` | Code restructuring | `refactor/extract-payment-service` |

```bash
git checkout main && git pull origin main
git checkout -b feature/add-user-notifications
```

## Conventional Commits

Format: `type(scope): description`

```
feat(core-service): add order status webhook endpoint
fix(ai-service): handle timeout on LLM inference calls
chore(web): upgrade next.js to 14.2
refactor(api-gateway): extract rate limiter to shared module
test(core-service): add integration tests for payment flow
docs(readme): update local development setup instructions
ci(github-actions): add flutter build to CI pipeline
```

**Types:** `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `ci`
**Scopes:** `api-gateway`, `core-service`, `ai-service`, `web`, `mobile-flutter`, `mobile-kmp`, `infra`, `shared`

### Commit body for context
```bash
git commit -m "$(cat <<'EOF'
fix(core-service): prevent duplicate order creation on retry

Adds unique constraint on (user_id, idempotency_key) and checks
for existing orders before insert.

Closes #142
EOF
)"
```

## Single-Responsibility Commits

Each commit does exactly one thing:

```bash
git add services/core-service/prisma/migrations/
git commit -m "feat(core-service): add notifications table migration"

git add services/core-service/src/modules/notifications/
git commit -m "feat(core-service): implement notification service and controller"

git add services/core-service/src/modules/notifications/*.spec.ts
git commit -m "test(core-service): add unit tests for notification service"
```

## PR Workflow: Draft -> Review -> Merge

```bash
git push -u origin feature/user-notifications

gh pr create --draft \
  --title "feat(core-service): add user notification system" \
  --body "$(cat <<'EOF'
## Summary
- Add notifications table and Prisma migration
- Implement NotificationService with email and in-app channels

## Test plan
- [ ] Unit tests pass: `cd services/core-service && npm test`
- [ ] Manual test: create notification via API
EOF
)"

gh pr ready          # after CI passes
gh pr merge --squash --delete-branch
```

## Rebase Strategy

```bash
git checkout main && git pull origin main
git checkout feature/user-notifications
git rebase main
# Resolve conflicts: edit files, git add, git rebase --continue
git push --force-with-lease origin feature/user-notifications
```

## Conflict Resolution

**Module imports (most common):** accept both -- they are independent.
**Migration conflicts:** regenerate with `npx prisma migrate dev --name merge_fix`.
**Lock file conflicts:** accept theirs, run `npm install`, re-add.

## Anti-Patterns
- **Never commit directly to main** -- always use a feature branch
- **Never use generic messages** like "fix", "update", "wip"
- **Never force-push to main** -- only force-push your own feature branches
- **Never rebase already-merged commits**
- **Never mix unrelated changes** in a single commit

## Checklist
- [ ] Branch name follows `type/short-description` convention
- [ ] All commits use `type(scope): description` format
- [ ] Each commit is single-responsibility
- [ ] Branch rebased onto latest main before merge
- [ ] PR has summary and test plan
- [ ] CI passes before marking ready for review
- [ ] Feature branch deleted after merge
- [ ] No secrets or .env files in commits
