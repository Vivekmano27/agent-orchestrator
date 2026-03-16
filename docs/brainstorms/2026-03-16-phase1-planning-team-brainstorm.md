# Brainstorm: Phase 1 Planning Team Overhaul

**Date:** 2026-03-16
**Status:** Ready for planning

## What We're Building

Repurpose the existing `planning-team` agent into a full Phase 1 coordinator — mirroring `design-team`'s structure for Phase 2. Currently, Phase 1 agents (product-manager, business-analyst, ux-researcher) are dispatched directly by the orchestrator as isolated subagents with no peer coordination and no reliable path for user questions (BA and UX run with `run_in_background=True`).

### The Two Problems Being Solved

1. **Agents don't ask the user enough questions.** BA and UX run in background, so their `AskUserQuestion` calls may never surface. PM asks questions but BA and UX auto-generate without meaningful user input.
2. **Agents don't coordinate with each other.** BA doesn't know what PM asked. UX doesn't build on BA's business rules. There's no shared research, no cross-review, no peer negotiation.

## Why This Approach

The `design-team` pattern (Phase 2) already solved the same coordination problem for design agents. It provides:
- Shared upfront research before any agent starts
- Sequential dispatch where dependencies require it
- SendMessage-based peer negotiation for alignment
- Cross-peer review to catch inconsistencies
- An independent reviewer step for quality
- SUMMARY.md generation for the orchestrator

Phase 1 has the **exact same coordination needs** — PM produces requirements that BA and UX consume, BA's business rules inform UX's flow design, and all three need user input that currently gets lost in background execution.

### Why not keep direct dispatch?

Direct dispatch works for simple, linear flows. But Phase 1 isn't simple:
- PM needs to ask 5-10 user questions before BA can start
- BA needs PM's output AND may need to ask 1-3 more questions
- UX needs PM's output AND BA's business rules AND may need design preference questions
- All three need to be cross-validated for consistency
- The user needs to actually see and answer every question

Running BA and UX in background with `run_in_background=True` breaks the question flow entirely.

## Key Decisions

1. **Repurpose existing `planning-team.md`** — don't create a new agent. The existing one covers Phases 1+2 but is never dispatched by the main pipeline. Transform it into a Phase 1-only coordinator.

2. **Sequential dispatch, NOT background** — PM → BA → UX runs sequentially so each agent's `AskUserQuestion` calls reach the user directly. No more `run_in_background=True` for agents that need user input.

3. **Full design-team parity** — shared research, SendMessage negotiation, cross-peer review, independent requirements-reviewer, SUMMARY.md generation. The planning-team gets the same 11-step structure.

4. **planning-team dispatched by orchestrator** — Phase 1 line in `phase-1.md` changes from "dispatch PM directly" to "dispatch planning-team". The orchestrator treats it exactly like it treats design-team for Phase 2.

## Proposed Architecture

### planning-team Execution Protocol (mirroring design-team)

```
STEP 1  — Read task size and spec directory
STEP 2  — Shared research (scan codebase for existing domain patterns)
STEP 3  — Write research-context.md and broadcast to team
STEP 4  — Dispatch product-manager FIRST (synchronous, asks user questions)
STEP 5  — Dispatch business-analyst (synchronous, asks user questions, reads PM output)
STEP 6  — Dispatch ux-researcher (synchronous, asks user questions, reads PM + BA output)
STEP 7  — Cross-peer review via SendMessage
           - PM reviews business-rules.md for PRD contradictions
           - BA reviews requirements.md for missing business rules
           - UX reviews both for missing user flows and interaction gaps
           - Each agent fixes their OWN file based on feedback
STEP 8  — Independent requirements review (requirements-reviewer agent)
           - Fresh-context reviewer validates: requirements completeness,
             story quality, cross-spec consistency, missing edge cases
           - Writes requirements-review.md with severity-classified findings
           - Critical issues routed back to responsible agent (1 retry max)
STEP 9  — Verify all output files exist with substantive content
STEP 10 — Generate SUMMARY.md (requirements overview for design-team)
STEP 11 — Report to orchestrator
```

### File Ownership Matrix

| Agent | Owns (writes to) | Does NOT touch |
|-------|-------------------|----------------|
| product-manager | requirements.md, feature_list.json | business-rules.md, ux.md |
| business-analyst | business-rules.md | requirements.md, ux.md |
| ux-researcher | ux.md | requirements.md, business-rules.md |

### Cross-Peer Review Assignments

| Reviewer | Reviews | Checks for |
|----------|---------|------------|
| product-manager | business-rules.md, ux.md | PRD contradictions, scope creep, missing features |
| business-analyst | requirements.md, ux.md | Missing business rules, undefined edge cases, state transitions |
| ux-researcher | requirements.md, business-rules.md | Missing user flows, interaction gaps, accessibility omissions |

### Communication Patterns (SendMessage)

- **PM → BA:** "Here are the entities and workflows I documented. Key ambiguities: [list]"
- **BA → UX:** "Here are the state machines and approval flows. Key transitions that need UI: [list]"
- **PM ↔ BA:** Negotiate entity naming, workflow boundaries
- **BA ↔ UX:** Negotiate state visualization, form validation rules
- **UX → PM:** "These user stories need more detail for UI design: [list]"

## Changes Required

### Files to Create

1. **`agents/requirements-reviewer.md`** — New agent. Independent reviewer for Phase 1 specs (mirrors design-reviewer for Phase 2). Validates requirements completeness, story quality, cross-spec consistency.

### Files to Modify

1. **`agents/planning-team.md`** — Full rewrite. Transform from standalone Phases 1+2 runner into Phase 1-only coordinator with design-team parity.
2. **`skills/phase-runner/phases/phase-1.md`** — Change dispatch from direct PM/BA/UX to single `planning-team` dispatch.
3. **`agents/project-orchestrator.md`** — Update Phase 1 line to reference planning-team. Update CLAUDE.md pipeline description.
4. **`agents/product-manager.md`** — Add SendMessage to tools. No major logic changes (already has good question protocol).
5. **`agents/business-analyst.md`** — Add SendMessage to tools. Ensure it reads research-context.md.
6. **`agents/ux-researcher.md`** — Add SendMessage to tools. Ensure it reads BA output before starting.

### Files NOT Changed

- `agents/design-team.md` — untouched
- All Phase 2+ agents — untouched
- The orchestrator's overall pipeline structure — untouched (just Phase 1 dispatch changes)

## Scope Boundaries

### In Scope
- Repurpose planning-team as Phase 1 coordinator
- Create requirements-reviewer agent
- Add SendMessage to PM, BA, UX tools
- Sequential dispatch (no background) for user questions
- Cross-peer review step
- Independent requirements review step
- Shared research step
- Update phase-1.md dispatch instructions
- Update orchestrator Phase 1 reference

### Out of Scope
- Changing the question content/protocol of PM, BA, or UX (those are already well-designed)
- Adding new Phase 1 agents
- Changing Phase 2+ behavior
- Changing approval gate structure

## Open Questions

None — all resolved during brainstorm.
