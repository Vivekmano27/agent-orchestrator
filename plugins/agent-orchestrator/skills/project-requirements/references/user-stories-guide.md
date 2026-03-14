# User Story Writing Reference

## Format
```
### US-[NNN]: [Title]
**As a** [role], **I want** [action] **so that** [benefit].
**Acceptance Criteria:**
- [ ] [Condition — start with action verb]
**Priority:** P0 | P1 | P2
**Dependencies:** [US-xxx] or none
**Edge Cases:** [Scenario] → [Behavior]
```

## Good Example
```
### US-014: Filter tasks by label
**As a** team member, **I want** to filter tasks by label **so that** I can focus on my category.
**Acceptance Criteria:**
- [ ] Filter dropdown shows all project labels
- [ ] Selecting label shows only matching tasks
- [ ] Multiple labels selectable (OR logic)
- [ ] Filter persists on page refresh (URL params)
- [ ] "Clear filters" resets to show all
- [ ] Empty state: "No tasks match these filters"
**Priority:** P1
**Dependencies:** US-003 (Label CRUD)
**Edge Cases:**
- 0 labels → "No labels yet, create one" link
- 500+ tasks → virtual scrolling
```

## Bad Example (avoid)
"Users should be able to filter stuff." — No role, no benefit, vague, untestable.

## Priority Definitions
| Priority | Meaning |
|----------|---------|
| P0 | Must have for MVP — app doesn't launch without it |
| P1 | Should have — users expect but can workaround |
| P2 | Nice to have — enhances experience, not critical |
