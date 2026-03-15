# Phase 2: Design — PRODUCTION-READY, via design-team

**Executor:** design-team agent (manages 5+ internal agents)

**CRITICAL: Phase 2 is ALWAYS dispatched to design-team. Never to individual architects.**

## Preconditions
- `.claude/specs/[feature]/requirements.md` exists (Phase 1)
- `.claude/specs/[feature]/business-rules.md` exists (Phase 1)
- `.claude/specs/[feature]/ux.md` exists (Phase 1)
- `.claude/specs/[feature]/project-config.md` exists (Phase 0.5)

## Dispatch Instructions

**2a. Read project-config.md to determine conditional agents:**
- If NO frontend AND NO mobile → tell design-team to skip ui-designer
- If user did NOT request agent-native features → tell design-team to skip agent-native-designer

**2b. Dispatch design-team (single dispatch — it manages internal sequencing):**
```
Agent(
  subagent_type="agent-orchestrator:design-team",
  prompt="Design PRODUCTION-READY specs for: [feature].
          Task size: [SMALL/MEDIUM/BIG].
          Spec directory: .claude/specs/[feature]/
          Input files already present: project-config.md, requirements.md, business-rules.md, ux.md
          Read project-config.md for tech stack, architecture, and infrastructure decisions.
          Expected outputs: architecture.md, api-spec.md, schema.md, design.md,
                           agent-spec.md (MEDIUM/BIG only), design-review.md (MEDIUM/BIG only), SUMMARY.md
          [IF no frontend AND no mobile]: Skip ui-designer — no UI components to design.
          [IF no agent-native features]: Skip agent-native-designer — no agent artifacts to design."
)
```

**2c. Wait for design-team to complete.**

## Expected Outputs
- `.claude/specs/[feature]/architecture.md` (all sizes)
- `.claude/specs/[feature]/api-spec.md` (all sizes)
- `.claude/specs/[feature]/schema.md` (all sizes — may say "UI-only, no DB")
- `.claude/specs/[feature]/design.md` (all sizes, if frontend/mobile in project-config)
- `.claude/specs/[feature]/agent-spec.md` (MEDIUM/BIG only, if agent-native)
- `.claude/specs/[feature]/design-review.md` (MEDIUM/BIG only)
- `.claude/specs/[feature]/SUMMARY.md`

## Content Validation

**api-spec.md:**
- Must define ≥3 endpoints with request/response shapes
- Must include HTTP methods and paths (not just descriptions)
- If fewer than 3 endpoints → re-dispatch design-team: "api-spec.md defines only [N] endpoints. A production API needs at least 3 (CRUD operations). Expand the API design."

**schema.md:**
- Must define ≥2 tables with columns, OR explicitly state "UI-only, no DB"
- Must include column types and constraints (not just table names)
- If only table names → re-dispatch: "schema.md lists tables but no columns or types. Add column definitions with types and constraints."

**design.md:**
- Must reference ≥3 UI components with props/data flows
- Must include an `## Interaction Inventory` section
- If missing Interaction Inventory → re-dispatch: "design.md is missing the Interaction Inventory section. Add it — list every user-initiated action."

**SUMMARY.md:**
- Must exist and contain sections for tech stack, features, architecture, endpoints, and components

If any validation fails → re-dispatch design-team with retry prompt including the specific gap (1 retry max).

## Conditional Logic
- Skip ui-designer if no frontend AND no mobile in project-config.md
- Skip agent-native-designer if no agent-native features requested
- Skip design-reviewer for SMALL tasks
