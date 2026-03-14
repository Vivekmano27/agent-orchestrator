# Product Context

This file provides product context to all planning agents (product-manager, business-analyst, ux-researcher).
Fill in each section before running `/build-feature` or `/new` for best results. Agents will still work
without this filled in, but their output quality improves significantly with product context.

## Vision
<!-- Write 1-2 sentences describing what the finished product does -->
[Fill in: What this product will become]

**Example:** _"A project management SaaS that helps remote teams track work across time zones with async-first collaboration."_

## Problem Statement
<!-- What specific pain does this solve? Who has this pain? How big is it? -->
[Fill in: What pain point this solves and for whom]

**Example:** _"Remote teams waste 3+ hours/week in status meetings because existing tools (Jira, Asana) require synchronous check-ins. This affects 40M+ remote knowledge workers globally."_

## Target Users
- **Primary:** [Fill in: Role, technical level, key characteristic]
  _Example: "Engineering managers at 20-100 person remote-first companies, comfortable with dev tools, managing 3-8 direct reports"_
- **Secondary:** [Fill in: Who else uses it?]
  _Example: "Individual contributors who update task status daily"_

## User Personas (optional)
<!-- Helps agents write better user stories and UX flows -->

### Persona 1: [Name]
- **Role:** [Job title]
- **Goal:** [What they want to achieve]
- **Pain:** [What frustrates them today]
- **Tech comfort:** [Low / Medium / High]

## Success Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| [Fill in: What to measure] | [Target value] | [How to measure it] |

_Example rows:_

| Metric | Target | Measurement |
|--------|--------|-------------|
| User activation rate | >60% in first week | % of signups who create 1+ project |
| Task completion rate | >80% of created tasks | Tasks moved to "done" / total tasks |
| API response time | <200ms p95 | CloudWatch latency metrics |
| User retention | >70% monthly | MAU / total registered users |

## Domain Terminology
<!-- Define key terms so all agents use consistent language in code, APIs, and docs.
     This directly affects variable names, table names, API routes, and UI labels. -->

| Term | Definition | Maps to |
|------|-----------|---------|
| [Fill in: Term] | [What it means] | [Code/DB mapping] |

_Example:_

| Term | Definition | Maps to |
|------|-----------|---------|
| Workspace | A team's top-level container | `workspaces` table |
| Sprint | A time-boxed iteration, always 2 weeks | `sprints` table |
| Epic | Collection of related user stories spanning sprints | `epics` table |
| Story points | Relative effort estimate (Fibonacci: 1,2,3,5,8,13) | `story_points` column |

## Competitive Landscape (optional)
<!-- Helps product-manager agent position features and prioritize differentiation -->

| Competitor | Strength | Weakness | Our Differentiation |
|-----------|----------|----------|---------------------|
| [Name] | [What they do well] | [Where they fall short] | [How we're different] |

## Constraints
<!-- Business or technical constraints that agents should respect during design and implementation -->

- [Fill in: e.g., "Must support offline mode for mobile"]
- [Fill in: e.g., "GDPR compliant from day one"]
- [Fill in: e.g., "Budget: keep cloud costs under $X/month for first 1000 users"]
