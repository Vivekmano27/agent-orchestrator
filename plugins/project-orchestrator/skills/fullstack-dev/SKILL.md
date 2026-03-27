---
name: fullstack-dev
description: "Scaffold and configure project structures, boilerplate code, and initial setup when DELEGATED by the project-orchestrator agent. Covers project directory creation, dependency setup, auth templates, and environment configuration. Do NOT invoke this skill directly for new application requests — those should go through the project-orchestrator agent first. For framework-specific patterns (hooks, modules, state management), use react-patterns or nestjs-patterns instead."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Fullstack Development Skill

Scaffold project structures and initial boilerplate. This skill handles the one-time setup that gets a project from zero to a running dev environment. For ongoing implementation patterns, defer to framework-specific skills (react-patterns, nestjs-patterns, python-django-patterns).

## Scope Boundary

| This skill handles | Use instead |
|-------------------|-------------|
| Project directory structure | — |
| package.json / dependency setup | — |
| Auth boilerplate (JWT flow) | — |
| .env.example templates | — |
| React component patterns | react-patterns |
| NestJS module architecture | nestjs-patterns |
| Database schema design | database-designer |
| API endpoint design | api-designer |
| Docker setup | docker-skill |
| CI/CD pipeline | ci-cd-setup |

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

## Post-Scaffold Verification

After scaffolding, verify the project starts:

```bash
# Install dependencies
npm install  # or pip install -r requirements.txt

# Run database migration
npx prisma migrate dev  # or python manage.py migrate

# Start dev server
npm run dev  # or python manage.py runserver

# Run initial test suite
npm test  # should have at least one passing test
```

## Anti-Patterns

- **Scaffolding without project-config.md** — always read project-config.md first to know the chosen stack; don't assume React + NestJS
- **Including real secrets in templates** — `.env.example` must have placeholder values only; never commit actual keys
- **Over-scaffolding** — generating 20 empty module directories "for the future"; create modules as features require them
- **Skipping the auth template** — most apps need auth; scaffolding without it means the first feature PR has to add it
- **No .gitignore** — the first commit should include a proper .gitignore; never commit node_modules, .env, or build artifacts
- **No README** — a freshly scaffolded project should have at minimum: setup instructions, dev server command, and test command

## Checklist

- [ ] Project directory matches chosen stack template
- [ ] package.json / pyproject.toml created with correct dependencies
- [ ] Database configured and initial migration created
- [ ] Auth template in place (JWT with register/login/refresh/logout)
- [ ] .env.example committed with all required variables (placeholder values only)
- [ ] .gitignore includes node_modules, .env, build/, dist/, coverage/
- [ ] Dev server starts without errors
- [ ] At least one test passes (smoke test)
- [ ] README has setup and dev server instructions
