/**
 * Represents a product that can be added to the shopping cart.
 */
export interface Product {
  id: string;
  name: string;
  price: number;
}

/**
 * Represents a line item in the cart: a product paired with a quantity.
 */
export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * Represents a discount code configuration.
 */
export interface DiscountCode {
  code: string;
  type: 'percentage' | 'fixed';
  /** For percentage: 0-100. For fixed: dollar amount to subtract. */
  value: number;
}

/**
 * A shopping cart that supports adding/removing items,
 * calculating totals, and applying discount codes.
 */
export class ShoppingCart {
  private items: Map<string, CartItem> = new Map();
  private discounts: Map<string, DiscountCode> = new Map();
  private appliedDiscount: DiscountCode | null = null;

  // ─── Item operations ──────────────────────────────────────────

  /**
   * Add a product to the cart. If the product already exists,
   * its quantity is increased.
   *
   * @param product - The product to add.
   * @param quantity - How many to add (defaults to 1).
   * @throws If quantity is not a positive integer.
   * @throws If product price is negative.
   */
  addItem(product: Product, quantity: number = 1): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Quantity must be a positive integer');
    }
    if (product.price < 0) {
      throw new Error('Product price must be non-negative');
    }

    const existing = this.items.get(product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.set(product.id, { product, quantity });
    }
  }

  /**
   * Remove a product entirely from the cart by its id.
   *
   * @param productId - The id of the product to remove.
   * @throws If the product is not in the cart.
   */
  removeItem(productId: string): void {
    if (!this.items.has(productId)) {
      throw new Error('Item not found in cart');
    }
    this.items.delete(productId);
  }

  /**
   * Return a snapshot of all items currently in the cart.
   */
  getItems(): CartItem[] {
    return Array.from(this.items.values());
  }

  // ─── Total calculation ────────────────────────────────────────

  /**
   * Calculate the cart total, applying any active discount.
   * The result is rounded to 2 decimal places and clamped to >= 0.
   */
  getTotal(): number {
    const subtotal = this.calculateSubtotal();
    const discounted = this.applyDiscountToAmount(subtotal);
    return this.roundToTwoDecimals(Math.max(0, discounted));
  }

  /**
   * Sum (price * quantity) across all items, using integer-cent
   * arithmetic to avoid floating-point drift.
   */
  private calculateSubtotal(): number {
    let totalCents = 0;
    for (const { product, quantity } of this.items.values()) {
      totalCents += Math.round(product.price * 100) * quantity;
    }
    return totalCents / 100;
  }

  /**
   * Apply the current discount (if any) to a subtotal.
   */
  private applyDiscountToAmount(amount: number): number {
    if (!this.appliedDiscount) {
      return amount;
    }

    switch (this.appliedDiscount.type) {
      case 'percentage':
        return amount * (1 - this.appliedDiscount.value / 100);
      case 'fixed':
        return amount - this.appliedDiscount.value;
      default:
        return amount;
    }
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  // ─── Discount operations ──────────────────────────────────────

  /**
   * Register a discount code that can later be applied.
   */
  registerDiscount(discount: DiscountCode): void {
    this.discounts.set(discount.code, discount);
  }

  /**
   * Apply a previously registered discount code.
   * Replaces any currently applied discount.
   *
   * @param code - The discount code string.
   * @throws If the code is not registered.
   */
  applyDiscount(code: string): void {
    const discount = this.discounts.get(code);
    if (!discount) {
      throw new Error('Invalid discount code');
    }
    this.appliedDiscount = discount;
  }

  /**
   * Remove the currently applied discount, if any.
   */
  removeDiscount(): void {
    this.appliedDiscount = null;
  }

  /**
   * Return the currently applied discount, or null if none.
   */
  getAppliedDiscount(): DiscountCode | null {
    return this.appliedDiscount;
  }
}
