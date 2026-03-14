---
name: workflow-automation
description: Automate CI/CD pipelines and async workflows — GitHub Actions for lint/test/build/deploy, Celery tasks for async processing, event-driven patterns with RabbitMQ/SQS, scheduled jobs with Celery Beat. Use when building pipelines, automating deployments, or creating background job systems.
---

# Workflow Automation Skill

CI/CD pipelines, async task processing, and event-driven automation patterns.

## When to Use
- Creating or modifying GitHub Actions workflows (`.github/workflows/`)
- Adding Celery async tasks to the Django AI service
- Setting up event-driven communication between services
- Configuring scheduled jobs (cron-based or Celery Beat)

## GitHub Actions CI Pipeline
```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request: { branches: [main] }
  push: { branches: [main] }
jobs:
  core-service:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd services/core-service && npm ci && npm run lint && npm test -- --coverage && npm run build
  ai-service:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: cd services/ai-service && pip install -r requirements.txt
      - run: cd services/ai-service && ruff check . && ruff format --check . && mypy . && pytest --cov
  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd apps/web && npm ci && npm run lint && npx prettier --check . && npm test -- --coverage && npm run build
```

## GitHub Actions CD (Deploy to ECS)
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1
      - uses: aws-actions/amazon-ecr-login@v2
        id: ecr
      - name: Build, push, and deploy
        run: |
          for svc in core-service ai-service api-gateway; do
            docker build -t ${{ steps.ecr.outputs.registry }}/$svc:${{ github.sha }} services/$svc
            docker push ${{ steps.ecr.outputs.registry }}/$svc:${{ github.sha }}
            aws ecs update-service --cluster prod --service $svc --force-new-deployment
          done
```

## Celery Task Pattern
```python
# services/ai-service/app/tasks/ai_tasks.py
from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=60,
             acks_late=True, reject_on_worker_lost=True)
def process_document(self, document_id: str, user_id: str) -> dict:
    """Process a document through the AI pipeline. Retries on transient failures."""
    try:
        document = Document.objects.get(id=document_id)
        result = ai_service.analyze(document.content)
        document.analysis = result
        document.status = "completed"
        document.save()
        return {"status": "completed", "document_id": document_id}
    except Document.DoesNotExist:
        logger.error("Document %s not found, not retrying", document_id)
        return {"status": "failed", "error": "not_found"}
    except ExternalAPIError as exc:
        raise self.retry(exc=exc)
```

## Celery Configuration and Beat Schedule
```python
# settings.py
CELERY_BROKER_URL = os.environ["REDIS_URL"]
CELERY_RESULT_BACKEND = os.environ["REDIS_URL"]
CELERY_TASK_SERIALIZER = "json"
CELERY_TASK_TIME_LIMIT = 300        # Hard kill after 5 min
CELERY_TASK_SOFT_TIME_LIMIT = 240   # SoftTimeLimitExceeded after 4 min
CELERY_TASK_ACKS_LATE = True        # Re-deliver if worker crashes

# config/celery.py — beat schedule
from celery.schedules import crontab
app.conf.beat_schedule = {
    "cleanup-expired-sessions": {
        "task": "app.tasks.maintenance.cleanup_expired_sessions",
        "schedule": crontab(hour=2, minute=0),
    },
    "sync-usage-metrics": {
        "task": "app.tasks.metrics.sync_usage_to_dashboard",
        "schedule": crontab(minute="*/15"),
    },
}
```

## Dead Letter Queue Handling
```python
@shared_task(bind=True, max_retries=3)
def process_with_dlq(self, message: dict) -> None:
    try:
        handle_message(message)
    except Exception as exc:
        if self.request.retries >= self.max_retries:
            dead_letter_store.save(message=message, error=str(exc),
                                   task=self.name, retries=self.request.retries)
            return
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 30)
```

## Anti-Patterns
- **No retry logic** on Celery tasks -- transient failures are inevitable
- **Missing `acks_late`** -- tasks lost when workers crash mid-execution
- **No time limits** -- a hung task blocks the worker forever
- **Secrets in workflow files** -- use GitHub Secrets and OIDC, never hardcode
- **No dead letter queue** -- failed messages vanish silently after max retries

## Checklist
- [ ] CI runs lint, tests, and build for each service independently
- [ ] CD uses OIDC for AWS auth (no long-lived access keys)
- [ ] Celery tasks have `max_retries`, `time_limit`, and `acks_late`
- [ ] Failed tasks route to a dead letter queue or persistent error log
- [ ] Scheduled tasks use Celery Beat, not cron on application servers
- [ ] All secrets sourced from environment variables or GitHub Secrets
- [ ] Deployment requires CI to pass first (branch protection)
