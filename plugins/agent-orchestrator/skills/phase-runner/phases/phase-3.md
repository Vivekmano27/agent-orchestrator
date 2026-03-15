# Phase 3: Build — via feature-team

**Executor:** feature-team agent (manages backend/frontend/mobile agents internally)

## Preconditions
- `.claude/specs/[feature]/tasks.md` exists (Phase 2.1)
- `.claude/specs/[feature]/api-spec.md` exists (Phase 2)
- `.claude/specs/[feature]/schema.md` exists (Phase 2)
- `.claude/specs/[feature]/design.md` exists (Phase 2, if frontend)
- `.claude/specs/[feature]/architecture.md` exists (Phase 2)
- Git feature branch created (Phase 2.5)

## Dispatch Instructions

```
Agent(
  subagent_type="agent-orchestrator:feature-team",
  prompt="Implement all features for [feature] based on specs at .claude/specs/[feature]/.
          Task size: [SMALL/MEDIUM/BIG].
          Read tasks.md for ordered task list with agent assignments.
          Read api-spec.md, schema.md, design.md, architecture.md for contracts.
          Backend runs first and writes api-contracts.md.
          Then frontend reads api-contracts.md.
          Follow TDD. Commit after each logical unit.
          Return: list of files changed, issues encountered, whether api-contracts.md was written."
)
```

Wait for feature-team to complete. Check its report for any issues.

## Expected Outputs
- `.claude/specs/[feature]/api-contracts.md` (backend output)
- At least one working endpoint file with route handler (backend)
- At least one component file with real API call — not mock data (frontend, if applicable)

## Content Validation

**Backend validation:**
- `api-contracts.md` exists and lists at least 1 endpoint with route and shape
- At least one source file under `services/` (or equivalent backend directory) contains a route handler

**Frontend validation (if frontend in project-config.md):**
- At least one `.tsx` component file exists under `apps/web/` (or equivalent)
- Grep for real API call patterns (fetch, axios, TanStack Query useQuery/useMutation) — must find at least 1
- If ONLY mock data found (grep for `mock`, `hardcoded`, `sample`) with NO real API calls → validation FAILS
- On failure: re-dispatch feature-team: "Frontend components use only mock data. api-contracts.md exists at [path]. Replace mocks with real API calls using TanStack Query."

## Conditional Logic
- feature-team handles internal conditional dispatch based on project-config.md
- Skip mobile agents if no Flutter/KMP in project-config.md
- Skip python-developer if no Python service
- Skip senior-engineer if single service
