---
title: "Phase 3: Agent-Native Developer + TDD Coverage Enforcement"
type: feat
status: active
date: 2026-03-15
origin: docs/brainstorms/2026-03-15-phase3-gaps-brainstorm.md
deepened: 2026-03-15
---

# Phase 3: Agent-Native Developer + TDD Coverage Enforcement

## Enhancement Summary

**Deepened on:** 2026-03-15
**Research agents used:** 7 (agent-native architecture, architecture strategist, pattern recognition, simplicity reviewer, agent-native parity reviewer, TDD best practices researcher, agent-native audit)

### Key Improvements from Deepening
1. **Fixed factual error**: `agent-builder` skill is NOT in senior-engineer — only `mcp-builder-extended` needs removal
2. **Added project-config.md** as required input (every other Phase 3 agent reads it — critical gap)
3. **Added per-domain artifact structure**: agent-native artifacts now cover backend, web, mobile, testing, and AI domains
4. **Added parity verification step** in Pass 2 (check built artifacts against agent-spec.md parity map)
5. **Added shared workspace + dynamic context injection** to Pass 2 scope (previously nobody owned these)
6. **Improved coverage enforcement**: new-code coverage (not overall), test file existence check, assertion density check
7. **Added dispatch prompt templates** for STEP 2.5 and STEP 4.5 (were missing)
8. **Added capability-map.md** as an output artifact for cross-platform parity tracking
9. **Added pre-scan for existing artifacts** to prevent overwriting user modifications
10. **Specified tools list** for frontmatter (was missing)

### New Considerations Discovered
- z.enum() vs z.string() contradiction between `mcp-builder-extended` and `agent-native-design` skills needs resolution
- Mobile agent-native concerns are distinct (background execution, permissions, cost-aware batching)
- Coverage should measure **new code** (not overall) to avoid penalizing agents for untouched legacy code
- Agent-native-developer should produce a `capability-map.md` for cross-platform parity tracking

---

## Overview

Two gaps in the Phase 3 (Build) pipeline:
1. **Agent-native artifacts** (skills, commands, MCP servers) designed in Phase 2's `agent-spec.md` are never built — nobody creates SKILL.md files, command definitions, or MCP tool wrappers
2. **TDD is unenforced** — agents are told "Follow TDD" but feature-team never verifies test coverage

This plan adds a new `agent-native-developer` agent (two-pass: scaffold then wire) and coverage threshold enforcement to feature-team verification.

## Problem Statement / Motivation

**Gap 1:** Phase 2's `agent-native-designer` produces `agent-spec.md` with parity maps, tool definitions, skills, commands, and MCP specs. In Phase 3, `backend-developer` builds the API endpoints tools call, and `senior-engineer` creates agent definition files in `.claude/agents/`. But nobody builds skills (SKILL.md), commands, or MCP server wrappers. Additionally, shared workspace patterns and dynamic context injection specs from `agent-spec.md` have no implementation owner.

**Gap 2:** Every Phase 3 implementation agent is instructed to "Follow TDD." But feature-team's verification (Steps 4a, 5) only checks lint + typecheck + tests pass. An agent could skip writing tests entirely and pass verification. Coverage is never measured.

(see brainstorm: `docs/brainstorms/2026-03-15-phase3-gaps-brainstorm.md`)

## Proposed Solution

### Fix 1: New `agent-native-developer` agent

- **Two-pass execution in feature-team:**
  - **Pass 1 (STEP 2.5):** Scaffold `.claude/agents/`, `.claude/skills/`, `.claude/commands/`, MCP server skeleton, `capability-map.md` from `agent-spec.md` (or auto-generate from `api-spec.md` + `design.md` Interaction Inventory for SMALL tasks). Runs BEFORE backend wave so implementation agents can see the agent structure.
  - **Pass 2 (STEP 4.5):** Wire tool definitions to actual endpoints from `api-contracts.md`, build MCP server implementations, wire shared workspace patterns, wire dynamic context injection, run parity verification. Runs AFTER backend wave completes.
- **Model:** opus (agent-native design requires parity understanding)
- **Tools:** `Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion`
- **Skills:** `agent-native-design`, `agent-builder`, `mcp-builder-extended`
- **Ownership:** `.claude/agents/`, `.claude/skills/`, `.claude/commands/`, `packages/mcp-server/`, `.mcp.json`, `capability-map.md` in target project
- **Always runs** — even for SMALL tasks (auto-generates from `api-spec.md` + `design.md` when `agent-spec.md` absent)
- **CRITICAL:** Reads `project-config.md` FIRST — determines tech stack for MCP server language, coverage commands, agent patterns

### Fix 2: Coverage Enforcement in Phase 3

- Measure coverage on **new code** (code written by the agent), not overall codebase
- Add test file existence check: every new production file must have a corresponding test file
- Add assertion density check: at least 1 assertion per test case
- Coverage threshold: 60% on new code (Phase 3), 80% on new code (Phase 4)
- Same retry pattern as lint/typecheck failures (re-dispatch agent with 1 retry)
- Coverage check applies **per-service** with routing to owning agent on failure

### Research Insights

**TDD Enforcement Best Practices:**
- Coverage alone does not prove TDD. Add structural checks: test file existence, assertion density >= 1.0, coverage on new code (not overall)
- SonarQube's "Clean as You Code" philosophy: gate on new code coverage, not overall. This prevents legacy code from blocking new features
- Consider a fudge factor: ignore coverage conditions when fewer than 20 new lines (prevents trivial changes from failing)
- The 60% → 80% progressive gate is well-supported by industry practice (Google's "acceptable" → "commendable" thresholds)

**Coverage Pitfalls to Avoid:**
- Coverage gaming: tests that execute code without assertions inflate numbers. Counter with assertion density checks
- Testing framework behavior instead of business logic: instruct agents to "test YOUR logic, not framework defaults"
- Threshold inflation via trivial modules: use per-module thresholds (business logic 85%, controllers 70%, models excluded) — defer to Phase 4

## Technical Considerations

### Architecture: Two-Pass Timing

```
STEP 1    — Read specs + tasks.md
STEP 2    — Group tasks by agent
STEP 2.5  — agent-native-developer Pass 1 (scaffold) [NEW]
STEP 3    — backend + senior + python in parallel
STEP 4a   — verify backend wave (lint + typecheck + tests + coverage) [MODIFIED]
STEP 4b   — API contract drift check
STEP 4.5  — agent-native-developer Pass 2 (wire + verify parity) [NEW]
STEP 4c   — spawn frontend
STEP 5    — verify frontend wave (lint + typecheck + tests + coverage) [MODIFIED]
STEP 6    — report results (includes agent-native artifacts + coverage) [MODIFIED]
```

**Note on step numbering:** The existing feature-team uses STEP 1-6 with sub-steps 4a/4b/4c. This plan inserts 2.5 and 4.5 as new half-steps, keeping existing numbering intact. STEP 4c (spawn frontend), STEP 5 (verify frontend), and STEP 6 (report) retain their original numbers.

### Key Design Decisions (from brainstorm + deepening)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| SMALL tasks (no agent-spec.md) | Always runs — auto-generates from api-spec.md + design.md Interaction Inventory | One agent per domain, one skill per entity; Interaction Inventory provides parity source |
| Dispatch mechanism for SMALL | Feature-team hardcodes dispatch (not task-driven) | Task-decomposer has no agent-native tasks for SMALL since agent-spec.md absent |
| MCP servers | Included in agent-native-developer scope | One agent owns everything agent-related |
| MCP server location | `packages/mcp-server/` (standalone) | Avoids file ownership conflicts with backend-developer |
| MCP tool parameter design | Prefer `z.string()` with `.describe()` over `z.enum()` | Preserves emergent capability; downstream API validates |
| Pass 1 failure | Soft failure — log, skip Pass 2, continue build | Scaffolds are not backend dependencies |
| Pass 2 without api-contracts.md | Fall back to api-spec.md with warning | api-contracts.md may be missing if backend-developer failed |
| Coverage metric | New-code coverage (not overall) | Avoids penalizing agents for legacy code |
| Coverage threshold | 60% new-code Phase 3, 80% new-code Phase 4 | Progressive gates per SonarQube "Clean as You Code" |
| Coverage tooling | CLI flags (not config files) | Avoids conflicting with test-engineer's 80% configs |
| Coverage threshold configurability | Configurable via project-config.md | Prompt-native: threshold in config, not hardcoded in bash |
| Retry policy | 1 retry per pass, independently | Same pattern as other agents |
| Existing artifacts | Pre-scan before scaffolding; merge, don't overwrite | Prevents destroying user modifications from prior iterations |
| Shared workspace | Agent-native-developer Pass 2 wires it | Backend adds WebSocket events for mutations; frontend adds observation hooks |
| Dynamic context injection | Agent-native-developer Pass 2 wires it | Generates queries/configs for runtime context per agent-spec.md table |

### Per-Domain Agent-Native Artifacts

The agent-native-developer produces domain-specific artifacts for each platform in the target project:

#### Backend Domain
- `.claude/agents/` — server-side agents (data-migration, monitoring-response)
- `packages/mcp-server/src/tools/core-crud.ts` — atomic CRUD tools per entity from schema.md (never workflow-shaped)
- `.claude/skills/` — domain-specific skills (e.g., order-management, inventory-tracking)
- `.claude/commands/` — slash commands for common workflows (e.g., `/deploy`, `/migrate`, `/seed-data`)
- `.mcp.json` — MCP server registration

#### Web Frontend Domain
- `.claude/agents/` — web-specific agents (component scaffolding, accessibility audit)
- `packages/mcp-server/src/tools/web-actions.ts` — UI parity tools (navigate, fill form, click, read state)
- `capability-map.md` — cross-platform parity table (UI Action | Web Tool | Mobile Tool | Agent Tool | Endpoint | Status)

#### Mobile Domain (Flutter/KMP/React Native)
- `.claude/agents/` — mobile-specific agents with:
  - Checkpoint/resume tools for iOS app suspension
  - Permission-aware tools (camera, location, health data)
  - Cost-aware model tier selection in frontmatter
- `packages/mcp-server/src/tools/mobile-actions.ts` — dynamic capability discovery: `list_available_capabilities` meta-tool + generic `read_data`/`write_data` with string-typed inputs

#### Testing Domain
- `.claude/agents/` — test-runner agent, parity-audit agent
- `packages/mcp-server/src/tools/testing.ts` — `run_test_suite`, `check_coverage`, `run_parity_audit`
- Parity test harness: automated tests verifying every entry in `capability-map.md` has a working tool

#### AI/ML Domain
- `.claude/agents/` — AI-specific agents (model evaluation, prompt refinement, data pipeline)
- `packages/mcp-server/src/tools/ai-service.ts` — AI service wrappers using dynamic capability discovery: `list_models`, `run_inference(model_name, input)`, `check_job_status(job_id)`
- Context injection configs for AI agents: available models, recent inference results

### MCP Server Structure

```
packages/mcp-server/
  src/
    index.ts              # Entry point, stdio transport, registers all tool groups
    tools/
      core-crud.ts        # CRUD tools per entity (auto-generated from schema.md)
      web-actions.ts      # Web UI parity tools
      mobile-actions.ts   # Mobile platform tools + dynamic discovery
      ai-service.ts       # AI/ML service wrappers
      testing.ts          # Test runner and parity audit tools
      meta.ts             # list_capabilities, refresh_context, complete_task
    resources/
      app-state.ts        # Dynamic context: entities, recent activity
      capability-map.ts   # Live parity map as MCP resource
    lib/
      api-client.ts       # HTTP client for backend endpoints (from api-contracts.md)
      validators.ts       # Shared Zod schemas
  .mcp.json               # Server registration
```

**MCP Tool Rules:**
- Every tool handler returns rich output (counts, IDs, state after action) — not just "Done"
- Every tool handler uses try/catch and returns `{ isError: true }` on failure
- Every parameter has `.describe()` so the agent understands what to pass
- Use `z.string()` for dynamic API inputs (not `z.enum()`) — downstream API validates
- Include `complete_task` tool for explicit completion signaling
- Include `refresh_context` tool for long-running sessions
- Logging uses `console.error` (never `console.log` in stdio mode)

### Dispatch Prompt Templates

**STEP 2.5 — Pass 1 (scaffold):**
```
Agent(
  subagent_type="agent-orchestrator:agent-native-developer",
  prompt="PASS 1 — SCAFFOLD agent-native artifacts for [feature].
          Read .claude/specs/[feature]/project-config.md FIRST for tech stack.
          IF .claude/specs/[feature]/agent-spec.md EXISTS: read it for parity map, tool definitions,
            skills, commands, shared workspace, and dynamic context injection specs.
          ELSE: auto-generate from .claude/specs/[feature]/api-spec.md + design.md Interaction Inventory.
            Create one agent per domain, one skill per entity, basic commands.
          PRE-SCAN: Check if .claude/agents/, .claude/skills/, .claude/commands/ already exist.
            If yes, MERGE with existing — do not overwrite user modifications.
          OUTPUT: scaffold .claude/agents/*.md, .claude/skills/*/SKILL.md, .claude/commands/*.md,
            packages/mcp-server/ skeleton (stub implementations), .mcp.json, capability-map.md.
          All MCP tool implementations should return { text: 'NOT YET WIRED' } stubs.
          FILE OWNERSHIP: You own .claude/agents/, .claude/skills/, .claude/commands/, packages/mcp-server/, .mcp.json.
          Do NOT touch services/ or apps/.
          Signal DONE with self-review when complete."
)
```

**STEP 4.5 — Pass 2 (wire):**
```
Agent(
  subagent_type="agent-orchestrator:agent-native-developer",
  prompt="PASS 2 — WIRE agent-native artifacts for [feature].
          Read .claude/specs/[feature]/project-config.md for tech stack.
          Read .claude/specs/[feature]/api-contracts.md for actual endpoint routes and shapes.
          IF api-contracts.md missing: fall back to .claude/specs/[feature]/api-spec.md with warning.
          TASKS:
          1. Replace MCP tool stubs with real API calls via packages/mcp-server/src/lib/api-client.ts
          2. Wire shared workspace patterns: ensure mutation endpoints emit WebSocket events,
             add observation hooks documentation for frontend.
          3. Wire dynamic context injection: for each row in agent-spec.md context table,
             implement the query/config that produces runtime context.
          4. PARITY VERIFICATION: re-read agent-spec.md parity map (or capability-map.md).
             For every tool/skill/command listed, verify a built artifact exists and is wired.
             Report: 'Built artifacts cover X/Y tools (Z% parity coverage).'
          FILE OWNERSHIP: You own .claude/agents/, .claude/skills/, .claude/commands/, packages/mcp-server/, .mcp.json.
          Do NOT touch services/ or apps/.
          Signal DONE with self-review + parity coverage report."
)
```

### Ownership Transfer: senior-engineer → agent-native-developer

Senior-engineer currently owns `.claude/agents/` and its dispatch prompt says "If agent-spec.md exists, read it for agent definition files to create." This must be removed to prevent two agents writing to the same directory.

**Files affected by ownership transfer:**
- `feature-team.md` — update file ownership matrix; remove agent-spec.md reference from senior-engineer dispatch prompt (line 81)
- `senior-engineer.md` — remove `.claude/agents/` ownership, remove agent-spec.md reference, remove `mcp-builder-extended` skill
- `task-decomposer.md` — reassign agent definition tasks from senior-engineer to agent-native-developer; add skill/command/MCP task categories

**Note:** `agent-builder` skill is NOT in senior-engineer's frontmatter (it's in agent-native-designer and python-developer). Only `mcp-builder-extended` needs removal from senior-engineer.

### Coverage Enforcement Policy

The feature-team enforces coverage as **policy** — the agent determines the correct commands from `project-config.md` at runtime.

**Policy for STEP 4a (backend wave verification):**
```
After lint + typecheck + tests pass:
1. TEST FILE EXISTENCE: For every new production file, verify a corresponding test file exists
   (.spec.ts, .test.ts, _test.py, _test.dart). Fail if any production file lacks tests.
2. ASSERTION DENSITY: Parse test files, verify they contain expect()/assert/should assertions.
   Flag test files with zero assertions.
3. NEW-CODE COVERAGE: Run tests with --coverage flag. Check coverage on files changed
   in this implementation wave. Fail if new-code coverage < 60%.
   Use project-config.md to determine the correct test runner and coverage flags.
4. On failure: identify the owning agent per file ownership matrix, re-dispatch with
   error output + "add tests to increase coverage above 60%" (1 retry).

Coverage retry routing:
- services/core-service/ failures → backend-developer
- services/api-gateway/, services/shared/ failures → senior-engineer
- services/ai-service/ failures → python-developer
- apps/ failures → frontend-developer
```

**Policy for STEP 5 (frontend wave verification):**
Same checks (test existence, assertion density, 60% new-code coverage) applied to apps/ directories.

### SpecFlow Gaps Addressed

| Gap from SpecFlow | Resolution |
|-------------------|------------|
| SMALL task dispatch without tasks.md tasks | Feature-team hardcodes dispatch when api-spec.md exists, bypassing task-decomposer |
| SMALL task parity unverifiable | Pass 1 reads design.md Interaction Inventory as parity source |
| senior-engineer.md not in modification list | Added — remove ownership + agent-spec.md reference |
| Pass 1 failure halting backend wave | Soft failure — log and continue |
| Pass 2 missing api-contracts.md | Fall back to api-spec.md with warning |
| Spec-driven fallback (Step 2-fallback) not updated | Added — include agent-native-developer in fallback |
| Step 6 report missing agent-native artifacts | Added — report agent definitions, skills, commands, MCP status, parity coverage % |
| MCP server ownership conflict | Standalone `packages/mcp-server/` directory |
| project-orchestrator failure detection | Added — check `.claude/agents/` existence after Phase 3 |
| Shared workspace has no implementation owner | Agent-native-developer Pass 2 wires it |
| Dynamic context injection has no implementation owner | Agent-native-developer Pass 2 wires it |
| No parity verification after build | Pass 2 self-review includes parity artifact coverage check |
| project-config.md not read | Added as required input — CRITICAL instruction |
| No pre-scan for existing artifacts | Added — merge, don't overwrite |
| z.enum() vs z.string() conflict between skills | Resolved: prefer z.string() for agent-facing tools |
| Downstream phases (4, 5, 6, 8) unaware | **Out of scope** — follow-up |
| Pass 2 could run parallel with frontend | Kept sequential per brainstorm; optimization noted for future |

### Out of Scope (Follow-Up)

These were identified by SpecFlow and deepening agents but are separate features:
- Phase 4 (test-engineer): MCP server testing, agent definition validation, parity test execution
- Phase 5 (security-auditor): MCP server security audit (new attack surface — tool input validation)
- Phase 6 (code-reviewer): Agent-native review lens for agent definitions
- Phase 8 (technical-writer): Agent-native documentation (MCP tools, available agents, skills)
- Agent Teams mode coordination for agent-native-developer
- Mutation testing on critical business logic (Stryker for JS, mutmut for Python, PITest for Kotlin)
- Mobile-specific agent-native considerations (background execution, permission handling, offline degradation)
- Unified coverage reporting via Codecov with flags per service

## System-Wide Impact

### Interaction Graph
- agent-native-developer reads: `project-config.md`, `agent-spec.md` (or `api-spec.md` + `design.md`), `api-contracts.md`
- agent-native-developer writes: `.claude/agents/`, `.claude/skills/`, `.claude/commands/`, `packages/mcp-server/`, `.mcp.json`, `capability-map.md`
- No existing agent reads from these directories during Phase 3

### Error & Failure Propagation
- Pass 1 failure: soft (log, skip Pass 2, continue build). STEP 6 report flags agent-native artifacts as absent
- Pass 2 failure: noted in build report, does not block frontend wave. Downstream phases know artifacts may be incomplete
- Coverage failure: identify owning agent via file ownership matrix, re-dispatch with 1 retry
- Coverage tool missing: skip with warning in build report (not a hard failure)

### State Lifecycle Risks
- If Pass 1 scaffolds are created but Pass 2 fails, stale scaffolds remain with `NOT YET WIRED` stubs. Acceptable — can be manually wired
- If artifacts exist from a prior iteration, Pass 1 pre-scans and merges (does not overwrite user modifications)

### API Surface Parity
- No other agent creates skills or commands. Ownership transfer from senior-engineer is clean
- `capability-map.md` provides a machine-readable parity tracking artifact for downstream phases

## Acceptance Criteria

### agent-native-developer.md
- [ ] Agent file exists at `plugins/agent-orchestrator/agents/agent-native-developer.md`
- [ ] Frontmatter: name (`agent-native-developer`), description (with trigger words + negative routing: "Does NOT handle architecture design, agent-native specification, or testing"), tools (`Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion`), model (`opus`), maxTurns (`30`), permissionMode (`acceptEdits`), skills (`agent-native-design, agent-builder, mcp-builder-extended`)
- [ ] `**CRITICAL:** Read project-config.md FIRST` instruction (matches backend-developer and frontend-developer pattern)
- [ ] `**Skills loaded:**` line in body matching frontmatter skills list
- [ ] Two-pass working protocol documented (Pass 1: scaffold with pre-scan, Pass 2: wire + parity verification)
- [ ] Per-domain artifact generation: backend, web, mobile, testing, AI/ML (adapt to project-config.md)
- [ ] SMALL task fallback: reads api-spec.md + design.md Interaction Inventory when agent-spec.md absent
- [ ] Pre-scan for existing artifacts: merge, don't overwrite
- [ ] File ownership: `.claude/agents/`, `.claude/skills/`, `.claude/commands/`, `packages/mcp-server/`, `.mcp.json`, `capability-map.md`
- [ ] Self-review checklist per pass (before signaling DONE)
- [ ] Pass 2 includes parity verification: "Built artifacts cover X/Y tools (Z%)"
- [ ] Pass 2 includes shared workspace wiring
- [ ] Pass 2 includes dynamic context injection wiring
- [ ] Interaction rule boilerplate (AskUserQuestion enforcement)
- [ ] MCP tool design follows z.string() preference (not z.enum()) for agent-facing tools

### feature-team.md
- [ ] agent-native-developer added to team composition diagram (as pre/post wave agent, distinct from parallel wave agents)
- [ ] File ownership matrix updated: agent-native-developer owns `.claude/agents/`, `.claude/skills/`, `.claude/commands/`, `packages/mcp-server/`, `.mcp.json`, `capability-map.md`
- [ ] File ownership matrix updated: senior-engineer NO LONGER owns `.claude/agents/`
- [ ] STEP 2.5 added: agent-native-developer Pass 1 dispatch with full `Agent()` prompt template
- [ ] STEP 2.5 includes conditional: if `agent-spec.md` exists → read it; else if `api-spec.md` exists → auto-generate from api-spec.md + design.md Interaction Inventory
- [ ] STEP 2.5 failure is soft: log error, skip Pass 2, continue to STEP 3. STEP 6 report notes absence
- [ ] STEP 2.5 documented as conscious pattern divergence (soft failure is new — one-line rationale in agent file)
- [ ] STEP 3 dispatch: senior-engineer prompt NO LONGER references agent-spec.md or .claude/agents/
- [ ] STEP 4a modified: adds 3 checks after lint + typecheck + tests:
  1. Test file existence (every new production file has a test file)
  2. Assertion density (flag test files with zero assertions)
  3. New-code coverage >= 60% (use project-config.md for tooling)
- [ ] STEP 4a coverage failure: route to owning agent per file ownership matrix (1 retry)
- [ ] STEP 4.5 added: agent-native-developer Pass 2 dispatch with full `Agent()` prompt template
- [ ] STEP 4.5 includes fallback: if api-contracts.md missing, use api-spec.md with warning
- [ ] STEP 5 modified: adds same 3 checks (test existence, assertion density, new-code coverage >= 60%)
- [ ] STEP 6 modified: report includes agent-native artifacts (agent count, skill count, command count, MCP status, parity coverage %)
- [ ] STEP 6 modified: report includes coverage numbers per service
- [ ] Step 2-fallback updated: includes agent-native-developer dispatch when agent-spec.md or api-spec.md exists
- [ ] SMALL task hardcoded dispatch documented as pattern divergence with rationale

### task-decomposer.md
- [ ] `agent-native-developer` added to agent assignment table with owned paths
- [ ] Agent-native task categories added: agent definitions (`.claude/agents/`), skills (`.claude/skills/`), commands (`.claude/commands/`), MCP servers (`packages/mcp-server/`)
- [ ] Line "Agent definition files → assign to senior-engineer" changed to "assign to agent-native-developer"
- [ ] Cross-reference completeness check updated: if agent-spec.md exists, verify every tool/skill/command has a task

### project-orchestrator.md
- [ ] Phase 3 pipeline diagram includes agent-native-developer
- [ ] Phase 3 failure detection updated: check `.claude/agents/` existence when agent-spec.md was present

### senior-engineer.md
- [ ] Remove reference to `.claude/agents/` ownership
- [ ] Remove "If agent-spec.md exists, read it for agent definition files to create" instruction
- [ ] Remove `mcp-builder-extended` skill from frontmatter (the ONLY skill to remove — `agent-builder` is NOT in this file)

### validate-plugin.sh
- [ ] Expected agent count threshold updated to reflect actual file count + 1

## Success Metrics

- agent-native-developer produces valid agent definitions, skills, and commands when given agent-spec.md
- agent-native-developer auto-generates sensible defaults from api-spec.md + design.md Interaction Inventory
- agent-native-developer produces per-domain artifacts (backend, web, mobile, test, AI) based on project-config.md
- Pass 2 reports parity coverage percentage
- Coverage checks catch agents that skip TDD (fails when < 60% new-code coverage)
- Coverage checks pass agents that follow TDD (succeeds when >= 60%)
- Test file existence check catches missing test files
- No file ownership conflicts between agent-native-developer and senior-engineer
- Pipeline wall-clock time increase is < 10% (scaffold pass is fast, wire pass overlaps with existing steps)

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Coverage tooling not installed in target project | Medium | Coverage check fails | Feature-team checks for coverage tool availability; skip with warning if missing (not hard failure) |
| Pass 1 scaffold quality too low for SMALL tasks | Medium | Useless stubs | Add quality heuristic: skip scaffold if < 3 API endpoints. For SMALL tasks, also read design.md Interaction Inventory for parity guidance |
| MCP server complexity exceeds single agent's capacity | Low | Agent times out | maxTurns=30 should suffice; MCP servers are typically small. Recommend ~10 turns for Pass 1, ~20 for Pass 2 |
| senior-engineer.md update missed | Medium | Two agents write to .claude/agents/ | Acceptance criteria explicitly lists this file |
| z.enum() vs z.string() conflict between skills | Medium | Inconsistent MCP tool parameters | Resolved in plan: prefer z.string() for agent-facing tools. Update mcp-builder-extended skill as follow-up |
| Stale scaffolds after Pass 2 failure | Low | NOT YET WIRED stubs remain | Acceptable — can be manually wired. STEP 6 flags incompleteness |
| python-developer has agent-builder skill | Low | Potential ownership overlap | Verify python-developer does not write to .claude/agents/. If so, remove agent-builder from its skills |

## Sources & References

### Origin

- **Brainstorm document:** [docs/brainstorms/2026-03-15-phase3-gaps-brainstorm.md](docs/brainstorms/2026-03-15-phase3-gaps-brainstorm.md) — Key decisions: two-pass model, 60% coverage, opus model, always-run, MCP in scope

### Research Sources (from deepening)

- **Agent-native architecture skill** — per-domain artifact structure, MCP server patterns, capability-map, parity enforcement
- **Agent-native audit skill** — 74% agent-native score, critical gaps in context injection (43%) and CRUD completeness (44%)
- **Agent-native parity reviewer** — shared workspace and dynamic context injection have no implementation owner
- **Architecture strategist** — two-pass is sound; factual error on agent-builder; coverage should use npm test not npx jest
- **Pattern recognition specialist** — tools list missing, project-config.md instruction missing, dispatch prompts needed
- **Simplicity reviewer** — single-pass would be simpler, but user chose two-pass; coverage should be policy not scripts
- **TDD best practices researcher** — new-code coverage, assertion density, progressive gates, SonarQube "Clean as You Code"

### Internal References

- `plugins/agent-orchestrator/agents/feature-team.md` — primary modification target
- `plugins/agent-orchestrator/agents/task-decomposer.md` — agent assignment table update
- `plugins/agent-orchestrator/agents/project-orchestrator.md` — pipeline diagram + failure detection
- `plugins/agent-orchestrator/agents/senior-engineer.md` — ownership transfer
- `plugins/agent-orchestrator/agents/agent-native-designer.md` — upstream producer of agent-spec.md
- `plugins/agent-orchestrator/skills/agent-native-design/SKILL.md` — skill for the new agent
- `plugins/agent-orchestrator/skills/agent-builder/SKILL.md` — skill for the new agent
- `plugins/agent-orchestrator/skills/mcp-builder-extended/SKILL.md` — skill for the new agent (z.enum conflict to resolve)
- `plugins/agent-orchestrator/agents/test-engineer.md` — coverage config reference (not modified)
- `plugins/agent-orchestrator/commands/run-tests.md` — existing coverage gate pattern reference

### External References

- [SonarQube — Quality Gates and New Code](https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates)
- [Codecov — Flags for Monorepo Coverage](https://docs.codecov.com/docs/flags)
- [tdd-guard — Automated TDD enforcement](https://github.com/nizos/tdd-guard)
