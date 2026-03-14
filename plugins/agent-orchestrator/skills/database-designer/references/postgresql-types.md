# PostgreSQL Type Reference

## Common Types
| Use Case | Type | Notes |
|----------|------|-------|
| Primary key | UUID | Use gen_random_uuid() |
| Short text | VARCHAR(N) | N = max length |
| Long text | TEXT | Unlimited length |
| Integer | INTEGER | -2B to 2B |
| Big number | BIGINT | For IDs from external systems |
| Decimal money | NUMERIC(10,2) | Exact precision |
| Boolean | BOOLEAN | true/false |
| Timestamp | TIMESTAMPTZ | Always use TZ-aware |
| JSON data | JSONB | Binary JSON, indexable |
| Array | TYPE[] | e.g., TEXT[] for tags |
| Enum | VARCHAR + CHECK | Prefer over PG ENUM for flexibility |

## Index Types
| Type | Use Case | Syntax |
|------|----------|--------|
| B-tree | Default, equality, range | CREATE INDEX ... |
| GIN | JSONB, arrays, full-text | CREATE INDEX ... USING GIN |
| GiST | Geometry, range types | CREATE INDEX ... USING GiST |
| Partial | Filtered subset | CREATE INDEX ... WHERE status = 'active' |
