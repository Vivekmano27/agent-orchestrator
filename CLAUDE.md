# Project — Microservices Application

## About This Repository
This repo is the **Solo Dev Orchestrator** — a Claude Code plugin (all markdown files).
It contains 24 agents, 25 commands, 63 skills, hooks, and steering docs that orchestrate
microservices application development.

### Working on This Plugin
- There is no application code to build or test in this repo.
- To test changes: `claude --plugin-dir plugins/agent-orchestrator`
- To install into a project: `bash install.sh /path/to/project`
- To validate: `bash plugins/agent-orchestrator/validate-plugin.sh`

---

## Target Project Configuration
> The sections below apply to the **project where this plugin is installed**, not this plugin repo itself.
> When the orchestrator generates a project, these are the conventions it follows.

## Project Overview
Microservices application with NestJS backend, Python/Django AI service, React/Next.js web frontend, Flutter + KMP mobile apps, deployed on AWS with Docker/K8s.

## Tech Stack
- Backend: NestJS 10+, Python 3.12 / Django 5, PostgreSQL 16, Redis 7
- Frontend: React 18 / Next.js 14+, TypeScript 5+, Tailwind CSS
- Mobile: Flutter 3.x, Kotlin Multiplatform 2.0+
- Infrastructure: Docker, AWS (ECS Fargate, RDS, S3, CloudFront), Terraform
- CI/CD: GitHub Actions
- Testing: Jest, Pytest, Playwright, Flutter Test

## Architecture
Microservices: API Gateway (NestJS) -> Core Service (NestJS+PostgreSQL) <-> AI Service (Python/Django)
For details see @steering/tech.md and @docs/ARCHITECTURE.md

## Build & Run
- All services: `docker-compose up`
- NestJS: `cd services/core-service && npm run start:dev`
- Python: `cd services/ai-service && python manage.py runserver`
- Web: `cd apps/web && npm run dev`
- Flutter: `cd apps/mobile-flutter && flutter run`

## Test Commands
- NestJS: `cd services/core-service && npm test`
- Python: `cd services/ai-service && pytest`
- Web: `cd apps/web && npm test`
- Flutter: `cd apps/mobile-flutter && flutter test`
- E2E: `cd apps/web && npx playwright test`
- All: `/run-tests` (custom command)

## Lint & Format
- NestJS: `npm run lint && npm run format:check`
- Python: `ruff check . && ruff format --check . && mypy .`
- Web: `npm run lint && npx prettier --check .`
- Flutter: `flutter analyze && dart format --set-exit-if-changed .`

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

## References
@steering/product.md
@steering/tech.md
@steering/structure.md

## Agent Routing Rules (IMPORTANT)

ALWAYS route through the project-orchestrator agent for ANY of these:
- "I want to create/build/make an application/app/project"
- "Build me a [anything]"
- "Create a new [feature/app/service]"
- "I need a [app/tool/system]"
- Any new feature or application request

The project-orchestrator MUST be the entry point. It classifies the task
(SMALL/MEDIUM/BIG), then runs the full 21-agent pipeline with approval
gates determined by task size.

Pipeline dispatch model (hybrid):
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
- /quick-fix "error" -> autonomous bug fix
- /setup-service name type -> new microservice scaffold
- /init-project name -> scaffold full monorepo from scratch
