---
description: "Check agent team status — which teams are running, their progress, teammate status, and any coordination issues."
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Report on agent team activity and health.

## Steps
1. Check if any agent teams are currently active
2. For active teams, report:
   - Team name and purpose
   - Each teammate's current task and progress
   - Shared task list completion status
   - Any messages between teammates
   - Time elapsed since team spawn

3. For recently completed teams, report:
   - Final output and results
   - Any unresolved issues

## Output Format
```
╔══════════════════════════════════════════════╗
║           AGENT TEAM STATUS                  ║
╠══════════════════════════════════════════════╣
║                                              ║
║  🟢 ACTIVE TEAMS (1)                         ║
║  ┌──────────────────────────────────────┐   ║
║  │ feature-team: "User Auth Feature"    │   ║
║  │ Started: 12 min ago                  │   ║
║  │                                      │   ║
║  │ Teammates:                           │   ║
║  │  ✅ backend-dev: TASK-012 complete   │   ║
║  │  🔄 frontend-dev: TASK-013 building  │   ║
║  │  ⏳ test-engineer: waiting for impl  │   ║
║  │  ⏳ code-reviewer: waiting for impl  │   ║
║  │                                      │   ║
║  │ Tasks: 2/6 complete (33%)            │   ║
║  │ Messages: 3 exchanged                │   ║
║  └──────────────────────────────────────┘   ║
║                                              ║
║  ✅ RECENTLY COMPLETED (1)                   ║
║  ┌──────────────────────────────────────┐   ║
║  │ review-team: "Sprint 4 Audit"        │   ║
║  │ Completed: 2 hours ago               │   ║
║  │ Results: 2 critical, 5 warnings      │   ║
║  │ Status: Critical findings resolved   │   ║
║  └──────────────────────────────────────┘   ║
║                                              ║
║  💤 AVAILABLE TEAMS (1)                      ║
║  │ planning-team: Ready to spawn             ║
║                                              ║
╚══════════════════════════════════════════════╝
```
