---
description: "Create a sprint plan from pending features — prioritize, estimate, break into tasks, and create a 1-2 week implementation plan."
argument-hint: "<sprint goal or feature list>"
disable-model-invocation: true
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Create a structured sprint plan from the current backlog.

## Steps
1. Read pending features from feature_list.json (status = "pending")
2. If argument provided, filter to specified features
3. For each feature:
   - Estimate effort using estimation-skill
   - Identify dependencies
   - Break into tasks
4. Create sprint plan sorted by priority + dependencies
5. Assign to appropriate agent teams
6. Write sprint plan to .claude/specs/sprint-[N]/plan.md

## Output
```markdown
# Sprint [N] Plan — [Date Range]

## Sprint Goal
[1-2 sentences describing what this sprint delivers]

## Capacity
- Available days: [N]
- Story points target: [N]

## Selected Features
| Priority | Feature | Points | Agent Team | Dependencies |
|----------|---------|--------|-----------|-------------|
| P0 | [feature] | [N] | [team] | [deps] |

## Task Schedule
### Day 1-2: Foundation
- TASK-001: [description] → backend-developer
- TASK-002: [description] → database-architect

### Day 3-5: Core Implementation
- TASK-003: [description] → feature-team (parallel)

### Day 6-7: Testing & Review
- TASK-010: [description] → review-team

## Risks
- [Potential issue and mitigation]
```
