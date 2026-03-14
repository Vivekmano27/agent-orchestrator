---
description: "Verify all agents are loaded, properly configured, and have their required skills available. Reports agent health status."
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Check that all 21 agents in the solo-dev-orchestrator plugin are properly installed and functional.

## Checks to Perform

### 1. Agent File Verification
For each expected agent, verify:
- [ ] .md file exists in .claude/agents/ (or plugin agents/)
- [ ] YAML frontmatter is valid (name, description, tools, model, skills)
- [ ] Referenced skills exist and are loadable

### 2. Expected Agents List
```
PLANNING:        product-manager, business-analyst, ux-researcher
DESIGN:          system-architect, api-architect, database-architect, ui-designer
IMPLEMENTATION:  senior-engineer, backend-developer, frontend-developer, python-developer
TESTING:         test-engineer, qa-automation
SECURITY:        security-auditor
REVIEW:          code-reviewer, performance-reviewer
DEVOPS:          devops-engineer, deployment-engineer
DOCUMENTATION:   technical-writer
ORCHESTRATION:   project-orchestrator, task-executor
```

### 3. Skill Dependency Check
For each agent, verify its referenced skills are available:
```
product-manager → needs: project-requirements, user-story-writer, estimation-skill
backend-developer → needs: nestjs-patterns, api-implementation, error-handling, tdd-skill
python-developer → needs: tdd-skill, ai-integration, data-pipeline
frontend-developer → needs: react-patterns, flutter-patterns, kmp-patterns
test-engineer → needs: test-writer, webapp-testing, web-quality, accessibility-audit
security-auditor → needs: security-reviewer, dependency-audit, secrets-scanner
devops-engineer → needs: ci-cd-setup, docker-skill, aws-deployment, terraform-skills
```

### 4. Agent Team Verification
Check team definitions exist:
- [ ] feature-team.md (backend + frontend + tester + reviewer)
- [ ] review-team.md (code-reviewer + security + performance)
- [ ] planning-team.md (product-manager + architects + designer)

## Output Format
```
╔══════════════════════════════════════════════╗
║           AGENT HEALTH CHECK                 ║
╠══════════════════════════════════════════════╣
║                                              ║
║  AGENTS (21/21 loaded)                       ║
║  ✅ product-manager      [opus]  3 skills    ║
║  ✅ business-analyst      [sonnet] 2 skills  ║
║  ✅ ux-researcher         [sonnet] 2 skills  ║
║  ✅ system-architect      [opus]  5 skills   ║
║  ✅ api-architect         [opus]  2 skills   ║
║  ✅ database-architect    [opus]  2 skills   ║
║  ✅ ui-designer           [sonnet] 5 skills  ║
║  ✅ senior-engineer       [opus]  9 skills   ║
║  ✅ backend-developer     [sonnet] 4 skills  ║
║  ✅ frontend-developer    [sonnet] 6 skills  ║
║  ✅ python-developer      [sonnet] 5 skills  ║
║  ✅ test-engineer         [sonnet] 6 skills  ║
║  ✅ qa-automation         [sonnet] 3 skills  ║
║  ✅ security-auditor      [opus]  5 skills   ║
║  ✅ code-reviewer         [opus]  4 skills   ║
║  ✅ performance-reviewer  [sonnet] 3 skills  ║
║  ✅ devops-engineer       [sonnet] 7 skills  ║
║  ✅ deployment-engineer   [sonnet] 3 skills  ║
║  ✅ technical-writer      [sonnet] 4 skills  ║
║  ✅ project-orchestrator  [opus]  4 skills   ║
║  ✅ task-executor         [sonnet] 5 skills  ║
║                                              ║
║  TEAMS (3/3 configured)                      ║
║  ✅ feature-team    (4 members)              ║
║  ✅ review-team     (3 members)              ║
║  ✅ planning-team   (4 members)              ║
║                                              ║
║  COMMANDS (15 available)                     ║
║  ✅ All commands loaded                      ║
║                                              ║
║  SKILLS DEPENDENCIES                         ║
║  ✅ All referenced skills found              ║
║  ⚠️  Missing: load-tester (optional)         ║
║                                              ║
║  OVERALL: ✅ HEALTHY                         ║
╚══════════════════════════════════════════════╝
```
