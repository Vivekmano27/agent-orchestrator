---
name: ci-cd-setup
description: Generate CI/CD pipelines — GitHub Actions, GitLab CI, Jenkins. Build, test, lint, deploy stages with environment variables and secrets management. Use when the user says "set up CI/CD", "GitHub Actions", "pipeline", "automated deployment", or needs continuous integration.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# CI/CD Setup Skill

Create production-grade CI/CD pipelines.

## GitHub Actions Template
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready --health-interval 10s
          --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
      - uses: actions/upload-artifact@v4
        with: { name: coverage, path: coverage/ }

  build:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}' }
      - run: npm ci
      - run: npm run build

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: echo "Deploy step here"
```
