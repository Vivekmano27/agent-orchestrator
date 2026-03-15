# Brainstorm: Agent-Native Design Team for Phase 2

**Date:** 2026-03-15
**Status:** Draft
**Scope:** Phase 2 pipeline restructuring + new agent-designer agent

---

## What We're Building

### Problem
Phase 2 currently designs 4 things in parallel: architecture, API contracts, database schema, and UI components. But it produces **zero agent-native design** — no tool definitions, no parity mapping, no prompt-defined features, no orchestrator extensions. If we're building apps where agents are first-class citizens, the design phase must include agent design.

Additionally, Phase 2 uses orchestrator-dispatched parallelism (orchestrator spawns agents, waits, continues). We want to move to **Agent Teams** (peer-to-peer coordination) for better cross-agent communication and parallel efficiency.

### Solution
1. Create a new **agent-designer** agent that designs agent-native capabilities for the target app
2. Restructure Phase 2 from orchestrator-dispatched → **design-team** (Agent Team with peer coordination)
3. Add a cross-review step where agents validate each other's output (especially parity)

---

## Why This Approach

### Approach Selected: Full Design Team (Approach A)

**Over Approach B (Lightweight Addition):**
- Approach B just adds a 4th parallel agent — no peer coordination, no cross-review
- Agent-designer can't verify parity without reading other agents' output in real-time
- Design-team enables agents to catch gaps before Phase 2.1

**Over Approach C (Two-Phase):**
- Approach C is slower (3 sequential steps vs 2)
- Agent-designer running twice adds redundancy
- The architecture doesn't need to be "agent-aware" from the start — parity is verified after

### Why Agent-Native Design Matters
From the `agent-native-architecture` skill's core principles:

1. **Parity** — Whatever the user can do through UI, the agent must be able to achieve through tools. Without designing this in Phase 2, it gets bolted on later (or never).
2. **Granularity** — Tools should be atomic primitives, features should be prompt-defined outcomes. This needs upfront design, not ad-hoc implementation.
3. **Composability** — New features via new prompts alone. The tool surface must be designed for this.
4. **Emergent Capability** — Open-ended agent behavior requires thoughtful tool design, not restrictive workflow-shaped tools.

---

## Key Decisions

### Decision 1: New design-team Agent Team replaces orchestrator-dispatched Phase 2

**Current flow:**
```
Orchestrator -> system-architect (sequential)
Orchestrator -> api-architect + db-architect + ui-designer (parallel, run_in_background)
Orchestrator -> waits, generates SUMMARY.md
```

**New flow:**
```
Orchestrator -> design-team (single dispatch)
  design-team internals:
    Step 1: system-architect (leader, runs first)
    Step 2: api-architect + db-architect + ui-designer + agent-designer (parallel, peer-to-peer)
    Step 3: Cross-review (agent-designer verifies parity across all specs)
```

### Decision 2: agent-designer produces `agent-spec.md`

The new agent-designer agent produces `.claude/specs/[feature]/agent-spec.md` containing:

**For the target app (agent-native features):**
- **Parity Map** — every UI action mapped to an agent tool/capability
- **Tool Definitions** — atomic primitive tools (CRUD per entity, no workflow-shaped tools)
- **Agent Definitions** — prompt-defined features (agent name, system prompt, tools it uses, outcome it achieves)
- **Capability Discovery** — how users/agents discover what the app can do

**For the orchestrator (project-specific extensions):**
- **Project-specific skills** — skills the orchestrator needs for this project's domain
- **Project-specific commands** — slash commands for common project operations
- **Custom agent suggestions** — any specialized agents this project type needs

### Decision 3: Cross-review step validates consistency

After all 4 parallel agents complete, the design-team runs a cross-review:
- agent-designer reads `api-spec.md` → verifies every endpoint has a corresponding tool
- agent-designer reads `schema.md` → verifies every entity has full CRUD tools
- agent-designer reads `design.md` → verifies every UI action has an agent capability
- Other agents can flag issues in each other's specs

### Decision 4: Agent-designer uses `agent-native-architecture` + `create-agent-skills` as loaded skills

The agent-designer agent should load:
- `agent-native-architecture` — for parity, granularity, composability principles
- `create-agent-skills` — for skill/command generation patterns (frontmatter, structure, best practices)
- `agent-builder` (existing) — for agent `.md` file generation

### Decision 5: design-team coordination model

- **Leader:** system-architect (runs first, produces architecture.md that others depend on)
- **Parallel workers:** api-architect, database-architect, ui-designer, agent-designer
- **Cross-reviewer:** agent-designer (reads all specs, verifies parity)
- **Output coordinator:** design-team definition handles file collection and SUMMARY.md generation

---

## What Needs to Be Created

### New Files
1. **`agents/agent-designer.md`** — New agent definition (Opus model, reads all Phase 1-2 specs, produces agent-spec.md)
2. **`agents/design-team.md`** — New Agent Team definition (replaces orchestrator-dispatched Phase 2)
3. **`skills/agent-native-design/SKILL.md`** — Skill loaded by agent-designer with parity mapping, tool design, and prompt-feature patterns

### Modified Files
4. **`agents/project-orchestrator.md`** — Phase 2 section changes from dispatching 4 agents → dispatching design-team
5. **`agents/task-decomposer.md`** — Must now also read `agent-spec.md` and generate tasks for agent/tool implementation
6. **Feature-team agents** — Must know how to implement tools, agents, and prompt-defined features from agent-spec.md

---

## agent-spec.md Output Format

```markdown
# Agent-Native Design: [Feature Name]

## Parity Map
| UI Action | Agent Tool | Type | Entity |
|-----------|-----------|------|--------|
| Create task | create_task(title, desc, priority) | Primitive | Task |
| Drag task to column | move_task(id, column) | Primitive | Task |
| Filter by label | list_tasks(filter={label: x}) | Primitive | Task |
| Bulk archive | (compose: list_tasks + update_task loop) | Composed | Task |

## Tool Definitions (Atomic Primitives)
### Task Tools
- `create_task(title, description, priority, labels[])` → Task
- `read_task(id)` → Task
- `update_task(id, changes)` → Task
- `delete_task(id)` → void
- `list_tasks(filter, sort, cursor)` → Task[]
- `move_task(id, column)` → Task

### [Entity] Tools
- ... (full CRUD per entity from schema.md)

## Agent-Native Features (Prompt-Defined)
### Agent: task-triage
- **Outcome:** Categorize, prioritize, and assign incoming tasks
- **Tools used:** list_tasks, update_task, read_task
- **System prompt:** "Review unassigned tasks. Analyze content, determine priority based on..."
- **Trigger:** New tasks without assignment, or user says "triage my backlog"

### Agent: sprint-planner
- **Outcome:** Suggest sprint scope based on velocity and priorities
- **Tools used:** list_tasks, read_task, create_task
- **System prompt:** "Analyze current backlog priorities, team velocity..."
- **Trigger:** User says "plan next sprint" or sprint boundary reached

## Orchestrator Extensions
### Suggested Skills
- `[project]-domain` — Domain knowledge for this project type
- `[project]-patterns` — Code patterns specific to this stack combination

### Suggested Commands
- `/[project]-status` — Project-specific status check
- `/[project]-deploy` — Project-specific deployment

## Anti-Patterns Avoided
- [ ] No workflow-shaped tools (tools are primitives, not bundled logic)
- [ ] No orphan UI actions (every UI action has agent capability)
- [ ] No incomplete CRUD (every entity has create, read, update, delete, list)
- [ ] No static tool mapping for dynamic APIs (use discovery where appropriate)
- [ ] No context starvation (system prompts include available resources)
```

---

## Parallelism Analysis: Full Pipeline

### Current Pipeline Parallelism
| Phase | Current Model | Parallel? |
|-------|--------------|-----------|
| Phase 1 | 3 agents parallel (orchestrator-dispatched) | Yes |
| Phase 1.5 | Orchestrator writes tech-stack.md | Sequential |
| Phase 2 | 1 sequential + 3 parallel (orchestrator-dispatched) | Partial |
| Phase 2.1 | 1 agent sequential | No |
| Phase 3 | feature-team (Agent Team) | Yes |
| Phase 4 | 2 agents (test-engineer + qa-automation) | Could parallel |
| Phase 5 | 1 agent (security-auditor) | No |
| Phase 6 | review-team (Agent Team) | Yes |
| Phase 7 | 2 agents (devops + deployment) | Could parallel |
| Phase 8 | 1 agent (technical-writer) | No |

### Proposed: Convert More Phases to Agent Teams
| Phase | Proposed Model | Change |
|-------|---------------|--------|
| Phase 1 | **planning-team** (already exists) | Use it instead of orchestrator dispatch |
| Phase 2 | **design-team** (NEW) | Replace orchestrator dispatch |
| Phase 3 | feature-team (already exists) | No change |
| Phase 4+5 | **quality-team** (NEW) | Combine testing + security in parallel |
| Phase 6 | review-team (already exists) | No change |
| Phase 7 | **ops-team** (NEW) | devops + deployment in parallel |

This converts 4 orchestrator-dispatched phases into Agent Teams, maximizing peer-to-peer parallelism.

---

## Open Questions

None — all key decisions resolved through brainstorm dialogue.

---

## Next Steps

1. Run `/ce:plan` to create implementation plan for:
   - agent-designer agent definition
   - design-team Agent Team definition
   - agent-native-design skill
   - project-orchestrator.md Phase 2 changes
   - task-decomposer.md changes to handle agent-spec.md
2. Decide whether to also convert Phase 1 and Phase 4+5+7 to Agent Teams in this iteration or defer
