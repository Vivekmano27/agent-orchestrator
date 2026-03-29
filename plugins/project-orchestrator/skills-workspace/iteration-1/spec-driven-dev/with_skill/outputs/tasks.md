# Tasks: Multi-Tenant Billing System

## Phase Gate: Requirements
- [x] All user stories have acceptance criteria with Given/When/Then format
- [x] Business rules documented (BR-1 through BR-10)
- [x] Non-functional requirements specified with measurable thresholds
- [x] Scope boundaries explicit (in scope AND out of scope)
- [x] Open questions listed for stakeholder resolution

**Gate:** Product Owner / User approves `requirements.md` before proceeding to Design.

## Phase Gate: Design
- [x] Architecture diagram shows all service interactions
- [x] Every API endpoint from requirements has a design entry
- [x] Data model supports all business rules
- [x] Sequence diagrams cover key flows (subscription, usage, invoicing)
- [x] Error handling documented for all failure scenarios
- [x] Migration strategy defined with rollout plan

**Gate:** Tech Lead approves `design.md` before proceeding to Tasks.

## Phase Gate: Tasks
- [ ] Every design element maps to at least one task
- [ ] All tasks have verification commands
- [ ] Dependency order is valid (no circular dependencies)
- [ ] Effort estimates are reasonable
- [ ] Each task produces one atomic commit

**Gate:** Review task order and scope before implementation begins.

---

## TASK-001: Create billing database migrations
- **Files:** src/migrations/001_create_billing_plans.ts, src/migrations/002_create_tenant_subscriptions.ts, src/migrations/003_create_usage_records.ts, src/migrations/004_create_invoices.ts, src/migrations/005_create_payment_methods.ts, src/migrations/006_create_billing_events.ts, src/migrations/007_create_admin_credits.ts, src/migrations/008_add_stripe_customer_id_to_tenants.ts
- **Depends on:** None
- **Verification:** `npm run migration:run && npm run migration:revert && npm run migration:run`
- **Effort:** M (3-5 story points)
- **Commit:** `feat(billing): add billing database migrations`

## TASK-002: Seed initial billing plan data
- **Files:** src/migrations/seed/billing_plans_seed.ts
- **Depends on:** TASK-001
- **Verification:** `npm run seed:billing-plans && npm test -- --grep "billing plans seed"`
- **Effort:** S (1-2 story points)
- **Commit:** `feat(billing): seed initial billing plan data (Free, Starter, Pro, Enterprise)`

## TASK-003: Create Stripe service integration layer
- **Files:** src/billing/stripe/stripe.module.ts, src/billing/stripe/stripe.service.ts, src/billing/stripe/stripe.types.ts, src/billing/stripe/stripe.config.ts
- **Depends on:** None
- **Verification:** `npm test -- --grep StripeService`
- **Effort:** M (3-5 story points)
- **Commit:** `feat(billing): add Stripe service integration layer`

## TASK-004: Implement BillingPlanService with CRUD operations
- **Files:** src/billing/plans/plan.service.ts, src/billing/plans/plan.module.ts, src/billing/plans/dto/create-plan.dto.ts, src/billing/plans/dto/update-plan.dto.ts, src/billing/plans/plan.entity.ts
- **Depends on:** TASK-001, TASK-003
- **Verification:** `npm test -- --grep BillingPlanService`
- **Effort:** M (3-5 story points)
- **Commit:** `feat(billing): implement billing plan service with CRUD`

## TASK-005: Implement SubscriptionService (create, upgrade, downgrade, cancel)
- **Files:** src/billing/subscriptions/subscription.service.ts, src/billing/subscriptions/subscription.module.ts, src/billing/subscriptions/dto/create-subscription.dto.ts, src/billing/subscriptions/dto/update-subscription.dto.ts, src/billing/subscriptions/subscription.entity.ts
- **Depends on:** TASK-001, TASK-003, TASK-004
- **Verification:** `npm test -- --grep SubscriptionService`
- **Effort:** L (8-13 story points)
- **Commit:** `feat(billing): implement subscription service with lifecycle management`

## TASK-006: Implement Stripe webhook handler
- **Files:** src/billing/webhooks/webhook.controller.ts, src/billing/webhooks/webhook.service.ts, src/billing/webhooks/webhook.module.ts, src/billing/webhooks/handlers/checkout.handler.ts, src/billing/webhooks/handlers/subscription.handler.ts, src/billing/webhooks/handlers/invoice.handler.ts, src/billing/webhooks/handlers/payment-method.handler.ts
- **Depends on:** TASK-003, TASK-005
- **Verification:** `npm test -- --grep "Stripe Webhook" && npm test -- --grep "webhook handler"`
- **Effort:** L (8-13 story points)
- **Commit:** `feat(billing): implement Stripe webhook handler with event routing`

## TASK-007: Implement UsageMeteringService
- **Files:** src/billing/usage/usage.service.ts, src/billing/usage/usage.module.ts, src/billing/usage/dto/record-usage.dto.ts, src/billing/usage/usage.entity.ts, src/billing/usage/usage-sync.job.ts
- **Depends on:** TASK-001, TASK-003
- **Verification:** `npm test -- --grep UsageMeteringService`
- **Effort:** M (3-5 story points)
- **Commit:** `feat(billing): implement usage metering service with Stripe sync`

## TASK-008: Implement InvoiceService
- **Files:** src/billing/invoices/invoice.service.ts, src/billing/invoices/invoice.module.ts, src/billing/invoices/invoice.entity.ts, src/billing/invoices/invoice-pdf.service.ts
- **Depends on:** TASK-001, TASK-003
- **Verification:** `npm test -- --grep InvoiceService`
- **Effort:** M (3-5 story points)
- **Commit:** `feat(billing): implement invoice service with PDF generation`

## TASK-009: Implement PaymentMethodService
- **Files:** src/billing/payment-methods/payment-method.service.ts, src/billing/payment-methods/payment-method.module.ts, src/billing/payment-methods/dto/add-payment-method.dto.ts, src/billing/payment-methods/payment-method.entity.ts
- **Depends on:** TASK-001, TASK-003
- **Verification:** `npm test -- --grep PaymentMethodService`
- **Effort:** S (1-2 story points)
- **Commit:** `feat(billing): implement payment method service`

## TASK-010: Implement BillingAuditService
- **Files:** src/billing/audit/audit.service.ts, src/billing/audit/audit.module.ts, src/billing/audit/billing-event.entity.ts
- **Depends on:** TASK-001
- **Verification:** `npm test -- --grep BillingAuditService`
- **Effort:** S (1-2 story points)
- **Commit:** `feat(billing): implement billing audit service with immutable event log`

## TASK-011: Implement NotificationService for billing events
- **Files:** src/billing/notifications/notification.service.ts, src/billing/notifications/notification.module.ts, src/billing/notifications/templates/payment-success.ts, src/billing/notifications/templates/payment-failed.ts, src/billing/notifications/templates/usage-threshold.ts
- **Depends on:** None
- **Verification:** `npm test -- --grep "Billing NotificationService"`
- **Effort:** M (3-5 story points)
- **Commit:** `feat(billing): implement billing notification service with email templates`

## TASK-012: Create tenant billing API controller
- **Files:** src/billing/controllers/billing.controller.ts, src/billing/billing.module.ts
- **Depends on:** TASK-004, TASK-005, TASK-007, TASK-008, TASK-009
- **Verification:** `npm test -- --grep BillingController && npm run test:e2e -- --grep "billing API"`
- **Effort:** M (3-5 story points)
- **Commit:** `feat(billing): add tenant billing API controller with all endpoints`

## TASK-013: Create admin billing API controller
- **Files:** src/billing/controllers/admin-billing.controller.ts, src/billing/admin/admin-billing.module.ts, src/billing/admin/admin-credit.service.ts, src/billing/admin/admin-credit.entity.ts
- **Depends on:** TASK-004, TASK-005, TASK-007, TASK-008, TASK-010
- **Verification:** `npm test -- --grep AdminBillingController`
- **Effort:** M (3-5 story points)
- **Commit:** `feat(billing): add admin billing API controller with tenant management`

## TASK-014: Implement dunning management (failed payment retry flow)
- **Files:** src/billing/dunning/dunning.service.ts, src/billing/dunning/dunning.module.ts, src/billing/dunning/dunning.job.ts
- **Depends on:** TASK-005, TASK-006, TASK-011
- **Verification:** `npm test -- --grep DunningService`
- **Effort:** M (3-5 story points)
- **Commit:** `feat(billing): implement dunning management with retry schedule`

## TASK-015: Build tenant billing page -- subscription overview
- **Files:** src/app/billing/page.tsx, src/app/billing/layout.tsx, src/components/billing/SubscriptionStatus.tsx, src/components/billing/BillingAlert.tsx
- **Depends on:** TASK-012
- **Verification:** `npm run test:e2e -- --grep "billing overview page" && npm run lint`
- **Effort:** M (3-5 story points)
- **Commit:** `feat(billing-ui): add subscription overview page`

## TASK-016: Build plan selection and comparison page
- **Files:** src/app/billing/plans/page.tsx, src/components/billing/PlanCard.tsx, src/components/billing/PlanComparison.tsx, src/components/billing/ProrationPreview.tsx
- **Depends on:** TASK-012
- **Verification:** `npm run test:e2e -- --grep "plan selection" && npm run lint`
- **Effort:** M (3-5 story points)
- **Commit:** `feat(billing-ui): add plan selection and comparison page`

## TASK-017: Build usage dashboard page
- **Files:** src/app/billing/usage/page.tsx, src/components/billing/UsageBar.tsx, src/components/billing/UsageChart.tsx
- **Depends on:** TASK-012
- **Verification:** `npm run test:e2e -- --grep "usage dashboard" && npm run lint`
- **Effort:** M (3-5 story points)
- **Commit:** `feat(billing-ui): add usage dashboard with charts and progress bars`

## TASK-018: Build invoice history and detail pages
- **Files:** src/app/billing/invoices/page.tsx, src/app/billing/invoices/[id]/page.tsx, src/components/billing/InvoiceTable.tsx, src/components/billing/InvoiceLineItems.tsx
- **Depends on:** TASK-012
- **Verification:** `npm run test:e2e -- --grep "invoice" && npm run lint`
- **Effort:** M (3-5 story points)
- **Commit:** `feat(billing-ui): add invoice history and detail pages`

## TASK-019: Build payment method management page
- **Files:** src/app/billing/payment-methods/page.tsx, src/components/billing/PaymentMethodCard.tsx, src/components/billing/PaymentMethodForm.tsx
- **Depends on:** TASK-012
- **Verification:** `npm run test:e2e -- --grep "payment methods" && npm run lint`
- **Effort:** M (3-5 story points)
- **Commit:** `feat(billing-ui): add payment method management with Stripe Elements`

## TASK-020: Build admin billing dashboard page
- **Files:** src/app/admin/billing/page.tsx, src/components/admin/billing/RevenueKPICards.tsx, src/components/admin/billing/RevenueChart.tsx, src/components/admin/billing/ChurnChart.tsx
- **Depends on:** TASK-013
- **Verification:** `npm run test:e2e -- --grep "admin billing dashboard" && npm run lint`
- **Effort:** M (3-5 story points)
- **Commit:** `feat(billing-ui): add admin billing dashboard with KPI cards`

## TASK-021: Build admin tenant billing management pages
- **Files:** src/app/admin/billing/tenants/page.tsx, src/app/admin/billing/tenants/[id]/page.tsx, src/components/admin/billing/TenantBillingTable.tsx, src/components/admin/billing/TenantBillingDetail.tsx, src/components/admin/billing/CreditAdjustmentForm.tsx
- **Depends on:** TASK-013
- **Verification:** `npm run test:e2e -- --grep "admin tenant billing" && npm run lint`
- **Effort:** M (3-5 story points)
- **Commit:** `feat(billing-ui): add admin tenant billing management pages`

## TASK-022: Build admin plan management and failed payment queue pages
- **Files:** src/app/admin/billing/plans/page.tsx, src/components/admin/billing/PlanEditor.tsx, src/app/admin/billing/failed-payments/page.tsx, src/components/admin/billing/FailedPaymentQueue.tsx
- **Depends on:** TASK-013
- **Verification:** `npm run test:e2e -- --grep "admin plan management" && npm run test:e2e -- --grep "failed payments" && npm run lint`
- **Effort:** M (3-5 story points)
- **Commit:** `feat(billing-ui): add admin plan management and failed payment queue`

## TASK-023: Integration tests for complete billing flows
- **Files:** src/billing/__tests__/integration/subscription-flow.test.ts, src/billing/__tests__/integration/usage-billing-flow.test.ts, src/billing/__tests__/integration/webhook-processing.test.ts, src/billing/__tests__/integration/dunning-flow.test.ts
- **Depends on:** TASK-006, TASK-012, TASK-013, TASK-014
- **Verification:** `npm run test:integration -- --grep "billing integration"`
- **Effort:** L (8-13 story points)
- **Commit:** `test(billing): add integration tests for complete billing flows`

## TASK-024: E2E tests for tenant and admin billing UI
- **Files:** e2e/billing/subscription.spec.ts, e2e/billing/usage.spec.ts, e2e/billing/invoices.spec.ts, e2e/billing/payment-methods.spec.ts, e2e/billing/admin-dashboard.spec.ts
- **Depends on:** TASK-015, TASK-016, TASK-017, TASK-018, TASK-019, TASK-020, TASK-021, TASK-022
- **Verification:** `npx playwright test e2e/billing/`
- **Effort:** L (8-13 story points)
- **Commit:** `test(billing): add E2E tests for billing UI flows`

---

## Phase Gate: Implementation
- [ ] All 24 tasks complete
- [ ] All verification commands pass
- [ ] All unit tests pass: `npm test -- --grep billing`
- [ ] All integration tests pass: `npm run test:integration -- --grep billing`
- [ ] All E2E tests pass: `npx playwright test e2e/billing/`
- [ ] Stripe webhook endpoint tested with Stripe CLI: `stripe trigger checkout.session.completed`
- [ ] Tenant data isolation verified (tenant A cannot see tenant B's billing data)
- [ ] PR created with all atomic commits

**Gate:** Code review on completed PR. Update `lessons.md` after completion.

---

## Enforcement Rules
- NEVER skip to implementation without approved `requirements.md`
- NEVER write code before `design.md` is reviewed
- ALWAYS create tasks before implementation
- Each task MUST have a verification command
- Each task = one atomic commit with conventional commit message
- When requirements change mid-implementation: update specs first, then adjust tasks, then continue
- Stripe secret keys MUST be in environment variables -- never in code or committed files
- All Stripe API calls MUST have error handling and timeouts
- Webhook handler MUST verify Stripe signature before processing
- Usage metering MUST use idempotency keys to prevent double-counting

## Dependency Graph

```
TASK-001 (migrations)
├── TASK-002 (seed data)
├── TASK-004 (plan service) ──────┐
│   └── requires TASK-003         │
├── TASK-005 (subscription svc) ──┤
│   └── requires TASK-003, 004    │
├── TASK-007 (usage svc)          │
│   └── requires TASK-003         │
├── TASK-008 (invoice svc)        │
│   └── requires TASK-003         │
├── TASK-009 (payment method svc) │
│   └── requires TASK-003         │
└── TASK-010 (audit svc)          │
                                  │
TASK-003 (stripe integration) ────┘

TASK-006 (webhooks)
└── requires TASK-003, 005

TASK-011 (notifications)
└── no dependencies

TASK-012 (billing controller)
└── requires TASK-004, 005, 007, 008, 009

TASK-013 (admin controller)
└── requires TASK-004, 005, 007, 008, 010

TASK-014 (dunning)
└── requires TASK-005, 006, 011

TASK-015..019 (tenant UI)
└── requires TASK-012

TASK-020..022 (admin UI)
└── requires TASK-013

TASK-023 (integration tests)
└── requires TASK-006, 012, 013, 014

TASK-024 (E2E tests)
└── requires TASK-015..022
```
