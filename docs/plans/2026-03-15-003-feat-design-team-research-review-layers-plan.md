---
title: "feat: Add pre-design research and 3-layer review to design-team"
type: feat
status: completed
date: 2026-03-15
origin: docs/brainstorms/2026-03-15-design-team-research-review-brainstorm.md
deepened: 2026-03-15
---

# feat: Add Pre-Design Research and 3-Layer Review to Design-Team

## Enhancement Summary

**Deepened on:** 2026-03-15
**Research agents used:** architecture-strategist, code-simplicity-reviewer, pattern-recognition-specialist

### Key Improvements from Review
1. **Peer review matrix gaps fixed** — added `database-architect → architecture.md` and `api-architect → design.md` (architecture reviewer)
2. **Failure escalation path defined** — after 1 retry, escalate to user via AskUserQuestion (architecture reviewer)
3. **Scoped retry re-review** — design-reviewer retry verifies ONLY Critical issues, not full re-review (architecture reviewer)
4. **maxTurns increase** — design-team maxTurns 40 → 50 to handle 10-step protocol (architecture + pattern reviewers)
5. **Move external best practices** to system-architect (already has External Research Gate) — shared research focuses on codebase + solutions only (architecture reviewer)
6. **Verify skill references** — design-reviewer skills must resolve in validate-plugin.sh (pattern reviewer)

## Overview

Enhance the design-team with two capabilities:
1. **Pre-design research** — shared research step produces `research-context.md` (codebase patterns, prior solutions, best practices); each agent also does domain-specific research before designing
2. **3-layer sequential review** — self-review → cross-peer review (SendMessage) → external design-reviewer agent

The design-team flow grows from 7 steps to 10 steps (see brainstorm: docs/brainstorms/2026-03-15-design-team-research-review-brainstorm.md).

## Problem Statement

**Research gap:** Design agents currently jump straight into designing without knowing what already exists in the target codebase. Only system-architect has pre-design research (checks `docs/solutions/`, evaluates external research needs). The other 4 agents (api-architect, database-architect, ui-designer, agent-native-designer) have zero research capability — they design from scratch every time, potentially conflicting with existing patterns.

**Review gap:** The current cross-review (Step 4) is two of the original designers re-checking work — not independent fresh-context review. There's no self-review checklist, no peer debate of each other's specs, and no external quality gate that could block the pipeline on critical design issues.

## Proposed Solution

### New Design-Team Flow (10 Steps)

```
STEP 1:  Read task size and spec directory (unchanged)
STEP 2:  Shared Research → research-context.md (NEW)
STEP 3:  system-architect (+ own research) → architecture.md (was STEP 2)
STEP 4:  4 agents parallel (+ own research, + SendMessage) → specs (was STEP 3)
STEP 5:  Self-review — each agent checks own spec (NEW)
STEP 6:  Cross-peer review — agents review each other via SendMessage (NEW, replaces old STEP 4)
STEP 7:  Design review agent — external quality gate (NEW)
STEP 8:  Handle Critical issues from design-review.md (NEW, conditional)
STEP 9:  Verify files + generate SUMMARY.md (was STEPs 5-6)
STEP 10: Return to orchestrator (was STEP 7)
```

---

## Technical Approach

### Phase 1: Create design-reviewer agent

**File:** `plugins/project-orchestrator/agents/design-reviewer.md`

```yaml
---
name: design-reviewer
description: >
  Reviews design specs for production-readiness, cross-spec consistency, security gaps,
  and performance risks. Dispatched by design-team after peer review completes.
  Does NOT design specs — reviews them. Does NOT review code (use code-reviewer).
  Does NOT audit security implementation (use security-auditor).
tools: Read, Grep, Glob, Bash, Write, AskUserQuestion
model: opus
permissionMode: default
maxTurns: 20
skills:
  - system-architect
  - api-designer
  - database-designer
  - security-reviewer
---
```

**Design decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Model | `opus` | Must reason across 5+ spec files and catch architectural trade-off issues |
| permissionMode | `default` | Reviewer — read-only, does not modify specs (follows code-reviewer pattern) |
| Tools | Read, Grep, Glob, Bash, Write | Same as code-reviewer/performance-reviewer. Write is for `design-review.md` output |
| maxTurns | 20 | Consistent with code-reviewer (20) and performance-reviewer (20) |
| Skills | system-architect, api-designer, database-designer, security-reviewer | Needs broad domain knowledge to review across all spec types |

**Review checklist (agent body):**

1. **Architecture alignment** — do api-spec, schema, design all align with architecture.md decisions?
2. **API-schema consistency** — does every API endpoint have supporting schema? Entity naming consistent?
3. **Production readiness** — proper error handling, auth, rate limiting, monitoring, logging?
4. **Security review** — auth on every endpoint, no exposed internals, input validation specified?
5. **Performance risks** — N+1 query patterns in API design, missing indexes in schema, large payloads?
6. **Completeness** — every requirement has a spec, no orphan specs with no requirement backing
7. **Agent-native parity** (if agent-spec.md exists) — parity coverage %, CRUD completeness

**Output format:** `design-review.md` with severity-organized findings (Critical/High/Medium/Low) + pass/fail verdict + recommendation (Approve/Approve with conditions/Request changes).

**Critical issues BLOCK** — design-team must fix before returning to orchestrator.

**Tasks:**
- [ ] Create `plugins/project-orchestrator/agents/design-reviewer.md`

**Estimated effort:** M

---

### Phase 2: Add shared research step to design-team

**File:** `plugins/project-orchestrator/agents/design-team.md`

**New STEP 2 — Shared Research:**

The design-team leader performs a codebase + solutions research pass before any agent starts designing:

```markdown
### STEP 2 — Shared Research (before design starts)

Research the target codebase and institutional learnings. Write findings to
`.claude/specs/[feature]/research-context.md` so all design agents start with shared context.

**2a — Codebase research:**
- Scan existing code for patterns relevant to this feature:
  - Existing API endpoint patterns (naming, auth, error handling)
  - Existing database schema conventions (naming, audit columns, soft delete)
  - Existing UI component patterns (folder structure, state management)
  - Existing agent/tool definitions (if any)
- Use Grep and Glob to find examples

**2b — Institutional learnings (if docs/solutions/ exists):**
- Glob `docs/solutions/**/*.md`
- Scan frontmatter (title, category, tags) for relevance to this feature
- Include relevant learnings as "Prior Solutions" in research-context.md

**2c — Write research-context.md (skip external best practices — system-architect's External Research Gate handles that):**

Write `.claude/specs/[feature]/research-context.md` with:
- Existing codebase patterns found (with file paths)
- Prior solutions applicable (with references to docs/solutions/ files)
- External best practices (BIG tasks only)
- Recommendations: "follow existing pattern at [path]" or "no existing pattern, design from scratch"

**2e — Broadcast to team:**
After writing research-context.md, message all team members:
"Research complete. Read .claude/specs/[feature]/research-context.md before starting design.
Key findings: [2-3 bullet summary]"
```

**Tasks:**
- [ ] Add STEP 2 (Shared Research) to design-team.md
- [ ] Renumber subsequent steps (current STEP 2 → STEP 3, etc.)

**Estimated effort:** M

---

### Phase 3: Add per-agent research instructions

**Files:** 4 design agent definitions

Each design agent gets a brief "Pre-Design Research" section added (mirroring what system-architect already has):

**api-architect.md — add:**
```markdown
## Pre-Design Research
Before designing, do a quick codebase scan:
1. Read research-context.md (if exists) for shared findings
2. Grep for existing API patterns: `Grep("@Controller|@ApiTags", type="ts")`
3. Check existing endpoint naming conventions
4. If docs/solutions/ has API-related learnings, apply them
```

**database-architect.md — add:**
```markdown
## Pre-Design Research
Before designing, scan existing schema:
1. Read research-context.md (if exists) for shared findings
2. Look for existing Prisma schema: `Glob("**/prisma/schema.prisma")`
3. Look for existing Django models: `Glob("**/models.py")`
4. Check existing naming conventions (table names, column names, index names)
5. If docs/solutions/ has schema-related learnings, apply them
```

**ui-designer.md — add:**
```markdown
## Pre-Design Research
Before designing, scan existing components:
1. Read research-context.md (if exists) for shared findings
2. Look for existing component patterns: `Glob("**/components/**/*.tsx")`
3. Check existing design tokens or Tailwind config: `Glob("**/tailwind.config.*")`
4. If docs/solutions/ has UI-related learnings, apply them
```

**agent-native-designer.md — add:**
```markdown
## Pre-Design Research
Before designing, scan for existing agent/tool patterns:
1. Read research-context.md (if exists) for shared findings
2. Look for existing agent definitions: `Glob("**/.claude/agents/*.md")`
3. Look for existing MCP tools: `Glob("**/mcp-*.ts")` or `Glob("**/tools/*.ts")`
4. If docs/solutions/ has agent-related learnings, apply them
```

**Note:** system-architect already has Pre-Design Research (lines 89-115). No change needed.

**Tasks:**
- [ ] Add Pre-Design Research section to api-architect.md
- [ ] Add Pre-Design Research section to database-architect.md
- [ ] Add Pre-Design Research section to ui-designer.md
- [ ] Add Pre-Design Research section to agent-native-designer.md

**Estimated effort:** S

---

### Phase 4: Add self-review checklists to design agents

**Files:** 5 design agent definitions

Each design agent gets a self-review checklist at the end of their instructions. This runs AFTER the agent writes its spec but BEFORE it signals "DONE" to the team.

**Universal self-review checklist (add to all 5 agents):**
```markdown
## Self-Review (BEFORE signaling DONE)
After writing your spec, re-read it and verify:
- [ ] Covers all relevant requirements from requirements.md
- [ ] No leftover TODOs, placeholders, or "[fill in]" markers
- [ ] Consistent naming throughout (entity names, field names, endpoint paths)
- [ ] Production-ready — not a prototype or placeholder design
- [ ] Matches conventions found in research-context.md (if exists)

After self-review, message the team: "Self-review done. Fixed [N] issues: [brief list]."
```

**Plus domain-specific items per agent:**

| Agent | Domain-specific self-review items |
|-------|----------------------------------|
| system-architect | ADRs have context + decision + consequences. Mermaid diagrams render correctly. |
| api-architect | Every endpoint has auth, error codes, request validation. Rate limits specified. OpenAPI-compatible. |
| database-architect | Every table has UUID PK, timestamps, soft delete. FK indexes created. Migration naming follows convention. |
| ui-designer | Every component has all 8 states. Design tokens defined. Interaction Inventory is complete. |
| agent-native-designer | Parity coverage calculated. Every entity has full CRUD tools. Implementation column filled in. |

**Tasks:**
- [ ] Add self-review checklist to system-architect.md
- [ ] Add self-review checklist to api-architect.md
- [ ] Add self-review checklist to database-architect.md
- [ ] Add self-review checklist to ui-designer.md
- [ ] Add self-review checklist to agent-native-designer.md

**Estimated effort:** S

---

### Phase 5: Add cross-peer review and design-reviewer steps to design-team

**File:** `plugins/project-orchestrator/agents/design-team.md`

Replace current Step 4 (cross-review) with the new 3-layer review (Steps 5-8):

**New STEP 5 — Self-review signal:**
```markdown
### STEP 5 — Wait for self-review completion
Each agent should have performed self-review and messaged "Self-review done."
If any agent did not self-review, ask them to do so before proceeding.
```

**New STEP 6 — Cross-peer review (SendMessage):**
```markdown
### STEP 6 — Cross-peer review via SendMessage (MEDIUM/BIG only, skip for SMALL)

Tell the team to review EACH OTHER's specs:

"Now review each other's specs. Each of you should read the specs listed
below and send feedback via message. Be specific — flag inconsistencies,
missing items, naming mismatches, and assumptions that don't hold.

Review assignments:
- api-architect: review schema.md + design.md — are entity names consistent? Do component data flows match endpoint response shapes?
- database-architect: review api-spec.md + architecture.md — does the schema support all endpoints? Are data ownership boundaries in architecture implementable?
- ui-designer: review api-spec.md — do response shapes match your component data needs? Pagination format correct?
- agent-native-designer: review api-spec.md + schema.md + design.md — parity coverage, CRUD completeness, missing tools
- system-architect: review api-spec.md + schema.md + design.md + agent-spec.md — cross-spec consistency with architecture decisions

After reviewing, send your findings to the spec owner. Discuss and resolve.
Each agent: fix issues in YOUR OWN file based on feedback received.
When resolved, message: 'Peer review complete, fixed [N] issues.'"

Wait for all agents to report peer review complete.
```

**New STEP 7 — Design review agent (external):**
```markdown
### STEP 7 — Design review agent (MEDIUM/BIG only, skip for SMALL)

Spawn the design-reviewer as an independent, fresh-context reviewer:

Agent(
  subagent_type="project-orchestrator:design-reviewer",
  prompt="Review all design specs at .claude/specs/[feature]/:
          architecture.md, api-spec.md, schema.md, design.md, agent-spec.md (if exists).
          Also read requirements.md and tech-stack.md for context.
          Check for: production-readiness, security gaps, performance risks,
          cross-spec consistency, completeness against requirements.
          Write findings to .claude/specs/[feature]/design-review.md
          organized by severity: Critical / High / Medium / Low.
          Include a verdict: Approve / Approve with conditions / Request changes."
)

Wait for completion.
```

**New STEP 8 — Handle Critical issues (conditional):**
```markdown
### STEP 8 — Handle Critical issues from design-review.md

Read .claude/specs/[feature]/design-review.md.

If verdict is "Request changes" with Critical issues:
  - Message the responsible agent(s) with the Critical findings
  - When a finding spans multiple agents, route to the agent whose file has the incorrect reference
  - Ask them to fix their spec files
  - Wait for fixes
  - Re-run design-reviewer with SCOPED prompt: "Verify ONLY these Critical issues have been resolved: [list]. Do not perform a full review." (1 retry max)

If retry still produces Critical issues (escalate to user):
  ```
  AskUserQuestion(
    question="Design review found Critical issues that could not be resolved after 1 retry: [issues]. How to proceed?",
    options=["Proceed with known issues (noted in SUMMARY.md)", "Let me fix manually", "Cancel"]
  )
  ```

If verdict is "Approve" or "Approve with conditions":
  - Proceed to STEP 9
  - Include conditions (if any) in SUMMARY.md
```

**Tasks:**
- [ ] Replace old Steps 4-7 with new Steps 5-10 in design-team.md
- [ ] Update step numbering throughout

**Estimated effort:** L

---

### Phase 6: Update validate-plugin.sh

**File:** `plugins/project-orchestrator/validate-plugin.sh`

Update agent count from 27 to 28 (adding design-reviewer).

**Tasks:**
- [ ] Update agent count check from 27 to 28

**Estimated effort:** S

---

## Acceptance Criteria

### Functional Requirements
- [ ] design-team Step 2 produces research-context.md with codebase patterns, prior solutions, and best practices
- [ ] All 5 design agents read research-context.md before designing
- [ ] Each design agent does domain-specific codebase research before designing
- [ ] Each design agent performs self-review before signaling DONE
- [ ] Cross-peer review happens via SendMessage — agents review each other's specs and fix issues
- [ ] design-reviewer agent reads all specs and produces design-review.md with severity-organized findings
- [ ] Critical issues in design-review.md BLOCK the pipeline — agents must fix before proceeding
- [ ] Design depth scaling: SMALL skips research + all review steps; MEDIUM/BIG runs full flow

### Non-Functional Requirements
- [ ] Research step adds < 2 minutes (codebase scan + docs/solutions/ lookup)
- [ ] Self-review adds < 1 minute per agent
- [ ] Cross-peer review adds ~3-5 minutes (SendMessage negotiation)
- [ ] Design-reviewer adds ~2-3 minutes
- [ ] Total Phase 2 overhead: ~8-11 minutes for MEDIUM/BIG tasks, 0 for SMALL
- [ ] design-team maxTurns increased from 40 to 50 (10-step protocol needs headroom)
- [ ] Agent count: 28 (was 27, adding design-reviewer)

### Quality Gates
- [ ] validate-plugin.sh passes with 28 agents, 64 skills
- [ ] design-reviewer description has negative routing
- [ ] design-reviewer skill references resolve (system-architect, api-designer, database-designer, security-reviewer)
- [ ] All design agents have self-review checklists
- [ ] design-team maxTurns updated to 50
- [ ] Peer review matrix includes architecture.md and design.md reviewers

---

## File Change Summary

| Action | File | Effort |
|--------|------|--------|
| **Create** | `plugins/project-orchestrator/agents/design-reviewer.md` | M |
| **Modify** | `plugins/project-orchestrator/agents/design-team.md` (restructure to 10 steps) | L |
| **Modify** | `plugins/project-orchestrator/agents/api-architect.md` (add research + self-review) | S |
| **Modify** | `plugins/project-orchestrator/agents/database-architect.md` (add research + self-review) | S |
| **Modify** | `plugins/project-orchestrator/agents/ui-designer.md` (add research + self-review) | S |
| **Modify** | `plugins/project-orchestrator/agents/agent-native-designer.md` (add research + self-review) | S |
| **Modify** | `plugins/project-orchestrator/agents/system-architect.md` (add self-review only — research already exists) | S |
| **Modify** | `plugins/project-orchestrator/validate-plugin.sh` (agent count 26 → 27) | S |

**Total: 1 new file, 7 modified files**

---

## Sources & References

### Origin
- **Brainstorm document:** [docs/brainstorms/2026-03-15-design-team-research-review-brainstorm.md](docs/brainstorms/2026-03-15-design-team-research-review-brainstorm.md) — Key decisions: shared research step + per-agent research, 3-layer sequential review (self → peer → external), design-reviewer agent

### Internal References
- system-architect Pre-Design Research: `plugins/project-orchestrator/agents/system-architect.md:89-115`
- review-team cross-review pattern: `plugins/project-orchestrator/agents/review-team.md`
- code-reviewer structure: `plugins/project-orchestrator/agents/code-reviewer.md` (tools, model, permissionMode template)
- design-team current protocol: `plugins/project-orchestrator/agents/design-team.md`
