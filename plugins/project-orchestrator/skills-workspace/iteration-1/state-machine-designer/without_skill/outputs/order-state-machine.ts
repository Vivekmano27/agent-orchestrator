// =============================================================================
// E-Commerce Order Lifecycle State Machine
// =============================================================================
//
// A fully typed, generic state machine implementation for the e-commerce order
// lifecycle. Includes guard conditions, side effects, audit logging, and
// transition validation.
//
// Usage:
//   const machine = createOrderStateMachine(services);
//   const order = machine.createOrder({ customerId: "cust_123", items: [...] });
//   await machine.transition(order, "SUBMIT_ORDER");
//
// =============================================================================

// -----------------------------------------------------------------------------
// 1. Core Types
// -----------------------------------------------------------------------------

/** All possible order states */
export type OrderState =
  | "draft"
  | "placed"
  | "payment_pending"
  | "payment_failed"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "return_requested"
  | "returned"
  | "cancelled";

/** All possible transition events */
export type OrderEvent =
  | "SUBMIT_ORDER"
  | "INITIATE_PAYMENT"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "RETRY_PAYMENT"
  | "ABANDON_ORDER"
  | "BEGIN_FULFILLMENT"
  | "CANCEL_ORDER"
  | "SHIP_ORDER"
  | "ADMIN_CANCEL"
  | "CONFIRM_DELIVERY"
  | "REQUEST_RETURN"
  | "COMPLETE_RETURN"
  | "DENY_RETURN"
  | "CANCEL_RETURN";

/** Terminal states from which no transitions are possible */
const TERMINAL_STATES: ReadonlySet<OrderState> = new Set(["returned", "cancelled"]);

/** An item in the order */
export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  isFinalSale: boolean;
}

/** Shipping address */
export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/** Payment method reference */
export interface PaymentMethod {
  id: string;
  type: "credit_card" | "debit_card" | "paypal" | "bank_transfer";
  last4: string;
}

/** The order entity with all contextual data */
export interface Order {
  id: string;
  orderNumber: string | null;
  customerId: string;
  customerEmail: string;
  state: OrderState;
  items: OrderItem[];
  shippingAddress: ShippingAddress | null;
  paymentMethod: PaymentMethod | null;
  transactionId: string | null;
  trackingNumber: string | null;
  rmaNumber: string | null;
  returnReason: string | null;
  cancellationReason: string | null;
  totalAmount: number;
  paymentRetryCount: number;
  maxPaymentRetries: number;
  createdAt: Date;
  placedAt: Date | null;
  confirmedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  returnWindowDays: number;
  cancellationWindowMinutes: number;
  paymentRetryWindowHours: number;
  metadata: Record<string, unknown>;
}

/** Context passed with each transition event */
export interface TransitionContext {
  actor: "customer" | "system" | "admin";
  reason?: string;
  paymentResponse?: PaymentGatewayResponse;
  deliveryConfirmation?: DeliveryConfirmation;
  inspectionResult?: InspectionResult;
  newPaymentMethod?: PaymentMethod;
  timestamp: Date;
}

/** Payment gateway response shape */
export interface PaymentGatewayResponse {
  success: boolean;
  transactionId?: string;
  errorCode?: string;
  errorMessage?: string;
  amount: number;
  fraudFlags: string[];
}

/** Delivery confirmation from carrier */
export interface DeliveryConfirmation {
  carrierId: string;
  deliveredAt: Date;
  proofOfDelivery?: string;
  signedBy?: string;
}

/** Warehouse inspection result for returns */
export interface InspectionResult {
  passed: boolean;
  notes: string;
  refundAmount: number;
  restockable: boolean;
}

/** Audit log entry recorded for every transition */
export interface AuditLogEntry {
  orderId: string;
  fromState: OrderState;
  toState: OrderState;
  event: OrderEvent;
  actor: "customer" | "system" | "admin";
  reason?: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

/** Result of a guard check */
export interface GuardResult {
  allowed: boolean;
  reason?: string;
}

// -----------------------------------------------------------------------------
// 2. Service Interfaces (Dependency Injection)
// -----------------------------------------------------------------------------

/** External services that side effects depend on */
export interface OrderServices {
  inventory: {
    checkAvailability(items: OrderItem[]): Promise<boolean>;
    reserve(orderId: string, items: OrderItem[]): Promise<void>;
    release(orderId: string): Promise<void>;
    deductPermanently(orderId: string, items: OrderItem[]): Promise<void>;
    restock(orderId: string, items: OrderItem[]): Promise<void>;
  };
  payment: {
    charge(
      method: PaymentMethod,
      amount: number
    ): Promise<PaymentGatewayResponse>;
    refund(transactionId: string, amount: number): Promise<void>;
  };
  email: {
    sendOrderAcknowledgement(order: Order): Promise<void>;
    sendPaymentFailed(order: Order, reason: string): Promise<void>;
    sendOrderConfirmation(order: Order): Promise<void>;
    sendPreparingNotification(order: Order): Promise<void>;
    sendShippingNotification(order: Order): Promise<void>;
    sendDeliveryConfirmation(order: Order): Promise<void>;
    sendReturnInstructions(order: Order): Promise<void>;
    sendRefundConfirmation(order: Order, amount: number): Promise<void>;
    sendCancellationConfirmation(order: Order): Promise<void>;
    sendReturnDeniedNotification(order: Order): Promise<void>;
  };
  warehouse: {
    checkPhysicalAvailability(items: OrderItem[]): Promise<boolean>;
    isOperational(): Promise<boolean>;
    createPickList(order: Order): Promise<string>;
    allItemsPacked(orderId: string): Promise<boolean>;
  };
  shipping: {
    generateLabel(order: Order): Promise<string>;
    getTrackingNumber(orderId: string): Promise<string>;
  };
  orderNumber: {
    generate(): string;
  };
  rma: {
    generate(orderId: string): string;
    void(rmaNumber: string): Promise<void>;
  };
  audit: {
    log(entry: AuditLogEntry): Promise<void>;
  };
  events: {
    emit(eventName: string, payload: Record<string, unknown>): Promise<void>;
  };
  fraud: {
    check(order: Order): Promise<{ flagged: boolean; reasons: string[] }>;
  };
  timer: {
    start(key: string, durationMs: number, callback: () => void): void;
    cancel(key: string): void;
  };
}

// -----------------------------------------------------------------------------
// 3. Guard Conditions
// -----------------------------------------------------------------------------

type GuardFn = (order: Order, context: TransitionContext) => Promise<GuardResult>;

function createGuards(services: OrderServices) {
  const guards: Record<string, GuardFn> = {
    /** draft -> placed */
    async canSubmitOrder(order, _ctx): Promise<GuardResult> {
      if (order.items.length === 0) {
        return { allowed: false, reason: "Cart is empty" };
      }
      if (!order.shippingAddress) {
        return { allowed: false, reason: "Shipping address is required" };
      }
      if (
        !order.shippingAddress.line1 ||
        !order.shippingAddress.city ||
        !order.shippingAddress.postalCode ||
        !order.shippingAddress.country
      ) {
        return { allowed: false, reason: "Shipping address is incomplete" };
      }
      if (!order.customerEmail) {
        return { allowed: false, reason: "Customer email is required" };
      }
      const inStock = await services.inventory.checkAvailability(order.items);
      if (!inStock) {
        return { allowed: false, reason: "One or more items are out of stock" };
      }
      return { allowed: true };
    },

    /** placed -> payment_pending */
    async canInitiatePayment(order, _ctx): Promise<GuardResult> {
      if (!order.paymentMethod) {
        return { allowed: false, reason: "No payment method attached" };
      }
      if (order.totalAmount <= 0) {
        return { allowed: false, reason: "Order total must be greater than zero" };
      }
      return { allowed: true };
    },

    /** payment_pending -> confirmed */
    async canConfirmPayment(order, ctx): Promise<GuardResult> {
      const resp = ctx.paymentResponse;
      if (!resp) {
        return { allowed: false, reason: "No payment response provided" };
      }
      if (!resp.success) {
        return { allowed: false, reason: "Payment was not successful" };
      }
      if (resp.amount !== order.totalAmount) {
        return {
          allowed: false,
          reason: `Payment amount ${resp.amount} does not match order total ${order.totalAmount}`,
        };
      }
      if (!resp.transactionId) {
        return { allowed: false, reason: "No transaction ID in payment response" };
      }
      if (resp.fraudFlags.length > 0) {
        return {
          allowed: false,
          reason: `Fraud flags raised: ${resp.fraudFlags.join(", ")}`,
        };
      }
      return { allowed: true };
    },

    /** payment_pending -> payment_failed */
    async canFailPayment(_order, ctx): Promise<GuardResult> {
      const resp = ctx.paymentResponse;
      if (resp && resp.success) {
        return {
          allowed: false,
          reason: "Cannot fail a successful payment",
        };
      }
      return { allowed: true };
    },

    /** payment_failed -> payment_pending */
    async canRetryPayment(order, ctx): Promise<GuardResult> {
      if (order.paymentRetryCount >= order.maxPaymentRetries) {
        return {
          allowed: false,
          reason: `Maximum retry count (${order.maxPaymentRetries}) reached`,
        };
      }
      const hoursSincePlaced =
        (ctx.timestamp.getTime() - (order.placedAt?.getTime() ?? 0)) / (1000 * 60 * 60);
      if (hoursSincePlaced > order.paymentRetryWindowHours) {
        return {
          allowed: false,
          reason: "Payment retry window has expired",
        };
      }
      const inStock = await services.inventory.checkAvailability(order.items);
      if (!inStock) {
        return {
          allowed: false,
          reason: "Items are no longer in stock",
        };
      }
      if (!ctx.newPaymentMethod && !order.paymentMethod) {
        return { allowed: false, reason: "No payment method available for retry" };
      }
      return { allowed: true };
    },

    /** payment_failed -> cancelled */
    async canCancelFromPaymentFailed(order, ctx): Promise<GuardResult> {
      const customerRequested = ctx.actor === "customer";
      const retriesExhausted = order.paymentRetryCount >= order.maxPaymentRetries;
      const hoursSincePlaced =
        (ctx.timestamp.getTime() - (order.placedAt?.getTime() ?? 0)) / (1000 * 60 * 60);
      const windowExpired = hoursSincePlaced > order.paymentRetryWindowHours;

      if (!customerRequested && !retriesExhausted && !windowExpired) {
        return {
          allowed: false,
          reason: "Cancellation requires customer request, exhausted retries, or expired window",
        };
      }
      return { allowed: true };
    },

    /** confirmed -> preparing */
    async canBeginFulfillment(order, _ctx): Promise<GuardResult> {
      const available = await services.warehouse.checkPhysicalAvailability(order.items);
      if (!available) {
        return {
          allowed: false,
          reason: "Items not physically available in warehouse",
        };
      }
      const operational = await services.warehouse.isOperational();
      if (!operational) {
        return { allowed: false, reason: "Warehouse is in shutdown/freeze state" };
      }
      return { allowed: true };
    },

    /** confirmed -> cancelled */
    async canCancelFromConfirmed(order, ctx): Promise<GuardResult> {
      if (!order.confirmedAt) {
        return { allowed: false, reason: "Order has no confirmation timestamp" };
      }
      const minutesSinceConfirmed =
        (ctx.timestamp.getTime() - order.confirmedAt.getTime()) / (1000 * 60);
      if (minutesSinceConfirmed > order.cancellationWindowMinutes) {
        return {
          allowed: false,
          reason: `Cancellation window of ${order.cancellationWindowMinutes} minutes has passed`,
        };
      }
      return { allowed: true };
    },

    /** preparing -> shipped */
    async canShip(order, _ctx): Promise<GuardResult> {
      const allPacked = await services.warehouse.allItemsPacked(order.id);
      if (!allPacked) {
        return { allowed: false, reason: "Not all items are packed" };
      }
      return { allowed: true };
    },

    /** preparing -> cancelled (admin only) */
    async canAdminCancelFromPreparing(_order, ctx): Promise<GuardResult> {
      if (ctx.actor !== "admin" && ctx.actor !== "system") {
        return {
          allowed: false,
          reason: "Only admin or system can cancel during preparation",
        };
      }
      return { allowed: true };
    },

    /** shipped -> delivered */
    async canConfirmDelivery(_order, ctx): Promise<GuardResult> {
      if (!ctx.deliveryConfirmation) {
        return { allowed: false, reason: "No delivery confirmation provided" };
      }
      if (!ctx.deliveryConfirmation.deliveredAt) {
        return { allowed: false, reason: "Delivery timestamp is required" };
      }
      return { allowed: true };
    },

    /** delivered -> return_requested */
    async canRequestReturn(order, ctx): Promise<GuardResult> {
      if (!order.deliveredAt) {
        return { allowed: false, reason: "Order has no delivery timestamp" };
      }
      const daysSinceDelivery =
        (ctx.timestamp.getTime() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDelivery > order.returnWindowDays) {
        return {
          allowed: false,
          reason: `Return window of ${order.returnWindowDays} days has passed`,
        };
      }
      const hasNonReturnableItems = order.items.some((item) => item.isFinalSale);
      if (hasNonReturnableItems) {
        return {
          allowed: false,
          reason: "Order contains final-sale items that cannot be returned",
        };
      }
      if (!ctx.reason) {
        return { allowed: false, reason: "A return reason must be provided" };
      }
      return { allowed: true };
    },

    /** return_requested -> returned */
    async canCompleteReturn(order, ctx): Promise<GuardResult> {
      if (!ctx.inspectionResult) {
        return { allowed: false, reason: "Inspection result is required" };
      }
      if (!ctx.inspectionResult.passed) {
        return {
          allowed: false,
          reason: `Inspection failed: ${ctx.inspectionResult.notes}`,
        };
      }
      if (!order.rmaNumber) {
        return { allowed: false, reason: "No RMA number on order" };
      }
      return { allowed: true };
    },

    /** return_requested -> delivered (return denied or cancelled) */
    async canDenyOrCancelReturn(_order, _ctx): Promise<GuardResult> {
      // Always allowed -- the actor context determines if it was a customer cancel
      // or an admin denial after failed inspection.
      return { allowed: true };
    },

    /** placed -> cancelled */
    async canCancelFromPlaced(_order, _ctx): Promise<GuardResult> {
      // Always allowed when in placed state
      return { allowed: true };
    },
  };

  return guards;
}

// -----------------------------------------------------------------------------
// 4. Side Effects
// -----------------------------------------------------------------------------

type SideEffectFn = (
  order: Order,
  context: TransitionContext,
  services: OrderServices
) => Promise<void>;

function createSideEffects(): Record<string, SideEffectFn> {
  return {
    /** draft -> placed */
    async onOrderPlaced(order, _ctx, svc) {
      order.orderNumber = svc.orderNumber.generate();
      order.placedAt = new Date();
      await svc.inventory.reserve(order.id, order.items);
      await svc.email.sendOrderAcknowledgement(order);
      await svc.events.emit("order.placed", { orderId: order.id });
    },

    /** placed -> payment_pending */
    async onPaymentInitiated(order, _ctx, svc) {
      await svc.audit.log({
        orderId: order.id,
        fromState: "placed",
        toState: "payment_pending",
        event: "INITIATE_PAYMENT",
        actor: "system",
        timestamp: new Date(),
        metadata: { paymentMethodId: order.paymentMethod?.id },
      });
      svc.timer.start(
        `payment_timeout_${order.id}`,
        30 * 60 * 1000, // 30 minutes
        () => {
          // The timeout handler should trigger a PAYMENT_FAILED event
          // This would be handled by the application layer
        }
      );
    },

    /** payment_pending -> confirmed */
    async onPaymentConfirmed(order, ctx, svc) {
      order.transactionId = ctx.paymentResponse!.transactionId ?? null;
      order.confirmedAt = new Date();
      svc.timer.cancel(`payment_timeout_${order.id}`);
      await svc.email.sendOrderConfirmation(order);
      await svc.events.emit("order.confirmed", {
        orderId: order.id,
        transactionId: order.transactionId,
      });
    },

    /** payment_pending -> payment_failed */
    async onPaymentFailed(order, ctx, svc) {
      const reason =
        ctx.paymentResponse?.errorMessage ?? ctx.reason ?? "Payment timeout";
      await svc.inventory.release(order.id);
      await svc.email.sendPaymentFailed(order, reason);
      await svc.events.emit("order.payment_failed", {
        orderId: order.id,
        reason,
        errorCode: ctx.paymentResponse?.errorCode,
      });
    },

    /** payment_failed -> payment_pending (retry) */
    async onPaymentRetry(order, ctx, svc) {
      order.paymentRetryCount += 1;
      if (ctx.newPaymentMethod) {
        order.paymentMethod = ctx.newPaymentMethod;
      }
      await svc.inventory.reserve(order.id, order.items);
      svc.timer.start(
        `payment_timeout_${order.id}`,
        30 * 60 * 1000,
        () => {}
      );
    },

    /** confirmed -> preparing */
    async onFulfillmentStarted(order, _ctx, svc) {
      await svc.warehouse.createPickList(order);
      await svc.email.sendPreparingNotification(order);
      await svc.events.emit("order.preparing", { orderId: order.id });
    },

    /** preparing -> shipped */
    async onOrderShipped(order, _ctx, svc) {
      const label = await svc.shipping.generateLabel(order);
      const trackingNumber = await svc.shipping.getTrackingNumber(order.id);
      order.trackingNumber = trackingNumber;
      order.shippedAt = new Date();
      order.metadata["shippingLabel"] = label;
      await svc.inventory.deductPermanently(order.id, order.items);
      await svc.email.sendShippingNotification(order);
      await svc.events.emit("order.shipped", {
        orderId: order.id,
        trackingNumber,
      });
    },

    /** shipped -> delivered */
    async onOrderDelivered(order, ctx, svc) {
      order.deliveredAt = ctx.deliveryConfirmation!.deliveredAt;
      order.metadata["proofOfDelivery"] = ctx.deliveryConfirmation!.proofOfDelivery;
      order.metadata["signedBy"] = ctx.deliveryConfirmation!.signedBy;
      await svc.email.sendDeliveryConfirmation(order);
      await svc.events.emit("order.delivered", { orderId: order.id });
    },

    /** delivered -> return_requested */
    async onReturnRequested(order, ctx, svc) {
      order.rmaNumber = svc.rma.generate(order.id);
      order.returnReason = ctx.reason ?? null;
      await svc.email.sendReturnInstructions(order);
      await svc.events.emit("order.return_requested", {
        orderId: order.id,
        rmaNumber: order.rmaNumber,
        reason: order.returnReason,
      });
    },

    /** return_requested -> returned */
    async onReturnCompleted(order, ctx, svc) {
      const inspection = ctx.inspectionResult!;
      await svc.payment.refund(order.transactionId!, inspection.refundAmount);
      if (inspection.restockable) {
        await svc.inventory.restock(order.id, order.items);
      }
      await svc.email.sendRefundConfirmation(order, inspection.refundAmount);
      await svc.events.emit("order.returned", {
        orderId: order.id,
        refundAmount: inspection.refundAmount,
        restocked: inspection.restockable,
      });
    },

    /** return_requested -> delivered (return denied/cancelled) */
    async onReturnDenied(order, ctx, svc) {
      if (order.rmaNumber) {
        await svc.rma.void(order.rmaNumber);
        order.rmaNumber = null;
      }
      order.returnReason = null;
      await svc.email.sendReturnDeniedNotification(order);
      await svc.events.emit("order.return_denied", {
        orderId: order.id,
        reason: ctx.reason,
      });
    },

    /** * -> cancelled (generic cancellation side effects) */
    async onOrderCancelled(order, ctx, svc) {
      order.cancellationReason = ctx.reason ?? "No reason provided";
      await svc.inventory.release(order.id);
      if (order.transactionId) {
        await svc.payment.refund(order.transactionId, order.totalAmount);
      }
      await svc.email.sendCancellationConfirmation(order);
      await svc.events.emit("order.cancelled", {
        orderId: order.id,
        reason: order.cancellationReason,
        cancelledBy: ctx.actor,
      });
    },
  };
}

// -----------------------------------------------------------------------------
// 5. Transition Table
// -----------------------------------------------------------------------------

interface TransitionDefinition {
  from: OrderState;
  to: OrderState;
  event: OrderEvent;
  guard: string; // key into guards record
  sideEffect: string; // key into side effects record
}

const TRANSITION_TABLE: TransitionDefinition[] = [
  {
    from: "draft",
    to: "placed",
    event: "SUBMIT_ORDER",
    guard: "canSubmitOrder",
    sideEffect: "onOrderPlaced",
  },
  {
    from: "placed",
    to: "payment_pending",
    event: "INITIATE_PAYMENT",
    guard: "canInitiatePayment",
    sideEffect: "onPaymentInitiated",
  },
  {
    from: "placed",
    to: "cancelled",
    event: "CANCEL_ORDER",
    guard: "canCancelFromPlaced",
    sideEffect: "onOrderCancelled",
  },
  {
    from: "payment_pending",
    to: "confirmed",
    event: "PAYMENT_SUCCESS",
    guard: "canConfirmPayment",
    sideEffect: "onPaymentConfirmed",
  },
  {
    from: "payment_pending",
    to: "payment_failed",
    event: "PAYMENT_FAILED",
    guard: "canFailPayment",
    sideEffect: "onPaymentFailed",
  },
  {
    from: "payment_failed",
    to: "payment_pending",
    event: "RETRY_PAYMENT",
    guard: "canRetryPayment",
    sideEffect: "onPaymentRetry",
  },
  {
    from: "payment_failed",
    to: "cancelled",
    event: "ABANDON_ORDER",
    guard: "canCancelFromPaymentFailed",
    sideEffect: "onOrderCancelled",
  },
  {
    from: "confirmed",
    to: "preparing",
    event: "BEGIN_FULFILLMENT",
    guard: "canBeginFulfillment",
    sideEffect: "onFulfillmentStarted",
  },
  {
    from: "confirmed",
    to: "cancelled",
    event: "CANCEL_ORDER",
    guard: "canCancelFromConfirmed",
    sideEffect: "onOrderCancelled",
  },
  {
    from: "preparing",
    to: "shipped",
    event: "SHIP_ORDER",
    guard: "canShip",
    sideEffect: "onOrderShipped",
  },
  {
    from: "preparing",
    to: "cancelled",
    event: "ADMIN_CANCEL",
    guard: "canAdminCancelFromPreparing",
    sideEffect: "onOrderCancelled",
  },
  {
    from: "shipped",
    to: "delivered",
    event: "CONFIRM_DELIVERY",
    guard: "canConfirmDelivery",
    sideEffect: "onOrderDelivered",
  },
  {
    from: "delivered",
    to: "return_requested",
    event: "REQUEST_RETURN",
    guard: "canRequestReturn",
    sideEffect: "onReturnRequested",
  },
  {
    from: "return_requested",
    to: "returned",
    event: "COMPLETE_RETURN",
    guard: "canCompleteReturn",
    sideEffect: "onReturnCompleted",
  },
  {
    from: "return_requested",
    to: "delivered",
    event: "DENY_RETURN",
    guard: "canDenyOrCancelReturn",
    sideEffect: "onReturnDenied",
  },
  {
    from: "return_requested",
    to: "delivered",
    event: "CANCEL_RETURN",
    guard: "canDenyOrCancelReturn",
    sideEffect: "onReturnDenied",
  },
];

// -----------------------------------------------------------------------------
// 6. State Machine Engine
// -----------------------------------------------------------------------------

export class TransitionError extends Error {
  constructor(
    public readonly orderId: string,
    public readonly currentState: OrderState,
    public readonly event: OrderEvent,
    public readonly reason: string
  ) {
    super(
      `Cannot transition order ${orderId} from "${currentState}" via "${event}": ${reason}`
    );
    this.name = "TransitionError";
  }
}

export interface TransitionResult {
  success: boolean;
  previousState: OrderState;
  newState: OrderState;
  event: OrderEvent;
  guardResult: GuardResult;
}

export interface OrderStateMachine {
  /** Create a new order in draft state */
  createOrder(params: {
    customerId: string;
    customerEmail: string;
    items?: OrderItem[];
    shippingAddress?: ShippingAddress;
    paymentMethod?: PaymentMethod;
  }): Order;

  /** Attempt a state transition */
  transition(
    order: Order,
    event: OrderEvent,
    context?: Partial<TransitionContext>
  ): Promise<TransitionResult>;

  /** Check if a transition is allowed without executing it */
  canTransition(
    order: Order,
    event: OrderEvent,
    context?: Partial<TransitionContext>
  ): Promise<GuardResult>;

  /** Get all valid events for the current state */
  getAvailableEvents(order: Order): OrderEvent[];

  /** Get the full transition history from audit log */
  getTransitionTable(): TransitionDefinition[];

  /** Check if an order is in a terminal state */
  isTerminal(order: Order): boolean;
}

export function createOrderStateMachine(
  services: OrderServices
): OrderStateMachine {
  const guards = createGuards(services);
  const sideEffects = createSideEffects();
  let orderCounter = 0;

  function buildContext(
    partial?: Partial<TransitionContext>
  ): TransitionContext {
    return {
      actor: partial?.actor ?? "system",
      reason: partial?.reason,
      paymentResponse: partial?.paymentResponse,
      deliveryConfirmation: partial?.deliveryConfirmation,
      inspectionResult: partial?.inspectionResult,
      newPaymentMethod: partial?.newPaymentMethod,
      timestamp: partial?.timestamp ?? new Date(),
    };
  }

  function findTransition(
    currentState: OrderState,
    event: OrderEvent
  ): TransitionDefinition | undefined {
    return TRANSITION_TABLE.find(
      (t) => t.from === currentState && t.event === event
    );
  }

  const machine: OrderStateMachine = {
    createOrder(params) {
      orderCounter += 1;
      const order: Order = {
        id: `order_${Date.now()}_${orderCounter}`,
        orderNumber: null,
        customerId: params.customerId,
        customerEmail: params.customerEmail,
        state: "draft",
        items: params.items ?? [],
        shippingAddress: params.shippingAddress ?? null,
        paymentMethod: params.paymentMethod ?? null,
        transactionId: null,
        trackingNumber: null,
        rmaNumber: null,
        returnReason: null,
        cancellationReason: null,
        totalAmount: (params.items ?? []).reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        ),
        paymentRetryCount: 0,
        maxPaymentRetries: 3,
        createdAt: new Date(),
        placedAt: null,
        confirmedAt: null,
        shippedAt: null,
        deliveredAt: null,
        returnWindowDays: 30,
        cancellationWindowMinutes: 60,
        paymentRetryWindowHours: 24,
        metadata: {},
      };
      return order;
    },

    async transition(order, event, partialContext) {
      const ctx = buildContext(partialContext);
      const previousState = order.state;

      // Check terminal state
      if (TERMINAL_STATES.has(order.state)) {
        throw new TransitionError(
          order.id,
          order.state,
          event,
          `Order is in terminal state "${order.state}"`
        );
      }

      // Find matching transition
      const transition = findTransition(order.state, event);
      if (!transition) {
        throw new TransitionError(
          order.id,
          order.state,
          event,
          `No transition defined from "${order.state}" for event "${event}"`
        );
      }

      // Run guard
      const guardFn = guards[transition.guard];
      if (!guardFn) {
        throw new TransitionError(
          order.id,
          order.state,
          event,
          `Guard "${transition.guard}" not found`
        );
      }
      const guardResult = await guardFn(order, ctx);
      if (!guardResult.allowed) {
        throw new TransitionError(
          order.id,
          order.state,
          event,
          guardResult.reason ?? "Guard rejected the transition"
        );
      }

      // Execute side effect
      const sideEffectFn = sideEffects[transition.sideEffect];
      if (sideEffectFn) {
        await sideEffectFn(order, ctx, services);
      }

      // Update state
      order.state = transition.to;

      // Audit log
      await services.audit.log({
        orderId: order.id,
        fromState: previousState,
        toState: transition.to,
        event,
        actor: ctx.actor,
        reason: ctx.reason,
        timestamp: ctx.timestamp,
        metadata: {},
      });

      return {
        success: true,
        previousState,
        newState: transition.to,
        event,
        guardResult,
      };
    },

    async canTransition(order, event, partialContext) {
      const ctx = buildContext(partialContext);

      if (TERMINAL_STATES.has(order.state)) {
        return {
          allowed: false,
          reason: `Order is in terminal state "${order.state}"`,
        };
      }

      const transition = findTransition(order.state, event);
      if (!transition) {
        return {
          allowed: false,
          reason: `No transition from "${order.state}" for event "${event}"`,
        };
      }

      const guardFn = guards[transition.guard];
      if (!guardFn) {
        return { allowed: false, reason: `Guard "${transition.guard}" not found` };
      }

      return guardFn(order, ctx);
    },

    getAvailableEvents(order) {
      if (TERMINAL_STATES.has(order.state)) {
        return [];
      }
      return TRANSITION_TABLE.filter((t) => t.from === order.state).map(
        (t) => t.event
      );
    },

    getTransitionTable() {
      return [...TRANSITION_TABLE];
    },

    isTerminal(order) {
      return TERMINAL_STATES.has(order.state);
    },
  };

  return machine;
}

// -----------------------------------------------------------------------------
// 7. Utility: State Machine Introspection
// -----------------------------------------------------------------------------

/** Returns all states reachable from a given state */
export function getReachableStates(from: OrderState): OrderState[] {
  const visited = new Set<OrderState>();
  const queue: OrderState[] = [from];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const transitions = TRANSITION_TABLE.filter((t) => t.from === current);
    for (const t of transitions) {
      if (!visited.has(t.to)) {
        queue.push(t.to);
      }
    }
  }

  visited.delete(from); // exclude the starting state itself
  return Array.from(visited);
}

/** Returns all states that can reach the given state */
export function getPredecessorStates(target: OrderState): OrderState[] {
  const predecessors = new Set<OrderState>();
  const queue: OrderState[] = [target];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const inbound = TRANSITION_TABLE.filter((t) => t.to === current);
    for (const t of inbound) {
      if (!predecessors.has(t.from) && t.from !== target) {
        predecessors.add(t.from);
        queue.push(t.from);
      }
    }
  }

  return Array.from(predecessors);
}

/** Validate the transition table for common issues */
export function validateTransitionTable(): string[] {
  const issues: string[] = [];

  // Check for unreachable states
  const allStates: OrderState[] = [
    "draft",
    "placed",
    "payment_pending",
    "payment_failed",
    "confirmed",
    "preparing",
    "shipped",
    "delivered",
    "return_requested",
    "returned",
    "cancelled",
  ];

  for (const state of allStates) {
    if (state === "draft") continue; // Initial state, expected to have no inbound
    const hasInbound = TRANSITION_TABLE.some((t) => t.to === state);
    if (!hasInbound) {
      issues.push(`State "${state}" has no inbound transitions (unreachable)`);
    }
  }

  // Check terminal states have no outbound
  for (const state of TERMINAL_STATES) {
    const hasOutbound = TRANSITION_TABLE.some((t) => t.from === state);
    if (hasOutbound) {
      issues.push(`Terminal state "${state}" has outbound transitions`);
    }
  }

  // Check for duplicate transitions (same from + event)
  const seen = new Set<string>();
  for (const t of TRANSITION_TABLE) {
    const key = `${t.from}:${t.event}`;
    if (seen.has(key)) {
      issues.push(`Duplicate transition: ${t.from} + ${t.event}`);
    }
    seen.add(key);
  }

  return issues;
}
