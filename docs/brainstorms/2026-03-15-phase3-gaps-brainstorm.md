# Brainstorm: Phase 3 Gaps — Agent-Native Artifacts + TDD Enforcement

**Date:** 2026-03-15
**Status:** Complete
**Author:** AI + Vivek

## What We're Building

Two fixes to the Phase 3 (Build) pipeline:

### Fix 1: Agent-Native Developer Agent

**Problem:** Phase 2's `agent-spec.md` (produced by agent-native-designer) designs the full agent-native surface — parity map, tool definitions, skills, commands, MCP tools. But Phase 3 only partially implements it:
- backend-developer builds API endpoints that tools call
- senior-engineer creates agent definition files in `.claude/agents/`
- **Nobody** builds skills (SKILL.md), commands, or MCP tool wrappers

**Solution:** Create a new `agent-native-developer` implementation agent dedicated to building all agent-native artifacts from `agent-spec.md`.

### Fix 2: TDD Coverage Enforcement

**Problem:** Phase 3 agents are told "Follow TDD" but feature-team only verifies lint + typecheck + tests pass. It never checks:
- Whether test files actually exist alongside new code
- What the coverage percentage is
- Whether TDD was actually followed (tests could be skipped entirely and verification still passes)

**Solution:** Add coverage threshold checks (60% minimum) to feature-team's verification steps after each wave.

## Why This Approach

### Agent-Native Developer — Dedicated agent, scaffold-first

**Decision:** New dedicated agent runs BEFORE the implementation wave.

**Why not senior-engineer?** Senior-engineer already handles cross-service integration, auth middleware, shared utilities, and gateway routing. Adding skills/commands/MCP tools to its workload would overload it and blur ownership boundaries.

**Why scaffold-first (before implementation wave)?** Agent definitions, skills, and commands are markdown/config files that reference API endpoints but don't need them to exist at creation time. By scaffolding them first:
- Backend-developer can see the agent tool structure and ensure endpoints are tool-compatible
- Frontend-developer can see which UI actions need agent parity
- The agent structure is ready — only needs endpoint wiring after backend completes

**Timing in feature-team (two-pass):**
```
STEP 2.5  — agent-native-developer Pass 1 (scaffold from agent-spec.md or auto-generate from api-spec.md)
STEP 3    — backend + senior + python in parallel
STEP 4    — verify backend wave (lint + typecheck + tests + coverage)
STEP 4.5  — agent-native-developer Pass 2 (wire tools to actual endpoints from api-contracts.md)
STEP 5    — spawn frontend
STEP 6    — verify frontend wave (lint + typecheck + tests + coverage)
STEP 7    — report results
```

### TDD Coverage — 60% threshold in Phase 3

**Decision:** Run coverage tools after each wave, fail if below 60%.

**Why 60% not 80%?** Phase 3 agents write unit tests via TDD. Phase 4 (test-engineer) brings coverage to 80%+ with integration, E2E, security, and UAT tests. 60% ensures core paths are tested without slowing implementation.

**Why not just test-file-existence?** File existence doesn't guarantee meaningful tests. A test file with one trivial assertion would pass the check. Coverage tools verify actual code paths are exercised.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Who builds agent-native artifacts? | New `agent-native-developer` agent | Dedicated ownership, clear responsibility |
| When does it run? | Two-pass: scaffold before impl wave, wire after backend wave | Implementation agents see structure; tools get real endpoints |
| What does it own? | `.claude/agents/`, `.claude/skills/`, `.claude/commands/`, MCP server wrappers in target project | Full agent-native surface |
| SMALL tasks (no agent-spec.md)? | Always runs — auto-generates from api-spec.md | Sensible defaults: one agent per domain, one skill per entity, basic commands |
| MCP servers? | Included in agent-native-developer scope | One agent owns everything agent-related |
| Model for agent-native-developer? | opus | Agent-native design requires understanding parity, tool composition |
| TDD enforcement method? | Coverage threshold via tools (nyc/istanbul, pytest-cov) | Verifies actual code paths, not just file existence |
| Phase 3 coverage threshold? | 60% minimum | Reasonable TDD bar; Phase 4 raises to 80%+ |
| Phase 3 coverage failure behavior? | Fail verification, re-dispatch agent with 1 retry | Same pattern as lint/typecheck failures |

## Files to Change

### Create
- `plugins/agent-orchestrator/agents/agent-native-developer.md` — new implementation agent

### Modify
- `plugins/agent-orchestrator/agents/feature-team.md`:
  - Add agent-native-developer to team composition
  - Add STEP 2.5 (scaffold before implementation wave)
  - Add coverage checks in Steps 4a and 5 verification
  - Add coverage reporting to Step 6 build report
- `plugins/agent-orchestrator/agents/task-decomposer.md`:
  - Add agent-native task categories (agent definitions, skills, commands)
  - Add `agent-native-developer` to agent assignment table
- `plugins/agent-orchestrator/agents/project-orchestrator.md`:
  - Add agent-native-developer to Phase 3 agent list

## Resolved Questions

- **Q: Should agent-native-developer run in parallel with backend or before?** A: Before (scaffold-first) + after backend (wire pass). Two-pass approach.
- **Q: What coverage threshold for Phase 3?** A: 60% minimum, Phase 4 raises to 80%+.
- **Q: Should coverage check use tooling or file existence?** A: Tooling (nyc/istanbul, pytest-cov) for actual path verification.
- **Q: SMALL tasks without agent-spec.md?** A: Always runs — auto-generates from api-spec.md (one agent per domain, one skill per entity, basic commands).
- **Q: Should MCP server wrappers be included?** A: Yes — agent-native-developer owns the full agent-native surface including MCP servers.
- **Q: Should agent-native-developer do a second pass after backend?** A: Yes — Pass 1 scaffolds, Pass 2 wires tools to actual endpoints from api-contracts.md.

## Open Questions

None — all decisions resolved.
