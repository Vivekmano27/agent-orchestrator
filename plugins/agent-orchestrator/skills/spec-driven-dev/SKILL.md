---
name: spec-driven-dev
description: Enforce the Spec-Driven Development workflow — Requirements→Design→Tasks→Implementation with phase gates and review checkpoints. Use when the user wants structured development instead of vibe coding, needs to plan a complex feature before building, or mentions "spec-driven", "SDD", "plan before code", "structured development", or "phase gates".
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Spec-Driven Development Skill

Enforce a structured 4-phase workflow that separates planning from execution.

## Why SDD Matters
- Vibe coding works for prototypes, fails for production
- 66% of developers report "the 80% problem" — AI solutions almost right but not quite
- Root cause: vague specs, missing edge cases, contradictory instructions
- Fix the docs → fix the code

## The 4 Phases

### Phase 1: Requirements
**Output:** requirements.md
**Contains:** User stories, acceptance criteria, business rules, NFRs, scope boundaries
**Gate:** Product Owner approves before Phase 2

### Phase 2: Design
**Output:** design.md
**Contains:** Architecture, API endpoints, data models, sequence diagrams, component structure
**Gate:** Tech Lead approves before Phase 3

### Phase 3: Tasks
**Output:** tasks.md
**Contains:** Ordered implementation steps with dependencies, verification commands, effort estimates
**Gate:** Review task order and scope

### Phase 4: Implementation
**Output:** Code + Tests + PRs
**Process:** Agent implements each task, runs tests, makes atomic commits
**Gate:** Code review on completed PR

## Per-Feature Spec Structure
```
.claude/specs/{feature-name}/
├── requirements.md
├── design.md
└── tasks.md
```

## Enforcement Rules
- NEVER skip to implementation without approved requirements
- NEVER write code before the design is reviewed
- ALWAYS create tasks before implementation
- Each task MUST have a verification command
- Each task = one atomic commit

## When to Use Plan Mode
- Multi-step features (>3 files changed)
- Code exploration before changing anything
- Complex refactors with many dependencies
- Interactive requirements gathering
