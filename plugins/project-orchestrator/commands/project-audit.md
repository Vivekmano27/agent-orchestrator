---
description: "Analyze a project and identify what agents, skills, and commands are MISSING that need to be created specifically for this project. Scans tech stack, features, and integrations against plugin capabilities. Can auto-create project-specific skills."
argument-hint: "[path to project or 'current']"
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.

## Mission

Standalone gap analysis — can be run anytime, not just during the pipeline. Scans the project and tells you what project-specific agents, skills, or commands need to be CREATED that don't already exist in the plugin.

## Steps

### STEP 1 — Detect project context

```bash
# Check for project-config.md
Glob(".claude/specs/*/project-config.md")

# If no project-config, scan for tech stack indicators
Glob("**/package.json")
Glob("**/requirements.txt")
Glob("**/pubspec.yaml")
Glob("**/build.gradle.kts")
Glob("**/.env.example")
```

Read whatever exists to understand: tech stack, frameworks, third-party services, integrations.

### STEP 2 — Scan for domain-specific needs

Read project files looking for:

```bash
# Third-party SDKs and integrations
Grep("stripe|razorpay|paypal|twilio|sendgrid|firebase|supabase|aws-sdk|google-maps|mapbox|algolia|elasticsearch|redis|rabbitmq|kafka|socket.io|pusher|cloudinary|s3", type="json,ts,py,dart,kt")

# Domain-specific patterns
Grep("cron|scheduler|queue|worker|webhook|websocket|graphql|subscription|event.source|saga|cqrs", type="json,ts,py,dart,kt")

# Check existing project-specific skills
ls .claude/skills/ 2>/dev/null
```

### STEP 3 — Compare against plugin capabilities

```bash
# List all plugin skills
ls ${CLAUDE_PLUGIN_ROOT}/skills/ | sort
```

For each integration/domain found in Step 2:
- Check if a plugin skill covers it → no gap
- Check if a project-specific skill already exists in `.claude/skills/` → no gap
- Neither → **GAP**

### STEP 4 — Present findings

```
AskUserQuestion(
  question="Project audit complete. Here's what I found:

  COVERED by existing plugin skills:
  - [list of integrations already covered]

  GAPS — need project-specific skills:
  1. [Integration/domain] — no skill exists
  2. [Integration/domain] — no skill exists

  ALREADY have project-specific skills:
  - [list from .claude/skills/]

  Should I create skills for the gaps?",
  options=[
    "Yes, create all",
    "Let me pick which ones",
    "No gaps are important — skip",
    "I have additional integrations to add"
  ]
)
```

### STEP 5 — Create project-specific skills

For each approved gap:

1. **Research best practices** using WebSearch:
```
WebSearch("[integration] [framework] best practices API 2026")
WebSearch("[integration] official documentation SDK")
```

2. **Create the skill** at `.claude/skills/[name]/SKILL.md`:
```markdown
---
name: [name]
description: "[What this skill covers — specific to this project]"
---

# [Skill Name]

## When to Use
[When agents should apply this skill]

## Setup
[Installation, API keys, configuration needed]

## Patterns
[Best practices, code patterns, error handling]

## Common Pitfalls
[What to avoid, rate limits, gotchas]

## Testing
[How to test this integration — mocking, sandbox mode]

## References
[Official docs URLs]
```

### STEP 6 — Report

Write `.claude/project-audit.md` with:
- Date of audit
- Gaps found and skills created
- Integrations already covered
- Recommendations for agents/commands if any

## Rules
- NEVER create skills that duplicate existing plugin skills
- ALWAYS use WebSearch to research before writing a skill — don't guess
- Project-specific skills go in `.claude/skills/` (project dir), NOT in the plugin
- If a gap is too broad (e.g., "needs AI"), don't create a skill — it's already covered by existing agents
