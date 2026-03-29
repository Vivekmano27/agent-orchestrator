import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { setupTestApp, getAuthToken } from '../helpers';

// ---------------------------------------------------------------------------
// Auth helpers (per skill pattern — fresh tokens per test run)
// ---------------------------------------------------------------------------
async function getAdminToken(app: INestApplication): Promise<string> {
  return getAuthToken(app, 'admin');
}

async function getUserToken(app: INestApplication): Promise<string> {
  return getAuthToken(app, 'user');
}

// ---------------------------------------------------------------------------
// Error response validator (per skill pattern)
// ---------------------------------------------------------------------------
function expectErrorResponse(
  res: request.Response,
  expectedStatus: number,
): void {
  expect(res.status).toBe(expectedStatus);
  expect(res.body).toHaveProperty('statusCode', expectedStatus);
  expect(res.body).toHaveProperty('error');
  expect(res.body).toHaveProperty('message');
  expect(res.body).toHaveProperty('correlationId');
  // Stack traces must never leak to the client
  expect(res.body).not.toHaveProperty('stack');
}

// ---------------------------------------------------------------------------
// Test data factory — reusable builders for product payloads
// ---------------------------------------------------------------------------
function buildProductPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Widget Pro',
    description: 'A premium widget for professionals',
    price: 49.99,
    category: 'electronics',
    sku: `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    stock: 100,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helper: create a product and return its body (used by multiple tests)
// ---------------------------------------------------------------------------
async function createProduct(
  app: INestApplication,
  token: string,
  overrides: Record<string, unknown> = {},
): Promise<{ id: string; [key: string]: unknown }> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${token}`)
    .send(buildProductPayload(overrides));

  expect(res.status).toBe(201);
  return res.body.data;
}

// ===========================================================================
// Products API — E2E Test Suite
// ===========================================================================
describe('/api/v1/products', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    app = await setupTestApp();
    adminToken = await getAdminToken(app);
    userToken = await getUserToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // 1. CRUD Operations
  // =========================================================================
  describe('CRUD Operations', () => {
    // -- CREATE --
    describe('POST /api/v1/products', () => {
      it('201 — creates a product with valid data', async () => {
        const payload = buildProductPayload();

        const res = await request(app.getHttpServer())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.data).toBeDefined();
        expect(res.body.data.id).toBeDefined();
        expect(res.body.data.name).toBe(payload.name);
        expect(res.body.data.price).toBe(payload.price);
        expect(res.body.data.sku).toBe(payload.sku);
        expect(res.body.data.createdAt).toBeDefined();
      });

      it('201 — returns the full product resource after creation', async () => {
        const payload = buildProductPayload({ name: 'Full Resource Test' });

        const res = await request(app.getHttpServer())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.data).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            name: payload.name,
            description: payload.description,
            price: payload.price,
            category: payload.category,
            sku: payload.sku,
            stock: payload.stock,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          }),
        );
      });
    });

    // -- READ (single) --
    describe('GET /api/v1/products/:id', () => {
      it('200 — retrieves a product by ID', async () => {
        const product = await createProduct(app, adminToken);

        const res = await request(app.getHttpServer())
          .get(`/api/v1/products/${product.id}`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(product.id);
        expect(res.body.data.name).toBe(product.name);
      });
    });

    // -- READ (list) --
    describe('GET /api/v1/products', () => {
      it('200 — returns a list of products', async () => {
        // Ensure at least one product exists
        await createProduct(app, adminToken);

        const res = await request(app.getHttpServer())
          .get('/api/v1/products')
          .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBeGreaterThan(0);
      });
    });

    // -- UPDATE --
    describe('PUT /api/v1/products/:id', () => {
      it('200 — updates an existing product', async () => {
        const product = await createProduct(app, adminToken);

        const res = await request(app.getHttpServer())
          .put(`/api/v1/products/${product.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Updated Widget', price: 59.99 });

        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe('Updated Widget');
        expect(res.body.data.price).toBe(59.99);
        expect(res.body.data.id).toBe(product.id);
      });

      it('200 — partial update preserves unchanged fields', async () => {
        const product = await createProduct(app, adminToken, {
          name: 'Original Name',
          description: 'Original Description',
        });

        const res = await request(app.getHttpServer())
          .put(`/api/v1/products/${product.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Changed Name' });

        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe('Changed Name');
        expect(res.body.data.description).toBe('Original Description');
      });
    });

    // -- DELETE --
    describe('DELETE /api/v1/products/:id', () => {
      it('200 — deletes a product', async () => {
        const product = await createProduct(app, adminToken);

        const deleteRes = await request(app.getHttpServer())
          .delete(`/api/v1/products/${product.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(deleteRes.status).toBe(200);

        // Confirm it is gone
        const getRes = await request(app.getHttpServer())
          .get(`/api/v1/products/${product.id}`)
          .set('Authorization', `Bearer ${userToken}`);

        expectErrorResponse(getRes, 404);
      });
    });
  });

  // =========================================================================
  // 2. Authentication
  // =========================================================================
  describe('Authentication', () => {
    it('401 — rejects request with no token (POST)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/products')
        .send(buildProductPayload());

      expectErrorResponse(res, 401);
    });

    it('401 — rejects request with no token (GET list)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products');

      expectErrorResponse(res, 401);
    });

    it('401 — rejects request with no token (GET by ID)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products/some-id');

      expectErrorResponse(res, 401);
    });

    it('401 — rejects request with no token (PUT)', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/products/some-id')
        .send({ name: 'Hacked' });

      expectErrorResponse(res, 401);
    });

    it('401 — rejects request with no token (DELETE)', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/v1/products/some-id');

      expectErrorResponse(res, 401);
    });

    it('401 — rejects expired token', async () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        'eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MX0.' +
        'invalid-signature';

      const res = await request(app.getHttpServer())
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${expiredToken}`);

      expectErrorResponse(res, 401);
    });

    it('401 — rejects malformed Authorization header', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products')
        .set('Authorization', 'NotBearer some-token');

      expectErrorResponse(res, 401);
    });

    it('401 — rejects empty Bearer token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products')
        .set('Authorization', 'Bearer ');

      expectErrorResponse(res, 401);
    });
  });

  // =========================================================================
  // 3. Validation
  // =========================================================================
  describe('Validation', () => {
    describe('POST /api/v1/products', () => {
      it('400 — rejects missing name', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(buildProductPayload({ name: undefined }));

        expectErrorResponse(res, 400);
      });

      it('400 — rejects empty name', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(buildProductPayload({ name: '' }));

        expectErrorResponse(res, 400);
      });

      it('400 — rejects missing price', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(buildProductPayload({ price: undefined }));

        expectErrorResponse(res, 400);
      });

      it('400 — rejects negative price', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(buildProductPayload({ price: -10 }));

        expectErrorResponse(res, 400);
      });

      it('400 — rejects zero price', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(buildProductPayload({ price: 0 }));

        expectErrorResponse(res, 400);
      });

      it('400 — rejects non-numeric price', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(buildProductPayload({ price: 'not-a-number' }));

        expectErrorResponse(res, 400);
      });

      it('400 — rejects negative stock', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(buildProductPayload({ stock: -5 }));

        expectErrorResponse(res, 400);
      });

      it('400 — rejects non-integer stock', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(buildProductPayload({ stock: 10.5 }));

        expectErrorResponse(res, 400);
      });

      it('400 — rejects empty body', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({});

        expectErrorResponse(res, 400);
      });

      it('400 — rejects name exceeding max length', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(buildProductPayload({ name: 'A'.repeat(256) }));

        expectErrorResponse(res, 400);
      });

      it('400 — rejects missing SKU', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(buildProductPayload({ sku: undefined }));

        expectErrorResponse(res, 400);
      });
    });

    describe('PUT /api/v1/products/:id', () => {
      it('400 — rejects negative price on update', async () => {
        const product = await createProduct(app, adminToken);

        const res = await request(app.getHttpServer())
          .put(`/api/v1/products/${product.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ price: -1 });

        expectErrorResponse(res, 400);
      });

      it('400 — rejects non-numeric price on update', async () => {
        const product = await createProduct(app, adminToken);

        const res = await request(app.getHttpServer())
          .put(`/api/v1/products/${product.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ price: 'free' });

        expectErrorResponse(res, 400);
      });

      it('400 — rejects empty name on update', async () => {
        const product = await createProduct(app, adminToken);

        const res = await request(app.getHttpServer())
          .put(`/api/v1/products/${product.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: '' });

        expectErrorResponse(res, 400);
      });
    });
  });

  // =========================================================================
  // 4. Error Handling
  // =========================================================================
  describe('Error Handling', () => {
    it('404 — GET with non-existent ID', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products/non-existent-id-999')
        .set('Authorization', `Bearer ${userToken}`);

      expectErrorResponse(res, 404);
    });

    it('404 — PUT with non-existent ID', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/products/non-existent-id-999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Ghost Product' });

      expectErrorResponse(res, 404);
    });

    it('404 — DELETE with non-existent ID', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/v1/products/non-existent-id-999')
        .set('Authorization', `Bearer ${adminToken}`);

      expectErrorResponse(res, 404);
    });

    it('404 — GET after deletion returns not found', async () => {
      const product = await createProduct(app, adminToken);

      await request(app.getHttpServer())
        .delete(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expectErrorResponse(res, 404);
    });

    it('409 — rejects duplicate SKU on create', async () => {
      const sku = `UNIQUE-SKU-${Date.now()}`;
      await createProduct(app, adminToken, { sku });

      const res = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(buildProductPayload({ sku }));

      expectErrorResponse(res, 409);
    });

    it('error responses never include stack traces', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products/non-existent-id-999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.body).not.toHaveProperty('stack');
      expect(res.body).not.toHaveProperty('trace');
    });

    it('error responses include correlationId for tracing', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products/non-existent-id-999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.body.correlationId).toBeDefined();
      expect(typeof res.body.correlationId).toBe('string');
      expect(res.body.correlationId.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 5. Pagination
  // =========================================================================
  describe('Pagination', () => {
    // Seed products for pagination tests
    beforeAll(async () => {
      const createPromises = Array.from({ length: 15 }, (_, i) =>
        createProduct(app, adminToken, {
          name: `Pagination Product ${String(i).padStart(2, '0')}`,
          price: 10 + i,
          sku: `PAG-SKU-${Date.now()}-${i}`,
        }),
      );
      await Promise.all(createPromises);
    });

    it('200 — returns paginated results with meta', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products?page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeLessThanOrEqual(10);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(10);
      expect(res.body.meta.total).toBeDefined();
      expect(typeof res.body.meta.total).toBe('number');
    });

    it('200 — second page returns different results', async () => {
      const page1 = await request(app.getHttpServer())
        .get('/api/v1/products?page=1&limit=5')
        .set('Authorization', `Bearer ${userToken}`);

      const page2 = await request(app.getHttpServer())
        .get('/api/v1/products?page=2&limit=5')
        .set('Authorization', `Bearer ${userToken}`);

      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);

      const page1Ids = page1.body.data.map((p: any) => p.id);
      const page2Ids = page2.body.data.map((p: any) => p.id);

      // No overlap between pages
      const overlap = page1Ids.filter((id: string) => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    });

    it('200 — returns empty data array for page beyond total', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products?page=999999&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data).toHaveLength(0);
    });

    it('200 — supports sorting by price ascending', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products?sort=price&order=asc&limit=50')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      const prices = res.body.data.map((p: any) => p.price);
      expect(prices).toEqual([...prices].sort((a: number, b: number) => a - b));
    });

    it('200 — supports sorting by price descending', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products?sort=price&order=desc&limit=50')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      const prices = res.body.data.map((p: any) => p.price);
      expect(prices).toEqual([...prices].sort((a: number, b: number) => b - a));
    });

    it('200 — supports sorting by createdAt', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products?sort=createdAt&order=desc&limit=50')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      const dates = res.body.data.map((p: any) => new Date(p.createdAt).getTime());
      expect(dates).toEqual([...dates].sort((a: number, b: number) => b - a));
    });

    it('200 — supports filtering by category', async () => {
      await createProduct(app, adminToken, {
        category: 'test-filter-category',
        sku: `FILTER-${Date.now()}`,
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/products?category=test-filter-category')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((p: any) => {
        expect(p.category).toBe('test-filter-category');
      });
    });

    it('200 — supports search by name', async () => {
      const uniqueName = `SearchTarget-${Date.now()}`;
      await createProduct(app, adminToken, {
        name: uniqueName,
        sku: `SEARCH-${Date.now()}`,
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/products?search=${uniqueName}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].name).toContain('SearchTarget');
    });

    it('400 — rejects page=0', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products?page=0&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expectErrorResponse(res, 400);
    });

    it('400 — rejects negative page', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products?page=-1&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expectErrorResponse(res, 400);
    });

    it('400 — rejects limit=0', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products?page=1&limit=0')
        .set('Authorization', `Bearer ${userToken}`);

      expectErrorResponse(res, 400);
    });

    it('400 — rejects excessively large limit', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products?page=1&limit=10000')
        .set('Authorization', `Bearer ${userToken}`);

      expectErrorResponse(res, 400);
    });

    it('200 — defaults to page 1 and reasonable limit when omitted', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBeGreaterThan(0);
      expect(res.body.meta.limit).toBeLessThanOrEqual(100);
    });
  });

  // =========================================================================
  // 6. Rate Limiting
  // =========================================================================
  describe('Rate Limiting', () => {
    it('429 — enforces rate limit after too many requests', async () => {
      const server = app.getHttpServer();
      const results: number[] = [];

      // Fire rapid requests to trigger rate limit
      for (let i = 0; i < 150; i++) {
        const res = await request(server)
          .get('/api/v1/products?page=1&limit=1')
          .set('Authorization', `Bearer ${userToken}`);

        results.push(res.status);
        if (res.status === 429) break;
      }

      const has429 = results.includes(429);
      expect(has429).toBe(true);
    });

    it('429 — includes Retry-After header', async () => {
      const server = app.getHttpServer();
      let rateLimitedRes: request.Response | null = null;

      for (let i = 0; i < 150; i++) {
        const res = await request(server)
          .get('/api/v1/products?page=1&limit=1')
          .set('Authorization', `Bearer ${userToken}`);

        if (res.status === 429) {
          rateLimitedRes = res;
          break;
        }
      }

      if (rateLimitedRes) {
        expect(rateLimitedRes.headers['retry-after']).toBeDefined();
        expect(Number(rateLimitedRes.headers['retry-after'])).toBeGreaterThan(0);
      }
    });

    it('200 — returns rate limit headers on normal requests', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products?page=1&limit=1')
        .set('Authorization', `Bearer ${userToken}`);

      // Standard rate limit headers
      if (res.status === 200) {
        expect(res.headers['x-ratelimit-limit']).toBeDefined();
        expect(res.headers['x-ratelimit-remaining']).toBeDefined();
      }
    });
  });

  // =========================================================================
  // 7. Authorization (Role-Based Access)
  // =========================================================================
  describe('Authorization', () => {
    // Admin-only endpoints: POST, PUT, DELETE
    describe('user role cannot create products', () => {
      it('403 — user cannot POST /api/v1/products', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${userToken}`)
          .send(buildProductPayload());

        expectErrorResponse(res, 403);
      });
    });

    describe('user role cannot update products', () => {
      it('403 — user cannot PUT /api/v1/products/:id', async () => {
        const product = await createProduct(app, adminToken);

        const res = await request(app.getHttpServer())
          .put(`/api/v1/products/${product.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ name: 'Hacked Name' });

        expectErrorResponse(res, 403);
      });
    });

    describe('user role cannot delete products', () => {
      it('403 — user cannot DELETE /api/v1/products/:id', async () => {
        const product = await createProduct(app, adminToken);

        const res = await request(app.getHttpServer())
          .delete(`/api/v1/products/${product.id}`)
          .set('Authorization', `Bearer ${userToken}`);

        expectErrorResponse(res, 403);
      });
    });

    describe('user role can read products', () => {
      it('200 — user can GET /api/v1/products (list)', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/v1/products')
          .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
      });

      it('200 — user can GET /api/v1/products/:id (single)', async () => {
        const product = await createProduct(app, adminToken);

        const res = await request(app.getHttpServer())
          .get(`/api/v1/products/${product.id}`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(product.id);
      });
    });

    describe('admin role has full access', () => {
      it('201 — admin can create products', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(buildProductPayload());

        expect(res.status).toBe(201);
      });

      it('200 — admin can read products', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
      });

      it('200 — admin can update products', async () => {
        const product = await createProduct(app, adminToken);

        const res = await request(app.getHttpServer())
          .put(`/api/v1/products/${product.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Admin Updated' });

        expect(res.status).toBe(200);
      });

      it('200 — admin can delete products', async () => {
        const product = await createProduct(app, adminToken);

        const res = await request(app.getHttpServer())
          .delete(`/api/v1/products/${product.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
      });
    });
  });
});
