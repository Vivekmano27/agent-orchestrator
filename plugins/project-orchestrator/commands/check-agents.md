---
description: "Verify all agents are loaded, properly configured, and have their required skills available. Reports agent health status."
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Check that all agents in the solo-dev-orchestrator plugin are properly installed and functional, along with all commands and skills. Run `validate-plugin.sh` for the automated check, then verify agent details below.

## Checks to Perform

### 1. Agent File Verification
For each expected agent, verify:
- [ ] .md file exists in .claude/agents/ (or plugin agents/)
- [ ] YAML frontmatter is valid (name, description, tools, model, skills)
- [ ] Referenced skills exist and are loadable

### 2. Expected Agents List
```
PLANNING:        product-manager, business-analyst, ux-researcher (managed by planning-team in Phase 1)
DESIGN:          system-architect, api-architect, database-architect, ui-designer, agent-native-designer
TASK DECOMP:     task-decomposer
IMPLEMENTATION:  agent-native-developer, senior-engineer, backend-developer, python-developer,
                 frontend-developer, flutter-developer, kmp-developer
TESTING:         test-engineer, qa-automation
SECURITY:        security-auditor
DESIGN REVIEW:   design-reviewer (dispatched by design-team in Phase 2 for MEDIUM/BIG)
REVIEW:          code-reviewer, performance-reviewer, static-analyzer, agent-native-reviewer
REVIEW ROLES:    spec-tracer (NOT a standalone agent — role performed by code-reviewer with specialized prompt)
DEVOPS:          devops-engineer, deployment-engineer
DOCUMENTATION:   technical-writer
ORCHESTRATION:   project-orchestrator, task-executor
TEAMS:           design-team, feature-team, review-team, planning-team, quality-team
```

### 3. Skill Dependency Check
For each agent, verify its referenced skills are available:
```
product-manager → needs: project-requirements, user-story-writer, estimation-skill
backend-developer → needs: nestjs-patterns, api-implementation, error-handling, tdd-skill, code-documentation
python-developer → needs: tdd-skill, api-implementation, error-handling, ai-integration, data-pipeline, python-django-patterns, agent-builder, workflow-automation, code-documentation
frontend-developer → needs: react-patterns, frontend-design-extended, tdd-skill, code-simplify, analytics-setup, data-visualization, code-documentation
flutter-developer → needs: flutter-patterns, tdd-skill, code-simplify, code-documentation
kmp-developer → needs: kmp-patterns, tdd-skill, code-simplify, code-documentation
agent-native-developer → needs: agent-native-design, agent-builder, mcp-builder-extended
agent-native-reviewer → needs: agent-native-design, agent-builder, mcp-builder-extended
test-engineer → needs: test-writer, webapp-testing, web-quality, accessibility-audit, api-tester, load-tester
security-auditor → needs: security-reviewer, dependency-audit, secrets-scanner, threat-modeling, compliance-checker
devops-engineer → needs: ci-cd-setup, docker-skill, aws-deployment, terraform-skills, k8s-skill, monitoring-setup, release-manager, env-setup
deployment-engineer → needs: release-manager, docker-skill, aws-deployment, monitoring-setup
design-reviewer → needs: system-architect, api-designer, database-designer, security-reviewer
task-decomposer → needs: task-breakdown, estimation-skill, spec-driven-dev
system-architect → needs: system-architect, nestjs-patterns, docker-skill, aws-deployment, terraform-skills, monorepo-manager
senior-engineer → needs: fullstack-dev, nestjs-patterns, react-patterns, flutter-patterns, kmp-patterns, tdd-skill, code-simplify, error-handling, performance-optimizer, git-workflow, migration-skill, code-documentation
code-reviewer → needs: code-review, nestjs-patterns, react-patterns, flutter-patterns, python-django-patterns, kmp-patterns, code-documentation
```

### 4. Agent Team Verification
Check team definitions exist:
- [ ] feature-team.md (up to 7 members: agent-native-developer, backend, senior, python, frontend, flutter, kmp)
- [ ] design-team.md (5 designers + 1 reviewer: system-architect, api-architect, database-architect, ui-designer, agent-native-designer, design-reviewer)
- [ ] review-team.md (5 reviewers + 1 role: code-reviewer, security-auditor, performance-reviewer, static-analyzer, agent-native-reviewer; spec-tracer is a role performed by code-reviewer with specialized prompt — NOT a standalone agent)
- [ ] planning-team.md (4 members: product-manager, business-analyst, ux-researcher, requirements-reviewer)
- [ ] quality-team.md (2 members: test-engineer, qa-automation)

## Output Format
```
╔══════════════════════════════════════════════╗
║           AGENT HEALTH CHECK                 ║
╠══════════════════════════════════════════════╣
║                                              ║
║  AGENTS (N/N loaded — run validate-plugin.sh) ║
║  [List all agents found with model + skills] ║
║  Include: agent-native-developer [opus]      ║
║           flutter-developer [sonnet]         ║
║           kmp-developer [sonnet]             ║
║           agent-native-reviewer [opus]       ║
║           ... and all other agents           ║
║                                              ║
║  TEAMS (5/5 configured)                      ║
║  ✅ feature-team    (7 members)              ║
║  ✅ design-team     (5 designers + 1 reviewer) ║
║  ✅ review-team     (5 reviewers + 1 role)    ║
║  ✅ planning-team   (4 members)              ║
║  ✅ quality-team    (2 members)              ║
║                                              ║
║  COMMANDS (N available)                      ║
║  ✅ All commands loaded                      ║
║                                              ║
║  SKILLS DEPENDENCIES                         ║
║  ✅ All referenced skills found              ║
║  ⚠️  Missing: load-tester (optional)         ║
║                                              ║
║  OVERALL: ✅ HEALTHY                         ║
╚══════════════════════════════════════════════╝
```
