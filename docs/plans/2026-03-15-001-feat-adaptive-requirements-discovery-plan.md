---
title: "feat: Adaptive Requirements Discovery for Product Manager Agent"
type: feat
status: completed
date: 2026-03-15
origin: docs/brainstorms/2026-03-15-pm-adaptive-discovery-brainstorm.md
deepened: 2026-03-15
---

# Adaptive Requirements Discovery for Product Manager Agent

## Enhancement Summary

**Deepened on:** 2026-03-15
**Research agents used:** 5 (adaptive-requirements-research, architecture-strategist, spec-flow-analyzer, code-simplicity-reviewer, skill-conflict-explorer)

### Key Improvements from Research
1. **Simplified domain detection** — replaced 7-row lookup table with 2-example pattern + general instruction (Opus doesn't need a lookup table)
2. **Assumption-then-correct pattern** — Tier 2 states assumptions instead of pure interrogation (reduces user cognitive load)
3. **Hard question cap** — 15 max across all agents (SMALL=2-3, MEDIUM=5-8, BIG=10-15)
4. **Opt-out scope framing** — present recommended scope, ask what to remove (not what to add)
5. **Task size handoff** — orchestrator passes classification to PM dispatch prompt
6. **3 new files added to scope** — planning-team.md, commands/new.md, commands/build-feature.md
7. **Cascade rule defined** — if PM revises at Gate 1, BA and UX must re-run

### New Considerations Discovered
- The `planning-team.md` agent dispatches PM without context handoff — creates inconsistent path
- "Use full stack" shortcut semantics were undefined post-refactor — now clarified
- Existing Q6-Q12 repurposed as Tier 3 categories (not deleted, not duplicated)
- `project-requirements` skill should be removed from orchestrator's skills list (orchestrator never writes PRDs)
- PM ordering invariant (PM before BA/UX) was implicit — now documented

---

## Overview

Replace the current flat question system across 3 overlapping layers (orchestrator Step 0, PM Step 0, project-requirements skill) with a single-owner adaptive discovery system. The PM becomes the sole owner of all product/requirements questions. The orchestrator only asks infrastructure questions (tech stack, run method). BA and UX ask domain-specific questions (business workflows, design preferences) — never product questions.

(see brainstorm: docs/brainstorms/2026-03-15-pm-adaptive-discovery-brainstorm.md)

## Problem Statement

The current system has **3 overlapping question layers** totaling ~23 potential questions with significant duplication:

1. **Orchestrator Step 0** (3 questions): tech stack, feature scope, run method
2. **PM Step 0** (12 questions): core purpose, users, MVP scope, platforms, auth, entities, integrations, real-time, monetization, scale, reference apps
3. **project-requirements skill** (15 questions): product questions, feature questions, technical questions — a competing interview that duplicates PM's job

**Problems this causes:**
- The orchestrator's "feature scope" question (Call 2) is hardcoded for a todo app ("CRUD + priority + due dates") — makes no sense for e-commerce, SaaS, healthcare
- PM's current 12 questions are flat — asks all of them regardless of app type. An internal dashboard doesn't need monetization questions
- The project-requirements skill has its own 15-question interview that competes with PM's flow — both try to do the same thing
- No domain detection — the same questions for an e-commerce platform and a developer CLI tool
- No scope discipline — PM never marks "I added this, user didn't ask for it"
- No phased delivery concept — no "what's v1 vs v2?" question
- Orchestrator doesn't pass its Step 0 answers to PM, so PM may re-ask things the user already answered

## Proposed Solution

### Architecture: Single Owner, Adaptive Depth, Domain-Aware

```
User Request
    ↓
Orchestrator Step 0 (2 questions only)
    ├── Q1: Tech stack (with "Use full stack" shortcut)
    └── Q2: How to run locally
    ↓ passes {tech_stack, run_method, task_size, original_request} to PM
Product Manager (adaptive discovery)
    ├── Tier 1 (always, 5-6 Qs): Core purpose, users, MVP, out-of-scope, platforms, release phases
    ├── Tier 2 (adaptive, 2-4 Qs): PM infers domain from Tier 1, states assumptions, asks targeted follow-ups
    └── Tier 3 (optional, user-triggered): "Dig deeper?" with topic categories
    ↓ writes requirements.md
Business Analyst (domain questions only, NOT product questions)
    ├── Reads requirements.md
    └── Asks 1-3 Qs about: workflows, approval chains, SLAs (only if unclear from PRD)
    ↓ writes business-rules.md
UX Researcher (design questions only, NOT product questions)
    ├── Reads requirements.md
    └── Asks 1-3 Qs about: design system, accessibility level, visual style (only if not in PRD)
    ↓ writes ux.md
```

**Hard question cap:** 15 total across all 4 agents. SMALL=2-3, MEDIUM=5-8, BIG=10-15. Never exceed 15.

### Key Decisions

1. **Single owner for requirements** — PM owns ALL product discovery (see brainstorm: Key Decision 1)
2. **Adaptive questioning** — scales depth with complexity, no rigid tier-to-size mapping (see brainstorm: Key Decision 2; simplified per simplicity review)
3. **Domain detection via inference** — PM classifies app type from Tier 1 answers using its own judgment. No lookup table — Opus already knows what to ask for e-commerce vs healthcare. Two examples set the pattern. (see brainstorm: Key Decision 3; simplified per simplicity review)
4. **Scope discipline** — PM marks unrequested features as `[SUGGESTED]`. Presents recommended scope, asks what to remove (opt-out framing). (see brainstorm: Key Decision 4; research: opt-out framing)
5. **Full context handoff** — Orchestrator passes `{tech_stack, run_method, task_size, original_request}` to PM (see brainstorm: Key Decision 5; architecture review: must include task_size)
6. **BA/UX: domain-specific only** — BA asks workflow/approval questions, UX asks design/brand questions. Neither re-asks product questions (see brainstorm: Key Decisions 6-7)
7. **Phased delivery** — PM asks about v1 vs v2 during Tier 1 (see brainstorm: Key Decision 8)
8. **Assumption-then-correct pattern** — Tier 2 states assumptions instead of pure interrogation: "I'm assuming Stripe for payments. Should I change this?" (research: reduces cognitive load)
9. **Requirements hierarchy** — PM asks about business outcomes + capabilities (Levels 1-2). Functional requirements (Level 3) are generated by PM and downstream agents, NOT asked of the user. (research: Teresa Torres opportunity-solution tree)
10. **Cascade on revision** — If PM requirements change at Gate 1 "Request changes", BA and UX MUST re-run because their outputs depend on requirements.md (spec-flow analysis)

## Technical Approach

### File 1: `plugins/agent-orchestrator/agents/project-orchestrator.md`

**Changes:**
- Remove Call 2 (feature scope question) — it's hardcoded for todo apps and belongs to PM
- Keep Call 1 (tech stack) and rename Call 3 → Call 2 (run method)
- Update PM dispatch prompt to include full context: `{tech_stack, run_method, task_size, original_request}`
- Keep "Use full stack" shortcut on tech stack question — when selected, orchestrator skips Call 2, sets `run_method="Docker Compose"` as default, PM still runs its own discovery
- Remove `project-requirements` from orchestrator's `skills:` list (orchestrator never writes PRDs — PM loads it)
- Add ordering invariant comment to Phase 1: "INVARIANT: product-manager MUST complete before BA and UX start"
- Update "Request changes" flow at Gate 1: if PM revises requirements.md, BA and UX MUST re-run
- Update example section to reflect 2-question Step 0

**Before (3 calls):**
```
Call 1: Tech stack → Call 2: Feature scope → Call 3: Run method
```

**After (2 calls):**
```
Call 1: Tech stack → Call 2: Run method
```

**PM dispatch prompt update:**
```
Agent(
  subagent_type="agent-orchestrator:product-manager",
  prompt="Write a complete PRD for: [ORIGINAL USER REQUEST].
          Tech stack chosen: [tech_stack]. Run method: [run_method]. Task size: [SMALL/MEDIUM/BIG].
          Do NOT re-ask about tech stack or run method — those are decided.
          Run your adaptive requirements discovery, then output to .claude/specs/[feature]/requirements.md"
)
```

**"Use full stack" shortcut clarification:**
When user selects "Use full stack from steering/tech.md" on Call 1:
- Orchestrator skips Call 2 (run method) — defaults to "Docker Compose"
- PM still runs its Tier 1 discovery (core purpose, users, MVP, etc.) — "skip all questions" means skip ORCHESTRATOR questions, not PM questions
- PM will naturally ask fewer questions because tech stack and run method are already decided

### Research Insights for File 1

**Best Practices:**
- The context handoff should be explicit in the prompt, not a file reference. Subagents have their own context window — they can't "remember" what the orchestrator captured. Embedding values directly in the prompt string is correct.
- Include the original user request VERBATIM (not paraphrased) so the PM can do its own intent analysis.

**Edge Cases:**
- If user selects "Use full stack" but later the PM discovers the app is web-only (no mobile needed), the PM should note this in the PRD as "Tech stack includes Flutter/KMP but MVP is web-only. Mobile development deferred to v2."
- The orchestrator classifies task size BEFORE PM runs. This is based on the user's initial description, not the PM's PRD. This is fine — task size is a rough heuristic for question depth, not a precise measurement.

---

### File 2: `plugins/agent-orchestrator/agents/product-manager.md`

**Changes — replace current Step 0 entirely with adaptive system:**

**Tier 1 — Core Questions (always ask, 5-6 questions):**
1. Core purpose / problem (keep current Q1)
2. Target users (keep current Q2)
3. Platforms (move current Q5 here — platform choice affects MVP scoping)
4. MVP features — MUST-HAVE only (keep current Q3, now informed by platform answer)
5. Out of scope (keep current Q4, ask for all sizes)
6. **NEW: Release phases** — "Is everything v1, or do you want to split into phases?"

**Question ordering rationale:** Platforms moved before MVP features because knowing "web only" vs "all platforms" directly constrains what features are feasible for v1. A user who knows they're web-only won't list mobile-specific features.

**Tier 2 — Domain-Adaptive Questions (2-4 questions, inferred from Tier 1):**

After Tier 1, PM analyzes answers to detect the app domain. No lookup table — use judgment. Two examples to set the pattern:

> After the user answers Tier 1, identify the 2-4 most important unknowns for this specific domain. For example:
> - If building e-commerce → ask about payment provider, inventory model, and shipping
> - If building SaaS → ask about multi-tenancy, subscription billing, and team management
> - If building a simple CRUD utility → skip Tier 2 entirely, you have enough
>
> For apps that span multiple domains (e.g., "healthcare SaaS with AI"), ask from the top 2 detected domains, capping at 4 Tier 2 questions total.

**Use the assumption-then-correct pattern for Tier 2:**
Instead of pure interrogation, state what you assume and ask if it's wrong:
```
# Better — assumption + correction:
AskUserQuestion(
  question="I'm assuming email + password auth with optional social login (Google, Apple). Should I change this?",
  options=[
    "That's correct",
    "I want SSO / enterprise auth (SAML, OIDC)",
    "No auth needed — public app",
    "Let me describe a different setup"
  ]
)

# Avoid — pure interrogation:
AskUserQuestion(
  question="How should users log in?",
  options=["Email + password", "Social login", "SSO", "No auth"]
)
```

This reduces cognitive load on the user, demonstrates competence, and only triggers follow-up when the assumption is wrong.

**Tier 3 — Optional Deep-Dive (user-triggered, BIG tasks only):**

Repurpose existing Q6-Q12 topics as selectable deep-dive categories:
```
AskUserQuestion(
  question="I have enough to write the PRD. Want me to dig deeper into any area?",
  options=[
    "No — write the PRD now",
    "Yes — auth & permissions",
    "Yes — integrations & third-party services",
    "Yes — data model & relationships",
    "Yes — compliance & security",
    "Yes — monetization & billing",
    "Yes — performance & scale"
  ]
)
```

If user selects a category, ask 1-2 focused questions on that topic, then write the PRD. Do not offer Tier 3 again after one deep-dive.

**Scope discipline rules (NEW):**
- Every feature in the PRD must be tagged: `[REQUESTED]` or `[SUGGESTED]`
- Present recommended scope using **opt-out framing**: "Based on your description, here's the MVP scope: [list]. Should I remove anything?" (not "what else would you like?")
- Default to basic implementation — polish comes in revision cycles
- Never gold-plate: if user said "todo app", don't add collaborative editing, AI suggestions, or analytics
- Produce a "cut list" at the end of the PRD: features considered but NOT included, with reasoning

**When to stop asking:**
- Ask the minimum questions needed to write a confident PRD
- For straightforward requests (user gave detailed description, domain is clear), 2-3 questions suffice
- For complex or ambiguous requests, up to 10 questions
- **Never exceed the 15-question total cap across all Phase 1 agents**
- Always offer to dig deeper (Tier 3) before writing, so the user controls depth
- **Diminishing returns check:** if the last answer produced no new entities, constraints, or requirements, stop asking immediately
- Skip any question whose answer is already clear from: (a) orchestrator context in the dispatch prompt, (b) `steering/product.md`, (c) previous answers

### Research Insights for File 2

**Best Practices (from NNGroup funnel technique):**
- Questions should flow from broad to narrow within each topic. Don't jump between topics at the same abstraction level.
- Complete the funnel for one topic before moving to the next.

**Best Practices (from Teresa Torres opportunity-solution tree):**
- Only ask users about outcomes (business goals) and opportunities (user pains). Solutions (features) and assumptions (risks) should be generated by the PM, not asked of the user.
- When the user says "I need search", dig into WHY: "What are users trying to find? How do they look for it today?" This produces better requirements than "What search features do you want?"

**Anti-Patterns to Avoid:**
- Never suggest features through questions ("Would you also want X?") — this causes scope creep
- Never ask about implementation details ("Redis or Memcached?") — that's the architect's job
- Never ask leading questions ("Should we add caching for better performance?") — frame choices neutrally with trade-offs

**Edge Cases:**
- Terse user: If user answers MVP features with "the usual stuff" or "you decide", state your assumptions and ask for confirmation: "Based on [domain], I'm assuming these MVP features: [list]. Should I add or remove anything?"
- Hybrid domain: A "healthcare SaaS with AI recommendations" maps to 3 categories. Ask from the top 2, cap at 4 Tier 2 questions.
- Already-filled steering/product.md: Read it first, skip questions that are clearly answered. Partially-filled is the hardest case — skip filled sections, ask about unfilled ones.

---

### File 3: `plugins/agent-orchestrator/agents/business-analyst.md`

**Changes — minimal refinement (current BA is already well-scoped):**

The current BA already reads the PRD first (Step 0) and asks domain-specific clarifications only (Step 1). Changes are minor:

- Add explicit deduplication guard: "Read requirements.md. If the PM already captured [topic], do NOT re-ask."
- Make question examples more concrete (reference PRD content, not generic prompts)
- Add output format guidance for business-rules.md
- Ensure questions are conditional on domain (don't ask about "content lifecycle" for an e-commerce app)

**Deduplication guard (add to Step 1):**
```
Before asking any question, check requirements.md:
- If PM already documented business rules → only ask about gaps or ambiguities
- If PM already documented workflows → only ask about decision points and edge cases
- If PM already documented compliance requirements → do NOT re-ask
```

**Output format guidance (add to Step 2):**
```
business-rules.md must contain:
1. Data ownership map (entity → owner service → consumers → sync method)
2. Business rules table (ID, rule, service, example)
3. Entity state machines (states + transitions + guards)
4. Cross-service workflow sequences
5. Validation rules and constraints
```

### Research Insights for File 3

**Best Practice:** BA questions should be about process and rules, not about features. "What happens when a payment fails?" is a BA question. "Should we support refunds?" is a PM question (and should have been asked already).

---

### File 4: `plugins/agent-orchestrator/agents/ux-researcher.md`

**Changes — add design system + accessibility questions:**

- Add design system question (always ask for BIG)
- Add accessibility level question (ask if domain suggests healthcare/government/enterprise)
- Make visual style question conditional on PM output (skip if PM captured reference apps)
- Add explicit deduplication guard

**Refined UX questions (2-3 max):**
```
# Design system (always ask for BIG):
AskUserQuestion(
  question="What design system should I base components on?",
  options=[
    "Shadcn/ui (recommended for Next.js)",
    "Material Design (recommended for Flutter)",
    "Ant Design",
    "Custom from scratch",
    "I have an existing design system"
  ]
)

# Accessibility level (ask if healthcare, government, enterprise, or compliance mentioned in PRD):
AskUserQuestion(
  question="What accessibility level is required?",
  options=[
    "WCAG AA (standard — recommended)",
    "WCAG AAA (strict — government/healthcare)",
    "Basic only — internal tool"
  ]
)

# Design direction (ONLY if PM didn't capture reference apps — check requirements.md first):
AskUserQuestion(
  question="What design style fits this app best?",
  options=[
    "Minimal and clean (like Linear, Notion)",
    "Data-rich dashboard (like Stripe, Datadog)",
    "Consumer-friendly (like Airbnb, Spotify)",
    "Enterprise / professional (like Salesforce, HubSpot)",
    "I have a reference app — let me describe"
  ]
)
```

**Deduplication guard (add to Step 1):**
```
Before asking any question, check requirements.md:
- If PM captured reference apps or design direction → skip design direction question
- If PM captured accessibility requirements → skip accessibility question
- If tech stack implies a design system (e.g., Flutter → Material) → adjust options accordingly
```

---

### File 5: `plugins/agent-orchestrator/skills/project-requirements/SKILL.md`

**Changes — convert from competing interview to reference material:**

- Remove "Interview Process" section (lines 19-43) entirely
- Keep "Document Templates" section (PRD, Feature List JSON, Task Breakdown)
- Add note: "Questions are handled by the product-manager agent's adaptive discovery. This skill provides output templates only."
- Keep `allowed-tools` and other frontmatter unchanged

---

### File 6: `plugins/agent-orchestrator/agents/planning-team.md` (NEW in scope)

**Changes — update PM dispatch prompt for consistency:**

The planning-team is an alternative entry point that also dispatches the product-manager. Its dispatch prompt must include the same context handoff as the orchestrator.

- Update PM dispatch prompt to include `{tech_stack, run_method, task_size, original_request}`
- Add note: "If invoked directly (not via orchestrator), you must gather tech stack and run method yourself before dispatching PM"

---

### File 7: `plugins/agent-orchestrator/commands/new.md` (NEW in scope)

**Changes — update question count:**
- Change "2-3 clarifying questions" to "2 infrastructure questions (tech stack, run method)"

---

### File 8: `plugins/agent-orchestrator/commands/build-feature.md` (NEW in scope)

**Changes — update question count if it references orchestrator questions:**
- Check for stale references to orchestrator's 3-question flow, update to 2

## System-Wide Impact

### Interaction Graph
- Orchestrator Step 0 fires (2 Qs) → classifies task size → passes `{tech_stack, run_method, task_size, original_request}` to PM agent → PM runs adaptive discovery → writes requirements.md → BA reads it (asks 1-3 domain Qs) → UX reads it (asks 1-3 design Qs)
- Removing Call 2 from orchestrator eliminates the "if Custom, ask follow-up" branch
- "Use full stack" shortcut now skips only orchestrator questions, defaults `run_method="Docker Compose"`

### Error Propagation
- If PM's domain detection is wrong → Tier 2 asks suboptimal questions → PRD has gaps → BA/architect catch gaps downstream. Low risk because:
  - PM uses assumption-then-correct pattern (user can fix wrong assumptions)
  - Every question has "Let me describe" escape hatch
  - Downstream agents (system-architect, api-architect) will flag missing requirements

### State Lifecycle Risks
- **Revision cascade:** If user selects "Request changes" at Gate 1 and PM revises requirements.md, BA's business-rules.md and UX's ux.md become stale. Mitigation: orchestrator re-runs BA and UX after PM revision.
- No other state risks — all changes are to markdown agent files.

### API Surface Parity
- The `project-requirements` skill is removed from orchestrator's `skills:` list but remains in PM's. After deduplication, PM loads it for templates, orchestrator does not load it at all.
- The `planning-team` agent is updated to match orchestrator's context handoff pattern.

### Ordering Invariant
**INVARIANT: product-manager MUST complete before BA and UX start.** BA reads requirements.md, UX reads requirements.md. If PM hasn't written it yet, BA and UX have no input. This constraint must never be relaxed — even for "performance optimization" by parallelizing all three.

## Acceptance Criteria

### Functional Requirements
- [ ] Orchestrator Step 0 asks exactly 2 questions (tech stack, run method) — NOT 3
- [ ] Orchestrator passes `{tech_stack, run_method, task_size, original_request}` to PM dispatch prompt
- [ ] "Use full stack" shortcut skips orchestrator Qs only, defaults run_method to "Docker Compose", PM still runs discovery
- [ ] PM Tier 1 includes release phases question ("v1 vs v2?")
- [ ] PM Tier 1 asks platforms BEFORE MVP features (ordering change)
- [ ] PM Tier 2 uses assumption-then-correct pattern (not pure interrogation)
- [ ] PM Tier 2 uses inference (not lookup table) for domain detection
- [ ] PM handles hybrid domains (asks from top 2 detected domains, cap 4 Tier 2 Qs)
- [ ] PM Tier 3 repurposes existing Q6-Q12 topics as selectable categories
- [ ] PM marks unrequested features as `[SUGGESTED]` and uses opt-out scope framing
- [ ] PM produces a "cut list" of features NOT included
- [ ] Hard cap: 15 questions total across orchestrator + PM + BA + UX
- [ ] BA has explicit deduplication guard (check requirements.md before asking)
- [ ] UX has explicit deduplication guard (check requirements.md before asking)
- [ ] UX skips design direction question if PM captured reference apps
- [ ] project-requirements skill has NO interview section — templates only
- [ ] project-requirements removed from orchestrator's skills list
- [ ] planning-team PM dispatch includes context handoff
- [ ] commands/new.md updated to "2 infrastructure questions"
- [ ] Gate 1 "Request changes" triggers BA + UX re-run after PM revision
- [ ] No question is asked twice across orchestrator → PM → BA → UX chain

### Quality Gates
- [ ] `bash plugins/agent-orchestrator/validate-plugin.sh` passes with 0 errors
- [ ] All modified files have valid frontmatter
- [ ] Orchestrator example section updated to reflect 2-question Step 0
- [ ] PM question count: Tier 1 = 5-6, Tier 2 = 2-4 (domain-dependent), Tier 3 = 0-1 optional

## Dependencies & Prerequisites

- Brainstorm completed and approved: `docs/brainstorms/2026-03-15-pm-adaptive-discovery-brainstorm.md`
- Previous refactoring complete: all agents have correct tools, models, descriptions (done 2026-03-14)
- BA and UX already have basic question structures (added earlier today) — this plan refines them

## Risk Analysis & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Domain detection misclassifies app | Wrong Tier 2 questions asked | Assumption-then-correct pattern lets user fix; BA/architect catch gaps downstream |
| Too many questions for simple apps | User frustration | Hard cap of 15; SMALL = 2-3 Qs; diminishing returns check; skip questions already answered |
| PM maxTurns: 25 tight for BIG tasks | PM runs out of turns before finishing PRD | Monitor; increase to 30 if needed |
| Removing orchestrator Call 2 breaks "Use full stack" shortcut | Fast path lost | Shortcut preserved on Call 1; only skips orchestrator Qs; PM still runs discovery |
| planning-team dispatch inconsistent | PM asked without context | planning-team updated with same handoff pattern |
| Gate 1 revision doesn't cascade to BA/UX | Stale business-rules.md and ux.md | Orchestrator re-runs BA + UX after PM revision |
| project-requirements skill removal breaks workflows | PM loses templates | NOT removing skill — only interview section. Templates preserved. |

## Implementation Phases

### Phase 1: Orchestrator Cleanup (1 file)
- Remove Call 2 (feature scope) from orchestrator Step 0
- Renumber Call 3 → Call 2
- Add `task_size` to PM dispatch prompt with full context handoff
- Default `run_method="Docker Compose"` for "Use full stack" path
- Remove `project-requirements` from orchestrator's `skills:` list
- Add ordering invariant comment to Phase 1
- Update Gate 1 "Request changes" to cascade to BA + UX
- Update example section to reflect 2-question Step 0

### Phase 2: PM Adaptive Rewrite (1 file)
- Restructure Tier 1: reorder (platforms before MVP features), add release phases question
- Replace Tier 2: remove 7-row domain table, add 2-example pattern + inference instruction
- Add assumption-then-correct pattern for Tier 2
- Repurpose Q6-Q12 as Tier 3 selectable categories
- Add scope discipline rules (opt-out framing, `[SUGGESTED]` tags, cut list)
- Replace rigid tier-to-size mapping with natural language calibration + hard cap of 15
- Add diminishing returns check

### Phase 3: BA/UX Refinement (2 files)
- BA: add explicit deduplication guard, add output format guidance, make questions conditional on domain
- UX: add design system question, add accessibility level question, make visual style conditional, add deduplication guard
- Both: ensure no product question overlap with PM

### Phase 4: Skill Deduplication (1 file)
- Remove interview section from project-requirements skill
- Add "templates only" note
- Verify PM still loads the skill for template access

### Phase 5: Consistency Updates (2-3 files)
- Update planning-team.md PM dispatch prompt with context handoff
- Update commands/new.md question count
- Check commands/build-feature.md for stale references

### Phase 6: Validation
- Run `validate-plugin.sh`
- Verify question flow end-to-end: orchestrator (2 Qs) → PM (5-10 Qs) → BA (1-3 Qs) → UX (1-3 Qs)
- Verify total question count stays within 15 cap for all task sizes
- Update orchestrator example walkthrough

## Sources & References

### Origin
- **Brainstorm document:** [docs/brainstorms/2026-03-15-pm-adaptive-discovery-brainstorm.md](docs/brainstorms/2026-03-15-pm-adaptive-discovery-brainstorm.md) — Key decisions carried forward: single PM ownership, adaptive questioning, domain detection, scope discipline, full context handoff

### Internal References
- Orchestrator: `plugins/agent-orchestrator/agents/project-orchestrator.md:19-76`
- Product Manager: `plugins/agent-orchestrator/agents/product-manager.md:43-213`
- Business Analyst: `plugins/agent-orchestrator/agents/business-analyst.md:33-81`
- UX Researcher: `plugins/agent-orchestrator/agents/ux-researcher.md:35-84`
- Project Requirements Skill: `plugins/agent-orchestrator/skills/project-requirements/SKILL.md:19-43`
- Planning Team: `plugins/agent-orchestrator/agents/planning-team.md`
- New Command: `plugins/agent-orchestrator/commands/new.md`

### External References
- [msitarzewski/agency-agents SeniorProjectManager](https://github.com/msitarzewski/agency-agents/blob/main/project-management/project-manager-senior.md) — scope discipline, anti-gold-plating
- [NNGroup Funnel Technique](https://www.nngroup.com/articles/the-funnel-technique-in-qualitative-user-research/) — broad-to-narrow question ordering
- [Teresa Torres Opportunity Solution Trees](https://www.producttalk.org/opportunity-solution-trees/) — ask about outcomes, not solutions
- [AI-based Multiagent Approach for Requirements Elicitation (arxiv 2409.00038)](https://arxiv.org/html/2409.00038v1) — multi-agent specialization by concern
- [Hyperbound — Assumption-then-correct pattern](https://hugofroes.medium.com/when-to-stop-questioning-e266be81d9d7) — reduces cognitive load vs pure interrogation

### Research Findings Applied
- **Simplicity review:** Removed 7-domain lookup table (Opus doesn't need it), simplified tier-to-size mapping to natural language, shortened `[SUGGESTED]` tag
- **Architecture review:** Added task_size to handoff, added planning-team to scope, clarified "Use full stack" semantics, documented ordering invariant
- **Spec-flow analysis:** Clarified Tier 2 content (inference + examples, not question banks), resolved Q6-Q12 fate (repurposed as Tier 3), defined cascade on revision
- **External research:** Added assumption-then-correct pattern, opt-out scope framing, question cap, diminishing returns check, requirements hierarchy (ask Levels 1-2 only)
- **Skill conflict check:** Confirmed no conflicts with related skills (spec-driven-dev, product-knowledge, user-story-writer, steering-docs)
