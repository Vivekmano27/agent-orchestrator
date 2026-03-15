---
name: agent-native-design
description: >
  Agent-native architecture design methodology — parity mapping (UI action to agent tool),
  atomic tool definitions, prompt-defined features, shared workspace patterns, and dynamic
  context injection. Use when designing agent-native capabilities for a target application
  during Phase 2 of the pipeline.
allowed-tools: Read, Grep, Glob, Write
---

# Agent-Native Design

## When to Use

- During Phase 2 when designing agent-native capabilities for a target application
- When creating parity maps between UI actions and agent tools
- When defining atomic tool primitives for an application's entities
- When specifying prompt-defined agent features (agents as features, not code)

## Core Principles

### 1. Parity
Whatever the user can do through the UI, the agent must be able to achieve through tools.

**The discipline:** When adding any UI capability, ask: can the agent achieve this outcome? If not, add the necessary tools or primitives.

**The test:** Pick any action a user can take in the UI. Describe it to the agent. Can it accomplish the outcome?

### 2. Granularity
Prefer atomic primitives. Features are outcomes achieved by an agent operating in a loop.

A tool is a primitive capability: read, write, create, update, delete. A feature is an outcome described in a prompt, achieved by an agent that has tools and operates in a loop.

**The test:** To change how a feature behaves, do you edit prose or refactor code? If prose, you have granularity right.

### 3. Composability
With atomic tools and parity, new features are just new prompts.

The agent uses primitives and its judgment to accomplish outcomes. You ship new features by adding prompts, not code.

**The test:** Can you add a new feature by writing a new prompt section, without adding new code?

### 4. Emergent Capability
The agent can accomplish things you did not explicitly design for.

When tools are atomic and parity is maintained, users ask agents for things you never anticipated — and the agent figures it out by composing available tools.

**The test:** Give the agent an open-ended request within your domain. Can it figure out a reasonable approach?

### 5. Improvement Over Time
Agent-native applications get better through accumulated context and prompt refinement.

- **Accumulated context:** Agent maintains state across sessions (what exists, what worked)
- **Prompt refinement:** Developer, user, and agent can all improve behavior through prompt changes

## Parity Mapping Process

For each entity and UI screen in the application:

1. List every user-initiated action from the interaction inventory (design.md)
2. For each action, determine the agent tool that achieves the same outcome
3. Classify as Primitive (single tool) or Composed (agent combines multiple tools)
4. Map to implementation: existing api-spec.md endpoint or NEW endpoint needed

**Parity Map Template:**

```markdown
| UI Action | Agent Tool | Type | Entity | Implementation |
|-----------|-----------|------|--------|----------------|
| Create task | create_task(title, desc, priority) | Primitive | Task | POST /api/v1/tasks (in api-spec.md) |
| Drag to column | move_task(id, column) | Primitive | Task | PATCH /api/v1/tasks/:id/move (NEW) |
| Bulk archive | (compose: list_tasks + update_task) | Composed | Task | N/A — agent composes |
```

Include a quantitative parity metric:
```markdown
## Parity Coverage
- Entities with full CRUD: X/Y (Z%)
- UI actions with agent tools: M/N (Z%)
- Missing: [list missing actions]
```

## Tool Design Rules

1. **Full CRUD per entity** — every entity gets create, read, update, delete, list
2. **Primitives not workflows** — tools do one thing; agents compose them via prompts
3. **Dynamic capability discovery** — for extensible APIs, include a `list_capabilities` meta-tool
4. **Flexible inputs** — use `z.string()` when the API validates, not `z.enum()` (keeps tools open for unexpected agent use)
5. **Rich output** — tool responses must include enough data for the agent to verify success and chain next steps

**Tool Definition Template:**

```markdown
### [Entity] Tools
| Tool | Params | Returns | Service |
|------|--------|---------|---------|
| create_[entity] | field1: type, field2: type | Entity | service-name |
| read_[entity] | id: UUID | Entity | service-name |
| update_[entity] | id: UUID, changes: object | Entity | service-name |
| delete_[entity] | id: UUID | void | service-name |
| list_[entities] | filter: object, sort: string, cursor: string | Entity[] | service-name |
```

## Agent-Native Feature Template

Features are outcomes achieved by agents, not functions you write.

```markdown
### Agent: [name]
- **Outcome:** [What the agent achieves when triggered]
- **Tools used:** [list of primitive tools from the Tool Definitions]
- **System prompt snippet:** "[Core instruction for the agent's behavior]"
- **Trigger:** [When this agent activates — user request, event, schedule]
- **Runtime artifact:** [.claude/agents/[name].md | database prompt config | client-side config]
- **Context injection:** [What runtime data goes into the system prompt]
```

**Runtime artifact format must be specified.** Options:
- Claude Code agent `.md` file in target project's `.claude/agents/`
- Database-stored prompt configuration (for server-side agents)
- Client-side agent configuration (for in-app agents)

## Shared Workspace Patterns

Agents and users must work in the same data space. No shadow tables, no separate agent directories, no sandbox isolation.

**Specify for each application:**
- Database: agents read/write the same tables as users
- Files: agents read/write the same directories as users
- UI observation: mechanism for UI to reflect agent changes (WebSocket, cache invalidation, polling)

```markdown
## Shared Workspace
- Database: agents use same tables (no shadow/agent-specific tables)
- Observation: [WebSocket events | TanStack Query invalidation | Riverpod refresh]
- Cache: [invalidation strategy when agent changes state]
```

## Dynamic Context Injection

System prompts must include runtime state so agents know what resources exist.

```markdown
## Dynamic Context Injection
| Context Data | Source | Refresh |
|-------------|--------|---------|
| Available resources | DB query | On session start |
| Recent activity | DB query: last N actions | Every 5 minutes |
| Domain vocabulary | Static config | On deploy |
| User preferences | User settings table | On session start |
```

## Anti-Patterns (NEVER do these)

1. **Workflow-shaped tools** — `analyze_and_organize` bundles judgment into the tool. Break into primitives.
2. **Orphan UI actions** — user can do something the agent cannot. Maintain parity.
3. **Incomplete CRUD** — agent can create but not update or delete. Every entity needs full CRUD.
4. **Sandbox isolation** — agent works in separate data space from user. Use shared workspace.
5. **Context starvation** — agent does not know what resources exist. Inject dynamic context.
6. **Static tool mapping for dynamic APIs** — building N tools for N API types when `discover` + `access` pattern works.
7. **Heuristic completion detection** — detecting agent done-ness through heuristics. Use explicit `complete_task` tool.
8. **Agent as router** — agent only routes to functions, does not reason or act. Waste of capability.

## agent-spec.md Output Template

```markdown
# Agent-Native Design: [Feature Name]

## Parity Map
[Parity map table with Implementation column]

## Parity Coverage
- Entities with full CRUD: X/Y (Z%)
- UI actions with agent tools: M/N (Z%)
- Missing: [list]

## Tool Definitions
[Per-entity tool tables with Params, Returns, Service columns]

## Agent-Native Features
[Per-agent feature definitions with outcome, tools, system prompt, trigger, runtime artifact, context injection]

## Shared Workspace
[Database, observation mechanism, cache invalidation]

## Dynamic Context Injection
[Context data table with source and refresh strategy]
```

## Checklist

Before completing agent-spec.md, verify:

- [ ] Every entity has full CRUD tools (create, read, update, delete, list)
- [ ] Every UI action in the interaction inventory has an agent tool or composition
- [ ] Tools are primitives — no bundled decision logic
- [ ] Parity coverage percentage is calculated and reported
- [ ] Each tool has an Implementation column (existing endpoint or NEW)
- [ ] Each agent-native feature specifies its runtime artifact format
- [ ] Shared workspace is specified (no sandbox isolation)
- [ ] Dynamic context injection is specified
- [ ] No anti-patterns present in the design
