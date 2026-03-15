---
description: "Run the complete test suite across ALL services — unit, integration, E2E, security, accessibility. Reports pass/fail per service with coverage. Fails if any service is below coverage threshold."
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.

## Mission
Execute every test in the project, enforce coverage thresholds, and report results. The entire run fails if ANY service is below its coverage minimum.

## Coverage Thresholds (enforced — fail if below)
| Service | Framework | Threshold |
|---------|-----------|-----------|
| NestJS Core | Jest | ≥ 80% |
| NestJS Gateway | Jest | ≥ 80% |
| Python AI | pytest-cov | ≥ 80% |
| React Web | Vitest | ≥ 75% |
| Flutter | lcov | ≥ 75% |
| KMP Shared | JaCoCo | ≥ 75% |

## Execution
```bash
#!/bin/bash
set -e  # exit on first failure
ROOT=$(pwd)
FAILED=0

echo "╔══════════════════════════════════════╗"
echo "║    RUNNING COMPLETE TEST SUITE       ║"
echo "╚══════════════════════════════════════╝"

# ─── 1. NestJS Core Service ───────────────────────────────────────
echo "\n[1/9] NestJS Core Service — Unit Tests"
(cd "$ROOT/services/core-service" && npm test -- --coverage --ci) || FAILED=1

# ─── 2. NestJS API Gateway ────────────────────────────────────────
echo "\n[2/9] NestJS API Gateway — Unit Tests"
(cd "$ROOT/services/api-gateway" && npm test -- --coverage --ci) || FAILED=1

# ─── 3. Python AI Service ─────────────────────────────────────────
echo "\n[3/9] Python AI Service — Unit Tests"
(cd "$ROOT/services/ai-service" && pytest --cov=app --cov-fail-under=80 --cov-report=term-missing -q) || FAILED=1

# ─── 4. React Web App ─────────────────────────────────────────────
echo "\n[4/9] React Web App — Unit Tests"
(cd "$ROOT/apps/web" && npx vitest run --coverage) || FAILED=1

# ─── 5. Flutter Mobile ────────────────────────────────────────────
echo "\n[5/9] Flutter Mobile — Unit Tests + Coverage"
(cd "$ROOT/apps/mobile-flutter" && flutter test --coverage && bash scripts/check_coverage.sh) || FAILED=1

# ─── 6. KMP Shared Module ─────────────────────────────────────────
echo "\n[6/9] KMP Shared Module — Unit Tests + JaCoCo"
(cd "$ROOT/apps/mobile-kmp" && ./gradlew :shared:test :shared:jacocoTestCoverageVerification) || FAILED=1

# ─── 7. Integration Tests ─────────────────────────────────────────
echo "\n[7/9] Integration Tests (requires Docker)"
(cd "$ROOT" && docker-compose -f docker-compose.test.yml up -d --wait \
  && cd services/core-service && npm run test:integration \
  && cd "$ROOT/services/ai-service" && pytest tests/integration/ -q \
  && cd "$ROOT" && docker-compose -f docker-compose.test.yml down) || FAILED=1

# ─── 8. E2E Tests (Playwright) ────────────────────────────────────
echo "\n[8/9] E2E Tests — Playwright"
(cd "$ROOT/apps/web" && npx playwright test) || FAILED=1

# ─── 9. Security Scan ─────────────────────────────────────────────
echo "\n[9/9] Security Scan"
(cd "$ROOT/services/core-service" && npm audit --audit-level=high) || FAILED=1
(cd "$ROOT/services/ai-service" && pip-audit --desc) || FAILED=1

# ─── Final Report ─────────────────────────────────────────────────
echo ""
if [ $FAILED -eq 0 ]; then
  echo "╔════════════════════════════════════════════╗"
  echo "║         ✅ ALL TESTS PASSED                ║"
  echo "╚════════════════════════════════════════════╝"
  exit 0
else
  echo "╔════════════════════════════════════════════╗"
  echo "║         ❌ SOME TESTS FAILED               ║"
  echo "║  Fix failures above before committing.     ║"
  echo "╚════════════════════════════════════════════╝"
  exit 1
fi
```

## Report Format
```
╔════════════════════════════════════════════╗
║            TEST RESULTS SUMMARY            ║
╠════════════════════════════════════════════╣
║ Service              │ Status │ Coverage   ║
║──────────────────────│────────│────────────║
║ NestJS Core          │ ✅ PASS│ 85%  ≥80% ║
║ NestJS Gateway       │ ✅ PASS│ 78%  ≥80% ║  ← warn
║ Python AI Service    │ ✅ PASS│ 82%  ≥80% ║
║ React Web            │ ✅ PASS│ 76%  ≥75% ║
║ Flutter Mobile       │ ❌ FAIL│ 71%  ≥75% ║  ← BLOCKS
║ KMP Shared           │ ✅ PASS│ 77%  ≥75% ║
║ Integration Tests    │ ✅ PASS│ —         ║
║ E2E (Playwright)     │ ✅ PASS│ —         ║
║ Security Scan        │ ⚠️ WARN│ 2 moderate║
╠════════════════════════════════════════════╣
║ OVERALL: ❌ FAILED — Flutter below 75%     ║
╚════════════════════════════════════════════╝
```

## Coverage Below Threshold → Phase 4→3 Feedback Loop
If any service is below threshold, the project-orchestrator triggers the Phase 4→3 Feedback Loop
(see project-orchestrator.md "Phase 4→3 Feedback Loop" section):
- NestJS / backend business logic below 80% → back to backend-developer
- Python / AI service below 80% → back to python-developer
- React / Next.js frontend below 75% → back to frontend-developer
- Flutter below 75% → back to flutter-developer
- KMP shared below 75% → back to kmp-developer
- API gateway / shared libs below 80% → back to senior-engineer
- Any service below threshold → DO NOT proceed to Phase 5 (Security)
- Max 2 round-trips before escalating to user
