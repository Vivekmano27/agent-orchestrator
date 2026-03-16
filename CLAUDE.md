# Solo Dev Orchestrator — Claude Code Plugin

## About This Repository
This repo is the **Solo Dev Orchestrator** — a Claude Code plugin (all markdown files).
It contains agents, commands, skills, and hooks that orchestrate
application development for ANY tech stack.

### Working on This Plugin
- There is no application code to build or test in this repo.
- To test changes: `claude --plugin-dir plugins/project-orchestrator`
- To install into a project: `bash install.sh /path/to/project`
- To validate: `bash plugins/project-orchestrator/validate-plugin.sh`

---

## Target Project Configuration
> The sections below apply to the **project where this plugin is installed**, not this plugin repo itself.
> Tech stack, architecture, and infrastructure are NOT hardcoded — the project-setup agent
> (Phase 0.5) interviews the user and generates `project-config.md` per project.

## Project Overview
Configurable per project. The project-setup agent asks about architecture pattern (monolith/microservices),
tech stack (backend, frontend, mobile, database), infrastructure, CI/CD, testing, and code quality.
All decisions are stored in `.claude/specs/[feature]/project-config.md`.

## Build & Run
Build and run commands are determined by the project's tech stack (see project-config.md).
Common patterns:
- Docker: `docker-compose up`
- Node.js: `npm run dev` or `npm start`
- Python: `python manage.py runserver` or `uvicorn main:app`
- Flutter: `flutter run`

## Test Commands
Test commands are determined by the project's tech stack (see project-config.md).
Common patterns:
- Node.js: `npm test`
- Python: `pytest`
- Flutter: `flutter test`
- E2E: `npx playwright test` or `npx cypress run`
- All: `/run-tests` (custom command)

## Lint & Format
Linting and formatting tools are configured per project in project-config.md.

## Rules (VIOLATIONS ARE BUGS)
- NEVER commit to main directly — use feature branches
- NEVER import across service boundaries — use API/gRPC only
- NEVER store secrets in code — use environment variables
- NEVER skip tests — all tests MUST pass before committing
- NEVER use `any` type in TypeScript
- NEVER catch and swallow errors silently
- Every bug fix MUST include regression tests
- Every API endpoint MUST have request validation
- Every cross-service call MUST have error handling + timeout

## User Interaction Rules (ALL AGENTS MUST FOLLOW)
- ALWAYS use the `AskUserQuestion` tool when asking the user ANYTHING — approvals, confirmations, clarifications, choices, decisions
- NEVER write questions as plain text prose
- This applies to ALL interaction types: approval gates, confirmations before destructive operations, clarifying ambiguous requirements, presenting options
- Every approval gate = one `AskUserQuestion` call with clear options (e.g., "Approve and continue", "Request changes", "Cancel")

## Preferences
- Prefer TDD for business logic
- Prefer conventional commits: type(scope): description
- Prefer single-responsibility commits
- Prefer server components in Next.js (client only when needed)

## Agent Workflow
- SMALL tasks (1-3 files): Fully autonomous
- MEDIUM tasks (4-10 files): Quick approval before implementation
- BIG features (10+ files): Full spec-driven workflow with gates

## Core Principles
- **Simplicity First:** Make every change as simple as possible. Impact minimal code.
- **No Laziness:** Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact:** Changes should only touch what's necessary. Avoid introducing bugs.

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `.claude/specs/[feature]/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management
1. **Plan First:** Write plan to `.claude/specs/[feature]/tasks.md` with checkable items
2. **Verify Plan:** Check in before starting implementation
3. **Track Progress:** Mark items complete as you go
4. **Explain Changes:** High-level summary at each step
5. **Document Results:** Add review section to `.claude/specs/[feature]/tasks.md`
6. **Capture Lessons:** Update `.claude/specs/[feature]/lessons.md` after corrections

## Compact Instructions
When compacting, preserve: modified file list, active branch, test commands, current task from tasks.md, which services are affected.

## Agent Routing Rules (IMPORTANT)

ALWAYS route through the project-orchestrator agent for ANY of these:
- "I want to create/build/make an application/app/project"
- "Build me a [anything]"
- "Create a new [feature/app/service]"
- "I need a [app/tool/system]"
- Any new feature or application request

The project-orchestrator MUST be the entry point. It classifies the task
(SMALL/MEDIUM/BIG), then runs the full agent pipeline with approval
gates determined by task size.

Pipeline dispatch model (hybrid):
- Phase 0.5 (Project Setup): orchestrator dispatches project-setup agent
- Phase 1 (Planning): orchestrator dispatches specialist agents directly
- Phase 2 (Design): orchestrator dispatches design-team (Agent Teams peer-to-peer)
- Phase 3 (Build): orchestrator dispatches feature-team (Agent Teams peer-to-peer)
- Phase 4 (Testing): orchestrator dispatches quality-team (Agent Teams peer-to-peer)
- Phase 5 (Security): orchestrator dispatches security-auditor directly
- Phase 6 (Review): orchestrator dispatches review-team (Agent Teams peer-to-peer)
- Phases 7-8 (DevOps/Docs): orchestrator dispatches agents directly

NEVER let individual skills (fullstack-dev, react-patterns, frontend-design, etc.)
handle a new application request directly. They are used BY agents, not invoked
standalone for new projects.

The correct flow is ALWAYS:
  User request -> project-orchestrator -> classifies -> delegates to agents -> agents use skills

For quick tasks, use these commands instead of free-form prompts:
- /build-feature "description" -> orchestrated feature build
- /new "description" -> full pipeline for new project/feature
- /add-feature "description" -> add a feature to an in-progress pipeline (smart cascade updates all affected specs)
- /quick-fix "error" -> autonomous bug fix
- /setup-service name type -> new microservice scaffold
- /init-project name -> scaffold full monorepo from scratch
