# Test Plan: Multi-Tenant Billing System

## Testing Strategy

The billing system handles financial data and payments, so testing must be comprehensive. We employ a testing pyramid with emphasis on unit tests for business logic, integration tests for Stripe interactions, and E2E tests for critical user flows.

### Coverage Targets

| Layer | Target | Rationale |
|-------|--------|-----------|
| Service layer (business logic) | 90%+ | Financial calculations must be exact |
| Controllers (API layer) | 80%+ | Input validation and auth checks |
| Webhook handlers | 90%+ | Must handle every event type correctly |
| UI components | 70%+ | Functional coverage for billing flows |
| Overall | 85%+ | High stakes for financial system |

---

## Unit Tests

### UT-1: PlanService

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| UT-1.1 | Create plan with valid data | Plan created, returned with ID |
| UT-1.2 | Create plan with duplicate slug | Throws BILLING_INVALID_PLAN |
| UT-1.3 | Update plan pricing | Plan updated, version history recorded |
| UT-1.4 | Archive plan | Plan marked inactive, not returned in list |
| UT-1.5 | Get available plans | Returns only active plans, sorted by sortOrder |
| UT-1.6 | Check feature entitlement — entitled | Returns true for feature included in plan |
| UT-1.7 | Check feature entitlement — not entitled | Returns false for feature not in plan |

### UT-2: SubscriptionService

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| UT-2.1 | Create subscription — valid plan and payment | Subscription created, Stripe sub synced, audit logged |
| UT-2.2 | Create subscription — already subscribed | Throws BILLING_ALREADY_SUBSCRIBED |
| UT-2.3 | Create subscription — invalid plan | Throws BILLING_INVALID_PLAN |
| UT-2.4 | Create subscription with trial | Subscription in trialing status, trial_end set |
| UT-2.5 | Upgrade plan mid-cycle | Subscription updated, proration calculated, Stripe synced |
| UT-2.6 | Downgrade plan mid-cycle | Subscription updated, proration credited, applied at period end |
| UT-2.7 | Change to same plan | Throws BILLING_SAME_PLAN |
| UT-2.8 | Cancel — at period end | cancelAtPeriodEnd=true, status remains active until period end |
| UT-2.9 | Cancel — immediately | Status set to canceled, Stripe sub canceled |
| UT-2.10 | Pause subscription | Status set to paused, Stripe sub paused |
| UT-2.11 | Resume paused subscription | Status restored to active, Stripe sub resumed |
| UT-2.12 | Sync from Stripe event | Local record updated to match Stripe data |

### UT-3: UsageService

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| UT-3.1 | Record usage event | Event stored with tenant_id, meter, quantity |
| UT-3.2 | Record duplicate event (same idempotency key) | Event ignored, no duplicate created |
| UT-3.3 | Aggregate usage — single meter, single period | Correct total returned |
| UT-3.4 | Aggregate usage — multiple meters | Each meter aggregated independently |
| UT-3.5 | Aggregate usage — across period boundary | Only events in the specified period counted |
| UT-3.6 | Threshold check — below threshold | No alert returned |
| UT-3.7 | Threshold check — 80% of included quota | Alert with warning severity |
| UT-3.8 | Threshold check — exceeded included quota | Alert with critical severity |

### UT-4: UsagePricingCalculator

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| UT-4.1 | Flat pricing — 100 units at $0.01 | Charge = $1.00 (100 cents) |
| UT-4.2 | Graduated pricing — within first tier | Charge at tier 1 rate |
| UT-4.3 | Graduated pricing — spans two tiers | Charge split correctly across tiers |
| UT-4.4 | Graduated pricing — spans three+ tiers | Each tier calculated independently, summed |
| UT-4.5 | Volume pricing — 500 units (tier 1 applies to all) | All units at tier 1 rate |
| UT-4.6 | Volume pricing — 5000 units (tier 2 applies to all) | All units at tier 2 rate |
| UT-4.7 | Package pricing — exact package boundary | N packages charged |
| UT-4.8 | Package pricing — partial package | Rounded up to next package |
| UT-4.9 | Zero usage | Charge = $0.00 |
| UT-4.10 | Usage within included quantity | Charge = $0.00 (no overage) |

### UT-5: InvoiceService

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| UT-5.1 | Generate invoice — subscription only | Invoice with one subscription line item, correct amount |
| UT-5.2 | Generate invoice — subscription + usage | Invoice with subscription + usage line items |
| UT-5.3 | Generate invoice — with tax | Tax calculated and added to total |
| UT-5.4 | Generate invoice — with credit applied | Credit reduces total, shown as negative line item |
| UT-5.5 | Invoice number sequencing | Numbers sequential per tenant (INV-2026-0001, 0002, etc.) |
| UT-5.6 | Invoice number isolation | Tenant A's numbering does not affect Tenant B |
| UT-5.7 | Mark invoice as paid | Status changed, paidAt timestamp set |
| UT-5.8 | Create manual invoice | Invoice created with admin-specified line items |
| UT-5.9 | Apply credit note | Credit note linked to invoice, amounts correct |

### UT-6: PaymentService

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| UT-6.1 | Add payment method | Stored locally and attached to Stripe customer |
| UT-6.2 | Remove payment method — not default | Removed from Stripe and local DB |
| UT-6.3 | Remove default payment method — has others | Default transferred to next method |
| UT-6.4 | Remove only payment method with active sub | Throws BILLING_CANNOT_REMOVE_DEFAULT_PAYMENT_METHOD |
| UT-6.5 | Set default payment method | Updated locally and in Stripe |
| UT-6.6 | Retry failed payment — success | Invoice marked paid, retry count reset |
| UT-6.7 | Retry failed payment — fails again | Retry count incremented, next retry scheduled |

### UT-7: AuditService

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| UT-7.1 | Log billing mutation | Entry created with all required fields |
| UT-7.2 | Query by tenant | Returns only that tenant's entries |
| UT-7.3 | Query by entity | Returns all changes to specific entity |
| UT-7.4 | Query by date range | Returns entries within range only |
| UT-7.5 | Attempt to update audit entry | Operation rejected (append-only) |
| UT-7.6 | Attempt to delete audit entry | Operation rejected (append-only) |

### UT-8: MetricsService

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| UT-8.1 | Calculate MRR | Sum of all active monthly subscription amounts |
| UT-8.2 | Calculate ARR | MRR * 12 |
| UT-8.3 | Calculate churn rate | (Canceled in period / Active at start) * 100 |
| UT-8.4 | Revenue by plan breakdown | Correct grouping and sum per plan |
| UT-8.5 | MRR trend — 12 months | Monthly MRR snapshots for last 12 months |

---

## Integration Tests

### IT-1: Stripe Integration

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| IT-1.1 | Create Stripe customer on tenant signup | Stripe customer ID stored in tenant record |
| IT-1.2 | Create subscription via Stripe | Stripe subscription matches local subscription |
| IT-1.3 | Change plan via Stripe | Stripe subscription updated, proration invoice created |
| IT-1.4 | Cancel subscription via Stripe | Stripe subscription canceled |
| IT-1.5 | Add payment method via Stripe Elements | Card attached to Stripe customer |
| IT-1.6 | Webhook — subscription updated | Local subscription record updated |
| IT-1.7 | Webhook — invoice paid | Local invoice marked as paid |
| IT-1.8 | Webhook — payment failed | Local record updated, admin notified |
| IT-1.9 | Webhook — duplicate event | Processed only once (idempotent) |
| IT-1.10 | Webhook — invalid signature | Request rejected with 400 |
| IT-1.11 | Stripe API error handling | Graceful error, logged, no data corruption |
| IT-1.12 | Idempotency key on API calls | Duplicate Stripe calls produce same result |

### IT-2: Database Integration

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| IT-2.1 | Usage event idempotency constraint | Duplicate idempotency_key rejected at DB level |
| IT-2.2 | Invoice number uniqueness per tenant | Duplicate number within tenant rejected at DB level |
| IT-2.3 | Cascade behavior on tenant delete | Billing data handled per retention policy |
| IT-2.4 | Concurrent usage event ingestion | No lost events under concurrent writes |

---

## End-to-End Tests

### E2E-1: Tenant Subscription Flow

| Test Case | Description | Steps |
|-----------|-------------|-------|
| E2E-1.1 | New tenant subscribes to plan | 1. Sign up 2. View plans 3. Select Starter 4. Enter test card 5. Confirm subscription 6. Verify active subscription displayed |
| E2E-1.2 | Tenant upgrades plan | 1. Navigate to billing 2. Click change plan 3. Select Professional 4. Confirm 5. Verify proration message 6. Verify new plan displayed |
| E2E-1.3 | Tenant downgrades plan | 1. Navigate to billing 2. Click change plan 3. Select Starter 4. Confirm 5. Verify downgrade scheduled for period end |
| E2E-1.4 | Tenant cancels subscription | 1. Navigate to billing 2. Click cancel 3. Confirm cancellation 4. Verify cancel-at-period-end status |
| E2E-1.5 | Tenant views usage dashboard | 1. Navigate to billing 2. View usage meters 3. Verify current usage displayed for each meter |

### E2E-2: Invoice Flow

| Test Case | Description | Steps |
|-----------|-------------|-------|
| E2E-2.1 | View invoice list | 1. Navigate to invoices 2. Verify list shows past invoices 3. Verify status badges (paid, open, overdue) |
| E2E-2.2 | View invoice detail | 1. Click invoice 2. Verify line items (subscription + usage) 3. Verify amounts are correct |
| E2E-2.3 | Download invoice PDF | 1. Click download 2. Verify PDF opens 3. Verify content matches invoice detail |

### E2E-3: Payment Method Flow

| Test Case | Description | Steps |
|-----------|-------------|-------|
| E2E-3.1 | Add payment method | 1. Navigate to payment methods 2. Click add 3. Enter test card via Stripe Elements 4. Submit 5. Verify card appears in list |
| E2E-3.2 | Set default payment method | 1. Add second card 2. Click "set as default" on second card 3. Verify default indicator moves |
| E2E-3.3 | Remove payment method | 1. Ensure two cards exist 2. Remove non-default card 3. Verify removed from list |

### E2E-4: Admin Dashboard Flow

| Test Case | Description | Steps |
|-----------|-------------|-------|
| E2E-4.1 | Admin views revenue dashboard | 1. Login as admin 2. Navigate to billing dashboard 3. Verify MRR, ARR, churn cards display 4. Verify revenue chart renders |
| E2E-4.2 | Admin searches tenants | 1. Navigate to tenant list 2. Search by name 3. Verify filtered results 4. Filter by plan 5. Verify results |
| E2E-4.3 | Admin retries failed payment | 1. Navigate to failed payments 2. Click retry 3. Verify payment status updates |
| E2E-4.4 | Admin applies credit | 1. Find tenant 2. Click apply credit 3. Enter amount and reason 4. Confirm 5. Verify credit appears on tenant's account |
| E2E-4.5 | Admin exports revenue report | 1. Navigate to reports 2. Set date range 3. Click export CSV 4. Verify CSV downloads with correct data |

---

## Security Tests

### SEC-1: Tenant Isolation

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| SEC-1.1 | Tenant A accesses Tenant B's subscription | 403 Forbidden |
| SEC-1.2 | Tenant A accesses Tenant B's invoices | 403 Forbidden |
| SEC-1.3 | Tenant A accesses Tenant B's usage data | 403 Forbidden |
| SEC-1.4 | Tenant A accesses admin endpoints | 403 Forbidden |
| SEC-1.5 | Unauthenticated access to billing endpoints | 401 Unauthorized |
| SEC-1.6 | Manipulated tenant_id in JWT | Request rejected, does not leak data |

### SEC-2: Webhook Security

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| SEC-2.1 | Webhook with valid Stripe signature | Processed successfully |
| SEC-2.2 | Webhook with invalid signature | Rejected with 400 |
| SEC-2.3 | Webhook with missing signature header | Rejected with 400 |
| SEC-2.4 | Webhook replay attack (old timestamp) | Rejected by Stripe SDK tolerance check |

### SEC-3: Input Validation

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| SEC-3.1 | SQL injection in search parameter | Parameterized query prevents injection |
| SEC-3.2 | XSS in tenant billing address | Input sanitized, not rendered as HTML |
| SEC-3.3 | Negative amount in credit application | Rejected with validation error |
| SEC-3.4 | Excessively large usage quantity | Rejected with validation error (max limit) |

---

## Performance Tests

### PERF-1: Usage Event Ingestion

| Test Case | Target | Method |
|-----------|--------|--------|
| PERF-1.1 | Ingest 1,000 events/sec sustained for 60s | Load test with k6 or Artillery |
| PERF-1.2 | Ingest with 10% duplicate events | Verify deduplication does not degrade throughput |

### PERF-2: Dashboard Performance

| Test Case | Target | Method |
|-----------|--------|--------|
| PERF-2.1 | Dashboard API response < 2s with 10K tenants | Seed 10K tenants, measure response time |
| PERF-2.2 | Dashboard API response < 2s with 100K tenants | Seed 100K tenants, measure response time |
| PERF-2.3 | Tenant billing table pagination < 500ms | Paginated query with filters, measure response |

### PERF-3: Invoice Generation

| Test Case | Target | Method |
|-----------|--------|--------|
| PERF-3.1 | Generate invoice < 5s for 10K line items | Create tenant with high usage, measure generation time |
| PERF-3.2 | Batch invoice generation for 1K tenants | Run billing period job, measure total time |

---

## Test Data Requirements

### Stripe Test Mode

- Use Stripe test mode API keys
- Test card numbers: `4242424242424242` (success), `4000000000000002` (decline)
- Stripe CLI for webhook testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Seed Data for Testing

- 4 subscription plans (Free, Starter, Professional, Enterprise)
- 100+ test tenants across all plan tiers
- Usage events spanning multiple billing periods
- Mix of subscription statuses (active, trialing, past_due, canceled)
- At least 5 tenants with failed payments
- Historical invoices for revenue report testing

---

## Test Execution Order

1. Unit tests (all UT-* cases) — Run first, fastest feedback
2. Integration tests (IT-* cases) — Require test database and Stripe test mode
3. Security tests (SEC-* cases) — Run as part of integration suite
4. E2E tests (E2E-* cases) — Require full application stack running
5. Performance tests (PERF-* cases) — Run separately, require seed data at scale
