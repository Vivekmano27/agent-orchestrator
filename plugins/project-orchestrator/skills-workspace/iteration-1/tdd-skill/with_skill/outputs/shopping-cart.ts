export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DiscountCode {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
}

const DISCOUNT_CODES: DiscountCode[] = [
  { code: 'SAVE10', type: 'percentage', value: 10 },
  { code: 'SAVE20', type: 'percentage', value: 20 },
  { code: 'FLAT5', type: 'fixed', value: 5 },
  { code: 'FLAT15', type: 'fixed', value: 15 },
];

export class ShoppingCart {
  private items: CartItem[] = [];
  private discount: DiscountCode | null = null;

  addItem(product: Product, quantity: number): void {
    const existing = this.items.find((item) => item.product.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({ product, quantity });
    }
  }

  removeItem(productId: string): void {
    const index = this.items.findIndex((item) => item.product.id === productId);
    if (index === -1) {
      throw new Error(`Product with id "${productId}" not found in cart`);
    }
    this.items.splice(index, 1);
  }

  applyDiscount(code: string): void {
    const discount = DISCOUNT_CODES.find((d) => d.code === code);
    if (!discount) {
      throw new Error(`Invalid discount code: "${code}"`);
    }
    this.discount = discount;
  }

  getTotal(): number {
    const subtotal = this.getSubtotal();

    if (!this.discount) {
      return subtotal;
    }

    if (this.discount.type === 'percentage') {
      return this.round(subtotal * (1 - this.discount.value / 100));
    }

    return Math.max(0, this.round(subtotal - this.discount.value));
  }

  getItems(): CartItem[] {
    return [...this.items];
  }

  private getSubtotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
