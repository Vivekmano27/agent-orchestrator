---
description: "Retry all failed tasks — re-reads the task spec, attempts a different approach, and updates status."
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Find all failed tasks and retry them with a fresh approach.

## Steps
1. Scan feature_list.json and .claude/specs/*/tasks.md for status = "failed"
2. For each failed task:
   a. Read the original task description
   b. Read the error/failure reason from progress tracker
   c. Analyze what went wrong
   d. Try a different implementation approach
   e. Run verification command
   f. Update status: "passing" or "failed" (with new error)
3. Report results

## Output
```
╔══════════════════════════════════════════╗
║          RETRY FAILED TASKS              ║
╠══════════════════════════════════════════╣
║                                          ║
║  Found 3 failed tasks                    ║
║                                          ║
║  ✅ TASK-009: AI endpoint timeout        ║
║     Fix: Increased timeout to 30s        ║
║     Status: NOW PASSING                  ║
║                                          ║
║  ✅ TASK-017: Flutter widget test        ║
║     Fix: Added missing mock provider     ║
║     Status: NOW PASSING                  ║
║                                          ║
║  ❌ TASK-022: K8s health check           ║
║     Attempt: Changed probe path          ║
║     Status: STILL FAILING                ║
║     → Needs manual investigation         ║
║                                          ║
║  Result: 2/3 recovered ✅                ║
╚══════════════════════════════════════════╝
```
