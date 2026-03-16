---
name: test-writer
description: Write comprehensive unit and integration tests — happy path, edge cases, error scenarios, security tests. Ensures minimum 80% coverage. Use when the user says "write tests", "add coverage", "test this", or after implementing features. Works with Jest, Vitest, Pytest, JUnit, and all major frameworks.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Test Writer Skill

Write thorough tests for every piece of code.

## Test Structure (Arrange-Act-Assert)
```typescript
describe('OrderService', () => {
  // Arrange: Set up test data and mocks
  let service: OrderService;
  let mockRepo: jest.Mocked<OrderRepository>;
  
  beforeEach(() => {
    mockRepo = createMock<OrderRepository>();
    service = new OrderService(mockRepo);
  });

  describe('createOrder', () => {
    it('should create order with valid items', async () => {
      // Arrange
      const items = [{ productId: '1', quantity: 2, price: 29.99 }];
      mockRepo.save.mockResolvedValue({ id: 'order-1', items, total: 59.98 });
      
      // Act
      const result = await service.createOrder({ items, userId: 'user-1' });
      
      // Assert
      expect(result.id).toBe('order-1');
      expect(result.total).toBe(59.98);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should reject empty order', async () => {
      await expect(service.createOrder({ items: [], userId: 'user-1' }))
        .rejects.toThrow('Order must have at least one item');
    });

    it('should reject negative quantities', async () => {
      const items = [{ productId: '1', quantity: -1, price: 29.99 }];
      await expect(service.createOrder({ items, userId: 'user-1' }))
        .rejects.toThrow('Quantity must be positive');
    });
  });
});
```

## Test Categories Checklist
- [ ] Happy path — normal successful operation
- [ ] Validation — invalid inputs, missing required fields
- [ ] Edge cases — empty arrays, max values, null/undefined
- [ ] Error handling — network failures, DB errors, timeouts
- [ ] Security — unauthorized access, injection, CSRF
- [ ] Concurrency — race conditions, duplicate submissions
- [ ] Integration — API endpoint tests with real DB
