---
name: user-story-writer
description: Generate numbered user stories in "As a / I want / So that" format with bullet-point acceptance criteria, priorities, dependencies, edge cases, and technical notes. Use when the user asks to "write user stories", "create acceptance criteria", "define features", "story mapping", or needs to convert vague requirements into structured, testable stories.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# User Story Writer Skill

Generate production-quality user stories that AI coding agents can implement directly.

## Story Template

```markdown
### US-[NNN]: [Short descriptive title]
**As a** [specific role], **I want** [specific action] **so that** [measurable benefit].

**Acceptance Criteria:**
- [ ] [Start with action verb — testable condition]
- [ ] [Another testable condition]
- [ ] [Error/edge case handling]

**Priority:** P0 | P1 | P2
**Estimated Effort:** S | M | L | XL
**Dependencies:** [US-xxx, US-xxx] or none
**Module:** [which part of the app]

**Technical Notes:**
- [Implementation hints — component, API, patterns]

**Edge Cases:**
- [Scenario] → [Expected behavior]
```

## Acceptance Criteria Rules
1. **One condition per bullet** — never blend multiple requirements
2. **Start with action verbs** — Displays, Returns, Shows, Redirects, Creates
3. **Be testable** — if you can't write a test for it, it's too vague
4. **Include negative cases** — invalid input, empty states, errors
5. **Specify exact values** — "Error in red" not "error should be visible"
6. **Cover full lifecycle** — create, read, update, delete, error, loading, empty

## Process
1. Gather raw requirements from user (or scan existing docs)
2. Identify user roles/personas
3. Group features into modules
4. Write stories per feature with full template
5. Add dependencies between stories
6. Validate no circular dependencies
7. Output as markdown file or embed in PRD
