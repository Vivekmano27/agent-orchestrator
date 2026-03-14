---
title: "refactor: Full Orchestrator Overhaul — Agents, Skills, Install, Docs"
type: refactor
status: completed
date: 2026-03-14
origin: docs/brainstorms/2026-03-14-full-refactor-brainstorm.md
---

# Full Orchestrator Overhaul — Agents, Skills, Install, Docs

## Overview

Comprehensive refactoring of the Solo Dev Orchestrator plugin to fix runtime bugs, flesh out stub skills, correct documentation, and overhaul the agent pipeline for reliable triggering, proper flow control, and user-visible planning output.

## Problem Statement

The orchestrator has multiple categories of issues preventing reliable operation:

1. **Runtime bugs**: `business-analyst` agent lacks Write tool (can't output specs), install script copies non-existent `*.sh` files, install paths reference wrong directories
2. **Dead code**: `planning-team` and `feature-team` agents are defined but never dispatched by the orchestrator
3. **Empty skills**: 12 of 63 skills are 9-line stubs providing zero guidance to agents
4. **Undefined flows**: "Request changes" and "Cancel" at approval gates have no defined behavior
5. **Blind approvals**: Users approve at gates without seeing what was produced
6. **Documentation drift**: README claims 17 commands (actually 25), install script claims 62 skills (actually 63), `check-agents` command claims 15 commands
7. **CLAUDE.md confusion**: Build/test commands reference directories that only exist in the generated project

## Proposed Solution

Six-phase refactoring executed in dependency order, from quick-win fixes through deep agent pipeline restructuring.

---

## Enhancement Summary

**Deepened on:** 2026-03-14
**Research agents used:** best-practices-researcher (x2), architecture-strategist, code-simplicity-reviewer, performance-oracle

### Key Improvements from Research
1. **Architecture reversed**: Keep 2-tier dispatch (orchestrator → specialists directly). 3-tier integration rejected after architecture review found context loss, failure opacity, and gate placement issues.
2. **File ownership matrix**: Added explicit ownership boundaries for Phase 3 parallel agents, including previously unassigned directories (api-gateway, prisma, infrastructure).
3. **Agent description quality**: Added peer differentiation and negative routing guidelines from MAST failure taxonomy research.
4. **Failure recovery**: Retry with failure context succeeds ~65% vs blind retry at ~30% (MAST research).
5. **Plugin validation**: Claude Code has built-in `claude plugin validate .` — complement with custom checks.
6. **Security scope differentiation**: Phase 5 = full OWASP/STRIDE audit, Phase 6 = focused spot-check on changes only.
7. **Skill quality**: Official docs recommend skills under 500 lines with progressive disclosure (supporting files).
8. **Complete expected-files list**: Expanded from 4 to 7+ files for failure detection.

### New Considerations Discovered
- planning-team.md is missing business-analyst and ui-designer from its dispatch list (roster gap)
- feature-team.md embeds test-engineer and code-reviewer (duplicates Phases 4 and 6)
- "Use defaults" fast path would select full enterprise stack for simple apps — needs clear labeling
- PostToolUse formatter hook adds 30-120s wall-clock time per implementation agent (60 formatter invocations)

---

## Technical Approach

### Architecture Decision (Revised after /deepen-plan research)

**Decision: Hybrid dispatch — 2-tier for planning, 3-tier (Agent Teams) for build and review.**

With `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` enabled, peer-to-peer messaging via `SendMessage` adds genuine value for phases where agents need real-time coordination. The architecture review's concerns about 3-tier are valid for Phases 1-2 (gate placement breaks), but Agent Teams mode changes the calculus for Phases 3 and 6 where peer-to-peer communication solves real problems.

**Rationale for hybrid:**
- **Phases 1-2 stay 2-tier**: BIG tasks need Gate 1 after requirements AND Gate 2 after design. A combined team call can't pause between them. Direct dispatch preserves gate placement.
- **Phase 3 uses feature-team (3-tier)**: With Agent Teams, backend-developer can `SendMessage` API contracts to frontend-developer in real-time, replacing the fragile file-based stagger dependency. Backend and frontend can negotiate contract changes live.
- **Phase 6 uses review-team (3-tier, already working)**: Reviewers can debate findings via peer-to-peer and produce a unified severity-organized report.
- **Other phases stay 2-tier**: Independent agents with no coordination need.

**Architecture (hybrid):**
```
project-orchestrator (hybrid dispatch)
  ├── Phase 1: product-manager (sync) → business-analyst + ux-researcher (parallel)    [2-tier, direct]
  ├── Phase 2: system-architect (sync) → api-architect + database-architect + ui-designer (parallel)  [2-tier, direct]
  ├── [BIG: Gate 1 after Phase 1, Gate 2 after Phase 2]
  ├── Phase 3: feature-team (Agent Teams peer-to-peer)                                  [3-tier, team]
  │     └── backend-dev + senior-eng + python-dev ←SendMessage→ frontend-dev
  ├── Phase 4: test-engineer + qa-automation (parallel)                                 [2-tier, direct]
  ├── Phase 5: security-auditor (standalone, FULL OWASP/STRIDE audit)                   [2-tier, direct]
  ├── Phase 6: review-team (Agent Teams peer-to-peer debate)                            [3-tier, team]
  │     └── code-reviewer + security-auditor (spot-check) + performance-reviewer
  ├── Phase 7: devops-engineer + deployment-engineer (parallel)                         [2-tier, direct]
  └── Phase 8: technical-writer                                                         [2-tier, direct]
```

**planning-team** becomes a documented alternative entry point for re-running Phases 1-2 directly.

### Implementation Phases

---

#### Phase 1: Install Script & README Fixes (Quick Wins)

**Goal:** Fix all broken paths, counts, and copy operations.

##### Phase 1a: Fix install.sh

**File:** `plugins/agent-orchestrator/install.sh` (move from repo root)

Changes:
1. Move `install.sh` from repo root into `plugins/agent-orchestrator/`
2. Fix line 56: change `*.sh` to `*.json` for hooks copy
3. Remove line 57: `chmod +x` is not needed for JSON config files
4. Update all hardcoded counts:
   - Line 4: "17 commands" → "25 commands"
   - Line 4: "62 skills" → "63 skills"
   - Line 43: "Installing 17 commands" → "Installing 25 commands"
   - Line 49: "Installing 62 skills" → "Installing 63 skills"
5. Fix hook count display: line 58 `ls *.sh | wc -l` → `ls *.json | wc -l`
6. Update summary box counts (lines 80-83)
7. Add `rules/` copy step (currently missing — rules are not installed)

**Acceptance criteria:**
- [ ] `install.sh` lives in `plugins/agent-orchestrator/`
- [ ] Running `bash install.sh /tmp/test-project` successfully copies all agents, commands, skills, hooks, steering docs, and rules
- [ ] Hooks directory contains `hooks.json` after install
- [ ] All count displays match actual file counts
- [ ] `set -e` does not cause cascading failures

##### Phase 1b: Fix README.md

**File:** `plugins/agent-orchestrator/README.md` (move from repo root or keep copy)

Changes:
1. Update component count table: 21 agents → 21, 3 teams → 3, 17 commands → **25**, 62 skills → **63**
2. Update "All 17 Commands" heading → "All 25 Commands"
3. Add 8 missing commands to the table:

| Command | Description |
|---------|-------------|
| `/backup <name>` | Create named git checkpoint for easy rollback |
| `/cost-track` | Track API token usage and costs across agents |
| `/init-project <name>` | Scaffold full monorepo structure from scratch |
| `/logs` | View agent activity and progress logs |
| `/new <description>` | Start new feature (alias for /build-feature) |
| `/rollback <target>` | Roll back to a previous checkpoint or commit |
| `/start <description>` | Start new feature (alias for /build-feature) |
| `/switch-model <agent> <model>` | Change an agent's model (opus/sonnet) |

4. Recalculate total file count in the header
5. Update "119 files" to accurate count

##### Phase 1c: Fix check-agents command

**File:** `plugins/agent-orchestrator/commands/check-agents.md`

Changes:
1. Update "15 available" commands → "25 available"
2. Verify all count references match actual counts

**Acceptance criteria:**
- [ ] README lists all 25 commands with descriptions
- [ ] All count references across README, install.sh, check-agents are consistent: 24 agents (21+3), 25 commands, 63 skills
- [ ] No file references "17 commands" or "62 skills" or "15 commands" anywhere

---

#### Phase 2: CLAUDE.md & product.md Documentation

**Goal:** Clarify context boundaries, improve template quality.

##### Phase 2a: Update CLAUDE.md

**File:** `CLAUDE.md`

Changes:
1. Add a section header above Build & Run:
```markdown
## Working on This Plugin
- This repo is a Claude Code plugin (all markdown). There is no application code to build/test.
- To test: install into a target project with `bash plugins/agent-orchestrator/install.sh /path/to/project`
- To validate: `bash plugins/agent-orchestrator/validate-plugin.sh` (see Phase 5)

## Target Project Commands (Apply AFTER Installation)
> The following commands apply to the project where this plugin is installed, not this repo itself.
```

2. Update agent routing rules to clarify the team-based dispatch model (after Phase 4 agent refactoring)
3. Fix the shortcut commands section to list actual command names

##### Phase 2b: Improve product.md template

**File:** `steering/product.md`

Changes: Replace bare `[Fill in]` with guided examples:

```markdown
# Product Context

## Vision
<!-- What will the finished product do? Write 1-2 sentences. -->
<!-- Example: "A project management SaaS that helps remote teams track work
     across time zones with async-first collaboration." -->
[Describe your product's end state here]

## Problem Statement
<!-- What specific pain does this solve? Who has this pain? -->
<!-- Example: "Remote teams waste 3+ hours/week in status meetings because
     existing tools (Jira, Asana) require synchronous check-ins." -->
[Describe the problem here]

## Target Users
- Primary: [Role, technical level, key characteristic]
  <!-- Example: "Engineering managers at 20-100 person remote-first companies,
       comfortable with dev tools" -->
- Secondary: [Who else uses it?]
  <!-- Example: "Individual contributors who update task status" -->

## Success Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| [What to measure] | [Target value] | [How to measure it] |
<!-- Example rows:
| User activation rate | >60% in first week | % of signups who create 1+ project |
| Task completion rate | >80% of created tasks | Tasks moved to "done" / total tasks |
| API response time | <200ms p95 | CloudWatch latency metrics |
-->

## Domain Terminology
<!-- Define key terms so agents use consistent language -->
<!-- Example:
- **Workspace**: A team's top-level container (maps to `workspaces` table)
- **Sprint**: A time-boxed iteration, always 2 weeks
- **Epic**: A collection of related user stories spanning multiple sprints
-->
[Add domain-specific terms here]
```

**Acceptance criteria:**
- [ ] CLAUDE.md clearly distinguishes plugin repo context from target project context
- [ ] product.md has instructive examples for every section
- [ ] product.md includes a "Domain Terminology" section
- [ ] A user reading product.md for the first time knows exactly what to fill in

---

#### Phase 3: Flesh Out 12 Stub Skills

**Goal:** Replace 9-line stubs with substantive skill content (80-200 lines each).

**Priority order** (by critical-path impact):

| Priority | Skill | Used By | Target Lines |
|----------|-------|---------|--------------|
| P0 | `agent-workspace-setup` | project-orchestrator | 80-100 |
| P0 | `db-optimizer` | database-architect, performance-reviewer | 120-150 |
| P0 | `git-workflow` | senior-engineer | 100-120 |
| P0 | `env-setup` | devops-engineer | 80-100 |
| P1 | `ai-integration` | python-developer | 150-200 |
| P1 | `agent-builder` | python-developer | 100-120 |
| P1 | `workflow-automation` | python-developer | 100-120 |
| P1 | `data-pipeline` | python-developer | 120-150 |
| P2 | `analytics-setup` | frontend-developer | 80-100 |
| P2 | `data-visualization` | frontend-developer | 80-100 |
| P2 | `monorepo-manager` | system-architect | 100-120 |
| P2 | `mcp-builder-extended` | senior-engineer | 100-120 |

**Content template for each skill:**

Each fleshed-out skill should include:
1. **When to use** — trigger conditions and decision framework
2. **Patterns** — 2-3 code examples with the project's tech stack (NestJS/Django/React/Flutter)
3. **Anti-patterns** — common mistakes to avoid
4. **Decision matrix** — when to choose option A vs B
5. **Checklist** — verification steps after applying the skill

**Skill content outlines:**

**`agent-workspace-setup`** (P0, used by project-orchestrator):
- Project directory structure generation
- CLAUDE.md template creation for target projects
- settings.json and hooks.json generation
- Auto-detection of tech stack from existing project files
- Environment variable template (.env.example) generation

**`db-optimizer`** (P0, used by database-architect + performance-reviewer):
- PostgreSQL query optimization patterns (EXPLAIN ANALYZE)
- Index strategy (B-tree vs GIN vs GiST, composite indexes)
- N+1 query detection and resolution
- Connection pooling configuration
- Query plan analysis checklist

**`git-workflow`** (P0, used by senior-engineer):
- Branch naming conventions (feature/, fix/, chore/)
- Conventional commit format with scope
- PR workflow (draft → review → merge)
- Rebase vs merge strategy
- Conflict resolution patterns

**`env-setup`** (P0, used by devops-engineer):
- Docker Compose for local development
- Environment variable management (.env, .env.example, .env.test)
- Database setup (PostgreSQL, Redis)
- Node.js + Python + Flutter toolchain setup
- IDE configuration (VSCode settings, extensions)

**`ai-integration`** (P1, used by python-developer):
- Claude API integration patterns (Anthropic SDK)
- LangChain setup and chain patterns
- Prompt management and versioning
- Streaming response handling
- Error handling and rate limiting
- Cost tracking and model selection

**`agent-builder`** (P1, used by python-developer):
- Claude Code agent structure (frontmatter fields)
- Tool selection per agent role
- Model routing (opus for reasoning, sonnet for execution)
- Agent description writing for accurate triggering
- Subagent dispatch patterns

**`workflow-automation`** (P1, used by python-developer):
- GitHub Actions CI/CD patterns
- Celery task patterns for async work
- Event-driven architecture (webhooks, queues)
- Scheduled task management (cron)
- Error recovery and retry strategies

**`data-pipeline`** (P1, used by python-developer):
- ETL patterns with Python
- Django management commands for batch processing
- Streaming data with async generators
- Data validation with Pydantic
- Pipeline monitoring and alerting

**`analytics-setup`** (P2, used by frontend-developer):
- Event tracking architecture
- PostHog / Mixpanel integration patterns
- Custom event naming conventions
- Privacy-first analytics (consent, anonymization)
- Dashboard design for key metrics

**`data-visualization`** (P2, used by frontend-developer):
- Chart library selection (Recharts vs Chart.js vs D3)
- Dashboard layout patterns
- Responsive chart sizing
- Accessibility for data visualizations
- Real-time data updates

**`monorepo-manager`** (P2, used by system-architect):
- Workspace configuration (npm workspaces / turborepo)
- Shared dependency management
- Cross-package type sharing
- Build order and dependency graph
- Selective CI/CD (only build changed packages)

**`mcp-builder-extended`** (P2, used by senior-engineer):
- MCP server structure (tools, resources, prompts)
- Transport types (stdio, SSE, HTTP)
- Tool parameter design
- Error handling in MCP tools
- Testing MCP servers locally

**Acceptance criteria:**
- [ ] All 12 stub skills have 80+ lines of real content
- [ ] Each skill includes code examples using the project's tech stack
- [ ] Each skill includes anti-patterns and decision frameworks
- [ ] No skill body is just a restatement of its description

---

#### Phase 4: Agent Refactoring (Core Pipeline Overhaul)

**Goal:** Fix triggering, integrate team agents, add missing tools, define gate flows, add spec summaries.

This is the largest and most critical phase. Each agent is refactored individually.

##### Phase 4a: Fix Critical Agent Bugs

**Immediate fixes (no architectural changes):**

| Agent | Bug | Fix |
|-------|-----|-----|
| `business-analyst` | Missing Write tool | Add `Write` to tools list |
| `security-auditor` | Missing Write tool | Add `Write` to tools list (needs to write audit reports) |
| `code-reviewer` | Missing Write tool | Add `Write` to tools list (needs to write review reports) |
| `performance-reviewer` | Missing Write tool | Add `Write` to tools list |
| `system-architect` | Missing Edit tool | Add `Edit` to tools list |
| `product-manager` | Missing Edit tool | Add `Edit` to tools list |
| `api-architect` | Missing Edit tool | Add `Edit` to tools list |
| `database-architect` | Missing Edit tool | Add `Edit` to tools list |

**Model consistency fixes:**

| Agent | Current | Fix |
|-------|---------|-----|
| `planning-team` | `claude-opus-4-6` | Change to `opus` (consistent alias) |
| `feature-team` | `claude-opus-4-6` | Change to `opus` (consistent alias) |
| `review-team` | `claude-opus-4-6` | Change to `opus` (consistent alias) |

##### Phase 4b: Wire feature-team into Phase 3 with Agent Teams

**File:** `plugins/agent-orchestrator/agents/project-orchestrator.md`

1. **Phases 1-2**: Keep existing direct dispatch (unchanged). Add SUMMARY.md generation after Phase 2 completes.

2. **Phase 3**: Replace direct dispatch with feature-team dispatch:
```
Phase 3: Implementation (Agent Teams mode)
  Agent(
    subagent_type="agent-orchestrator:feature-team",
    prompt="Implement all features based on specs at .claude/specs/[feature]/.
            Read api-spec.md, schema.md, design.md for contracts.
            Use SendMessage for real-time API contract negotiation between
            backend and frontend. Follow TDD. Commit after each logical unit.
            File ownership:
            - backend-developer: services/core-service/ (except src/common/), prisma/
            - senior-engineer: services/core-service/src/common/, services/api-gateway/, services/shared/
            - python-developer: services/ai-service/
            - frontend-developer: apps/web/, apps/mobile-flutter/, apps/mobile-kmp/
            NO agent touches infrastructure/"
  )
```

3. **Improve prompt templates**: Include failure context. Research shows retry with context succeeds ~65% vs blind retry at ~30%.

**File:** `plugins/agent-orchestrator/agents/feature-team.md`

Update to use Agent Teams peer-to-peer mode:
1. Dispatch backend-developer + senior-engineer + python-developer as teammates
2. Backend-developer uses `SendMessage` to send API contracts to frontend-developer when ready (replaces file-based stagger)
3. Frontend-developer waits for SendMessage from backend before starting implementation
4. **Remove test-engineer and code-reviewer** from feature-team (they belong to Phases 4 and 6)
5. Add file ownership matrix to each teammate's prompt
6. Add explicit error handling: if any teammate fails, feature-team lead reports to orchestrator

##### Phase 4c: Fix planning-team as alternative entry point

**File:** `plugins/agent-orchestrator/agents/planning-team.md`

planning-team is NOT part of the main pipeline (Phases 1-2 use direct dispatch for gate placement). Update:

1. **Update description**: "Alternative entry point for re-running Phases 1-2 directly. Use when you need to re-generate requirements and design without the full pipeline. Invoke directly, NOT dispatched by the main orchestrator."
2. **Fix roster**: Add `business-analyst` and `ui-designer` to dispatch list (currently missing)
3. **Add "when to use" section**: "Invoke this agent directly when: (a) re-running planning after scope change, (b) generating specs for a feature that already has code, (c) you want planning without the full 9-phase pipeline."
4. **Add Agent Teams support**: If Agent Teams mode is enabled, planning agents can use SendMessage for consistency validation (architects challenging each other's specs)

##### Phase 4d: Add approval gate flows

**File:** `plugins/agent-orchestrator/agents/project-orchestrator.md`

For every approval gate, add:

1. **Spec summary before gate**: Before each AskUserQuestion, read and summarize the spec files produced so far:
```
Before Gate 1 (after planning):
  Read .claude/specs/[feature]/SUMMARY.md
  Include summary text in the AskUserQuestion question field:
  "Planning complete. Here's what was produced:
   - [X] user stories with acceptance criteria
   - Architecture: [monolith/microservices], [tech stack]
   - [Y] API endpoints designed
   - Database: [Z] tables with [W] relationships

   Approve to proceed to implementation?"
```

2. **"Request changes" flow**: When user selects "Request changes":
```
AskUserQuestion(
  question="What changes do you want?",
  options=["Scope change", "Tech stack change", "Architecture change", "Other (describe)"]
)
→ Capture feedback
→ Re-dispatch the relevant team agent with feedback appended to prompt
→ Re-present the gate with updated summary
```

3. **"Cancel" flow**: When user selects "Cancel":
```
AskUserQuestion(
  question="Cancel this feature? This will clean up the spec directory and feature branch.",
  options=["Yes, cancel and clean up", "No, go back to the gate"]
)
→ If confirmed: delete .claude/specs/[feature]/, switch to previous branch, optionally delete feature branch
→ Report: "Feature cancelled. Cleaned up specs and branch."
```

##### Phase 4e: Add subagent failure detection

**File:** `plugins/agent-orchestrator/agents/project-orchestrator.md`

After each phase, add output validation:

```
After each phase completes, check for expected output files:

Phase 1 expected files:
  .claude/specs/[feature]/requirements.md    (product-manager)
  .claude/specs/[feature]/business-rules.md  (business-analyst)
  .claude/specs/[feature]/ux.md              (ux-researcher)

Phase 2 expected files:
  .claude/specs/[feature]/architecture.md    (system-architect)
  .claude/specs/[feature]/api-spec.md        (api-architect)
  .claude/specs/[feature]/schema.md          (database-architect)
  .claude/specs/[feature]/design.md          (ui-designer)
  .claude/specs/[feature]/SUMMARY.md         (orchestrator generates after Phase 2)

Phase 3 expected files:
  .claude/specs/[feature]/api-contracts.md   (backend-developer)

If ANY file is missing:
  Report which file(s) failed
  Retry the SPECIFIC AGENT that failed ONCE with context:
    "RETRY: Previous attempt failed to produce [missing file].
     Read the spec at .claude/specs/[feature]/requirements.md and try again.
     Focus specifically on [the missing deliverable]."
  If still missing after retry:
    AskUserQuestion("Agent [name] failed to produce [file]. How to proceed?",
      options=["Skip missing and continue", "Retry with different approach", "Cancel"])
```

##### Phase 4f: Add "use defaults" fast path

**File:** `plugins/agent-orchestrator/agents/project-orchestrator.md`

Update Step 0 AskUserQuestion calls:

Add a 4th option to the first question:
```
AskUserQuestion(
  question="What tech stack do you prefer?",
  options=[
    "NestJS + React + PostgreSQL (recommended)",
    "NestJS + React + SQLite (simpler)",
    "Express + Vue + SQLite",
    "Use defaults from steering/tech.md (skip all questions)"
  ]
)
```

If user selects "Use defaults", skip questions 2 and 3. Read `steering/tech.md` for tech stack, use "Standard" feature scope, and "Docker Compose" for local run.

##### Phase 4g: Refactor each remaining agent (one by one)

For each of the 21 individual agents (non-team), verify and fix:

1. **Description**: Specific enough for accurate routing? Trigger words clear?
2. **Tools**: Has all tools needed for its role? (Write for output producers, Edit for updaters)
3. **Skills**: All referenced skills exist and are not stubs? (After Phase 3 fills stubs)
4. **Model**: Appropriate for the agent's role?
5. **Interaction rule**: Includes AskUserQuestion enforcement?
6. **Output format**: Specifies where and how to write output files?
7. **Input expectations**: Specifies which spec files to read as input?
8. **maxTurns**: Sufficient for the agent's workload? (Increase from 20 to 40 for reviewers)

**Agent refactoring checklist (each agent):**

```
[ ] Description has clear trigger words and scope
[ ] Tools list matches the agent's responsibilities
[ ] All skill references resolve to substantive (non-stub) skills
[ ] Model assignment is justified (opus for reasoning, sonnet for execution)
[ ] Interaction rule present (AskUserQuestion enforcement)
[ ] Input: specifies which .claude/specs/ files to read
[ ] Output: specifies which .claude/specs/ files to write
[ ] maxTurns is sufficient (40+ for review agents, 100+ for implementation agents)
[ ] No overlap with other agents' file ownership
```

##### Phase 4h: Differentiate dual security-auditor scopes

The security-auditor runs twice (Phase 5 + Phase 6). Make scope differentiation explicit:

**Phase 5 prompt prefix** (in orchestrator):
```
"Perform a COMPLETE security audit. Run all checks: OWASP Top 10 full scan,
STRIDE threat model, secrets scan with regex patterns, full dependency audit
with CVE lookup. Write complete findings to .claude/specs/[feature]/security-audit.md"
```

**Phase 6 prompt prefix** (in review-team):
```
"Perform a FOCUSED security spot-check of the CODE CHANGES only. Check for:
injection vectors in new endpoints, auth bypass in new routes, secrets accidentally
committed. Do NOT repeat the full OWASP/STRIDE analysis — that was done in Phase 5.
Reference the Phase 5 report at .claude/specs/[feature]/security-audit.md"
```

##### Phase 4i: Improve agent descriptions for routing accuracy

**Research insight** (from MAST failure taxonomy): Agent descriptions need explicit peer differentiation and negative routing.

For each agent description, apply:
1. State primary role in first 10 words
2. List 3-5 specific capabilities
3. Include trigger phrase ("Invoke when...", "Use for...")
4. Differentiate from nearest peer agent
5. Add negative routing where overlap exists

Example fix for backend-developer vs python-developer overlap:
```
backend-developer: "Implements NestJS backend services... For Python/Django AI service,
  use python-developer instead."
python-developer: "Implements Python/Django AI service features... For NestJS backend,
  use backend-developer instead."
```

**Acceptance criteria:**
- [ ] business-analyst, security-auditor, code-reviewer, performance-reviewer have Write tool
- [ ] system-architect, product-manager, api-architect, database-architect have Edit tool
- [ ] All team agents use `opus` model alias (not `claude-opus-4-6`)
- [ ] project-orchestrator uses hybrid dispatch: 2-tier for Phases 1-2, feature-team for Phase 3, review-team for Phase 6
- [ ] feature-team wired into Phase 3 with Agent Teams peer-to-peer (SendMessage for API contracts)
- [ ] planning-team documented as alternative entry point (NOT in main pipeline)
- [ ] planning-team roster includes business-analyst and ui-designer
- [ ] feature-team does NOT include test-engineer or code-reviewer
- [ ] feature-team includes file ownership matrix in teammate prompts
- [ ] File ownership matrix defined for Phase 3 parallel agents
- [ ] Every approval gate shows a spec summary before asking for approval
- [ ] "Request changes" flow is defined with revision loop
- [ ] "Cancel" flow is defined with cleanup
- [ ] Subagent failure detection checks all 7+ expected output files per phase
- [ ] "Use defaults" fast path clearly labels it as "full enterprise stack"
- [ ] Security-auditor Phase 5 vs Phase 6 scopes explicitly differentiated
- [ ] Agent descriptions have peer differentiation and negative routing
- [ ] All 21 individual agents pass the refactoring checklist

---

#### Phase 5: Validation & Testing

**Goal:** Create a validation script and manual test procedure.

##### Phase 5a: Create validate-plugin.sh

**File:** `plugins/agent-orchestrator/validate-plugin.sh`

A bash script that verifies:
1. All agent `.md` files have valid YAML frontmatter (name, description, tools, model)
2. All skill references in agent frontmatter resolve to existing directories with SKILL.md
3. All `Agent(subagent_type="agent-orchestrator:XXX")` strings in agent files match actual agent filenames
4. All skill SKILL.md files have >15 lines (flag stubs)
5. `hooks.json` is valid JSON
6. All command `.md` files have valid frontmatter
7. Count consistency: agent count = command count = skill count matches README, install.sh, check-agents
8. No agents reference non-existent tools
9. All agents that produce output files (per their instructions) have the Write tool

##### Phase 5b: Manual smoke test procedure

Document a test procedure:
1. Create a fresh temp directory
2. Run install.sh into it
3. Verify all files copied correctly
4. Open the temp directory in Claude Code with the plugin
5. Run `/check-agents` — verify all 21 agents + 3 teams show green
6. Run `/status` — verify dashboard renders
7. Run `/build-feature "Add a hello world endpoint"` (SMALL task)
8. Verify: orchestrator dispatches specialist agents directly (2-tier, NOT through team agents)
9. Verify: no approval gates for SMALL (fully autonomous)
10. Verify: spec files written to `.claude/specs/[feature]/` with SUMMARY.md

**Acceptance criteria:**
- [ ] `validate-plugin.sh` exits 0 on a healthy plugin
- [ ] `validate-plugin.sh` catches at least: missing tools, stub skills, broken references, invalid JSON
- [ ] Smoke test procedure documented in a `TESTING.md` file

---

#### Phase 6: Final Consistency Pass

**Goal:** Ensure everything is consistent after all changes.

1. Run `validate-plugin.sh` and fix any issues
2. Update `plugin.json` description counts if changed
3. Update `marketplace.json` if counts changed
4. Update brainstorm document status to "Resolved"
5. Verify CLAUDE.md agent routing rules match the 2-tier direct dispatch model
6. Verify all file cross-references are correct

**Acceptance criteria:**
- [ ] `validate-plugin.sh` passes with zero warnings
- [ ] All count references (README, install.sh, check-agents, plugin.json) are consistent
- [ ] CLAUDE.md routing rules match 2-tier direct dispatch behavior
- [ ] Brainstorm document marked as resolved

---

## Alternative Approaches Considered

1. **Integrate planning-team and feature-team into the main pipeline (3-tier dispatch)** — Initially selected, then **reversed after architecture review**. 3-tier adds context loss at tier boundaries, failure opacity (orchestrator can't see why a team's subagent failed), and breaks gate placement for BIG tasks (can't pause between requirements and design). Kept 2-tier with teams as alternative entry points instead.

2. **Downgrade 7 agents from Opus to Sonnet** (product-manager, api-architect, database-architect, code-reviewer, 3 team agents) — Rejected by user. Quality over cost savings (~$6.59/run).

3. **Deduplicate security-auditor (run once only)** — Rejected by user. Phase 5 does a deep standalone audit, Phase 6 review-team does a lighter spot-check. Scopes now explicitly differentiated in agent prompts.

4. **Reduce pipeline for SMALL tasks** — Rejected by user. All 21 agents always run regardless of task size.

5. **Plugin mode only (remove install.sh)** — Rejected. Install script is secondary but should work. Moving it into `plugins/agent-orchestrator/` fixes the path issues.

6. **Cut validate-plugin.sh and simplify plan** — Rejected by user. Full comprehensive plan kept including validation script, TESTING.md, formal revision loops, and failure detection.

## System-Wide Impact

### Interaction Graph

- Changing `project-orchestrator.md` affects all downstream agents (it's the entry point, dispatches 18 agents directly in 2-tier model)
- Changing `planning-team.md` and `feature-team.md` are lower risk since they're alternative entry points, not main pipeline
- Changing `review-team.md` affects: code-reviewer, security-auditor (spot-check), performance-reviewer
- Adding Write tool to agents changes their security surface (they can now create files) — mitigated by `permissionMode: default` requiring user approval
- Modifying install.sh affects all users who install via script
- Adding file ownership matrix to Phase 3 constrains what each agent can modify

### Error Propagation

- If planning-team fails, the orchestrator's new failure detection will catch it and retry/escalate
- If a stub skill is loaded after fleshing out, agents get new context that changes their behavior — this is the desired outcome but could surface new edge cases

### State Lifecycle Risks

- Moving install.sh changes its path in documentation — all docs referencing it must be updated
- Changing agent frontmatter (adding tools) is safe — existing conversations are not affected
- Renaming or removing agents would break existing dispatches — we are NOT doing this

### API Surface Parity

- All 25 commands remain unchanged in their interface
- All agent dispatch names (`agent-orchestrator:agent-name`) remain unchanged
- The internal behavior of orchestrator + team agents changes but the external interface is the same

## Acceptance Criteria

### Functional Requirements

- [ ] Install script successfully installs all components from `plugins/agent-orchestrator/`
- [ ] All 25 commands listed in README with descriptions
- [ ] All 63 skills have substantive content (>15 lines)
- [ ] project-orchestrator uses hybrid dispatch: 2-tier for planning, feature-team for Phase 3, review-team for Phase 6
- [ ] feature-team dispatched by orchestrator for Phase 3 with Agent Teams peer-to-peer mode
- [ ] planning-team documented as alternative entry point with correct agent roster
- [ ] Approval gates show spec summaries from SUMMARY.md
- [ ] "Request changes" triggers a revision loop
- [ ] "Cancel" triggers cleanup
- [ ] Subagent failures detected via complete expected-files list (7+ files) with contextual retry
- [ ] File ownership matrix enforced for Phase 3 parallel agents
- [ ] Security-auditor Phase 5 vs Phase 6 scopes explicitly differentiated
- [ ] Agent descriptions have peer differentiation for accurate routing

### Non-Functional Requirements

- [ ] validate-plugin.sh passes with zero warnings
- [ ] No agent references a non-existent skill or agent
- [ ] All agents that produce file output have the Write tool
- [ ] CLAUDE.md clearly distinguishes plugin context from target project context

### Quality Gates

- [ ] Every changed agent file passes the refactoring checklist
- [ ] validate-plugin.sh catches regressions
- [ ] Smoke test documented and manually verified

## Dependencies & Prerequisites

| Dependency | Required By | Status |
|-----------|------------|--------|
| Brainstorm decisions | All phases | Resolved |
| Phase 1 (install/README) | Phase 5 (validation) | Pending |
| Phase 3 (stub skills) | Phase 4g (agent refactoring) | Pending |
| Phase 4a (tool bugs) | Phase 4b-4g (agent refactoring) | Pending |
| Phase 4b-4i (orchestrator improvements) | Phase 5 (validation) | Pending |

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Agent refactoring breaks existing flows | Medium | High | Validate with validate-plugin.sh after each change |
| Stub skill content is too generic | Medium | Medium | Use project's actual tech stack in examples |
| File ownership gaps cause parallel agent conflicts | Medium | High | Enforce ownership matrix in Phase 3 agent prompts |
| install.sh move breaks existing documentation references | Low | Low | Search-and-replace all references |
| maxTurns increase causes runaway agents | Low | Medium | Monitor token usage in first test runs |
| "Use defaults" selects full enterprise stack for simple apps | Medium | Medium | Label clearly: "Use full stack from steering/tech.md (NestJS + React + PostgreSQL + Docker)" |
| PostToolUse formatter adds latency per edit | Low | Low | Acceptable tradeoff for code quality |

## Documentation Plan

- [ ] Update README.md (Phase 1b)
- [ ] Update CLAUDE.md (Phase 2a)
- [ ] Update product.md template (Phase 2b)
- [ ] Create TESTING.md with smoke test procedure (Phase 5b)
- [ ] Update brainstorm document status (Phase 6)

## Sources & References

### Origin

- **Brainstorm document:** [docs/brainstorms/2026-03-14-full-refactor-brainstorm.md](docs/brainstorms/2026-03-14-full-refactor-brainstorm.md)
- Key decisions carried forward: always all 21 agents, hybrid dispatch (2-tier for planning + feature-team for Phase 3 + review-team for Phase 6), Agent Teams mode enabled, plugin mode primary, all 25 commands in README

### Internal References

- [plugins/agent-orchestrator/agents/project-orchestrator.md](plugins/agent-orchestrator/agents/project-orchestrator.md) — main entry point
- [plugins/agent-orchestrator/agents/planning-team.md](plugins/agent-orchestrator/agents/planning-team.md) — to be integrated
- [plugins/agent-orchestrator/agents/feature-team.md](plugins/agent-orchestrator/agents/feature-team.md) — to be integrated
- [plugins/agent-orchestrator/agents/business-analyst.md](plugins/agent-orchestrator/agents/business-analyst.md) — missing Write tool
- [plugins/agent-orchestrator/hooks/hooks.json](plugins/agent-orchestrator/hooks/hooks.json) — hooks file (not .sh)
- [install.sh](install.sh) — to be moved and fixed

### Research Findings (Initial)

- All 24 agent dispatch references are valid (zero broken references)
- All 63 skill references resolve to existing directories
- 12 skills are stubs (9 lines) providing zero value
- business-analyst is the only agent with a critical missing tool (Write)
- planning-team and feature-team are never dispatched (dead code)
- security-auditor runs twice (Phase 5 + Phase 6 review-team)
- No revision/cancel flow at any approval gate
- No subagent failure detection mechanism

### Research Findings (Deepened — 2026-03-14)

**Architecture (architecture-strategist):**
- 3-tier dispatch adds context loss, failure opacity, and gate placement problems
- review-team works at 3-tier because reviewers are independent with no gates
- planning-team.md is missing business-analyst and ui-designer from roster
- feature-team.md embeds test-engineer and code-reviewer (duplicates Phases 4 and 6)
- File ownership gaps: api-gateway, prisma, infrastructure directories unassigned
- Expected-files list was incomplete (checked 4 of 7+ files)

**Best Practices (best-practices-researcher):**
- Staggered parallel is the correct pipeline pattern for 15-20+ agents
- Cap parallel fan-out at 4-6 agents (current max is 3-4, within safe zone)
- MAST failure taxonomy: retry with context succeeds ~65% vs blind retry at ~30%
- Agent descriptions need: role in first 10 words, peer differentiation, negative routing
- File ownership with explicit boundaries is the standard coordination pattern
- Gate summaries should be actionable (key decisions + metrics), not exhaustive

**Plugin Development (best-practices-researcher):**
- Claude Code has built-in `claude plugin validate .` command
- Skills should stay under 500 lines, use progressive disclosure with supporting files
- Only `name` is required in plugin.json; Claude auto-discovers components by directory
- Agent frontmatter supports 12 fields (name, description, tools, disallowedTools, model, permissionMode, maxTurns, skills, memory, mcpServers, hooks, background, isolation)
- Hooks support 22 events and 4 types (command, prompt, agent, http). Exit code 2 blocks.
- Use `${CLAUDE_PLUGIN_ROOT}` in hook scripts for portable paths

**Cost Analysis (performance-oracle):**
- Full pipeline per run: ~$30-80 (single-turn floor: ~$13.15)
- Opus agents account for ~$10.85 of base cost
- Middle-tier team agents add ~$4.95 pure dispatch overhead
- Security auditor duplication wastes ~$2.30/run
- PostToolUse formatter hook adds 30-120s wall-clock time per implementation agent

**Simplicity (code-simplicity-reviewer):**
- validate-plugin.sh could be replaced with 5 shell one-liners (user chose to keep full script)
- Per-agent checklist (9 items x 21 agents = 189 checks) benefits from 2-pass approach: automated grep + targeted review of 8 critical-path agents
- "Use defaults" fast path would select full enterprise stack for simple apps — needs clear labeling
