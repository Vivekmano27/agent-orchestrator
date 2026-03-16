---
description: "Debug agent execution — show detailed sub-step progress, errors, decisions, and output file status for any agent in the pipeline. Use when an agent stalls, fails, or produces unexpected output."
argument-hint: "[agent-name] or [feature-name] or blank for all"
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.

## Mission
Display detailed sub-step progress for agents to diagnose stalls, failures, and unexpected behavior.

## Steps

### 1. Locate Agent Status Files

```bash
Glob(".claude/specs/*/agent-status/*.md")
```

**If argument is an agent name** (e.g., `product-manager`):
- Find `.claude/specs/*/agent-status/$ARGUMENT.md`

**If argument is a feature name** (e.g., `water-delivery`):
- Find all `.claude/specs/$ARGUMENT/agent-status/*.md`

**If no argument:**
- Find ALL agent status files across all features

**If nothing found:**
```
+==================================================+
|            NO AGENT STATUS FILES                  |
+==================================================+
|                                                   |
|  No agent-status/ files found in .claude/specs/   |
|                                                   |
|  Agents write status files when they run.         |
|  Start a pipeline with /new or /start first.      |
+==================================================+
```

### 2. Read and Parse

For each status file found, read it and extract:
- Summary section (agent, phase, status, duration)
- Steps table (find IN_PROGRESS, FAILED, BLOCKED, RETRYING)
- Sub-Step Detail sections (if present)
- Errors table (if any entries)
- Decision Log (key choices made)
- Output Files table (completion status)

### 3. Display — Single Agent View

When showing one agent:
```
+==================================================+
|         AGENT DEBUG — product-manager             |
+==================================================+
|                                                   |
|  Phase: 1 — Planning                              |
|  Status: IN_PROGRESS                              |
|  Started: 14:30:01                                |
|  Duration: 4m 32s                                 |
|                                                   |
|  STEPS                                            |
|  [x] 1. read-context          (4s)               |
|  [x] 2. assess-requirements   (3s)               |
|  [>] 3. tier-1-discovery      (2m 15s, ongoing)  |
|  [ ] 4. tier-2-discovery                          |
|  [ ] 5. scope-discipline                          |
|  [ ] 6. write-prd                                 |
|  [ ] 7. gap-analysis                              |
|  [ ] 8. approval-gate                             |
|                                                   |
|  CURRENT STEP DETAIL                              |
|  Step 3 — tier-1-discovery                        |
|  [x] Q1 — Core purpose (answered)                |
|  [x] Q2 — Target users (B2B)                     |
|  [>] Q3 — Platforms (waiting for response)        |
|  [ ] Q4 — Scope approach                           |
|  [ ] Q5 — Core features                           |
|  [ ] Q6 — Out of scope                            |
|                                                   |
|  OUTPUT FILES                                     |
|  [ ] requirements.md — not started                |
|  [ ] feature_list.json — not started              |
|                                                   |
|  DECISIONS                                        |
|  - Full discovery needed (requirements vague)     |
|                                                   |
|  ERRORS                                           |
|  (none)                                           |
|                                                   |
+==================================================+
```

### 4. Display — Multi-Agent Overview

When showing all agents for a feature:
```
+==================================================+
|    AGENT DEBUG — water-delivery (all agents)      |
+==================================================+
|                                                   |
|  PHASE 1 — Planning                               |
|  [x] product-manager    DONE      (8m 12s)       |
|  [x] business-analyst   DONE      (3m 45s)       |
|  [x] ux-researcher      DONE      (5m 20s)       |
|                                                   |
|  PHASE 2 — Design                                 |
|  [x] system-architect   DONE      (6m 30s)       |
|  [x] api-architect      DONE      (4m 15s)       |
|  [x] database-architect DONE      (3m 50s)       |
|  [x] ui-designer        DONE      (12m 05s)      |
|  [!] design-reviewer    FAILED    (2m 10s)       |
|      Error: "api-spec references undefined        |
|              entity 'TeamMember'"                  |
|                                                   |
|  PHASE 3 — Implementation                         |
|  [>] backend-developer  IN_PROGRESS (15m, step 3)|
|  [>] senior-engineer    IN_PROGRESS (12m, step 5)|
|  [~] frontend-developer BLOCKED    (waiting on   |
|                          api-contracts.md)         |
|  [ ] flutter-developer  PENDING                   |
|                                                   |
+==================================================+
```

Status symbols:
- `[x]` = DONE
- `[>]` = IN_PROGRESS (show current step)
- `[!]` = FAILED (show error)
- `[~]` = BLOCKED (show blocker)
- `[-]` = SKIPPED
- `[ ]` = PENDING

### 5. Drill-Down Prompt

After showing overview, offer drill-down:
```
AskUserQuestion(
  question="Want to drill into a specific agent?",
  options=[
    "Show [agent-name] details",
    "Show all errors",
    "Show all decisions",
    "Show output file status",
    "Done"
  ]
)
```

### 6. Error Summary Mode

When user selects "Show all errors":
```
+==================================================+
|            ERROR SUMMARY                          |
+==================================================+
|                                                   |
|  design-reviewer (Phase 2, step 7):               |
|    Error: api-spec references undefined entity    |
|    Recovery: Re-dispatched api-architect           |
|    Status: RESOLVED                                |
|                                                   |
|  backend-developer (Phase 3, step 3):              |
|    Error: Prisma migration conflict on User table  |
|    Recovery: Retrying with schema fix              |
|    Status: RETRYING                                |
|                                                   |
+==================================================+
```

### 7. Timeline Mode (optional)

If user asks for timeline view:
```
14:30:01  product-manager     START
14:30:05  product-manager     read-context         COMPLETE (4s)
14:30:08  product-manager     assess-requirements  COMPLETE (3s)
14:30:08  product-manager     tier-1-discovery     START
14:32:23  product-manager     tier-1-discovery     COMPLETE (2m15s)
14:32:23  product-manager     tier-2-discovery     START
14:34:10  product-manager     tier-2-discovery     COMPLETE (1m47s)
14:34:10  product-manager     scope-discipline     START
...
14:38:13  product-manager     DONE (8m12s)
14:38:15  business-analyst    START
14:38:15  ux-researcher       START (parallel)
...
```

Build this by reading all agent-status files for the feature and sorting by timestamp.
