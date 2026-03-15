# Brainstorm: Pre-Design Research + 3-Layer Review for Design Team

**Date:** 2026-03-15
**Status:** Draft
**Scope:** Enhance design-team with shared research step + self-review + cross-peer review + external design review

---

## What We're Building

### Problem
The design-team currently jumps straight into designing specs without researching what already exists in the target codebase or checking external best practices. Additionally, after agents finish designing, there's only a limited cross-review (parity check + consistency check). There's no self-review, no peer debate of each other's specs, and no external design quality gate.

### Solution
Two enhancements to the design-team flow:

1. **Pre-design research** — a shared research step (Step 1) that scans the existing codebase, checks `docs/solutions/` for prior learnings, and looks up external best practices. Produces `research-context.md` that all design agents read. Each agent also does its own domain-specific research before designing.

2. **3-layer review** — after design completes, three sequential review layers:
   - **Self-review** (Step 4): each agent re-reads and fixes its own spec
   - **Cross-peer review** (Step 5): agents review EACH OTHER's specs via SendMessage, debate findings, fix issues
   - **External design review** (Step 6): a dedicated design-reviewer agent reads all 5 specs and checks for production-readiness, security, performance, and cross-spec alignment

---

## Why This Approach

### Research before design
- Designs that ignore existing codebase patterns produce specs that conflict with what's already built
- Designs without external best practices reinvent patterns that frameworks already solve
- Prior solutions in `docs/solutions/` contain hard-won lessons; ignoring them means repeating past mistakes
- system-architect already has a "Pre-Design Research" section — this extends that to ALL agents and adds a shared foundation

### Sequential 3-layer review (Approach A) over parallel or integrated
- **Self-review first** catches obvious issues (incomplete sections, leftover TODOs, missing requirements coverage) before peers waste time reviewing drafts
- **Cross-peer review second** catches inter-spec conflicts that self-review can't see (api-architect reviews schema.md, database-architect reviews api-spec.md). The SendMessage debate means agents defend their decisions and reach consensus.
- **External design review last** catches systemic issues that insiders miss (security gaps, performance bottlenecks, production-readiness gaps). Running after peer review means the external reviewer sees the best version of the specs.
- Sequential ordering ensures each layer benefits from the previous layer's fixes.

---

## Key Decisions

### Decision 1: Shared research step produces research-context.md
- **What:** A research agent scans the target codebase, checks `docs/solutions/`, and looks up framework best practices
- **Output:** `.claude/specs/[feature]/research-context.md`
- **Who reads it:** ALL design agents (system-architect, api-architect, database-architect, ui-designer, agent-native-designer)
- **When:** Before system-architect starts (new Step 1, before current Step 2)

### Decision 2: Each agent also does domain-specific research
- system-architect: researches infrastructure patterns, existing service topology
- api-architect: researches existing API patterns in codebase, NestJS conventions
- database-architect: researches existing schema, PostgreSQL indexing patterns
- ui-designer: researches existing component patterns, design system conventions
- agent-native-designer: researches existing agent/tool patterns (if any)
- This happens at the START of each agent's design work, not as a separate step

### Decision 3: Self-review built into each agent's protocol
- After writing the spec, each agent re-reads it against a checklist
- Checks: completeness, no TODOs, covers all requirements, consistent naming, production-ready
- Fixes issues in own file before signaling DONE
- Messages team: "Self-review done, fixed [X issues]"

### Decision 4: Cross-peer review via SendMessage
- api-architect reviews schema.md (are entity names consistent? does schema support all endpoints?)
- database-architect reviews api-spec.md (are queries feasible? missing indexes?)
- ui-designer reviews api-spec.md (do response shapes match component data needs?)
- agent-native-designer reviews all 3 (parity coverage, CRUD completeness)
- Agents debate findings via SendMessage and fix their own files based on feedback
- This replaces the current Step 4 cross-review (which was limited to parity + consistency)

### Decision 5: External design-reviewer agent
- A NEW agent that reads ALL 5 spec files after peer review completes
- Checks for: production-readiness, security considerations, performance bottlenecks, architectural alignment, cross-spec inconsistencies
- Writes `design-review.md` with findings organized by severity (Critical/High/Medium/Low)
- **BLOCKS** pipeline if Critical issues found — design-team must fix before returning to orchestrator
- This is analogous to review-team's role in Phase 6, but for design specs instead of code

### Decision 6: New design-team flow (10 steps)

```
STEP 1:  Shared Research → research-context.md (NEW)
STEP 2:  system-architect (+ own research) → architecture.md
STEP 3:  4 agents parallel (+ own research, + SendMessage) → specs
STEP 4:  Self-review — each agent checks own spec (NEW)
STEP 5:  Cross-peer review — agents review each other via SendMessage (NEW)
STEP 6:  Design review agent — external quality gate (NEW)
STEP 7:  Handle Critical issues from design-review.md (NEW, conditional)
STEP 8:  Verify all output files exist
STEP 9:  Generate SUMMARY.md
STEP 10: Return to orchestrator
```

---

## What Needs to Be Created/Modified

### New
- **Research step instructions** in design-team.md (Step 1)
- **Self-review checklist** added to each design agent's instructions
- **Cross-peer review protocol** in design-team.md (Step 5)
- **design-reviewer agent** — new agent definition (`agents/design-reviewer.md`)

### Modified
- **design-team.md** — restructured from 7 steps to 10 steps
- **system-architect.md** — add instruction to read research-context.md
- **api-architect.md** — add self-review checklist + read research-context.md
- **database-architect.md** — add self-review checklist + read research-context.md
- **ui-designer.md** — add self-review checklist + read research-context.md
- **agent-native-designer.md** — add self-review checklist + read research-context.md
- **validate-plugin.sh** — update agent count from 26 to 27

---

## Open Questions

None — all key decisions resolved through brainstorm dialogue.

---

## Next Steps

1. Run `/ce:plan` to create implementation plan
2. Create design-reviewer agent definition
3. Update design-team.md with 10-step protocol
4. Add self-review checklists to all 5 design agents
5. Add research-context.md instructions to design-team Step 1
