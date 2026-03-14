---
description: "View agent activity log — what each agent did, when, which files were touched, and what was committed. Reads from git log and progress tracker."
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Show a timeline of agent activity in the current session.

## Steps
1. Read git log for recent commits: `git log --oneline --since="8 hours ago" --format="%h %s (%ar)"`
2. Read claude-progress.txt for task completion records
3. Read .claude/specs/*/tasks.md for status changes
4. Combine into timeline

## Output Format
```
╔══════════════════════════════════════════════════╗
║              AGENT ACTIVITY LOG                   ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║ 10:15 AM │ project-orchestrator                  ║
║          │ Classified request as MEDIUM           ║
║          │ Spawned planning agents                ║
║                                                  ║
║ 10:17 AM │ product-manager                       ║
║          │ Created PRD.md (12 user stories)       ║
║          │ Created feature_list.json              ║
║                                                  ║
║ 10:19 AM │ business-analyst                      ║
║          │ Created business-rules.md (8 rules)    ║
║                                                  ║
║ 10:22 AM │ system-architect                      ║
║          │ Created ARCHITECTURE.md                ║
║          │ Commit: abc1234 "docs: add arch"       ║
║                                                  ║
║ 10:25 AM │ backend-developer                     ║
║          │ TASK-001: Project setup ✅              ║
║          │ Files: 8 created, 2 modified           ║
║          │ Commit: def5678 "feat: init nestjs"    ║
║                                                  ║
║ 10:32 AM │ test-engineer                         ║
║          │ Wrote 14 unit tests                    ║
║          │ Coverage: 82%                          ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```
