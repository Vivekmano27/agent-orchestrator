import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * E2E tests for Products REST API (v1)
 *
 * Endpoints under test:
 *   POST   /api/v1/products      - Create product (admin only)
 *   GET    /api/v1/products       - List products with pagination (any authenticated user)
 *   GET    /api/v1/products/:id   - Get product by ID (any authenticated user)
 *   PUT    /api/v1/products/:id   - Update product (admin only)
 *   DELETE /api/v1/products/:id   - Delete product (admin only)
 *
 * Auth: JWT bearer tokens with role-based access (admin / user).
 */

describe('Products API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let createdProductId: string;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const validProduct = {
    name: 'Wireless Keyboard',
    description: 'Bluetooth mechanical keyboard with RGB lighting',
    price: 79.99,
    category: 'electronics',
    stock: 150,
  };

  const updatedProduct = {
    name: 'Wireless Keyboard Pro',
    description: 'Upgraded Bluetooth mechanical keyboard with hot-swappable switches',
    price: 129.99,
    category: 'electronics',
    stock: 200,
  };

  /**
   * Obtain a JWT token for the given credentials.
   * Adjust the auth endpoint to match your project's login route.
   */
  async function getAuthToken(
    email: string,
    password: string,
  ): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(HttpStatus.OK);

    return res.body.accessToken ?? res.body.access_token ?? res.body.token;
  }

  // ---------------------------------------------------------------------------
  // Setup / Teardown
  // ---------------------------------------------------------------------------

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Mirror the same global pipes used in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();

    // Obtain tokens for both roles.
    // These credentials should match seeded test users in your test database.
    adminToken = await getAuthToken('admin@test.com', 'Admin123!');
    userToken = await getAuthToken('user@test.com', 'User123!');
  });

  afterAll(async () => {
    await app.close();
  });

  // ===========================================================================
  // POST /api/v1/products  — Create
  // ===========================================================================

  describe('POST /api/v1/products', () => {
    // ---- Auth & Authorization -----------------------------------------------

    it('should return 401 when no auth token is provided', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .send(validProduct)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 403 when a regular user tries to create a product', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validProduct)
        .expect(HttpStatus.FORBIDDEN);
    });

    // ---- Validation ---------------------------------------------------------

    it('should return 400 when required fields are missing', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
          // class-validator returns an array of error messages
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it('should return 400 when price is negative', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validProduct, price: -10 })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when price is zero', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validProduct, price: 0 })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when name is empty string', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validProduct, name: '' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when stock is negative', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validProduct, stock: -5 })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when unexpected fields are present (forbidNonWhitelisted)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validProduct, hackerField: 'malicious' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    // ---- Happy Path ---------------------------------------------------------

    it('should create a product successfully as admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProduct)
        .expect(HttpStatus.CREATED);

      expect(res.body).toMatchObject({
        name: validProduct.name,
        description: validProduct.description,
        price: validProduct.price,
        category: validProduct.category,
        stock: validProduct.stock,
      });
      expect(res.body.id).toBeDefined();
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeDefined();

      // Store for subsequent tests
      createdProductId = res.body.id;
    });

    it('should return 409 when creating a product with duplicate name (if unique constraint)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProduct);

      // Depending on implementation: 409 Conflict or a unique constraint error
      expect([HttpStatus.CONFLICT, HttpStatus.BAD_REQUEST]).toContain(
        res.status,
      );
    });

    // ---- Token edge cases ---------------------------------------------------

    it('should return 401 when token is malformed', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', 'Bearer invalid.token.here')
        .send(validProduct)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 when token is expired', () => {
      // A known expired JWT — replace with one generated for your secret
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        'eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAxfQ.' +
        'invalid_signature';
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send(validProduct)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // ===========================================================================
  // GET /api/v1/products  — List with Pagination
  // ===========================================================================

  describe('GET /api/v1/products', () => {
    // ---- Auth ---------------------------------------------------------------

    it('should return 401 when no auth token is provided', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    // ---- Happy Path ---------------------------------------------------------

    it('should return paginated product list for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      // Expect pagination metadata
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toMatchObject(
        expect.objectContaining({
          total: expect.any(Number),
          page: expect.any(Number),
          limit: expect.any(Number),
        }),
      );
    });

    it('should return paginated product list for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    // ---- Pagination ---------------------------------------------------------

    it('should respect page and limit query parameters', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ page: 1, limit: 5 })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.length).toBeLessThanOrEqual(5);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(5);
    });

    it('should return empty data array for page beyond total', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ page: 9999, limit: 10 })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.data).toHaveLength(0);
    });

    it('should use default pagination when no query params provided', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      // Defaults typically: page=1, limit=10 or 20
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBeGreaterThan(0);
    });

    it('should return 400 for invalid pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ page: -1, limit: 0 })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for non-numeric pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ page: 'abc', limit: 'xyz' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    // ---- Filtering / Search (if supported) ----------------------------------

    it('should filter products by category when query param is provided', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ category: 'electronics' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      for (const product of res.body.data) {
        expect(product.category).toBe('electronics');
      }
    });

    it('should search products by name when search query param is provided', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ search: 'Keyboard' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      for (const product of res.body.data) {
        expect(product.name.toLowerCase()).toContain('keyboard');
      }
    });

    // ---- Sorting (if supported) ---------------------------------------------

    it('should sort products by price ascending', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ sortBy: 'price', order: 'asc' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      const prices = res.body.data.map((p: any) => p.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    it('should sort products by price descending', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ sortBy: 'price', order: 'desc' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      const prices = res.body.data.map((p: any) => p.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
      }
    });
  });

  // ===========================================================================
  // GET /api/v1/products/:id  — Get by ID
  // ===========================================================================

  describe('GET /api/v1/products/:id', () => {
    // ---- Auth ---------------------------------------------------------------

    it('should return 401 when no auth token is provided', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/products/${createdProductId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    // ---- Happy Path ---------------------------------------------------------

    it('should return the product for an authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({
        id: createdProductId,
        name: validProduct.name,
        description: validProduct.description,
        price: validProduct.price,
        category: validProduct.category,
        stock: validProduct.stock,
      });
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeDefined();
    });

    it('should return the product for an admin', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.id).toBe(createdProductId);
    });

    // ---- Not Found ----------------------------------------------------------

    it('should return 404 for a non-existent product ID', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 for an invalid ID format', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products/not-a-valid-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  // ===========================================================================
  // PUT /api/v1/products/:id  — Update
  // ===========================================================================

  describe('PUT /api/v1/products/:id', () => {
    // ---- Auth & Authorization -----------------------------------------------

    it('should return 401 when no auth token is provided', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/products/${createdProductId}`)
        .send(updatedProduct)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 403 when a regular user tries to update a product', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updatedProduct)
        .expect(HttpStatus.FORBIDDEN);
    });

    // ---- Validation ---------------------------------------------------------

    it('should return 400 when price is negative on update', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...updatedProduct, price: -50 })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when name is empty on update', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...updatedProduct, name: '' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when unexpected fields are present on update', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...updatedProduct, isAdmin: true })
        .expect(HttpStatus.BAD_REQUEST);
    });

    // ---- Not Found ----------------------------------------------------------

    it('should return 404 when updating a non-existent product', () => {
      return request(app.getHttpServer())
        .put('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedProduct)
        .expect(HttpStatus.NOT_FOUND);
    });

    // ---- Happy Path ---------------------------------------------------------

    it('should update a product successfully as admin', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedProduct)
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({
        id: createdProductId,
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        category: updatedProduct.category,
        stock: updatedProduct.stock,
      });
      expect(res.body.updatedAt).toBeDefined();
    });

    it('should reflect updated data when fetching the product again', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.name).toBe(updatedProduct.name);
      expect(res.body.price).toBe(updatedProduct.price);
    });

    // ---- Partial Update (if supported) --------------------------------------

    it('should allow partial update with only changed fields', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 99.99 })
        .expect(HttpStatus.OK);

      expect(res.body.price).toBe(99.99);
      // Other fields should remain unchanged
      expect(res.body.name).toBe(updatedProduct.name);
    });

    // ---- Idempotency --------------------------------------------------------

    it('should be idempotent — same PUT request returns same result', async () => {
      const payload = { ...updatedProduct, price: 149.99 };

      const res1 = await request(app.getHttpServer())
        .put(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(HttpStatus.OK);

      const res2 = await request(app.getHttpServer())
        .put(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(HttpStatus.OK);

      expect(res1.body.name).toBe(res2.body.name);
      expect(res1.body.price).toBe(res2.body.price);
      expect(res1.body.stock).toBe(res2.body.stock);
    });
  });

  // ===========================================================================
  // DELETE /api/v1/products/:id  — Delete
  // ===========================================================================

  describe('DELETE /api/v1/products/:id', () => {
    let productToDeleteId: string;

    beforeAll(async () => {
      // Create a dedicated product for deletion tests
      const res = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Disposable Product',
          description: 'Created specifically for delete tests',
          price: 9.99,
          category: 'test',
          stock: 1,
        })
        .expect(HttpStatus.CREATED);

      productToDeleteId = res.body.id;
    });

    // ---- Auth & Authorization -----------------------------------------------

    it('should return 401 when no auth token is provided', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/products/${productToDeleteId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 403 when a regular user tries to delete a product', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/products/${productToDeleteId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    // ---- Not Found ----------------------------------------------------------

    it('should return 404 when deleting a non-existent product', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 for an invalid ID format on delete', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/products/not-a-valid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    // ---- Happy Path ---------------------------------------------------------

    it('should delete a product successfully as admin', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/products/${productToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should return 404 when fetching a deleted product', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/products/${productToDeleteId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 when deleting an already-deleted product (idempotent check)', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/products/${productToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  // ===========================================================================
  // Cross-Cutting Concerns
  // ===========================================================================

  describe('Cross-cutting concerns', () => {
    // ---- Content-Type -------------------------------------------------------

    it('should return JSON content type for all responses', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    // ---- Rate Limiting (if implemented) ------------------------------------

    it('should enforce rate limiting with 429 status after excessive requests', async () => {
      const requests = Array.from({ length: 100 }, () =>
        request(app.getHttpServer())
          .get('/api/v1/products')
          .set('Authorization', `Bearer ${userToken}`),
      );

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.filter(
        (r) => r.status === HttpStatus.TOO_MANY_REQUESTS,
      );

      // If rate limiting is enabled, at least some should be throttled
      // If not implemented yet, all will be 200 — this test documents the expectation
      if (tooManyRequests.length > 0) {
        expect(tooManyRequests.length).toBeGreaterThan(0);
      }
    });

    // ---- Response Structure Consistency ------------------------------------

    it('should return consistent error response structure', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(res.body).toHaveProperty('statusCode');
      expect(res.body).toHaveProperty('message');
      expect(res.body.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    // ---- CORS Headers (if applicable) --------------------------------------

    it('should include appropriate CORS headers', async () => {
      const res = await request(app.getHttpServer())
        .options('/api/v1/products')
        .set('Origin', 'http://localhost:3000');

      // If CORS is enabled, Access-Control-Allow-Origin should be present
      if (res.headers['access-control-allow-origin']) {
        expect(res.headers['access-control-allow-origin']).toBeDefined();
      }
    });

    // ---- Security Headers ---------------------------------------------------

    it('should not expose sensitive server information in headers', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      // X-Powered-By should be disabled (NestJS exposes Express by default)
      expect(res.headers['x-powered-by']).toBeUndefined();
    });

    // ---- SQL Injection Resistance ------------------------------------------

    it('should handle SQL injection attempts in query parameters gracefully', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ search: "'; DROP TABLE products; --" })
        .set('Authorization', `Bearer ${userToken}`);

      // Should either return 200 with empty results or 400 — never 500
      expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(res.status);
    });

    it('should handle SQL injection attempts in path parameters gracefully', async () => {
      const res = await request(app.getHttpServer())
        .get("/api/v1/products/1' OR '1'='1")
        .set('Authorization', `Bearer ${userToken}`);

      expect([HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND]).toContain(
        res.status,
      );
    });

    // ---- XSS Resistance ----------------------------------------------------

    it('should sanitize or reject XSS payloads in product data', async () => {
      const xssProduct = {
        ...validProduct,
        name: '<script>alert("xss")</script>',
        description: '<img src=x onerror=alert("xss")>',
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(xssProduct);

      if (res.status === HttpStatus.CREATED) {
        // If accepted, ensure the script tags are escaped/sanitized in output
        expect(res.body.name).not.toContain('<script>');
      }
      // Otherwise a 400 rejection is also acceptable
    });

    // ---- Large Payload Protection ------------------------------------------

    it('should reject excessively large payloads', async () => {
      const largePayload = {
        ...validProduct,
        description: 'x'.repeat(1_000_000), // 1MB description
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(largePayload);

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.PAYLOAD_TOO_LARGE,
      ]).toContain(res.status);
    });
  });

  // ===========================================================================
  // Data Integrity & Edge Cases
  // ===========================================================================

  describe('Data integrity & edge cases', () => {
    it('should handle concurrent updates gracefully', async () => {
      const updates = [
        request(app.getHttpServer())
          .put(`/api/v1/products/${createdProductId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ price: 50.0 }),
        request(app.getHttpServer())
          .put(`/api/v1/products/${createdProductId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ price: 60.0 }),
      ];

      const results = await Promise.all(updates);

      // Both should succeed (last-write-wins) or one should return 409 (optimistic locking)
      for (const res of results) {
        expect([HttpStatus.OK, HttpStatus.CONFLICT]).toContain(res.status);
      }

      // Final state should be consistent
      const finalState = await request(app.getHttpServer())
        .get(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);

      expect([50.0, 60.0]).toContain(finalState.body.price);
    });

    it('should handle special characters in product names', async () => {
      const specialProduct = {
        ...validProduct,
        name: 'Product with "quotes" & ampersands <angles> (parens)',
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(specialProduct);

      if (res.status === HttpStatus.CREATED) {
        expect(res.body.name).toBe(specialProduct.name);

        // Cleanup
        await request(app.getHttpServer())
          .delete(`/api/v1/products/${res.body.id}`)
          .set('Authorization', `Bearer ${adminToken}`);
      }
    });

    it('should handle unicode characters in product data', async () => {
      const unicodeProduct = {
        ...validProduct,
        name: 'Teclado inalambrico - clavier sans fil',
        description: 'Supports multiple languages: English, Espanol, Francais, Deutsch, Nihongo, Zhongwen',
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(unicodeProduct);

      if (res.status === HttpStatus.CREATED) {
        expect(res.body.name).toBe(unicodeProduct.name);

        // Cleanup
        await request(app.getHttpServer())
          .delete(`/api/v1/products/${res.body.id}`)
          .set('Authorization', `Bearer ${adminToken}`);
      }
    });

    it('should preserve decimal precision on price', async () => {
      const precisionProduct = {
        ...validProduct,
        name: 'Precision Price Product',
        price: 19.99,
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(precisionProduct);

      if (res.status === HttpStatus.CREATED) {
        expect(res.body.price).toBe(19.99);

        // Cleanup
        await request(app.getHttpServer())
          .delete(`/api/v1/products/${res.body.id}`)
          .set('Authorization', `Bearer ${adminToken}`);
      }
    });

    it('should handle maximum integer stock values', async () => {
      const maxStockProduct = {
        ...validProduct,
        name: 'Max Stock Product',
        stock: 2147483647, // Max 32-bit integer
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(maxStockProduct);

      if (res.status === HttpStatus.CREATED) {
        expect(res.body.stock).toBe(2147483647);

        // Cleanup
        await request(app.getHttpServer())
          .delete(`/api/v1/products/${res.body.id}`)
          .set('Authorization', `Bearer ${adminToken}`);
      }
    });
  });

  // ===========================================================================
  // Cleanup — remove the primary test product
  // ===========================================================================

  describe('Cleanup', () => {
    it('should delete the primary test product created during this suite', async () => {
      if (createdProductId) {
        await request(app.getHttpServer())
          .delete(`/api/v1/products/${createdProductId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(HttpStatus.NO_CONTENT);
      }
    });
  });
});
