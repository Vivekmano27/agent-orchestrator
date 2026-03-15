# Brainstorm: Phase 7 DevOps & Deployment Gaps

**Date:** 2026-03-15
**Status:** Ready for implementation

## What We're Building

Close 13 gaps in Phase 7 (DevOps & Deployment) to bring it to the same reliability standard as Phases 4-6. Phase 7 currently has no failure detection, no feedback loop, a thin deployment-engineer (49 lines, no output file, hardcoded topology), and several skills that underdeliver on their descriptions.

## Key Decisions

1. **Full feedback loop like Phase 6→3** — structured finding list with INF-NNN IDs, re-dispatch failed agent, scoped re-check, max 1 round-trip, regression/stuck detection.
2. **Expand deployment-engineer substantially** — project-config.md aware, dynamic deployment order, writes to `deployment-plan.md`, rollback procedures, health checks, smoke tests.
3. **Replace devops-engineer hardcoded templates** with project-config.md-driven conditional sections. Let skills provide actual templates.
4. **Expand all 3 thin skills** — ci-cd-setup (add GitLab CI + Jenkins), docker-skill (add Python/Go/multi-stage), aws-deployment (add GCP/Azure).
5. **Fix skip condition both sides** — add "none" to project-setup options AND update orchestrator to also accept "not decided".
6. **Add Phase 7 to failure detection** — expect `deploy-monitoring.md` + `deployment-plan.md`.
7. **Phase 8 handoff** — technical-writer reads Phase 7 output for deployment docs.

## Changes Required

### Structural (project-orchestrator.md)
- Add Phase 7 to subagent failure detection (expect deploy-monitoring.md + deployment-plan.md)
- Add Phase 7→7 feedback loop (retry failed agent with error context, max 1 round-trip)
- Update skip condition to also accept "not decided"
- Update escalation rules to mention Phase 7 feedback loop

### Agent Fixes
- **deployment-engineer.md**: Expand from 49 lines — add project-config.md reading, dynamic deployment order, write to deployment-plan.md, rollback procedure, health checks, smoke tests
- **devops-engineer.md**: Replace hardcoded templates with conditional patterns driven by project-config.md. Fix "Skills loaded" line (missing env-setup)
- **project-setup.md**: Add "none (local development only)" to Cloud Provider options
- **technical-writer.md**: Add instruction to read deploy-monitoring.md and deployment-plan.md from Phase 7

### Skill Expansion
- **ci-cd-setup/SKILL.md**: Add GitLab CI and Jenkins templates alongside GitHub Actions
- **docker-skill/SKILL.md**: Add Python, Go, and generic multi-stage Dockerfile templates
- **aws-deployment/SKILL.md**: Add GCP and Azure deployment patterns

### Reference Fixes
- **check-agents.md**: Add missing 4 devops-engineer skills, add deployment-engineer entry
- **devops-engineer.md**: Fix "Skills loaded" body text (7→8, add env-setup)
