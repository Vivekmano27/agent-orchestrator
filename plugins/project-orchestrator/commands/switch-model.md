---
description: "Switch agent models between Opus and Sonnet for cost optimization. Opus for complex reasoning (architecture, security), Sonnet for execution (implementation, testing)."
argument-hint: "<agent-name> <opus|sonnet> OR <preset: cost-saver|balanced|max-quality>"
disable-model-invocation: true
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Switch agent models for cost optimization or quality adjustment.

## Presets
### cost-saver (minimize spend)
Set ALL agents to Sonnet except: project-orchestrator, security-auditor

### balanced (default — recommended)
Opus: project-orchestrator, system-architect, api-architect, database-architect,
      senior-engineer, security-auditor, code-reviewer
Sonnet: everything else

### max-quality (all Opus — expensive)
Set ALL agents to Opus

## Individual Switch
```
/switch-model backend-developer sonnet   → switches one agent
/switch-model cost-saver                 → switches all to preset
```

## Implementation
Edit the `model:` field in each agent's .md frontmatter in .claude/agents/
