---
description: "Start a new project or feature. THE entry point for all new work. Runs the full 9-phase pipeline (30 agents, 5 teams) with smart dispatch based on tech stack."
argument-hint: "<what you want to build>"
disable-model-invocation: true
---

## Mission
Route to the project-orchestrator agent which runs the full 9-phase pipeline.

## Pipeline Behavior
- Task size (SMALL/MEDIUM/BIG) determines approval gates, not which agents run
- Smart dispatch skips agents whose tech stack is absent from project-config.md
- Verification phases (security, review) always run regardless of task size
- Each phase loads just-in-time instructions from skills/phase-runner/phases/ for focused execution
- Phase 0.75 (Brainstorming) runs before planning for MEDIUM/BIG tasks

## Steps
1. Pass the user's description to project-orchestrator
2. Orchestrator creates spec directory (Phase 0, no questions), then runs Phase 0.5 (project-setup agent for tech stack decisions), then dispatches product-manager for requirements discovery (Phase 1).
3. Orchestrator classifies size and uses **AskUserQuestion tool** for approval gates:
   - SMALL (1-3 files): auto-approve
   - MEDIUM (4-10 files): **AskUserQuestion**: "Plan looks good. Proceed?" → [Proceed / Request changes]
   - BIG (10+ files): **AskUserQuestion** at each of 4 gates → [Approve / Request changes / Cancel]
4. All 9 phases execute with smart dispatch:

```
Phase 0.5:  project-setup → tech stack interview, project-config.md
Phase 0.75: brainstorming (SMALL=skip, MEDIUM=light, BIG=full)
Phase 1:    product-manager + business-analyst + ux-researcher
Phase 2:   system-architect + api-architect + database-architect + ui-designer + agent-native-designer [C]
Phase 2.1: task-decomposer → ordered task list with agent assignments
Phase 2.5: git setup
Phase 3:   backend-developer + frontend-developer [C] + python-developer [C] + flutter-developer [C]
           + kmp-developer [C] + senior-engineer [C] + agent-native-developer [C]
Phase 4:   test-engineer + qa-automation [C]
Phase 5:   security-auditor
Phase 6:   code-reviewer + security-auditor (spot-check) + performance-reviewer + static-analyzer
           + agent-native-reviewer [C] + spec-tracer [C]
Phase 7:   devops-engineer + deployment-engineer [C — skip if no cloud]
Phase 8:   technical-writer
Coordination: project-orchestrator + task-executor
```

[C] = conditional on project-config.md tech stack. Absent tech = agent skipped.
