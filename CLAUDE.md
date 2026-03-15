# Solo Dev Orchestrator — Claude Code Plugin

## About This Repository
This repo is the **Solo Dev Orchestrator** — a Claude Code plugin (all markdown files).
It contains agents, commands, skills, and hooks that orchestrate
application development for ANY tech stack.

### Working on This Plugin
- There is no application code to build or test in this repo.
- To test changes: `claude --plugin-dir plugins/agent-orchestrator`
- To install into a project: `bash install.sh /path/to/project`
- To validate: `bash plugins/agent-orchestrator/validate-plugin.sh`

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
- Phases 1-2 (Planning/Design): orchestrator dispatches specialist agents directly
- Phase 3 (Build): orchestrator dispatches feature-team (Agent Teams peer-to-peer)
- Phases 4-5 (Testing/Security): orchestrator dispatches agents directly
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
