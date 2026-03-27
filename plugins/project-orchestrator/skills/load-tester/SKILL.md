---
name: load-tester
description: Set up and run performance/load testing — concurrent users, response time benchmarks, stress testing, and bottleneck identification using k6, Artillery, or Apache Bench. Use when the user says "load test", "performance benchmark", "stress test", "how many users can this handle".
allowed-tools: Read, Bash, Grep, Glob
---

# Load Tester Skill

## Step 1 — Inventory Endpoints to Test

Scan the codebase for API routes and rank by expected load:

```bash
# Express/NestJS routes
grep -rn "router\.\(get\|post\|put\|patch\|delete\)\|@Get\|@Post\|@Put\|@Patch\|@Delete" --include="*.ts" --include="*.js" | grep -v node_modules | grep -v "\.spec\.\|\.test\."

# Django/FastAPI routes
grep -rn "@app\.\(get\|post\|put\|delete\)\|path(\|url(" --include="*.py" | grep -v "test_\|__pycache__"

# Go routes
grep -rn "HandleFunc\|Handle\|r\.GET\|r\.POST\|e\.GET\|e\.POST" --include="*.go" | grep -v "_test.go"
```

Categorize each endpoint:
- **Read-heavy** (GET lists, search, dashboards) — test with high concurrency
- **Write-heavy** (POST/PUT with DB writes) — test for lock contention
- **Auth endpoints** (login, token refresh) — test for rate limiting and brute-force resilience
- **File upload** — test with realistic payload sizes
- **Webhook receivers** — test for burst tolerance

## Step 2 — Write k6 Test Scripts

Create `load-tests/{scenario}.k6.js` for each scenario.

### Baseline Load Test (steady traffic)

```javascript
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics for business-critical operations
const loginDuration = new Trend('login_duration', true);
const errorRate = new Rate('errors');

export const options = {
  scenarios: {
    steady_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // ramp up
        { duration: '5m', target: 50 },   // steady state
        { duration: '2m', target: 0 },    // ramp down
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: [
      'p(50)<200',    // median under 200ms
      'p(95)<500',    // 95th percentile under 500ms
      'p(99)<1500',   // 99th percentile under 1.5s
    ],
    http_req_failed: ['rate<0.01'],       // <1% error rate
    errors: ['rate<0.01'],
    login_duration: ['p(95)<800'],        // login specifically under 800ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Reusable auth — get token once per VU
export function setup() {
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'loadtest@example.com',
    password: __ENV.LOAD_TEST_PASSWORD,
  }), { headers: { 'Content-Type': 'application/json' } });

  check(res, { 'login succeeded': (r) => r.status === 200 });
  return { token: res.json('token') };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  group('List resources', () => {
    const res = http.get(`${BASE_URL}/api/v1/tasks?page=1&limit=20`, { headers });
    check(res, {
      'status 200': (r) => r.status === 200,
      'has results': (r) => r.json('data.length') > 0,
    });
    errorRate.add(res.status !== 200);
  });

  sleep(Math.random() * 2 + 1); // 1-3s think time — simulates real users

  group('Get single resource', () => {
    const res = http.get(`${BASE_URL}/api/v1/tasks/1`, { headers });
    check(res, { 'status 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  });

  sleep(Math.random() * 2 + 1);

  group('Create resource', () => {
    const payload = JSON.stringify({
      title: `Load test task ${Date.now()}`,
      description: 'Created during load test',
    });
    const res = http.post(`${BASE_URL}/api/v1/tasks`, payload, { headers });
    check(res, {
      'status 201': (r) => r.status === 201,
      'has id': (r) => r.json('id') !== undefined,
    });
    errorRate.add(res.status !== 201);
  });

  sleep(Math.random() * 3 + 2); // longer think time after write
}
```

### Spike Test (sudden traffic surge)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },    // warm up
        { duration: '30s', target: 200 },   // spike to 10x
        { duration: '2m', target: 200 },    // hold spike
        { duration: '30s', target: 20 },    // drop back
        { duration: '2m', target: 20 },     // recovery period
        { duration: '1m', target: 0 },      // ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],      // relaxed during spike — 2s acceptable
    http_req_failed: ['rate<0.05'],         // up to 5% errors during spike is tolerable
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/tasks`);
  check(res, { 'not 5xx': (r) => r.status < 500 });
  sleep(1);
}
```

### Soak Test (sustained load over time)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    soak: {
      executor: 'constant-vus',
      vus: 30,
      duration: '30m',  // run for 30 minutes to detect memory leaks / connection pool exhaustion
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/tasks`);
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(2);
}
```

## Step 3 — Run Tests

```bash
# Install k6
# macOS: brew install k6
# Linux: sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys ... && echo "deb ..." | sudo tee /etc/apt/sources.list.d/k6.list && sudo apt-get update && sudo apt-get install k6

# Run baseline test
k6 run --env BASE_URL=http://localhost:3000 --env LOAD_TEST_PASSWORD=testpass123 load-tests/baseline.k6.js

# Run spike test
k6 run --env BASE_URL=http://localhost:3000 load-tests/spike.k6.js

# Run soak test (background — takes 30min)
k6 run --env BASE_URL=http://localhost:3000 load-tests/soak.k6.js

# Output results to JSON for parsing
k6 run --out json=results.json load-tests/baseline.k6.js
```

**Constraint:** Never run load tests against production without explicit user approval. Default target is always `localhost`. If the user provides a non-localhost URL, confirm before proceeding.

## Step 4 — Interpret Results and Find Bottlenecks

After a test run, check for these patterns:

| Symptom | Likely Cause | Investigation |
|---|---|---|
| p95 rises steadily over time | Memory leak or connection pool exhaustion | Run soak test, monitor process memory with `top` or Datadog |
| Error rate spikes at specific VU count | Server thread/worker limit hit | Check `ulimit -n`, connection pool size, worker count |
| p50 is fine but p99 is 10x+ | GC pauses or slow DB queries | Check DB slow query log, enable `--prof` or equivalent |
| Errors only on write endpoints | DB lock contention | Check for table locks, missing indexes on write paths |
| Consistent timeout at same duration | Upstream service timeout | Check external API calls, add circuit breakers |

```bash
# Find slow DB queries (check ORM-generated SQL)
grep -rn "query\|findMany\|findAll\|select\|SELECT" --include="*.ts" --include="*.py" | grep -v node_modules | grep -v "\.test\.\|\.spec\."

# Check for missing database indexes
grep -rn "@Index\|add_index\|CREATE INDEX\|@@index\|@index" --include="*.ts" --include="*.py" --include="*.prisma" --include="*.sql"

# Check connection pool settings
grep -rn "pool\|connectionLimit\|max_connections\|pool_size" --include="*.ts" --include="*.py" --include="*.yml" --include="*.env*"
```

## Step 5 — CI Integration

Add to `.github/workflows/load-test.yml`:

```yaml
name: Load Test (Baseline)
on:
  pull_request:
    paths:
      - 'src/api/**'
      - 'src/services/**'
      - 'src/db/**'

jobs:
  load-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: loadtest
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - uses: grafana/setup-k6-action@v1
      - run: npm ci
      - run: npm run db:migrate && npm run db:seed
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/loadtest
      - run: npm run build && npm start &
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/loadtest
      - run: sleep 5 && k6 run load-tests/baseline.k6.js --env BASE_URL=http://localhost:3000
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: k6-results
          path: results.json
          retention-days: 14
```

## Output Format

Write to `.claude/specs/{feature}/load-test-report.md`:

```markdown
# Load Test Report — {Feature/Service Name}

**Date:** {YYYY-MM-DD}
**Tool:** k6 v{version}
**Target:** {URL}
**Duration:** {total test time}
**Scenarios run:** {baseline / spike / soak}

## Results Summary

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| p50 latency | <200ms | {value}ms | PASS/FAIL |
| p95 latency | <500ms | {value}ms | PASS/FAIL |
| p99 latency | <1500ms | {value}ms | PASS/FAIL |
| Error rate | <1% | {value}% | PASS/FAIL |
| Max VUs sustained | {target} | {actual} | PASS/FAIL |
| Requests/sec (peak) | — | {value} | — |

## Endpoint Breakdown

| Endpoint | Method | p50 (ms) | p95 (ms) | p99 (ms) | Error % | RPS |
|----------|--------|----------|----------|----------|---------|-----|
| /api/v1/tasks | GET | 45 | 180 | 520 | 0.2% | 85 |
| /api/v1/tasks | POST | 120 | 450 | 1200 | 0.8% | 12 |
| /api/auth/login | POST | 250 | 600 | 1800 | 0.1% | 5 |

## Bottlenecks Identified

### 1. {Bottleneck Title}

- **Symptom:** {what the numbers show}
- **Root cause:** {e.g., N+1 query in `src/services/task.service.ts:45` — each task fetches user separately}
- **Evidence:** {p95 for /api/v1/tasks degrades from 180ms at 20 VUs to 1200ms at 50 VUs}
- **Fix:** {e.g., add `.include({ user: true })` to the Prisma query, or add DB index on `tasks.user_id`}
- **Expected improvement:** {estimated reduction}

## Scaling Recommendations

| Current Capacity | Recommended For | Change Required |
|------------------|-----------------|-----------------|
| 50 concurrent users | 200 users | Add read replica, implement Redis caching for GET /tasks |
| 12 writes/sec | 50 writes/sec | Add DB connection pooling (PgBouncer), batch inserts |

## Test Artifacts

- k6 results: `load-tests/results.json`
- k6 scripts: `load-tests/baseline.k6.js`, `load-tests/spike.k6.js`
```

## Constraints

- Always include think time (`sleep`) between requests. Without it, k6 sends requests as fast as possible, which doesn't represent real user behavior and will produce misleadingly bad results.
- Use `ramping-vus` or `constant-arrival-rate` executors. Never use the default `shared-iterations` executor for load tests — it doesn't maintain consistent concurrency.
- Never hard-code credentials in k6 scripts. Use `__ENV.VAR_NAME` for secrets and pass them via `--env` flags or environment variables.
- Soak tests must run for at least 15 minutes to surface memory leaks and connection pool exhaustion. A 2-minute "soak test" catches nothing.
- Always create a dedicated test user and seed data for load tests. Never load-test against real user accounts or production data.
- Report absolute numbers (p50=180ms, p95=450ms), not just pass/fail. The trend across runs matters more than a single threshold check.

## Anti-Patterns

- **No think time** — sending requests as fast as possible doesn't model real users; always include sleep between requests
- **Wrong executor** — using shared-iterations for load tests; use ramping-vus or constant-arrival-rate
- **Hardcoded credentials** — secrets in k6 scripts; use __ENV.VAR_NAME
- **Short soak tests** — 2-minute soak tests catch nothing; minimum 15 minutes for memory leaks
- **Testing against production data** — use dedicated test users and seed data
- **Threshold-only reporting** — "pass/fail" without p50/p95/p99 numbers; trends matter

## Checklist

- [ ] Test scenarios defined (baseline, spike, soak, stress)
- [ ] Think time included between requests
- [ ] Proper executor chosen (ramping-vus for most cases)
- [ ] Thresholds set for p95 latency and error rate
- [ ] Test data seeded (not using production accounts)
- [ ] Credentials passed via environment variables
- [ ] Results include absolute latency numbers (p50/p95/p99)
- [ ] Report saved to `.claude/specs/[feature]/load-test-report.md`
