---
description: "Show all pending tasks, ordered by priority and dependencies. Highlights blocked tasks, what's blocking them, and current pipeline phase context from progress.md."
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
List all pending implementation tasks across all feature specs, with pipeline context.

## Steps
1. **Read pipeline context** from:
   - .claude/specs/*/progress.md → current phase, active agents, which wave is running
   - This tells you which tasks are actively being worked on vs truly pending

2. **Scan all task files**:
   - .claude/specs/*/tasks.md → tasks with status markers ([ ] pending, [x] complete)
   - feature_list.json → features with status != "passing" (if exists)

3. For each pending task, show:
   - Task ID and title
   - Priority (P0/P1/P2)
   - Assigned agent
   - Which service(s) it affects
   - Dependencies (what must finish first)
   - Blocked status (is anything blocking this?)
   - Whether the assigned agent is currently active (from progress.md)
   - Estimated effort

4. Sort by: blocked items last, then by priority (P0 first), then by dependency order

## Output Format
```
+=========================================================+
|                  PENDING TASKS (12)                       |
+=========================================================+
|                                                          |
|  PIPELINE CONTEXT                                        |
|  Phase: 3 -- Implementation (Backend Wave)               |
|  Active agents: backend-developer, senior-engineer       |
|                                                          |
|  ACTIVELY BEING WORKED ON                                |
|  +----------------------------------------------------+ |
|  | TASK-005 [P0] Create order API endpoints            | |
|  |   Agent: backend-developer (ACTIVE)                 | |
|  |   Service: core-service (NestJS)                    | |
|  |   Effort: M (1-2 days) | Deps: TASK-001 [x]        | |
|  +----------------------------------------------------+ |
|  | TASK-006 [P0] Set up API gateway auth middleware     | |
|  |   Agent: senior-engineer (ACTIVE)                   | |
|  |   Service: api-gateway (NestJS)                     | |
|  |   Effort: M | Deps: TASK-003 [x]                   | |
|  +----------------------------------------------------+ |
|                                                          |
|  READY TO START (waiting for agent dispatch)             |
|  +----------------------------------------------------+ |
|  | TASK-012 [P0] Build customer order screen           | |
|  |   Agent: flutter-developer (PENDING -- frontend wave)| |
|  |   Service: mobile-flutter                            | |
|  |   Effort: M | Deps: TASK-005 (in progress)          | |
|  +----------------------------------------------------+ |
|                                                          |
|  BLOCKED (waiting on dependencies)                       |
|  +----------------------------------------------------+ |
|  | TASK-015 [P0] Connect login UI to auth API          | |
|  |   Agent: frontend-developer                         | |
|  |   Service: web (React)                              | |
|  |   Effort: S | Blocked by: TASK-006 (in progress)    | |
|  +----------------------------------------------------+ |
|                                                          |
|  FAILED (needs attention)                                |
|  +----------------------------------------------------+ |
|  | TASK-009 [P0] AI content generation endpoint        | |
|  |   Agent: python-developer                           | |
|  |   Service: ai-service (Python)                      | |
|  |   Error: pytest timeout on test_generate            | |
|  +----------------------------------------------------+ |
|                                                          |
|  Next: Frontend wave starts after backend wave completes |
+=========================================================+
```
