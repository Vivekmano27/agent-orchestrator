---
description: "Track API token usage and costs per session — shows tokens consumed, estimated cost, and per-agent breakdown. Helps manage Team/Enterprise plan limits."
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Show token usage and cost estimates for the current session.

## Steps
1. Run `/usage` to get current session token count
2. Estimate costs based on model usage:
   - Opus: ~$15/M input, ~$75/M output tokens
   - Sonnet: ~$3/M input, ~$15/M output tokens
3. Show breakdown by agent (estimate from conversation history)

## Output Format
```
╔═════════════════════════════════════════╗
║         SESSION COST TRACKER            ║
╠═════════════════════════════════════════╣
║ Session Duration: 2h 15m                ║
║                                         ║
║ Token Usage:                            ║
║  Input:  145,000 tokens                 ║
║  Output:  52,000 tokens                 ║
║  Total:  197,000 tokens                 ║
║                                         ║
║ Estimated Cost:                         ║
║  Opus agents:   ~$3.20                  ║
║  Sonnet agents: ~$0.85                  ║
║  Total:         ~$4.05                  ║
║                                         ║
║ Top Consumers:                          ║
║  senior-engineer:      45K tokens       ║
║  test-engineer:        32K tokens       ║
║  project-orchestrator: 28K tokens       ║
║                                         ║
║ 💡 Tip: Use /switch-model to move       ║
║    non-critical agents to Sonnet        ║
╚═════════════════════════════════════════╝
```
