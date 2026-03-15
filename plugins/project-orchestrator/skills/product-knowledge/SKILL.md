---
name: product-knowledge
description: Provide accurate information about the product being built — its features, architecture, user flows, and business logic. Use this skill as a template for creating product-specific knowledge bases that agents reference during development. Trigger when agents need to understand "how does our product work", "what does this feature do", or need domain context.
allowed-tools: Read, Grep, Glob
---

# Product Knowledge Skill

## THIS IS A TEMPLATE — copy and customize per project

This file is intentionally generic. It provides the structure that a project-specific product knowledge base must follow. During Phase 0.5 (project setup), the project-setup agent should copy this template and fill in every `[REPLACE]` marker with real product information.

### How agents use this skill

1. The project-setup agent copies this template to `.claude/specs/product-knowledge.md` and fills in project-specific content.
2. All other agents read `.claude/specs/product-knowledge.md` (NOT this template) to understand the product.
3. When product behavior changes, the agent making the change updates `product-knowledge.md` to stay in sync.
4. If an agent encounters a domain question not answered by `product-knowledge.md`, it adds a `[TODO: clarify]` marker and asks the user.

### When to update the knowledge base

- New entity or domain concept is introduced
- Business rule changes or new rule is added
- User flow is added or modified
- Glossary term is used inconsistently across codebase

---

## Constraints

- NEVER answer domain questions from general knowledge when a `product-knowledge.md` exists. Always reference the project-specific file.
- NEVER leave a `[REPLACE]` marker in a production knowledge base. Every marker must be filled or explicitly marked `[N/A — reason]`.
- NEVER duplicate information that lives in code (API schemas, DB schemas). Reference the file path instead.
- If a business rule contradicts the codebase, flag the conflict — do not silently pick one.

## Template — copy everything below this line to `.claude/specs/product-knowledge.md`

---

```markdown
# [REPLACE: Product Name] — Product Knowledge Base
**Last updated:** [REPLACE: YYYY-MM-DD]
**Maintained by:** [REPLACE: agent name or "project-setup agent"]

## What We Build
[REPLACE: 2-3 sentences. What the product does, who it's for, what problem it solves.
Example: "TaskFlow is a project management tool for small engineering teams. It replaces
spreadsheet-based sprint tracking with a kanban board that integrates with GitHub PRs."]

## Architecture Overview
- **Pattern:** [REPLACE: monolith | modular monolith | microservices]
- **Backend:** [REPLACE: e.g., Node.js + Express, Python + FastAPI]
- **Frontend:** [REPLACE: e.g., Next.js 14 App Router, Flutter]
- **Database:** [REPLACE: e.g., PostgreSQL 16, MongoDB]
- **Auth:** [REPLACE: e.g., NextAuth.js with GitHub OAuth, Firebase Auth]
- **Hosting:** [REPLACE: e.g., Vercel + Supabase, AWS ECS + RDS]
- **Architecture diagram:** [REPLACE: path to diagram file or "see docs/architecture.md"]

## Core Entities
[REPLACE: List every domain entity the product tracks. Include relationships.]

| Entity         | Description                              | Key Fields                     | Relationships               |
|----------------|------------------------------------------|--------------------------------|-----------------------------|
| [REPLACE]      | [REPLACE: what this entity represents]   | [REPLACE: id, name, status...] | [REPLACE: belongs to X, has many Y] |
| [REPLACE]      | [REPLACE]                                | [REPLACE]                      | [REPLACE]                   |
| [REPLACE]      | [REPLACE]                                | [REPLACE]                      | [REPLACE]                   |

## Core User Flows
[REPLACE: Document the 3-5 most critical user flows. These are the paths agents must
never break. Each flow should trace from user action to system response.]

### Flow 1: [REPLACE: Flow Name] (e.g., "User Registration")
**Trigger:** [REPLACE: What initiates this flow — e.g., "User clicks Sign Up"]
**Steps:**
1. [REPLACE: User action] -> [REPLACE: System response]
2. [REPLACE: User action] -> [REPLACE: System response]
3. [REPLACE: User action] -> [REPLACE: System response]
**Success state:** [REPLACE: What the user sees when flow completes]
**Error states:**
- [REPLACE: What happens on validation failure]
- [REPLACE: What happens on server error]
**Files involved:** [REPLACE: key file paths for this flow]

### Flow 2: [REPLACE: Flow Name]
[Same structure]

### Flow 3: [REPLACE: Flow Name]
[Same structure]

## Business Rules
[REPLACE: These are the rules that code MUST enforce. Number them for easy reference
in code comments and commit messages.]

| ID     | Rule                                                    | Enforced In              |
|--------|---------------------------------------------------------|--------------------------|
| BR-001 | [REPLACE: e.g., "A user cannot belong to more than 5 workspaces"] | [REPLACE: file path]    |
| BR-002 | [REPLACE: e.g., "Free tier is limited to 3 projects"]  | [REPLACE: file path]    |
| BR-003 | [REPLACE: e.g., "Deleted items are soft-deleted and recoverable for 30 days"] | [REPLACE: file path] |
| BR-004 | [REPLACE]                                               | [REPLACE]                |

## Domain Glossary
[REPLACE: Define terms that have specific meaning in YOUR product. Do not define
general programming terms. Focus on terms that could be ambiguous.]

| Term            | Definition (in our context)                              | NOT to be confused with         |
|-----------------|----------------------------------------------------------|---------------------------------|
| [REPLACE]       | [REPLACE]                                                | [REPLACE: common confusion]     |
| [REPLACE]       | [REPLACE]                                                | [REPLACE]                       |
| [REPLACE]       | [REPLACE]                                                | [REPLACE]                       |

## API Contracts
[REPLACE: Do not duplicate OpenAPI specs. Instead, reference them and note only
the non-obvious conventions.]

- API spec location: [REPLACE: path to OpenAPI/Swagger file]
- Auth header: [REPLACE: e.g., "Bearer token in Authorization header"]
- Error format: [REPLACE: e.g., "{ error: { code: string, message: string, details?: object } }"]
- Pagination: [REPLACE: e.g., "cursor-based, 50 items per page, cursor in Link header"]
- Rate limits: [REPLACE: e.g., "100 req/min per API key, 429 response with Retry-After header"]

## Common Gotchas
[REPLACE: Things that are easy to get wrong. Every time an agent makes a mistake
that stems from misunderstanding the product, add it here.]

- [REPLACE: e.g., "The 'owner' field on Project is the org, not the user who created it"]
- [REPLACE: e.g., "Timestamps are stored in UTC but displayed in the user's timezone"]
- [REPLACE: e.g., "The free tier check happens in middleware, not in individual route handlers"]

## External Integrations
[REPLACE: Third-party services the product depends on. Agents need to know these
exist so they don't accidentally rebuild something that's already handled.]

| Integration    | Purpose                          | Config location           | Docs                      |
|----------------|----------------------------------|---------------------------|---------------------------|
| [REPLACE]      | [REPLACE]                        | [REPLACE: env var names]  | [REPLACE: URL]            |
| [REPLACE]      | [REPLACE]                        | [REPLACE]                 | [REPLACE]                 |
```
