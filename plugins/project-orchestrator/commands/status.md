---
description: "Show project status dashboard — pipeline phase, active agents, pending tasks, test results, deployment status, and overall health. The main monitoring command."
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Display a comprehensive project status dashboard with real-time pipeline progress.

## Gather Status

1. **Read pipeline progress** from:
   - .claude/specs/*/progress.md (real-time pipeline phase, active agents, feedback loops)
   - If no progress.md exists: no pipeline is running

2. **Read pending tasks** from:
   - .claude/specs/*/tasks.md (task statuses)
   - feature_list.json (feature statuses, if exists)

3. **Check test status**:
   - .claude/specs/*/test-report.md (latest test results)
   - .claude/specs/*/test-plan.md (planned vs executed)
   - Check coverage reports

4. **Check security status**:
   - .claude/specs/*/security-audit.md (latest audit)

5. **Check review status**:
   - .claude/specs/*/review-report.md (latest review)
   - .claude/specs/*/design-review.md (design review, if exists)

6. **Check deployment status**:
   - .claude/specs/*/deployment-plan.md (deployment plan)
   - .claude/specs/*/deploy-monitoring.md (monitoring config)

7. **Check git status**:
   - Current branch
   - Uncommitted changes
   - Commits ahead/behind main

## Output Format
```
+==================================================+
|              PROJECT STATUS DASHBOARD             |
+==================================================+
|                                                   |
|  PIPELINE                                         |
|  |-- Feature: water-delivery                      |
|  |-- Phase: 3 -- Implementation (IN_PROGRESS)     |
|  |-- Task Size: BIG                               |
|  |-- Started: 2026-03-15 14:30                    |
|  |-- Duration: 45 min                             |
|  '-- Next Gate: Gate 3 (after implementation)     |
|                                                   |
|  ACTIVE AGENTS                                    |
|  |-- backend-developer    [Phase 3] IN_PROGRESS   |
|  |-- senior-engineer      [Phase 3] IN_PROGRESS   |
|  |-- flutter-developer    [Phase 3] WAITING       |
|  '-- frontend-developer   [Phase 3] WAITING       |
|                                                   |
|  COMPLETED PHASES                                 |
|  [x] Phase 0   Spec Setup         (0.1 min)      |
|  [x] Phase 0.5 Project Setup      (3.2 min)      |
|  [x] Phase 1   Planning           (8.5 min)      |
|  [x] Phase 2   Design             (12.1 min)     |
|  [x] Phase 2.1 Task Decomposition (2.3 min)      |
|  [x] Phase 2.5 Git Setup          (0.2 min)      |
|  [ ] Phase 3   Implementation     (in progress)  |
|  [ ] Phase 4   Testing                            |
|  [ ] Phase 5   Security                           |
|  [ ] Phase 6   Review                             |
|  [ ] Phase 7   DevOps                             |
|  [ ] Phase 8   Documentation                      |
|                                                   |
|  FEEDBACK LOOPS                                   |
|  (none active)                                    |
|                                                   |
|  TASKS                                            |
|  |-- Total: 24                                    |
|  |-- Completed: 8 (33%)                           |
|  |-- In Progress: 3                               |
|  |-- Pending: 12                                  |
|  '-- Blocked: 1                                   |
|                                                   |
|  TESTS                                            |
|  |-- Status: not yet run (Phase 4 pending)        |
|                                                   |
|  SECURITY                                         |
|  |-- Status: not yet audited (Phase 5 pending)    |
|                                                   |
|  GIT                                              |
|  |-- Branch: feature/water-delivery               |
|  |-- Uncommitted: 0 files                         |
|  |-- Ahead of main: 12 commits                    |
|  '-- Last commit: "feat(api): add order endpoints"|
|                                                   |
+==================================================+
```

## Agent Sub-Step Status (NEW)

After showing the main dashboard, also check for agent-level detail:

```bash
# Find agent status files for the active feature
Glob(".claude/specs/[feature]/agent-status/*.md")
```

If agent-status files exist, append an AGENT DETAIL section to the dashboard:
```
|  AGENT DETAIL (current phase)                     |
|  backend-developer:                                |
|    [x] read-specs  [x] detect-ambiguities          |
|    [>] implement-tdd (TASK-003, 3 of 8 tasks)     |
|    [ ] system-check  [ ] elegance  [ ] commit      |
|  senior-engineer:                                   |
|    [x] read-specs  [x] cross-service-plan          |
|    [>] implement (NestJS ↔ Python integration)     |
|  frontend-developer:                                |
|    [~] BLOCKED — waiting on api-contracts.md        |
```

Parse each agent-status file:
- Read the Steps table for status of each step
- Show only agents in the CURRENT phase (skip completed phases)
- Use compact format: `[x]` done, `[>]` active, `[ ]` pending, `[~]` blocked, `[!]` failed

**Tip:** For deeper agent debugging, use `/agent-debug [agent-name]`.

---

## How to Gather Each Section

### Pipeline Progress (PRIMARY SOURCE)
```bash
# Find all active feature progress files
Glob(".claude/specs/*/progress.md")
# Read the progress.md file for current phase, status, active agents
Read(".claude/specs/[feature]/progress.md")
```

Parse from progress.md:
- `Current State > Phase` → current phase number and name
- `Current State > Status` → IN_PROGRESS / WAITING_FOR_APPROVAL / DONE
- `Current State > Gate` → which approval gate is pending (if any)
- `Active Agents` table → which agents are dispatched and their status
- `Phase History` table → completed phases with durations
- `Feedback Loops` table → any active feedback loops

### Tasks
```bash
# Read tasks.md for task-level progress
Read(".claude/specs/[feature]/tasks.md")
# Count tasks by status (look for checkbox markers: [ ] pending, [x] complete)
```

### Tests (from spec files)
```bash
Read(".claude/specs/[feature]/test-report.md")  # if exists
Read(".claude/specs/[feature]/test-plan.md")     # if exists
```

### Security (from spec files)
```bash
Read(".claude/specs/[feature]/security-audit.md")  # if exists
```

### Git
```bash
echo "Branch: $(git branch --show-current)"
echo "Uncommitted: $(git status --porcelain | wc -l) files"
echo "Ahead of main: $(git rev-list main..HEAD --count 2>/dev/null || echo 'N/A')"
echo "Last commit: $(git log -1 --format='%s' 2>/dev/null || echo 'none')"
```

### No Pipeline Running
If no progress.md files exist, show a simplified dashboard:
```
+==================================================+
|              PROJECT STATUS DASHBOARD             |
+==================================================+
|                                                   |
|  PIPELINE: No active pipeline                     |
|  Run /new or /start to begin a new feature.       |
|                                                   |
|  [show git status and any existing spec files]    |
+==================================================+
```
