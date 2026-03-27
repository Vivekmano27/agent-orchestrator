---
name: spec-driven-dev
description: "Enforce the Spec-Driven Development workflow — Requirements->Design->Tasks->Implementation with phase gates and review checkpoints. Use when the user wants structured development instead of vibe coding, needs to plan a complex feature before building, or mentions \"spec-driven\", \"SDD\", \"plan before code\", \"structured development\", \"phase gates\", or \"waterfall-then-agile\". Also use for any multi-service feature where jumping straight to code leads to rework."
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Spec-Driven Development Skill

Enforce a structured 4-phase workflow that separates planning from execution. Each phase produces a concrete artifact that the next phase consumes. No phase starts until the previous one is approved.

## When to Use

- Building a feature that touches more than 3 files
- Multi-service changes that need coordination
- Features with complex business rules or edge cases
- User wants to "plan before code" or avoid "vibe coding"
- Feature scope is ambiguous and needs to be pinned down
- Previous feature attempt failed due to vague requirements

## Why SDD Matters

- Vibe coding works for prototypes, fails for production
- 66% of developers report "the 80% problem" — AI solutions almost right but not quite
- Root cause: vague specs, missing edge cases, contradictory instructions
- Fix the docs -> fix the code

## The 4 Phases

### Phase 1: Requirements

**Output:** `requirements.md`

```markdown
# Requirements: [Feature Name]

## User Stories
### US-1: [As a/I want/So that]
**Acceptance Criteria:**
- [ ] Given [context], when [action], then [result]
- [ ] Given [context], when [action], then [result]

### US-2: [As a/I want/So that]
...

## Business Rules
- BR-1: [Rule description]
- BR-2: [Rule description]

## Non-Functional Requirements
- NFR-1: API response time < 200ms p95
- NFR-2: Support 1000 concurrent users

## Scope Boundaries
**In scope:** [explicit list]
**Out of scope:** [explicit list — equally important]

## Open Questions
- [ ] Q1: [Question that needs stakeholder answer]
```

**Gate:** Product Owner / User approves before Phase 2

### Phase 2: Design

**Output:** `design.md`

```markdown
# Design: [Feature Name]

## Architecture
[Mermaid diagram showing service interactions]

## API Endpoints
| Method | Path | Request Body | Response | Auth |
|--------|------|-------------|----------|------|
| POST | /api/v1/orders | { items: [] } | 201: { id, total } | JWT |

## Data Model
[Schema changes, new tables, indexes]

## Component Structure
[React component tree, page layout]

## Sequence Diagram
[Key interaction flows]

## Error Handling
[What happens when things fail]

## Migration Strategy
[If changing existing data or behavior]
```

**Gate:** Tech Lead approves before Phase 3

### Phase 3: Tasks

**Output:** `tasks.md`

```markdown
# Tasks: [Feature Name]

## TASK-001: Create orders table migration
- **Files:** src/migrations/xxx.ts
- **Depends on:** None
- **Verification:** `npm run migration:run && npm run migration:revert && npm run migration:run`
- **Effort:** S (1-2 story points)
- **Commit:** `feat(orders): add orders table migration`

## TASK-002: Implement OrderService.create
- **Files:** src/orders/order.service.ts, src/orders/dto/create-order.dto.ts
- **Depends on:** TASK-001
- **Verification:** `npm test -- --grep OrderService`
- **Effort:** M (3-5 story points)
- **Commit:** `feat(orders): implement order creation logic`
```

**Gate:** Review task order and scope before implementation

### Phase 4: Implementation

**Process:** Agent implements each task from `tasks.md` in order:
1. Read the task specification
2. Write failing test (if TDD is enabled)
3. Implement the code
4. Run the verification command
5. Create atomic commit with the specified message
6. Mark task complete in `tasks.md`
7. Move to next task

**Gate:** Code review on completed PR

## Per-Feature Spec Structure

```
.claude/specs/{feature-name}/
├── requirements.md
├── design.md
├── tasks.md
└── lessons.md          # Added after completion — what went wrong, what to remember
```

## Phase Gate Validation

Before advancing to the next phase, validate the current phase's output:

| Phase | Validation Checks |
|-------|-------------------|
| Requirements | Every user story has acceptance criteria; scope boundaries are explicit; no open questions remain unanswered |
| Design | Every API endpoint from requirements has a design entry; data model supports all business rules; error cases documented |
| Tasks | Every design element maps to at least one task; tasks have verification commands; dependency order is valid (no circular deps) |
| Implementation | All tasks complete; all verification commands pass; tests pass; PR created |

## Enforcement Rules

- NEVER skip to implementation without approved requirements
- NEVER write code before the design is reviewed
- ALWAYS create tasks before implementation
- Each task MUST have a verification command
- Each task = one atomic commit
- When requirements change mid-implementation: update specs first, then adjust tasks, then continue

## Anti-Patterns

- **Skipping requirements** — jumping straight to design or code; requirements catch misunderstandings before they become bugs
- **Gold-plating specs** — spending 3 days writing a spec for a 2-hour task; SDD overhead should be proportional to task complexity
- **Specs that don't evolve** — treating specs as write-once documents; update them when requirements change during implementation
- **Scope creep between phases** — adding features in design that weren't in requirements; each phase should only implement what the previous phase specified
- **No lessons learned** — finishing a feature without capturing what went wrong; `lessons.md` prevents repeating mistakes

## When to Use Plan Mode vs SDD

| Situation | Use Plan Mode | Use Full SDD |
|-----------|--------------|-------------|
| Quick bug fix | Yes | No |
| Single-file change | Yes | No |
| Multi-file feature (3-10 files) | Optional | Recommended |
| Multi-service feature (10+ files) | No — too lightweight | Yes |
| New project setup | No | Yes |

## Checklist

- [ ] Feature has `.claude/specs/{feature}/` directory
- [ ] `requirements.md` written with user stories and acceptance criteria
- [ ] Scope boundaries documented (in AND out of scope)
- [ ] `design.md` covers API, data model, and error handling
- [ ] `tasks.md` has ordered tasks with dependencies and verification commands
- [ ] Each phase approved before advancing to the next
- [ ] All tasks have atomic commits with conventional commit messages
- [ ] `lessons.md` updated after feature completion
