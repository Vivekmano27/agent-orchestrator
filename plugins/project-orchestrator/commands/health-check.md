---
description: "Check the health of all running services — API endpoints, database connections, Redis, external services. Reports any issues."
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Verify all services are running and healthy.

## Checks
```bash
echo "=== Service Health Checks ==="

# API Gateway
curl -sf http://localhost:3000/health && echo "✅ API Gateway" || echo "❌ API Gateway"

# Core Service
curl -sf http://localhost:3001/health && echo "✅ Core Service" || echo "❌ Core Service"

# AI Service
curl -sf http://localhost:8000/health/ && echo "✅ AI Service" || echo "❌ AI Service"

# Web Frontend
curl -sf http://localhost:3002 && echo "✅ Web Frontend" || echo "❌ Web Frontend"

# Database
docker-compose exec db pg_isready -U postgres && echo "✅ PostgreSQL" || echo "❌ PostgreSQL"

# Redis
docker-compose exec redis redis-cli ping && echo "✅ Redis" || echo "❌ Redis"
```

## Output
```
╔══════════════════════════════════╗
║       SERVICE HEALTH CHECK       ║
╠══════════════════════════════════╣
║ ✅ API Gateway     :3000  UP    ║
║ ✅ Core Service    :3001  UP    ║
║ ✅ AI Service      :8000  UP    ║
║ ✅ Web Frontend    :3002  UP    ║
║ ✅ PostgreSQL      :5432  UP    ║
║ ✅ Redis           :6379  UP    ║
║                                  ║
║ OVERALL: ALL HEALTHY ✅          ║
╚══════════════════════════════════╝
```
