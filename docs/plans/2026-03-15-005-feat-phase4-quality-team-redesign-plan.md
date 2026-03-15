---
title: "feat: Phase 4 Quality-Team Redesign"
type: feat
status: completed
date: 2026-03-15
origin: docs/brainstorms/2026-03-15-phase4-quality-team-brainstorm.md
---

# Phase 4 Quality-Team Redesign

## Enhancement Summary

**Deepened on:** 2026-03-15
**Research agents used:** agent-native-architecture, best-practices-researcher, architecture-strategist, code-simplicity-reviewer, autonomous-loops

### Key Improvements
1. **Add feature-team.md "targeted fix" mode** — critical gap: Phase 4→3 routes through feature-team but feature-team has no concept of targeted fixes (will run full multi-wave protocol instead of surgical fix)
2. **Add stuck detection + regression detection** to Phase 4→3 loop — compare failure counts between iterations; if no progress (delta >= 0), escalate early instead of burning the second round-trip
3. **Expand failure classification to 4 categories** — add ENVIRONMENT_ISSUE (Docker/DB failures) and FLAKY_TEST (non-deterministic, quarantine) alongside TEST_BUG and IMPLEMENTATION_BUG
4. **Add "Not in Scope" section** to test-plan.md — IEEE 829 and ISTQB both consider this essential for preventing test agents from testing unchanged services
5. **Add coverage delta columns** (Before/After/Delta) to test-report.md — Google testing best practice: delta matters more than absolute numbers
6. **Add context bridge for retry iterations** — on round-trip 2, include what was tried before and why it didn't work (autonomous-loops SHARED_TASK_NOTES pattern)

### New Considerations Discovered
- **Simplicity concern:** A full Agent Teams wrapper may be heavy for 2 agents — the justification should be separation of concerns (coordinator logic), not pattern matching
- **Gate 3.5 tension:** SMALL tasks are defined as "no gates" but user chose Gate 3.5 for ALL sizes — consider adding `test-plan-approval` config option in project-config.md
- **feature-team.md is a missing file change** — the plan routes fixes through feature-team but doesn't modify it to handle targeted fixes
- **Flaky test detection** is an industry standard (Slack reduced flaky-caused CI failures from 56% to 3.8%) — quality-team should track and quarantine flaky tests

## Overview

Redesign Phase 4 (Testing) to use a **quality-team** Agent Teams wrapper — matching the established pattern of Phase 3 (feature-team) and Phase 6 (review-team). This adds structured test planning with user approval, coordinated test execution without E2E overlap, structured reporting with coverage artifacts, and smart failure routing (test bugs vs implementation bugs).

## Problem Statement

Phase 4 currently dispatches test-engineer and qa-automation as **independent parallel subagents** with no coordination. This creates 7 problems identified in the brainstorm (see brainstorm: `docs/brainstorms/2026-03-15-phase4-quality-team-brainstorm.md`):

1. No team coordination — agents overlap on E2E tests
2. No `test-plan.md` — test strategy is invisible to user and orchestrator
3. No `test-report.md` — orchestrator parses fragile free-text agent returns
4. Phase 4 missing from subagent failure detection
5. Coverage thresholds hardcoded in 2 places (test-engineer.md + run-tests.md)
6. Phase 4→3 feedback loop bypasses feature-team (loses file ownership)
7. No mechanism to fix broken test code (only implementation agents re-dispatched)

## Proposed Solution

Create `quality-team.md` as a 3-tier Agent Teams wrapper that follows the Plan→Execute→Report pipeline:

```
Orchestrator → quality-team → test-engineer + qa-automation
                    │
                    ├── Creates test-plan.md (before execution)
                    ├── Gate 3.5: User approves test plan
                    ├── Dispatches agents (parallel via Agent Teams)
                    ├── Collects results → test-report.md (after execution)
                    └── Analyzes failures → routes fixes (test bug vs impl bug)
```

## Technical Approach

### Architecture

Phase 4 moves from 2-tier (orchestrator → agents) to 3-tier (orchestrator → quality-team → agents), matching Phases 3 and 6:

| Phase | Before | After |
|---|---|---|
| Phase 3 (Build) | feature-team (3-tier) | No change |
| Phase 4 (Testing) | Direct dispatch (2-tier) | **quality-team (3-tier)** |
| Phase 5 (Security) | Direct dispatch (2-tier) | No change |
| Phase 6 (Review) | review-team (3-tier) | No change |

Security (Phase 5) remains standalone — the brainstorm explicitly rejected merging it into quality-team (see brainstorm: rejected approach B).

### Implementation Phases

#### Phase 1: Foundation — project-config.md Coverage Thresholds

**Files:** `plugins/project-orchestrator/agents/project-setup.md`

Expand the single `Coverage Target` field in the project-config.md template to per-service thresholds.

**Replace** (in the `## Testing` section of the project-config.md template):
```markdown
- **Coverage Target:** [60% / 70% / 80% / 90%]
```

**With:**
```markdown
### Coverage Thresholds (per service type)
| Service Type | Threshold | Applies To |
|---|---|---|
| Backend | 80% | NestJS, Django, Spring Boot, Go, Rails |
| Frontend | 75% | React, Vue, Angular, Next.js, Svelte |
| Mobile | 75% | Flutter, KMP, React Native, SwiftUI |
| AI/ML | 80% | Python AI services, ML pipelines |
| Shared/Libraries | 80% | Shared modules, SDK packages |

Coverage measures **new code** (lines added/modified by feature), not overall codebase.
Coverage delta: If overall coverage drops by > 0.1% on any service, flag as regression.
```

Also update the presets (Startup Lean, SaaS Standard, Enterprise Microservices) to include per-service thresholds instead of a single number.

**Success criteria:** project-config.md template has per-service coverage thresholds that all downstream agents can parse.

---

#### Phase 2: Create quality-team.md

**Files:** `plugins/project-orchestrator/agents/quality-team.md` (NEW)

Create the Agent Teams wrapper following the established pattern from feature-team.md and review-team.md.

**Frontmatter:**
```yaml
---
name: quality-team
description: "Agent team for Phase 4 Testing. Coordinates test-engineer and qa-automation via Agent Teams. Creates test-plan.md, presents Gate 3.5, dispatches agents in parallel, writes test-report.md, and routes failures (test bugs internally, impl bugs through feature-team)."
tools: Agent, Read, Write, Edit, Bash, Grep, Glob, TaskOutput, AskUserQuestion
model: opus
maxTurns: 50
permissionMode: acceptEdits
---
```

**Key sections to include:**

**1. Team Composition**
```
quality-team (you — orchestrator/leader)
├── test-engineer  → unit, integration, contract, security, UAT, a11y, performance, API E2E
└── qa-automation  → browser E2E (Playwright), mobile E2E (Flutter integration), visual regression, cross-browser
```

**Scope ownership (eliminates E2E overlap):**

| Test Type | Owner | Rationale |
|---|---|---|
| Unit tests | test-engineer | Per-service, framework-specific |
| Integration tests | test-engineer | Cross-service with Docker Compose |
| Contract tests (Pact) | test-engineer | Consumer/provider verification |
| API E2E (Supertest/httpx) | test-engineer | Full request lifecycle, not browser-based |
| Security tests | test-engineer | OWASP, injection, auth, dependencies |
| UAT scenarios | test-engineer | Step-by-step acceptance validation |
| Accessibility | test-engineer | axe-core, WCAG compliance |
| Performance | test-engineer | k6, Lighthouse, query analysis |
| Browser E2E (Playwright) | qa-automation | Web user flows across browsers |
| Mobile E2E (Flutter/KMP) | qa-automation | Flutter integration_test, KMP UI tests |
| Visual regression | qa-automation | Screenshot comparison baselines |
| Cross-browser/device | qa-automation | Chrome, Firefox, Safari, mobile viewports |

**2. Step-by-Step Execution**

**STEP 1 — Create test-plan.md**
Read these spec files from `.claude/specs/[feature]/`:
- `requirements.md` — what to validate (user stories, acceptance criteria)
- `architecture.md` — service boundaries, integration points
- `api-contracts.md` — actual API routes and shapes (optional — may not exist for frontend-only features)
- `api-spec.md` — fallback if api-contracts.md missing
- `tasks.md` — what was implemented, which agents built what
- `project-config.md` — coverage thresholds, test frameworks, methodology

Read `task_size` from the orchestrator dispatch prompt. Apply test depth scaling:

| Task Size | test-engineer Levels | qa-automation Levels |
|---|---|---|
| SMALL | Unit + integration (changed files only) | Skip (no E2E for SMALL) |
| MEDIUM | Unit + integration + contract + API E2E | E2E for affected flows only |
| BIG | All 7 levels — full depth | Full E2E + visual regression + cross-browser |

Write `.claude/specs/[feature]/test-plan.md` with this structure:
```markdown
# Test Plan — [feature-name]

## Task Size: [SMALL/MEDIUM/BIG]

## Coverage Targets (from project-config.md)
| Service | Type | Threshold |
|---|---|---|
| [service-name] | [Backend/Frontend/Mobile] | [X]% |

## Not in Scope
- [Services/features NOT being tested — prevents agents from testing unchanged areas]
- [Explicitly excluded test types based on task size]

## Test Scope Assignment
### test-engineer
- Unit tests: [specific modules/services]
- Integration tests: [specific cross-service calls]
- API E2E: [specific API lifecycle flows]
- [other assigned levels]

### qa-automation
- Browser E2E flows:
  - [explicit flow 1: e.g., Login → Dashboard (Chrome, Firefox, Safari)]
  - [explicit flow 2: e.g., Create Order → Payment → Confirmation]
- Visual regression: [specific components]
- Mobile E2E: [specific mobile flows]

## Risk-Based Priorities
- HIGH: [tasks flagged by decomposer — get deeper testing]
- MEDIUM: [standard coverage]

## Test Data Strategy
- [fixtures, seed scripts, Docker Compose requirements]
```

### Research Insights (test-plan.md)

**IEEE 829 / ISTQB:** The "Not in Scope" section is essential — it prevents test agents from writing tests for unchanged services, which is the primary source of wasted effort in multi-agent testing.

**Explicit flow enumeration:** Assigning scope by test TYPE (unit vs E2E) prevents overlap at the type level, but two agents can still test the same LOGIN flow — one via API E2E, the other via browser E2E. Listing explicit flows in the scope assignment eliminates this last overlap vector.

**Allow emergent test discovery:** Include a note in the plan: "If during testing you discover additional areas that need tests beyond this plan, write them and include them in your report." This enables agents to find bugs the plan didn't anticipate.

**STEP 2 — Gate 3.5: User approves test plan**
```
AskUserQuestion(
  question="Test plan ready for [feature]:
  [N] test levels, coverage targets: [list from project-config.md].
  Scope: test-engineer=[summary], qa-automation=[summary].
  Approve to run tests?",
  options=["Approve — run tests", "Modify test plan", "Skip testing (not recommended)", "Cancel"]
)
```

**Gate 3.5 applies to ALL task sizes** (user decision — overrides the SMALL "no gates" default for testing visibility).

Handler for "Modify test plan": Ask for feedback via AskUserQuestion (free text), rewrite test-plan.md, re-present Gate 3.5.
Handler for "Skip testing": Proceed to Phase 5 with no test-report.md. Log warning.
Handler for "Cancel": Escalate to orchestrator's cancel handler.

**STEP 3 — Dispatch agents (parallel via Agent Teams)**

Agent Teams mode (when SendMessage available):
```
Agent(
  subagent_type="project-orchestrator:test-engineer",
  run_in_background=True,
  prompt="Execute testing per test-plan.md at .claude/specs/[feature]/test-plan.md.
  YOUR SCOPE: [assigned scope from test-plan.md].
  Coverage thresholds: [from project-config.md].
  Implementation files: [list from Phase 3 report].
  DO NOT write Playwright browser E2E or Flutter integration tests — qa-automation owns those.
  Return structured results: pass/fail per test suite, coverage % per service, failure details with file:line."
)

Agent(
  subagent_type="project-orchestrator:qa-automation",
  run_in_background=True,
  prompt="Execute E2E testing per test-plan.md at .claude/specs/[feature]/test-plan.md.
  YOUR SCOPE: [assigned scope from test-plan.md].
  Implementation files: [list from Phase 3 report].
  DO NOT write unit, integration, or API E2E tests — test-engineer owns those.
  Return structured results: pass/fail per browser/device, visual regression diffs, failure details with file:line."
)
```

**SendMessage coordination table:**

| Sender | Receiver | Message | Purpose |
|---|---|---|---|
| test-engineer | qa-automation | "Test data fixtures created at [paths]. Reuse for E2E." | Shared test data |
| qa-automation | test-engineer | "E2E for [flow] found bug at [file:line]. Consider unit test coverage." | Cross-pollination |
| test-engineer | quality-team | "DONE: [pass/fail summary, coverage per service]" | Completion signal |
| qa-automation | quality-team | "DONE: [pass/fail per browser, visual regression status]" | Completion signal |

Note: Scope confirmation messages are unnecessary — scope is already assigned in dispatch prompts and test-plan.md. SendMessage coordination is best-effort and additive; the fallback (subagent mode with scope in prompts) is sufficient for correctness.

**Fallback: Subagent Mode (when Agent Teams unavailable)**
If SendMessage is unavailable, dispatch both agents via `Agent(run_in_background=True)` with scope assignments embedded in prompts (from test-plan.md). No inter-agent messaging — scope enforcement is via prompt instructions only. This matches the fallback pattern in design-team.md.

**STEP 4 — Collect results and write test-report.md**

After both agents complete, parse their return messages and coverage artifacts from standard locations:

| Service | Coverage Report Location |
|---|---|
| NestJS Core | `services/core-service/coverage/` |
| NestJS Gateway | `services/api-gateway/coverage/` |
| Python AI | `services/ai-service/htmlcov/` + `coverage.lcov` |
| React Web | `apps/web/coverage/` |
| Flutter | `apps/mobile-flutter/coverage/html/` |
| KMP Shared | `apps/mobile-kmp/shared/build/reports/jacoco/` |

Write `.claude/specs/[feature]/test-report.md`:
```markdown
# Test Report — [feature-name]
## Round-trip: [0 = initial | 1 = first fix | 2 = second fix]

## Summary
| Metric | Value |
|---|---|
| Overall Status | PASS / FAIL |
| Total Tests | [N] |
| Passed | [N] |
| Failed | [N] |
| Skipped | [N] |
| Flaky (auto-detected) | [N] |
| Duration | [Xm Ys] |

## Coverage Per Service
| Service | Before | After | Delta | Threshold | Status |
|---|---|---|---|---|---|
| [service] | [X]% | [Y]% | +/-[Z]% | [T]% | PASS/FAIL |

## Failure Details (if any)
### [FAIL-001] [Test Name]
**File:** [path:line]
**Test file:** [test-path:line]
**Service:** [service-name]
**Error:** [error message]
**Classification:** IMPLEMENTATION_BUG / TEST_BUG / ENVIRONMENT_ISSUE / FLAKY_TEST
**Recommended Fix:** [description]

## Flaky Tests Detected
| Test | Flakiness Signal | Action |
|---|---|---|
| [test-name] | Passed on retry | Quarantine candidate |

## E2E Results (qa-automation)
| Browser/Device | Status | Flows Tested |
|---|---|---|
| Desktop Chrome | PASS/FAIL | [N] flows |

## Fix History (appended on each round-trip)
### Round-trip 1
- **Failures addressed:** [FAIL-001, FAIL-003]
- **Files changed:** [list]
- **Result:** [FAIL-001 resolved, FAIL-003 persists]
```

### Research Insights (test-report.md)

**Coverage delta (Google Testing Blog):** Focus on new code coverage and before/after comparison, not just absolute numbers. The Before/After/Delta columns make regressions immediately visible.

**Failure classification (4 categories — Parasoft, Slack Engineering):**

| Category | Signal | Action |
|---|---|---|
| IMPLEMENTATION_BUG | Test matches spec but code doesn't. Deterministic. | Route to feature-team |
| TEST_BUG | Test assertion wrong, setup issue. Code is correct. | Internal retry (1 max) |
| ENVIRONMENT_ISSUE | Docker/DB/network failure. Same test passes locally. | STOP and report |
| FLAKY_TEST | Passes and fails non-deterministically. | Quarantine, defer fix |

**Classification heuristic (when ambiguous):**
- Test was added in THIS feature run → lean TEST_BUG (test author error)
- Test existed before, now fails (regression) → lean IMPLEMENTATION_BUG
- If unsure → default to TEST_BUG (cheaper: 1 internal retry vs full feature-team round-trip)

**Fix History section (autonomous-loops pattern):** Accumulates across round-trips. On retry, feature-team sees what was already tried and what didn't work. Prevents repeating the same fix approach.

**Stable failure IDs (FAIL-001, FAIL-002):** Enable precise tracking across iterations — did the targeted failure actually get resolved?

**Flaky test detection (Slack Engineering):** Slack reduced flaky-caused CI failures from 56.76% to 3.85%. Tests that pass on retry should be flagged as FLAKY_TEST, not silently passed.

**STEP 5 — Analyze failures and route fixes**

If ALL tests pass and coverage meets thresholds → return test-report.md to orchestrator. Done.

If failures exist, classify each failure using the 4-category model:

| Classification | Signal | Action |
|---|---|---|
| **IMPLEMENTATION_BUG** | Test matches spec but code doesn't. Deterministic, reproducible. | Route to orchestrator for feature-team dispatch |
| **TEST_BUG** | Test assertion wrong, setup issue, stale selector. Code is correct. | Re-dispatch owning test agent internally (1 retry) |
| **ENVIRONMENT_ISSUE** | Docker/DB/network failure. Error contains ECONNREFUSED, timeout, ENOMEM. | STOP and report to orchestrator (do not retry) |
| **FLAKY_TEST** | Passed on retry. Non-deterministic across identical code. | Log in "Flaky Tests Detected" section. Quarantine candidate. Proceed. |

**Classification heuristic (when ambiguous):**
- Test was added in THIS feature run → lean **TEST_BUG** (test author error, cheaper to retry internally)
- Test existed before this feature, now fails (regression) → lean **IMPLEMENTATION_BUG**
- If still unsure after analysis → default to **TEST_BUG** (1 internal retry is cheaper than a full feature-team round-trip; if fix fails, retry exhaustion triggers reclassification)

**Handling mixed failures (both test bugs AND impl bugs in same run):**
1. Fix test bugs internally FIRST (quick — 1 retry per agent)
2. Verify test-bug fixes work (quick re-run of just those tests) before proceeding
3. After test bug fixes confirmed, route impl bugs to orchestrator for feature-team dispatch
4. Single re-run of Phase 4 after ALL fixes (both types) are resolved

**Test bug retry exhaustion (after 1 internal retry fails):**
```
AskUserQuestion(
  question="Test [test-name] still failing after 1 internal fix attempt.
  Error: [error]. File: [path:line].
  This appears to be a test code issue, not an implementation bug.",
  options=[
    "Let me fix manually — show me the failing test",
    "Reclassify as implementation bug (route to feature-team)",
    "Skip this test and proceed",
    "Cancel"
  ]
)
```

**STEP 6 — Report to orchestrator**

Return to orchestrator:
- Whether test-plan.md and test-report.md were written
- Overall pass/fail status
- Coverage summary per service
- List of failures with classifications (test bug vs impl bug)
- If impl bugs found: structured failure list for feature-team dispatch
- Recommendations

**3. STOP and Re-plan Policy**

If during test execution:
- Test infrastructure is fundamentally broken (Docker won't start, test DB unavailable)
- Discovered that Phase 3 implementation is architecturally flawed (not just bugs)
- Coverage is catastrophically low (< 30%) suggesting major implementation gaps

→ STOP. Report to orchestrator. Do NOT attempt to fix infrastructure or architectural issues.

---

#### Phase 3: Update project-orchestrator.md

**Files:** `plugins/project-orchestrator/agents/project-orchestrator.md`

**3a. Update pipeline architecture diagram** (around line 74-76)

Replace:
```
PHASE 4: TESTING (always)
  |-- test-engineer        -> unit, integration, E2E, security, UAT, a11y tests
  |-- qa-automation        -> Playwright E2E, visual regression, cross-browser
```

With:
```
PHASE 4: TESTING (always) — via quality-team (Agent Teams)
  |-- quality-team         -> test planning, execution coordination, reporting, fix routing
      |-- test-engineer    -> unit, integration, contract, security, UAT, a11y, perf, API E2E
      |-- qa-automation    -> browser E2E (Playwright), mobile E2E, visual regression, cross-browser
```

**3b. Replace Phase 4 dispatch** (lines 499-514)

Replace the two parallel Agent() calls with a single quality-team dispatch:
```
### Phase 4: Testing — via quality-team
quality-team creates test-plan.md, presents Gate 3.5 for approval, dispatches
test-engineer + qa-automation in parallel (Agent Teams), writes test-report.md,
and routes any failures (test bugs internally, impl bugs back through feature-team).

4a. Spawn quality-team:
```
Agent(
  subagent_type="project-orchestrator:quality-team",
  prompt="Run Phase 4 Testing for [feature].
  Task size: [SMALL/MEDIUM/BIG].
  Spec directory: .claude/specs/[feature]/
  Implementation report: [summary from Phase 3 feature-team].
  Files changed: [list].
  Coverage thresholds: Read from .claude/specs/[feature]/project-config.md.

  Steps:
  1. Create test-plan.md
  2. Present Gate 3.5 for user approval
  3. Dispatch test-engineer + qa-automation per plan
  4. Collect results, write test-report.md
  5. If failures: classify and route (test bugs internally, impl bugs report back)

  Return: test-report.md summary, overall status, impl bug list (if any)."
)
```
4b. Wait for quality-team to complete. Read its report.
4c. Verify `.claude/specs/[feature]/test-plan.md` AND `test-report.md` exist.
```

**3c. Add Gate 3.5 reference**

In the gates section, after Gate 3 and before Gate 4, add a note:
```
**Gate 3.5 — test plan approval (inside quality-team):**
quality-team presents Gate 3.5 internally. The orchestrator does NOT present this gate.
See quality-team.md STEP 2 for the gate format and handlers.
Gate 3.5 applies to ALL task sizes (user decision).
On Phase 4→3 re-runs, Gate 3.5 is SKIPPED (test plan unchanged, only code changed).
```

**3d. Update Phase 4→3 Feedback Loop** (lines 225-284)

Replace the current direct-dispatch mechanism with feature-team routing:

```
### Phase 4→3 Feedback Loop (Test Failure Recovery)
When quality-team reports implementation bugs:

**Step 1 — Read quality-team's impl bug list**
quality-team returns a structured list of impl bugs with: failing test, error, service, file path.

**Step 2 — Re-dispatch feature-team** (NOT individual agents)
```
Agent(
  subagent_type="project-orchestrator:feature-team",
  prompt="PHASE 4→3 FEEDBACK: Tests found implementation bugs.
  Feature: [feature-name]. Spec directory: .claude/specs/[feature]/

  FAILURES TO FIX:
  [structured failure list from quality-team's test-report.md]

  RULES:
  - Fix ONLY the identified failures — do not refactor unrelated code
  - Follow file ownership matrix — each agent fixes only its own files
  - Add/update tests to cover the fix
  - Run tests locally before marking done
  - Commit fixes as: fix(scope): [description]
  - This is a TARGETED FIX request, not a full re-implementation
  - Skip: task grouping from tasks.md, API contract drift check, agent-native passes
  - Dispatch ONLY agents whose files appear in the failure list

  CONTEXT BRIDGE (round-trip 2+ only):
  Previous fix attempt changed files [X, Y, Z] but tests [A, B] still fail with same errors.
  The previous approach of [summary from Fix History] did not work. Try a different approach.

  Previous test-report.md: .claude/specs/[feature]/test-report.md"
)
```

**Step 3 — Re-run Phase 4 (scoped)**
After feature-team completes, re-dispatch quality-team.
On re-runs: quality-team SKIPS test-plan.md creation and Gate 3.5.
Runs tests directly, writes updated test-report.md with incremented round-trip number.
Appends to "Fix History" section in test-report.md (what was tried, what resolved, what persists).

**Step 4 — Stuck detection + regression detection (BEFORE consuming next round-trip)**
After each re-test, compare the new test-report.md against the previous one:

| Condition | Signal | Action |
|---|---|---|
| Failure count decreased | PROGRESS | Continue loop (if under max round-trips) |
| Failure count unchanged (delta >= 0) | STUCK | Escalate to user immediately — do NOT consume next round-trip |
| New failures appeared (not in previous report) | REGRESSION | Hard stop. The fix made things worse. Escalate immediately. |
| Same tests failing with same errors | STUCK (same failures) | Escalate with context: "Previous fix changed [files] but [tests] still fail with identical errors." |

**Step 5 — Max retries**
- Allow **2 Phase 4→3 round-trips** maximum
- Stuck detection may terminate loop BEFORE max retries (saves tokens and time)
- If still failing after 2 loops → escalate to user:
  ```
  AskUserQuestion(
    question="Tests still failing after 2 fix attempts.
    Remaining failures: [list from test-report.md].
    Coverage: [X]% (target: [Y]%).",
    options=[
      "Let me fix manually — show me the failures",
      "Lower coverage threshold for this feature",
      "Skip failing tests and proceed (not recommended)",
      "Cancel feature"
    ]
  )
  ```
```

**3e. Add Phase 4 to subagent failure detection** (around line 298)

Insert after "After Phase 3" line:
```
**After Phase 4:** test-plan.md, test-report.md
```

**3f. Update Gate 4 to read from test-report.md**

Replace Gate 4's free-text coverage reference with:
```
AskUserQuestion(
  question="Testing + security + review complete.
  Coverage: [read from .claude/specs/[feature]/test-report.md].
  Security: [from security-audit.md]. Review: [from review-team report].
  Proceed to DevOps + deploy?",
  options=["Proceed to DevOps + docs", "Add a feature", "More testing needed", "Cancel"]
)
```

**3g. Update escalation rules**

Update the coverage escalation rule to reference project-config.md:
```
- If quality-team reports coverage below project-config.md thresholds → trigger Phase 4→3 Feedback Loop (max 2 round-trips)
```

**3h. Update pipeline dispatch model comment** (around line 90-96)

Update Phase 4 line:
```
- Phase 4 (Testing): orchestrator dispatches quality-team (Agent Teams peer-to-peer)
```

---

#### Phase 4: Update test-engineer.md

**Files:** `plugins/project-orchestrator/agents/test-engineer.md`

**4a. Update description** to reflect scoped role:
```
description: "Writes comprehensive tests across unit, integration, contract, API E2E, security, UAT, accessibility, and performance levels. Dispatched by quality-team with scope assignments from test-plan.md. Does NOT write browser E2E (Playwright) or mobile E2E (Flutter integration) — those are owned by qa-automation."
```

**4b. Remove E2E section from Test Levels**
Remove Section 3 "E2E Tests" (lines 76-83) that references Playwright and Flutter integration_test. Keep only the API E2E row if present.

Add clarification:
```
#### 3. API E2E Tests (NOT browser/mobile E2E)
| Platform | Framework | Scope |
|---|---|---|
| API | Supertest/httpx | Full request lifecycle through all services |

**Browser/mobile E2E is owned by qa-automation. Do NOT write Playwright or Flutter integration tests.**
```

**4c. Parameterize coverage configs** (lines 143-268)
Replace hardcoded threshold values with instructions to read from project-config.md:
```
## Coverage Enforcement Configs (MUST create these files)
Read coverage thresholds from `.claude/specs/[feature]/project-config.md` under "Coverage Thresholds" section.
Use the threshold for the service type (Backend=80%, Frontend=75%, Mobile=75% are defaults).
```

Keep the config FILE TEMPLATES (jest.config.ts, pyproject.toml, vitest.config.ts, etc.) but replace hardcoded numbers with `[read from project-config.md]` placeholders. The agent reads the actual values at runtime.

**4d. Update test strategy scaling table** (lines 38-48)
Add note: "When dispatched by quality-team, follow scope assignments from test-plan.md. The scaling table below is the DEFAULT — quality-team may override in test-plan.md."

**4e. Add structured return format**
Add section instructing test-engineer to return results in a parseable format:
```
## Return Format (for quality-team)
Return results as structured text that quality-team can parse:
- Pass/fail per test suite
- Coverage percentage per service
- Failure details: test name, file:line, error message, stack trace snippet
- Test data fixtures created (paths for qa-automation to reuse)
```

---

#### Phase 5: Update qa-automation.md

**Files:** `plugins/project-orchestrator/agents/qa-automation.md`

**5a. Update description** to clarify E2E ownership:
```
description: "Owns ALL browser and mobile E2E testing — Playwright (web), Flutter integration tests (mobile), visual regression, cross-browser/cross-device validation. Dispatched by quality-team with scope assignments from test-plan.md. Does NOT write unit, integration, API E2E, or other test types — those are owned by test-engineer."
```

**5b. Add structured return format:**
```
## Return Format (for quality-team)
Return results as structured text that quality-team can parse:
- Pass/fail per browser/device project
- E2E flows tested (list with pass/fail)
- Visual regression: components checked, diffs found
- Failure details: test name, file:line, error message, screenshot path
- Cross-browser matrix results
```

**5c. Add scope enforcement:**
```
## Scope (ENFORCE)
You own ONLY:
- Browser E2E tests (Playwright): web user flows across Chrome, Firefox, Safari, mobile viewports
- Mobile E2E tests (Flutter integration_test, KMP UI tests)
- Visual regression: screenshot baselines and comparison
- Cross-browser/cross-device validation

You do NOT write:
- Unit tests, integration tests, contract tests, API E2E tests (owned by test-engineer)
- Security tests, UAT scenarios, accessibility audits, performance tests (owned by test-engineer)
```

---

#### Phase 6: Update run-tests.md

**Files:** `plugins/project-orchestrator/commands/run-tests.md`

**6a. Replace hardcoded thresholds** (lines 11-19)
```
## Coverage Thresholds
Read from `.claude/specs/[feature]/project-config.md` under "Coverage Thresholds" section.
Defaults (if project-config.md not found):
| Service Type | Default |
|---|---|
| Backend | 80% |
| Frontend | 75% |
| Mobile | 75% |
```

**6b. Update feedback loop reference** (lines 109-119)
```
## Coverage Below Threshold → Phase 4→3 Feedback Loop
If any service is below threshold, the quality-team (or orchestrator if running standalone)
triggers the Phase 4→3 Feedback Loop through feature-team.
See project-orchestrator.md "Phase 4→3 Feedback Loop" section.
Max 2 round-trips before escalating to user.
```

---

## Alternative Approaches Considered

(see brainstorm: `docs/brainstorms/2026-03-15-phase4-quality-team-brainstorm.md`)

1. **Approach B (Lightweight Quality-Team):** Same team but no Gate 3.5 approval. Rejected — user wants visibility into test strategy for ALL task sizes.
2. **Approach C (Independent + Structured Files):** No team agent, just add files. Rejected — doesn't solve E2E overlap or agent coordination.
3. **Combine Phase 4+5 (quality-team + security-auditor):** Proposed in earlier brainstorm. Rejected — security remains standalone Phase 5.

## System-Wide Impact

### Interaction Graph
- Orchestrator dispatches quality-team (replaces 2 direct Agent() calls with 1)
- quality-team dispatches test-engineer + qa-automation (internal)
- On impl bug failure: orchestrator re-dispatches feature-team → feature-team dispatches implementation agents
- Gate 3.5 added to user interaction flow (all task sizes)
- Gate 4 now reads from test-report.md instead of free-text

### Error Propagation
- Test bug: quality-team → internal retry → escalate to user (1 retry max)
- Impl bug: quality-team → orchestrator → feature-team → quality-team re-run (2 round-trips max) → escalate to user
- Mixed: test bugs fixed first, then impl bugs routed, then single re-run
- Infrastructure failure: quality-team STOPs and reports to orchestrator

### State Lifecycle Risks
- test-plan.md written before execution — if quality-team crashes mid-execution, test-plan.md exists but test-report.md does not. Subagent failure detection catches this.
- On Phase 4→3 re-runs, test-report.md is OVERWRITTEN (not appended) with latest results
- Coverage artifacts in standard locations may be stale from Phase 3 internal testing — quality-team's test run overwrites them

### API Surface Parity
- project-orchestrator.md: Phase 4 dispatch changes
- CLAUDE.md: Pipeline dispatch model comment updated
- run-tests.md: Can still be used standalone (reads from project-config.md)
- Feature-team: No changes needed (already handles re-dispatch prompts)

## Acceptance Criteria

### Functional Requirements
- [ ] `quality-team.md` created with Agent Teams pattern (team composition, scope matrix, SendMessage table, fallback mode)
- [ ] quality-team creates `test-plan.md` in `.claude/specs/[feature]/` before test execution
- [ ] test-plan.md includes "Not in Scope" section and explicit flow enumeration per agent
- [ ] Gate 3.5 presented to user for ALL task sizes with approve/modify/skip/cancel options
- [ ] Gate 3.5 SKIPPED on Phase 4→3 re-runs (test plan unchanged)
- [ ] test-engineer and qa-automation have non-overlapping scopes (no E2E duplication)
- [ ] API E2E tests remain with test-engineer (only browser/mobile E2E to qa-automation)
- [ ] quality-team writes `test-report.md` in `.claude/specs/[feature]/` after test execution
- [ ] test-report.md has structured format: Before/After/Delta coverage, stable failure IDs, 4-category classification, Fix History, flaky test section
- [ ] 4-category failure classification: IMPLEMENTATION_BUG, TEST_BUG, ENVIRONMENT_ISSUE, FLAKY_TEST
- [ ] Classification heuristic: new test → lean TEST_BUG, regression → lean IMPLEMENTATION_BUG, unsure → default TEST_BUG
- [ ] Coverage thresholds read from `project-config.md` (single source of truth)
- [ ] Hardcoded thresholds removed from test-engineer.md and run-tests.md
- [ ] Coverage config templates in test-engineer.md parameterized (not deleted)
- [ ] project-config.md template expanded with per-service coverage thresholds
- [ ] Phase 4→3 feedback loop routes through feature-team (not direct to agents)
- [ ] **feature-team.md updated** with "targeted fix" mode (recognize PHASE 4→3 FEEDBACK prefix, skip full protocol)
- [ ] Smart fix routing: test bugs → internal retry (1 max), impl bugs → feature-team (2 round-trips max)
- [ ] Mixed failures: test bugs fixed first (verified), then impl bugs, then single re-run
- [ ] Test bug retry exhaustion escalates to user
- [ ] **Stuck detection**: failure count delta >= 0 → escalate early (don't burn next round-trip)
- [ ] **Regression detection**: new failures not in previous report → hard stop
- [ ] **Context bridge**: round-trip 2+ dispatch includes what was tried before and why it didn't work
- [ ] Phase 4 added to subagent failure detection (verify test-plan.md + test-report.md)
- [ ] Gate 4 updated to read from test-report.md
- [ ] Pipeline dispatch model comment updated for Phase 4
- [ ] Escalation rules reference project-config.md thresholds
- [ ] Agent Teams fallback mode documented in quality-team.md
- [ ] Child agents cap return messages at ~200 lines (full output in coverage artifact files)

### Quality Gates
- [ ] Validate plugin passes: `bash plugins/project-orchestrator/validate-plugin.sh`
- [ ] All agent files have consistent interaction rule block
- [ ] No hardcoded coverage thresholds remain in test-engineer.md or run-tests.md
- [ ] quality-team.md follows same structural pattern as feature-team.md and review-team.md

## Dependencies & Prerequisites

- Phase 3 coverage enforcement (Plan 004) may or may not be implemented. quality-team's 80% gate works independently — Phase 3's 60% gate is additive, not conflicting.
- Agent Teams experimental flag (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) — quality-team must work in both modes (Agent Teams + fallback subagent mode).

## Risk Analysis & Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Gate 3.5 for SMALL tasks adds friction | User annoyance on quick fixes | Gate is lightweight — test plan summary, single approve click. User explicitly chose this. |
| Agent Teams unavailable | No SendMessage coordination | Fallback mode: scope assignments in prompts, file-based coordination via test-plan.md |
| test-report.md parsing fragile | quality-team can't read coverage | Structured return format defined for both agents. Coverage also read from filesystem artifacts. |
| Feature-team prompt confusion (fix vs build) | Re-implements instead of targeted fix | Dispatch prompt explicitly says "TARGETED FIX request, not full re-implementation" |

## Files Changed Summary

| File | Action | Changes |
|---|---|---|
| `agents/quality-team.md` | CREATE | Full Agent Teams wrapper (~250 lines) |
| `agents/project-orchestrator.md` | MODIFY | Phase 4 dispatch, Gate 3.5 reference, Phase 4→3 loop with stuck/regression detection, failure detection, Gate 4, pipeline diagram, escalation rules, dispatch model comment |
| `agents/feature-team.md` | MODIFY | **Add "targeted fix" mode** — recognize "PHASE 4→3 FEEDBACK" prefix in dispatch prompt and enter simplified mode: skip task grouping, dispatch only affected agents, skip agent-native passes, run only affected service verification |
| `agents/test-engineer.md` | MODIFY | Remove browser/mobile E2E scope, parameterize coverage configs, add return format (~200 line cap), update scaling note |
| `agents/qa-automation.md` | MODIFY | Clarify E2E ownership, add return format (~200 line cap), add scope enforcement |
| `commands/run-tests.md` | MODIFY | Replace hardcoded thresholds with project-config.md reference |
| `agents/project-setup.md` | MODIFY | Expand coverage threshold section in project-config.md template |
| `CLAUDE.md` | MODIFY | Update pipeline dispatch model comment for Phase 4 |

## Research Insights — Simplicity Considerations

The code-simplicity-reviewer flagged several areas where the plan may be over-engineered. These are documented here for the implementer to consider:

| Concern | Simplicity Argument | Counter-Argument | Resolution |
|---|---|---|---|
| Agent Teams wrapper for 2 agents | review-team coordinates 3-5 agents in 150 lines; quality-team proposes ~250 lines for 2 agents | quality-team owns substantial coordinator logic (planning, classification, retry, aggregation) — not just dispatch | Keep wrapper, but justify by separation of concerns, not pattern matching. Target ~200 lines. |
| Gate 3.5 for SMALL tasks | SMALL = "no gates" by convention. "Approve unit tests" is a rubber-stamp click. | User explicitly chose this. Could add `test-plan-approval: always / big-only` config option. | Keep per user decision. Consider config option for future. |
| Per-service coverage thresholds | Single threshold works. 80% vs 75% difference is marginal. | Google/Atlassian use per-area thresholds. Frontend is genuinely harder to cover. | Keep, but ensure mapping from directory → service type is documented. |
| SendMessage coordination | 2 agents that don't need to negotiate. Scope is in prompts. | Shared test data fixtures message IS genuinely useful. | Remove the redundant scope confirmation message (row 1). Keep shared test data + completion signals (rows 2-4). |
| Failure classification (4 categories) | LLM agent distinguishing "test wrong" from "code wrong" will frequently misclassify | Heuristic fallback (new test = TEST_BUG, regression = IMPL_BUG) makes it self-correcting | Keep with heuristic. TEST_BUG default is cheap (1 retry) and self-correcting. |

## Sources & References

### Origin
- **Brainstorm document:** [docs/brainstorms/2026-03-15-phase4-quality-team-brainstorm.md](docs/brainstorms/2026-03-15-phase4-quality-team-brainstorm.md) — Key decisions carried forward: quality-team Agent Teams wrapper, Gate 3.5 for all sizes, Phase 4→3 through feature-team

### Internal References
- Agent Teams pattern: `plugins/project-orchestrator/agents/feature-team.md` (canonical template)
- Review team pattern: `plugins/project-orchestrator/agents/review-team.md`
- Design team fallback: `plugins/project-orchestrator/agents/design-team.md` (lines 332-342)
- Phase 3 coverage enforcement: `docs/plans/2026-03-15-004-feat-phase3-agent-native-developer-tdd-enforcement-plan.md`
- Current Phase 4 dispatch: `plugins/project-orchestrator/agents/project-orchestrator.md` (lines 499-514)

### External References
- Google Testing Blog: Code Coverage Best Practices — focus on new code coverage, not overall
- IEEE 829 Test Plan Standard — "Not in Scope" section essential for scope containment
- ISTQB Foundation Level Syllabus v4.0.1 (2024) — lightweight agile test plans
- Slack Engineering: Handling Flaky Tests at Scale — reduced flaky failures from 56.76% to 3.85%
- CTRF (Common Test Report Format) — emerging standard replacing JUnit XML for machine-parseable reports
- Autonomous-loops skill: SHARED_TASK_NOTES pattern for context bridging between retry iterations

### SpecFlow Gaps Resolved in This Plan
- Gate 3.5 vs SMALL tasks → Gate 3.5 applies to ALL sizes (user decision)
- Test bug retry exhaustion → escalate to user with reclassify option
- API E2E ownership → stays with test-engineer
- Mixed failure handling → test bugs first, then impl bugs, then single re-run
- Coverage configs → parameterize (not delete)
- api-contracts.md → optional input, degrade gracefully
- Phase 4 re-run gate → skip Gate 3.5 on re-runs
- Agent Teams fallback → subagent mode with scope in prompts
- qa-automation report schema → defined in plan
- Gate 4 update → reads from test-report.md
- Test depth scaling ownership → quality-team owns (in test-plan.md), test-engineer follows
