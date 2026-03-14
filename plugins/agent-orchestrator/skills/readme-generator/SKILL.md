---
name: readme-generator
description: Create comprehensive README.md — project description, installation, usage, API reference, contributing guide, license. Use when the user needs documentation, technical writing, or API docs. Trigger on related keywords.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# README Generator Skill

Create comprehensive, well-structured README files for this microservices project and its individual services.

## When to Use

- Bootstrapping a new service or application that needs a README
- Updating an existing README after significant changes
- Generating per-service READMEs (core-service, ai-service, web, mobile)
- Creating a root-level monorepo README

## README Structure

Every README should follow this order. Omit sections that do not apply, but preserve the order for consistency:

1. **Title + Badges**
2. **Description** (1-2 sentences)
3. **Quick Start** (3 steps maximum)
4. **Prerequisites**
5. **Installation**
6. **Running Locally**
7. **Environment Variables**
8. **API Documentation** (if applicable)
9. **Architecture Overview** (if root README)
10. **Testing**
11. **Deployment**
12. **Contributing**
13. **License**

## Patterns

### Badge row

```markdown
[![CI](https://github.com/org/repo/actions/workflows/ci.yml/badge.svg)](https://github.com/org/repo/actions)
[![Coverage](https://img.shields.io/codecov/c/github/org/repo)](https://codecov.io/gh/org/repo)
[![Version](https://img.shields.io/github/package-json/v/org/repo)](https://github.com/org/repo/releases)
[![License](https://img.shields.io/github/license/org/repo)](./LICENSE)
```

### Quick Start (3-step pattern)

```markdown
## Quick Start

1. **Clone and install**
   ```bash
   git clone https://github.com/org/repo.git && cd repo
   cp .env.example .env
   ```

2. **Start all services**
   ```bash
   docker-compose up
   ```

3. **Open the app**
   - Web: http://localhost:3000
   - API: http://localhost:4000/api
   - API Docs: http://localhost:4000/api/docs
```

### Prerequisites section

```markdown
## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| Python | 3.12+ | [python.org](https://python.org) |
| Docker | 24+ | [docker.com](https://docker.com) |
| Flutter | 3.x | [flutter.dev](https://flutter.dev) |
| PostgreSQL | 16 | Included in docker-compose |
| Redis | 7 | Included in docker-compose |
```

### Environment variables table

```markdown
## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | — | Yes |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` | Yes |
| `JWT_SECRET` | Secret for JWT signing | — | Yes |
| `ANTHROPIC_API_KEY` | Claude API key for AI service | — | Yes |
| `AWS_REGION` | AWS region for S3/SQS | `us-east-1` | No |
| `LOG_LEVEL` | Logging verbosity | `info` | No |
```

### Docker Quick Start section

```markdown
## Running with Docker

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs for a specific service
docker-compose logs -f core-service

# Stop all services
docker-compose down
```
```

### API endpoint summary table

```markdown
## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/v1/auth/login` | Authenticate user | No |
| `GET` | `/api/v1/users/me` | Get current user | Yes |
| `GET` | `/api/v1/projects` | List projects | Yes |
| `POST` | `/api/v1/projects` | Create project | Yes |
| `POST` | `/api/v1/ai/analyze` | Run AI analysis | Yes |

Full API documentation is available at `/api/docs` (Swagger UI) when running locally.
```

### Architecture overview (root README only)

```markdown
## Architecture

```
Client Apps (Web / Mobile)
    |
API Gateway (NestJS) — auth, rate limiting, routing
    |
    +-- Core Service (NestJS + PostgreSQL) — business logic
    +-- AI Service (Django + Celery) — ML inference
    |
Redis — caching & pub/sub
RabbitMQ / SQS — async messaging
```

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed documentation.
```

### Testing section

```markdown
## Testing

```bash
# Run all tests
docker-compose run --rm core-service npm test
docker-compose run --rm ai-service pytest

# Run specific service tests
cd services/core-service && npm test
cd services/ai-service && pytest
cd apps/web && npm test

# E2E tests
cd apps/web && npx playwright test
```
```

## Anti-Patterns

- **Outdated setup instructions** -- keep install steps in sync with actual tooling; review on every dependency change
- **Missing prerequisites** -- always list required tools with minimum versions
- **No Quick Start section** -- the reader should be able to run the project in under 2 minutes
- **Wall of text with no structure** -- use headers, tables, and code blocks liberally
- **Hardcoded values** -- reference `.env.example`, never embed real secrets or URLs
- **Missing API documentation link** -- always point to Swagger/OpenAPI docs
- **No testing instructions** -- include commands for unit, integration, and E2E tests

## Checklist

- [ ] Title and one-line description present
- [ ] Badge row with CI, coverage, and license
- [ ] Quick Start gets to a running app in 3 steps or fewer
- [ ] Prerequisites table with versions
- [ ] Environment variables table with defaults and required flags
- [ ] Docker commands for local development
- [ ] API summary table or link to Swagger docs
- [ ] Testing commands for all services
- [ ] Contributing section with branch naming and PR process
- [ ] No secrets or hardcoded credentials anywhere in the README
