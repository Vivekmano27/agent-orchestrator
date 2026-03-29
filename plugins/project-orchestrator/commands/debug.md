---
description: "Structured debugging workflow — reproduce, isolate, diagnose, fix, verify. For bugs that need investigation, not just a quick patch. Uses systematic root-cause analysis."
argument-hint: "<error message, symptom, or bug description>"
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.

## Mission

Systematically debug a problem using a 5-step methodology: Reproduce → Isolate → Diagnose → Fix → Verify. Unlike `/quick-fix` (which assumes the bug is understood and patches it), `/debug` investigates the root cause before fixing.

## When to Use `/debug` vs `/quick-fix`

| Signal | Use `/debug` | Use `/quick-fix` |
|--------|-------------|-----------------|
| "I'm getting this error but I don't know why" | Yes | No |
| "This test is failing intermittently" | Yes | No |
| "The API returns wrong data sometimes" | Yes | No |
| "Fix the typo in the error message" | No | Yes |
| "The button color is wrong" | No | Yes |
| "Add the missing null check" | No | Yes |

## Steps

### STEP 1 — Reproduce (Gather Evidence)

**1a — Parse the symptom:**
Read the user's error message or description. Extract:
- Error type (runtime crash, wrong output, performance, intermittent)
- Affected area (which service, endpoint, component)
- Reproduction conditions (always, sometimes, only in prod, only with specific data)

**1b — Search for evidence:**
```bash
# Search for the error message in code
Grep("[error text or key words]", type="ts,py,dart,go,kt,js")

# Check recent git changes in the affected area
git log --oneline -20 -- [affected-path]

# Check test results
Glob("**/*.test.*")
Glob("**/*.spec.*")
```

**1c — Attempt reproduction:**
```bash
# Run the failing test if one exists
[test command from project-config.md] -- [test file]

# Or run the affected service and try to trigger the error
[run command from project-config.md]
```

**1d — Document evidence:**
Write initial findings to memory (do NOT create a spec file — this is debugging, not a feature):
- Error message (exact)
- Stack trace (if available)
- Reproduction steps (confirmed or suspected)
- Affected files (initial list)

### STEP 2 — Isolate (Narrow the Scope)

**2a — Trace the code path:**
Starting from the error location, trace backwards:
```bash
# Find the function that throws/returns the error
Grep("[error function or class]", output_mode="content", context=10)

# Find all callers of that function
Grep("[function name]\\(", output_mode="content")

# Check the data flow — what inputs reach this code?
```

**2b — Check boundaries:**
- Is the bug in our code or a dependency?
- Is it a data issue (bad input) or logic issue (wrong code)?
- Is it environment-specific (works locally, fails in CI/prod)?

**2c — Form hypotheses (minimum 2):**
```
AskUserQuestion(
  question="I've traced the issue. Here are my hypotheses:

  1. [Hypothesis A]: [explanation + evidence for]
  2. [Hypothesis B]: [explanation + evidence for]
  [3. [Hypothesis C]: [if applicable]]

  Evidence so far:
  - [key finding 1]
  - [key finding 2]

  Which seems most likely, or should I investigate further?",
  options=[
    "Hypothesis 1 seems right — investigate that path",
    "Hypothesis 2 seems right — investigate that path",
    "Investigate all hypotheses",
    "I have additional context — let me explain"
  ]
)
```

### STEP 3 — Diagnose (Root Cause)

**3a — Test the leading hypothesis:**
Write a minimal test that proves or disproves it:
```bash
# Create a focused test that isolates the suspected root cause
# If the test fails → hypothesis confirmed
# If the test passes → hypothesis disproven, try next
```

**3b — Identify the root cause (not the symptom):**
Ask: "Why does this happen?" at least 3 times (5 Whys lite):
1. Why does the error occur? → [proximate cause]
2. Why does that condition exist? → [deeper cause]
3. Why wasn't this caught? → [systemic cause]

**3c — Confirm root cause:**
The root cause is confirmed when:
- A test can reliably reproduce the bug
- Fixing the identified code makes the test pass
- The fix doesn't just mask the symptom

### STEP 4 — Fix (Implement with Regression Test)

**4a — Write the regression test FIRST (TDD):**
```bash
# Write a test that:
# 1. Reproduces the exact bug scenario
# 2. Currently fails (proves the bug exists)
# 3. Will pass after the fix
```

**4b — Implement the minimal fix:**
- Fix ONLY the root cause — do not refactor surrounding code
- If the fix requires > 5 files, flag it:
```
AskUserQuestion(
  question="The root cause fix touches [N] files. This is larger than a typical bug fix.
  Should I proceed with the full fix or explore a smaller targeted approach?",
  options=["Proceed with full fix", "Find a smaller fix", "Let me review the affected files first"]
)
```

**4c — Quick code review:**
Dispatch code-reviewer for a focused review of ONLY the changed files:
```
Agent(
  subagent_type="project-orchestrator:code-reviewer",
  prompt="Quick review of bug fix. Changed files: [list]. Root cause: [description].
          Focus on: correctness of the fix, no regressions, edge cases."
)
```

### STEP 5 — Verify (Prove It's Fixed)

**5a — Run the regression test:**
```bash
[test command] -- [regression test file]
```

**5b — Run related tests:**
```bash
# Run the full test suite for the affected module/service
[test command] -- [affected directory]
```

**5c — Check for regressions:**
```bash
# Run the full test suite
[test command]
```

**5d — Report results:**
```
AskUserQuestion(
  question="Bug fix complete:

  Root cause: [1-sentence explanation]
  Fix: [what was changed]
  Files modified: [list]
  Regression test: [test file path]
  Test results: [all passing / N failures]

  Commit this fix?",
  options=[
    "Yes, commit — fix(scope): description",
    "Show me the diff first",
    "I want to test manually before committing",
    "The fix isn't right — let me explain"
  ]
)
```

## Rules
- ALWAYS write a regression test — no exceptions
- NEVER fix more than the root cause (no opportunistic refactoring)
- If you can't reproduce → tell the user, don't guess at a fix
- If the bug is in a dependency → report it, suggest a workaround or pin
- Max 3 hypothesis cycles — if still unresolved, escalate with full findings
- Commit message format: `fix(scope): root cause description`
