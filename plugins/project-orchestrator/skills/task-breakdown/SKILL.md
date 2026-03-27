---
name: task-breakdown
description: Break features into ordered, dependency-aware implementation tasks with verification commands, file lists, effort estimates, and commit messages. Use when the user says "break this into tasks", "create implementation plan", "task breakdown", "decompose this feature", or needs to convert a design into actionable coding steps.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Task Breakdown Skill

Convert feature specs and designs into ordered, dependency-aware implementation tasks that an AI coding agent can execute autonomously.

## Constraints

- NEVER create a task without a verification command. If you cannot define how to verify it, the task is too vague.
- NEVER create tasks larger than XL. If a task is XL, split it further.
- NEVER assign two tasks to different agents that modify the same file without declaring a dependency between them.
- Every task list MUST start with a foundation task (project setup, config, shared types) — agents fail when they start mid-air.
- Task IDs MUST be sequential and stable. Never renumber tasks after initial breakdown (use TASK-005a for insertions).

## Output Format

Write output to `.claude/specs/[feature]/tasks.md` using this exact structure:

```markdown
# Task Breakdown: [Feature Name]
**Source:** [link to design doc or PRD]
**Total tasks:** [N] | **Estimated effort:** [sum of estimates]
**Critical path:** TASK-001 -> TASK-003 -> TASK-005 -> TASK-007

## Dependency Graph
```
TASK-001 (DB schema)
  -> TASK-002 (seed data)
  -> TASK-003 (API service layer)
       -> TASK-004 (API routes)
       -> TASK-005 (Frontend components)
            -> TASK-006 (Integration wiring)
                 -> TASK-007 (E2E tests)
```

## Tasks

- [ ] **TASK-001:** Create database schema for [entity] `S`
  - **Agent:** backend-developer
  - **Description:** [Exact instructions — what tables, columns, constraints, indexes]
  - **Dependencies:** none
  - **Files:**
    - Create: `src/db/migrations/YYYYMMDD_create_[table].sql`
    - Create: `src/db/schema/[table].ts`
  - **Verify:** `npm run db:migrate && npm run db:check`
  - **Commit:** `feat(db): add [entity] schema and migration`

- [ ] **TASK-002:** Add seed data for [entity] `S`
  - **Agent:** backend-developer
  - **Description:** [What test data to create, how many records, edge cases to include]
  - **Dependencies:** blocked by TASK-001
  - **Files:**
    - Create: `src/db/seeds/[entity].seed.ts`
  - **Verify:** `npm run db:seed && npm run db:query "SELECT count(*) FROM [table]"`
  - **Commit:** `feat(db): add [entity] seed data`

- [ ] **TASK-003:** Implement [entity] service layer `M`
  - **Agent:** backend-developer
  - **Description:** [CRUD operations, validation rules, business logic, error handling]
  - **Dependencies:** blocked by TASK-001
  - **Files:**
    - Create: `src/services/[entity].service.ts`
    - Create: `src/services/[entity].service.test.ts`
  - **Verify:** `npm test -- --grep "[entity] service"`
  - **Commit:** `feat(api): add [entity] service with CRUD operations`

[Continue for all tasks...]
```

## Dependency Detection Heuristics

Apply these rules in order to determine task dependencies. When in doubt, add the dependency — a false dependency only slows execution, a missing dependency causes failures.

| If the task involves...              | Then it is blocked by...                           |
|--------------------------------------|----------------------------------------------------|
| Database queries or ORM models       | Schema migration task                              |
| API route handlers                   | Service layer task for that entity                  |
| Frontend data fetching               | API route that serves that data                     |
| Frontend form submission             | API route that accepts that data + validation task  |
| Integration / E2E tests              | Both the API and UI tasks for that flow             |
| Shared types / interfaces            | Nothing (these go first)                            |
| Service-specific code                | Shared library / util tasks                         |
| Auth-protected routes                | Auth middleware task                                |
| File upload UI                       | Storage service task + upload API endpoint           |
| Notification sending                 | Notification service setup + template task          |
| Deployment / CI config               | All implementation tasks (these go last)            |

## Effort Estimation Rubric

| Size | Time      | Criteria                                                       |
|------|-----------|----------------------------------------------------------------|
| S    | < 30 min  | Single file, mechanical change, pattern already exists in codebase |
| M    | 30m - 2h  | 2-4 files, some logic, follows established patterns            |
| L    | 2h - 4h   | 4-8 files, new pattern introduction, moderate complexity       |
| XL   | 4h+       | 8+ files or cross-cutting concern — MUST be split further      |

Estimation signals:
- New DB table + migration = S (mechanical)
- CRUD service with validation = M (logic but repeatable pattern)
- Auth system from scratch = L (security-critical, multiple moving parts)
- If you write "and" in the description more than twice, the task is too big

## Parallelization Rules

Tasks that share no file dependencies and no data dependencies can run in parallel. Mark these explicitly:

```markdown
## Parallel Group A (can run simultaneously after TASK-001)
- [ ] TASK-002 (seed data)
- [ ] TASK-003 (service layer)

## Parallel Group B (can run simultaneously after TASK-003)
- [ ] TASK-004 (API routes)
- [ ] TASK-005 (frontend components)
```

## Task Writing Anti-Patterns

- "Implement the feature" — too vague, agent won't know when it's done
- "Fix any issues" — not a task, it's a wish
- "Update tests" — which tests? What behavior? What assertions?
- TASK with no Files section — agent wastes time figuring out where to write code
- TASK with `Verify: manually check the UI` — agents cannot manually check anything, provide a command

## Checklist

- [ ] Every design element maps to at least one task
- [ ] Tasks ordered by dependency (no circular deps)
- [ ] Each task has: Files, Depends On, Verify command, Effort, Commit message
- [ ] Verify commands are executable (not "manually check")
- [ ] Task IDs use TASK-NNN format
- [ ] Effort estimates assigned (S/M/L)
- [ ] Foundation tasks (models, config) come before feature tasks
- [ ] Output saved to `.claude/specs/[feature]/tasks.md`
