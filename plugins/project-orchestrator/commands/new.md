---
description: "Start a new project or feature. THE entry point for all new work. Runs the full pipeline with smart dispatch based on tech stack."
argument-hint: "<what you want to build>"
disable-model-invocation: true
---

## Mission

Route to the project-orchestrator agent which runs the full pipeline.

## Pipeline Behavior

- Task size (SMALL/MEDIUM/BIG) determines approval gates, not which agents run
- Smart dispatch skips agents whose tech stack is absent from project-config.md
- Requirements come FIRST (Phase 1), then tech stack is chosen (Phase 1.5) based on what you're building
- If project-config.md already exists, Phase 1.5 asks to proceed with existing config or modify
- Verification phases (security, review) always run regardless of task size
- Each phase loads just-in-time instructions from skills/phase-runner/phases/
- Phase 0.5 (Brainstorming) runs before planning for MEDIUM/BIG tasks

## Steps

1. Pass the user's description to project-orchestrator
2. Orchestrator creates spec directory (Phase 0), then brainstorms scope (Phase 0.5, MEDIUM/BIG), then dispatches planning-team for requirements (Phase 1), then runs tech stack interview (Phase 1.5)
3. Orchestrator classifies size and uses **AskUserQuestion** for approval gates:
    - SMALL (1-3 files): auto-approve
    - MEDIUM (4-10 files): **AskUserQuestion** after design+tasks
    - BIG (10+ files): **AskUserQuestion** at each of 4 gates
4. Full pipeline executes with smart dispatch:

```
Phase 0:    spec setup
Phase 0.5:  brainstorming (SMALL=skip, MEDIUM=light, BIG=full)
Phase 1:    planning-team (product-manager → business-analyst → ux-researcher → requirements-reviewer)
Phase 1.5:  project-setup → tech stack interview → project-config.md
Phase 2:    design-team (system-architect + api-architect + database-architect + ui-designer [C])
Phase 2.1:  task-decomposer → ordered task list
Phase 2.5:  git setup
Phase 3:    feature-team (backend + frontend [C] + python [C] + flutter [C] + kmp [C])
Phase 4:    quality-team (test-engineer + qa-automation [C])
Phase 5:    security-auditor
Phase 6:    review-team (code-reviewer + performance-reviewer + static-analyzer)
Phase 7:    devops-engineer + deployment-engineer [C — skip if no cloud]
Phase 8:    technical-writer
Phase 9:    post-deploy verification
```

[C] = conditional on project-config.md tech stack. Absent tech = agent skipped.
