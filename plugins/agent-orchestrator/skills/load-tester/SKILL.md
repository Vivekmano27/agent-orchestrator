---
name: load-tester
description: Set up and run performance/load testing — concurrent users, response time benchmarks, stress testing, and bottleneck identification using k6, Artillery, or Apache Bench. Use when the user says "load test", "performance benchmark", "stress test", "how many users can this handle".
allowed-tools: Read, Bash, Grep, Glob
---

# Load Tester Skill

Performance and load testing for APIs and web applications.

## k6 Test Template
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100
    { duration: '3m', target: 100 },  // Stay at 100
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% under 500ms
    http_req_failed: ['rate<0.01'],    // < 1% errors
  },
};

export default function () {
  const res = http.get('http://localhost:3000/api/v1/tasks');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```
