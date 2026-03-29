# Grading Report: Batch 2-5 Skills (Evals 11, 12, 13) -- Iteration 1

---

## spec-driven-dev (Eval ID 11)

**Prompt:** "I want to add a multi-tenant billing system to our SaaS app. It needs subscription plans, usage-based billing, Stripe integration, invoice generation, and an admin billing dashboard. Set up the spec-driven development workflow for this feature."

### With Skill

| Assertion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| spec_directory | **PASS** | Output is organized into three separate spec files: `requirements.md`, `design.md`, `tasks.md` -- a clear spec directory structure (equivalent to `.claude/specs/billing/`). |
| requirements_template | **PASS** | `requirements.md` contains 6 detailed user stories (US-1 through US-6) with explicit Given/When/Then acceptance criteria, 10 business rules (BR-1 through BR-10), non-functional requirements (NFR-1 through NFR-8), explicit scope boundaries (in scope AND out of scope), and 7 open questions. |
| design_template | **PASS** | `design.md` covers API endpoints (Tenant, Admin, Internal, Webhook -- with method, path, request/response, auth columns), full SQL data model (7 tables with indexes and constraints), Mermaid architecture diagram, 3 sequence diagrams (subscription creation, usage metering, invoice generation), comprehensive error handling table (12 scenarios), and migration/rollout strategy. |
| tasks_template | **PASS** | `tasks.md` has 24 ordered tasks (TASK-001 through TASK-024), each with affected files, dependencies, verification commands, effort estimates (S/M/L), and conventional commit messages. Full dependency graph provided at the end. |
| phase_gates | **PASS** | Four explicit phase gates defined: Requirements Gate ("Product Owner / User approves requirements.md before proceeding to Design"), Design Gate ("Tech Lead approves design.md before proceeding to Tasks"), Tasks Gate ("Review task order and scope before implementation begins"), and Implementation Gate (checklist of all tests passing, tenant isolation verified, PR created). |
| enforcement_rules | **PASS** | Explicit enforcement rules section: "NEVER skip to implementation without approved requirements.md", "NEVER write code before design.md is reviewed", "ALWAYS create tasks before implementation", plus Stripe-specific rules (env vars for secrets, webhook signature verification, idempotency keys). |

**Score: 6/6**

### Without Skill

| Assertion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| spec_directory | **PASS** | Output is organized into three separate spec files: `requirements.md`, `design.md`, `tasks.md`. |
| requirements_template | **PARTIAL PASS** | `requirements.md` has functional requirements (FR-1 through FR-6), user stories in table format (US-1 through US-12), NFRs, out of scope, and open questions. However, user stories use brief table format without Given/When/Then acceptance criteria -- acceptance criteria appear only as a high-level 8-item summary, not per story. Scope boundaries present (out of scope section). |
| design_template | **PASS** | `design.md` covers API endpoints (tenant, admin, internal/webhook -- path-based listing), ASCII art ER diagram with data model, service design with key methods, Stripe webhook handler design, admin dashboard sections, error handling strategy, security design, and technology decisions. |
| tasks_template | **PARTIAL PASS** | `tasks.md` has 22 tasks organized into 6 phases, each with effort estimates, files, verification steps, and commit messages. However, dependencies are implied by phase ordering rather than explicitly declared per-task. No dependency graph. |
| phase_gates | **FAIL** | No phase gates defined. The document has a "Review Checklist (Before Merging)" at the end, but no approval gates between requirements, design, and tasks phases. |
| enforcement_rules | **FAIL** | No enforcement rules stated. No rules like "no code before design" or "no implementation before tasks". The review checklist covers verification but not workflow enforcement. |

**Score: 3/6** (2 partial passes counted as 0.5 each = effectively 3)

### Delta: +3

**Key differences:**
- The with_skill output enforces the SDD workflow with explicit phase gates (approval required at each transition) and enforcement rules ("NEVER skip to implementation without approved requirements.md"). Without the skill, there are no phase gates or enforcement rules at all.
- User stories in the with_skill output use detailed Given/When/Then acceptance criteria; without the skill, they are brief table rows with no structured acceptance criteria per story.
- Task dependencies are explicitly declared and visualized in a dependency graph in the with_skill output; without the skill, dependencies are only implied by phase ordering.
- Both versions produce solid design and requirements content; the with_skill version adds the workflow governance layer that makes SDD distinct from generic spec writing.

---

## fullstack-dev (Eval ID 12)

**Prompt:** "Scaffold a new NestJS + PostgreSQL backend project for a task management API. Set up the project structure, Prisma ORM, JWT authentication, environment configuration, and initial tests."

### With Skill

| Assertion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| nestjs_structure | **PASS** | Full NestJS project with `src/` directory containing `main.ts`, `app.module.ts`, modular structure: `auth/` (controller, service, module, dto, strategies), `users/` (controller, service, module), `tasks/` (controller, service, module, dto), `common/` (guards, filters, decorators, pipes), `config/` (configuration.ts, prisma.module.ts, prisma.service.ts). Documented in `structure.md` with full tree view. |
| prisma_setup | **PASS** | `prisma/schema.prisma` with PostgreSQL datasource, three models: User (with role enum, email unique), Task (with status/priority enums, userId FK, indexes), RefreshToken (with token unique, userId FK, indexes). Proper `@@map` annotations and `@map` for snake_case DB columns. |
| auth_template | **PASS** | Full JWT auth flow with register/login/refresh/logout. `auth.service.ts` implements: register (hash password, create user, return access + refresh tokens), login (verify credentials, return tokens), refreshTokens (validate, rotate, return new pair), logout (invalidate refresh token). RefreshToken model stored in DB, rotated on use. JwtStrategy in `strategies/jwt.strategy.ts`. DTOs for register, login, and refresh-token. |
| env_example | **PASS** | `.env.example` with all required variables: NODE_ENV, PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN, SMTP config, AWS/S3 config -- all placeholder values. |
| initial_test | **PASS** | `test/auth.e2e-spec.ts` with 237 lines: comprehensive E2E tests covering register (success, duplicate email, invalid email, short password), login (success, invalid password, non-existent email), refresh (success, invalid token, reuse of rotated token), logout (success, without access token), and protected route access (with/without/invalid token). Uses Supertest + NestJS testing module. |
| scope_boundary | **PASS** | No React/frontend files present. All output is backend-only: NestJS project structure, no frontend framework dependencies in package.json (no React, Next.js, Angular, etc.). |

**Score: 6/6**

### Without Skill

| Assertion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| nestjs_structure | **PASS** | Full NestJS project with `src/` directory containing `main.ts`, `app.module.ts`, modular structure: `auth/` (controller, service, module, dto, guards, strategies), `users/` (controller, service, module), `tasks/` (controller, service, module, dto), `common/` (decorators, filters, interceptors, pipes), `config/` (env.validation.ts), `prisma/` (module, service). Additional files: `.eslintrc.js`, `.prettierrc`, `docker-compose.yml`, `nest-cli.json`, `tsconfig.json`, `tsconfig.build.json`, `.gitignore`. |
| prisma_setup | **PASS** | `prisma/schema.prisma` with PostgreSQL datasource, two models: User (email unique, firstName/lastName) and Task (with status/priority enums, userId FK, indexes). Also includes `prisma/seed.ts`. No RefreshToken model. |
| auth_template | **PARTIAL PASS** | Auth module with register and login only (no refresh/logout). `auth.service.ts` implements register (hash password, create user, return single access token) and login (verify credentials, return access token). No refresh token rotation, no logout endpoint. Only 2 of the 4 expected auth endpoints (register/login vs register/login/refresh/logout). |
| env_example | **PASS** | `.env.example` with DATABASE_URL, JWT_SECRET, JWT_EXPIRATION, PORT, NODE_ENV. Simpler than with_skill but covers required variables with placeholders. |
| initial_test | **PASS** | Two test files: `auth.service.spec.ts` (unit tests for register success, duplicate email, login success, invalid user, invalid password) and `auth.controller.spec.ts` (controller-level tests for register and login). These are unit tests, not E2E, but they verify the app logic works. |
| scope_boundary | **PASS** | No React/frontend files present. All output is backend-only. Package.json includes @nestjs/swagger (API documentation) but no frontend frameworks. |

**Score: 5/6** (1 partial pass = 0.5)

### Delta: +1

**Key differences:**
- The with_skill output implements the full JWT auth flow (register/login/refresh/logout with refresh token rotation stored in DB). Without the skill, auth is limited to register/login with only a single access token -- no refresh token model, no rotation, no logout.
- The with_skill output produces comprehensive E2E tests (237 lines, 12 test cases covering the full auth lifecycle including token rotation reuse detection). Without the skill, tests are unit-level (mocked services) covering basic happy/error paths.
- Without the skill, the output includes additional config files (docker-compose.yml, .eslintrc.js, .prettierrc, tsconfig.json, .gitignore, seed.ts) that the with_skill output omitted, suggesting the without_skill output focused more on production-readiness boilerplate.
- The Prisma schema in the with_skill output includes the RefreshToken model needed for the auth flow; without the skill, there is no RefreshToken model.

---

## state-machine-designer (Eval ID 13)

**Prompt:** "Design a state machine for an e-commerce order lifecycle. States should include: draft, placed, payment_pending, payment_failed, confirmed, preparing, shipped, delivered, return_requested, returned, cancelled. Include guard conditions, side effects, a Mermaid diagram, and TypeScript implementation."

### With Skill

| Assertion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| state_table | **PASS** | `state-machine.md` contains a state table with all 11 states, each with description, entry action, and terminal flag. Terminal states correctly marked: returned (Yes), cancelled (Yes), all others (No). |
| transition_table | **PASS** | Transition table with 15 rows and columns: #, From, To, Trigger, Guard, Side Effects. Every transition has all columns populated. Covers draft->placed, draft->cancelled, placed->payment_pending, placed->cancelled, payment_pending->confirmed, payment_pending->payment_failed, payment_failed->payment_pending, payment_failed->cancelled, confirmed->preparing, confirmed->cancelled, preparing->shipped, shipped->delivered, delivered->return_requested, return_requested->returned, return_requested->delivered. |
| guard_conditions | **PASS** | Guards defined for each transition: "Cart is non-empty AND shipping address is valid", "Payment method is attached to order", "Payment amount matches order total", "At least one item in stock", "trackingNumber is non-empty", "Delivery proof exists (signature or photo)", "Return window has not expired (within 30 days) AND reason.length > 0", "Return items inspected and accepted", "reason.length > 0" for cancellations/denials. |
| side_effects | **PASS** | Side effects listed per transition: send confirmation email, reserve inventory, create audit log, create payment intent, record payment ID, send receipt email, notify warehouse, assign picker, update estimated ship date, issue refund (with idempotency key), send cancellation email, send shipping email with tracking, update carrier records, send return instructions, generate return label, update inventory, send refund confirmation, send return denial email. |
| mermaid_diagram | **PASS** | `stateDiagram-v2` in `state-machine.md` showing all 11 states and 15 transitions with named triggers. Terminal states (returned, cancelled) point to `[*]`. Initial state `[*] --> draft`. |
| typescript_impl | **PASS** | `order-state.ts` (421 lines) uses `const` object pattern (`OrderState` with `as const`) + transition map (Record type mapping states to events to transitions). No switch statements. Includes: discriminated union for events, OrderContext interface, typed Guard functions (return error string or null), async side effect stubs with idempotency keys, Transition interface with target/guard/sideEffects, transition executor function, utility functions (getValidEvents, isTerminalState). |

**Additional quality:** Includes a validation checklist (8 checks: no orphan states, all transitions have source+target, terminal states exist, reachability, no dead ends, guards testable, side effects idempotent, Mermaid matches table). Error handling section explains rollback behavior.

**Score: 6/6**

### Without Skill

| Assertion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| state_table | **PASS** | `order-state-machine-spec.md` contains a state table with all 11 states, each with description and terminal flag. Two terminal states: returned, cancelled. No entry action column but descriptions serve a similar purpose. |
| transition_table | **PASS** | 15 transitions documented as individual sections (### 1. through ### 15.), each with Trigger, Guard conditions (bulleted list), and Side effects (bulleted list). Includes `draft->placed`, `placed->payment_pending`, `payment_pending->confirmed`, `payment_pending->payment_failed`, `payment_failed->payment_pending`, `payment_failed->cancelled`, `confirmed->preparing`, `confirmed->cancelled`, `preparing->shipped`, `preparing->cancelled`, `shipped->delivered`, `delivered->return_requested`, `return_requested->returned`, `return_requested->delivered`, `placed->cancelled`. Missing: `draft->cancelled`. Extra: `preparing->cancelled`. |
| guard_conditions | **PASS** | Detailed guards per transition: cart non-empty, items in stock, shipping address valid, customer email verified, payment method attached, order total > 0, payment amount matches + transaction ID + no fraud flags, retry count < max + within retry window + items still in stock, warehouse physical availability + not in freeze, cancellation within window, all items packed + shipping label + tracking assigned, delivery from assigned carrier + timestamp present, within return window + items eligible (not final-sale) + reason provided, inspection passed + RMA match, and more. Guards are more detailed than with_skill (includes fraud detection, retry limits, cancellation windows, item eligibility checks). |
| side_effects | **PASS** | Comprehensive side effects: generate order number, reserve inventory, send acknowledgement email, submit charge to gateway, start payment timeout timer, log audit trail, store transaction ID, cancel timeout, send confirmation, notify warehouse, emit analytics events, record failure reason, release inventory, increment retry counter, re-reserve inventory, create pick list, update delivery estimate, store tracking, mark inventory permanently deducted, record delivery proof, start return window, generate RMA number, send return instructions, process refund (full/partial), restock items, void RMA, and cancellation emails with refund. |
| mermaid_diagram | **PASS** | `order-state-machine-diagram.md` contains a `stateDiagram-v2` with all 11 states and transitions (including guard annotations on transitions). Also includes two additional Mermaid diagrams: a flowchart showing side effects per transition group, and a flowchart showing state categories (Active, Post-Delivery, Terminal, Error/Retry). |
| typescript_impl | **PARTIAL PASS** | `order-state-machine.ts` (1119 lines) is a comprehensive implementation with: OrderState type union, OrderEvent type union, TERMINAL_STATES set, detailed interfaces (Order, OrderItem, ShippingAddress, PaymentMethod, TransitionContext, PaymentGatewayResponse, DeliveryConfirmation, InspectionResult, AuditLogEntry, GuardResult), OrderServices interface for dependency injection, guard functions (14 guards), side effect functions (13 effects), TRANSITION_TABLE array, TransitionError class, OrderStateMachine interface with createOrder/transition/canTransition/getAvailableEvents/getTransitionTable/isTerminal, factory function createOrderStateMachine, and utility functions (getReachableStates, getPredecessorStates, validateTransitionTable). **However**, it uses a `type` union instead of `const enum` and the transition table is an array of TransitionDefinition objects with string keys for guard/sideEffect references rather than a direct transition map. The pattern is closer to a "transition table array + lookup" than the "const enum + transition map" pattern specified in the assertion. |

**Additional quality:** Without-skill output includes invariants section (6 invariants), timeout policies table, state categories breakdown, RMA handling, fraud detection guards, and utility functions for reachability analysis and validation. The TypeScript implementation is significantly more sophisticated with dependency injection interfaces, proper error classes, and introspection utilities.

**Score: 5.5/6** (1 partial for typescript_impl pattern deviation)

### Delta: +0.5

**Key differences:**
- The with_skill output follows the exact skill-prescribed format: structured markdown tables (state table with entry actions, transition table with columns), followed by a matching TypeScript implementation using `const` object (`as const`) + Record-based transition map with inline guard references. Clean, compact (421 lines), highly structured.
- The without_skill output is more comprehensive overall: more detailed guards (fraud detection, retry limits, timeout policies, cancellation windows), more side effects (RMA generation, analytics events, timeout timers), richer TypeScript types (dependency injection interfaces, error classes, introspection utilities), and additional documentation (invariants, timeout policies, state categories). The TS file is 1119 lines vs 421 lines.
- The without_skill TypeScript uses a different pattern (type union + array-based transition table with string keys for guard/sideEffect lookup) rather than the const enum + direct transition map pattern the skill prescribes. This is arguably a more enterprise-grade pattern but deviates from the assertion specification.
- The with_skill output includes a validation checklist (8 formal checks confirming state machine correctness) and explicit error handling rollback semantics. The without-skill output has invariants and a validateTransitionTable() utility function that serves a similar purpose.
- The with_skill output includes `draft->cancelled`; the without-skill output includes `preparing->cancelled` instead. Both cover the full lifecycle but differ in which additional cancellation edges they include.
- Net: the without_skill output is actually stronger in depth and production-readiness, but the with_skill output more precisely matches the skill's prescribed format. The skill adds consistency and format predictability more than it adds capability.

---

## Summary

| Skill | With Score | Without Score | Delta |
|-------|-----------|--------------|-------|
| spec-driven-dev | 6/6 | 3/6 | **+3** |
| fullstack-dev | 6/6 | 5/6 | **+1** |
| state-machine-designer | 6/6 | 5.5/6 | **+0.5** |

**Observations:**
- **spec-driven-dev** shows the largest delta (+3). The skill's primary value is enforcing the SDD workflow (phase gates, enforcement rules, structured acceptance criteria) -- governance that Claude does not produce naturally.
- **fullstack-dev** shows a moderate delta (+1). The skill ensures the full auth template (register/login/refresh/logout with token rotation) is produced rather than the simpler register/login-only approach the model defaults to.
- **state-machine-designer** shows the smallest delta (+0.5). Claude naturally produces strong state machine designs; the skill mainly enforces the specific output format (const enum + transition map, structured tables, validation checklist) rather than adding substantive capability. The without-skill output was actually deeper in some dimensions (DI interfaces, error classes, introspection utilities).
