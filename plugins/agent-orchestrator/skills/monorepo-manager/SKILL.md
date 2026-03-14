---
name: monorepo-manager
description: Manage the project monorepo structure with npm workspaces or Turborepo. Covers shared dependencies, cross-package types, build ordering, selective CI/CD, Docker builds, and package naming conventions.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Monorepo Manager

## When to Use

- Setting up or modifying workspace configuration (npm workspaces, Turborepo)
- Adding a new service or app to the monorepo
- Managing shared dependencies across packages
- Configuring selective CI/CD for changed packages only
- Optimizing Docker builds in a monorepo context

## Patterns

### Workspace Configuration

Root `package.json` with npm workspaces:

```json
{
  "private": true,
  "workspaces": ["services/*", "apps/*", "packages/*"],
  "scripts": {
    "build:all": "turbo run build",
    "test:all": "turbo run test",
    "lint:all": "turbo run lint"
  }
}
```

### Turborepo Pipeline

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "test": { "dependsOn": ["build"], "outputs": [] },
    "lint": { "outputs": [] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

### Shared Types (services/shared/)

Cross-service contracts live in `services/shared/` (package name `@project/shared`):

```
services/shared/
  proto/       # gRPC protobuf definitions
  schemas/     # JSON schemas for API validation
  types/       # Shared TypeScript types (NestJS services only)
```

```typescript
// services/shared/types/api-response.types.ts
export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; perPage: number; lastPage: number };
}
```

NestJS services reference via `"@project/shared": "workspace:*"` in their `package.json`. Python services consume protobuf/JSON schemas, not TypeScript types.

### Dependency Management Rules

- Shared dev tools (ESLint, Prettier, TypeScript) go in root `package.json`
- Runtime dependencies go in each package's own `package.json`
- Always run `npm install` from the repo root, never inside sub-packages

### Selective CI/CD (GitHub Actions)

```yaml
on:
  pull_request:
    paths: ["services/core-service/**", "services/shared/**"]

jobs:
  test-core:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx turbo run test --filter=core-service...
```

Use `--filter=<package>...` (with `...`) to include the package and its dependencies.

### Docker Builds in Monorepo

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY services/shared/ ./services/shared/
COPY services/core-service/ ./services/core-service/
RUN npm ci --workspace=services/core-service --workspace=services/shared
RUN npx turbo run build --filter=core-service

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=base /app/services/core-service/dist ./dist
COPY --from=base /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]
```

Build from repo root: `docker build -f services/core-service/Dockerfile .`

### Package Naming

Use `@project/` scope for all internal packages: `@project/shared`, `@project/core-service`, `@project/api-gateway`, `@project/web`, `@project/ui`.

## Anti-Patterns

- **`npm install` inside sub-packages** -- always install from the repo root
- **Importing TypeScript across service boundaries** -- services communicate via API/gRPC only
- **Duplicating shared types** -- if two services need it, put it in `services/shared/`
- **Building all packages on every PR** -- use path filters and `--filter`
- **Fat Docker images** -- copy only workspace packages your service depends on
- **No pipeline ordering in `turbo.json`** -- builds fail if deps are not built first
- **Python deps in `package.json`** -- Python services use `requirements.txt`; they are not npm workspace members

## Checklist

- [ ] Root `package.json` lists all JS/TS packages in `workspaces`
- [ ] `turbo.json` defines pipelines with correct `dependsOn`
- [ ] Shared types live in `services/shared/` as `@project/shared`
- [ ] Services reference shared via `"workspace:*"`
- [ ] Dev tooling at root; runtime deps in each package
- [ ] CI uses path filters for selective builds
- [ ] Dockerfiles copy only required workspace packages
- [ ] Python services excluded from npm workspaces
- [ ] All internal packages use `@project/` scope
