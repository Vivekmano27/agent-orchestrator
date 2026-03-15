# Phase 2.5: Git Setup

**Executor:** project-orchestrator (YOU — no subagent needed)

## Preconditions
- `.claude/specs/[feature]/tasks.md` exists (Phase 2.1)
- Approval gate passed (if applicable)

## Dispatch Instructions

**2.5a. Check if git is already initialized:**
```bash
git rev-parse --is-inside-work-tree 2>/dev/null && echo "already a repo" || echo "no repo"
```

**2.5b. If no repo, initialize it:**
```bash
git init
git checkout -b main
```

**2.5c. Create .gitignore if it doesn't exist:**
Create .gitignore covering Node, Python, Flutter, Dart, .env files, OS files.

**2.5d. Create feature branch (NEVER work on main directly):**
```bash
git checkout -b feature/[feature-name]
```

**2.5e. Make initial commit if repo is new:**
```bash
git add .gitignore
git commit -m "chore: initialize project"
```

## Expected Outputs
- Git repository initialized (or already exists)
- Current branch is `feature/[feature-name]`
- `.gitignore` exists

## Content Validation
- `git status` returns a clean working tree or shows only new untracked files
- Current branch is `feature/[feature-name]` (never `main`)
- `.gitignore` exists

## Conditional Logic
- None — always runs
