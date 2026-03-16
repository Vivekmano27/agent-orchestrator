---
description: "Start building something new — alias for /new. Runs the full 9-phase pipeline with smart dispatch."
argument-hint: "<what you want to build>"
disable-model-invocation: true
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Alias for /new. Routes to project-orchestrator which runs the full 9-phase pipeline.
Smart dispatch skips agents whose tech stack is absent from project-config.md.
Each phase loads just-in-time instructions from skills/phase-runner/phases/ for focused execution.
