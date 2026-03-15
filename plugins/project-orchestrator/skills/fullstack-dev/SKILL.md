---
name: fullstack-dev
description: Scaffold and configure project structures, boilerplate code, and initial setup when DELEGATED by the project-orchestrator agent. Do NOT invoke this skill directly for new application requests — those should go through the project-orchestrator agent first. Only triggers when explicitly called by an agent, not from user prompts like "build an app" or "create a project".
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Fullstack Development Skill

Build complete applications from project setup through deployment.

## Project Scaffolding Process
1. Create project structure based on chosen stack
2. Configure package manager and dependencies
3. Set up database with initial migration
4. Implement authentication
5. Create base API endpoints
6. Build core UI components
7. Connect frontend to backend
8. Configure development tools (linting, testing, formatting)
9. Set up environment configuration
10. Create README and initial documentation

## Stack Templates

### React + Next.js + PostgreSQL
```
project/
├── src/
│   ├── app/              → Next.js App Router pages
│   │   ├── (auth)/       → Auth group (login, register)
│   │   ├── (dashboard)/  → Protected routes
│   │   ├── api/          → API routes
│   │   └── layout.tsx    → Root layout
│   ├── components/       → UI components
│   ├── lib/              → Utilities, db client, auth
│   ├── services/         → Business logic
│   └── types/            → TypeScript types
├── prisma/
│   ├── schema.prisma     → Database schema
│   └── migrations/       → Migration files
├── tests/                → Test files
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

### NestJS + PostgreSQL (Backend)
```
project/
├── src/
│   ├── main.ts                → Entry point
│   ├── app.module.ts          → Root module
│   ├── common/                → Shared (guards, pipes, filters)
│   │   ├── guards/
│   │   ├── pipes/
│   │   ├── filters/
│   │   └── decorators/
│   ├── config/                → Configuration
│   ├── auth/                  → Auth module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── strategies/       → Passport strategies
│   ├── users/                 → User module
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── dto/
│   │   └── entities/
│   └── [module]/              → Feature modules
├── prisma/ or typeorm/
├── test/
├── .env.example
├── nest-cli.json
├── package.json
└── tsconfig.json
```

## Authentication Template (JWT)
```typescript
// Standard auth flow:
// 1. POST /auth/register → hash password, create user, return tokens
// 2. POST /auth/login → verify credentials, return access + refresh tokens
// 3. POST /auth/refresh → validate refresh token, return new access token
// 4. POST /auth/logout → invalidate refresh token
// 5. Protected routes: Authorization: Bearer <access_token>

// Token structure:
// Access token: short-lived (15min), contains user id + role
// Refresh token: long-lived (7 days), stored in DB, rotated on use
```

## Environment Configuration
```
# .env.example
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Auth
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# External Services
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Cloud
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=
```
