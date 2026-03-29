import { ShoppingCart, Product } from './shopping-cart';

describe('ShoppingCart', () => {
  let cart: ShoppingCart;

  beforeEach(() => {
    cart = new ShoppingCart();
  });

  it('should add an item to the cart', () => {
    const product: Product = { id: 'p1', name: 'Widget', price: 9.99 };

    cart.addItem(product, 1);

    const items = cart.getItems();
    expect(items).toHaveLength(1);
    expect(items[0].product).toEqual(product);
    expect(items[0].quantity).toBe(1);
  });

  it('should increase quantity when adding an existing item', () => {
    const product: Product = { id: 'p1', name: 'Widget', price: 9.99 };

    cart.addItem(product, 1);
    cart.addItem(product, 3);

    const items = cart.getItems();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(4);
  });

  it('should add multiple different items to the cart', () => {
    const widget: Product = { id: 'p1', name: 'Widget', price: 9.99 };
    const gadget: Product = { id: 'p2', name: 'Gadget', price: 24.99 };

    cart.addItem(widget, 1);
    cart.addItem(gadget, 2);

    const items = cart.getItems();
    expect(items).toHaveLength(2);
  });

  it('should remove an item from the cart', () => {
    const widget: Product = { id: 'p1', name: 'Widget', price: 9.99 };
    const gadget: Product = { id: 'p2', name: 'Gadget', price: 24.99 };

    cart.addItem(widget, 1);
    cart.addItem(gadget, 2);
    cart.removeItem('p1');

    const items = cart.getItems();
    expect(items).toHaveLength(1);
    expect(items[0].product.id).toBe('p2');
  });

  it('should throw when removing a non-existent item', () => {
    expect(() => cart.removeItem('nonexistent')).toThrow(
      'Product with id "nonexistent" not found in cart',
    );
  });

  it('should calculate total price correctly', () => {
    cart.addItem({ id: 'p1', name: 'Widget', price: 9.99 }, 2);
    cart.addItem({ id: 'p2', name: 'Gadget', price: 24.99 }, 1);

    // 9.99 * 2 + 24.99 * 1 = 44.97
    expect(cart.getTotal()).toBeCloseTo(44.97, 2);
  });

  it('should return zero total for an empty cart', () => {
    expect(cart.getTotal()).toBe(0);
  });

  it('should apply a percentage discount code', () => {
    cart.addItem({ id: 'p1', name: 'Widget', price: 100 }, 1);

    cart.applyDiscount('SAVE10');

    // 10% off $100 = $90
    expect(cart.getTotal()).toBeCloseTo(90, 2);
  });

  it('should reject an invalid discount code', () => {
    expect(() => cart.applyDiscount('BOGUS')).toThrow(
      'Invalid discount code: "BOGUS"',
    );
  });

  it('should apply a fixed-amount discount code', () => {
    cart.addItem({ id: 'p1', name: 'Widget', price: 50 }, 1);

    cart.applyDiscount('FLAT15');

    // $50 - $15 = $35
    expect(cart.getTotal()).toBeCloseTo(35, 2);
  });

  it('should not allow total to go below zero with fixed discount', () => {
    cart.addItem({ id: 'p1', name: 'Cheap', price: 3 }, 1);

    cart.applyDiscount('FLAT15');

    // $3 - $15 should be clamped to $0
    expect(cart.getTotal()).toBe(0);
  });

  it('should recalculate total after removing an item with discount applied', () => {
    cart.addItem({ id: 'p1', name: 'Widget', price: 100 }, 1);
    cart.addItem({ id: 'p2', name: 'Gadget', price: 50 }, 1);

    cart.applyDiscount('SAVE20');

    // Before remove: ($100 + $50) * 0.8 = $120
    expect(cart.getTotal()).toBeCloseTo(120, 2);

    cart.removeItem('p1');

    // After remove: $50 * 0.8 = $40
    expect(cart.getTotal()).toBeCloseTo(40, 2);
  });
});
