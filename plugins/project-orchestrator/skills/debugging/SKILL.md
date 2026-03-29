---
name: debugging
description: "Systematic debugging methodology — reproduce, isolate, diagnose, fix, verify. Use when investigating bugs with unknown root causes, intermittent failures, or complex multi-service issues. Not for simple fixes (use quick-fix patterns instead). Covers: binary search debugging, hypothesis-driven investigation, 5 Whys root cause analysis, and regression test writing."
---

# Systematic Debugging Skill

A structured methodology for finding and fixing bugs when the root cause is unknown.

## When to Use This Skill

| Symptom | Use This Skill | Use Quick-Fix Instead |
|---------|---------------|----------------------|
| "I don't know why this fails" | Yes | No |
| "It fails intermittently" | Yes | No |
| "It works locally but not in CI" | Yes | No |
| "The error message is misleading" | Yes | No |
| "The null check is missing here" | No | Yes |
| "Wrong string in the error message" | No | Yes |

## The 5-Step Methodology

### Step 1: Reproduce — Make the Bug Visible

**Goal:** Confirm the bug exists and create a reliable way to trigger it.

**Techniques:**
- Run the failing test or endpoint
- Check logs for error patterns
- Try different inputs to find the trigger condition
- Check environment differences (local vs CI vs prod)

**Evidence checklist:**
- [ ] Exact error message captured
- [ ] Stack trace captured (if available)
- [ ] Reproduction steps documented
- [ ] Affected files identified (initial list)

**If you can't reproduce:**
1. Check if it's environment-specific (env vars, DB state, timing)
2. Check if it's data-dependent (specific inputs trigger it)
3. Check if it's a race condition (timing-dependent)
4. If still can't reproduce after 3 attempts → tell the user, don't guess

### Step 2: Isolate — Narrow the Scope

**Goal:** Find the smallest code unit that contains the bug.

**Techniques:**

**Binary search debugging:** If the bug is in a pipeline/flow:
1. Find the midpoint of the data flow
2. Log the state at that point
3. If state is correct → bug is downstream. If wrong → bug is upstream.
4. Repeat, halving the search space each time.

**Boundary analysis:** Check at each boundary:
- Is the input correct? (data validation issue)
- Is the output correct? (logic issue)
- Is the boundary itself correct? (integration issue)

**Dependency elimination:**
- Can you reproduce with mocked dependencies? → Bug is in your code
- Does it only happen with real dependencies? → Bug is at the boundary or in the dependency

### Step 3: Diagnose — Find the Root Cause

**Goal:** Understand WHY the bug exists, not just WHERE it is.

**Multiple hypotheses (ALWAYS form at least 2):**
For any bug, there are usually multiple possible causes. List them and test each:

| Hypothesis | Evidence For | Evidence Against | Test |
|-----------|-------------|-----------------|------|
| [Cause A] | [what supports it] | [what contradicts it] | [how to prove/disprove] |
| [Cause B] | [what supports it] | [what contradicts it] | [how to prove/disprove] |

**5 Whys (root cause drill-down):**
1. Why does the error occur? → [proximate cause]
2. Why does that condition exist? → [contributing factor]
3. Why wasn't this caught earlier? → [systemic gap]

**Root cause confirmed when:**
- A test can reliably trigger the bug
- Fixing the identified cause makes the test pass
- The fix addresses the root cause, not a symptom
- No other tests break

### Step 4: Fix — Minimal, Targeted Change

**Goal:** Fix the root cause with the smallest possible change.

**Rules:**
- Write the regression test FIRST (TDD)
- Fix ONLY the root cause — no opportunistic refactoring
- If fix touches > 5 files, it may not be a bug fix — reconsider
- Match existing code patterns and conventions

**Regression test requirements:**
- Reproduces the exact bug scenario
- Currently fails (proves the bug exists)
- Passes after the fix
- Tests the root cause, not just the symptom
- Named clearly: `test_[feature]_[bug_scenario]`

### Step 5: Verify — Prove It's Fixed and Nothing Else Broke

**Goal:** Confirm the fix works and doesn't introduce regressions.

**Verification checklist:**
- [ ] Regression test passes
- [ ] All related module tests pass
- [ ] Full test suite passes (no regressions)
- [ ] The original error scenario no longer occurs
- [ ] Edge cases around the fix are covered

## Common Bug Patterns

### Null/Undefined References
- **Check:** Is the variable initialized? Can the source return null?
- **Fix:** Add null check at the boundary, not deep in the code
- **Test:** Test with null/undefined input

### Off-by-One Errors
- **Check:** Array indices, loop bounds, pagination offsets
- **Fix:** Use inclusive/exclusive bounds consistently
- **Test:** Test with 0, 1, and boundary-value inputs

### Race Conditions
- **Check:** Shared mutable state, async operations without locks
- **Fix:** Use atomic operations, locks, or immutable data
- **Test:** Run concurrent operations in a loop (flaky by nature — use retry)

### State Management Bugs
- **Check:** Is state updated in the right order? Are there stale closures?
- **Fix:** Ensure single source of truth, proper state transitions
- **Test:** Test state after each operation in sequence

### Integration Boundary Bugs
- **Check:** API contract mismatches, serialization/deserialization, timezone handling
- **Fix:** Add contract tests, validate at boundaries
- **Test:** Integration tests with real services (not mocks)

## Anti-Patterns

- **Shotgun debugging** — changing random things until it works; always form a hypothesis first
- **Fixing symptoms** — adding a try/catch around the error instead of fixing the cause
- **Debugging in production** — never add debug logging to production without cleanup plan
- **Skipping reproduction** — assuming you know the cause without proving it
- **No regression test** — every bug fix MUST have a test that would have caught it
- **Scope creep** — refactoring unrelated code while debugging; fix the bug, nothing more
