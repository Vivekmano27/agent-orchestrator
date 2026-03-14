# Project Structure

## Monorepo Layout
```
project/
├── services/
│   ├── api-gateway/          → NestJS API Gateway
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common/       → Guards, pipes, filters, decorators
│   │   │   ├── config/       → Configuration
│   │   │   └── modules/      → Feature modules
│   │   ├── test/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── core-service/         → NestJS Core Business Logic
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── users/
│   │   │   │   ├── [domain]/
│   │   │   │   └── health/
│   │   │   ├── common/
│   │   │   └── database/
│   │   ├── prisma/           → Schema + migrations
│   │   ├── test/
│   │   └── Dockerfile
│   │
│   ├── ai-service/           → Python/Django AI Integration
│   │   ├── app/
│   │   │   ├── api/          → API endpoints
│   │   │   ├── services/     → AI/ML business logic
│   │   │   ├── models/       → Django models
│   │   │   ├── tasks/        → Celery async tasks
│   │   │   └── integrations/ → LLM providers (Claude, OpenAI)
│   │   ├── tests/
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   └── manage.py
│   │
│   └── shared/               → Shared proto/schemas between services
│       ├── proto/            → gRPC protobuf definitions
│       └── schemas/          → JSON schemas for validation
│
├── apps/
│   ├── web/                  → React / Next.js Frontend
│   │   ├── src/
│   │   │   ├── app/          → Next.js App Router
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   └── package.json
│   │
│   ├── mobile-flutter/       → Flutter App
│   │   ├── lib/
│   │   │   ├── features/     → Clean architecture per feature
│   │   │   ├── core/
│   │   │   └── app/
│   │   └── test/
│   │
│   └── mobile-kmp/           → Kotlin Multiplatform
│       ├── shared/           → Shared KMP module
│       ├── androidApp/
│       └── iosApp/
│
├── infrastructure/
│   ├── docker/               → Docker Compose files
│   ├── terraform/            → AWS infrastructure
│   ├── k8s/                  → Kubernetes manifests
│   └── scripts/              → Deployment scripts
│
├── docs/                     → Project documentation
├── .github/workflows/        → CI/CD pipelines
├── docker-compose.yml        → Local development
├── CLAUDE.md
├── PRD.md
└── feature_list.json
```

## Naming Conventions
- Files: kebab-case (user-profile.tsx, user.service.ts)
- Components (React): PascalCase (UserProfile.tsx)
- Widgets (Flutter): PascalCase (UserProfile.dart)
- Classes: PascalCase
- Functions/methods: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Database tables: snake_case (user_profiles)
- API routes: kebab-case (/api/v1/user-profiles)
- Environment vars: SCREAMING_SNAKE_CASE

## Module Rules
- Each NestJS module is self-contained: controller + service + dto + entity
- Python services follow Django app pattern: models + views + serializers + urls
- React components: ui/ for primitives, features/ for domain components
- Flutter: feature-first with clean architecture layers (data/domain/presentation)
- NEVER import across service boundaries — use API/gRPC only
- Shared types go in services/shared/
