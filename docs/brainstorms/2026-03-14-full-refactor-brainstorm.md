# Brainstorm: Solo Dev Orchestrator — Full Refactor

**Date:** 2026-03-14
**Status:** Resolved

---

## What We're Fixing

The Solo Dev Orchestrator is a Claude Code plugin with 24 agents, 25 commands, 63 skills, hooks, and steering docs — all markdown. It's designed to orchestrate microservices application development. After analysis, we identified **5 categories of issues** that need to be addressed.

---

## Issue 1: Install Script & README Bugs

### Install Script (`install.sh`)
- **Line 56:** `cp "$SCRIPT_DIR"/hooks/*.sh` — hooks directory contains `hooks.json`, not `.sh` files. This step fails silently.
- **Line 57:** `chmod +x "$DEST/.claude/hooks/"*.sh` — also broken since no `.sh` files exist.
- **Lines 4, 43, 49:** Count claims are wrong: says "17 commands, 62 skills" but actual counts are 25 commands, 63 skills.

### README.md
- Claims 17 commands → actually **25 commands**
- Claims 62 skills → actually **63 skills**
- Lists only 17 commands in the table — missing 8 commands: `backup`, `cost-track`, `init-project`, `logs`, `new`, `rollback`, `start`, `switch-model`
- "All 17 Commands" heading needs updating

### Fix approach
- Simple corrections: update counts, fix hooks copy to `*.json`, add missing commands to README table.

---

## Issue 2: CLAUDE.md Reality Mismatch

CLAUDE.md describes build/test/lint commands for `services/core-service`, `services/ai-service`, `apps/web`, etc. — directories that don't exist. This is by design (it's a template for the target project), but it's confusing because:

1. It lives in the orchestrator repo where those paths don't exist
2. Hooks in `hooks.json` reference these non-existent paths
3. No distinction between "orchestrator repo instructions" vs "target project instructions"

### Fix approach
- Add a clear section header explaining that Build/Test/Lint commands apply to the **generated project**, not this plugin repo
- Add a "Plugin Development" section for working on the orchestrator itself
- Keep the existing commands as-is (they're correct for the target context)

---

## Issue 3: product.md Placeholder

`steering/product.md` is entirely `[Fill in]` placeholders. The `product-manager` agent loads the `product-knowledge` skill which reads steering docs — so it gets zero product context.

### Fix approach (per user request: generic template)
- Replace bare `[Fill in]` with guided examples and fill-in-the-blank templates
- Add example entries for each section so users know what good looks like
- Add instruction comments explaining what each field is for and why it matters

---

## Issue 4: 12 Stub Skills

These skills are effectively empty (9 lines, only frontmatter + 1 sentence body):

1. `agent-builder` — How to create/configure Claude Code agents
2. `agent-workspace-setup` — Setting up isolated workspaces for agents
3. `ai-integration` — LLM/ML integration patterns (Claude, OpenAI, LangChain)
4. `analytics-setup` — Application analytics and metrics
5. `data-pipeline` — ETL, streaming, batch data processing
6. `data-visualization` — Charts, dashboards, data display
7. `db-optimizer` — Database query optimization, indexing
8. `env-setup` — Development environment configuration
9. `git-workflow` — Git branching, commit conventions, PR workflows
10. `mcp-builder-extended` — Building MCP servers and tools
11. `monorepo-manager` — Monorepo tooling and workspace management
12. `workflow-automation` — CI/CD and automation workflows

### Fix approach
- Flesh out each with real patterns, code examples, and decision frameworks
- Match quality level of existing substantive skills (e.g., `nestjs-patterns` at 176 lines, `python-django-patterns` at 271 lines)
- Target 80-200 lines per skill depending on scope

---

## Issue 5: Agent Refactoring (Critical — Flow/Triggering)

### Problems reported by user:
1. **Agents not dispatched** — project-orchestrator doesn't properly route to specialists
2. **Wrong agent picked** — incorrect specialist triggered for certain tasks
3. **Agent chain breaks** — multi-step flows (orchestrator → team → specialist) fail partway
4. **No detailed plan output** — when creating an application, user doesn't get a detailed techstack/feature plan before implementation starts

### Root cause analysis needed:
- **Agent descriptions** — are `description` fields specific enough for Claude to pick the right agent?
- **subagent_type naming** — do agent names in `Agent()` calls match actual agent filenames?
- **Prompt quality** — are prompts to subagents specific enough to produce useful output?
- **Phase sequencing** — does the orchestrator properly wait for outputs before spawning dependent agents?
- **Output format** — do agents write outputs in formats the next agent can consume?
- **Skill loading** — do agents reference skills that exist and have content?

### Fix approach
- Audit each of the 24 agents for: description quality, tool list, skill references, model assignment, prompt templates
- Ensure consistent formatting and interaction patterns
- Fix flow: orchestrator should present a detailed plan (techstack, features, architecture) BEFORE implementation
- Verify agent names match across all references
- Add missing capabilities where agents lack instructions for key scenarios

---

## Key Decisions

1. **Fix order:** Install/README first (quick wins) → CLAUDE.md → product.md → stub skills → agents (biggest effort)
2. **Agent refactoring scope:** One agent at a time, starting with the orchestrator (entry point), then following the pipeline order
3. **Stub skills:** Flesh out with real, actionable content — not just expanded descriptions
4. **product.md:** Generic template with examples, not a specific product

---

## Resolved Questions

1. **Pipeline size:** Always run ALL 21 agents for every request. Task size only controls approval gates.
2. **Agent teams:** Keep experimental agent teams references — user is using/planning to use them.
3. **Distribution:** Primary method is **plugin mode** (`--plugin-dir` / marketplace). Install script is secondary but should still work correctly.
4. **Missing commands:** All 25 commands should be listed in README — the 8 extras were just forgotten.
