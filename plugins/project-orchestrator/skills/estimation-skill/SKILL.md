---
name: estimation-skill
description: Provide story point and time estimates for features and tasks using complexity analysis, historical patterns, and risk assessment. Use when the user asks "how long will this take", "estimate this feature", "story points", "effort estimation", or needs to plan sprints and timelines.
allowed-tools: Read, Grep, Glob
---

# Estimation Skill

Provide realistic effort estimates for features and tasks.

## Estimation Framework

### Complexity Factors
| Factor | Low (1) | Medium (2) | High (3) |
|--------|---------|-----------|----------|
| Code Changes | 1-3 files | 4-10 files | 10+ files |
| New Concepts | None | 1-2 new patterns | New architecture |
| Dependencies | None | 1-2 services | Cross-team/external |
| Testing | Simple unit tests | Integration tests | E2E + edge cases |
| Risk | Well-understood | Some unknowns | Significant unknowns |

### Effort Mapping
| Total Score | Size | Story Points | Solo Dev Time |
|------------|------|-------------|--------------|
| 5-7 | S | 1-2 | < 4 hours |
| 8-10 | M | 3-5 | 1-2 days |
| 11-13 | L | 8-13 | 3-5 days |
| 14-15 | XL | 13-21 | 1-2 weeks |

### Risk Multipliers
- New technology: ×1.5
- External API dependency: ×1.3
- No existing tests: ×1.4
- Unclear requirements: ×1.5-2.0

## Output Format
```markdown
## Estimation: [Feature Name]
| Factor | Score | Reasoning |
|--------|-------|-----------|
| Code Changes | [1-3] | [why] |
| New Concepts | [1-3] | [why] |
| Dependencies | [1-3] | [why] |
| Testing | [1-3] | [why] |
| Risk | [1-3] | [why] |
| **Total** | **[sum]** | |
| **Size** | **[S/M/L/XL]** | |
| **Story Points** | **[range]** | |
| **Estimated Time** | **[range]** | |
| **Risk Multiplier** | **[if any]** | [reason] |
| **Final Estimate** | **[adjusted]** | |
```
