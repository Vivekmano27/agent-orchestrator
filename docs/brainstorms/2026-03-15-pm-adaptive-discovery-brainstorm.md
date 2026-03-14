# Brainstorm: Adaptive Requirements Discovery for Product Manager Agent

**Date:** 2026-03-15
**Status:** Active

---

## What We're Building

An adaptive 3-tier requirements discovery system for the product-manager agent that scales question depth based on application complexity. The PM becomes the single owner of all requirements discovery (orchestrator only asks tech stack). BA and UX get their own domain-specific question flows (not product questions).

## Why This Approach

The current system has 3 overlapping question layers (orchestrator Step 0, PM Step 0, project-requirements skill) totaling 23 potential questions with significant duplication. For simple apps, 5 questions are too few (misses auth, integrations, compliance). For complex apps, the PM guesses instead of asking. The orchestrator's feature scope options are hardcoded for a todo app ("CRUD + priority + due dates") and make no sense for other domains.

Reference: [msitarzewski/agency-agents SeniorProjectManager](https://github.com/msitarzewski/agency-agents/blob/main/project-management/project-manager-senior.md) — emphasizes scope discipline, anti-gold-plating, and basic-first approach.

## Key Decisions

1. **Single owner for requirements:** PM owns ALL product discovery. Orchestrator only asks tech stack + run method (2 questions, not 3). Feature scope question moves to PM.

2. **3-tier adaptive questioning:**
   - **Tier 1 (always, 5-6 questions):** Core purpose, target users, MVP features, out of scope, platforms, release phases (v1 vs v2)
   - **Tier 2 (adaptive, 3-5 questions):** PM detects domain from Tier 1 answers and asks targeted follow-ups per domain category
   - **Tier 3 (optional, user-triggered):** "Want me to dig deeper?" with selectable categories

3. **Domain detection categories for Tier 2:**
   - **E-commerce/Marketplace:** Payment provider, inventory model, shipping, product catalog structure
   - **SaaS/B2B:** Multi-tenancy model, subscription/billing, team management, SSO/SAML
   - **Social/Community:** Content moderation, notifications model, real-time needs, feed algorithm
   - **Healthcare/Fintech:** Compliance (HIPAA/PCI-DSS/SOC2), audit trails, data encryption requirements
   - **Internal tools:** LDAP/SSO integration, role hierarchy, reporting needs
   - **AI/ML platform:** Model serving, training pipeline, cost controls, rate limiting
   - **General/Other:** Auth model, third-party integrations, data import/migration

4. **Scope discipline (from reference agent):** PM marks features not explicitly requested as "OPTIONAL — not requested by user." Basic implementation is default; polish comes in revision cycles.

5. **Full context handoff:** Orchestrator passes tech stack choice, run method, and original user request to PM in dispatch prompt. PM skips questions already answered.

6. **BA gets domain-specific questions:** Not product discovery — asks about workflows, approval chains, business rules, SLAs, audit requirements. Works from PRD but asks 2-3 targeted domain questions.

7. **UX gets domain-specific questions:** Not product discovery — asks about colors/brand preferences, reference apps ("like Notion but for X"), design system preferences, accessibility level, existing brand guidelines. Works from PRD but asks 2-3 targeted design questions.

8. **Phased delivery:** PM asks about release phases during Tier 1 — "What's in v1 vs v2?" This shapes the entire PRD.

## Scope of Changes

### Files to modify:
- `plugins/agent-orchestrator/agents/project-orchestrator.md` — Remove feature scope question from Step 0 (keep tech stack + run method only). Update PM dispatch prompt to include full context.
- `plugins/agent-orchestrator/agents/product-manager.md` — Replace current 5-question Step 0 with 3-tier adaptive system. Add domain detection logic. Add scope discipline rules.
- `plugins/agent-orchestrator/agents/business-analyst.md` — Add 2-3 structured domain questions (workflows, approvals, business rules).
- `plugins/agent-orchestrator/agents/ux-researcher.md` — Add 2-3 structured design questions (colors, brand, reference apps, accessibility level).
- `plugins/agent-orchestrator/skills/project-requirements/SKILL.md` — Deduplicate with PM's new question flow. Convert 15-question template to reference material (not a competing interview).

### Files NOT modified:
- Other agents (system-architect, api-architect, etc.) — they consume the PRD, no changes needed.
- Skills other than project-requirements — no overlap.

## Resolved Questions

1. **App types:** All kinds — e-commerce, SaaS, social, healthcare, fintech, internal tools. Questions must be generic enough for any domain.
2. **Question ownership:** Single owner — PM owns all requirements discovery.
3. **Depth control:** Adaptive tiers — core questions always, domain-specific follow-ups based on detected app type.
4. **Scope control:** Suggest but flag — PM can suggest features but marks them "OPTIONAL — not requested."
5. **Context handoff:** Full context — orchestrator passes all Step 0 answers to PM.
6. **BA/UX questions:** Domain-specific only — UX asks design questions (colors, brand, references), BA asks workflow questions (approvals, rules, SLAs). Neither re-asks product questions.
7. **Phased delivery:** PM handles — asks about v1 vs v2 during discovery.
