# Task Breakdown: Multi-Tenant Billing System

## Implementation Phases

This feature is broken into 6 implementation phases, ordered by dependency. Each task includes estimated effort, affected files, verification steps, and suggested commit message.

---

## Phase 1: Data Model and Database Schema

### Task 1.1: Create billing database migrations
- **Effort:** 3 story points
- **Description:** Create migration files for all billing tables: plans, subscriptions, usage_events, invoices, invoice_items, payment_methods, audit_log, webhook_events.
- **Files:**
  - `db/migrations/YYYYMMDD_create_plans_table.sql`
  - `db/migrations/YYYYMMDD_create_subscriptions_table.sql`
  - `db/migrations/YYYYMMDD_create_usage_events_table.sql`
  - `db/migrations/YYYYMMDD_create_invoices_table.sql`
  - `db/migrations/YYYYMMDD_create_invoice_items_table.sql`
  - `db/migrations/YYYYMMDD_create_payment_methods_table.sql`
  - `db/migrations/YYYYMMDD_create_audit_log_table.sql`
  - `db/migrations/YYYYMMDD_create_webhook_events_table.sql`
- **Verification:** Run migrations against a test database. Confirm all tables created with correct columns, constraints, and indexes.
- **Commit:** `feat(billing): add database migrations for billing tables`
- [ ] Complete

### Task 1.2: Create data models / ORM entities
- **Effort:** 3 story points
- **Description:** Define ORM models for all billing entities with proper types, relations, and validation.
- **Files:**
  - `src/billing/models/plan.model.ts`
  - `src/billing/models/subscription.model.ts`
  - `src/billing/models/usage-event.model.ts`
  - `src/billing/models/invoice.model.ts`
  - `src/billing/models/invoice-item.model.ts`
  - `src/billing/models/payment-method.model.ts`
  - `src/billing/models/audit-log.model.ts`
  - `src/billing/models/webhook-event.model.ts`
  - `src/billing/models/index.ts`
- **Verification:** Unit tests for model validation rules. ORM sync confirms schema matches migrations.
- **Commit:** `feat(billing): add ORM models for billing entities`
- [ ] Complete

### Task 1.3: Seed default subscription plans
- **Effort:** 1 story point
- **Description:** Create seed data for initial plans (Free, Starter, Professional, Enterprise) with feature entitlements and usage meter definitions.
- **Files:**
  - `db/seeds/billing-plans.seed.ts`
- **Verification:** Run seed script. Confirm 4 plans exist with correct pricing, features, and meters.
- **Commit:** `feat(billing): add seed data for default subscription plans`
- [ ] Complete

---

## Phase 2: Stripe Integration Layer

### Task 2.1: Implement Stripe client wrapper
- **Effort:** 3 story points
- **Description:** Create a typed Stripe client wrapper with error handling, idempotency key generation, and retry logic.
- **Files:**
  - `src/billing/integrations/stripe/stripe.client.ts`
  - `src/billing/integrations/stripe/stripe.types.ts`
  - `src/billing/integrations/stripe/stripe.errors.ts`
  - `tests/billing/integrations/stripe/stripe.client.test.ts`
- **Verification:** Unit tests pass. Mock Stripe API calls verify correct parameters and error handling.
- **Commit:** `feat(billing): add Stripe client wrapper with idempotency and retry logic`
- [ ] Complete

### Task 2.2: Implement Stripe webhook handler
- **Effort:** 5 story points
- **Description:** Build the webhook endpoint with signature verification, idempotency (skip duplicate events), and event routing to handlers for subscription, invoice, and payment events.
- **Files:**
  - `src/billing/webhooks/stripe-webhook.controller.ts`
  - `src/billing/webhooks/stripe-webhook.service.ts`
  - `src/billing/webhooks/handlers/subscription.handler.ts`
  - `src/billing/webhooks/handlers/invoice.handler.ts`
  - `src/billing/webhooks/handlers/payment.handler.ts`
  - `src/billing/webhooks/handlers/dispute.handler.ts`
  - `tests/billing/webhooks/stripe-webhook.test.ts`
- **Verification:** Unit tests for each handler. Integration test with Stripe CLI webhook forwarding.
- **Commit:** `feat(billing): add Stripe webhook handler with event routing`
- [ ] Complete

### Task 2.3: Implement payment method management
- **Effort:** 3 story points
- **Description:** Service and API for adding, listing, removing, and setting default payment methods via Stripe.
- **Files:**
  - `src/billing/services/payment.service.ts`
  - `src/billing/controllers/payment-method.controller.ts`
  - `tests/billing/services/payment.service.test.ts`
- **Verification:** Unit tests pass. E2E test: add card via Stripe test token, verify it appears in list.
- **Commit:** `feat(billing): add payment method management service and API`
- [ ] Complete

---

## Phase 3: Core Billing Services

### Task 3.1: Implement PlanService
- **Effort:** 2 story points
- **Description:** CRUD operations for subscription plans, feature entitlement checks, plan comparison logic.
- **Files:**
  - `src/billing/services/plan.service.ts`
  - `src/billing/controllers/plan.controller.ts`
  - `tests/billing/services/plan.service.test.ts`
- **Verification:** Unit tests for CRUD, entitlement checks, and plan archival logic.
- **Commit:** `feat(billing): add plan management service`
- [ ] Complete

### Task 3.2: Implement SubscriptionService
- **Effort:** 5 story points
- **Description:** Subscription lifecycle: create (with Stripe sync), change plan (with proration), cancel (immediate or at period end), pause, resume. Trial period handling.
- **Files:**
  - `src/billing/services/subscription.service.ts`
  - `src/billing/controllers/subscription.controller.ts`
  - `tests/billing/services/subscription.service.test.ts`
- **Verification:** Unit tests for all subscription transitions. Integration test: create sub in Stripe, verify local record matches.
- **Commit:** `feat(billing): add subscription lifecycle management with Stripe sync`
- [ ] Complete

### Task 3.3: Implement UsageService
- **Effort:** 5 story points
- **Description:** Usage event ingestion with idempotency, aggregation per billing period, threshold detection, and usage-based charge calculation (flat, graduated, volume, package pricing).
- **Files:**
  - `src/billing/services/usage.service.ts`
  - `src/billing/controllers/usage.controller.ts`
  - `src/billing/services/usage-pricing.calculator.ts`
  - `tests/billing/services/usage.service.test.ts`
  - `tests/billing/services/usage-pricing.calculator.test.ts`
- **Verification:** Unit tests for all pricing models. Load test: ingest 1000 events/sec, verify aggregation accuracy.
- **Commit:** `feat(billing): add usage tracking service with pricing calculators`
- [ ] Complete

### Task 3.4: Implement AuditService
- **Effort:** 2 story points
- **Description:** Append-only audit logging for all billing mutations. Query interface with filters.
- **Files:**
  - `src/billing/services/audit.service.ts`
  - `tests/billing/services/audit.service.test.ts`
- **Verification:** Unit tests. Verify no update/delete operations are possible on audit_log table.
- **Commit:** `feat(billing): add immutable audit logging service`
- [ ] Complete

---

## Phase 4: Invoice Generation

### Task 4.1: Implement InvoiceService
- **Effort:** 5 story points
- **Description:** Invoice generation: aggregate subscription charges + usage charges into line items, calculate taxes, apply credits/discounts, set sequential invoice numbers per tenant.
- **Files:**
  - `src/billing/services/invoice.service.ts`
  - `src/billing/controllers/invoice.controller.ts`
  - `tests/billing/services/invoice.service.test.ts`
- **Verification:** Unit tests for invoice calculation accuracy. Verify sequential numbering. Verify tax calculation.
- **Commit:** `feat(billing): add invoice generation service`
- [ ] Complete

### Task 4.2: Implement PDF invoice generation
- **Effort:** 3 story points
- **Description:** HTML invoice template rendered to PDF. Template includes company logo, billing details, line items, totals, payment status.
- **Files:**
  - `src/billing/services/pdf-generator.service.ts`
  - `src/billing/templates/invoice.template.html`
  - `src/billing/templates/invoice.template.css`
  - `tests/billing/services/pdf-generator.service.test.ts`
- **Verification:** Generate a test PDF. Visually inspect layout. Verify all data fields populate correctly.
- **Commit:** `feat(billing): add PDF invoice generation with HTML template`
- [ ] Complete

### Task 4.3: Implement invoice email delivery
- **Effort:** 2 story points
- **Description:** Send invoice emails to tenant billing contact with PDF attachment. Email template with payment link.
- **Files:**
  - `src/billing/services/invoice-email.service.ts`
  - `src/billing/templates/invoice-email.template.html`
  - `tests/billing/services/invoice-email.service.test.ts`
- **Verification:** Unit tests with mock email service. Verify email content and PDF attachment.
- **Commit:** `feat(billing): add invoice email delivery`
- [ ] Complete

### Task 4.4: Implement billing period job scheduler
- **Effort:** 3 story points
- **Description:** Scheduled job that runs at the end of each billing period: aggregates usage, generates invoices, triggers email delivery. Uses job queue for reliability.
- **Files:**
  - `src/billing/jobs/billing-period.job.ts`
  - `src/billing/jobs/invoice-generation.job.ts`
  - `src/billing/jobs/usage-aggregation.job.ts`
  - `tests/billing/jobs/billing-period.job.test.ts`
- **Verification:** Run job in test environment. Verify invoices generated for all active subscriptions with correct amounts.
- **Commit:** `feat(billing): add billing period job scheduler`
- [ ] Complete

---

## Phase 5: Admin Dashboard

### Task 5.1: Implement revenue metrics API
- **Effort:** 3 story points
- **Description:** API endpoints for MRR, ARR, churn rate, revenue by plan, growth trends. Pre-computed via materialized view or cache for dashboard performance.
- **Files:**
  - `src/billing/services/metrics.service.ts`
  - `src/billing/controllers/admin/dashboard.controller.ts`
  - `tests/billing/services/metrics.service.test.ts`
- **Verification:** Unit tests with known data sets. Verify MRR calculation accuracy. Dashboard API responds < 2s.
- **Commit:** `feat(billing): add revenue metrics API for admin dashboard`
- [ ] Complete

### Task 5.2: Build admin dashboard UI - Revenue overview
- **Effort:** 5 story points
- **Description:** Dashboard page with MRR/ARR/churn cards, revenue trend charts, and revenue-by-plan breakdown.
- **Files:**
  - `src/app/admin/billing/page.tsx` (or equivalent)
  - `src/app/admin/billing/components/RevenueCards.tsx`
  - `src/app/admin/billing/components/RevenueChart.tsx`
  - `src/app/admin/billing/components/PlanBreakdown.tsx`
  - `src/app/admin/billing/hooks/useDashboardMetrics.ts`
- **Verification:** Visual review. Verify data matches API responses. Responsive layout works on desktop and tablet.
- **Commit:** `feat(billing): add admin dashboard revenue overview UI`
- [ ] Complete

### Task 5.3: Build admin dashboard UI - Tenant billing table
- **Effort:** 3 story points
- **Description:** Paginated, searchable, filterable table of all tenants with billing info. Inline actions for retry, view details, apply credit.
- **Files:**
  - `src/app/admin/billing/components/TenantBillingTable.tsx`
  - `src/app/admin/billing/components/TenantBillingFilters.tsx`
  - `src/app/admin/billing/components/TenantBillingActions.tsx`
  - `src/app/admin/billing/hooks/useTenantBilling.ts`
- **Verification:** Test with 100+ tenant records. Verify filtering, search, pagination, and action buttons work.
- **Commit:** `feat(billing): add admin tenant billing table with filters and actions`
- [ ] Complete

### Task 5.4: Build admin dashboard UI - Failed payments panel
- **Effort:** 2 story points
- **Description:** Alert panel showing failed payments, retry counts, failure reasons, and one-click retry.
- **Files:**
  - `src/app/admin/billing/components/FailedPaymentsPanel.tsx`
  - `src/app/admin/billing/hooks/useFailedPayments.ts`
- **Verification:** Test with mock failed payment data. Verify retry action triggers API call and updates status.
- **Commit:** `feat(billing): add failed payments alert panel for admin dashboard`
- [ ] Complete

### Task 5.5: Implement revenue report CSV export
- **Effort:** 2 story points
- **Description:** API endpoint and UI button to export revenue data as CSV with configurable date range.
- **Files:**
  - `src/billing/controllers/admin/reports.controller.ts`
  - `src/billing/services/report-export.service.ts`
  - `src/app/admin/billing/components/ExportButton.tsx`
  - `tests/billing/services/report-export.service.test.ts`
- **Verification:** Download CSV. Open in spreadsheet. Verify data accuracy and column formatting.
- **Commit:** `feat(billing): add revenue report CSV export`
- [ ] Complete

---

## Phase 6: Tenant Billing Portal

### Task 6.1: Build tenant subscription management UI
- **Effort:** 3 story points
- **Description:** Tenant-facing page showing current plan, usage summary, next billing date, and plan change options.
- **Files:**
  - `src/app/billing/page.tsx`
  - `src/app/billing/components/CurrentPlan.tsx`
  - `src/app/billing/components/UsageSummary.tsx`
  - `src/app/billing/components/PlanSelector.tsx`
  - `src/app/billing/hooks/useSubscription.ts`
- **Verification:** Test plan upgrade/downgrade flow end-to-end. Verify proration message displays correctly.
- **Commit:** `feat(billing): add tenant subscription management UI`
- [ ] Complete

### Task 6.2: Build tenant payment methods UI
- **Effort:** 2 story points
- **Description:** Payment method management: list cards, add new card (Stripe Elements), set default, remove.
- **Files:**
  - `src/app/billing/components/PaymentMethods.tsx`
  - `src/app/billing/components/AddPaymentMethod.tsx`
  - `src/app/billing/hooks/usePaymentMethods.ts`
- **Verification:** Add test card. Verify it appears in list. Set as default. Remove it.
- **Commit:** `feat(billing): add tenant payment method management UI`
- [ ] Complete

### Task 6.3: Build tenant invoice history UI
- **Effort:** 2 story points
- **Description:** Invoice list with status indicators, PDF download buttons, and invoice detail view.
- **Files:**
  - `src/app/billing/components/InvoiceHistory.tsx`
  - `src/app/billing/components/InvoiceDetail.tsx`
  - `src/app/billing/hooks/useInvoices.ts`
- **Verification:** Verify invoice list loads, PDF downloads work, and detail view shows correct line items.
- **Commit:** `feat(billing): add tenant invoice history UI`
- [ ] Complete

---

## Summary

| Phase | Tasks | Total Story Points |
|-------|-------|--------------------|
| Phase 1: Data Model | 3 | 7 |
| Phase 2: Stripe Integration | 3 | 11 |
| Phase 3: Core Services | 4 | 14 |
| Phase 4: Invoice Generation | 4 | 13 |
| Phase 5: Admin Dashboard | 5 | 15 |
| Phase 6: Tenant Portal | 3 | 7 |
| **Total** | **22** | **67** |

**Estimated timeline:** 3-4 sprints (2-week sprints), assuming 20 story points per sprint.

---

## Review Checklist (Before Merging)

- [ ] All migrations run cleanly on fresh database
- [ ] All unit tests pass with > 80% coverage
- [ ] Stripe webhook integration tested with Stripe CLI
- [ ] Invoice PDF renders correctly with all field variations
- [ ] Admin dashboard loads within 2 seconds with 10K+ tenants
- [ ] No tenant can access another tenant's billing data (tested)
- [ ] All financial amounts stored as integers (cents)
- [ ] Audit log captures every billing mutation
- [ ] Error handling covers all Stripe API failure modes
- [ ] Security review passed (no secrets in code, auth on all endpoints)
