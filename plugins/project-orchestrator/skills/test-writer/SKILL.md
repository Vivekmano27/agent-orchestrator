---
name: test-writer
description: Write comprehensive unit and integration tests — happy path, edge cases, error scenarios, security tests. Ensures minimum 80% coverage. Use when the user says "write tests", "add coverage", "test this", "add tests for", or after implementing features. Works with Jest, Vitest, Pytest, JUnit, and all major frameworks. Also use when reviewing code that lacks test coverage or when a bug fix needs a regression test.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Test Writer Skill

Write thorough, maintainable tests that catch real bugs and serve as living documentation. Tests should be fast, isolated, deterministic, and easy to read.

## When to Use

- User asks to write tests or add test coverage for existing code
- A feature was just implemented and needs tests added
- A bug was fixed and needs a regression test to prevent recurrence
- Code review reveals untested paths or missing edge cases
- Coverage report shows gaps that need filling
- Integration points between services need contract verification

## Test Structure (Arrange-Act-Assert)

Every test follows the same three-phase pattern, regardless of framework:

### Jest / Vitest (TypeScript)
```typescript
describe('OrderService', () => {
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

### Pytest (Python)
```python
# tests/test_order_service.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from services.order_service import OrderService

@pytest.fixture
def mock_repo():
    repo = MagicMock()
    repo.save = AsyncMock()
    return repo

@pytest.fixture
def service(mock_repo):
    return OrderService(repo=mock_repo)

class TestCreateOrder:
    async def test_creates_order_with_valid_items(self, service, mock_repo):
        # Arrange
        mock_repo.save.return_value = {"id": "order-1", "total": 59.98}

        # Act
        result = await service.create_order(
            items=[{"product_id": "1", "quantity": 2, "price": 29.99}],
            user_id="user-1",
        )

        # Assert
        assert result["id"] == "order-1"
        assert result["total"] == 59.98
        mock_repo.save.assert_called_once()

    async def test_rejects_empty_order(self, service):
        with pytest.raises(ValueError, match="at least one item"):
            await service.create_order(items=[], user_id="user-1")
```

### NestJS Integration Tests (Supertest)
```typescript
describe('POST /api/v1/orders (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('201 — creates order with valid payload', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ items: [{ productId: '1', quantity: 2 }] });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
  });

  it('401 — rejects unauthenticated request', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({ items: [{ productId: '1', quantity: 2 }] });

    expect(res.status).toBe(401);
  });
});
```

## Test Data Factories

Avoid hardcoding test data everywhere. Use factories for consistent, readable test setups:

```typescript
// tests/factories/order.factory.ts
export function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-' + Math.random().toString(36).slice(2, 8),
    userId: 'user-1',
    items: [{ productId: '1', quantity: 1, price: 10.00 }],
    total: 10.00,
    status: 'pending',
    createdAt: new Date(),
    ...overrides,
  };
}

// Usage in tests — clear what differs from defaults
const cancelledOrder = buildOrder({ status: 'cancelled' });
const bigOrder = buildOrder({ items: Array(100).fill({ productId: '1', quantity: 1, price: 1 }), total: 100 });
```

```python
# tests/factories.py
from dataclasses import dataclass, field
from datetime import datetime

def build_order(**overrides):
    defaults = {
        "id": "order-1",
        "user_id": "user-1",
        "items": [{"product_id": "1", "quantity": 1, "price": 10.00}],
        "total": 10.00,
        "status": "pending",
        "created_at": datetime.utcnow(),
    }
    return {**defaults, **overrides}
```

## Mock Strategies

Use the right level of mocking for the test type:

| Test Type | What to Mock | What's Real |
|-----------|-------------|-------------|
| Unit | External dependencies (DB, APIs, file system) | The function under test |
| Integration | External APIs, third-party services | DB, internal services |
| E2E | Nothing (or only payment providers) | Everything |

```typescript
// Good: Mock at the boundary, not internals
const mockEmailService = { send: jest.fn().mockResolvedValue(true) };
const service = new UserService(realRepo, mockEmailService);

// Bad: Mocking internal implementation details
jest.spyOn(service, 'validatePassword'); // Brittle — breaks on refactor
```

## Coverage Targets

Check project-config.md for project-specific thresholds. Defaults:

| Metric | Target | Rationale |
|--------|--------|-----------|
| Line coverage | 80% | Catches most untested paths |
| Branch coverage | 75% | Ensures conditional logic is tested |
| Function coverage | 90% | Every public function should have at least one test |

Run coverage checks:
```bash
# Jest/Vitest
npx jest --coverage
npx vitest run --coverage

# Pytest
pytest --cov=src --cov-report=term-missing

# Go
go test -coverprofile=coverage.out ./...
```

## Test Categories Checklist

For every function or endpoint, consider these categories:

- [ ] **Happy path** — normal successful operation with valid inputs
- [ ] **Validation** — invalid inputs, missing required fields, wrong types
- [ ] **Edge cases** — empty arrays, zero values, max integer, null/undefined, Unicode
- [ ] **Error handling** — network failures, DB errors, timeouts, partial failures
- [ ] **Security** — unauthorized access, SQL injection attempts, XSS payloads
- [ ] **Concurrency** — race conditions, duplicate submissions, optimistic locking
- [ ] **Integration** — API endpoint tests verifying full request/response cycle

## Anti-Patterns

- **Testing implementation details** — asserting on private methods or internal state couples tests to code structure; test observable behavior instead
- **Copy-paste test setup** — duplicated setup across tests becomes a maintenance burden; extract shared setup into beforeEach or factory functions
- **Testing the framework** — writing tests that verify ORM saves correctly or Express routes work; trust the framework, test your business logic
- **Non-deterministic tests** — using `Date.now()`, `Math.random()`, or real network calls without mocking; tests must produce the same result every run
- **Overly broad assertions** — `expect(result).toBeDefined()` passes for any truthy value; assert on the specific shape and values you expect
- **Ignoring test failures** — skipping or `.skip()`-ing failing tests instead of fixing them; skipped tests are invisible broken tests
- **Testing trivial code** — writing tests for getters, setters, or pass-through functions with no logic; test logic, not plumbing
- **Giant test files** — putting 50+ tests in one file makes finding failures slow; mirror the source directory structure

## Checklist

- [ ] Every public function/method has at least one test
- [ ] Happy path tested for all operations
- [ ] Edge cases identified and tested (empty inputs, boundaries, null)
- [ ] Error scenarios tested (what happens when dependencies fail?)
- [ ] Test names describe behavior, not implementation (e.g., "should reject expired tokens" not "test token check")
- [ ] No hardcoded test data that could break — use factories or builders
- [ ] Mocks are at the right level (boundary mocking, not internal spying)
- [ ] Tests run in isolation — no shared mutable state between tests
- [ ] Tests are fast — unit tests < 5ms each, integration tests < 500ms each
- [ ] Coverage meets project thresholds (default: 80% line, 75% branch)
- [ ] CI pipeline runs tests on every PR
