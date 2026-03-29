# Phase 9: Post-Deploy Verification

**Executor:** project-orchestrator (YOU — no subagent needed, uses Bash for checks)

## Preconditions
- Phase 8 complete (Documentation)
- For cloud deployments: `.claude/specs/[feature]/deployment-plan.md` exists (Phase 7)
- For cloud deployments: `.claude/specs/[feature]/deploy-monitoring.md` exists (Phase 7)

## Dispatch Instructions

**First: Check if Phase 9 should run full or lightweight.**
Read project-config.md "Infrastructure > Cloud Provider".

### Path A — Cloud deployment configured (full verification)

Run these checks sequentially:

**9a — Smoke tests:**
```bash
# Run smoke tests if they exist
if [ -f "scripts/smoke-test.sh" ]; then
  bash scripts/smoke-test.sh
elif [ -f "package.json" ] && grep -q '"smoke"' package.json; then
  npm run smoke
else
  echo "No smoke tests found — recommend creating scripts/smoke-test.sh"
fi
```

**9b — Monitoring verification:**
Read `deploy-monitoring.md` and verify:
- Health check endpoints respond (if URLs are specified)
- Logging configuration files exist
- Alert configuration files exist (if monitoring tools are configured)

**9c — Create runbook entry:**
Write `.claude/specs/[feature]/runbook.md`:
```markdown
# Runbook — [Feature Name]

## What This Feature Does
[1-2 sentence summary from requirements.md]

## Health Check
- Endpoint: [from deploy-monitoring.md or api-contracts.md]
- Expected: HTTP 200
- Alert threshold: [from deploy-monitoring.md]

## Common Failure Modes
[Derived from security-audit.md findings and test edge cases]

## Rollback Procedure
[From deployment-plan.md]

## Key Files
[Top 5 files from the implementation, with paths]

## Contacts
- Built by: [git author]
- Date: [timestamp]
```

### Path B — Local-only / no cloud (lightweight verification)

Skip smoke tests and monitoring checks. Only create the runbook:

**9b-local — Verify the build runs:**
```bash
# Verify the project builds/starts successfully
# Read project-config.md for the correct build command
```

**9c-local — Create runbook entry:**
Same as 9c above, but without deployment-specific sections.

### Path C — SMALL tasks

Skip runbook creation. Only verify tests pass:
```bash
# Re-run test suite to confirm nothing broke
# Use the test command from project-config.md
```

## Expected Outputs
- `.claude/specs/[feature]/runbook.md` (MEDIUM/BIG only)
- Smoke test results logged (cloud deployments only)
- Build verification passed (all sizes)

## Content Validation
- For MEDIUM/BIG: `runbook.md` exists and contains at least "Health Check" and "Rollback Procedure" sections
- For SMALL: tests pass (exit code 0)
- For cloud: smoke test output does not contain "FAIL" or non-zero exit

## Conditional Logic
- **SMALL tasks**: Only verify tests pass, skip runbook
- **No cloud deployment**: Skip smoke tests and monitoring checks, still create runbook
- **Cloud deployment configured**: Full verification including smoke tests
