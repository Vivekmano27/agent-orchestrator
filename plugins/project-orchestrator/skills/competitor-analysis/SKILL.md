---
name: competitor-analysis
description: Research and compare competing products, features, pricing, and market positioning to inform product decisions. Use when the user asks about competitors, market research, competitive landscape, feature comparison, or needs to understand what alternatives exist.
allowed-tools: Read, Bash, Grep, Glob
---

# Competitor Analysis Skill

Research, score, and document the competitive landscape. Output a structured comparison matrix with scoring rubric.

## Constraints

- NEVER invent competitor data. If you cannot verify a data point, mark it `[UNVERIFIED]` and note the source you would check.
- NEVER list more than 5 competitors. Focus on the 3-5 most relevant direct competitors, not tangentially related products.
- NEVER skip the scoring rubric. Every feature row MUST have a 1-5 numeric score, not just checkmarks.
- Every recommendation MUST cite a specific finding from the matrix (e.g., "Competitor X scores 5 on onboarding while we score 2 — prioritize guided setup").
- Always include a "Last Verified" date. Competitor data goes stale fast.

## Output Format

Write output to `.claude/specs/[feature]/competitor-analysis.md` using this exact structure:

```markdown
# Competitive Analysis: [Product Category]
**Last Verified:** [YYYY-MM-DD]
**Analyst Context:** [What triggered this analysis — e.g., "Pre-launch positioning for [product]"]

## Executive Summary
[3-5 bullet points. Lead with the single most actionable insight.]

## Scoring Rubric
| Score | Meaning             | Criteria                                         |
|-------|---------------------|--------------------------------------------------|
| 1     | Missing             | Feature does not exist                           |
| 2     | Basic               | Feature exists but is minimal / buggy / limited  |
| 3     | Adequate            | Feature works but nothing notable                |
| 4     | Strong              | Feature is well-executed, above average          |
| 5     | Best-in-class       | Industry-leading implementation                  |

## Comparison Matrix
| Dimension              | Our Product | [Comp A] | [Comp B] | [Comp C] |
|------------------------|-------------|----------|----------|----------|
| **Core Features**      |             |          |          |          |
| [Feature 1]            | [1-5]       | [1-5]    | [1-5]    | [1-5]    |
| [Feature 2]            | [1-5]       | [1-5]    | [1-5]    | [1-5]    |
| [Feature 3]            | [1-5]       | [1-5]    | [1-5]    | [1-5]    |
| **UX / Onboarding**    |             |          |          |          |
| Time to first value    | [1-5]       | [1-5]    | [1-5]    | [1-5]    |
| Documentation quality  | [1-5]       | [1-5]    | [1-5]    | [1-5]    |
| **Pricing**            |             |          |          |          |
| Free tier              | [desc]      | [desc]   | [desc]   | [desc]   |
| Paid entry point       | [$]         | [$]      | [$]      | [$]      |
| Enterprise             | [$]         | [$]      | [$]      | [$]      |
| **Technical**          |             |          |          |          |
| API / Integrations     | [1-5]       | [1-5]    | [1-5]    | [1-5]    |
| Performance / Scale    | [1-5]       | [1-5]    | [1-5]    | [1-5]    |
| **Market Position**    |             |          |          |          |
| Target segment         | [who]       | [who]    | [who]    | [who]    |
| Estimated market share | [%/rank]    | [%/rank] | [%/rank] | [%/rank] |
| Key differentiator     | [what]      | [what]   | [what]   | [what]   |
| **TOTAL (features)**   | [sum/max]   | [sum/max]| [sum/max]| [sum/max]|

## Per-Competitor Deep Dive

### [Competitor A]
- **What they do well:** [specific feature/UX with evidence]
- **Where they fall short:** [specific weakness]
- **Pricing model:** [free/freemium/paid, tiers, per-seat vs flat]
- **Tech stack signals:** [what you can infer from job posts, docs, public repos]
- **Recent trajectory:** [growing/stable/declining, recent funding, product launches]
- **Threat level:** Low | Medium | High — [one sentence justification]

[Repeat for each competitor]

## Gap Analysis
| Gap (we lack, they have)          | Which competitors | Impact | Effort to close |
|-----------------------------------|-------------------|--------|-----------------|
| [Missing feature/capability]      | [Comp A, Comp B]  | H/M/L  | S/M/L/XL        |

## Strategic Recommendations
1. **[Action]** — [Justification citing specific matrix scores or gaps]
2. **[Action]** — [Justification]
3. **[Action]** — [Justification]
```

## Data Gathering Workflow

When researching each competitor, gather in this order:

1. **Product surface** — Sign-up flow, free tier, core UI, feature list from marketing site
2. **Pricing page** — Tiers, per-seat vs usage-based, enterprise contact-us signals
3. **Documentation** — API reference quality, SDK support, integration list
4. **Public engineering signals** — GitHub repos (stars, activity), job postings (tech stack), blog/changelog (ship velocity)
5. **Community signals** — Reddit/HN mentions, G2/Capterra reviews (filter to last 12 months), Twitter/X sentiment
6. **Business signals** — Crunchbase funding, employee count trends on LinkedIn, recent press

For each data point, note the source. If a source is unavailable (e.g., no web search tool), mark the field `[NEEDS VERIFICATION — check: URL/source]`.

## Anti-Patterns to Avoid

- Do not list 10+ competitors in a shallow table. Depth on 3-5 beats breadth on 15.
- Do not copy marketing language as fact. "Enterprise-grade security" means nothing without specifics.
- Do not treat feature presence as feature quality. A competitor having "AI search" as a checkbox tells you nothing about whether it works.
- Do not assume pricing is static. Note the date you verified it.

## Checklist

- [ ] 3-5 competitors identified (not 10+ shallow entries)
- [ ] Feature comparison matrix with specific capabilities (not just checkboxes)
- [ ] Pricing tiers documented with date verified
- [ ] Strengths and weaknesses per competitor (with evidence, not marketing copy)
- [ ] Market positioning map or differentiation summary
- [ ] Sources cited for every data point
- [ ] Recommendations for product strategy based on findings
