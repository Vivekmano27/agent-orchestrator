# Plugin Over-Engineering Audit — Brainstorm

**Date:** 2026-03-15
**Status:** Decisions Made — Ready for Planning

## What We Found

Full audit of the Solo Dev Orchestrator plugin reveals it is **3-5x larger than necessary** for a typical Claude Code plugin. However, the user's goal is full-lifecycle orchestration, which justifies a larger-than-typical plugin.

### Scale Comparison

| Component | Current | Typical Plugin | After Optimization |
|---|---|---|---|
| Agents | 34 | 3-10 | **34 (keep all, smart-skip irrelevant ones)** |
| Skills | 64 | 10-20 | **64+ (keep all, expand thin ones)** |
| Commands | 26 | 5-10 | **26 (keep all)** |
| Phases | 9 | 2-4 | **9 (keep structure, smart-skip within)** |

### Critical Issues

1. **Full pipeline always runs**: SMALL/MEDIUM/BIG only controls gates, not agent participation
2. **Security-auditor runs twice**: Phase 5 (full) + Phase 6 (spot-check) — redundant
3. **Hooks assume specific structure**: Hard-coded paths for services/core-service, apps/web
4. **Orchestrator context bloat**: 700-810 line system prompts consuming context window
5. **Phantom phases**: mkdir and git-init are not phases (0, 2.5)
6. **Agent Teams dependency**: Phase 2 mandates experimental feature with no fallback
7. **15 thin skills (<50 lines)**: Could be expanded with more actionable content

### What's Actually Good

1. Gold-standard agent frontmatter (model routing, tool lists, descriptions)
2. No circular dependencies — clean unidirectional dispatch
3. No dead code — everything referenced
4. Clean naming conventions (kebab-case, consistent)
5. Professional directory structure
6. Phase 4→3 feedback loop (stuck/regression detection)
7. Smart cascade (/add-feature mid-pipeline)
8. Thoughtful approval gate scaling (SMALL=0, MEDIUM=1, BIG=4)

## Key Decisions (User-Confirmed)

1. **Keep all 34 agents** — don't cut, optimize dispatch instead
2. **Smart-skip optimization**: Orchestrator reads `project-config.md` and only dispatches agents for tech stack components that exist (no Flutter? skip flutter-developer, kmp-developer; no AI? skip python-developer; no agent-native? skip 3 agent-native agents)
3. **Keep all 64 skills** — expand thin ones with more detail rather than consolidating
4. **Fix security-auditor duplication**: Phase 5 runs full audit, Phase 6 review-team skips re-dispatching security-auditor (reads Phase 5 findings instead)
5. **Fix hooks**: Make hooks read service paths from `project-config.md` instead of hard-coding monorepo paths
6. **Quality AND speed**: Parallelize where possible, skip irrelevant agents per project config

## Resolved Questions

1. ~~Which agents to keep vs. cut?~~ **All 34 stay. Smart-skip handles irrelevant ones.**
2. ~~Which skills to consolidate?~~ **None. Expand thin skills instead.**
3. ~~Adaptive vs. fixed pipeline?~~ **Adaptive: smart-skip based on project-config.md.**
4. ~~Migration path?~~ **Incremental: optimize orchestrator dispatch logic first, then fix bugs.**

## Open Questions

None — all resolved through collaborative dialogue.

## Optimization Scope

### Priority 1: Smart-Skip in Orchestrator
- Read `project-config.md` at pipeline start
- Build active-agent list based on tech stack
- Skip agents whose domain isn't in the project
- Expected savings: 5-8 agents skipped per typical run

### Priority 2: Security-Auditor Deduplication
- Phase 5: Full OWASP + STRIDE audit (keep as-is)
- Phase 6: review-team reads `security-audit.md` findings, does NOT re-dispatch security-auditor
- Removes redundant second invocation

### Priority 3: Dynamic Hooks
- Replace hard-coded service paths in hooks.json
- Read lint/test commands from `project-config.md`
- Hooks work for any project structure, not just the assumed monorepo

### Priority 4: Expand Thin Skills
- 15 skills under 50 lines need more actionable content
- Add concrete examples, patterns, checklists
- Target: every skill ≥ 80 lines of useful content

## Next Steps

Run `/ce:plan` to create the implementation plan for these 4 priorities.
