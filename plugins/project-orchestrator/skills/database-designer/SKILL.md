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
