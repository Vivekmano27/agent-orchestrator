---
description: "Run the complete test suite across ALL services — unit, integration, E2E, security, accessibility. Reports pass/fail per service with coverage. Fails if any service is below coverage threshold."
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.

## Mission
Execute every test in the project, enforce coverage thresholds, and report results. The entire run fails if ANY service is below its coverage minimum.

## Coverage Thresholds
Read from `.claude/specs/[feature]/project-config.md` under "Coverage Thresholds" section.
Defaults (if project-config.md not found):

| Service Type | Default Threshold |
|---|---|
| Backend (NestJS, Django, Go) | 80% |
| Frontend (React, Vue, Next.js) | 75% |
| Mobile (Flutter, KMP) | 75% |
| AI/ML (Python AI services) | 80% |
| Shared/Libraries | 80% |

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
# Step 1: Start test DB (isolated from dev DB on port 5433)
(cd "$ROOT" && docker-compose -f docker-compose.test.yml up -d --wait) || { echo "❌ Test DB failed to start (ENVIRONMENT_ISSUE)"; FAILED=1; }

# Step 2: Run migrations on test DB
if [ $FAILED -eq 0 ]; then
  echo "  Running migrations on test DB..."
  (cd "$ROOT/services/core-service" && DATABASE_URL=postgresql://test:test@localhost:5433/test_db npx prisma migrate deploy 2>/dev/null \
    || DATABASE_URL=postgresql://test:test@localhost:5433/test_db npx prisma db push --accept-data-loss 2>/dev/null \
    || echo "  (No Prisma migrations — using ORM auto-sync or manual setup)")
  (cd "$ROOT/services/ai-service" && DATABASE_URL=postgresql://test:test@localhost:5433/test_db python manage.py migrate --no-input 2>/dev/null \
    || echo "  (No Django migrations — using pytest fixtures)")
fi

# Step 3: Run integration tests
if [ $FAILED -eq 0 ]; then
  (cd "$ROOT/services/core-service" && DATABASE_URL=postgresql://test:test@localhost:5433/test_db npm run test:integration \
    && cd "$ROOT/services/ai-service" && DATABASE_URL=postgresql://test:test@localhost:5433/test_db pytest tests/integration/ -q) || FAILED=1
fi

# Step 4: Tear down test DB
(cd "$ROOT" && docker-compose -f docker-compose.test.yml down) 2>/dev/null

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
