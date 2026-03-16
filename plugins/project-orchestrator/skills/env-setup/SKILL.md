---
name: env-setup
description: Configure development environments -- Docker Compose, environment variables, database setup, language toolchains (Node.js, Python, Flutter), IDE config, and pre-commit hooks. Use when setting up or managing the development workspace and tooling.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Environment Setup Skill

Set up the complete local development environment for this microservices stack.

## When to Use
- Onboarding a developer to the project
- Setting up Docker Compose for local development
- Configuring environment variables across services
- Installing language toolchains or IDE settings

## Docker Compose for Local Dev

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    ports: ['5432:5432']
    environment: { POSTGRES_USER: postgres, POSTGRES_PASSWORD: postgres, POSTGRES_DB: core_db }
    volumes: ['postgres_data:/var/lib/postgresql/data']
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      retries: 5
  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
  core-service:
    build: ./services/core-service
    ports: ['3001:3001']
    env_file: ./services/core-service/.env
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }
  ai-service:
    build: ./services/ai-service
    ports: ['8000:8000']
    env_file: ./services/ai-service/.env
    depends_on:
      postgres: { condition: service_healthy }
volumes:
  postgres_data:
```

## Environment Variable Management

Each service has three env files: `.env` (local, git-ignored), `.env.example` (template, committed), `.env.test` (test overrides).

```bash
# services/core-service/.env.example
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/core_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=local-dev-secret-change-in-prod
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TIMEOUT_MS=5000
```

```bash
# services/ai-service/.env.example
DJANGO_SECRET_KEY=local-dev-secret-change-in-prod
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_db
CELERY_BROKER_URL=redis://localhost:6379/1
ANTHROPIC_API_KEY=
CORE_SERVICE_URL=http://localhost:3001
```

Bootstrap: `for dir in services/* apps/*; do [ -f "$dir/.env.example" ] && [ ! -f "$dir/.env" ] && cp "$dir/.env.example" "$dir/.env"; done`

## Database Setup and Seeding

```bash
# NestJS / Prisma
cd services/core-service && npx prisma migrate dev --name init && npx prisma db seed

# Django
cd services/ai-service && python manage.py migrate && python manage.py loaddata fixtures/seed_data.json
```

## Toolchain Requirements

```bash
# Node.js 20+ (API Gateway, Core Service, Web)
nvm install 20 && nvm use 20
cd services/core-service && npm ci
cd apps/web && npm ci

# Python 3.12+ (AI Service)
cd services/ai-service
python3.12 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt

# Flutter 3.x (Mobile)
flutter doctor
cd apps/mobile-flutter && flutter pub get
```

## IDE Configuration (VSCode)

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[python]": { "editor.defaultFormatter": "charliermarsh.ruff" },
  "[dart]": { "editor.defaultFormatter": "Dart-Code.dart-code" },
  "files.exclude": { "**/node_modules": true, "**/.next": true, "**/__pycache__": true }
}
```

Recommended extensions: `esbenp.prettier-vscode`, `dbaeumer.vscode-eslint`, `charliermarsh.ruff`, `prisma.prisma`, `bradlc.vscode-tailwindcss`, `dart-code.flutter`, `ms-azuretools.vscode-docker`.

## Pre-Commit Hooks

**Node.js (Husky + lint-staged):** `cd services/core-service && npm install --save-dev husky lint-staged && npx husky init`. Configure lint-staged: `{ "*.ts": ["eslint --fix", "prettier --write"] }`.

**Python (pre-commit + ruff):** Add `.pre-commit-config.yaml` with `ruff-pre-commit` repo (hooks: `ruff --fix`, `ruff-format`). Install: `pip install pre-commit && pre-commit install`.

## Anti-Patterns
- **Never commit .env files** -- only .env.example goes into git
- **Never hardcode service URLs** -- use environment variables
- **Never skip health checks** in Docker Compose
- **Never share a single database** between services

## Checklist
- [ ] `docker-compose up` starts all services successfully
- [ ] PostgreSQL and Redis containers have health checks
- [ ] Each service has .env.example committed, .env git-ignored
- [ ] Database migrations run (Prisma + Django)
- [ ] Node.js 20+, Python 3.12+, Flutter SDK installed
- [ ] VSCode settings and extensions configured
- [ ] Pre-commit hooks active for Node.js and Python services
