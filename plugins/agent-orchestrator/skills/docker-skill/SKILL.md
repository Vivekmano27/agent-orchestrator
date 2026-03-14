---
name: docker-skill
description: Create optimized Dockerfiles, multi-stage builds, docker-compose configs, health checks, and container security. Use when the user says "Dockerize", "Docker compose", "container", "Dockerfile", or needs to containerize their application.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Docker Skill

Production-grade containerization.

## Multi-Stage Dockerfile (Node.js)
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/main.js"]
```

## Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports: ['3000:3000']
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/app
      REDIS_URL: redis://redis:6379
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_healthy }
  
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes: ['postgres_data:/var/lib/postgresql/data']
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5
  
  redis:
    image: redis:7-alpine
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s

volumes:
  postgres_data:
```
