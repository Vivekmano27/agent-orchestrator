---
description: "Start a new project or feature. THE entry point for all new work. ALWAYS runs the full 21-agent pipeline (planning → design → build → test → security → review → devops → docs) regardless of project size."
argument-hint: "<what you want to build>"
disable-model-invocation: true
---

## Mission
Route to the project-orchestrator agent which runs the FULL 9-phase pipeline with ALL agents.

## CRITICAL: Full Pipeline Always
Every request gets ALL agents — even "simple" or "local" projects.
Task size (SMALL/MEDIUM/BIG) only determines approval gates, NOT which agents run.

## Steps
1. Pass the user's description to project-orchestrator
2. Orchestrator creates spec directory (Phase 0, no questions), then dispatches product-manager for requirements discovery. Tech stack is decided after requirements (Phase 1.5).
3. Orchestrator classifies size and uses **AskUserQuestion tool** for approval gates:
   - SMALL (1-3 files): all agents run, no approval needed
   - MEDIUM (4-10 files): all agents run — **AskUserQuestion**: "Plan looks good. Proceed?" → [Proceed / Request changes]
   - BIG (10+ files): all agents run — **AskUserQuestion** at each of 4 gates → [Approve / Request changes / Cancel]
4. ALL 9 phases execute with ALL agents:

```
Phase 1:   product-manager + business-analyst + ux-researcher
Phase 1.5: tech stack decision
Phase 2:   system-architect + api-architect + database-architect + ui-designer
Phase 2.1: task-decomposer → ordered task list with agent assignments
Phase 2.5: git setup
Phase 3:   agent-native-developer + senior-engineer + backend-developer + python-developer
           + frontend-developer + flutter-developer + kmp-developer (conditional on project-config.md)
Phase 4:   test-engineer + qa-automation
Phase 5:   security-auditor
Phase 6:   code-reviewer + security-auditor (spot-check) + performance-reviewer + static-analyzer + agent-native-reviewer + spec-tracer
Phase 7:   devops-engineer + deployment-engineer
Phase 8:   technical-writer
Coordination: project-orchestrator + task-executor
```

No agents are ever skipped. A "local todo app" gets the same agent coverage as a "production SaaS".
