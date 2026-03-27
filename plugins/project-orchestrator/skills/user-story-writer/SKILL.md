---
name: user-story-writer
description: Generate numbered user stories in "As a / I want / So that" format with bullet-point acceptance criteria, priorities, dependencies, edge cases, and technical notes. Use when the user asks to "write user stories", "create acceptance criteria", "define features", "story mapping", or needs to convert vague requirements into structured, testable stories.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# User Story Writer Skill

Generate implementation-ready user stories with testable acceptance criteria, edge case coverage, and priority scoring.

## Constraints

- NEVER write an acceptance criterion that cannot be automated as a test. "User has a good experience" is not testable. "Page loads in under 2 seconds" is.
- NEVER write a story without at least 3 edge case prompts. If you think there are no edge cases, you haven't thought hard enough.
- NEVER combine multiple user actions into a single story. "User can register AND manage their profile" is two stories.
- Every story MUST have a unique sequential ID (US-001, US-002, ...) that is stable across revisions.
- The "So that" clause MUST state a user benefit, not a system behavior. "So that the data is saved to the database" is wrong. "So that I can resume my work later" is correct.

## Output Format

Write output to `.claude/specs/[feature]/user-stories.md` using this exact structure:

```markdown
# User Stories: [Feature Name]
**Source:** [link to PRD or requirements doc]
**Total stories:** [N]
**Priority breakdown:** [X] Must, [Y] Should, [Z] Could, [W] Won't (this phase)

## Story Map

| User Journey Phase | Must Have          | Should Have      | Could Have       |
|--------------------|--------------------|------------------|------------------|
| Onboarding         | US-001, US-002     | US-010           |                  |
| Core Workflow      | US-003, US-004     | US-011, US-012   | US-020           |
| Settings           | US-005             | US-013           | US-021           |

---

### US-001: [Short descriptive title]
**As a** [specific role — not "user", use "logged-in customer" or "admin"],
**I want** [one specific action — verb phrase],
**so that** [measurable user benefit].

**Priority:** Must | Should | Could | Won't (this phase)
**Effort:** S | M | L | XL
**Dependencies:** US-xxx, US-xxx | none
**Module:** [which part of the app — e.g., auth, dashboard, billing]

**Acceptance Criteria:**
- [ ] Given [precondition], when [action], then [observable result]
- [ ] Given [precondition], when [action], then [observable result]
- [ ] Error state: Given [invalid input], when [action], then [specific error message is shown]
- [ ] Empty state: Given [no data exists], when [page loads], then [empty state illustration and CTA are shown]
- [ ] Loading state: Given [slow network], when [action is triggered], then [skeleton/spinner is shown within 100ms]

**Edge Cases:**
- What if the input is empty? -> [expected behavior]
- What if the input is a duplicate? -> [expected behavior]
- What if the user is unauthorized? -> [expected behavior]
- What if the network request fails? -> [expected behavior]
- What if the input exceeds the max length? -> [expected behavior]

**Technical Notes:**
- API endpoint: `POST /api/[resource]`
- Validation: [specific rules — email format, min/max length, required fields]
- State management: [where this data lives — server state via React Query, local state, URL params]

---

### US-002: [Next story]
[Same structure...]
```

## Priority Scoring — MoSCoW Method

Assign every story a priority using these criteria:

| Priority | Label              | Criteria                                                        |
|----------|--------------------|-----------------------------------------------------------------|
| Must     | Launch blocker     | Product cannot ship without this. Users cannot complete core flow. |
| Should   | Expected feature   | Users will notice its absence. Can ship without but hurts adoption. |
| Could    | Nice to have       | Improves experience but core flow works without it.             |
| Won't    | Out of scope       | Explicitly deferred. Document WHY to prevent scope creep.       |

Scoring rules:
- A feature that touches auth, payment, or data integrity is almost always **Must**.
- A feature the user specifically asked for is at least **Should** unless they said "nice to have."
- If you are unsure between Must and Should, it is Should. Err toward a leaner Must set.

## Edge Case Prompt Checklist

For EVERY story, evaluate these categories and include the relevant ones:

**Input edge cases:**
- Empty/blank input
- Duplicate value (already exists)
- Exceeds maximum length
- Special characters / Unicode / emoji
- SQL injection / XSS attempt (note: handle in technical notes, not acceptance criteria)

**State edge cases:**
- User is not authenticated
- User lacks permission for this action
- Resource has been deleted by another user (stale reference)
- Concurrent edit by two users
- Session has expired mid-action

**Network edge cases:**
- Request times out
- Server returns 500
- Partial data load (some API calls succeed, others fail)
- Offline / reconnection

**Data edge cases:**
- Zero items (empty state)
- Exactly one item (singular vs plural copy)
- Maximum items (pagination boundary)
- Data with missing optional fields

## Acceptance Criteria Rules

1. **Use Given/When/Then format** — forces you to think about preconditions, not just happy path.
2. **One assertion per bullet** — "Displays error AND disables button" is two criteria.
3. **Specify exact copy for errors** — "Shows error" is untestable. "Shows 'Email is already registered'" is testable.
4. **Include response times where relevant** — "Search results appear within 500ms" not "search is fast."
5. **Cover the full state lifecycle** — loading, empty, populated, error, disabled, success.
6. **Never use subjective language** — "attractive," "intuitive," "user-friendly" are not criteria.

## Story Splitting Heuristics

If a story feels bigger than L, split it using these patterns:

| Split by...         | Example                                                          |
|---------------------|------------------------------------------------------------------|
| CRUD operation      | "Manage projects" -> Create project, View project list, Edit project, Delete project |
| User role           | "View dashboard" -> Admin dashboard, Member dashboard            |
| Input method        | "Upload avatar" -> Upload from file, Upload from URL, Crop avatar |
| Happy/sad path      | "Submit form" -> Submit valid form, Handle validation errors     |
| Platform            | "Send notification" -> Email notification, Push notification     |

## Anti-Patterns

- **Stories without acceptance criteria** — "As a user I want to log in" with no Given/When/Then; untestable stories waste implementation time
- **Technical tasks disguised as stories** — "Set up Redis caching" is a task, not a user story; stories describe user-visible behavior
- **Stories too large** — if a story takes more than 5 days, split it using the patterns above
- **Missing personas** — all stories starting with "As a user"; identify specific roles (admin, manager, guest) with different needs
- **No edge cases** — only happy path acceptance criteria; every story should consider what happens when things go wrong
- **Dependencies not identified** — stories that can't be implemented without other stories being done first; mark explicit dependencies
