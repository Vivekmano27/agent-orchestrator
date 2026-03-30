# Phase 2.15: Project-Specific Gap Analysis

**Executor:** project-orchestrator (YOU — no subagent needed)

## Preconditions
- `.claude/specs/[feature]/tasks.md` exists (Phase 2.1)
- `.claude/specs/[feature]/project-config.md` exists (Phase 1.5)
- `.claude/specs/[feature]/requirements.md` exists (Phase 1)
- `.claude/specs/[feature]/api-spec.md` exists (Phase 2)

## Dispatch Instructions

**Analyze what this project needs that the plugin doesn't already provide, then create it.**

### STEP 1 — Scan project requirements for domain-specific needs

Read these files and extract domain-specific features:
- `requirements.md` — user stories mentioning specific integrations (payments, email, SMS, maps, etc.)
- `tasks.md` — tasks requiring domain expertise not covered by existing agents
- `api-spec.md` — endpoints requiring specialized knowledge (third-party APIs, webhooks, etc.)
- `project-config.md` — tech stack choices that may need custom patterns

Look for:
- **Third-party integrations:** Stripe, Twilio, SendGrid, Google Maps, Firebase, AWS S3, etc.
- **Domain-specific logic:** medical calculations, financial compliance, geo-fencing, ML pipelines, etc.
- **Custom infrastructure:** WebSockets, CRON jobs, event sourcing, CQRS, GraphQL subscriptions, etc.
- **Industry-specific patterns:** e-commerce cart, booking systems, real-time tracking, chat, etc.

### STEP 2 — Compare against existing plugin capabilities

Read the list of existing skills:
```bash
ls ${CLAUDE_PLUGIN_ROOT}/skills/ | sort
```

For each domain-specific need from Step 1, check:
- Does an existing skill cover it? → No gap
- Does an existing agent have the knowledge? → No gap
- Neither? → **GAP FOUND**

### STEP 3 — Present gaps and recommendations

```
AskUserQuestion(
  question="I found [N] gaps — things this project needs that the plugin doesn't cover:

  1. [Gap] — e.g., 'Stripe payment processing — no payment skill exists'
     → Recommend: Create skills/stripe-payments/SKILL.md
  2. [Gap] — e.g., 'Real-time delivery tracking with WebSockets'
     → Recommend: Create skills/realtime-tracking/SKILL.md
  3. [Gap] — e.g., 'WhatsApp Business API integration'
     → Recommend: Create skills/whatsapp-integration/SKILL.md

  Should I create these project-specific skills?",
  options=[
    "Yes, create all recommended skills",
    "Let me pick which ones to create",
    "Skip — the existing skills are sufficient",
    "I have additional gaps to add"
  ]
)
```

### STEP 4 — Auto-create approved skills

For each approved gap, create a project-specific skill:

```bash
mkdir -p .claude/skills/[skill-name]
```

Write `.claude/skills/[skill-name]/SKILL.md` with:
```markdown
---
name: [skill-name]
description: "[One-line description of what this skill covers]"
---

# [Skill Name]

## When to Use
[When agents should apply this skill]

## Patterns
[Best practices, API patterns, error handling for this domain]

## Common Pitfalls
[What to avoid]

## References
[Official docs URLs]
```

**Use WebSearch to research best practices for each skill before writing it:**
```
WebSearch("[domain] best practices API integration 2026")
WebSearch("[domain] [framework from project-config] implementation guide")
```

### STEP 5 — Update task assignments if needed

If new skills were created, check if any tasks in tasks.md should reference them. If so, note which agents should load the new skills for Phase 3.

Write findings to `.claude/specs/[feature]/gap-analysis.md`.

## Expected Outputs
- `.claude/specs/[feature]/gap-analysis.md`
- `.claude/skills/[skill-name]/SKILL.md` (0 or more, based on gaps found)

## Content Validation
- `gap-analysis.md` exists (even if "no gaps found")
- User approved or explicitly skipped skill creation

## Conditional Logic
- **SMALL tasks:** Lightweight check — just scan tasks.md for third-party integrations. Skip if none found.
- **MEDIUM/BIG tasks:** Full analysis
