---
description: "Check context window usage — how much context is consumed, what's loaded, and recommendations for optimization."
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Analyze current context window usage and provide optimization tips.

## Steps
1. Run /context to check current usage
2. Identify large items consuming context:
   - CLAUDE.md size
   - Loaded skills
   - Conversation history
   - File contents in context
3. Recommend optimizations:
   - Skills to unload
   - Files to remove from context
   - When to /compact or /clear

## Output
```
╔══════════════════════════════════════╗
║       CONTEXT WINDOW STATUS          ║
╠══════════════════════════════════════╣
║                                      ║
║  Usage: 145K / 1M tokens (14.5%)    ║
║  ████░░░░░░░░░░░░░░░░░░░░░░ 14.5%  ║
║                                      ║
║  Breakdown:                          ║
║  ├── System prompt:     ~15K         ║
║  ├── CLAUDE.md:         ~3K          ║
║  ├── Loaded skills:     ~12K (4)     ║
║  ├── Agent definitions: ~8K (3)      ║
║  ├── File contents:     ~45K         ║
║  └── Conversation:      ~62K         ║
║                                      ║
║  💡 Recommendations:                 ║
║  • Context is healthy (< 50%)        ║
║  • Consider /compact at 50%          ║
║  • Use /clear when switching tasks   ║
║                                      ║
╚══════════════════════════════════════╝
```
