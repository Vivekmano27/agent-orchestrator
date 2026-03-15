---
name: api-tester
description: Generate and run API test suites — endpoint validation, auth flows, error scenarios, rate limit testing, and schema validation. Use when the user says "test the API", "API test suite", "validate endpoints", or needs to verify API behavior against its specification.
allowed-tools: Read, Bash, Grep, Glob
---

# API Tester Skill

Comprehensive API testing with automated test generation.

## Test Categories
1. **CRUD Operations** — Create, Read, Update, Delete for each resource
2. **Authentication** — Login, token refresh, unauthorized access
3. **Validation** — Missing fields, invalid types, boundary values
4. **Error Handling** — 404, 409, 422, 500 responses
5. **Pagination** — Page boundaries, sorting, filtering
6. **Rate Limiting** — Verify limits are enforced
7. **Authorization** — Role-based access, resource ownership

## Test Template
```typescript
describe('POST /api/v1/users', () => {
  it('201 — creates user with valid data', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'new@test.com', name: 'Test', password: 'Pass123!' });
    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('new@test.com');
    expect(res.body.data.passwordHash).toBeUndefined(); // never expose
  });

  it('400 — rejects missing email', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test', password: 'Pass123!' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('401 — rejects unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .send({ email: 'new@test.com', name: 'Test', password: 'Pass123!' });
    expect(res.status).toBe(401);
  });

  it('409 — rejects duplicate email', async () => {
    // First create
    await request(app).post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'dup@test.com', name: 'First', password: 'Pass123!' });
    // Duplicate
    const res = await request(app).post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'dup@test.com', name: 'Second', password: 'Pass123!' });
    expect(res.status).toBe(409);
  });
});
```
