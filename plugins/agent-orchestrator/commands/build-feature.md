---
description: "Build a feature end-to-end using the FULL 21-agent pipeline. Classifies size for approval gates only — all agents always run."
argument-hint: "<feature description>"
disable-model-invocation: true
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Route to project-orchestrator which runs ALL agents for this feature.

## CRITICAL: Full Pipeline Always
Size classification determines approval gates only:
- SMALL: auto-approve, all agents still run
- MEDIUM: 1 gate, all agents still run
- BIG: 4 gates, all agents still run

## Agents triggered (ALWAYS ALL):
Planning: product-manager, business-analyst, ux-researcher
Design: system-architect, api-architect, database-architect, ui-designer
Task Decomposition: task-decomposer → ordered task list with agent assignments
Build: agent-native-developer, senior-engineer, backend-developer, python-developer, frontend-developer, flutter-developer, kmp-developer
Test: test-engineer, qa-automation
Security: security-auditor
Review: code-reviewer, security-auditor (spot-check), performance-reviewer, static-analyzer, agent-native-reviewer, spec-tracer
DevOps: devops-engineer, deployment-engineer
Docs: technical-writer
