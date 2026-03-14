---
description: "Scaffold a new microservice — creates directory structure, boilerplate code, Dockerfile, tests, and CI config. Supports NestJS and Python/Django."
argument-hint: "<service-name> <type: nestjs | python>"
disable-model-invocation: true
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Create a new microservice with production-ready boilerplate.

## For NestJS service:
1. Create directory: services/{name}/
2. Initialize NestJS project with TypeScript
3. Add common modules: health, config, auth guard
4. Create Dockerfile (multi-stage)
5. Add to docker-compose.yml
6. Create CI pipeline job
7. Add environment variables to .env.example
8. Update ARCHITECTURE.md

## For Python/Django service:
1. Create directory: services/{name}/
2. Initialize Django project
3. Add DRF, health check, config
4. Create Dockerfile
5. Add to docker-compose.yml
6. Create CI pipeline job
7. Add requirements.txt
8. Update ARCHITECTURE.md
