// order-state.ts
// E-commerce Order Lifecycle State Machine
// Pattern: const enum + transition map (no switch statements)

// ---------------------------------------------------------------------------
// 1. States — const object for zero-cost runtime, compile-time safety
// ---------------------------------------------------------------------------

export const OrderState = {
  DRAFT: 'draft',
  PLACED: 'placed',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_FAILED: 'payment_failed',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  RETURN_REQUESTED: 'return_requested',
  RETURNED: 'returned',
  CANCELLED: 'cancelled',
} as const;

export type OrderStateValue = (typeof OrderState)[keyof typeof OrderState];

// ---------------------------------------------------------------------------
// 2. Events — discriminated union
// ---------------------------------------------------------------------------

export type OrderEvent =
  | { type: 'PLACE_ORDER' }
  | { type: 'CANCEL' }
  | { type: 'INITIATE_PAYMENT' }
  | { type: 'PAYMENT_SUCCEEDED'; paymentId: string }
  | { type: 'PAYMENT_FAILED'; failureReason: string }
  | { type: 'RETRY_PAYMENT' }
  | { type: 'START_PREPARING' }
  | { type: 'CANCEL_ORDER'; reason: string }
  | { type: 'SHIP_ORDER'; trackingNumber: string }
  | { type: 'CONFIRM_DELIVERY'; deliveryProof: string }
  | { type: 'REQUEST_RETURN'; reason: string }
  | { type: 'RECEIVE_RETURN' }
  | { type: 'DENY_RETURN'; reason: string };

// ---------------------------------------------------------------------------
// 3. Context — all data needed by guards (no external calls)
// ---------------------------------------------------------------------------

export interface OrderContext {
  orderId: string;
  cartItems: Array<{ sku: string; quantity: number }>;
  shippingAddress: string | null;
  paymentMethodId: string | null;
  orderTotal: number;
  paymentAmount: number;
  paymentId: string | null;
  trackingNumber: string | null;
  deliveryProof: string | null;
  deliveredAt: Date | null;
  returnWindowDays: number;
  returnItemsAccepted: boolean;
  itemsInStock: boolean;
}

// ---------------------------------------------------------------------------
// 4. Guard functions — pure, return error string or null
// ---------------------------------------------------------------------------

type Guard = (context: OrderContext, event: OrderEvent) => string | null;

const guards: Record<string, Guard> = {
  cartNonEmptyAndAddressValid: (ctx) => {
    if (ctx.cartItems.length === 0) return 'Cart is empty';
    if (!ctx.shippingAddress) return 'Shipping address is required';
    return null;
  },

  paymentMethodAttached: (ctx) => {
    if (!ctx.paymentMethodId) return 'No payment method attached to order';
    return null;
  },

  paymentAmountMatchesTotal: (ctx) => {
    if (ctx.paymentAmount !== ctx.orderTotal) {
      return `Payment amount (${ctx.paymentAmount}) does not match order total (${ctx.orderTotal})`;
    }
    return null;
  },

  itemsInStock: (ctx) => {
    if (!ctx.itemsInStock) return 'One or more items are out of stock';
    return null;
  },

  cancelReasonProvided: (_ctx, event) => {
    if (event.type !== 'CANCEL_ORDER') return 'Invalid event';
    if (event.reason.length === 0) return 'Cancellation reason is required';
    return null;
  },

  trackingNumberProvided: (_ctx, event) => {
    if (event.type !== 'SHIP_ORDER') return 'Invalid event';
    if (event.trackingNumber.length === 0) return 'Tracking number is required';
    return null;
  },

  deliveryProofExists: (_ctx, event) => {
    if (event.type !== 'CONFIRM_DELIVERY') return 'Invalid event';
    if (!event.deliveryProof) return 'Delivery proof (signature or photo) is required';
    return null;
  },

  returnWindowOpen: (ctx, event) => {
    if (event.type !== 'REQUEST_RETURN') return 'Invalid event';
    if (event.reason.length === 0) return 'Return reason is required';
    if (!ctx.deliveredAt) return 'Delivery date not recorded';
    const daysSinceDelivery =
      (Date.now() - ctx.deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > ctx.returnWindowDays) {
      return `Return window expired (${Math.floor(daysSinceDelivery)} days since delivery, limit is ${ctx.returnWindowDays})`;
    }
    return null;
  },

  returnItemsAccepted: (ctx) => {
    if (!ctx.returnItemsAccepted) return 'Return items have not been inspected and accepted';
    return null;
  },

  denyReturnReasonProvided: (_ctx, event) => {
    if (event.type !== 'DENY_RETURN') return 'Invalid event';
    if (event.reason.length === 0) return 'Denial reason is required';
    return null;
  },
};

// ---------------------------------------------------------------------------
// 5. Side effect stubs — async, idempotent (use idempotency keys)
// ---------------------------------------------------------------------------

async function sendConfirmationEmail(ctx: OrderContext, _event: OrderEvent): Promise<void> {
  console.log(`[side-effect] Sending order confirmation email for order ${ctx.orderId}`);
}

async function reserveInventory(ctx: OrderContext, _event: OrderEvent): Promise<void> {
  console.log(`[side-effect] Reserving inventory for order ${ctx.orderId}`);
}

async function releaseInventory(ctx: OrderContext, _event: OrderEvent): Promise<void> {
  console.log(`[side-effect] Releasing reserved inventory for order ${ctx.orderId}`);
}

async function createAuditLog(ctx: OrderContext, event: OrderEvent): Promise<void> {
  console.log(`[side-effect] Audit log: order=${ctx.orderId} event=${event.type}`);
}

async function createPaymentIntent(ctx: OrderContext, _event: OrderEvent): Promise<void> {
  console.log(`[side-effect] Creating payment intent for order ${ctx.orderId}`);
}

async function recordPaymentId(ctx: OrderContext, event: OrderEvent): Promise<void> {
  if (event.type === 'PAYMENT_SUCCEEDED') {
    console.log(`[side-effect] Recording payment ID ${event.paymentId} for order ${ctx.orderId}`);
  }
}

async function sendReceiptEmail(ctx: OrderContext, _event: OrderEvent): Promise<void> {
  console.log(`[side-effect] Sending payment receipt for order ${ctx.orderId}`);
}

async function notifyWarehouse(ctx: OrderContext, _event: OrderEvent): Promise<void> {
  console.log(`[side-effect] Notifying warehouse for order ${ctx.orderId}`);
}

async function recordFailureReason(ctx: OrderContext, event: OrderEvent): Promise<void> {
  if (event.type === 'PAYMENT_FAILED') {
    console.log(`[side-effect] Recording failure reason: ${event.failureReason} for order ${ctx.orderId}`);
  }
}

async function sendPaymentFailureEmail(ctx: OrderContext, _event: OrderEvent): Promise<void> {
  console.log(`[side-effect] Sending payment failure email for order ${ctx.orderId}`);
}

async function assignPicker(ctx: OrderContext, _event: OrderEvent): Promise<void> {
  console.log(`[side-effect] Assigning picker for order ${ctx.orderId}`);
}

async function updateEstimatedShipDate(ctx: OrderContext, _event: OrderEvent): Promise<void> {
  console.log(`[side-effect] Updating estimated ship date for order ${ctx.orderId}`);
}

async function issueRefund(ctx: OrderContext, _event: OrderEvent): Promise<void> {
  console.log(`[side-effect] Issuing refund for order ${ctx.orderId} (idempotency key: refund-${ctx.orderId})`);
}

async function sendCancellationEmail(ctx: OrderContext, _event: OrderEvent): Promise<void> {
  console.log(`[side-effect] Sending cancellation email for order ${ctx.orderId}`);
}

async function sendShippingEmail(ctx: OrderContext, event: OrderEvent): Promise<void> {
  if (event.type === 'SHIP_ORDER') {
    console.log(`[side-effect] Sending shipping email with tracking ${event.trackingNumber} for order ${ctx.orderId}`);
  }
}

async function updateCarrierRecords(ctx: OrderContext, _event: OrderEvent): Promise<void> {
  console.log(`[side-effect] Updating carrier records for order ${ctx.orderId}`);
}

async function sendDeliveryConfirmation(ctx: OrderContext, _event: OrderEvent): Promise<void> {
  console.log(`[side-effect] Sending delivery confirmation for order ${ctx.orderId}`);
}

async function sendReturnInstructions(ctx: OrderContext, _event: OrderEvent): Promise<void> {
  console.log(`[side-effect] Sending return instructions for order ${ctx.orderId}`);
}

async function generateReturnLabel(ctx: OrderContext, _event: OrderEvent): Promise<void> {
  console.log(`[side-effect] Generating return label for order ${ctx.orderId}`);
}

async function updateInventory(ctx: OrderContext, _event: OrderEvent): Promise<void> {
  console.log(`[side-effect] Updating inventory for returned items on order ${ctx.orderId}`);
}

async function sendRefundConfirmation(ctx: OrderContext, _event: OrderEvent): Promise<void> {
  console.log(`[side-effect] Sending refund confirmation for order ${ctx.orderId}`);
}

async function sendReturnDenialEmail(ctx: OrderContext, event: OrderEvent): Promise<void> {
  if (event.type === 'DENY_RETURN') {
    console.log(`[side-effect] Sending return denial email (reason: ${event.reason}) for order ${ctx.orderId}`);
  }
}

// ---------------------------------------------------------------------------
// 6. Transition map — single source of truth
// ---------------------------------------------------------------------------

interface Transition {
  target: OrderStateValue;
  guard?: Guard;
  sideEffects?: Array<(ctx: OrderContext, event: OrderEvent) => Promise<void>>;
}

const transitions: Record<
  OrderStateValue,
  Partial<Record<OrderEvent['type'], Transition>>
> = {
  // --- draft ---
  [OrderState.DRAFT]: {
    PLACE_ORDER: {
      target: OrderState.PLACED,
      guard: guards.cartNonEmptyAndAddressValid,
      sideEffects: [sendConfirmationEmail, reserveInventory, createAuditLog],
    },
    CANCEL: {
      target: OrderState.CANCELLED,
      sideEffects: [createAuditLog],
    },
  },

  // --- placed ---
  [OrderState.PLACED]: {
    INITIATE_PAYMENT: {
      target: OrderState.PAYMENT_PENDING,
      guard: guards.paymentMethodAttached,
      sideEffects: [createPaymentIntent, createAuditLog],
    },
    CANCEL: {
      target: OrderState.CANCELLED,
      sideEffects: [releaseInventory, createAuditLog],
    },
  },

  // --- payment_pending ---
  [OrderState.PAYMENT_PENDING]: {
    PAYMENT_SUCCEEDED: {
      target: OrderState.CONFIRMED,
      guard: guards.paymentAmountMatchesTotal,
      sideEffects: [recordPaymentId, sendReceiptEmail, notifyWarehouse, createAuditLog],
    },
    PAYMENT_FAILED: {
      target: OrderState.PAYMENT_FAILED,
      sideEffects: [recordFailureReason, sendPaymentFailureEmail, createAuditLog],
    },
  },

  // --- payment_failed ---
  [OrderState.PAYMENT_FAILED]: {
    RETRY_PAYMENT: {
      target: OrderState.PAYMENT_PENDING,
      guard: guards.paymentMethodAttached,
      sideEffects: [createPaymentIntent, createAuditLog],
    },
    CANCEL: {
      target: OrderState.CANCELLED,
      sideEffects: [releaseInventory, createAuditLog],
    },
  },

  // --- confirmed ---
  [OrderState.CONFIRMED]: {
    START_PREPARING: {
      target: OrderState.PREPARING,
      guard: guards.itemsInStock,
      sideEffects: [assignPicker, updateEstimatedShipDate, createAuditLog],
    },
    CANCEL_ORDER: {
      target: OrderState.CANCELLED,
      guard: guards.cancelReasonProvided,
      sideEffects: [releaseInventory, issueRefund, sendCancellationEmail, createAuditLog],
    },
  },

  // --- preparing ---
  [OrderState.PREPARING]: {
    SHIP_ORDER: {
      target: OrderState.SHIPPED,
      guard: guards.trackingNumberProvided,
      sideEffects: [sendShippingEmail, updateCarrierRecords, createAuditLog],
    },
  },

  // --- shipped ---
  [OrderState.SHIPPED]: {
    CONFIRM_DELIVERY: {
      target: OrderState.DELIVERED,
      guard: guards.deliveryProofExists,
      sideEffects: [sendDeliveryConfirmation, createAuditLog],
    },
  },

  // --- delivered (non-terminal: customer may request a return) ---
  [OrderState.DELIVERED]: {
    REQUEST_RETURN: {
      target: OrderState.RETURN_REQUESTED,
      guard: guards.returnWindowOpen,
      sideEffects: [sendReturnInstructions, generateReturnLabel, createAuditLog],
    },
  },

  // --- return_requested ---
  [OrderState.RETURN_REQUESTED]: {
    RECEIVE_RETURN: {
      target: OrderState.RETURNED,
      guard: guards.returnItemsAccepted,
      sideEffects: [issueRefund, updateInventory, sendRefundConfirmation, createAuditLog],
    },
    DENY_RETURN: {
      target: OrderState.DELIVERED,
      guard: guards.denyReturnReasonProvided,
      sideEffects: [sendReturnDenialEmail, createAuditLog],
    },
  },

  // --- Terminal states: no outgoing transitions ---
  [OrderState.RETURNED]: {},
  [OrderState.CANCELLED]: {},
};

// ---------------------------------------------------------------------------
// 7. Transition executor
// ---------------------------------------------------------------------------

export interface TransitionResult {
  newState: OrderStateValue;
  error?: string;
}

export async function transition(
  currentState: OrderStateValue,
  event: OrderEvent,
  context: OrderContext,
): Promise<TransitionResult> {
  const stateTransitions = transitions[currentState];
  const t = stateTransitions?.[event.type];

  if (!t) {
    return {
      newState: currentState,
      error: `No transition from "${currentState}" on event "${event.type}"`,
    };
  }

  // Run guard (pure function, no side effects)
  if (t.guard) {
    const guardError = t.guard(context, event);
    if (guardError) {
      return { newState: currentState, error: guardError };
    }
  }

  // Execute side effects sequentially (order matters)
  // If any side effect fails, the transition rolls back (state stays the same)
  if (t.sideEffects) {
    for (const effect of t.sideEffects) {
      await effect(context, event);
    }
  }

  return { newState: t.target };
}

// ---------------------------------------------------------------------------
// 8. Utility: get valid events for a given state
// ---------------------------------------------------------------------------

export function getValidEvents(state: OrderStateValue): OrderEvent['type'][] {
  const stateTransitions = transitions[state];
  return Object.keys(stateTransitions) as OrderEvent['type'][];
}

// ---------------------------------------------------------------------------
// 9. Utility: check if a state is terminal
// ---------------------------------------------------------------------------

export function isTerminalState(state: OrderStateValue): boolean {
  const stateTransitions = transitions[state];
  return Object.keys(stateTransitions).length === 0;
}
