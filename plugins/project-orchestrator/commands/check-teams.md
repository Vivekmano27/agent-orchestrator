---
description: "Check agent team status — which teams are running, their progress, active agents, and any coordination issues. Reads from progress.md for real-time pipeline state."
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Report on agent team activity and health by reading pipeline progress files.

## Steps

1. **Find active pipelines:**
   ```bash
   Glob(".claude/specs/*/progress.md")
   ```
   If no progress.md files found: report "No active pipelines. Run /new or /start to begin."

2. **For each progress.md, read and parse:**
   - `Current State > Phase` — which phase is active
   - `Active Agents` table — which agents are dispatched and their status
   - `Phase History` table — completed phases with timestamps
   - `Feedback Loops` table — any active feedback loops
   - `Current State > Status` — IN_PROGRESS / WAITING_FOR_APPROVAL / DONE

3. **Map phases to teams:**
   | Phase | Team / Agent | Members |
   |---|---|---|
   | 0 | project-orchestrator (direct) | — |
   | 0.5 | project-setup | — |
   | 1 | planning-team | product-manager, business-analyst, ux-researcher, requirements-reviewer |
   | 2 | design-team | system-architect, api-architect, database-architect, ui-designer, agent-native-designer, design-reviewer |
   | 2.1 | task-decomposer | — |
   | 2.5 | project-orchestrator (direct) | — |
   | 3 | feature-team | backend-developer, senior-engineer, python-developer, frontend-developer, flutter-developer, kmp-developer, agent-native-developer |
   | 4 | quality-team | test-engineer, qa-automation |
   | 5 | security-auditor | — |
   | 6 | review-team | code-reviewer, security-auditor, performance-reviewer, static-analyzer, agent-native-reviewer |
   | 7 | DevOps agents | devops-engineer, deployment-engineer |
   | 8 | technical-writer | — |

4. **Cross-reference with spec files:**
   - Read tasks.md for task-level agent assignments and completion
   - Check which spec output files exist (indicates phase completion)

## Output Format
```
+=============================================+
|           AGENT TEAM STATUS                  |
+=============================================+
|                                              |
|  ACTIVE PIPELINE: water-delivery             |
|  Phase: 3 -- Implementation                  |
|  Task Size: BIG                              |
|                                              |
|  ACTIVE TEAM: feature-team                   |
|  +--------------------------------------+    |
|  | Backend Wave (parallel)               |    |
|  |  [x] backend-developer   COMPLETE     |    |
|  |      8 files, 3 commits, 12 min      |    |
|  |  [x] senior-engineer     COMPLETE     |    |
|  |      4 files, 2 commits, 8 min       |    |
|  |  -- python-developer     SKIPPED      |    |
|  |      (no Python service)             |    |
|  |                                       |    |
|  | Frontend Wave (parallel)              |    |
|  |  .. frontend-developer  IN_PROGRESS   |    |
|  |      dispatched 5 min ago            |    |
|  |  .. flutter-developer   IN_PROGRESS   |    |
|  |      dispatched 5 min ago            |    |
|  |  -- kmp-developer       SKIPPED       |    |
|  |      (no KMP)                        |    |
|  +--------------------------------------+    |
|                                              |
|  COMPLETED TEAMS                             |
|  +--------------------------------------+    |
|  | Phase 1: Planning (8.5 min)           |    |
|  |  [x] product-manager   4.2 min       |    |
|  |  [x] business-analyst  3.1 min       |    |
|  |  [x] ux-researcher     3.8 min       |    |
|  +--------------------------------------+    |
|  | Phase 2: design-team (12.1 min)       |    |
|  |  [x] system-architect  3.5 min       |    |
|  |  [x] api-architect     4.2 min       |    |
|  |  [x] database-architect 3.8 min      |    |
|  |  [x] ui-designer       5.1 min       |    |
|  |  -- agent-native-designer SKIPPED    |    |
|  |  [x] design-reviewer   2.3 min       |    |
|  +--------------------------------------+    |
|                                              |
|  PENDING TEAMS                               |
|  | Phase 4: quality-team                 |    |
|  | Phase 5: security-auditor             |    |
|  | Phase 6: review-team                  |    |
|  | Phase 7: devops-engineer + deploy     |    |
|  | Phase 8: technical-writer             |    |
|                                              |
|  FEEDBACK LOOPS                              |
|  (none active)                               |
|                                              |
|  APPROVAL GATES                              |
|  [x] Gate 1 (requirements)  APPROVED         |
|  [x] Gate 2 (design)        APPROVED         |
|  [x] Gate 2.1 (tasks)       APPROVED         |
|  [ ] Gate 3 (implementation) PENDING          |
|  [ ] Gate 3.5 (test plan)    PENDING          |
|  [ ] Gate 4 (test+security)  PENDING          |
|                                              |
+=============================================+
```

## No Active Pipeline
```
+=============================================+
|           AGENT TEAM STATUS                  |
+=============================================+
|                                              |
|  No active pipelines.                        |
|                                              |
|  Available teams:                            |
|  | design-team   (5+1 members) Ready         |
|  | feature-team  (up to 7 members) Ready     |
|  | quality-team  (2 members) Ready            |
|  | review-team   (5 reviewers) Ready          |
|  | planning-team (4 members) Ready            |
|                                              |
|  Run /new or /start to begin a pipeline.     |
|                                              |
+=============================================+
```
