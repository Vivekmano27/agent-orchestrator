---
name: api-tester
description: "Generate and run API test suites — endpoint validation, auth flows, error scenarios, rate limit testing, and schema validation. Use when the user says \"test the API\", \"API test suite\", \"validate endpoints\", \"API integration tests\", or needs to verify API behavior against its specification. Also use after implementing API endpoints to verify correctness before merging."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# API Tester Skill

Generate comprehensive API test suites that validate every endpoint against its contract. Tests cover the full request lifecycle: authentication, validation, business logic, error responses, and edge cases.

## When to Use

- User asks to test API endpoints or generate an API test suite
- New endpoints were just implemented and need validation
- API spec (OpenAPI/Swagger) exists and needs conformance testing
- Auth flows need end-to-end verification (login, token refresh, permissions)
- A breaking change needs backward-compatibility testing
- Load or rate limiting behavior needs verification

## Test Categories

Every API endpoint should be tested across these 7 categories:

1. **CRUD Operations** — Create, Read, Update, Delete for each resource
2. **Authentication** — Login, token refresh, unauthorized access, expired tokens
3. **Validation** — Missing fields, invalid types, boundary values, malformed payloads
4. **Error Handling** — 404, 409, 422, 500 responses with correct error format
5. **Pagination** — Page boundaries, sorting, filtering, cursor-based navigation
6. **Rate Limiting** — Verify limits are enforced, correct retry-after headers
7. **Authorization** — Role-based access, resource ownership, cross-tenant isolation

## Test Generation Process

1. **Read the API spec** — check for OpenAPI/Swagger files, api-spec.md, or api-contracts.md
2. **List all endpoints** — method + path + description for each
3. **Generate tests per endpoint** — cover all 7 categories where applicable
4. **Add test data factories** — reusable builders for request payloads
5. **Add auth helpers** — token generation, role-based fixtures
6. **Run and verify** — all tests pass, coverage meets thresholds

## Test Patterns

### Supertest (NestJS / Express)

```typescript
// tests/api/orders.e2e-spec.ts
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { setupTestApp, getAuthToken } from '../helpers';

describe('/api/v1/orders', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    app = await setupTestApp();
    adminToken = await getAuthToken(app, 'admin');
    userToken = await getAuthToken(app, 'user');
  });

  afterAll(() => app.close());

  // --- CRUD ---
  describe('POST /api/v1/orders', () => {
    it('201 — creates order with valid data', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: [{ productId: '1', quantity: 2, price: 29.99 }] });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.total).toBe(59.98);
    });

    // --- Validation ---
    it('400 — rejects missing items', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('400 — rejects negative quantity', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: [{ productId: '1', quantity: -1, price: 10 }] });

      expect(res.status).toBe(400);
    });

    // --- Auth ---
    it('401 — rejects unauthenticated request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({ items: [{ productId: '1', quantity: 1, price: 10 }] });

      expect(res.status).toBe(401);
    });

    // --- Duplicates ---
    it('409 — rejects duplicate idempotency key', async () => {
      const payload = { items: [{ productId: '1', quantity: 1, price: 10 }] };
      const headers = { 'Authorization': `Bearer ${adminToken}`, 'Idempotency-Key': 'unique-123' };

      await request(app.getHttpServer()).post('/api/v1/orders').set(headers).send(payload);
      const res = await request(app.getHttpServer()).post('/api/v1/orders').set(headers).send(payload);

      expect(res.status).toBe(409);
    });
  });

  // --- Pagination ---
  describe('GET /api/v1/orders', () => {
    it('200 — returns paginated results', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/orders?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(10);
      expect(res.body.meta.total).toBeDefined();
    });

    it('200 — supports sorting', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/orders?sort=createdAt&order=desc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const dates = res.body.data.map((o: any) => new Date(o.createdAt).getTime());
      expect(dates).toEqual([...dates].sort((a, b) => b - a));
    });
  });

  // --- Authorization ---
  describe('GET /api/v1/orders/:id', () => {
    it('403 — user cannot access another user\'s order', async () => {
      // Create order as admin
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: [{ productId: '1', quantity: 1, price: 10 }] });

      // Try to access as different user
      const res = await request(app.getHttpServer())
        .get(`/api/v1/orders/${createRes.body.data.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
```

### Pytest (Django REST Framework)

```python
# tests/api/test_orders.py
import pytest
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def auth_client(api_client, create_user):
    user = create_user(email="test@example.com")
    api_client.force_authenticate(user=user)
    return api_client

@pytest.mark.django_db
class TestOrderEndpoints:
    def test_create_order_201(self, auth_client):
        response = auth_client.post(
            "/api/v1/orders/",
            data={"items": [{"product_id": 1, "quantity": 2}]},
            format="json",
        )
        assert response.status_code == 201
        assert "id" in response.data

    def test_create_order_400_missing_items(self, auth_client):
        response = auth_client.post("/api/v1/orders/", data={}, format="json")
        assert response.status_code == 400

    def test_create_order_401_unauthenticated(self, api_client):
        response = api_client.post(
            "/api/v1/orders/",
            data={"items": [{"product_id": 1, "quantity": 1}]},
            format="json",
        )
        assert response.status_code == 401

    def test_list_orders_paginated(self, auth_client):
        response = auth_client.get("/api/v1/orders/?page=1&page_size=10")
        assert response.status_code == 200
        assert "results" in response.data
        assert "count" in response.data
```

## Auth Test Helpers

```typescript
// tests/helpers/auth.ts
export async function getAuthToken(
  app: INestApplication,
  role: 'admin' | 'user' = 'user',
): Promise<string> {
  const credentials = {
    admin: { email: 'admin@test.com', password: 'AdminPass123!' },
    user: { email: 'user@test.com', password: 'UserPass123!' },
  };

  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send(credentials[role]);

  return res.body.data.accessToken;
}
```

## Error Response Validation

Every error response should match the project's standard format:

```typescript
function expectErrorResponse(res: request.Response, expectedStatus: number) {
  expect(res.status).toBe(expectedStatus);
  expect(res.body).toHaveProperty('statusCode', expectedStatus);
  expect(res.body).toHaveProperty('error');
  expect(res.body).toHaveProperty('message');
  expect(res.body).toHaveProperty('correlationId');
  // Stack traces must never leak to the client
  expect(res.body).not.toHaveProperty('stack');
}
```

## CI Integration

Add API tests to the CI pipeline as a separate stage that runs after unit tests:

```yaml
# .github/workflows/ci.yml
api-tests:
  needs: [unit-tests]
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:15
      env:
        POSTGRES_DB: test_db
        POSTGRES_PASSWORD: test
      ports: ['5432:5432']
  steps:
    - uses: actions/checkout@v4
    - run: npm ci
    - run: npm run test:e2e
      env:
        DATABASE_URL: postgresql://postgres:test@localhost:5432/test_db
```

## Anti-Patterns

- **Testing against production databases** — always use isolated test databases with fixtures; tests must never touch production data
- **Hardcoding auth tokens** — tokens expire; generate fresh tokens in beforeAll or use fixtures
- **Ignoring response schema** — checking only status codes misses broken response shapes; validate the full body structure
- **Sequential test dependencies** — test B relying on state created by test A; each test must set up its own data
- **Not testing error paths** — only testing 200/201 responses; the 4xx and 5xx paths often have the most bugs
- **Skipping pagination edge cases** — not testing page=0, page=999999, limit=0, limit=10000
- **Missing cleanup** — not clearing test data between runs; tests become flaky as data accumulates

## Checklist

- [ ] All endpoints have at least one test per HTTP method
- [ ] Happy path (2xx) tested for each endpoint
- [ ] Validation errors (400) tested with missing/invalid fields
- [ ] Authentication (401) tested with missing and expired tokens
- [ ] Authorization (403) tested for role-based and ownership checks
- [ ] Not found (404) tested with non-existent resource IDs
- [ ] Conflict (409) tested for duplicate creation scenarios
- [ ] Error response format is consistent (statusCode, error, message, correlationId)
- [ ] Pagination tested including boundaries and sorting
- [ ] Auth helper generates fresh tokens per test run
- [ ] Tests run in CI with isolated database
- [ ] No test depends on state from another test
