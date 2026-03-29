# Design Specification: Multi-Tenant Billing System

## Architecture Overview

The billing system is designed as a modular subsystem within the existing SaaS application. It follows a layered architecture with clear separation between the billing domain logic, Stripe integration, usage tracking, and presentation layers.

```
┌──────────────────────────────────────────────────────────┐
│                   Admin Dashboard (UI)                    │
│           Tenant Billing Portal (UI)                     │
├──────────────────────────────────────────────────────────┤
│                    API Layer (REST)                       │
│   /api/billing/*   /api/admin/billing/*   /api/usage/*   │
├──────────────────────────────────────────────────────────┤
│                  Service Layer                           │
│  SubscriptionService  │  UsageService  │  InvoiceService │
│  PlanService          │  PaymentService│  AuditService   │
├──────────────────────────────────────────────────────────┤
│                Integration Layer                         │
│     StripeClient      │    EmailClient  │  PDFGenerator  │
├──────────────────────────────────────────────────────────┤
│                   Data Layer                             │
│  Plans │ Subscriptions │ Usage │ Invoices │ AuditLog     │
├──────────────────────────────────────────────────────────┤
│               Infrastructure                             │
│     PostgreSQL    │   Redis/Queue    │   Object Storage   │
└──────────────────────────────────────────────────────────┘
```

---

## Data Model

### Entity Relationship Diagram

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Tenant    │────<│  Subscription    │>────│      Plan       │
│             │     │                  │     │                 │
│ id          │     │ id               │     │ id              │
│ name        │     │ tenant_id (FK)   │     │ name            │
│ stripe_id   │     │ plan_id (FK)     │     │ slug            │
│ billing_    │     │ stripe_sub_id    │     │ description     │
│   email     │     │ status           │     │ billing_interval│
│ currency    │     │ current_period_  │     │ base_price      │
│ tax_id      │     │   start         │     │ currency        │
│ billing_    │     │ current_period_  │     │ trial_days      │
│   address   │     │   end           │     │ features (JSON) │
│ created_at  │     │ trial_end        │     │ usage_meters    │
│ updated_at  │     │ canceled_at      │     │   (JSON)        │
└─────────────┘     │ created_at       │     │ is_active       │
      │             │ updated_at       │     │ sort_order      │
      │             └──────────────────┘     │ created_at      │
      │                                      │ updated_at      │
      │             ┌──────────────────┐     └─────────────────┘
      │             │  UsageEvent      │
      ├────────────<│                  │
      │             │ id               │
      │             │ tenant_id (FK)   │
      │             │ meter_name       │
      │             │ quantity         │
      │             │ idempotency_key  │
      │             │ timestamp        │
      │             │ properties (JSON)│
      │             │ created_at       │
      │             └──────────────────┘
      │
      │             ┌──────────────────┐     ┌─────────────────┐
      ├────────────<│    Invoice       │────<│  InvoiceItem    │
      │             │                  │     │                 │
      │             │ id               │     │ id              │
      │             │ tenant_id (FK)   │     │ invoice_id (FK) │
      │             │ invoice_number   │     │ description     │
      │             │ stripe_invoice_id│     │ type (sub/usage)│
      │             │ status           │     │ quantity        │
      │             │ subtotal         │     │ unit_price      │
      │             │ tax_amount       │     │ amount          │
      │             │ total            │     │ meter_name      │
      │             │ currency         │     │ period_start    │
      │             │ period_start     │     │ period_end      │
      │             │ period_end       │     │ created_at      │
      │             │ due_date         │     └─────────────────┘
      │             │ paid_at          │
      │             │ pdf_url          │
      │             │ created_at       │
      │             │ updated_at       │
      │             └──────────────────┘
      │
      │             ┌──────────────────┐
      ├────────────<│  PaymentMethod   │
      │             │                  │
      │             │ id               │
      │             │ tenant_id (FK)   │
      │             │ stripe_pm_id     │
      │             │ type (card/bank) │
      │             │ last_four        │
      │             │ brand            │
      │             │ exp_month        │
      │             │ exp_year         │
      │             │ is_default       │
      │             │ created_at       │
      │             └──────────────────┘
      │
      │             ┌──────────────────┐
      └────────────<│   AuditLog       │
                    │                  │
                    │ id               │
                    │ tenant_id (FK)   │
                    │ actor_id         │
                    │ actor_type       │
                    │ action           │
                    │ entity_type      │
                    │ entity_id        │
                    │ previous_value   │
                    │   (JSON)         │
                    │ new_value (JSON) │
                    │ metadata (JSON)  │
                    │ created_at       │
                    └──────────────────┘
```

### Key Database Indexes

```sql
-- High-frequency lookups
CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_stripe_sub_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_usage_events_tenant_meter ON usage_events(tenant_id, meter_name, timestamp);
CREATE INDEX idx_usage_events_idempotency ON usage_events(idempotency_key) UNIQUE;
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(tenant_id, invoice_number) UNIQUE;
CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id, created_at);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
```

---

## API Design

### Tenant-Facing Endpoints

```
GET    /api/billing/subscription          - Get current subscription
POST   /api/billing/subscription          - Create subscription (choose plan)
PATCH  /api/billing/subscription          - Change plan (upgrade/downgrade)
DELETE /api/billing/subscription          - Cancel subscription

GET    /api/billing/plans                 - List available plans
GET    /api/billing/plans/:slug           - Get plan details

GET    /api/billing/payment-methods       - List payment methods
POST   /api/billing/payment-methods       - Add payment method
DELETE /api/billing/payment-methods/:id   - Remove payment method
PATCH  /api/billing/payment-methods/:id   - Set default payment method

GET    /api/billing/invoices              - List invoices (paginated)
GET    /api/billing/invoices/:id          - Get invoice details
GET    /api/billing/invoices/:id/pdf      - Download invoice PDF

GET    /api/billing/usage                 - Get current period usage summary
GET    /api/billing/usage/:meter          - Get usage for specific meter
```

### Admin Endpoints

```
GET    /api/admin/billing/dashboard       - Dashboard metrics (MRR, ARR, churn)
GET    /api/admin/billing/tenants         - List tenants with billing info
GET    /api/admin/billing/tenants/:id     - Get tenant billing details

POST   /api/admin/billing/plans           - Create plan
PATCH  /api/admin/billing/plans/:id       - Update plan
DELETE /api/admin/billing/plans/:id       - Archive plan

POST   /api/admin/billing/tenants/:id/credits     - Apply credit
POST   /api/admin/billing/tenants/:id/discounts   - Apply discount
POST   /api/admin/billing/tenants/:id/retry       - Retry failed payment

GET    /api/admin/billing/invoices        - List all invoices (filterable)
POST   /api/admin/billing/invoices        - Create manual invoice

GET    /api/admin/billing/reports/revenue - Revenue report (CSV export)
GET    /api/admin/billing/audit-log       - Billing audit log
```

### Internal/Webhook Endpoints

```
POST   /api/webhooks/stripe               - Stripe webhook handler
POST   /api/internal/usage/events         - Ingest usage events (internal API)
```

---

## Service Design

### SubscriptionService

Responsibilities:
- Create, update, cancel subscriptions
- Handle plan changes with proration
- Sync subscription state with Stripe
- Manage trial periods

Key methods:
```
createSubscription(tenantId, planSlug, paymentMethodId) -> Subscription
changePlan(tenantId, newPlanSlug, prorate: boolean) -> Subscription
cancelSubscription(tenantId, cancelAtPeriodEnd: boolean) -> Subscription
pauseSubscription(tenantId) -> Subscription
resumeSubscription(tenantId) -> Subscription
syncFromStripe(stripeSubscriptionId) -> Subscription
```

### UsageService

Responsibilities:
- Ingest and deduplicate usage events
- Aggregate usage per billing period
- Check thresholds and trigger alerts
- Calculate usage-based charges

Key methods:
```
recordUsage(tenantId, meterName, quantity, idempotencyKey, properties?) -> UsageEvent
getUsageSummary(tenantId, periodStart, periodEnd) -> UsageSummary
getUsageByMeter(tenantId, meterName, periodStart, periodEnd) -> MeterUsage
calculateUsageCharges(tenantId, periodStart, periodEnd) -> UsageCharges[]
checkThresholds(tenantId) -> ThresholdAlert[]
```

### InvoiceService

Responsibilities:
- Generate invoices at period end
- Calculate line items (subscription + usage)
- Generate PDF
- Send invoice emails

Key methods:
```
generateInvoice(tenantId, periodStart, periodEnd) -> Invoice
createManualInvoice(tenantId, items[]) -> Invoice
generatePDF(invoiceId) -> Buffer
sendInvoiceEmail(invoiceId) -> void
applyCredit(invoiceId, amount, reason) -> CreditNote
markAsPaid(invoiceId) -> Invoice
```

### PaymentService

Responsibilities:
- Manage payment methods via Stripe
- Process payments
- Handle retries
- Create Stripe Checkout sessions

Key methods:
```
addPaymentMethod(tenantId, stripePaymentMethodId) -> PaymentMethod
removePaymentMethod(tenantId, paymentMethodId) -> void
setDefaultPaymentMethod(tenantId, paymentMethodId) -> void
retryPayment(invoiceId) -> PaymentResult
createCheckoutSession(tenantId, planSlug) -> CheckoutSession
```

### PlanService

Responsibilities:
- CRUD operations for plans
- Feature entitlement checks
- Plan comparison

Key methods:
```
createPlan(planData) -> Plan
updatePlan(planId, updates) -> Plan
archivePlan(planId) -> Plan
getAvailablePlans() -> Plan[]
getPlanBySlug(slug) -> Plan
checkEntitlement(tenantId, featureKey) -> boolean
```

### AuditService

Responsibilities:
- Record all billing mutations
- Query audit history
- Ensure immutability

Key methods:
```
log(tenantId, action, entityType, entityId, previousValue, newValue, actor) -> AuditEntry
getHistory(tenantId, filters?) -> AuditEntry[]
getEntityHistory(entityType, entityId) -> AuditEntry[]
```

---

## Stripe Webhook Handler Design

### Events to Handle

| Stripe Event | Action |
|---|---|
| `customer.subscription.created` | Sync subscription record |
| `customer.subscription.updated` | Update status, plan, period |
| `customer.subscription.deleted` | Mark subscription as canceled |
| `invoice.created` | Create local invoice record |
| `invoice.paid` | Mark invoice as paid, record payment |
| `invoice.payment_failed` | Mark failed, trigger alert, schedule retry |
| `invoice.finalized` | Update invoice with final amounts |
| `payment_intent.succeeded` | Record successful payment |
| `payment_intent.payment_failed` | Log failure, notify admin |
| `customer.updated` | Sync customer metadata |
| `charge.dispute.created` | Flag tenant, alert admin |

### Webhook Processing Flow

```
1. Receive POST /api/webhooks/stripe
2. Verify signature (stripe.webhooks.constructEvent)
3. Check idempotency (skip if event already processed)
4. Route to handler by event type
5. Execute handler within database transaction
6. Record event in webhook_events table
7. Return 200 OK
```

### Idempotency Strategy

- Store processed event IDs in a `webhook_events` table.
- Before processing, check if `stripe_event_id` already exists.
- If it exists, return 200 without re-processing.
- This prevents duplicate processing from Stripe retries.

---

## Admin Dashboard Design

### Dashboard Sections

**1. Revenue Overview (Top Cards)**
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Net Revenue (current month)
- Active Subscribers count
- Churn Rate (%) — trailing 30 days

**2. Revenue Chart**
- Line chart: MRR over last 12 months
- Stacked bar: Revenue by plan tier
- Toggle: Monthly / Quarterly / Annual view

**3. Tenant Billing Table**
- Columns: Tenant name, Plan, Status, MRR, Last payment, Next billing date, Balance
- Filters: Plan, Status (active/past_due/canceled/trialing), MRR range
- Search: By tenant name or email
- Actions: View details, Apply credit, Retry payment

**4. Failed Payments Alert Panel**
- List of tenants with failed payments
- Last attempt date, failure reason, retry count
- One-click retry button
- Escalation indicator (> 3 failures)

**5. Subscription Activity Feed**
- Recent subscription changes (upgrades, downgrades, cancellations)
- New signups
- Trial expirations approaching

---

## Error Handling Strategy

### Payment Failures

```
Attempt 1: Immediate (Stripe automatic)
Attempt 2: +3 days (scheduled job)
Attempt 3: +5 days (scheduled job)
Attempt 4: +7 days (scheduled job + admin notification)
After 4 failures: Mark subscription as past_due, notify tenant and admin
Grace period: 14 days total before suspension
```

### API Error Responses

All billing API errors follow a consistent format:

```json
{
  "error": {
    "code": "BILLING_PLAN_NOT_FOUND",
    "message": "The requested plan does not exist or has been archived.",
    "details": { "planSlug": "enterprise-v2" },
    "requestId": "req_abc123"
  }
}
```

Error codes: `BILLING_*` prefix for all billing-related errors.

---

## Security Design

### Authentication and Authorization

- All `/api/billing/*` endpoints require authenticated tenant user with `billing:read` or `billing:write` permission.
- All `/api/admin/billing/*` endpoints require `admin:billing` role.
- Tenant isolation enforced at the service layer: every query includes `WHERE tenant_id = :tenantId`.
- The webhook endpoint uses Stripe signature verification instead of session auth.

### Data Protection

- Credit card data never touches our servers (Stripe Elements / Checkout handles PCI scope).
- `stripe_customer_id` and `stripe_subscription_id` are stored; raw card numbers are not.
- Audit logs are append-only; no UPDATE or DELETE operations allowed on the `audit_log` table.
- All financial amounts stored as integers (cents) to avoid floating-point errors.

---

## Technology Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Payment processor | Stripe | Industry standard, excellent API, built-in subscription management |
| Currency storage | Integer (cents) | Avoids floating-point precision errors |
| Usage event ingestion | Async queue + batch insert | High throughput without blocking API |
| PDF generation | Puppeteer or wkhtmltopdf | HTML-to-PDF for invoice templates |
| Job queue | BullMQ (Node) / Celery (Python) | Reliable background processing with retries |
| Webhook processing | Synchronous with queue fallback | Process inline for speed; queue if handler takes >5s |
| Dashboard charts | Recharts / Chart.js | Lightweight, React-compatible charting |
| Revenue aggregation | Materialized views or pre-computed | Dashboard performance at scale |
