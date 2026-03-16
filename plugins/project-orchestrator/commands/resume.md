---
description: "Resume pipeline from where it last stopped — detects incomplete specs, stalled agents, and in-progress tasks, then re-dispatches the orchestrator to continue."
argument-hint: "[feature-name]"
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Detect where the pipeline stopped and re-dispatch the orchestrator to continue from that point.

## Steps

### 1. Locate the Feature

**If argument provided:** look for `.claude/specs/$ARGUMENTS/progress.md`

**If no argument:** find the most recently modified progress file:
```
Glob(".claude/specs/*/progress.md")
```
Pick the most recently modified one.

**If nothing found:** report to the user and stop:
```
╔══════════════════════════════════════════╗
║          NO ACTIVE PIPELINE              ║
╠══════════════════════════════════════════╣
║                                          ║
║  No progress.md found in .claude/specs/  ║
║                                          ║
║  Start a new pipeline with:              ║
║    /new "description"                    ║
║    /build-feature "description"          ║
╚══════════════════════════════════════════╝
```

### 2. Read State (parallel reads)

Read all three in parallel:
- `.claude/specs/[feature]/progress.md` — current phase, status, active agents
- All spec files in `.claude/specs/[feature]/` — scan for `## Status: INCOMPLETE` markers
- `.claude/specs/[feature]/tasks.md` — scan for `in_progress` or `failed` status

### 3. Classify What Needs Resuming

| Scenario | Detection | Action |
|----------|-----------|--------|
| Agent stopped mid-output | `## Status: INCOMPLETE` in any spec file | Resume that agent in the current phase |
| Phase incomplete | progress.md shows `IN_PROGRESS` but expected output files missing | Re-run the phase |
| Waiting for approval | progress.md shows `WAITING_FOR_APPROVAL` | Present the gate to the user |
| Tasks stalled | tasks.md has `in_progress` tasks but no agent running | Resume implementation phase |
| Pipeline complete | progress.md shows `DONE` for all phases | Report "Nothing to resume" and stop |

**If pipeline is complete:**
```
╔══════════════════════════════════════════╗
║          NOTHING TO RESUME               ║
╠══════════════════════════════════════════╣
║                                          ║
║  Feature: [name]                         ║
║  Status: DONE                            ║
║  Completed: [timestamp]                  ║
║                                          ║
║  All phases finished successfully.       ║
║  Start new work with /new or             ║
║  /build-feature.                         ║
╚══════════════════════════════════════════╝
```

### 4. Display Status Summary

Show what was found and what will be resumed:
```
╔══════════════════════════════════════════╗
║          RESUME PIPELINE                 ║
╠══════════════════════════════════════════╣
║                                          ║
║  Feature: [name]                         ║
║  Phase: [N] — [name] (IN_PROGRESS)       ║
║                                          ║
║  Found:                                  ║
║  - [file]: INCOMPLETE (stopped at [N])   ║
║  - tasks.md: [X] in_progress, [Y] failed ║
║                                          ║
║  Action: Re-dispatching [agent] to       ║
║  complete [deliverable], then resuming   ║
║  Phase [N].                              ║
╚══════════════════════════════════════════╝
```

### 5. Dispatch Orchestrator with Resume Context

```
Agent(
  subagent_type="project-orchestrator:project-orchestrator",
  prompt="RESUME pipeline for feature: [feature-name].
         Spec directory: .claude/specs/[feature]/

         Current state from progress.md:
         - Phase: [N]
         - Status: [status]
         - Last active agents: [list]

         Incomplete files detected:
         - [file]: INCOMPLETE at section [N]

         Task status:
         - [X] in_progress, [Y] failed, [Z] pending

         Resume from Phase [N]. Do NOT re-run completed phases.
         Do NOT re-run discovery or re-ask questions already answered.
         Read existing spec files as context — continue, don't restart."
)
```
