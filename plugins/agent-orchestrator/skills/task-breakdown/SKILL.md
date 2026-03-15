---
name: task-breakdown
description: Break features into ordered, dependency-aware implementation tasks with verification commands, file lists, effort estimates, and commit messages. Use when the user says "break this into tasks", "create implementation plan", "task breakdown", "decompose this feature", or needs to convert a design into actionable coding steps.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Task Breakdown Skill

Convert features and designs into ordered, atomic implementation tasks that an AI agent can execute autonomously.

## Task Template

```markdown
## TASK-[NNN]: [Descriptive title]
**Description:** [Detailed instructions — what files to create/modify, what logic to implement, patterns to follow]
**Agent:** backend-developer | senior-engineer | python-developer | frontend-developer
**Module:** [which part of the app]
**Effort:** S (< 30min) | M (30min-2hr) | L (2-4hr) | XL (4hr+)
**Dependencies:**
  - blockedBy: [TASK-xxx, TASK-xxx] or none
  - blocks: [TASK-xxx, TASK-xxx] or none
**Verification:**
  - Run: `[specific test command]`
  - Expect: [expected output or behavior]
**Files:**
  - Create: [full paths]
  - Modify: [full paths]
**Commit:** `type(scope): description`
**Status:** pending | in_progress | completed
```

## Task Writing Rules
1. Each task completable in one agent session (< 2 hours of work)
2. Every task MUST have a verification command — without it, agent can't confirm done
3. Dependencies MUST form a valid DAG (no circular deps)
4. One task = one atomic git commit
5. Include specific file paths — keeps agent focused
6. Order: infrastructure → models → services → API → UI → tests → integration

## Decomposition Strategy
1. **Foundation tasks first:** project setup, config, base models
2. **Data layer:** database models, migrations, seed data
3. **Service layer:** business logic, validation, error handling
4. **API layer:** routes, middleware, request/response handling
5. **UI layer:** components, pages, forms, navigation
6. **Integration:** connecting layers, end-to-end flows
7. **Quality:** additional tests, error handling, edge cases
8. **Polish:** performance, accessibility, documentation
