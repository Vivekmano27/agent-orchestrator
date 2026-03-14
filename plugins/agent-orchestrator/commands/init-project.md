---
description: "Full project initialization — creates the complete monorepo structure with all services, docker-compose, CI/CD pipeline, environment config, and documentation scaffolds. The FIRST command to run on a brand new project."
argument-hint: "<project-name>"
disable-model-invocation: true
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Create the complete project structure from scratch.

## What Gets Created
```
[project-name]/
├── services/
│   ├── api-gateway/          → NestJS API Gateway (scaffolded)
│   ├── core-service/         → NestJS Core Service (scaffolded)
│   ├── ai-service/           → Python/Django AI Service (scaffolded)
│   └── shared/               → Proto/schema definitions
├── apps/
│   ├── web/                  → Next.js React App (scaffolded)
│   ├── mobile-flutter/       → Flutter App (scaffolded)
│   └── mobile-kmp/           → KMP App (scaffolded)
├── infrastructure/
│   ├── docker/               → Service Dockerfiles
│   ├── terraform/            → AWS Terraform modules
│   └── k8s/                  → Kubernetes manifests
├── docs/                     → Documentation templates
├── .github/workflows/        → CI/CD pipeline
├── docker-compose.yml        → Local development
├── .env.example              → Environment template
├── .gitignore                → Comprehensive gitignore
├── CLAUDE.md                 → Agent instructions
├── PRD.md                    → Empty PRD template
├── feature_list.json         → Empty feature list
└── README.md                 → Project README
```

## Steps
1. Initialize git FIRST — before creating any files:
   ```bash
   git init
   git checkout -b main
   ```
2. Create .gitignore covering: node_modules, __pycache__, .env, .dart_tool, build/, dist/, *.pyc, .DS_Store
3. Stage and make initial commit immediately:
   ```bash
   git add .gitignore
   git commit -m "chore: initialize project"
   ```
4. Create all directories (monorepo structure)
5. Scaffold each service with boilerplate (using setup-service per service)
6. Create docker-compose.yml with all services
7. Create GitHub Actions CI pipeline
8. Create .env.example with all variables
9. Copy CLAUDE.md, steering docs from plugin
10. Final commit with all scaffolded files:
    ```bash
    git add .
    git commit -m "chore: scaffold full monorepo structure"
    ```
11. Report: "Project initialized. Run `docker-compose up` to start."

## Agents Used
- system-architect → determines folder structure
- devops-engineer → creates Docker + CI + infrastructure
- backend-developer → scaffolds NestJS services
- python-developer → scaffolds Django service
- frontend-developer → scaffolds React + Flutter + KMP
- technical-writer → creates README + docs templates
