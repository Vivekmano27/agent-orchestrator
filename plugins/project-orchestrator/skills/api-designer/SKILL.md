---
name: api-designer
description: Design and generate API specifications — REST endpoints, GraphQL schemas, request/response formats, authentication, error codes, rate limiting, pagination, and versioning. Outputs in OpenAPI/Swagger YAML or Markdown. Use when the user says "design the API", "create API spec", "REST endpoints", "GraphQL schema", "API documentation", or needs to define the contract between frontend and backend.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# API Designer Skill

Design production-grade APIs with complete specifications.

## REST API Design Principles
1. **Resource-oriented URLs** — nouns, not verbs: `/users` not `/getUsers`
2. **HTTP methods for actions** — GET (read), POST (create), PUT (replace), PATCH (update), DELETE (remove)
3. **Consistent response format** — always same structure
4. **Proper status codes** — 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable, 429 Too Many Requests, 500 Server Error
5. **Versioning** — URL path (`/api/v1/`) or header (`Accept: application/vnd.api+json;version=1`)

## Endpoint Template

```markdown
### [METHOD] /api/v1/[resource]
**Description:** [What this endpoint does]
**Auth:** Bearer JWT (role: [required role])
**Rate Limit:** [X requests/minute]

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | UUID | Resource identifier |

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page (max 100) |
| sort | string | created_at | Sort field |
| order | string | desc | Sort direction (asc/desc) |

**Request Body:**
```json
{
  "field1": "string (required, max 255)",
  "field2": "integer (optional, default: 0)",
  "field3": "enum: [value1, value2]"
}
```

**Response 200/201:**
```json
{
  "data": {
    "id": "uuid",
    "field1": "string",
    "createdAt": "2026-01-01T00:00:00Z"
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

**Error Responses:**
| Code | Error Code | Description |
|------|-----------|-------------|
| 400 | VALIDATION_ERROR | Invalid request body |
| 401 | AUTH_REQUIRED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource doesn't exist |
| 409 | CONFLICT | Duplicate resource |
| 429 | RATE_LIMITED | Too many requests |
```

## Standard Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ],
    "requestId": "req_abc123"
  }
}
```

## Pagination Pattern
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "links": {
    "self": "/api/v1/users?page=1&limit=20",
    "next": "/api/v1/users?page=2&limit=20",
    "prev": null
  }
}
```

## Authentication Flow
1. POST /api/v1/auth/register — Create account
2. POST /api/v1/auth/login — Get access + refresh tokens
3. POST /api/v1/auth/refresh — Refresh expired access token
4. POST /api/v1/auth/logout — Invalidate tokens
5. All other endpoints: `Authorization: Bearer <access_token>`

## Anti-Patterns

- **Verbs in URLs** — `/getUsers`, `/createOrder` instead of `/users`, `/orders`; REST uses HTTP methods for actions, not URL verbs
- **Inconsistent response shapes** — some endpoints return `{data: [...]}`, others return raw arrays; every endpoint should use the same wrapper
- **No pagination on list endpoints** — returning unbounded arrays; every list endpoint needs page/limit or cursor-based pagination from day one
- **Leaking internal IDs** — exposing database auto-increment IDs; use UUIDs or slugs in public APIs
- **No error code system** — returning only HTTP status without a machine-readable error code; APIs need both status codes and application-level error codes
- **Breaking changes without versioning** — renaming or removing fields without a new API version; always version breaking changes

## Checklist

- [ ] All endpoints use resource-oriented URLs (nouns, not verbs)
- [ ] HTTP methods match CRUD operations (GET=read, POST=create, PUT/PATCH=update, DELETE=remove)
- [ ] Response format is consistent across all endpoints (same wrapper shape)
- [ ] Every list endpoint has pagination (page/limit or cursor)
- [ ] Error responses include statusCode, error code, message, and correlationId
- [ ] Authentication specified (JWT Bearer, API key, OAuth2)
- [ ] Rate limiting documented (requests per minute, per endpoint or global)
- [ ] API versioned (URL path /v1/ or header)
- [ ] Spec saved to `.claude/specs/[feature]/api-spec.md`
