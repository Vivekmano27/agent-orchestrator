import { ShoppingCart, Product, DiscountCode } from './shopping-cart';

describe('ShoppingCart', () => {
  let cart: ShoppingCart;

  // Sample products used across tests
  const apple: Product = { id: 'apple-1', name: 'Apple', price: 1.5 };
  const banana: Product = { id: 'banana-1', name: 'Banana', price: 0.75 };
  const laptop: Product = { id: 'laptop-1', name: 'Laptop', price: 999.99 };

  beforeEach(() => {
    cart = new ShoppingCart();
  });

  // ─── Construction ───────────────────────────────────────────────

  describe('initial state', () => {
    it('should start with an empty cart', () => {
      expect(cart.getItems()).toEqual([]);
    });

    it('should have a total of 0', () => {
      expect(cart.getTotal()).toBe(0);
    });

    it('should have no discount applied', () => {
      expect(cart.getAppliedDiscount()).toBeNull();
    });
  });

  // ─── addItem ────────────────────────────────────────────────────

  describe('addItem', () => {
    it('should add a product with the specified quantity', () => {
      cart.addItem(apple, 3);
      const items = cart.getItems();

      expect(items).toHaveLength(1);
      expect(items[0].product).toEqual(apple);
      expect(items[0].quantity).toBe(3);
    });

    it('should default quantity to 1 when not specified', () => {
      cart.addItem(apple);
      expect(cart.getItems()[0].quantity).toBe(1);
    });

    it('should increase quantity when adding an existing product', () => {
      cart.addItem(apple, 2);
      cart.addItem(apple, 3);

      const items = cart.getItems();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(5);
    });

    it('should support multiple different products', () => {
      cart.addItem(apple, 2);
      cart.addItem(banana, 1);
      cart.addItem(laptop, 1);

      expect(cart.getItems()).toHaveLength(3);
    });

    it('should throw an error for quantity of 0', () => {
      expect(() => cart.addItem(apple, 0)).toThrow('Quantity must be a positive integer');
    });

    it('should throw an error for negative quantity', () => {
      expect(() => cart.addItem(apple, -1)).toThrow('Quantity must be a positive integer');
    });

    it('should throw an error for non-integer quantity', () => {
      expect(() => cart.addItem(apple, 1.5)).toThrow('Quantity must be a positive integer');
    });

    it('should throw an error for a product with a negative price', () => {
      const badProduct: Product = { id: 'bad-1', name: 'Bad', price: -5 };
      expect(() => cart.addItem(badProduct, 1)).toThrow('Product price must be non-negative');
    });
  });

  // ─── removeItem ─────────────────────────────────────────────────

  describe('removeItem', () => {
    it('should remove an item by product id', () => {
      cart.addItem(apple, 2);
      cart.addItem(banana, 3);
      cart.removeItem('apple-1');

      const items = cart.getItems();
      expect(items).toHaveLength(1);
      expect(items[0].product.id).toBe('banana-1');
    });

    it('should throw when removing a product not in the cart', () => {
      expect(() => cart.removeItem('nonexistent')).toThrow('Item not found in cart');
    });

    it('should result in a total of 0 after removing the only item', () => {
      cart.addItem(apple, 1);
      cart.removeItem('apple-1');

      expect(cart.getTotal()).toBe(0);
      expect(cart.getItems()).toHaveLength(0);
    });
  });

  // ─── getTotal ───────────────────────────────────────────────────

  describe('getTotal', () => {
    it('should calculate total for a single item type', () => {
      cart.addItem(apple, 4);
      // 4 * 1.50 = 6.00
      expect(cart.getTotal()).toBe(6.0);
    });

    it('should calculate total for multiple item types', () => {
      cart.addItem(apple, 2); // 2 * 1.50 = 3.00
      cart.addItem(banana, 3); // 3 * 0.75 = 2.25
      // total = 5.25
      expect(cart.getTotal()).toBe(5.25);
    });

    it('should handle floating point precision correctly', () => {
      const item: Product = { id: 'fp-1', name: 'Float Item', price: 0.1 };
      cart.addItem(item, 3);
      // 0.1 + 0.1 + 0.1 should be 0.30, not 0.30000000000000004
      expect(cart.getTotal()).toBe(0.3);
    });

    it('should return total rounded to 2 decimal places', () => {
      const item: Product = { id: 'odd-1', name: 'Odd Price', price: 1.33 };
      cart.addItem(item, 3);
      // 1.33 * 3 = 3.99
      expect(cart.getTotal()).toBe(3.99);
    });

    it('should recalculate after items are removed', () => {
      cart.addItem(apple, 2); // 3.00
      cart.addItem(banana, 4); // 3.00
      cart.removeItem('apple-1');
      expect(cart.getTotal()).toBe(3.0);
    });
  });

  // ─── applyDiscount ──────────────────────────────────────────────

  describe('applyDiscount', () => {
    // Register discount codes in the cart for these tests
    beforeEach(() => {
      cart.registerDiscount({ code: 'SAVE10', type: 'percentage', value: 10 });
      cart.registerDiscount({ code: 'FLAT5', type: 'fixed', value: 5 });
      cart.registerDiscount({ code: 'HALF', type: 'percentage', value: 50 });
      cart.registerDiscount({ code: 'HUGE', type: 'fixed', value: 9999 });
    });

    it('should apply a percentage discount', () => {
      cart.addItem(laptop, 1); // 999.99
      cart.applyDiscount('SAVE10'); // 10% off => 899.99

      expect(cart.getTotal()).toBe(899.99);
    });

    it('should apply a fixed discount', () => {
      cart.addItem(apple, 4); // 6.00
      cart.applyDiscount('FLAT5'); // -5.00 => 1.00

      expect(cart.getTotal()).toBe(1.0);
    });

    it('should not allow total to go below zero with fixed discount', () => {
      cart.addItem(apple, 1); // 1.50
      cart.applyDiscount('HUGE'); // -9999 => should clamp to 0

      expect(cart.getTotal()).toBe(0);
    });

    it('should throw for an invalid discount code', () => {
      expect(() => cart.applyDiscount('INVALID')).toThrow('Invalid discount code');
    });

    it('should replace a previously applied discount', () => {
      cart.addItem(laptop, 1); // 999.99
      cart.applyDiscount('SAVE10'); // 10% off
      cart.applyDiscount('HALF'); // 50% off replaces

      // 999.99 * 0.50 = 500.00 (rounded)
      expect(cart.getTotal()).toBe(500.0);
    });

    it('should expose the currently applied discount', () => {
      cart.applyDiscount('SAVE10');
      expect(cart.getAppliedDiscount()).toEqual({
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
      });
    });

    it('should allow removing a discount', () => {
      cart.addItem(laptop, 1);
      cart.applyDiscount('SAVE10');
      cart.removeDiscount();

      expect(cart.getTotal()).toBe(999.99);
      expect(cart.getAppliedDiscount()).toBeNull();
    });

    it('should apply discount to updated totals when items change after discount', () => {
      cart.addItem(apple, 10); // 15.00
      cart.applyDiscount('SAVE10'); // 10% off => 13.50
      expect(cart.getTotal()).toBe(13.5);

      cart.addItem(banana, 4); // adds 3.00 => subtotal 18.00 => 10% off => 16.20
      expect(cart.getTotal()).toBe(16.2);
    });
  });

  // ─── Edge cases ─────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle a product with price 0 (free item)', () => {
      const freeItem: Product = { id: 'free-1', name: 'Freebie', price: 0 };
      cart.addItem(freeItem, 5);
      expect(cart.getTotal()).toBe(0);
    });

    it('should handle very large quantities', () => {
      cart.addItem(apple, 1000000);
      expect(cart.getTotal()).toBe(1500000);
    });

    it('should handle adding then removing then re-adding a product', () => {
      cart.addItem(apple, 2);
      cart.removeItem('apple-1');
      cart.addItem(apple, 5);

      expect(cart.getItems()).toHaveLength(1);
      expect(cart.getItems()[0].quantity).toBe(5);
    });
  });
});
