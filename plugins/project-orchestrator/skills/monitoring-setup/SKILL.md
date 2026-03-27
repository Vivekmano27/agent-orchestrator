---
name: monitoring-setup
description: Configure observability — structured logging, metrics (Prometheus/CloudWatch), tracing (OpenTelemetry), alerting, and dashboards. Use when the user says "set up monitoring", "add logging", "observability", "alerting", or needs to track application health in production.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Monitoring Setup Skill

## Output Structure

Generate monitoring configuration files into the project structure:

```
monitoring/
├── prometheus/
│   ├── prometheus.yml          # Scrape config
│   └── rules/
│       ├── app-alerts.yml      # Application alert rules
│       └── infra-alerts.yml    # Infrastructure alert rules
├── grafana/
│   └── dashboards/
│       └── app-overview.json   # Pre-built dashboard (if applicable)
└── docker-compose.monitoring.yml  # Local monitoring stack
src/
├── lib/logger.ts               # Structured logger setup
├── middleware/request-logger.ts # HTTP request logging middleware
└── routes/health.ts            # Health check endpoint
```

## Structured Logging Format

Every log line must be JSON with these mandatory fields. Human-readable logs are for dev only — production always uses JSON.

```typescript
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: process.env.SERVICE_NAME || 'api',
    version: process.env.APP_VERSION || 'unknown',
    environment: process.env.NODE_ENV || 'development',
  },
  // Pretty print only in development
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

// Create child logger with correlation ID for request tracing
export function createRequestLogger(correlationId: string) {
  return logger.child({ correlationId });
}
```

```typescript
// src/middleware/request-logger.ts
import { randomUUID } from 'crypto';
import { createRequestLogger } from '../lib/logger';

export function requestLogger(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || randomUUID();
  req.log = createRequestLogger(correlationId);

  // Set correlation ID on response for client-side tracing
  res.setHeader('x-correlation-id', correlationId);

  const start = Date.now();
  res.on('finish', () => {
    req.log.info({
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      userAgent: req.headers['user-agent'],
      // Never log request body by default (may contain PII/secrets)
    }, `${req.method} ${req.originalUrl} ${res.statusCode}`);
  });

  next();
}
```

### Log Line Examples

```json
{"level":"info","time":1710500000,"service":"api","version":"1.2.0","environment":"production","correlationId":"550e8400-e29b-41d4-a716-446655440000","method":"POST","path":"/api/orders","statusCode":201,"durationMs":45,"msg":"POST /api/orders 201"}
{"level":"error","time":1710500001,"service":"api","version":"1.2.0","environment":"production","correlationId":"550e8400-e29b-41d4-a716-446655440000","err":{"type":"DatabaseError","message":"connection refused","stack":"..."},"msg":"Failed to create order"}
```

## Health Check Endpoint

```typescript
// src/routes/health.ts
interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: Record<string, { status: 'ok' | 'failing'; latencyMs?: number; message?: string }>;
}

export async function healthCheck(req, res) {
  const checks: HealthCheck['checks'] = {};

  // Database check with timeout
  const dbStart = Date.now();
  try {
    await Promise.race([
      db.query('SELECT 1'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart };
  } catch (err) {
    checks.database = { status: 'failing', message: err.message };
  }

  // Redis check
  const redisStart = Date.now();
  try {
    await redis.ping();
    checks.redis = { status: 'ok', latencyMs: Date.now() - redisStart };
  } catch (err) {
    checks.redis = { status: 'failing', message: err.message };
  }

  const allHealthy = Object.values(checks).every(c => c.status === 'ok');
  const anyFailing = Object.values(checks).some(c => c.status === 'failing');

  const result: HealthCheck = {
    status: anyFailing ? 'unhealthy' : 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || 'unknown',
    checks,
  };

  // Return 503 if unhealthy so load balancers stop routing traffic
  res.status(allHealthy ? 200 : 503).json(result);
}
```

## Prometheus Scrape Configuration

```yaml
# monitoring/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: "api"
    metrics_path: /metrics
    static_configs:
      - targets: ["api:3000"]
        labels:
          service: api
          environment: production

  - job_name: "node-exporter"
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: "postgres-exporter"
    static_configs:
      - targets: ["postgres-exporter:9187"]

alerting:
  alertmanagers:
    - static_configs:
        - targets: ["alertmanager:9093"]
```

## Alert Rule Templates

```yaml
# monitoring/prometheus/rules/app-alerts.yml
groups:
  - name: app.rules
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total[5m]))
          ) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error rate above 5% for 5 minutes"
          description: "{{ $value | humanizePercentage }} of requests are failing"
          runbook: "https://wiki.example.com/runbooks/high-error-rate"

      # Slow response times (p99)
      - alert: HighP99Latency
        expr: |
          histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
          > 2.0
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "p99 latency above 2 seconds for 10 minutes"
          description: "p99 latency is {{ $value }}s"

      # Pod restarts (Kubernetes)
      - alert: PodCrashLooping
        expr: |
          rate(kube_pod_container_status_restarts_total[15m]) * 60 * 15 > 3
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Pod {{ $labels.pod }} is crash-looping"
          description: "{{ $value }} restarts in the last 15 minutes"

      # Database connection pool exhaustion
      - alert: DBConnectionPoolExhausted
        expr: |
          pg_stat_activity_count / pg_settings_max_connections > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "DB connection pool above 80% capacity"

      # Disk space
      - alert: DiskSpaceLow
        expr: |
          (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) < 0.1
        for: 15m
        labels:
          severity: critical
        annotations:
          summary: "Less than 10% disk space remaining"
```

## Constraints

1. **Every alert must have a `for` duration.** Alerts without `for` fire on single-sample spikes and cause alert fatigue. Minimum `for` is 5m for critical, 10m for warning.
2. **Every alert must have a `runbook` annotation.** An alert without a runbook just wakes someone up with no guidance. Link to a wiki page with diagnosis steps.
3. **Never log request/response bodies by default.** They contain PII, passwords, tokens. Log them only in debug mode behind a feature flag, and only in non-production environments.
4. **Health check must return 503 when unhealthy.** Returning 200 with `"status": "unhealthy"` in the body defeats load balancer health checking — the LB reads the status code, not the body.
5. **Correlation IDs must propagate across service boundaries.** Read `x-correlation-id` from incoming requests, generate one if missing, and pass it to all downstream HTTP calls and log entries.
6. **Prometheus scrape interval and alert `for` duration must be compatible.** If scrape interval is 15s and `for` is 1m, you only get ~4 data points before the alert fires. Use `for >= 5 * scrape_interval` as a minimum.

## Anti-Patterns

- **Alerts without runbooks** — waking someone up with no diagnosis steps; every alert needs a linked runbook
- **Logging PII** — request/response bodies often contain passwords and tokens; never log bodies by default
- **Health check returning 200 when unhealthy** — load balancers read status codes, not body text; return 503
- **No correlation IDs** — tracing a request across services is impossible without a shared ID
- **Alert fatigue** — alerts without `for` duration fire on single-sample spikes; minimum 5m for critical, 10m for warning
- **Unstructured logs** — console.log strings are unsearchable; use structured JSON logging

## Checklist

- [ ] Structured JSON logging configured for all services
- [ ] Correlation ID middleware propagates X-Correlation-ID
- [ ] Health check endpoint returns 200 (healthy) or 503 (unhealthy)
- [ ] Prometheus metrics exposed (/metrics endpoint)
- [ ] Alert rules defined with `for` duration and runbook annotations
- [ ] Dashboard created for key metrics (request rate, error rate, latency)
- [ ] Log aggregation configured (CloudWatch, ELK, or Loki)
- [ ] PII excluded from logs (no request/response bodies in production)
