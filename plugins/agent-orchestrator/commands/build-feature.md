---
description: "Build a feature end-to-end using the full 9-phase pipeline (30 agents, 5 teams). Smart dispatch skips agents not in the project's tech stack."
argument-hint: "<feature description>"
disable-model-invocation: true
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Route to project-orchestrator which runs the full 9-phase pipeline for this feature.

## Pipeline Behavior
- Task size (SMALL/MEDIUM/BIG) determines approval gates
- Smart dispatch skips agents whose tech stack is absent from project-config.md (e.g., flutter-developer skipped if no Flutter)
- Verification phases (security, review) always run regardless of task size

## Agents by Phase:
Planning: product-manager, business-analyst, ux-researcher
Design: system-architect, api-architect, database-architect, ui-designer, agent-native-designer [C]
Task Decomposition: task-decomposer → ordered task list with agent assignments
Build: backend-developer, frontend-developer [C], python-developer [C], flutter-developer [C], kmp-developer [C], senior-engineer [C], agent-native-developer [C]
Test: test-engineer, qa-automation [C]
Security: security-auditor
Review: code-reviewer, security-auditor (spot-check), performance-reviewer, static-analyzer, agent-native-reviewer [C], spec-tracer [C]
DevOps: devops-engineer, deployment-engineer [C — skip if no cloud]
Docs: technical-writer

[C] = conditional on project-config.md tech stack
