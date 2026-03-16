---
description: "Add a new feature to an in-progress pipeline. Analyzes impact, updates affected specs (PRD, business rules, architecture, API, schema, design, agent-spec, tasks), and resumes. Can be invoked at ANY point — even mid-implementation."
argument-hint: "<feature description>"
disable-model-invocation: true
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.

## Mission

Inject a new feature into an already-running pipeline. Smart cascade: only re-run agents whose specs are affected by the new feature.

## When to Use

- "I also want feature X"
- "Can we add [new capability] to this project?"
- "I forgot to mention — we also need [feature]"
- User invokes `/add-feature "description"` at any point during the pipeline

## Execution Protocol

### STEP 1 — Locate existing specs

Find the active feature spec directory:
```bash
# Find the most recent spec directory
ls -td .claude/specs/*/ 2>/dev/null | head -1
```

Read ALL existing spec files to understand current scope:
- `project-config.md` — tech stack (needed for context)
- `requirements.md` — current PRD and user stories
- `business-rules.md` — current business logic
- `ux.md` — current UX research
- `architecture.md` — current architecture
- `api-spec.md` — current API endpoints
- `schema.md` — current database schema
- `design.md` — current UI design
- `agent-spec.md` — current agent-native spec (if exists)
- `tasks.md` — current task list (if exists)

If no spec directory found: "No active pipeline found. Use /build-feature or /new to start a new pipeline."

### STEP 2 — Analyze the new feature

Read the user's feature description and classify what's affected:

```
AskUserQuestion(
  question="I'll add this feature to the existing specs. Let me confirm the scope:

  New feature: [user's description]
  Current project: [feature name from spec directory]

  Based on my analysis, this feature affects:
  - [x] Requirements (PRD) — always updated
  - [x/blank] Business rules — [why or why not]
  - [x/blank] UX (new screens/flows) — [why or why not]
  - [x/blank] Architecture (new services) — [why or why not]
  - [x/blank] API endpoints (new/changed) — [why or why not]
  - [x/blank] Database schema (new tables/columns) — [why or why not]
  - [x/blank] UI design (new components) — [why or why not]
  - [x/blank] Agent-native spec (new tools) — [why or why not]
  - [x] Tasks — always regenerated after spec updates

  Does this look right?",
  options=[
    "Yes, proceed with this cascade",
    "More specs are affected — let me explain",
    "Fewer specs are affected — only update [specific ones]",
    "Cancel — don't add this feature"
  ]
)
```

### STEP 3 — Smart cascade: re-run ONLY affected agents

For each affected spec, dispatch the owning agent with a REVISION prompt. Run in dependency order (not all at once):

**Wave 1 — Requirements (ALWAYS runs first):**
```
Agent(
  subagent_type="project-orchestrator:product-manager",
  prompt="REVISION: Add this new feature to the existing PRD.
          New feature: [user's description]
          Previous output at .claude/specs/[feature]/requirements.md — read it first.
          ADD the new feature as additional user stories. Do NOT remove existing stories.
          Number new stories continuing from the last existing story number.
          Tag new stories as [ADDED] to distinguish from original scope.
          Ask 1-2 clarifying questions if the feature is ambiguous (use AskUserQuestion).
          Update the feature list, acceptance criteria, and out-of-scope section."
)
```
Wait for completion.

**Wave 2 — Affected Phase 1 agents (parallel, only if marked affected):**

If business rules affected:
```
Agent(
  subagent_type="project-orchestrator:business-analyst",
  run_in_background=True,
  prompt="REVISION: New feature added to requirements.md.
          New feature: [user's description]
          Previous output at .claude/specs/[feature]/business-rules.md — read it first.
          Read updated requirements.md for the new user stories tagged [ADDED].
          ADD new business rules, state machines, and workflows for the new feature.
          Do NOT remove existing rules. Append new rules continuing from the last BR-NNN number."
)
```

If UX affected:
```
Agent(
  subagent_type="project-orchestrator:ux-researcher",
  run_in_background=True,
  prompt="REVISION: New feature added to requirements.md.
          New feature: [user's description]
          Previous output at .claude/specs/[feature]/ux.md — read it first.
          Read updated requirements.md for the new user stories tagged [ADDED].
          ADD new user journeys, wireframes, and interaction inventory items for the new feature.
          Do NOT remove existing content."
)
```
Wait for Wave 2 to complete.

**Wave 3 — Affected Phase 2 agents (parallel, only if marked affected):**

For each affected design agent (architecture, API, database, UI, agent-native), dispatch with:
```
Agent(
  subagent_type="project-orchestrator:[agent-name]",
  run_in_background=True,
  prompt="REVISION: New feature added. Update your spec to include it.
          New feature: [user's description]
          Previous output at .claude/specs/[feature]/[spec-file] — read it first.
          Read updated requirements.md for new stories tagged [ADDED].
          Read updated business-rules.md for new rules (if it was updated).
          ADD new [endpoints/tables/components/tools] for the new feature.
          Do NOT remove existing content. Append and integrate.
          Self-review before signaling DONE."
)
```
Wait for Wave 3 to complete.

**Wave 4 — Task decomposition (ALWAYS runs last):**
```
Agent(
  subagent_type="project-orchestrator:task-decomposer",
  prompt="REVISION: New feature added to all specs. Regenerate tasks.md.
          Previous output at .claude/specs/[feature]/tasks.md — read it first.
          Read ALL updated specs in .claude/specs/[feature]/.
          KEEP existing tasks that are still valid. Mark completed tasks as 'completed'.
          ADD new tasks for the new feature, numbered continuing from the last TASK-NNN.
          Tag new tasks with [ADDED] in their description.
          Maintain correct dependency ordering — new tasks may depend on existing ones."
)
```

### STEP 4 — Update SUMMARY.md

After all agents complete, regenerate `.claude/specs/[feature]/SUMMARY.md` with the updated scope:
- Original features
- **Added feature: [description]** — clearly marked
- Updated counts (endpoints, tables, components, tasks)
- Which specs were modified

### STEP 5 — Report and resume

```
AskUserQuestion(
  question="Feature added successfully:

  New feature: [description]
  Specs updated: [list of updated files]
  New user stories: [count] added (tagged [ADDED])
  New tasks: [count] added (tagged [ADDED])
  Total tasks now: [count]

  What would you like to do?",
  options=[
    "Continue the pipeline from where it was",
    "Review the updated specs before continuing",
    "Add another feature",
    "Cancel the addition (revert changes)"
  ]
)
```

If "Continue": return control to the project-orchestrator to resume from the current phase.
If "Review": present a summary of changes per spec file.
If "Add another feature": loop back to STEP 2 with a new feature description.
If "Cancel": revert spec files to their pre-addition state using git:
```bash
git checkout -- .claude/specs/[feature]/
```

## Smart Cascade Rules

### Dependency order (MUST follow):
```
requirements.md → business-rules.md + ux.md → architecture.md + api-spec.md + schema.md + design.md + agent-spec.md → tasks.md
```
Later specs depend on earlier ones. Never run Wave 3 before Wave 1 completes.

### Impact classification heuristics:

| New feature type | Affects |
|-----------------|---------|
| New entity/resource (e.g., "add payments") | ALL specs — new tables, endpoints, components, business rules, agent tools |
| New business rule (e.g., "add debt limit of 5 cans") | requirements + business-rules + maybe API (validation endpoint) + tasks |
| New UI screen (e.g., "add analytics dashboard") | requirements + ux + design + maybe API (data endpoint) + tasks |
| New integration (e.g., "add Stripe payments") | requirements + architecture + API + maybe schema + tasks |
| Enhancement to existing feature (e.g., "add filters to order list") | requirements + API (query params) + design (filter component) + tasks |
| New user role (e.g., "add admin role") | ALL specs — auth changes touch everything |

### What NOT to cascade:
- `project-config.md` — tech stack is NEVER changed by adding features. If user needs to change tech stack, that's a separate `/init-project` re-run.
- `design-review.md` — this is a review artifact, not a source spec. It will be regenerated when the pipeline reaches Phase 2 review.

## Mid-Implementation Additions (Phase 3+)

When the pipeline is already in Phase 3 (code is being written) or later:

1. Run the smart cascade above to update all specs + tasks
2. **Additionally:**
   - Read `api-contracts.md` — flag if new feature conflicts with already-built endpoints
   - Check `tasks.md` — identify which NEW tasks can run in the current phase vs need a new implementation wave
   - If backend code already written: new backend tasks are dispatched as an additional wave
   - If frontend already started: alert that frontend may need to restart after backend additions

3. Present the user with a clear picture:
```
AskUserQuestion(
  question="This feature adds [N] new tasks to an already in-progress build:
  - [X] tasks can run now (no dependency on unfinished work)
  - [Y] tasks need the current wave to finish first
  - [Z] tasks may require re-work of already-built code

  How should I handle this?",
  options=[
    "Add to current build — dispatch new tasks when their dependencies are met",
    "Finish current build first, then start a new build wave for the addition",
    "Cancel the addition"
  ]
)
```

## Edge Cases

**No existing specs:** Redirect to `/build-feature` or `/new`.
**Feature already exists:** If the new feature overlaps with existing user stories, flag it:
```
"This feature seems similar to existing story US-005. Should I enhance the existing story or create a new one?"
```
**Multiple features at once:** Support adding multiple features in one invocation. Analyze impact for all, merge cascades, run once.
