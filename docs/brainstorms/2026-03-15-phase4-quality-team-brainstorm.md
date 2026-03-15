# Brainstorm: Phase 4 Quality-Team Redesign

**Date:** 2026-03-15
**Status:** Decided
**Next:** `/ce:plan` to implement

---

## What We're Building

Redesign Phase 4 (Testing) to use a **quality-team** Agent Teams wrapper — matching the pattern used by Phase 3 (feature-team) and Phase 6 (review-team). This adds structured test planning, coordinated execution, structured reporting, and smart fix routing.

### Current Problems

| Problem | Impact |
|---|---|
| No `quality-team.md` — agents dispatched in isolation | No coordination, E2E test overlap between test-engineer and qa-automation |
| No `test-plan.md` written to specs | Orchestrator can't review test strategy; no traceability |
| No `test-report.md` or structured coverage report | Orchestrator parses free-text returns — fragile and unverifiable |
| Phase 4 missing from subagent failure detection | Orchestrator has no way to verify Phase 4 completed |
| Coverage thresholds hardcoded in 2 places | test-engineer.md AND run-tests.md define same values — no single source of truth |
| Feedback loop bypasses feature-team | Phase 4→3 fixes lose file ownership enforcement and commit policy |
| No mechanism to fix broken tests | Only implementation agents get re-dispatched; broken test code can't be auto-fixed |

---

## Why This Approach

**Approach A: Full Quality-Team with Plan→Execute→Report Pipeline** was selected over two alternatives:

- **Approach B (Lightweight):** Same team but no approval gate — rejected because user wants visibility into test strategy for ALL task sizes.
- **Approach C (Independent + Files):** No team agent, just add structured files — rejected because it doesn't solve E2E overlap or agent coordination.

**Rationale:** Phase 3 and Phase 6 both benefit from Agent Teams coordination. Phase 4 has the same multi-agent coordination needs (scope assignment, overlap prevention, structured output) but lacks the pattern. Adding quality-team makes all verification phases consistent.

---

## Key Decisions

### 1. Create `quality-team.md` Agent Teams wrapper
- Wraps test-engineer + qa-automation
- Assigns clear scopes via SendMessage coordination:
  - **test-engineer:** unit tests, integration tests, contract tests, security tests, UAT, accessibility, performance
  - **qa-automation:** E2E (Playwright web + Flutter integration), visual regression, cross-browser/cross-device
- Eliminates E2E overlap — qa-automation OWNS all E2E, test-engineer does NOT write Playwright tests

### 2. Write `test-plan.md` BEFORE running tests
- quality-team creates `.claude/specs/[feature]/test-plan.md` with:
  - Test scope per agent (what each agent will test)
  - Coverage targets per service (read from project-config.md)
  - Test data strategy
  - Which test levels apply (based on task size)
  - Risk-based prioritization (HIGH risk tasks get deeper testing)
- **Approval gate for ALL task sizes** — user reviews test plan before execution
  - Gate 3.5 (new gate between Phase 3 and Phase 4 execution)
  - Options: "Approve — run tests", "Modify test plan", "Skip testing (not recommended)"

### 3. Write `test-report.md` + collect coverage artifacts
- After tests run, quality-team writes `.claude/specs/[feature]/test-report.md` with:
  - Pass/fail table per service (structured, not free-text)
  - Coverage percentages per service
  - Failure details with file paths and error messages
  - Coverage delta (before vs after feature)
  - Recommendations (which services need more tests)
- Coverage artifacts collected to known locations (HTML + LCOV per service)
- Orchestrator verifies `test-report.md` exists in subagent failure detection

### 4. Centralize coverage thresholds in `project-config.md`
- project-config.md becomes single source of truth for coverage thresholds
- test-engineer, qa-automation, quality-team, and run-tests command all READ from project-config.md
- Default thresholds: 80% backend, 75% frontend/mobile (can be overridden per project)
- Remove hardcoded thresholds from test-engineer.md and run-tests.md

### 5. Phase 4→3 feedback loop goes through feature-team
- When implementation bugs are found, route fixes through feature-team (not directly to agents)
- Preserves: file ownership matrix, incremental commit policy, 60% internal coverage gate
- Max 2 round-trips before escalating to user

### 6. Smart fix routing: test bugs vs implementation bugs
- quality-team analyzes each failure to determine root cause:
  - **Implementation bug** (code doesn't match spec) → route through feature-team
  - **Test bug** (test assertion is wrong, flaky test) → re-dispatch test-engineer or qa-automation internally
- quality-team has 1 internal retry for test bugs before escalating

### 7. Add Phase 4 to subagent failure detection
- After Phase 4: verify `test-plan.md` AND `test-report.md` exist in `.claude/specs/[feature]/`
- If missing → Phase 4 considered failed

---

## New Phase 4 Flow

```
Phase 3 (Build) complete → Gate 3 approved
        │
        ▼
Orchestrator dispatches quality-team
        │
        ▼
quality-team creates test-plan.md
   (reads: requirements.md, architecture.md, api-contracts.md, tasks.md, project-config.md)
   (assigns scope to test-engineer vs qa-automation)
        │
        ▼
Gate 3.5: User reviews test-plan.md
   Options: "Approve — run tests" / "Modify test plan" / "Skip testing"
        │
        ▼
quality-team dispatches test-engineer + qa-automation (parallel via Agent Teams)
   test-engineer: unit, integration, contract, security, UAT, a11y, perf
   qa-automation: E2E (Playwright + Flutter), visual regression, cross-browser
   Agents coordinate via SendMessage (share test data fixtures, avoid overlap)
        │
        ▼
quality-team collects results, writes test-report.md + coverage artifacts
        │
        ├── All pass + coverage met ──→ Continue to Phase 5 (Security)
        │
        └── Failures found
                │
                ▼
        quality-team analyzes root cause
                │
                ├── Test bug → re-dispatch test agent internally (1 retry)
                │
                └── Impl bug → route through feature-team (Phase 4→3 loop)
                                │
                                ├── Fixed → re-run Phase 4 (quality-team)
                                │
                                └── 2 round-trips exhausted → escalate to user
```

---

## Spec Files — Phase 4 Outputs

| File | Written by | Contains |
|---|---|---|
| `test-plan.md` | quality-team (before execution) | Test scope, coverage targets, test levels, data strategy |
| `test-report.md` | quality-team (after execution) | Pass/fail table, coverage %, failure details, delta, recommendations |
| Coverage HTML/LCOV | test-engineer + qa-automation | Per-service coverage reports in standard locations |

---

## Changes Required

### New files to create
- `plugins/agent-orchestrator/agents/quality-team.md` — Agent Teams wrapper

### Files to modify
- `project-orchestrator.md` — Phase 4 dispatch (use quality-team), add Gate 3.5, add Phase 4 to failure detection
- `test-engineer.md` — Remove E2E scope (owned by qa-automation), read thresholds from project-config.md, remove hardcoded coverage configs
- `qa-automation.md` — Add structured report output, clarify E2E ownership
- `run-tests.md` — Read thresholds from project-config.md, remove hardcoded values
- `project-setup.md` — Add coverage threshold section to project-config.md template

### Resolved Questions
- *Should Phase 4 use Agent Teams?* → Yes, via quality-team.md
- *Who creates the test plan?* → quality-team creates test-plan.md reading from prior specs
- *Where are coverage reports?* → test-report.md in specs + HTML/LCOV in standard service paths
- *How are thresholds managed?* → Centralized in project-config.md
- *Who fixes broken tests?* → quality-team decides: test bug → test agent, impl bug → feature-team
- *Is there an approval gate?* → Yes, Gate 3.5 for all task sizes

---

## Open Questions

None — all questions resolved during brainstorm.
