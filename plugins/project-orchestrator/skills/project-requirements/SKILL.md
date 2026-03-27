---
name: project-requirements
description: Generate complete project requirement documents — PRD, user stories, feature lists, acceptance criteria, design specs, API specifications, database schemas, task breakdowns, and test plans. Use this skill whenever the user wants to create project documentation, write a PRD, define features, create user stories, spec out an application, plan a feature, create a design document, break down tasks for implementation, or prepare any specification document. Also trigger for "spec-driven development", "SDD", "requirements document", "feature spec", "product spec", "application spec", "write user stories", "acceptance criteria", "task breakdown", "implementation plan", "design doc".
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Project Requirements Skill

Generate structured, AI-agent-optimized project documents following the Spec-Driven Development (SDD) methodology.

## The SDD Workflow

```
Phase 1: Requirements → Phase 2: Design → Phase 3: Tasks → Phase 4: Implementation
```

Review happens at phase gates, not during implementation.

**Note:** Requirements discovery questions are handled by the product-manager agent's adaptive discovery system. This skill provides output templates only — do NOT run a separate interview.

## Document Templates

### 1. PRD (Product Requirements Document)

```markdown
# [Project Name] — Product Requirements Document

## 1. Executive Summary
[2-3 sentences: what, who, why]

## 2. Objectives & Success Metrics
| Objective | Metric | Target |
|-----------|--------|--------|
| [Goal]    | [KPI]  | [Number] |

## 3. User Personas
### Persona 1: [Name], [Role]
- Demographics: [Age, tech proficiency]
- Goals: [What they want]
- Pain points: [Current frustrations]

## 4. Feature List (Prioritized)
| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| F-001 | [Name] | P0 | [Description] |

## 5. User Stories with Acceptance Criteria
### US-001: [Title]
**As a** [role], **I want** [action] **so that** [benefit].
**Acceptance Criteria:**
- [ ] [Testable condition 1]
- [ ] [Testable condition 2]
- [ ] [Edge case handling]
**Dependencies:** [US-xxx]
**Priority:** P0

## 6. Business Rules
| ID | Rule | Example |
|----|------|---------|
| BR-001 | [Rule] | [Example] |

## 7. Non-Functional Requirements
| Category | Requirement | Target |
|----------|-------------|--------|
| Performance | Page load | < 2s |
| Security | Auth method | [method] |
| Accessibility | WCAG | AA |

## 8. Scope Boundaries
### In Scope: [list]
### Out of Scope: [list]

## 9. Technical Constraints
- Stack: [tech]
- Hosting: [platform]
- Compliance: [regulations]

## 10. Data Model Overview
| Entity | Key Fields | Relationships |
|--------|-----------|---------------|
| [Entity] | [fields] | [relations] |
```

### 2. Feature List JSON (for autonomous coding)

```json
{
  "project": "[Name]",
  "features": [
    {
      "id": "F-001",
      "name": "[Feature]",
      "module": "[module]",
      "priority": "P0",
      "status": "pending",
      "depends_on": [],
      "acceptance_criteria": ["[criterion]"],
      "test_file": "tests/[path]"
    }
  ]
}
```

### 3. Task Breakdown

```markdown
## TASK-001: [Title]
**Description:** [Detailed instructions]
**Dependencies:** blockedBy: [] | blocks: [TASK-002]
**Verification:** Run: `[command]` — Expect: [output]
**Files:** Create: [paths] | Modify: [paths]
**Commit:** `feat([scope]): [description]`
**Status:** pending
```

## Writing Tips
- Number everything (US-001, BR-001, F-001)
- One requirement per bullet
- Acceptance criteria as checkboxes
- Include edge cases per story
- Specific: "tag appears in red" not "tags look nice"
- Update PRD as decisions change — living document

## Anti-Patterns

- **Vague acceptance criteria** — "it should work well" instead of Given/When/Then; criteria must be testable by an agent
- **Missing scope boundaries** — no explicit "out of scope" list leads to unbounded feature creep
- **Assuming MVP without asking** — always ask the user whether they want MVP or production-ready scope
- **Requirements without priorities** — when everything is P0, nothing is; rank user stories by business impact
- **No edge cases** — happy path only; every user story needs at least one error/edge case scenario
- **Mixing requirements with design** — requirements say WHAT, not HOW; "use Redis for caching" is a design decision, not a requirement

## Checklist

- [ ] User stories in "As a / I want / So that" format with IDs (US-001)
- [ ] Each story has Given/When/Then acceptance criteria
- [ ] Business rules documented (BR-001) with clear logic
- [ ] Non-functional requirements specified (performance, security, scale)
- [ ] Scope boundaries explicit (in-scope AND out-of-scope lists)
- [ ] Edge cases identified per story
- [ ] Open questions listed for stakeholder resolution
- [ ] Feature priority assigned (P0/P1/P2)
- [ ] Output saved to `.claude/specs/[feature]/requirements.md`
