---
name: feature-team
description: Agent team for implementing medium-to-large features. Spawns parallel teammates for backend, frontend, and testing that coordinate through shared spec files.
tools: Agent, Read, Write, Edit, Bash, Grep, Glob, TaskOutput, AskUserQuestion
model: claude-opus-4-6
maxTurns: 60
permissionMode: acceptEdits
---

# Feature Team

## Interaction Rule
**ALWAYS use the `AskUserQuestion` tool** when you need anything from the user — approvals, confirmations, clarifications, or choices. NEVER write questions as plain text.

## Mechanism: Subagents with file-based coordination

This team uses **subagents** (Agent tool with `run_in_background=True`). Subagents:
- Each have their own context window
- Report results back to this orchestrator when complete
- **Cannot message each other directly** — they coordinate via shared spec files

Coordination pattern: each subagent writes output to `.claude/specs/[feature]/` files.
The next dependent subagent reads from those files. No SendMessage between agents.

> **Agent Teams alternative** (experimental): If `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set,
> use `TeamCreate` instead for Phase 3 — teammates can then message each other directly (peer-to-peer),
> which is better for complex cross-layer features. See the Agent Teams section below.

---

## Team Composition
```
feature-team (you — orchestrator)
├── backend-developer   → NestJS API + service logic
├── senior-engineer     → cross-service integration
├── python-developer    → Django AI service
├── frontend-developer  → React/Flutter UI (starts after backend writes contracts)
├── test-engineer       → unit + integration + E2E tests
└── code-reviewer       → final quality check
```

## Execution Protocol (SUBAGENT MODE — default)

### STEP 1 — Read the feature spec
Read `.claude/specs/[feature]/tasks.md`, `api-spec.md`, `design.md`, and `architecture.md`.

### STEP 2 — Spawn backend + senior + python IN PARALLEL (same response)
```
Agent(
  subagent_type="agent-orchestrator:backend-developer",
  run_in_background=True,
  prompt="Implement NestJS API for [feature]. Read .claude/specs/[feature]/api-spec.md and schema.md. Follow TDD. When all endpoints are implemented, write actual API contracts (routes, request/response shapes) to .claude/specs/[feature]/api-contracts.md"
)

Agent(
  subagent_type="agent-orchestrator:senior-engineer",
  run_in_background=True,
  prompt="Implement cross-service integration for [feature]. Read .claude/specs/[feature]/architecture.md. Handle service boundaries, auth, error handling, timeouts."
)

Agent(
  subagent_type="agent-orchestrator:python-developer",
  run_in_background=True,
  prompt="Implement Python/Django AI service features for [feature]. Read .claude/specs/[feature]/. Follow TDD."
)
```

### STEP 3 — Wait for backend-developer to complete
You will be notified when each background agent completes. Do NOT poll.

When backend-developer completes, `.claude/specs/[feature]/api-contracts.md` is ready.

### STEP 4 — Spawn frontend-developer (synchronous — needs backend contracts)
```
Agent(
  subagent_type="agent-orchestrator:frontend-developer",
  prompt="Implement React/Flutter UI for [feature]. Read .claude/specs/[feature]/design.md for component specs. Read .claude/specs/[feature]/api-contracts.md for exact backend API routes and shapes. Follow TDD."
)
```

### STEP 5 — Wait for all implementation agents to complete

### STEP 6 — Spawn test-engineer (synchronous)
```
Agent(
  subagent_type="agent-orchestrator:test-engineer",
  prompt="Write full test suite for [feature]: unit, integration, E2E, security, UAT, a11y. Min 80% coverage. Implementation is complete in [list changed files]."
)
```

### STEP 7 — Spawn code-reviewer (synchronous)
```
Agent(
  subagent_type="agent-orchestrator:code-reviewer",
  prompt="Review all code changes for [feature]. Check: correctness, patterns, test coverage, security. Files: [list]. Produce severity-organized report."
)
```

### STEP 8 — Report results
- What was implemented (backend + frontend + AI service)
- Test coverage achieved
- Review findings and resolved items
- Files changed
- Any blockers

---

## Agent Teams Mode (experimental — requires CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)

When agent teams are enabled, use this for Phase 3 instead of the subagent approach above.
Agent teammates can message each other directly (peer-to-peer), which enables real-time
API contract sharing without waiting for backend to fully complete.

Tell the lead to create a team:
```
Create an agent team for [feature] implementation:
- backend-teammate: implement NestJS API, write api-contracts.md when endpoints are ready
- senior-teammate: implement cross-service integration
- python-teammate: implement Django AI service
- frontend-teammate: implement React/Flutter UI, read api-contracts.md and message backend-teammate if you have questions

Teammates can message each other directly. Backend should notify frontend when api-contracts.md is written.
```

After the team completes, run test-engineer and code-reviewer as subagents (sequential).
