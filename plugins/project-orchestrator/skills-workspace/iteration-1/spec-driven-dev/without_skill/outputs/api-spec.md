# API Specification: Multi-Tenant Billing System

## Base URL

```
/api/billing    — Tenant-facing endpoints
/api/admin/billing — Admin endpoints
/api/webhooks   — Webhook endpoints
```

## Authentication

- **Tenant endpoints:** Bearer token (JWT) with `tenant_id` claim. Requires `billing:read` or `billing:write` scope.
- **Admin endpoints:** Bearer token with `admin:billing` role.
- **Webhook endpoints:** Stripe signature verification (no session auth).

## Common Response Format

### Success Response
```json
{
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-03-27T10:00:00Z"
  }
}
```

### Paginated Response
```json
{
  "data": [ ... ],
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-03-27T10:00:00Z",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 150,
      "totalPages": 8
    }
  }
}
```

### Error Response
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

---

## Tenant Endpoints

### Plans

#### GET /api/billing/plans
List all available subscription plans.

**Response 200:**
```json
{
  "data": [
    {
      "id": "plan_001",
      "name": "Free",
      "slug": "free",
      "description": "For individuals and small teams getting started.",
      "billingInterval": "monthly",
      "basePrice": 0,
      "currency": "usd",
      "trialDays": 0,
      "features": {
        "maxUsers": 3,
        "maxProjects": 5,
        "apiCallsIncluded": 1000,
        "storageGb": 1,
        "support": "community"
      },
      "usageMeters": [
        {
          "name": "api_calls",
          "includedQuantity": 1000,
          "pricingModel": "graduated",
          "tiers": [
            { "upTo": 1000, "unitPrice": 0 },
            { "upTo": 10000, "unitPrice": 1 },
            { "upTo": null, "unitPrice": 0.5 }
          ]
        }
      ],
      "sortOrder": 1,
      "isActive": true
    }
  ]
}
```

#### GET /api/billing/plans/:slug
Get a single plan by slug.

**Response 200:** Single plan object (same structure as above).
**Response 404:** `BILLING_PLAN_NOT_FOUND`

---

### Subscriptions

#### GET /api/billing/subscription
Get the current tenant's active subscription.

**Response 200:**
```json
{
  "data": {
    "id": "sub_001",
    "planId": "plan_002",
    "planName": "Starter",
    "planSlug": "starter",
    "status": "active",
    "currentPeriodStart": "2026-03-01T00:00:00Z",
    "currentPeriodEnd": "2026-03-31T23:59:59Z",
    "trialEnd": null,
    "canceledAt": null,
    "cancelAtPeriodEnd": false,
    "createdAt": "2026-01-15T12:00:00Z"
  }
}
```

**Status values:** `trialing`, `active`, `past_due`, `canceled`, `paused`, `unpaid`

**Response 404:** `BILLING_NO_ACTIVE_SUBSCRIPTION`

#### POST /api/billing/subscription
Create a new subscription.

**Request:**
```json
{
  "planSlug": "starter",
  "paymentMethodId": "pm_001"
}
```

**Response 201:** Subscription object.
**Response 400:** `BILLING_ALREADY_SUBSCRIBED`, `BILLING_INVALID_PLAN`
**Response 402:** `BILLING_PAYMENT_FAILED`

#### PATCH /api/billing/subscription
Change plan (upgrade or downgrade).

**Request:**
```json
{
  "planSlug": "professional",
  "prorate": true
}
```

**Response 200:** Updated subscription object.
**Response 400:** `BILLING_SAME_PLAN`, `BILLING_INVALID_PLAN`

#### DELETE /api/billing/subscription
Cancel subscription.

**Request:**
```json
{
  "cancelAtPeriodEnd": true
}
```

**Response 200:** Updated subscription with `cancelAtPeriodEnd: true` or `status: "canceled"`.

---

### Payment Methods

#### GET /api/billing/payment-methods
List tenant's payment methods.

**Response 200:**
```json
{
  "data": [
    {
      "id": "pm_001",
      "type": "card",
      "brand": "visa",
      "lastFour": "4242",
      "expMonth": 12,
      "expYear": 2028,
      "isDefault": true,
      "createdAt": "2026-01-15T12:00:00Z"
    }
  ]
}
```

#### POST /api/billing/payment-methods
Add a payment method.

**Request:**
```json
{
  "stripePaymentMethodId": "pm_stripe_abc123"
}
```

**Response 201:** Payment method object.
**Response 400:** `BILLING_INVALID_PAYMENT_METHOD`

#### PATCH /api/billing/payment-methods/:id
Set payment method as default.

**Request:**
```json
{
  "isDefault": true
}
```

**Response 200:** Updated payment method.

#### DELETE /api/billing/payment-methods/:id
Remove a payment method.

**Response 204:** No content.
**Response 400:** `BILLING_CANNOT_REMOVE_DEFAULT_PAYMENT_METHOD` (if only one exists and subscription is active)

---

### Invoices

#### GET /api/billing/invoices
List tenant's invoices.

**Query Parameters:**
- `page` (int, default: 1)
- `pageSize` (int, default: 20, max: 100)
- `status` (string, optional): `draft`, `open`, `paid`, `void`, `uncollectible`

**Response 200:**
```json
{
  "data": [
    {
      "id": "inv_001",
      "invoiceNumber": "INV-2026-0001",
      "status": "paid",
      "subtotal": 4900,
      "taxAmount": 392,
      "total": 5292,
      "currency": "usd",
      "periodStart": "2026-02-01T00:00:00Z",
      "periodEnd": "2026-02-28T23:59:59Z",
      "dueDate": "2026-03-15T00:00:00Z",
      "paidAt": "2026-03-01T10:30:00Z",
      "pdfUrl": "/api/billing/invoices/inv_001/pdf",
      "createdAt": "2026-03-01T00:00:00Z"
    }
  ],
  "meta": {
    "pagination": { "page": 1, "pageSize": 20, "totalItems": 3, "totalPages": 1 }
  }
}
```

Note: All monetary amounts are in the smallest currency unit (cents for USD).

#### GET /api/billing/invoices/:id
Get invoice details with line items.

**Response 200:**
```json
{
  "data": {
    "id": "inv_001",
    "invoiceNumber": "INV-2026-0001",
    "status": "paid",
    "items": [
      {
        "id": "item_001",
        "description": "Starter Plan — March 2026",
        "type": "subscription",
        "quantity": 1,
        "unitPrice": 2900,
        "amount": 2900,
        "periodStart": "2026-03-01T00:00:00Z",
        "periodEnd": "2026-03-31T23:59:59Z"
      },
      {
        "id": "item_002",
        "description": "API Calls — 5,230 calls (4,230 overage)",
        "type": "usage",
        "meterName": "api_calls",
        "quantity": 4230,
        "unitPrice": 1,
        "amount": 2000,
        "periodStart": "2026-03-01T00:00:00Z",
        "periodEnd": "2026-03-31T23:59:59Z"
      }
    ],
    "subtotal": 4900,
    "taxAmount": 392,
    "total": 5292,
    "currency": "usd",
    "periodStart": "2026-03-01T00:00:00Z",
    "periodEnd": "2026-03-31T23:59:59Z",
    "dueDate": "2026-03-15T00:00:00Z",
    "paidAt": "2026-03-01T10:30:00Z",
    "pdfUrl": "/api/billing/invoices/inv_001/pdf"
  }
}
```

#### GET /api/billing/invoices/:id/pdf
Download invoice as PDF.

**Response 200:** `Content-Type: application/pdf`

---

### Usage

#### GET /api/billing/usage
Get current period usage summary across all meters.

**Response 200:**
```json
{
  "data": {
    "periodStart": "2026-03-01T00:00:00Z",
    "periodEnd": "2026-03-31T23:59:59Z",
    "meters": [
      {
        "name": "api_calls",
        "displayName": "API Calls",
        "included": 1000,
        "used": 5230,
        "overage": 4230,
        "percentUsed": 523,
        "estimatedCharge": 2000
      },
      {
        "name": "storage_gb",
        "displayName": "Storage (GB)",
        "included": 10,
        "used": 7.2,
        "overage": 0,
        "percentUsed": 72,
        "estimatedCharge": 0
      }
    ]
  }
}
```

#### GET /api/billing/usage/:meter
Get detailed usage for a specific meter with daily breakdown.

**Response 200:**
```json
{
  "data": {
    "meter": "api_calls",
    "periodStart": "2026-03-01T00:00:00Z",
    "periodEnd": "2026-03-31T23:59:59Z",
    "totalUsed": 5230,
    "dailyBreakdown": [
      { "date": "2026-03-01", "quantity": 180 },
      { "date": "2026-03-02", "quantity": 210 }
    ]
  }
}
```

---

## Admin Endpoints

### Dashboard

#### GET /api/admin/billing/dashboard
Get aggregated billing metrics.

**Response 200:**
```json
{
  "data": {
    "mrr": 125000,
    "arr": 1500000,
    "activeSubscriptions": 342,
    "trialingSubscriptions": 28,
    "churnRate": 3.2,
    "netRevenue": 118500,
    "mrrTrend": [
      { "month": "2025-10", "mrr": 98000 },
      { "month": "2025-11", "mrr": 105000 },
      { "month": "2025-12", "mrr": 112000 },
      { "month": "2026-01", "mrr": 118000 },
      { "month": "2026-02", "mrr": 122000 },
      { "month": "2026-03", "mrr": 125000 }
    ],
    "revenueByPlan": [
      { "planName": "Starter", "revenue": 35000, "count": 120 },
      { "planName": "Professional", "revenue": 65000, "count": 85 },
      { "planName": "Enterprise", "revenue": 25000, "count": 9 }
    ],
    "failedPayments": {
      "count": 7,
      "totalAmount": 3400
    }
  }
}
```

All monetary values in cents.

### Tenant Billing Management

#### GET /api/admin/billing/tenants
List tenants with billing info.

**Query Parameters:**
- `page`, `pageSize`
- `plan` (string, optional): Filter by plan slug
- `status` (string, optional): Filter by subscription status
- `search` (string, optional): Search by tenant name or email
- `mrrMin`, `mrrMax` (int, optional): Filter by MRR range
- `sortBy` (string): `name`, `mrr`, `createdAt`, `lastPayment`
- `sortOrder` (string): `asc`, `desc`

**Response 200:** Paginated list of tenant billing summaries.

#### POST /api/admin/billing/tenants/:id/credits
Apply credit to a tenant account.

**Request:**
```json
{
  "amount": 5000,
  "reason": "Compensation for service outage on 2026-03-15",
  "invoiceId": "inv_001"
}
```

**Response 201:** Credit note object.

#### POST /api/admin/billing/tenants/:id/retry
Retry a failed payment.

**Request:**
```json
{
  "invoiceId": "inv_003"
}
```

**Response 200:** Payment result.
**Response 402:** `BILLING_RETRY_FAILED`

### Plan Management

#### POST /api/admin/billing/plans
Create a new plan.

**Request:**
```json
{
  "name": "Startup",
  "slug": "startup",
  "description": "For growing startups",
  "billingInterval": "monthly",
  "basePrice": 7900,
  "currency": "usd",
  "trialDays": 14,
  "features": {
    "maxUsers": 25,
    "maxProjects": 50,
    "apiCallsIncluded": 50000,
    "storageGb": 100,
    "support": "priority"
  },
  "usageMeters": [...],
  "sortOrder": 3
}
```

**Response 201:** Plan object.

#### PATCH /api/admin/billing/plans/:id
Update a plan. Changes apply to new subscriptions only; existing subscriptions keep their current terms until renewal or manual migration.

**Response 200:** Updated plan object.

#### DELETE /api/admin/billing/plans/:id
Archive a plan (soft delete). Existing subscriptions on this plan remain active.

**Response 200:** Archived plan object with `isActive: false`.

### Reports

#### GET /api/admin/billing/reports/revenue
Export revenue report.

**Query Parameters:**
- `startDate` (ISO date, required)
- `endDate` (ISO date, required)
- `format` (string): `json` or `csv` (default: `json`)
- `groupBy` (string): `day`, `week`, `month` (default: `month`)

**Response 200 (CSV):** `Content-Type: text/csv` with `Content-Disposition: attachment; filename="revenue-report.csv"`

### Audit Log

#### GET /api/admin/billing/audit-log
Query billing audit log.

**Query Parameters:**
- `page`, `pageSize`
- `tenantId` (optional)
- `action` (optional): `subscription.created`, `subscription.changed`, `payment.succeeded`, `payment.failed`, `credit.applied`, etc.
- `startDate`, `endDate` (optional)

**Response 200:** Paginated list of audit entries.

---

## Webhook Endpoint

### POST /api/webhooks/stripe

**Headers Required:**
- `Stripe-Signature`: Webhook signature for verification

**Processing:**
1. Verify signature using `STRIPE_WEBHOOK_SECRET`
2. Parse event type
3. Check idempotency (skip if event ID already processed)
4. Route to handler
5. Return 200

**Response 200:** `{ "received": true }`
**Response 400:** Invalid signature or malformed payload

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `BILLING_PLAN_NOT_FOUND` | 404 | Plan slug does not exist or is archived |
| `BILLING_INVALID_PLAN` | 400 | Plan cannot be selected (archived, incompatible) |
| `BILLING_SAME_PLAN` | 400 | Attempting to change to the same plan |
| `BILLING_NO_ACTIVE_SUBSCRIPTION` | 404 | Tenant has no active subscription |
| `BILLING_ALREADY_SUBSCRIBED` | 400 | Tenant already has an active subscription |
| `BILLING_PAYMENT_FAILED` | 402 | Payment could not be processed |
| `BILLING_RETRY_FAILED` | 402 | Payment retry unsuccessful |
| `BILLING_INVALID_PAYMENT_METHOD` | 400 | Stripe payment method is invalid or declined |
| `BILLING_CANNOT_REMOVE_DEFAULT_PAYMENT_METHOD` | 400 | Cannot remove the only payment method on active subscription |
| `BILLING_INVOICE_NOT_FOUND` | 404 | Invoice ID does not exist |
| `BILLING_UNAUTHORIZED` | 403 | Tenant attempting to access another tenant's data |
| `BILLING_WEBHOOK_SIGNATURE_INVALID` | 400 | Stripe webhook signature verification failed |
