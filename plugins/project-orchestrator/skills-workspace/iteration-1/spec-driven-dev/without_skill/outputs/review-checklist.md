# Review Checklist: Multi-Tenant Billing System

## Purpose

This checklist serves as the quality gate before merging the billing system feature. Every item must be verified and checked off by the reviewer. Items are ordered by criticality.

---

## Phase Gate: Requirements Review

- [ ] All functional requirements (FR-1 through FR-6) are addressed in the design
- [ ] All non-functional requirements (NFR-1 through NFR-5) have implementation strategies
- [ ] Open questions have been resolved with the stakeholder
- [ ] Out-of-scope items are clearly documented and not accidentally included
- [ ] User stories have acceptance criteria that are testable

**Gate decision:** Approve requirements before proceeding to design.

---

## Phase Gate: Design Review

- [ ] Data model covers all entities needed by the requirements
- [ ] All API endpoints map to at least one functional requirement
- [ ] Stripe integration design handles all required webhook events
- [ ] Error handling strategy covers payment failures, API errors, and edge cases
- [ ] Security design addresses PCI compliance, tenant isolation, and audit logging
- [ ] Technology decisions are justified with rationale
- [ ] No over-engineering: design matches the complexity of the requirements

**Gate decision:** Approve design before proceeding to implementation.

---

## Phase Gate: Implementation Review

### Data Layer
- [ ] Migrations run cleanly on a fresh database (up and down)
- [ ] All foreign keys, constraints, and indexes match the design spec
- [ ] Amounts stored as integers (cents) — no floating-point for money
- [ ] Audit log table has no UPDATE or DELETE permissions
- [ ] Idempotency constraints enforced at the database level (unique indexes)

### Business Logic
- [ ] Subscription lifecycle transitions match the state diagram
- [ ] Proration calculations are correct for upgrades and downgrades
- [ ] Usage pricing calculator handles all pricing models (flat, graduated, volume, package)
- [ ] Invoice generation aggregates subscription + usage correctly
- [ ] Invoice numbering is sequential and tenant-isolated
- [ ] Credit notes and refunds link to the correct invoices

### Stripe Integration
- [ ] Stripe API calls use idempotency keys
- [ ] Webhook signature verification is enabled and tested
- [ ] All required Stripe events are handled (see design spec events table)
- [ ] Webhook handler is idempotent (duplicate events do not cause double-processing)
- [ ] Stripe API errors are caught, logged, and do not corrupt local state
- [ ] Stripe test mode used for all test environments

### Security
- [ ] All billing endpoints require authentication
- [ ] Tenant isolation enforced at service layer (tenant_id in every query)
- [ ] Admin endpoints require admin role
- [ ] No raw card numbers stored anywhere in the system
- [ ] Stripe API keys stored as environment variables, not in code
- [ ] Webhook endpoint uses signature verification instead of session auth
- [ ] SQL injection prevented (parameterized queries only)
- [ ] Input validation on all user-provided data
- [ ] Financial mutations recorded in immutable audit log

### API
- [ ] All endpoints return consistent response format (data/meta/error)
- [ ] All endpoints have request validation (body, params, query)
- [ ] Error codes follow the `BILLING_*` convention
- [ ] Pagination implemented correctly (page, pageSize, totalItems)
- [ ] Rate limiting applied to usage event ingestion endpoint

### Frontend
- [ ] Admin dashboard loads within 2 seconds
- [ ] Tenant billing portal shows correct subscription and usage info
- [ ] Stripe Elements integration handles card input securely (no card data in our forms)
- [ ] Error states displayed for failed payments, expired cards, etc.
- [ ] Loading states shown during async operations
- [ ] Responsive layout works on desktop and tablet

---

## Phase Gate: Testing Review

- [ ] Unit test coverage >= 85% overall, >= 90% for services
- [ ] All unit tests pass
- [ ] Integration tests cover Stripe webhook handling
- [ ] Tenant isolation security tests pass (SEC-1.1 through SEC-1.6)
- [ ] Webhook security tests pass (SEC-2.1 through SEC-2.4)
- [ ] E2E tests cover the 5 critical user flows
- [ ] Performance tests meet NFR targets (1K events/sec, 2s dashboard, 5s invoice)
- [ ] No flaky tests (all tests pass 3 consecutive runs)

---

## Phase Gate: Pre-Merge Verification

### Code Quality
- [ ] No linting errors
- [ ] No TypeScript `any` types
- [ ] No caught-and-swallowed errors
- [ ] No hardcoded secrets or API keys
- [ ] Conventional commit messages used for all commits
- [ ] Code reviewed by at least one other developer

### Documentation
- [ ] API endpoints documented (request/response examples)
- [ ] README updated with billing system setup instructions
- [ ] Environment variables documented (.env.example updated)
- [ ] Stripe webhook endpoint URL documented for production setup

### Deployment Readiness
- [ ] Database migrations tested in staging environment
- [ ] Stripe webhook endpoint registered in Stripe Dashboard (test and production)
- [ ] Environment variables set in deployment platform (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
- [ ] Job queue infrastructure provisioned for billing period jobs
- [ ] Monitoring and alerting configured for payment failures
- [ ] Rollback plan documented in case of critical issues

---

## Sign-Off

| Role | Name | Date | Decision |
|------|------|------|----------|
| Feature Lead | | | Approve / Request Changes |
| Security Reviewer | | | Approve / Request Changes |
| Tech Lead | | | Approve / Request Changes |

---

## Notes

- Any "Request Changes" decision blocks the merge until resolved.
- Security review is mandatory for billing features — no exceptions.
- Performance tests can be run post-merge if staging environment is not available, but must pass before production deployment.
