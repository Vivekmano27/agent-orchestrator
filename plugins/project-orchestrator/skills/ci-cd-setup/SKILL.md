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
  push: { branches: [main, develop] }
  pull_request: { branches: [main] }
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

## GitLab CI Template
```yaml
stages: [lint, test, build, deploy]

variables:
  NODE_VERSION: "20"
  POSTGRES_DB: test_db
  POSTGRES_USER: test
  POSTGRES_PASSWORD: test

lint:
  stage: lint
  image: node:${NODE_VERSION}
  cache: { key: ${CI_COMMIT_REF_SLUG}, paths: [node_modules/] }
  script:
    - npm ci
    - npm run lint
    - npm run typecheck

test:
  stage: test
  image: node:${NODE_VERSION}
  services:
    - { name: 'postgres:16', alias: postgres }
  variables:
    DATABASE_URL: postgresql://test:test@postgres:5432/test_db
  cache: { key: ${CI_COMMIT_REF_SLUG}, paths: [node_modules/] }
  script:
    - npm ci
    - npm test -- --coverage
  artifacts: { paths: [coverage/], expire_in: 7 days }

build:
  stage: build
  image: node:${NODE_VERSION}
  cache: { key: ${CI_COMMIT_REF_SLUG}, paths: [node_modules/] }
  script:
    - npm ci
    - npm run build
  artifacts: { paths: [dist/], expire_in: 1 day }

deploy:
  stage: deploy
  image: node:${NODE_VERSION}
  script: [echo "Deploy step here"]
  environment: { name: production }
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

## Jenkins Template
```groovy
pipeline {
    agent any
    environment {
        NODE_VERSION = '20'
        DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
    }
    stages {
        stage('Lint') {
            steps {
                sh 'npm ci'
                sh 'npm run lint'
                sh 'npm run typecheck'
            }
        }
        stage('Test') {
            steps {
                script {
                    docker.image('postgres:16').withRun(
                        '-e POSTGRES_DB=test_db -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -p 5432:5432'
                    ) { pg ->
                        sh 'until pg_isready -h localhost -p 5432; do sleep 2; done'
                        sh 'npm test -- --coverage'
                    }
                }
            }
            post { always { publishHTML(target: [reportDir: 'coverage/lcov-report', reportFiles: 'index.html', reportName: 'Coverage Report']) } }
        }
        stage('Build') {
            steps { sh 'npm run build' }
            post { success { archiveArtifacts artifacts: 'dist/**', fingerprint: true } }
        }
        stage('Deploy') {
            when { branch 'main' }
            steps {
                withCredentials([string(credentialsId: 'deploy-token', variable: 'DEPLOY_TOKEN')]) {
                    sh 'echo "Deploy step here"'
                }
            }
        }
    }
    post { failure { echo 'Pipeline failed' } }
}
```

## Choosing Your CI/CD Platform

| Criteria          | GitHub Actions              | GitLab CI                  | Jenkins                     |
|-------------------|-----------------------------|----------------------------|-----------------------------|
| Hosting           | Cloud (GitHub-hosted)       | Cloud or self-hosted       | Self-hosted                 |
| Config format     | YAML                        | YAML                       | Groovy (Jenkinsfile)        |
| Setup effort      | Minimal                     | Minimal                    | Moderate                    |
| Built-in registry | GitHub Packages             | GitLab Container Registry  | None (plugin required)      |
| Parallelism       | Matrix strategy             | `parallel` keyword         | `parallel` directive        |
| Free tier         | 2,000 min/month             | 400 min/month              | Free (self-hosted)          |
| Best for          | GitHub-native projects      | GitLab-native projects     | Complex enterprise pipelines|

## Secrets Management

### GitHub Actions
Store in **Settings > Secrets and variables > Actions**. Scoped to repo or org. Use `environment` secrets for per-environment values. Masked in logs automatically.
```yaml
- run: ./deploy.sh
  env:
    API_KEY: ${{ secrets.API_KEY }}
    DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

### GitLab CI
Store in **Settings > CI/CD > Variables**. Mark as **Protected** (limit to protected branches) and **Masked** (hide in logs). Group-level variables inherit to all projects.
```yaml
deploy:
  script: [./deploy.sh]
  variables: { API_KEY: $API_KEY }
```

### Jenkins
Store in **Manage Jenkins > Credentials**. Scoped to folder, global, or system. Supports: secret text, username/password, SSH key, certificate.
```groovy
withCredentials([
    string(credentialsId: 'api-key', variable: 'API_KEY'),
    usernamePassword(credentialsId: 'deploy-creds', usernameVariable: 'USER', passwordVariable: 'PASS')
]) { sh './deploy.sh' }
```

## Anti-Patterns

- **Secrets in YAML** — hardcoding API keys in workflow files; use platform secret management
- **No caching** — re-downloading dependencies on every run; cache node_modules, pip cache, Go modules
- **Deploy without tests** — deploying without running tests first; tests must gate deployment
- **No staging** — deploying directly to production; always use staging → production promotion
- **No failure notifications** — CI fails silently; configure Slack/email on failure
- **Sequential when parallel possible** — lint, test, type-check can run concurrently

## Checklist

- [ ] Pipeline triggers defined (push, PR, schedule)
- [ ] Lint, test, type-check, build stages present
- [ ] Dependencies cached for speed
- [ ] Secrets in platform secret management
- [ ] Deploy gated by test success
- [ ] Staging deploys before production
- [ ] Failure notifications configured
- [ ] PR pipeline runs under 10 minutes
