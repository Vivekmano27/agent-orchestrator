# E-Commerce Order Lifecycle State Machine

## Overview

This document specifies the complete state machine for an e-commerce order lifecycle,
covering all states from draft creation through delivery, returns, and cancellation.
The design prioritizes correctness, auditability, and clear separation between
guard conditions (validation logic) and side effects (actions triggered on transition).

---

## States

| State | Description | Terminal? |
|---|---|---|
| `draft` | Order is being assembled by the customer (cart stage) | No |
| `placed` | Customer submitted the order | No |
| `payment_pending` | Payment is being processed by the gateway | No |
| `payment_failed` | Payment was declined or errored | No |
| `confirmed` | Payment succeeded, order is accepted | No |
| `preparing` | Warehouse is picking and packing the order | No |
| `shipped` | Order has been handed to the carrier | No |
| `delivered` | Carrier confirmed delivery | No |
| `return_requested` | Customer initiated a return | No |
| `returned` | Return received and processed | Yes |
| `cancelled` | Order was cancelled before fulfillment | Yes |

---

## Transitions

### 1. `draft` -> `placed`
- **Trigger:** Customer submits the order
- **Guard conditions:**
  - Cart must contain at least one item
  - All items must be in stock (inventory check)
  - Shipping address must be valid and complete
  - Customer email must be verified
- **Side effects:**
  - Generate unique order number
  - Reserve inventory for all items
  - Record order timestamp
  - Send order acknowledgement email to customer

### 2. `placed` -> `payment_pending`
- **Trigger:** System initiates payment processing
- **Guard conditions:**
  - Payment method must be attached to the order
  - Order total must be greater than zero
- **Side effects:**
  - Submit charge request to payment gateway
  - Start payment timeout timer (e.g., 30 minutes)
  - Log payment attempt in audit trail

### 3. `payment_pending` -> `confirmed`
- **Trigger:** Payment gateway returns success
- **Guard conditions:**
  - Payment amount must match order total
  - Payment gateway response must include a valid transaction ID
  - No fraud flags raised by the fraud detection system
- **Side effects:**
  - Store transaction ID on order record
  - Cancel payment timeout timer
  - Send order confirmation email with receipt
  - Notify warehouse system to begin fulfillment
  - Emit `order.confirmed` event for analytics

### 4. `payment_pending` -> `payment_failed`
- **Trigger:** Payment gateway returns failure, or payment timeout expires
- **Guard conditions:**
  - Payment response indicates decline, insufficient funds, or error
  - OR payment timeout has elapsed
- **Side effects:**
  - Record failure reason and gateway error code
  - Release reserved inventory
  - Send payment failure notification to customer
  - Log failure in audit trail

### 5. `payment_failed` -> `payment_pending`
- **Trigger:** Customer retries payment with same or different method
- **Guard conditions:**
  - Retry count must be below maximum (e.g., 3 attempts)
  - Order must not be older than retry window (e.g., 24 hours)
  - New payment method must be valid
  - Items must still be in stock (re-check inventory)
- **Side effects:**
  - Increment retry counter
  - Re-reserve inventory if previously released
  - Submit new charge request to payment gateway
  - Restart payment timeout timer

### 6. `payment_failed` -> `cancelled`
- **Trigger:** Customer abandons order, or max retries exceeded, or retry window expired
- **Guard conditions:**
  - At least one of: customer requests cancellation, retry limit reached, retry window expired
- **Side effects:**
  - Release any remaining reserved inventory
  - Send cancellation confirmation email
  - Record cancellation reason
  - Emit `order.cancelled` event

### 7. `confirmed` -> `preparing`
- **Trigger:** Warehouse begins processing the order
- **Guard conditions:**
  - All items must be physically available in warehouse
  - Warehouse must not be in a freeze/shutdown state
- **Side effects:**
  - Create pick list for warehouse staff
  - Update estimated delivery date
  - Send "order is being prepared" email to customer

### 8. `confirmed` -> `cancelled`
- **Trigger:** Customer or admin cancels before preparation begins
- **Guard conditions:**
  - Order must not have entered `preparing` state yet
  - Cancellation must be within cancellation window (e.g., 1 hour after confirmation)
- **Side effects:**
  - Initiate full refund via payment gateway
  - Release reserved inventory
  - Send cancellation + refund confirmation email
  - Record cancellation reason and initiator (customer vs admin)
  - Emit `order.cancelled` event

### 9. `preparing` -> `shipped`
- **Trigger:** Warehouse completes packing and carrier picks up
- **Guard conditions:**
  - All items must be packed and accounted for
  - Shipping label must be generated
  - Tracking number must be assigned by carrier
- **Side effects:**
  - Store tracking number on order record
  - Send shipping notification email with tracking link
  - Mark inventory as permanently deducted (no longer reserved)
  - Emit `order.shipped` event

### 10. `shipped` -> `delivered`
- **Trigger:** Carrier confirms delivery (webhook or polling)
- **Guard conditions:**
  - Delivery confirmation must come from the assigned carrier
  - Delivery timestamp must be present
- **Side effects:**
  - Record delivery timestamp and proof of delivery
  - Send delivery confirmation email
  - Start return eligibility window (e.g., 30 days)
  - Emit `order.delivered` event
  - Trigger post-delivery customer satisfaction survey (delayed)

### 11. `delivered` -> `return_requested`
- **Trigger:** Customer initiates a return request
- **Guard conditions:**
  - Request must be within return window (e.g., 30 days from delivery)
  - Items must be eligible for return (not final-sale, perishable, etc.)
  - Return reason must be provided
- **Side effects:**
  - Generate Return Merchandise Authorization (RMA) number
  - Send return instructions email with shipping label
  - Create return shipment tracking record
  - Emit `order.return_requested` event

### 12. `return_requested` -> `returned`
- **Trigger:** Returned items received and inspected at warehouse
- **Guard conditions:**
  - Items must pass inspection (not damaged beyond policy, correct items returned)
  - RMA number must match the return request
- **Side effects:**
  - Process refund (full or partial based on inspection)
  - Restock returned items to inventory (if in sellable condition)
  - Send refund confirmation email
  - Record return outcome and inspection notes
  - Emit `order.returned` event

### 13. `return_requested` -> `delivered`
- **Trigger:** Customer cancels the return request, or return denied after inspection
- **Guard conditions:**
  - Return cancellation must be before items are shipped back, OR inspection failed
- **Side effects:**
  - Void RMA number
  - Send return cancellation/denial notification
  - Record reason for return reversal

### 14. `placed` -> `cancelled`
- **Trigger:** Customer cancels before payment is initiated
- **Guard conditions:**
  - Order must still be in `placed` state (not yet in payment flow)
- **Side effects:**
  - Release reserved inventory
  - Send cancellation confirmation email
  - Record cancellation reason
  - Emit `order.cancelled` event

### 15. `preparing` -> `cancelled`
- **Trigger:** Admin cancels due to stock issue or fraud detection
- **Guard conditions:**
  - Cancellation must be authorized by admin or system (not customer-initiated at this stage)
  - Order must not have been shipped yet
- **Side effects:**
  - Initiate full refund
  - Release reserved inventory / restock picked items
  - Send cancellation + refund notification to customer
  - Record cancellation reason (stock issue, fraud, etc.)
  - Emit `order.cancelled` event

---

## State Categories

### Active States (order is in progress)
`draft`, `placed`, `payment_pending`, `confirmed`, `preparing`, `shipped`

### Post-Delivery States
`delivered`, `return_requested`

### Terminal States (no further transitions)
`returned`, `cancelled`

### Error/Retry States
`payment_failed` (allows retry back to `payment_pending`)

---

## Invariants

1. **No skipping states:** An order cannot jump from `draft` to `shipped`. Every transition must follow a defined edge.
2. **Terminal states are final:** Once in `returned` or `cancelled`, no transitions are possible.
3. **Refund before cancel:** Any cancellation after `confirmed` must trigger a refund side effect.
4. **Inventory consistency:** Reserved inventory must be released on cancellation and permanently deducted only on shipment.
5. **Audit trail:** Every transition must be logged with timestamp, actor (customer/system/admin), previous state, new state, and reason.
6. **Idempotency:** Duplicate transition requests for the same state change must be safely ignored (no double refunds, no double emails).

---

## Timeout Policies

| Context | Timeout | Action |
|---|---|---|
| Payment processing | 30 minutes | Transition to `payment_failed` |
| Payment retry window | 24 hours | Auto-cancel if no retry |
| Cancellation window (post-confirm) | 1 hour | Disable customer-initiated cancel |
| Return eligibility | 30 days from delivery | Disable return request |
| Return shipment | 14 days from RMA issued | Void RMA, revert to `delivered` |
