---
title: "feat: Phase 1 Planning Team Coordinator"
type: feat
status: active
date: 2026-03-16
origin: docs/brainstorms/2026-03-16-phase1-planning-team-brainstorm.md
---

# Phase 1 Planning Team Coordinator

## Enhancement Summary

**Deepened on:** 2026-03-16
**Research agents used:** architecture-strategist, code-simplicity-reviewer, pattern-recognition-specialist, agent-native-reviewer, agent-harness-patterns

### Key Improvements
1. Fixed CLAUDE.md descriptor — "sequential coordinator" not "Agent Teams peer-to-peer" (planning-team doesn't use SendMessage)
2. Added 9 missed update targets: add-feature.md (critical — same `run_in_background` bug), 6 command files, phase-validator.sh, phase-runner SKILL.md
3. Added Gate 1 "Request changes" cascade update — must route through planning-team, not dispatch BA/UX directly
4. Added Information Flow section and cross-review checklist with 5 concrete checks
5. Added PM dispatch prompt tech-stack prohibition to prevent regression
6. Added explicit progress steps table with 13 step IDs

### Simplicity Considerations (from code-simplicity-reviewer)
The simplicity reviewer noted that an 11-step protocol mirrors design-team's mesh coordination for what is actually a linear chain (PM→BA→UX). A 6-step version would suffice. However, the user explicitly requested "full design-team parity" during brainstorming, and the additional steps (cross-review, independent reviewer, critical issue handling) add quality assurance that justifies the overhead for MEDIUM/BIG tasks. SMALL tasks already skip to just PM dispatch. The requirements-reviewer was also explicitly requested by the user.

## Overview

Repurpose the existing `planning-team` agent into a full Phase 1 coordinator — mirroring `design-team`'s structure for Phase 2. Currently, Phase 1 agents (product-manager, business-analyst, ux-researcher) are dispatched directly by the orchestrator as isolated subagents. BA and UX run with `run_in_background=True`, which breaks their `AskUserQuestion` calls — the user never sees their questions. There is no shared research, no cross-review, and no peer coordination.

## Problem Statement / Motivation

Two root problems:

1. **Lost user questions.** BA and UX run in background (`run_in_background=True`), so their `AskUserQuestion` calls silently fail. The user only interacts with PM, while BA and UX auto-generate specs without meaningful input.

2. **Zero inter-agent coordination.** BA doesn't know what PM asked. UX doesn't build on BA's business rules. There's no shared research, no cross-review, no consistency validation. Each agent works in isolation against the same requirements.md but with no alignment mechanism.

The `design-team` pattern (Phase 2) already solved the identical coordination problem for design agents. Phase 1 needs the same treatment.

## Proposed Solution

Transform `planning-team.md` from a standalone Phases 1+2 runner (never dispatched by the main pipeline) into a Phase 1-only coordinator dispatched by the orchestrator — mirroring `design-team`'s 11-step protocol with shared research, sequential dispatch, cross-peer review, independent requirements-reviewer, and phase-1-summary.md generation.

### Planning-Team 11-Step Execution Protocol

```
STEP 1  — Read task size and spec directory
STEP 2  — Shared research (scan codebase for existing domain patterns, write research-context.md)
STEP 3  — Dispatch product-manager (synchronous — asks user 2-10 questions)
STEP 4  — Dispatch business-analyst (synchronous — asks user 0-3 questions, reads PM output)
STEP 5  — Dispatch ux-researcher (synchronous — asks user 0-3 questions, reads PM + BA output)
STEP 6  — Verify all output files exist with substantive content
STEP 7  — Cross-peer review (planning-team reads all 3 files, flags contradictions, routes fixes)
STEP 8  — Independent requirements-reviewer (fresh context, severity-rated findings)
STEP 9  — Handle Critical issues (route to responsible agent, 1 retry max, escalate to user)
STEP 10 — Generate phase-1-summary.md
STEP 11 — Report to orchestrator
```

### Skip Table (by task size)

| Step | SMALL | MEDIUM | BIG |
|------|-------|--------|-----|
| 1. Read task size | Run | Run | Run |
| 2. Shared research | Skip | Run | Run |
| 3. PM dispatch | Run (abbreviated: 2-3 questions) | Run (Tier 1+2: 5-8 questions) | Run (full: 8-10 questions + Tier 3) |
| 4. BA dispatch | Skip | Run | Run |
| 5. UX dispatch | Skip | Run (skip if Frontend: none) | Run (skip if Frontend: none) |
| 6. Verify outputs | Run (requirements.md only) | Run (all 3) | Run (all 3) |
| 7. Cross-peer review | Skip | Run | Run |
| 8. Requirements-reviewer | Skip | Run | Run |
| 9. Critical issue handling | Skip | Run | Run |
| 10. phase-1-summary.md | Minimal (inline in report) | Full | Full |
| 11. Report | Run | Run | Run |

### Conditional UX Skip

planning-team reads `project-config.md`. If `Frontend: none` (API-only feature), UX is skipped and a stub ux.md is written: "No frontend — UX not applicable per project-config.md."

## Technical Considerations

### SendMessage and Cross-Peer Review

Research confirms SendMessage is NOT declared in agent tool frontmatter — it's an optional runtime enhancement (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`). Current PM, BA, and UX agents do not have SendMessage.

**Decision:** planning-team performs cross-review itself (Step 7) by reading all three output files and flagging contradictions. This is simpler and more reliable than adding SendMessage to leaf agents. If Agent Teams becomes available in the future, Step 7 can be upgraded to dispatch agents for peer review via SendMessage.

Cross-review checklist (5 concrete checks):
1. **Entity name consistency** — Do all three files use the same names for the same things? (e.g., PM says "Order", BA says "Purchase", UX says "Transaction")
2. **Story-to-rule coverage** — Every business rule in business-rules.md traces to at least one user story. Flag orphan rules.
3. **Flow-to-story traceability** — Every user journey in ux.md maps to user stories. Flag flows referencing features not in the PRD (scope creep).
4. **State machine coverage** — BA's state machines cover all status transitions implied by PM's user stories. Flag implicit state changes BA didn't formalize.
5. **Scope alignment** — Neither BA nor UX introduced features beyond PM's scope boundaries. Check the PRD's cut list.

Contradiction routing:
- Entity naming mismatch → route to the agent that deviated from PM's terminology (PM is source of truth)
- Missing business rule → route to BA with the specific user story
- Missing UX flow → route to UX with the specific story
- Scope creep → route to offending agent with PM's cut list as evidence
- 1 round of fixes. If contradictions persist, pass to requirements-reviewer as known issues.

### research-context.md Lifecycle

Phase 1 writes `research-context.md` with codebase domain patterns. Phase 2's design-team also writes this file.

**Decision:** Phase 1 writes `research-context.md`. Phase 2's design-team reads the existing file in Step 2 and appends its own findings (design-specific patterns like existing components, API endpoints, schemas). Both phases share one file, with Phase 2 additive.

### phase-1-summary.md (not SUMMARY.md)

Design-team writes `SUMMARY.md` covering both Phase 1 and Phase 2 outputs. To avoid conflict, planning-team writes `phase-1-summary.md` instead. Design-team's SUMMARY.md supersedes it as the canonical overview.

### Question Budget Enforcement

> **Note:** This is a new pattern unique to planning-team (not mirrored from design-team). Design agents don't ask users questions, so design-team has no equivalent.

PM's hard cap: 15 questions total across all Phase 1 agents. planning-team enforces this by:
1. Adding to PM's dispatch prompt: "After completing, report questions asked. Format: `QUESTIONS_ASKED: [N]`"
2. Parsing PM's output for the count
3. Passing remaining budget in BA and UX dispatch prompts: "Question budget remaining: [N]. You may ask AT MOST [ceil(N/2)] questions. Use assumption-then-correct pattern."

Per-agent caps already exist (PM: 2-10, BA: 0-3, UX: 0-3) and sum to ~16 max. The coordinator budget acts as a secondary enforcement layer for BIG tasks where PM might use 10+ questions.

### Approval Gate Ownership

Following design-team's pattern: planning-team does NOT present the Phase 1 approval gate. The orchestrator handles it after planning-team returns, using phase-1-summary.md content in the gate question. This prevents double-gating.

### PM maxTurns Exhaustion

PM has maxTurns=50 with a checkpointing protocol (writes `## Status: INCOMPLETE`). planning-team handles this:
1. After PM returns, check requirements.md for `## Status: INCOMPLETE`
2. If found: re-dispatch PM once with resume prompt: "RESUME: Continue from section [N]. Previous output at [path]."
3. If still incomplete after retry: escalate to user via AskUserQuestion

### BA Checkpointing

BA has maxTurns=20 with no checkpointing protocol. Add one: if BA is running low on turns, write what it has with `## Status: INCOMPLETE — resume from [section]`.

### Resume Protocol

planning-team tracks progress in `agent-status/planning-team.md`. On re-dispatch:
1. Check if requirements.md exists and is complete → skip PM
2. Check if business-rules.md exists → skip BA
3. Check if ux.md exists → skip UX
4. Resume from the first incomplete step

### Standalone Invocation

The existing planning-team's standalone use case (re-running Phases 1+2 combined) is removed. For re-running planning after scope change, the user should invoke the orchestrator with a "re-run from Phase 1" directive, which ensures proper gate placement.

## System-Wide Impact

### Interaction Graph

- **Orchestrator** reads `phase-1.md` → dispatches `planning-team` (instead of PM/BA/UX directly)
- **planning-team** dispatches PM → BA → UX sequentially → cross-review → requirements-reviewer → phase-1-summary.md
- **design-team** (Phase 2) reads planning-team's outputs: requirements.md, business-rules.md, ux.md, research-context.md
- **Orchestrator** reads phase-1-summary.md for Gate 1 approval question (BIG tasks)

### Error Propagation

- PM failure → planning-team retries once → escalates to user → orchestrator handles "Phase 1 failed"
- BA/UX failure → planning-team retries once → writes stub file → continues
- requirements-reviewer Critical findings → planning-team routes to responsible agent → 1 retry → escalate
- planning-team itself fails → orchestrator retries once per standard retry protocol

### State Lifecycle Risks

- **Partial completion risk:** PM completes, BA fails, UX never runs → requirements.md exists but business-rules.md doesn't → design-team in Phase 2 would start with incomplete inputs. **Mitigation:** planning-team verifies ALL expected outputs before returning success.
- **research-context.md overwrite risk:** Phase 2 overwrites Phase 1's research. **Mitigation:** Phase 2 appends, doesn't overwrite.

### API Surface Parity

No external API changes. Internal dispatch changes only.

### Integration Test Scenarios

1. BIG task end-to-end: orchestrator → planning-team → PM asks 8 questions → BA asks 2 → UX asks 1 → cross-review finds 1 contradiction → fix → requirements-reviewer approves → phase-1-summary.md → orchestrator presents Gate 1
2. SMALL task: orchestrator → planning-team → PM asks 2 questions → skip BA/UX/review → return requirements.md
3. API-only feature: orchestrator → planning-team → PM → BA → skip UX (Frontend: none) → cross-review → reviewer → summary
4. PM maxTurns exhaustion: PM writes INCOMPLETE → planning-team re-dispatches → PM completes
5. Resume mid-phase: session drops after PM → re-dispatch planning-team → detects requirements.md exists → skips PM → dispatches BA

## Acceptance Criteria

### Functional Requirements

- [ ] planning-team.md is a full Phase 1 coordinator with 11-step protocol
- [ ] PM, BA, UX all dispatch synchronously (no `run_in_background`)
- [ ] AskUserQuestion calls from all three agents reach the user
- [ ] planning-team performs cross-review of all three output files
- [ ] requirements-reviewer.md exists and validates Phase 1 specs independently
- [ ] phase-1-summary.md is generated for orchestrator gate
- [ ] phase-1.md dispatches planning-team (not individual agents)
- [ ] project-orchestrator.md references planning-team for Phase 1
- [ ] SMALL tasks skip BA, UX, research, review, cross-review
- [ ] UX is skipped when project-config.md has Frontend: none
- [ ] Question budget (15 total) is enforced across PM/BA/UX
- [ ] PM INCOMPLETE status triggers re-dispatch

### Non-Functional Requirements

- [ ] planning-team maxTurns sufficient for 11-step protocol (~50)
- [ ] No double-gating: planning-team does NOT present approval gate
- [ ] Resume protocol: re-dispatch skips completed agents

### Quality Gates

- [ ] All existing agents (PM, BA, UX) retain their question protocols unchanged
- [ ] Orchestrator verification table updated with new Phase 1 outputs (conditional on task size)
- [ ] CLAUDE.md pipeline description updated (uses "sequential coordinator", NOT "Agent Teams peer-to-peer")
- [ ] Gate 1 "Request changes" cascade routes through planning-team (not direct BA/UX dispatch)
- [ ] add-feature.md Wave 2 BA/UX dispatch fixed (no more run_in_background)
- [ ] 6 command files updated with new Phase 1 dispatch model
- [ ] phase-runner SKILL.md Phase File Map updated
- [ ] phase-validator.sh maps planning-team to Phase 1
- [ ] design-team.md Step 2 appends to research-context.md (not overwrites)
- [ ] validate-plugin.sh includes requirements-reviewer in write-tool check

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| add-feature.md still uses run_in_background for BA/UX | High | High | Fix in Phase 5 (same root bug) |
| Stale references in 9 command/hook/skill files | High | Medium | Fix in Phase 6 (text-only updates) |
| Gate 1 cascade dispatches BA/UX directly (bypasses planning-team) | Medium | High | Fix cascade rule in Phase 4 |
| PM exhausts maxTurns on BIG tasks | Medium | High | Checkpointing + resume in planning-team |
| BA exhausts maxTurns on complex domains | Low | Medium | Add checkpointing protocol to BA |
| Cross-review adds too many user-facing questions | Low | Medium | Cross-review doesn't ask users — only routes fixes to agents |
| planning-team itself exhausts maxTurns | Low | High | Set maxTurns=50, protocol is mostly dispatching subagents |
| Removing standalone planning-team use case breaks workflows | Low | Low | Orchestrator re-run handles the same scenario |

## Implementation Phases

### Phase 1: Create requirements-reviewer.md (new agent)

**Files:** `agents/requirements-reviewer.md`

Model after `design-reviewer.md`. Key specs:

```yaml
name: requirements-reviewer
tools: Read, Grep, Glob, Bash, Write, AskUserQuestion
model: inherit
color: blue
permissionMode: default
maxTurns: 20
skills:
  - project-requirements
  - user-story-writer
  - agent-progress
```

**Review checklist (7 points):**
1. **User Story Completeness** — every story has acceptance criteria, priority, edge cases
2. **Cross-Document Consistency** — features in requirements.md covered by business-rules.md workflows
3. **Persona-Story Alignment** — every persona has at least one story
4. **Business Rule Coverage** — every rule in business-rules.md traced to a requirement
5. **UX Flow Coverage** — every user journey in ux.md traced to a user story
6. **Non-Functional Requirements** — NFRs present and measurable
7. **Scope Boundaries** — cut list exists, no scope creep from BA/UX

**Output:** `requirements-review.md` with:
- Verdict: Approve / Approve with conditions / Request changes
- Findings by severity: Critical / High / Medium / Low (each with finding ID REQ-NNN)
- `## Checklist Results` table (matching design-reviewer's format):

| # | Check | Result | Findings |
|---|-------|--------|----------|
| 1 | User Story Completeness | PASS/FAIL | REQ-001, REQ-002 |
| 2 | Cross-Document Consistency | PASS/FAIL | — |
| ... | ... | ... | ... |

- Recommendation section

**Scoped re-review mode:** When dispatched with "Verify ONLY these Critical issues have been resolved: [list]", checks only those findings. Do NOT perform a full review. Update the verdict in requirements-review.md.

**Success criteria:** Agent file validates with `validate-plugin.sh`, follows frontmatter conventions (2 examples in description, progress steps table, interaction rule boilerplate).

### Phase 2: Rewrite planning-team.md

**Files:** `agents/planning-team.md`

Full rewrite. Transform from standalone Phases 1+2 runner into Phase 1-only coordinator.

**Frontmatter:**
```yaml
name: planning-team
description: |
  Agent team for Phase 1 (Planning). Dispatched by project-orchestrator...
  [2 examples in Context/user/assistant/commentary format]
tools: Agent, Read, Write, Bash, Grep, Glob, TaskOutput, AskUserQuestion
model: inherit
color: magenta
maxTurns: 50
permissionMode: acceptEdits
skills:
  - agent-progress
```

**Body structure (mirroring design-team):**
1. `# Planning Team — Phase 1 Requirements Gathering`
2. `## Interaction Rule` — standard AskUserQuestion boilerplate
3. `## Role` — Phase 1 coordinator description
4. `## Dispatch Mechanism` — sequential dispatch rationale
5. `## Team Composition` — PM, BA, UX, requirements-reviewer tree
6. `## File Ownership Matrix` — PM→requirements.md, BA→business-rules.md, UX→ux.md
7. `## Execution Protocol (11 Steps)` — full protocol with code blocks for dispatch (embed skip logic inline per step with "(MEDIUM/BIG only, skip for SMALL)" annotations, matching design-team's convention)
8. `## Cross-Review Checklist` — 5 concrete checks, contradiction routing
9. `## Question Budget Enforcement` — 15-question cap tracking
10. `## Information Flow` — inter-agent data dependencies (equivalent to design-team's Communication Patterns)
11. `## Resume Protocol` — check existing files, skip completed agents
12. `## Progress Steps` — 13 trackable steps

**Information Flow section (new — mirrors design-team's Communication Patterns):**
```
## Information Flow
PM writes requirements.md → BA reads it, deepens business rules
BA writes business-rules.md → UX reads it, designs flows around state machines
UX writes ux.md → uses PM's stories + BA's workflows
All three outputs → planning-team cross-review (Step 7)
All three outputs → requirements-reviewer (Step 8)
phase-1-summary.md → orchestrator Gate 1 question
research-context.md → design-team Phase 2 (appended, not overwritten)
```

**Progress Steps table (13 steps, kebab-case IDs):**

| # | Step ID | Name |
|---|---------|------|
| 1 | read-task-size | Parse dispatch prompt for task classification and spec directory |
| 2 | shared-research | Scan codebase for existing domain patterns, write research-context.md |
| 3 | dispatch-pm | Dispatch product-manager (synchronous, user questions) |
| 4 | dispatch-ba | Dispatch business-analyst (synchronous, user questions) |
| 5 | dispatch-ux | Dispatch ux-researcher (synchronous, user questions, conditional on Frontend) |
| 6 | verify-outputs | Check all expected output files exist with substantive content |
| 7 | cross-review | Read all 3 files, flag contradictions, route fixes |
| 8 | dispatch-reviewer | Dispatch requirements-reviewer (independent fresh-context) |
| 9 | handle-critical | Route Critical findings to responsible agents, 1 retry max |
| 10 | generate-summary | Write phase-1-summary.md |
| 11 | report-to-orchestrator | Return files produced, review verdict, known issues |

Sub-steps: For steps 3-5, track question count per agent. For step 7, track contradictions found/resolved.

**Key dispatch patterns:**

Step 3 (PM dispatch):
```
Agent(
  subagent_type="project-orchestrator:product-manager",
  prompt="Write a complete PRD for: [ORIGINAL USER REQUEST].
          Task size: [SMALL/MEDIUM/BIG].
          Read .claude/specs/[feature]/project-config.md for tech stack.
          Do NOT ask about tech stack, auth strategy, CI/CD, or infrastructure — those decisions are final in project-config.md.
          Read .claude/specs/[feature]/research-context.md for codebase patterns (if exists).
          [IF BIG: Also read .claude/specs/[feature]/brainstorm.md for scope decisions.]
          Run your adaptive requirements discovery, then output to .claude/specs/[feature]/requirements.md.
          After completing, report questions asked. Format: QUESTIONS_ASKED: [N]"
)
```

Step 4 (BA dispatch — synchronous, NOT background):
```
Agent(
  subagent_type="project-orchestrator:business-analyst",
  prompt="Read the PRD at .claude/specs/[feature]/requirements.md.
          Read .claude/specs/[feature]/research-context.md for existing business patterns (if exists).
          Deepen business logic — do NOT re-ask product questions PM already covered.
          Question budget remaining: [N]. Do not exceed [ceil(N/2)] questions.
          Output to .claude/specs/[feature]/business-rules.md"
)
```

Step 5 (UX dispatch — synchronous, NOT background, conditional on Frontend):
```
Agent(
  subagent_type="project-orchestrator:ux-researcher",
  prompt="Read the PRD at .claude/specs/[feature]/requirements.md.
          Read .claude/specs/[feature]/business-rules.md for state machines and workflows.
          Read .claude/specs/[feature]/research-context.md for existing UI patterns (if exists).
          Question budget remaining: [M]. Do not exceed [M] questions.
          Output to .claude/specs/[feature]/ux.md"
)
```

Step 8 (requirements-reviewer dispatch):
```
Agent(
  subagent_type="project-orchestrator:requirements-reviewer",
  prompt="Review all Phase 1 specs at .claude/specs/[feature]/:
          requirements.md, business-rules.md, ux.md.
          Also read project-config.md for context.
          Check for: user story completeness, cross-document consistency,
          persona-story alignment, business rule coverage, UX flow coverage,
          NFR completeness, scope boundaries.
          Write findings to .claude/specs/[feature]/requirements-review.md
          organized by severity: Critical / High / Medium / Low.
          Include a verdict: Approve / Approve with conditions / Request changes."
)
```

**Success criteria:** Planning-team dispatches PM/BA/UX sequentially, all AskUserQuestion calls surface to user, cross-review catches contradictions, requirements-reviewer validates specs.

### Phase 3: Update phase-1.md

**Files:** `skills/phase-runner/phases/phase-1.md`

Replace the entire dispatch section. Change from direct PM/BA/UX dispatch to single planning-team dispatch.

**New content:**
```markdown
# Phase 1: Planning

**Executor:** planning-team (single dispatch — manages PM, BA, UX internally)

## Preconditions
- `.claude/specs/[feature]/project-config.md` exists (Phase 0.5)
- For BIG: `.claude/specs/[feature]/brainstorm.md` exists (Phase 0.75)

## Dispatch Instructions

**Dispatch planning-team (synchronous):**

Agent(
  subagent_type="project-orchestrator:planning-team",
  prompt="Run Phase 1 Planning for: [ORIGINAL USER REQUEST].
          Task size: [SMALL/MEDIUM/BIG].
          Spec directory: .claude/specs/[feature]/.
          [IF BIG: brainstorm.md exists at .claude/specs/[feature]/brainstorm.md]
          Follow your 11-step protocol. Return when complete."
)

## Expected Outputs
- `.claude/specs/[feature]/requirements.md`
- `.claude/specs/[feature]/business-rules.md` (MEDIUM/BIG only)
- `.claude/specs/[feature]/ux.md` (MEDIUM/BIG only, skip if Frontend: none)
- `.claude/specs/[feature]/research-context.md` (MEDIUM/BIG only)
- `.claude/specs/[feature]/requirements-review.md` (MEDIUM/BIG only)
- `.claude/specs/[feature]/phase-1-summary.md` (MEDIUM/BIG only)

## Content Validation
- `requirements.md` contains at least 2 user stories with acceptance criteria
- `requirements.md` does NOT contain `## Status: INCOMPLETE`
- `business-rules.md` is not empty (MEDIUM/BIG)
- `ux.md` is not empty (MEDIUM/BIG, unless Frontend: none)

## Conditional Logic
- None — always runs
```

**Success criteria:** Phase file is minimal — delegates everything to planning-team. Orchestrator reads it and dispatches one agent.

### Phase 4: Update orchestrator and CLAUDE.md references

**Files:**
- `agents/project-orchestrator.md` — Update Phase 1 line in pipeline comment, update Subagent Failure Detection table
- `CLAUDE.md` — Update pipeline dispatch model description

**Orchestrator changes:**
1. Pipeline comment line 66: `PHASE 1: Planning (PM → BA + UX)` → `PHASE 1: Planning — ALWAYS via planning-team (never individual PM/BA/UX)`
2. Subagent Failure Detection table (line 220): Phase 1 expected files add `research-context.md` (MEDIUM/BIG), `requirements-review.md` (MEDIUM/BIG), `phase-1-summary.md` (MEDIUM/BIG)

**CLAUDE.md changes:**
1. Pipeline dispatch model line 143: `Phase 1 (Planning): orchestrator dispatches specialist agents directly` → `Phase 1 (Planning): orchestrator dispatches planning-team (sequential coordinator)`

> **Research insight:** Do NOT label this "Agent Teams peer-to-peer" — planning-team uses sequential subagent dispatch without SendMessage. Reserve "Agent Teams peer-to-peer" for teams that actually use SendMessage (design-team, feature-team, quality-team, review-team).

**Orchestrator Gate 1 cascade update:**
3. "Request changes" handling (line 218): Update cascade rule from "if PM revises requirements.md, BA and UX MUST re-run" to "Re-dispatch planning-team with REVISION prompt. Planning-team handles internal cascade."

**Orchestrator failure detection conditional entries:**
4. Phase 1 expected files: `requirements.md` (all sizes), `business-rules.md` (MEDIUM/BIG), `ux.md` (MEDIUM/BIG, unless Frontend: none), `research-context.md` (MEDIUM/BIG), `requirements-review.md` (MEDIUM/BIG), `phase-1-summary.md` (MEDIUM/BIG)

**PM dispatch prompt strengthening:**
5. Add explicit tech-stack prohibition back to PM dispatch prompt: "Do NOT ask about tech stack, auth strategy, CI/CD, or infrastructure — those decisions are final in project-config.md."

**Success criteria:** References are consistent. Orchestrator verifies new output files. Gate 1 cascade routes through planning-team.

### Phase 5: Fix add-feature.md (critical — same bug)

**Files:** `commands/add-feature.md`

> **Research insight (agent-native-reviewer):** The `/add-feature` command has the exact same `run_in_background=True` bug for BA and UX dispatch in Wave 2 (lines 97-125). This is a functional bug that would persist even after the planning-team fix.

**Fix:** Route Wave 2 BA/UX dispatch through planning-team (preferred for consistency), or at minimum change `run_in_background=True` to synchronous dispatch.

### Phase 6: Update 9 additional files with stale references

**Files discovered by agent-native-reviewer that reference the old Phase 1 dispatch model:**

| File | What to update |
|------|---------------|
| `commands/new.md` (lines 19, 29) | Change "dispatches product-manager" → "dispatches planning-team" |
| `commands/build-feature.md` (line 20) | Change "Planning: product-manager, business-analyst, ux-researcher" → "Planning: planning-team" |
| `commands/check-teams.md` (lines 32, 78-81, 126) | Update Phase 1 mapping to show planning-team. Update member count from 7 to 4 |
| `commands/check-agents.md` (lines 22, 65) | Update planning category and planning-team membership |
| `commands/agent-debug.md` (lines 105-108, 188-189) | Update example output to show sequential dispatch via planning-team |
| `commands/logs.md` (lines 28, 32) | Update example to show planning-team as Phase 1 entry |
| `skills/phase-runner/SKILL.md` (line 40) | Change `Planning (PM → BA + UX)` → `Planning (via planning-team)` |
| `hooks/phase-validator.sh` (lines 21-23) | Add `AGENT_PHASE_MAP[planning-team]="1"` |
| `validate-plugin.sh` (line 186) | Add `requirements-reviewer` to write-tool check list |

### Phase 7: Update design-team.md for research-context.md append

**Files:** `agents/design-team.md`

> **Research insight (architecture-strategist):** The plan states Phase 2 should append to research-context.md rather than overwrite, but no implementation phase updates design-team to do this.

**Fix:** Update design-team Step 2 to check for existing research-context.md and append under a `## Phase 2 — Design Patterns` header rather than overwriting. Planning-team writes under `## Phase 1 — Domain Patterns`.

### Phase 8: Minor updates to PM, BA, UX agents

**Files:**
- `agents/product-manager.md` — Ensure Step 0 reads `research-context.md` if it exists
- `agents/business-analyst.md` — Ensure Step 0 reads `research-context.md` if it exists. Add checkpointing protocol (INCOMPLETE status).
- `agents/ux-researcher.md` — Ensure Step 0 reads `research-context.md` and `business-rules.md`

These are minor additions — the agents' core question protocols and working protocols remain unchanged.

**PM addition to Step 0:**
```
5. **Research context** — If `.claude/specs/[feature]/research-context.md` exists (written by planning-team), read it for codebase patterns and institutional learnings. Use these to make your questions more targeted.
```

**BA addition:**
```
### Checkpointing (prevent incomplete specs)
If you are running low on turns, immediately write whatever you have to `.claude/specs/{feature}/business-rules.md` with a `## Status: INCOMPLETE — resume from [section]` header.
```

**UX addition to Step 0:**
```
Also read `.claude/specs/[feature]/business-rules.md` for state machines and workflows that need UI representation.
```

**Success criteria:** Agents read new inputs but their existing protocols are untouched.

## Alternative Approaches Considered

1. **Keep direct dispatch, fix prompts only.** Would not solve the `run_in_background` problem — AskUserQuestion calls would still be lost for BA and UX. Rejected.

2. **Add SendMessage to PM/BA/UX for peer review.** Research showed SendMessage is a runtime enhancement, not a tool declaration. Adding it to tool lists has no effect. Agents would need the Agent Teams experimental flag enabled. Rejected in favor of planning-team performing cross-review itself.

3. **Create a new `requirements-team` instead of repurposing `planning-team`.** Would leave an orphaned agent. The existing planning-team is never dispatched by the main pipeline — repurposing is cleaner. Rejected.

4. **Run BA and UX in parallel when neither asks questions.** Adds conditional complexity for minimal time savings (~30 seconds). Sequential is simpler and guarantees UX always has BA's output. Rejected per YAGNI.

## Sources & References

### Origin

- **Brainstorm document:** [docs/brainstorms/2026-03-16-phase1-planning-team-brainstorm.md](docs/brainstorms/2026-03-16-phase1-planning-team-brainstorm.md) — Key decisions: repurpose existing planning-team, sequential dispatch, full design-team parity, add requirements-reviewer.

### Internal References

- Design-team protocol template: [agents/design-team.md](plugins/project-orchestrator/agents/design-team.md)
- Design-reviewer pattern for requirements-reviewer: [agents/design-reviewer.md](plugins/project-orchestrator/agents/design-reviewer.md)
- Current planning-team (rewrite target): [agents/planning-team.md](plugins/project-orchestrator/agents/planning-team.md)
- Phase 1 dispatch (update target): [skills/phase-runner/phases/phase-1.md](plugins/project-orchestrator/skills/phase-runner/phases/phase-1.md)
- PM adaptive discovery protocol: [agents/product-manager.md](plugins/project-orchestrator/agents/product-manager.md)
- Orchestrator pipeline: [agents/project-orchestrator.md](plugins/project-orchestrator/agents/project-orchestrator.md)
