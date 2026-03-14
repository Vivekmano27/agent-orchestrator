---
description: "Show all pending tasks, ordered by priority and dependencies. Highlights blocked tasks and what's blocking them."
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
List all pending implementation tasks across all feature specs.

## Steps
1. Scan all task files:
   - feature_list.json → features with status != "passing"
   - .claude/specs/*/tasks.md → tasks with status != "completed"
   - claude-progress.txt → any noted blockers

2. For each pending task, show:
   - Task ID and title
   - Priority (P0/P1/P2)
   - Which service(s) it affects
   - Dependencies (what must finish first)
   - Blocked status (is anything blocking this?)
   - Estimated effort

3. Sort by: blocked items last, then by priority (P0 first), then by dependency order

## Output Format
```
╔═══════════════════════════════════════════════════════╗
║                  PENDING TASKS (12)                    ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  🟢 READY TO START                                    ║
║  ┌────────────────────────────────────────────────┐  ║
║  │ TASK-012 [P0] Create user auth endpoints       │  ║
║  │   Service: core-service (NestJS)               │  ║
║  │   Effort: M (1-2 days) | Deps: none            │  ║
║  ├────────────────────────────────────────────────┤  ║
║  │ TASK-013 [P0] Build login UI component         │  ║
║  │   Service: web (React)                         │  ║
║  │   Effort: S (< 4 hours) | Deps: none           │  ║
║  └────────────────────────────────────────────────┘  ║
║                                                       ║
║  🟡 BLOCKED (waiting on dependencies)                 ║
║  ┌────────────────────────────────────────────────┐  ║
║  │ TASK-015 [P0] Connect login UI to auth API     │  ║
║  │   Service: web (React)                         │  ║
║  │   Effort: S | Blocked by: TASK-012 ⏳           │  ║
║  └────────────────────────────────────────────────┘  ║
║                                                       ║
║  ❌ FAILED (needs attention)                          ║
║  ┌────────────────────────────────────────────────┐  ║
║  │ TASK-009 [P0] AI content generation endpoint   │  ║
║  │   Service: ai-service (Python)                 │  ║
║  │   Error: pytest timeout on test_generate       │  ║
║  └────────────────────────────────────────────────┘  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

Next recommended action: Start TASK-012 (highest priority, no blockers)
```
