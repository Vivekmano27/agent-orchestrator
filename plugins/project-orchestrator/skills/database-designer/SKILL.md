---
name: database-designer
description: Design database schemas — ER diagrams, table definitions with constraints, indexes, relationships, migration strategies, seed data, and query optimization. Supports PostgreSQL, MySQL, SQLite, MongoDB. Use when the user says "design the database", "create schema", "data model", "ER diagram", "database migration", "table structure", or needs to define how data is stored and related.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Database Designer Skill

Design production-grade database schemas with complete specifications.

## Schema Design Process
1. Identify entities from requirements/user stories
2. Define attributes with types and constraints
3. Establish relationships (1:1, 1:N, M:N)
4. Add indexes for query patterns
5. Plan migrations strategy
6. Create seed data for development

## Entity Template (PostgreSQL)

```sql
-- ============================================
-- Entity: [Name]
-- Purpose: [What this table stores]
-- ============================================
CREATE TABLE [table_name] (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core fields
    [field_name] VARCHAR(255) NOT NULL,
    [field_name] TEXT,
    [field_name] INTEGER NOT NULL DEFAULT 0,
    [field_name] BOOLEAN NOT NULL DEFAULT false,
    [field_name] JSONB,
    
    -- Enums
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'archived')),
    
    -- Foreign keys
    [related]_id UUID NOT NULL REFERENCES [related_table](id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_[table]_[field] ON [table_name]([field]);
CREATE UNIQUE INDEX idx_[table]_[field]_unique ON [table_name]([field]);
CREATE INDEX idx_[table]_created ON [table_name](created_at DESC);

-- Updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON [table_name]
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Documentation Template

```markdown
## [Entity Name]
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, auto | Primary key |
| name | VARCHAR(255) | NOT NULL | Display name |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Login email |
| status | ENUM | NOT NULL, DEFAULT 'active' | Account status |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation time |

**Indexes:** email (unique), status + created_at (composite)
**Relationships:** has_many tasks, belongs_to team
**Estimated Size:** ~100K rows in year 1
```

## Relationship Patterns

### One-to-Many (1:N)
```sql
-- User has many Tasks
ALTER TABLE tasks ADD COLUMN user_id UUID REFERENCES users(id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
```

### Many-to-Many (M:N)
```sql
-- Users <-> Roles via join table
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);
```

## Migration Strategy
1. Always create migrations, never modify DB directly
2. Each migration is reversible (up + down)
3. Name format: `YYYYMMDDHHMMSS_descriptive_name`
4. Test migrations on copy of production data
5. Run in transaction when possible

## Anti-Patterns

- **No indexes on foreign keys** — every FK column needs an index; without one, JOIN queries do full table scans as data grows
- **Using VARCHAR for everything** — use appropriate types (UUID for IDs, TIMESTAMPTZ for dates, INTEGER for counts, BOOLEAN for flags); wrong types prevent DB-level validation
- **Missing NOT NULL constraints** — nullable columns should be the exception, not the default; every field should be NOT NULL unless there's a specific reason to allow nulls
- **No soft delete strategy** — adding `deleted_at` after launch requires backfilling and query changes; decide upfront whether entities use soft or hard delete
- **JSONB as a crutch** — storing structured data as JSONB to avoid schema design; if you query or filter on a field, it should be a column with an index
- **No updated_at trigger** — relying on application code to set updated_at leads to stale timestamps when raw SQL updates happen
- **Missing ON DELETE behavior** — foreign keys without CASCADE or SET NULL cause unexpected constraint violations when parent records are deleted

## Checklist

- [ ] All entities identified from requirements with clear table names (plural, snake_case)
- [ ] Primary keys use UUID (not auto-increment integers) for distributed safety
- [ ] All foreign keys have indexes
- [ ] NOT NULL on every column that should never be empty
- [ ] CHECK constraints on enum/status fields
- [ ] created_at and updated_at on every table with triggers
- [ ] Relationship types documented (1:1, 1:N, M:N) with join tables where needed
- [ ] Indexes added for all query patterns (WHERE, ORDER BY, JOIN columns)
- [ ] Migration files created with up and down functions
- [ ] Schema documented in `.claude/specs/[feature]/schema.md`
