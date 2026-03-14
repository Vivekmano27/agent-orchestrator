---
name: monitoring-setup
description: Configure observability — structured logging, metrics (Prometheus/CloudWatch), tracing (OpenTelemetry), alerting, and dashboards. Use when the user says "set up monitoring", "add logging", "observability", "alerting", or needs to track application health in production.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Monitoring Setup Skill

Production observability stack.

## Structured Logging
```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: 'api',
    version: process.env.APP_VERSION,
    environment: process.env.NODE_ENV,
  },
});

// Usage
logger.info({ userId, action: 'login' }, 'User logged in');
logger.error({ err, requestId }, 'Database query failed');
```

## Health Check Endpoint
```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: dbHealthy ? 'ok' : 'failing',
      redis: redisHealthy ? 'ok' : 'failing',
    }
  });
});
```
