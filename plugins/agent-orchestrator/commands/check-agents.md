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
PLANNING:        product-manager, business-analyst, ux-researcher
DESIGN:          system-architect, api-architect, database-architect, ui-designer, agent-native-designer
TASK DECOMP:     task-decomposer
IMPLEMENTATION:  agent-native-developer, senior-engineer, backend-developer, python-developer,
                 frontend-developer, flutter-developer, kmp-developer
TESTING:         test-engineer, qa-automation
SECURITY:        security-auditor
REVIEW:          code-reviewer, performance-reviewer, static-analyzer, agent-native-reviewer, design-reviewer
DEVOPS:          devops-engineer, deployment-engineer
DOCUMENTATION:   technical-writer
ORCHESTRATION:   project-orchestrator, task-executor
TEAMS:           design-team, feature-team, review-team, planning-team
```

### 3. Skill Dependency Check
For each agent, verify its referenced skills are available:
```
product-manager → needs: project-requirements, user-story-writer, estimation-skill
backend-developer → needs: nestjs-patterns, api-implementation, error-handling, tdd-skill
python-developer → needs: tdd-skill, ai-integration, data-pipeline
frontend-developer → needs: react-patterns, frontend-design-extended, tdd-skill
flutter-developer → needs: flutter-patterns, tdd-skill
kmp-developer → needs: kmp-patterns, tdd-skill
agent-native-developer → needs: agent-native-design, agent-builder, mcp-builder-extended
agent-native-reviewer → needs: agent-native-design, agent-builder, mcp-builder-extended
test-engineer → needs: test-writer, webapp-testing, web-quality, accessibility-audit
security-auditor → needs: security-reviewer, dependency-audit, secrets-scanner
devops-engineer → needs: ci-cd-setup, docker-skill, aws-deployment, terraform-skills, k8s-skill, monitoring-setup, release-manager, env-setup
deployment-engineer → needs: release-manager, docker-skill, aws-deployment, monitoring-setup
```

### 4. Agent Team Verification
Check team definitions exist:
- [ ] feature-team.md (up to 7 members: agent-native-developer, backend, senior, python, frontend, flutter, kmp)
- [ ] design-team.md (5 members: system-architect, api-architect, database-architect, ui-designer, agent-native-designer)
- [ ] review-team.md (6 reviewers: code-reviewer, security-auditor, performance-reviewer, static-analyzer, agent-native-reviewer, spec-tracer via code-reviewer reuse)
- [ ] planning-team.md (7 members: product-manager, business-analyst, ux-researcher, system-architect, api-architect, database-architect, ui-designer)

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
║  TEAMS (4/4 configured)                      ║
║  ✅ feature-team    (7 members)              ║
║  ✅ design-team     (5 members)              ║
║  ✅ review-team     (6 reviewers)             ║
║  ✅ planning-team   (7 members)              ║
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
