# Phase 2.05: Spec Reconciliation

**Executor:** design-reviewer agent (subagent, foreground)

## Preconditions
- `.claude/specs/[feature]/architecture.md` exists (Phase 2)
- `.claude/specs/[feature]/api-spec.md` exists (Phase 2)
- `.claude/specs/[feature]/schema.md` exists (Phase 2)
- `.claude/specs/[feature]/design.md` exists (Phase 2, if frontend)

## Dispatch Instructions

**MANDATORY for ALL task sizes.** This phase catches spec contradictions before code is written.

```
Agent(
  subagent_type="project-orchestrator:design-reviewer",
  prompt="SPEC RECONCILIATION — verify all Phase 2 specs are consistent before implementation begins.
          Spec directory: .claude/specs/[feature]/

          Read ALL specs: architecture.md, api-spec.md, schema.md, design.md, agent-spec.md (if exists).
          Also read requirements.md and business-rules.md for completeness checks.

          Check for:
          1. CONTRADICTIONS — api-spec references entities/tables not in schema.md
          2. GAPS — user stories in requirements.md with no matching API endpoint
          3. NAMING MISMATCHES — entity called 'customer' in api-spec but 'user' in schema
          4. AUTH GAPS — endpoints missing auth requirements
          5. MISSING SCREENS — user flows in ux.md with no matching component in design.md

          For each issue found:
          - Classify severity: CRITICAL (blocks implementation) / HIGH (causes rework) / MEDIUM (inconsistency)
          - Identify which spec file(s) need updating
          - Recommend the fix

          Write findings to .claude/specs/[feature]/spec-reconciliation.md
          Use AskUserQuestion if you find CRITICAL issues that need user decision."
)
```

Wait for completion. Read findings.

**If CRITICAL or HIGH findings exist:**
Re-dispatch the affected design agent(s) to fix their specs:
```
Agent(
  subagent_type="project-orchestrator:[affected-agent]",
  prompt="SPEC FIX: The spec reconciliation found these issues in your output:
          [finding list from spec-reconciliation.md]
          Read your spec file at .claude/specs/[feature]/[spec-file].
          Fix the identified issues. Do NOT change anything else.
          Self-review before completing."
)
```

Repeat until no CRITICAL/HIGH findings remain (max 2 rounds, then escalate to user).

**If only MEDIUM or no findings:** Proceed to Phase 2.1.

## Expected Outputs
- `.claude/specs/[feature]/spec-reconciliation.md`

## Content Validation
- `spec-reconciliation.md` exists and contains a summary (even if "no issues found")
- No CRITICAL findings remain unresolved

## Conditional Logic
- Always runs — mandatory for ALL task sizes
