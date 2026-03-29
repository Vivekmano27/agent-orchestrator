// =============================================================================
// Tests for E-Commerce Order Lifecycle State Machine
// =============================================================================
//
// These tests verify guard conditions, side effects, transition rules, and
// edge cases for the order state machine. Uses mock services throughout.
//
// Run: npx vitest run order-state-machine.test.ts
// =============================================================================

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createOrderStateMachine,
  getReachableStates,
  getPredecessorStates,
  validateTransitionTable,
  TransitionError,
  type Order,
  type OrderServices,
  type OrderStateMachine,
  type OrderItem,
  type ShippingAddress,
  type PaymentMethod,
  type PaymentGatewayResponse,
  type DeliveryConfirmation,
  type InspectionResult,
} from "./order-state-machine";

// -----------------------------------------------------------------------------
// Test Fixtures
// -----------------------------------------------------------------------------

function createMockServices(): OrderServices {
  return {
    inventory: {
      checkAvailability: vi.fn().mockResolvedValue(true),
      reserve: vi.fn().mockResolvedValue(undefined),
      release: vi.fn().mockResolvedValue(undefined),
      deductPermanently: vi.fn().mockResolvedValue(undefined),
      restock: vi.fn().mockResolvedValue(undefined),
    },
    payment: {
      charge: vi.fn().mockResolvedValue({
        success: true,
        transactionId: "txn_123",
        amount: 100,
        fraudFlags: [],
      }),
      refund: vi.fn().mockResolvedValue(undefined),
    },
    email: {
      sendOrderAcknowledgement: vi.fn().mockResolvedValue(undefined),
      sendPaymentFailed: vi.fn().mockResolvedValue(undefined),
      sendOrderConfirmation: vi.fn().mockResolvedValue(undefined),
      sendPreparingNotification: vi.fn().mockResolvedValue(undefined),
      sendShippingNotification: vi.fn().mockResolvedValue(undefined),
      sendDeliveryConfirmation: vi.fn().mockResolvedValue(undefined),
      sendReturnInstructions: vi.fn().mockResolvedValue(undefined),
      sendRefundConfirmation: vi.fn().mockResolvedValue(undefined),
      sendCancellationConfirmation: vi.fn().mockResolvedValue(undefined),
      sendReturnDeniedNotification: vi.fn().mockResolvedValue(undefined),
    },
    warehouse: {
      checkPhysicalAvailability: vi.fn().mockResolvedValue(true),
      isOperational: vi.fn().mockResolvedValue(true),
      createPickList: vi.fn().mockResolvedValue("PL-001"),
      allItemsPacked: vi.fn().mockResolvedValue(true),
    },
    shipping: {
      generateLabel: vi.fn().mockResolvedValue("LABEL-001"),
      getTrackingNumber: vi.fn().mockResolvedValue("TRACK-001"),
    },
    orderNumber: {
      generate: vi.fn().mockReturnValue("ORD-20260327-001"),
    },
    rma: {
      generate: vi.fn().mockReturnValue("RMA-001"),
      void: vi.fn().mockResolvedValue(undefined),
    },
    audit: {
      log: vi.fn().mockResolvedValue(undefined),
    },
    events: {
      emit: vi.fn().mockResolvedValue(undefined),
    },
    fraud: {
      check: vi
        .fn()
        .mockResolvedValue({ flagged: false, reasons: [] }),
    },
    timer: {
      start: vi.fn(),
      cancel: vi.fn(),
    },
  };
}

const sampleItem: OrderItem = {
  productId: "prod_1",
  name: "Test Widget",
  quantity: 2,
  unitPrice: 50,
  isFinalSale: false,
};

const sampleAddress: ShippingAddress = {
  line1: "123 Main St",
  city: "Anytown",
  state: "CA",
  postalCode: "90210",
  country: "US",
};

const samplePaymentMethod: PaymentMethod = {
  id: "pm_1",
  type: "credit_card",
  last4: "4242",
};

const successfulPaymentResponse: PaymentGatewayResponse = {
  success: true,
  transactionId: "txn_123",
  amount: 100,
  fraudFlags: [],
};

const failedPaymentResponse: PaymentGatewayResponse = {
  success: false,
  errorCode: "insufficient_funds",
  errorMessage: "Insufficient funds",
  amount: 100,
  fraudFlags: [],
};

const deliveryConfirmation: DeliveryConfirmation = {
  carrierId: "carrier_ups",
  deliveredAt: new Date(),
  proofOfDelivery: "photo_url",
  signedBy: "John Doe",
};

const passedInspection: InspectionResult = {
  passed: true,
  notes: "Item in good condition",
  refundAmount: 100,
  restockable: true,
};

// -----------------------------------------------------------------------------
// Helper: advance order to a specific state
// -----------------------------------------------------------------------------

async function advanceToState(
  machine: OrderStateMachine,
  order: Order,
  targetState: string
): Promise<void> {
  const steps: Array<{
    state: string;
    event: Parameters<OrderStateMachine["transition"]>[1];
    context?: Parameters<OrderStateMachine["transition"]>[2];
  }> = [
    { state: "placed", event: "SUBMIT_ORDER", context: { actor: "customer" } },
    {
      state: "payment_pending",
      event: "INITIATE_PAYMENT",
      context: { actor: "system" },
    },
    {
      state: "confirmed",
      event: "PAYMENT_SUCCESS",
      context: {
        actor: "system",
        paymentResponse: successfulPaymentResponse,
      },
    },
    {
      state: "preparing",
      event: "BEGIN_FULFILLMENT",
      context: { actor: "system" },
    },
    { state: "shipped", event: "SHIP_ORDER", context: { actor: "system" } },
    {
      state: "delivered",
      event: "CONFIRM_DELIVERY",
      context: {
        actor: "system",
        deliveryConfirmation,
      },
    },
    {
      state: "return_requested",
      event: "REQUEST_RETURN",
      context: { actor: "customer", reason: "Defective" },
    },
    {
      state: "returned",
      event: "COMPLETE_RETURN",
      context: {
        actor: "system",
        inspectionResult: passedInspection,
      },
    },
  ];

  for (const step of steps) {
    if (order.state === targetState) return;
    await machine.transition(order, step.event, step.context);
  }
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe("OrderStateMachine", () => {
  let services: OrderServices;
  let machine: OrderStateMachine;
  let order: Order;

  beforeEach(() => {
    services = createMockServices();
    machine = createOrderStateMachine(services);
    order = machine.createOrder({
      customerId: "cust_1",
      customerEmail: "test@example.com",
      items: [sampleItem],
      shippingAddress: sampleAddress,
      paymentMethod: samplePaymentMethod,
    });
  });

  // ---------------------------------------------------------------------------
  // Order Creation
  // ---------------------------------------------------------------------------

  describe("createOrder", () => {
    it("should create an order in draft state", () => {
      expect(order.state).toBe("draft");
    });

    it("should calculate total from items", () => {
      expect(order.totalAmount).toBe(100); // 2 * 50
    });

    it("should set default retry limits", () => {
      expect(order.maxPaymentRetries).toBe(3);
      expect(order.paymentRetryCount).toBe(0);
    });

    it("should set default windows", () => {
      expect(order.returnWindowDays).toBe(30);
      expect(order.cancellationWindowMinutes).toBe(60);
      expect(order.paymentRetryWindowHours).toBe(24);
    });
  });

  // ---------------------------------------------------------------------------
  // draft -> placed
  // ---------------------------------------------------------------------------

  describe("SUBMIT_ORDER (draft -> placed)", () => {
    it("should transition to placed on valid order", async () => {
      const result = await machine.transition(order, "SUBMIT_ORDER", {
        actor: "customer",
      });
      expect(result.newState).toBe("placed");
      expect(order.state).toBe("placed");
      expect(order.orderNumber).not.toBeNull();
    });

    it("should reserve inventory", async () => {
      await machine.transition(order, "SUBMIT_ORDER", { actor: "customer" });
      expect(services.inventory.reserve).toHaveBeenCalledWith(
        order.id,
        order.items
      );
    });

    it("should send acknowledgement email", async () => {
      await machine.transition(order, "SUBMIT_ORDER", { actor: "customer" });
      expect(services.email.sendOrderAcknowledgement).toHaveBeenCalled();
    });

    it("should reject empty cart", async () => {
      order.items = [];
      await expect(
        machine.transition(order, "SUBMIT_ORDER", { actor: "customer" })
      ).rejects.toThrow(TransitionError);
    });

    it("should reject missing shipping address", async () => {
      order.shippingAddress = null;
      await expect(
        machine.transition(order, "SUBMIT_ORDER", { actor: "customer" })
      ).rejects.toThrow("Shipping address is required");
    });

    it("should reject when items are out of stock", async () => {
      vi.mocked(services.inventory.checkAvailability).mockResolvedValue(false);
      await expect(
        machine.transition(order, "SUBMIT_ORDER", { actor: "customer" })
      ).rejects.toThrow("out of stock");
    });
  });

  // ---------------------------------------------------------------------------
  // placed -> payment_pending
  // ---------------------------------------------------------------------------

  describe("INITIATE_PAYMENT (placed -> payment_pending)", () => {
    beforeEach(async () => {
      await advanceToState(machine, order, "placed");
    });

    it("should transition to payment_pending", async () => {
      const result = await machine.transition(order, "INITIATE_PAYMENT", {
        actor: "system",
      });
      expect(result.newState).toBe("payment_pending");
    });

    it("should start payment timeout timer", async () => {
      await machine.transition(order, "INITIATE_PAYMENT", {
        actor: "system",
      });
      expect(services.timer.start).toHaveBeenCalled();
    });

    it("should reject if no payment method", async () => {
      order.paymentMethod = null;
      await expect(
        machine.transition(order, "INITIATE_PAYMENT", { actor: "system" })
      ).rejects.toThrow("No payment method attached");
    });
  });

  // ---------------------------------------------------------------------------
  // payment_pending -> confirmed
  // ---------------------------------------------------------------------------

  describe("PAYMENT_SUCCESS (payment_pending -> confirmed)", () => {
    beforeEach(async () => {
      await advanceToState(machine, order, "payment_pending");
    });

    it("should transition to confirmed with valid payment", async () => {
      const result = await machine.transition(order, "PAYMENT_SUCCESS", {
        actor: "system",
        paymentResponse: successfulPaymentResponse,
      });
      expect(result.newState).toBe("confirmed");
      expect(order.transactionId).toBe("txn_123");
    });

    it("should cancel payment timeout", async () => {
      await machine.transition(order, "PAYMENT_SUCCESS", {
        actor: "system",
        paymentResponse: successfulPaymentResponse,
      });
      expect(services.timer.cancel).toHaveBeenCalled();
    });

    it("should reject if amount mismatch", async () => {
      await expect(
        machine.transition(order, "PAYMENT_SUCCESS", {
          actor: "system",
          paymentResponse: { ...successfulPaymentResponse, amount: 50 },
        })
      ).rejects.toThrow("does not match order total");
    });

    it("should reject if fraud flags present", async () => {
      await expect(
        machine.transition(order, "PAYMENT_SUCCESS", {
          actor: "system",
          paymentResponse: {
            ...successfulPaymentResponse,
            fraudFlags: ["velocity_check_failed"],
          },
        })
      ).rejects.toThrow("Fraud flags");
    });
  });

  // ---------------------------------------------------------------------------
  // payment_pending -> payment_failed
  // ---------------------------------------------------------------------------

  describe("PAYMENT_FAILED (payment_pending -> payment_failed)", () => {
    beforeEach(async () => {
      await advanceToState(machine, order, "payment_pending");
    });

    it("should transition to payment_failed", async () => {
      const result = await machine.transition(order, "PAYMENT_FAILED", {
        actor: "system",
        paymentResponse: failedPaymentResponse,
      });
      expect(result.newState).toBe("payment_failed");
    });

    it("should release inventory", async () => {
      await machine.transition(order, "PAYMENT_FAILED", {
        actor: "system",
        paymentResponse: failedPaymentResponse,
      });
      expect(services.inventory.release).toHaveBeenCalled();
    });

    it("should send failure notification", async () => {
      await machine.transition(order, "PAYMENT_FAILED", {
        actor: "system",
        paymentResponse: failedPaymentResponse,
      });
      expect(services.email.sendPaymentFailed).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // payment_failed -> payment_pending (retry)
  // ---------------------------------------------------------------------------

  describe("RETRY_PAYMENT (payment_failed -> payment_pending)", () => {
    beforeEach(async () => {
      await advanceToState(machine, order, "payment_pending");
      await machine.transition(order, "PAYMENT_FAILED", {
        actor: "system",
        paymentResponse: failedPaymentResponse,
      });
    });

    it("should allow retry within limits", async () => {
      const result = await machine.transition(order, "RETRY_PAYMENT", {
        actor: "customer",
        newPaymentMethod: samplePaymentMethod,
      });
      expect(result.newState).toBe("payment_pending");
      expect(order.paymentRetryCount).toBe(1);
    });

    it("should reject when max retries exceeded", async () => {
      order.paymentRetryCount = 3;
      await expect(
        machine.transition(order, "RETRY_PAYMENT", {
          actor: "customer",
          newPaymentMethod: samplePaymentMethod,
        })
      ).rejects.toThrow("Maximum retry count");
    });

    it("should reject when retry window expired", async () => {
      order.placedAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      await expect(
        machine.transition(order, "RETRY_PAYMENT", {
          actor: "customer",
          newPaymentMethod: samplePaymentMethod,
        })
      ).rejects.toThrow("retry window has expired");
    });
  });

  // ---------------------------------------------------------------------------
  // confirmed -> preparing
  // ---------------------------------------------------------------------------

  describe("BEGIN_FULFILLMENT (confirmed -> preparing)", () => {
    beforeEach(async () => {
      await advanceToState(machine, order, "confirmed");
    });

    it("should transition to preparing", async () => {
      const result = await machine.transition(order, "BEGIN_FULFILLMENT", {
        actor: "system",
      });
      expect(result.newState).toBe("preparing");
    });

    it("should create pick list", async () => {
      await machine.transition(order, "BEGIN_FULFILLMENT", {
        actor: "system",
      });
      expect(services.warehouse.createPickList).toHaveBeenCalled();
    });

    it("should reject if warehouse not operational", async () => {
      vi.mocked(services.warehouse.isOperational).mockResolvedValue(false);
      await expect(
        machine.transition(order, "BEGIN_FULFILLMENT", { actor: "system" })
      ).rejects.toThrow("shutdown/freeze");
    });
  });

  // ---------------------------------------------------------------------------
  // confirmed -> cancelled
  // ---------------------------------------------------------------------------

  describe("CANCEL_ORDER from confirmed", () => {
    beforeEach(async () => {
      await advanceToState(machine, order, "confirmed");
    });

    it("should allow cancellation within window", async () => {
      const result = await machine.transition(order, "CANCEL_ORDER", {
        actor: "customer",
        reason: "Changed my mind",
      });
      expect(result.newState).toBe("cancelled");
    });

    it("should reject cancellation after window expires", async () => {
      order.confirmedAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      await expect(
        machine.transition(order, "CANCEL_ORDER", {
          actor: "customer",
          reason: "Too late",
        })
      ).rejects.toThrow("Cancellation window");
    });

    it("should initiate refund on cancellation", async () => {
      await machine.transition(order, "CANCEL_ORDER", {
        actor: "customer",
        reason: "Changed my mind",
      });
      expect(services.payment.refund).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // preparing -> shipped
  // ---------------------------------------------------------------------------

  describe("SHIP_ORDER (preparing -> shipped)", () => {
    beforeEach(async () => {
      await advanceToState(machine, order, "preparing");
    });

    it("should transition to shipped", async () => {
      const result = await machine.transition(order, "SHIP_ORDER", {
        actor: "system",
      });
      expect(result.newState).toBe("shipped");
      expect(order.trackingNumber).toBe("TRACK-001");
    });

    it("should permanently deduct inventory", async () => {
      await machine.transition(order, "SHIP_ORDER", { actor: "system" });
      expect(services.inventory.deductPermanently).toHaveBeenCalled();
    });

    it("should reject if not all items packed", async () => {
      vi.mocked(services.warehouse.allItemsPacked).mockResolvedValue(false);
      await expect(
        machine.transition(order, "SHIP_ORDER", { actor: "system" })
      ).rejects.toThrow("Not all items are packed");
    });
  });

  // ---------------------------------------------------------------------------
  // shipped -> delivered
  // ---------------------------------------------------------------------------

  describe("CONFIRM_DELIVERY (shipped -> delivered)", () => {
    beforeEach(async () => {
      await advanceToState(machine, order, "shipped");
    });

    it("should transition to delivered", async () => {
      const result = await machine.transition(order, "CONFIRM_DELIVERY", {
        actor: "system",
        deliveryConfirmation,
      });
      expect(result.newState).toBe("delivered");
      expect(order.deliveredAt).toBeDefined();
    });

    it("should reject without delivery confirmation", async () => {
      await expect(
        machine.transition(order, "CONFIRM_DELIVERY", { actor: "system" })
      ).rejects.toThrow("No delivery confirmation");
    });
  });

  // ---------------------------------------------------------------------------
  // delivered -> return_requested
  // ---------------------------------------------------------------------------

  describe("REQUEST_RETURN (delivered -> return_requested)", () => {
    beforeEach(async () => {
      await advanceToState(machine, order, "delivered");
    });

    it("should transition to return_requested", async () => {
      const result = await machine.transition(order, "REQUEST_RETURN", {
        actor: "customer",
        reason: "Defective item",
      });
      expect(result.newState).toBe("return_requested");
      expect(order.rmaNumber).toBeDefined();
    });

    it("should reject without return reason", async () => {
      await expect(
        machine.transition(order, "REQUEST_RETURN", { actor: "customer" })
      ).rejects.toThrow("return reason must be provided");
    });

    it("should reject for final-sale items", async () => {
      order.items = [{ ...sampleItem, isFinalSale: true }];
      await expect(
        machine.transition(order, "REQUEST_RETURN", {
          actor: "customer",
          reason: "Do not want",
        })
      ).rejects.toThrow("final-sale items");
    });

    it("should reject after return window", async () => {
      order.deliveredAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
      await expect(
        machine.transition(order, "REQUEST_RETURN", {
          actor: "customer",
          reason: "Late return",
        })
      ).rejects.toThrow("Return window");
    });
  });

  // ---------------------------------------------------------------------------
  // return_requested -> returned
  // ---------------------------------------------------------------------------

  describe("COMPLETE_RETURN (return_requested -> returned)", () => {
    beforeEach(async () => {
      await advanceToState(machine, order, "return_requested");
    });

    it("should transition to returned", async () => {
      const result = await machine.transition(order, "COMPLETE_RETURN", {
        actor: "system",
        inspectionResult: passedInspection,
      });
      expect(result.newState).toBe("returned");
    });

    it("should process refund", async () => {
      await machine.transition(order, "COMPLETE_RETURN", {
        actor: "system",
        inspectionResult: passedInspection,
      });
      expect(services.payment.refund).toHaveBeenCalledWith(
        order.transactionId,
        100
      );
    });

    it("should restock if restockable", async () => {
      await machine.transition(order, "COMPLETE_RETURN", {
        actor: "system",
        inspectionResult: passedInspection,
      });
      expect(services.inventory.restock).toHaveBeenCalled();
    });

    it("should reject if inspection failed", async () => {
      await expect(
        machine.transition(order, "COMPLETE_RETURN", {
          actor: "system",
          inspectionResult: {
            passed: false,
            notes: "Item damaged by customer",
            refundAmount: 0,
            restockable: false,
          },
        })
      ).rejects.toThrow("Inspection failed");
    });
  });

  // ---------------------------------------------------------------------------
  // return_requested -> delivered (deny/cancel return)
  // ---------------------------------------------------------------------------

  describe("DENY_RETURN (return_requested -> delivered)", () => {
    beforeEach(async () => {
      await advanceToState(machine, order, "return_requested");
    });

    it("should transition back to delivered", async () => {
      const result = await machine.transition(order, "DENY_RETURN", {
        actor: "admin",
        reason: "Item not eligible",
      });
      expect(result.newState).toBe("delivered");
    });

    it("should void the RMA", async () => {
      await machine.transition(order, "DENY_RETURN", {
        actor: "admin",
        reason: "Denied",
      });
      expect(services.rma.void).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Terminal States
  // ---------------------------------------------------------------------------

  describe("Terminal states", () => {
    it("should not allow transitions from cancelled", async () => {
      await advanceToState(machine, order, "placed");
      await machine.transition(order, "CANCEL_ORDER", {
        actor: "customer",
        reason: "Test",
      });
      expect(order.state).toBe("cancelled");

      await expect(
        machine.transition(order, "SUBMIT_ORDER", { actor: "customer" })
      ).rejects.toThrow("terminal state");
    });

    it("should not allow transitions from returned", async () => {
      await advanceToState(machine, order, "returned");
      expect(order.state).toBe("returned");

      await expect(
        machine.transition(order, "REQUEST_RETURN", { actor: "customer" })
      ).rejects.toThrow("terminal state");
    });

    it("should report isTerminal correctly", async () => {
      expect(machine.isTerminal(order)).toBe(false);

      await advanceToState(machine, order, "placed");
      await machine.transition(order, "CANCEL_ORDER", {
        actor: "customer",
        reason: "Test",
      });
      expect(machine.isTerminal(order)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Invalid Transitions
  // ---------------------------------------------------------------------------

  describe("Invalid transitions", () => {
    it("should reject direct draft -> shipped", async () => {
      await expect(
        machine.transition(order, "SHIP_ORDER", { actor: "system" })
      ).rejects.toThrow("No transition defined");
    });

    it("should reject direct draft -> confirmed", async () => {
      await expect(
        machine.transition(order, "PAYMENT_SUCCESS", {
          actor: "system",
          paymentResponse: successfulPaymentResponse,
        })
      ).rejects.toThrow("No transition defined");
    });
  });

  // ---------------------------------------------------------------------------
  // canTransition (dry-run check)
  // ---------------------------------------------------------------------------

  describe("canTransition", () => {
    it("should return allowed for valid transitions", async () => {
      const result = await machine.canTransition(order, "SUBMIT_ORDER", {
        actor: "customer",
      });
      expect(result.allowed).toBe(true);
    });

    it("should return not allowed with reason for invalid", async () => {
      order.items = [];
      const result = await machine.canTransition(order, "SUBMIT_ORDER", {
        actor: "customer",
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Cart is empty");
    });

    it("should reject for terminal states", async () => {
      await advanceToState(machine, order, "placed");
      await machine.transition(order, "CANCEL_ORDER", {
        actor: "customer",
        reason: "Test",
      });
      const result = await machine.canTransition(order, "SUBMIT_ORDER");
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("terminal state");
    });
  });

  // ---------------------------------------------------------------------------
  // getAvailableEvents
  // ---------------------------------------------------------------------------

  describe("getAvailableEvents", () => {
    it("should return SUBMIT_ORDER for draft", () => {
      const events = machine.getAvailableEvents(order);
      expect(events).toEqual(["SUBMIT_ORDER"]);
    });

    it("should return INITIATE_PAYMENT and CANCEL_ORDER for placed", async () => {
      await advanceToState(machine, order, "placed");
      const events = machine.getAvailableEvents(order);
      expect(events).toContain("INITIATE_PAYMENT");
      expect(events).toContain("CANCEL_ORDER");
    });

    it("should return empty array for terminal states", async () => {
      await advanceToState(machine, order, "placed");
      await machine.transition(order, "CANCEL_ORDER", {
        actor: "customer",
        reason: "Test",
      });
      const events = machine.getAvailableEvents(order);
      expect(events).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Audit Logging
  // ---------------------------------------------------------------------------

  describe("Audit logging", () => {
    it("should log every transition", async () => {
      await machine.transition(order, "SUBMIT_ORDER", { actor: "customer" });
      expect(services.audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: order.id,
          fromState: "draft",
          toState: "placed",
          event: "SUBMIT_ORDER",
          actor: "customer",
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Introspection Utilities
  // ---------------------------------------------------------------------------

  describe("getReachableStates", () => {
    it("should find all states reachable from draft", () => {
      const reachable = getReachableStates("draft");
      expect(reachable).toContain("placed");
      expect(reachable).toContain("confirmed");
      expect(reachable).toContain("shipped");
      expect(reachable).toContain("delivered");
      expect(reachable).toContain("cancelled");
      expect(reachable).toContain("returned");
    });

    it("should return empty for terminal states", () => {
      expect(getReachableStates("cancelled")).toEqual([]);
      expect(getReachableStates("returned")).toEqual([]);
    });
  });

  describe("getPredecessorStates", () => {
    it("should find predecessors for cancelled", () => {
      const predecessors = getPredecessorStates("cancelled");
      expect(predecessors).toContain("placed");
      expect(predecessors).toContain("confirmed");
      expect(predecessors).toContain("preparing");
      expect(predecessors).toContain("payment_failed");
    });

    it("should return empty for draft (initial state)", () => {
      expect(getPredecessorStates("draft")).toEqual([]);
    });
  });

  describe("validateTransitionTable", () => {
    it("should report no issues for the current table", () => {
      const issues = validateTransitionTable();
      expect(issues).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Full Happy Path
  // ---------------------------------------------------------------------------

  describe("Full happy path: draft -> delivered", () => {
    it("should complete the entire lifecycle", async () => {
      // draft -> placed
      await machine.transition(order, "SUBMIT_ORDER", { actor: "customer" });
      expect(order.state).toBe("placed");

      // placed -> payment_pending
      await machine.transition(order, "INITIATE_PAYMENT", { actor: "system" });
      expect(order.state).toBe("payment_pending");

      // payment_pending -> confirmed
      await machine.transition(order, "PAYMENT_SUCCESS", {
        actor: "system",
        paymentResponse: successfulPaymentResponse,
      });
      expect(order.state).toBe("confirmed");

      // confirmed -> preparing
      await machine.transition(order, "BEGIN_FULFILLMENT", {
        actor: "system",
      });
      expect(order.state).toBe("preparing");

      // preparing -> shipped
      await machine.transition(order, "SHIP_ORDER", { actor: "system" });
      expect(order.state).toBe("shipped");

      // shipped -> delivered
      await machine.transition(order, "CONFIRM_DELIVERY", {
        actor: "system",
        deliveryConfirmation,
      });
      expect(order.state).toBe("delivered");

      // Verify key data was set along the way
      expect(order.orderNumber).not.toBeNull();
      expect(order.transactionId).toBe("txn_123");
      expect(order.trackingNumber).toBe("TRACK-001");
      expect(order.deliveredAt).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Full Return Path
  // ---------------------------------------------------------------------------

  describe("Full return path: delivered -> returned", () => {
    it("should complete delivery and return", async () => {
      await advanceToState(machine, order, "delivered");

      // delivered -> return_requested
      await machine.transition(order, "REQUEST_RETURN", {
        actor: "customer",
        reason: "Wrong size",
      });
      expect(order.state).toBe("return_requested");
      expect(order.rmaNumber).toBeDefined();

      // return_requested -> returned
      await machine.transition(order, "COMPLETE_RETURN", {
        actor: "system",
        inspectionResult: passedInspection,
      });
      expect(order.state).toBe("returned");
      expect(machine.isTerminal(order)).toBe(true);
    });
  });
});
