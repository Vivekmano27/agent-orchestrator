---
title: "feat: Add agent-designer and design-team to Phase 2 pipeline"
type: feat
status: completed
date: 2026-03-15
origin: docs/brainstorms/2026-03-15-agent-native-design-team-brainstorm.md
deepened: 2026-03-15
---

# feat: Add Agent-Designer and Design-Team to Phase 2 Pipeline

## Enhancement Summary

**Deepened on:** 2026-03-15
**Research agents used:** architecture-strategist, agent-native-reviewer, code-simplicity-reviewer, pattern-recognition-specialist, best-practices-researcher

### Key Improvements from Research
1. **Architectural decision: design-team vs 2-tier dispatch** — strong tension identified; both options fully specified with trade-offs for user decision
2. **agent-spec.md format expanded** — added implementation mapping column, shared workspace section, dynamic context injection
3. **Phase 3 handoff gap closed** — feature-team.md must read agent-spec.md; builder agents need implementation patterns
4. **Naming collision fixed** — `agent-designer` renamed to `agent-native-designer` to avoid confusion with existing `agent-builder` skill
5. **6 missing files identified** — feature-team.md, validate-plugin.sh, and ui-designer.md also need changes

### Conflicts Requiring User Decision
- **design-team (brainstorm choice) vs. lightweight addition (simplicity reviewer recommendation)** — see "Architectural Decision" section below

---

## Overview

Add agent-native design capabilities to the Phase 2 pipeline by:
1. Creating a new **agent-native-designer** agent that designs agent-native features (parity maps, atomic tools, prompt-defined agents) for target apps
2. Restructuring Phase 2 dispatch (two options — see Architectural Decision below)
3. Creating a new **agent-native-design** skill loaded by agent-native-designer

This ensures every app the pipeline builds is designed with agent-native architecture from the start — not bolted on later (see brainstorm: docs/brainstorms/2026-03-15-agent-native-design-team-brainstorm.md).

## Problem Statement

Phase 2 currently designs architecture, APIs, database schemas, and UI components — but produces **zero agent-native design**. No parity mapping (UI action → agent tool), no tool definitions, no prompt-defined features. Applications built by the pipeline are agent-unaware by default.

---

## Architectural Decision: design-team vs. Lightweight Addition

**Five review agents produced a split recommendation. This requires a user decision.**

### Option A: Design Team (Brainstorm Choice)

Replace orchestrator-dispatched Phase 2 with a design-team Agent Team.

```
Orchestrator -> design-team (single dispatch)
  design-team internals:
    STEP 1: system-architect (sync, leader)
    STEP 2: api-architect + db-architect + ui-designer + agent-native-designer (parallel)
    STEP 3: Cross-review (parity + consistency verification)
    STEP 4: Generate SUMMARY.md, return to orchestrator
  Orchestrator -> run gate (unchanged)
```

**Supporters:** Architecture reviewer (structurally sound, matches feature-team pattern), best-practices researcher (topology validated by LangGraph/AWS Strands research), pattern-recognition specialist (follows existing team patterns)

**Pros:**
- Cross-review catches parity gaps AND cross-spec inconsistencies before Phase 2.1
- Self-contained: design-team manages its own sequencing, verification, SUMMARY.md
- Matches feature-team and review-team patterns (consistency)
- Enables future Agent Teams mode (SendMessage for real-time negotiation)

**Cons:**
- Adds 1 new file (design-team.md, ~200 lines)
- March 14 refactor explicitly rejected 3-tier for Phases 1-2 (gate placement risk — though resolved by having orchestrator own gates)
- Phase 2 agents don't need peer communication (they write to separate files)
- Adds coordination overhead for agents that work independently

### Option B: Lightweight Addition (Simplicity Reviewer Recommendation)

Keep current 2-tier dispatch. Add agent-native-designer as 4th parallel agent.

```
Orchestrator -> system-architect (sync, unchanged)
Orchestrator -> api-architect + db-architect + ui-designer + agent-native-designer (parallel)
               ^^existing 3 agents^^                        ^^new 4th agent^^
Orchestrator -> wait, generate SUMMARY.md (add agent-spec.md), run gate
```

**Supporter:** Code simplicity reviewer (YAGNI — agents don't communicate, team wrapper adds no value)

**Pros:**
- Minimal change: 1 new agent, 2 modified files (vs 3 new, 5 modified)
- Consistent with March 14 refactor decision (2-tier for Phases 1-2)
- No new team coordination complexity
- Faster to implement

**Cons:**
- No cross-review step (parity gaps caught downstream in Phase 2.1/Phase 4)
- SUMMARY.md stays in orchestrator (can still add agent-spec.md summary)
- No internal consistency verification between specs

### Research Insights

**Best practices research confirms:** The leader → parallel → cross-review topology is the dominant validated pattern across LangGraph, AWS Strands, and Azure multi-agent architectures. However, research also warns that "coordination gains plateau beyond 4 agents" — 5 parallel agents is at the boundary.

**Industry consensus on file-based coordination:** Append-only shared state is preferred over overwrite. If cross-review exists, agent-native-designer should *append* a `## Parity Verification Results` section to agent-spec.md, not rewrite it.

**Gate placement:** Both options preserve correct gate placement. The orchestrator owns approval gates in both cases.

---

## Proposed Solution (applies to BOTH options)

### What agent-native-designer Produces

New file: `.claude/specs/[feature]/agent-spec.md` containing 3 core sections + 1 implementation section:

#### 1. Parity Map

```markdown
| UI Action | Agent Tool | Type | Entity | Implementation |
|-----------|-----------|------|--------|----------------|
| Create task | create_task(title, desc, priority) | Primitive | Task | POST /api/v1/tasks (in api-spec.md) |
| Drag task to column | move_task(id, column) | Primitive | Task | PATCH /api/v1/tasks/:id/move (NEW) |
| Filter by label | list_tasks(filter={label: x}) | Primitive | Task | GET /api/v1/tasks?label=x (in api-spec.md) |
| Bulk archive | (compose: list_tasks + update_task) | Composed | Task | N/A — agent composes |
```

**Research insight (agent-native reviewer):** The Implementation column is critical. Without it, task-decomposer cannot determine whether a tool maps to an existing api-spec.md endpoint (no new work) or requires a new endpoint (new task). Mark each as `(in api-spec.md)` or `(NEW)`.

**Research insight (best-practices researcher):** Include a quantitative parity metric:
```markdown
## Parity Coverage
- Entities with full CRUD: 5/5 (100%)
- UI actions with agent tools: 18/20 (90%)
- Missing: bulk export, advanced search filter
```

#### 2. Tool Definitions (Atomic Primitives)

Per entity, full CRUD. Follow these rules:
- Primitives not workflows (no bundled decision logic)
- `z.string()` inputs when API validates (not `z.enum()`)
- Dynamic capability discovery for extensible APIs
- Tool output must be rich enough for agent verification and chaining

```markdown
### Task Tools
| Tool | Params | Returns | Service |
|------|--------|---------|---------|
| create_task | title: string, desc: string, priority: string, labels: string[] | Task | core-service |
| read_task | id: UUID | Task | core-service |
| update_task | id: UUID, changes: object | Task | core-service |
| delete_task | id: UUID | void | core-service |
| list_tasks | filter: object, sort: string, cursor: string | Task[] | core-service |
```

#### 3. Agent-Native Features (Prompt-Defined)

```markdown
### Agent: task-triage
- **Outcome:** Categorize, prioritize, and assign incoming tasks
- **Tools used:** list_tasks, update_task, read_task
- **System prompt snippet:** "Review unassigned tasks. Analyze content, determine priority..."
- **Trigger:** New tasks without assignment, or user says "triage my backlog"
- **Runtime artifact:** .claude/agents/task-triage.md (Claude Code agent) OR database prompt config
- **Context injection:** Inject current sprint name, team velocity, label definitions into system prompt
```

**Research insight (agent-native reviewer, CRITICAL):** Specify the **runtime artifact format** — is it a Claude Code `.md` agent file, a database-stored prompt config, or a client-side config? Without this, senior-engineer cannot implement it.

#### 4. Shared Workspace & Context Injection

**Research insight (agent-native reviewer, WARNING):** Missing from original plan. Applications must specify:

```markdown
## Shared Workspace
- Agents read/write same database tables as users (no shadow tables)
- UI observation: WebSocket events for real-time updates when agent changes state
- Cache invalidation: TanStack Query invalidateQueries on agent tool completion

## Dynamic Context Injection
| Context Data | Source | Refresh |
|-------------|--------|---------|
| Available projects | DB query: SELECT id, name FROM projects WHERE user_id = ? | On session start |
| Recent activity | DB query: last 10 actions | Every 5 minutes |
| Domain vocabulary | Static config: sprint = 2-week iteration, etc. | On deploy |
```

### Design Depth Scaling (Simplified to 2 tiers)

**Research insight (simplicity reviewer):** Three tiers add management complexity for minimal benefit. Simplified:

| Task Size | What to produce |
|-----------|----------------|
| **SMALL** | Skip agent-native-designer entirely. No agent-spec.md. |
| **MEDIUM/BIG** | Full agent-spec.md with all 4 sections above. |

---

## Technical Approach

### Implementation Phases

#### Phase 1: Create agent-native-design skill

**File:** `plugins/agent-orchestrator/skills/agent-native-design/SKILL.md`

**Research insight (pattern-recognition specialist):** Skill must use `allowed-tools` (not `tools`) in frontmatter. Include `## When to Use` section.

```yaml
---
name: agent-native-design
description: >
  Agent-native architecture design methodology — parity mapping (UI action → agent tool),
  atomic tool definitions, prompt-defined features, and shared workspace patterns.
  Use when designing agent-native capabilities for a target application during Phase 2.
allowed-tools: Read, Grep, Glob, Write
---
```

**Skill content (~200 lines) draws from:**
- `agent-native-architecture` — 5 core principles, architecture checklist, anti-patterns
- `create-agent-skills` — skill/command file structure, frontmatter, progressive disclosure

**Key sections:**
1. When to Use
2. Core Principles (Parity, Granularity, Composability, Emergent Capability, Improvement Over Time)
3. Parity Mapping Process (with implementation mapping column)
4. Tool Design Rules (CRUD completeness, atomic primitives)
5. Agent-Native Feature Template (with runtime artifact format)
6. Shared Workspace Patterns
7. Dynamic Context Injection Patterns
8. agent-spec.md Output Template
9. Anti-Patterns (from agent-native-architecture: workflow-shaped tools, orphan UI actions, sandbox isolation, context starvation, heuristic completion)
10. Checklist

**Tasks:**
- [x] Create `plugins/agent-orchestrator/skills/agent-native-design/SKILL.md`

**Estimated effort:** S

---

#### Phase 2: Create agent-native-designer agent

**File:** `plugins/agent-orchestrator/agents/agent-native-designer.md`

**Research insight (pattern-recognition specialist, CRITICAL):** Original name `agent-designer` collides with existing `agent-builder` skill. Renamed to `agent-native-designer` — describes the methodology (agent-native), not the output (agents).

```yaml
---
name: agent-native-designer
description: >
  Designs agent-native capabilities for target applications — parity maps (UI action → agent tool),
  atomic tool definitions, prompt-defined agent features, shared workspace patterns, and dynamic
  context injection. Invoke for agent-native architecture design during Phase 2. Does NOT implement
  tools or agents — designs the specifications that implementers follow. Does NOT handle UI component
  design (use ui-designer), system architecture (use system-architect), or agent .md file creation
  (use agent-builder skill).
tools: Read, Grep, Glob, Write, AskUserQuestion
model: opus
permissionMode: acceptEdits
maxTurns: 25
skills:
  - agent-native-design
  - agent-builder
---
```

**Research insight (pattern-recognition specialist):** Description includes negative routing — differentiates from ui-designer, system-architect, and agent-builder. Uses "Invoke for" trigger phrase consistent with peer agents.

**Research insight (pattern-recognition specialist):** Tool set `Read, Grep, Glob, Write, AskUserQuestion` matches ui-designer/ux-researcher pattern (designer role, no Bash/Edit). Correct for spec-writer role.

**Research insight (architecture reviewer):** Model choice `opus` is justified — agent-native-designer must reason across all spec files to verify parity, which is architecturally complex.

**Agent body structure:**
1. `## Interaction Rule` (standard boilerplate — exact copy from existing agents)
2. `**Role:**` and `**Skills loaded:**` lines
3. Input dependencies (reads: requirements.md, architecture.md, tech-stack.md)
4. Parity mapping process with implementation mapping
5. Tool design rules (atomic primitives, CRUD completeness)
6. Agent-native feature template (with runtime artifact format)
7. Shared workspace section
8. Dynamic context injection section
9. Design depth scaling (SMALL: skip, MEDIUM/BIG: full agent-spec.md)
10. agent-spec.md output template

**Tasks:**
- [x] Create `plugins/agent-orchestrator/agents/agent-native-designer.md`

**Estimated effort:** M

---

#### Phase 3: Restructure Phase 2 dispatch

**Depends on architectural decision (Option A or B).**

##### If Option A (Design Team):

**Create:** `plugins/agent-orchestrator/agents/design-team.md`

**Research insights for design-team definition:**

```yaml
---
name: design-team
description: "Agent team for Phase 2 (Design). Dispatched by project-orchestrator. Manages system-architect (leader, sequential), then api-architect + database-architect + ui-designer + agent-native-designer (parallel), then cross-review. Produces architecture.md, api-spec.md, schema.md, design.md, agent-spec.md, and SUMMARY.md. Does NOT handle requirements (Phase 1) or task decomposition (Phase 2.1)."
tools: Agent, Read, Write, Bash, Grep, Glob, TaskOutput, AskUserQuestion
model: opus
maxTurns: 40
permissionMode: acceptEdits
---
```

**Research insight (pattern-recognition specialist):** Description must be quoted (existing teams use quotes). `maxTurns: 40` matches planning-team (not feature-team's 60). Omit `Edit` to match planning-team pattern.

**Research insight (pattern-recognition specialist):** Must include `## Agent Teams Mode` section at bottom (all 3 existing teams have this).

**Execution protocol (6 steps):**

```
STEP 1 — system-architect (synchronous, leader)
  Reads requirements.md, tech-stack.md → architecture.md

STEP 2 — Spawn ALL FOUR in parallel
  api-architect → api-spec.md
  database-architect → schema.md + docker-compose.dev.yml
  ui-designer → design.md (with Interaction Inventory table)
  agent-native-designer → agent-spec.md
  SMALL tasks: skip agent-native-designer dispatch (match review-team's spec-tracer skip pattern)

STEP 3 — Cross-review (MEDIUM/BIG only)
  3a. agent-native-designer: APPEND "## Parity Verification Results" to agent-spec.md
      (append-only, do not overwrite draft — research: avoid shared mutable state anti-pattern)
  3b. system-architect (lightweight, ~5 maxTurns): read all 5 specs, flag cross-spec inconsistencies
      APPEND "## Cross-Spec Consistency" to SUMMARY.md
      (research: multi-dimension review catches more than single-dimension parity check)

STEP 4 — Verify output files exist
  Expected: architecture.md, api-spec.md, schema.md, design.md, agent-spec.md (MEDIUM/BIG), SUMMARY.md
  Missing → retry that agent once with failure context

STEP 5 — Generate SUMMARY.md
  Read all Phase 1-2 output files. Include parity coverage metric:
  "Parity: X% (N entities with full CRUD, M/N UI actions with agent tools)"

STEP 6 — Return to orchestrator
  Report: files produced, parity gaps, consistency issues
```

**File ownership matrix:**

| Agent | Owns (writes to) | Does NOT touch |
|-------|-------------------|----------------|
| system-architect | architecture.md | api-spec.md, schema.md, design.md, agent-spec.md |
| api-architect | api-spec.md | architecture.md, schema.md, design.md, agent-spec.md |
| database-architect | schema.md, docker-compose.dev.yml | architecture.md, api-spec.md, design.md, agent-spec.md |
| ui-designer | design.md | architecture.md, api-spec.md, schema.md, agent-spec.md |
| agent-native-designer | agent-spec.md | architecture.md, api-spec.md, schema.md, design.md |

**Modify:** `plugins/agent-orchestrator/agents/project-orchestrator.md` — Phase 2 section becomes single design-team dispatch.

**Tasks:**
- [x] Create `plugins/agent-orchestrator/agents/design-team.md`
- [x] Modify Phase 2 section in project-orchestrator.md (~lines 323-376)
- [ ] Update failure detection file list (line ~198) to include agent-spec.md

**Estimated effort:** L (design-team) + M (orchestrator)

##### If Option B (Lightweight Addition):

**Modify only:** `plugins/agent-orchestrator/agents/project-orchestrator.md`

Add agent-native-designer as 4th parallel agent in Phase 2b:

```
2b. Wait for completion. Then spawn ALL FOUR IN PARALLEL:
Agent(subagent_type="agent-orchestrator:api-architect", run_in_background=True, ...)
Agent(subagent_type="agent-orchestrator:database-architect", run_in_background=True, ...)
Agent(subagent_type="agent-orchestrator:ui-designer", run_in_background=True, ...)
Agent(
  subagent_type="agent-orchestrator:agent-native-designer",
  run_in_background=True,
  prompt="Design agent-native capabilities. Read .claude/specs/[feature]/requirements.md,
          architecture.md, and tech-stack.md. Produce parity map, tool definitions,
          agent-native features, shared workspace spec.
          Output to .claude/specs/[feature]/agent-spec.md.
          SKIP for SMALL tasks (write nothing)."
)

2c. Wait for all four to complete.
2d. Generate SUMMARY.md — add agent-native summary (parity coverage %).
```

**Tasks:**
- [ ] Add agent-native-designer dispatch to Phase 2b in project-orchestrator.md
- [ ] Update SUMMARY.md generation to include agent-spec.md summary
- [ ] Update failure detection file list to include agent-spec.md (MEDIUM/BIG)

**Estimated effort:** S

---

#### Phase 4: Modify task-decomposer to handle agent-spec.md

**File:** `plugins/agent-orchestrator/agents/task-decomposer.md`

**Changes:**
1. Add `agent-spec.md` to the input file list
2. Add agent assignment rules for agent/tool tasks (as a note, not a new layer)
3. Generate parity test tasks from the parity map table

**Research insight (simplicity reviewer):** Do NOT add a new "Agent/Tool" task layer. Tools are API-layer tasks. Agent definitions are Foundation-layer tasks. Use existing layers with a note about agent tasks:

```markdown
## Agent/Tool Task Assignment Rules
When agent-spec.md is present:
- Tool endpoints marked "(NEW)" → assign to backend-developer (NestJS) or python-developer (Python)
- Tool endpoints marked "(in api-spec.md)" → no additional task (already covered by API layer)
- Agent definition files → assign to senior-engineer
- Parity test tasks → assign to test-engineer (1 test per entity: verify CRUD tools work)
```

**Research insight (best-practices researcher):** Make parity verification machine-checkable — generate one test task per entity in the parity map: "Verify that [entity] has working create, read, update, delete, list tools."

**Tasks:**
- [x] Add agent-spec.md to input file list in task-decomposer.md
- [x] Add agent/tool task assignment rules
- [x] Add parity test task generation from parity map

**Estimated effort:** M

---

#### Phase 5: Update feature-team to consume agent-spec.md

**File:** `plugins/agent-orchestrator/agents/feature-team.md`

**Research insight (architecture reviewer + agent-native reviewer, CRITICAL):** This was MISSING from the original plan. feature-team's Step 1 (line 43) explicitly lists spec files to read: `api-spec.md, schema.md, design.md, architecture.md, and tasks.md`. agent-spec.md is not in this list. Without updating feature-team, builder agents will receive agent/tool tasks but lack context.

**Changes:**
1. Add `agent-spec.md` to Step 1 file read list
2. Add agent-spec.md to each builder agent's dispatch prompt:
   ```
   "Read .claude/specs/[feature]/agent-spec.md for tool definitions and agent-native feature specs."
   ```
3. Add agent definition file ownership: senior-engineer owns `.claude/agents/` in target project

**Tasks:**
- [x] Update feature-team.md Step 1 to include agent-spec.md
- [x] Update builder agent dispatch prompts to reference agent-spec.md
- [x] Add agent definition file ownership to matrix

**Estimated effort:** S

---

#### Phase 6: Update ui-designer for interaction inventory

**File:** `plugins/agent-orchestrator/agents/ui-designer.md`

**Research insight (agent-native reviewer, WARNING):** Cross-review parity verification depends on knowing every UI action, but design.md is a design system spec (tokens, components, states), not an interaction inventory. Agent-native-designer has no structured source of UI interactions to verify against.

**Change:** Add instruction for ui-designer to include an `## Interaction Inventory` section at the end of design.md:

```markdown
## Interaction Inventory
| UI Action | Component | Trigger | Data Change | API Call |
|-----------|-----------|---------|-------------|---------|
| Create task | NewTaskForm | Form submit | Creates Task entity | POST /api/v1/tasks |
| Move task to column | TaskCard | Drag-drop | Updates Task.status | PATCH /api/v1/tasks/:id |
| Toggle sidebar filter | FilterPanel | Click | Local state only | None |
```

This gives agent-native-designer a structured input for parity verification.

**Tasks:**
- [x] Add interaction inventory instruction to ui-designer.md

**Estimated effort:** S

---

#### Phase 7: Update validate-plugin.sh

**File:** `plugins/agent-orchestrator/validate-plugin.sh`

**Research insight (architecture reviewer):** The validation script hardcodes agent count at 24 (line ~27). Adding agent-native-designer brings it to 25 (Option B) or 26 (Option A, with design-team). Skill count check at 63 must become 64.

**Tasks:**
- [x] Update agent count check: 26 (Option A)
- [x] Update skill count check: 64

**Estimated effort:** S

---

#### Phase 8: Update planning-team (DEFERRED)

**Research insight (simplicity reviewer):** Defer to follow-up. Planning-team is an alternative entry point not dispatched by the main orchestrator. It currently works without agent-native-designer. Adding it is a compatible enhancement after the main pipeline proves the concept.

**Research insight (architecture reviewer + best-practices researcher):** When implemented, consider having planning-team dispatch design-team (Option A) internally for its design phase, rather than duplicating the agent roster. This eliminates the divergence risk entirely.

---

## System-Wide Impact

### Interaction Graph
- Orchestrator dispatches Phase 2 (via design-team OR direct dispatch — depends on option)
- agent-native-designer reads requirements.md, architecture.md, tech-stack.md → writes agent-spec.md
- If cross-review (Option A): agent-native-designer re-reads api-spec.md, schema.md, design.md → appends parity results
- task-decomposer reads agent-spec.md → generates tool/agent/parity tasks
- feature-team reads agent-spec.md → builder agents implement tools and agent definitions

### Error Propagation
- If agent-native-designer fails: retry once with failure context (existing pattern)
- If cross-review finds parity gaps: flagged as warnings, not blockers
- If architecture.md has errors: propagates to all 4 downstream agents (research: "hallucination loop" risk)
  - **Mitigation (BIG tasks only):** Consider an architecture review gate between Step 1 and Step 2

### State Lifecycle Risks
- agent-spec.md depends on architecture.md (reads it in Step 2)
- Cross-review (if used) depends on all 4 other spec files being complete
- **Append-only cross-review** prevents shared mutable state issues

### Integration Test Scenarios
1. Full pipeline BIG task → verify agent-spec.md produced with parity map + implementation mapping
2. SMALL task → verify agent-native-designer is skipped (no agent-spec.md)
3. MEDIUM task → verify agent-spec.md has all 4 sections
4. Cross-review catches missing CRUD → verify warning in `## Parity Verification Results`
5. feature-team reads agent-spec.md → verify builder agents have agent-native context
6. task-decomposer generates parity test tasks → verify 1 test per entity in parity map

---

## Acceptance Criteria

### Functional Requirements
- [ ] agent-native-designer agent loads and produces agent-spec.md
- [ ] agent-spec.md contains: parity map (with implementation column), tool definitions, agent-native features (with runtime artifact format), shared workspace spec
- [ ] Parity coverage metric appears in SUMMARY.md
- [ ] task-decomposer reads agent-spec.md and generates tool/agent/parity tasks
- [ ] feature-team and builder agents read agent-spec.md
- [ ] ui-designer produces interaction inventory in design.md
- [ ] Design depth scaling: SMALL skips agent-native-designer, MEDIUM/BIG produces full agent-spec.md
- [ ] Description includes negative routing (differentiates from ui-designer, system-architect, agent-builder)

### Non-Functional Requirements
- [ ] No increase in total Phase 2 wall-clock time (agent-native-designer runs parallel with existing 3)
- [ ] Agent count: 25 (Option B) or 26 (Option A)
- [ ] Skill count: 64
- [ ] validate-plugin.sh passes with updated counts

### Quality Gates
- [ ] All existing agents still load correctly
- [ ] validate-plugin.sh passes
- [ ] agent-native-designer description has negative routing (no false routing matches)
- [ ] agent-spec.md parity map has implementation column linking to api-spec.md

---

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Cross-review adds latency (Option A only) | Medium | Low | Skip for SMALL. Append-only writes keep it fast. |
| agent-native-designer produces low-quality parity maps | Medium | Medium | Load agent-native-architecture principles. Include implementation mapping to ground output. |
| Gate placement breaks with design-team (Option A) | Low | High | Design-team returns results, orchestrator owns gates (feature-team pattern). |
| Phase 3 builders can't implement agent-native features | Medium | High | **NEW:** Update feature-team to read agent-spec.md. Ensure mcp-builder-extended skill covers tool implementation patterns. |
| Name collision with agent-builder | Low | Medium | **FIXED:** Renamed to agent-native-designer. Negative routing in description. |
| planning-team diverges | Medium | Medium | **DEFERRED:** Update planning-team after main pipeline proves concept. |
| UI interaction parity gaps not caught | Medium | Medium | **FIXED:** ui-designer produces interaction inventory for structured parity input. |
| Missing runtime artifact format | High | High | **FIXED:** agent-spec.md template requires runtime artifact specification per agent feature. |

---

## File Change Summary

### Option A (Design Team): 3 new files, 5 modified files

| Action | File | Effort |
|--------|------|--------|
| **Create** | `plugins/agent-orchestrator/skills/agent-native-design/SKILL.md` | S |
| **Create** | `plugins/agent-orchestrator/agents/agent-native-designer.md` | M |
| **Create** | `plugins/agent-orchestrator/agents/design-team.md` | L |
| **Modify** | `plugins/agent-orchestrator/agents/project-orchestrator.md` (Phase 2 → design-team dispatch) | M |
| **Modify** | `plugins/agent-orchestrator/agents/task-decomposer.md` (add agent-spec.md input) | M |
| **Modify** | `plugins/agent-orchestrator/agents/feature-team.md` (add agent-spec.md to read list) | S |
| **Modify** | `plugins/agent-orchestrator/agents/ui-designer.md` (add interaction inventory) | S |
| **Modify** | `plugins/agent-orchestrator/validate-plugin.sh` (update counts to 26/64) | S |

### Option B (Lightweight): 2 new files, 4 modified files

| Action | File | Effort |
|--------|------|--------|
| **Create** | `plugins/agent-orchestrator/skills/agent-native-design/SKILL.md` | S |
| **Create** | `plugins/agent-orchestrator/agents/agent-native-designer.md` | M |
| **Modify** | `plugins/agent-orchestrator/agents/project-orchestrator.md` (add 4th parallel agent) | S |
| **Modify** | `plugins/agent-orchestrator/agents/task-decomposer.md` (add agent-spec.md input) | M |
| **Modify** | `plugins/agent-orchestrator/agents/feature-team.md` (add agent-spec.md to read list) | S |
| **Modify** | `plugins/agent-orchestrator/agents/ui-designer.md` (add interaction inventory) | S |
| **Modify** | `plugins/agent-orchestrator/validate-plugin.sh` (update counts to 25/64) | S |

### Deferred (both options)
| Action | File | When |
|--------|------|------|
| **Modify** | `plugins/agent-orchestrator/agents/planning-team.md` | After main pipeline proves concept |

---

## Future Considerations

- **Phase 1 → planning-team** (already exists but not dispatched by orchestrator)
- **Phase 4+5 → quality-team** (test-engineer + qa-automation + security-auditor in parallel)
- **Phase 7 → ops-team** (devops-engineer + deployment-engineer in parallel)
- **agent-native-implementation skill** — Phase 3 builder skill for implementing tools with agent-native patterns (rich output, verification data, composition-friendly responses)
- **Improvement Over Time mechanisms** — memory, feedback loops, prompt refinement (5th agent-native principle, currently not operationalized)

---

## Sources & References

### Origin
- **Brainstorm document:** [docs/brainstorms/2026-03-15-agent-native-design-team-brainstorm.md](docs/brainstorms/2026-03-15-agent-native-design-team-brainstorm.md) — Key decisions: design-team replaces orchestrator-dispatched Phase 2, agent-native-designer produces agent-spec.md with parity maps

### Internal References
- Agent Team pattern: `plugins/agent-orchestrator/agents/feature-team.md` (execution protocol, file ownership)
- Agent Team pattern: `plugins/agent-orchestrator/agents/review-team.md` (cross-review, combined report)
- Planning team: `plugins/agent-orchestrator/agents/planning-team.md` (parallel design dispatch)
- Agent builder skill: `plugins/agent-orchestrator/skills/agent-builder/SKILL.md` (agent file structure)
- Orchestrator Phase 2: `plugins/agent-orchestrator/agents/project-orchestrator.md:323-376`
- Refactor plan: `docs/plans/2026-03-14-001-refactor-full-orchestrator-overhaul-plan.md` (gate placement)

### External References
- agent-native-architecture: `github.com/EveryInc/compound-engineering-plugin/.../agent-native-architecture/SKILL.md` — 5 core principles, architecture checklist, anti-patterns
- create-agent-skills: `github.com/EveryInc/compound-engineering-plugin/.../create-agent-skills/SKILL.md` — skill/command file structure, frontmatter reference

### Research Sources (from best-practices-researcher)
- [LangGraph vs CrewAI vs AutoGen: Multi-Agent Guide 2026](https://dev.to/pockit_tools/langgraph-vs-crewai-vs-autogen-the-complete-multi-agent-ai-orchestration-guide-for-2026-2d63)
- [Claude Code Agent Teams Documentation](https://code.claude.com/docs/en/agent-teams)
- [Google's Eight Essential Multi-Agent Design Patterns](https://www.infoq.com/news/2026/01/multi-agent-design-patterns/)
- [Azure AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)
- [Why Your Multi-Agent System is Failing: The 17x Error Trap](https://towardsdatascience.com/why-your-multi-agent-system-is-failing-escaping-the-17x-error-trap-of-the-bag-of-agents/)
- [AWS Strands Multi-Agent Collaboration Patterns](https://aws.amazon.com/blogs/machine-learning/multi-agent-collaboration-patterns-with-strands-agents-and-amazon-nova/)
