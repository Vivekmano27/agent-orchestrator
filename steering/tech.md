# Technical Context

## Architecture
Microservices architecture with the following services:
- **API Gateway**: NestJS — handles routing, auth, rate limiting
- **Core Service**: NestJS + PostgreSQL — business logic, CRUD, REST/GraphQL
- **AI Service**: Python/Django — ML models, LLM integration, data processing
- **Web Frontend**: React / Next.js — customer-facing web application
- **Mobile (Flutter)**: Cross-platform iOS/Android app
- **Mobile (KMP)**: Kotlin Multiplatform shared business logic

## Service Communication
```
Client Apps (Web/Mobile)
    ↓ HTTPS
API Gateway (NestJS)
    ├── REST/gRPC → Core Service (NestJS + PostgreSQL)
    ├── REST/gRPC → AI Service (Python/Django)
    └── WebSocket → Real-time events
Core Service ←→ AI Service (gRPC / REST internal API)
```

## Tech Stack Detail
| Layer | Technology | Version |
|-------|-----------|---------|
| API Gateway | NestJS | 10+ |
| Core Backend | NestJS + TypeORM/Prisma | 10+ |
| AI Backend | Python 3.12 + Django 5 + FastAPI | Latest |
| Database | PostgreSQL 16 | 16 |
| Cache | Redis 7 | 7 |
| Message Queue | RabbitMQ or AWS SQS | Latest |
| Web Frontend | React 18 / Next.js 14+ | App Router |
| Mobile | Flutter 3.x | Latest stable |
| Mobile Shared | Kotlin Multiplatform | 2.0+ |
| Container | Docker + Kubernetes | Latest |
| Cloud | AWS (ECS Fargate, RDS, S3, CloudFront, Lambda) | — |
| CI/CD | GitHub Actions | v4 |
| Monitoring | Prometheus + Grafana / CloudWatch | — |
| Testing | Jest, Pytest, Playwright, Flutter test | — |

## Key Libraries
### NestJS
- TypeORM or Prisma (ORM)
- Passport + JWT (auth)
- class-validator + class-transformer (validation)
- @nestjs/swagger (API docs)
- @nestjs/microservices (service communication)
- Bull/BullMQ (job queues)

### Python/Django
- Django REST Framework (API)
- Celery (async tasks)
- LangChain / Anthropic SDK (AI integration)
- SQLAlchemy (if using FastAPI sidecar)
- Pydantic (validation)
- pytest (testing)

### React/Next.js
- TypeScript 5+
- Tailwind CSS
- Zustand or TanStack Query (state)
- React Hook Form + Zod (forms)
- next-auth (auth)

### Flutter
- Riverpod (state management)
- Dio (HTTP client)
- go_router (navigation)
- freezed (immutable models)
- flutter_test + integration_test

### KMP
- Ktor (networking)
- SQLDelight (local DB)
- Koin (DI)
- Compose Multiplatform (UI)

## Performance Targets
- API response: < 200ms (p95)
- Page load: < 2s (LCP)
- Mobile app start: < 3s cold start
- AI inference: < 5s for standard requests
- Database queries: < 50ms (p95)
- Uptime: 99.9% SLA
