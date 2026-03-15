# Phase 7: DevOps & Deployment

**Executor:** devops-engineer + deployment-engineer (parallel)

## Preconditions
- `.claude/specs/[feature]/review-report.md` exists (Phase 6)
- Review verdict is APPROVE or APPROVE WITH CONDITIONS

## Dispatch Instructions

**First: Check if Phase 7 should be skipped.**
Read project-config.md "Infrastructure > Cloud Provider".
If Cloud Provider is "none", "local-only", or "not decided" → **SKIP Phase 7 entirely**.
Log: "Skipping Phase 7: no cloud deployment configured in project-config.md."

**If cloud deployment is configured, dispatch both agents IN PARALLEL:**
```
Agent(
  subagent_type="agent-orchestrator:devops-engineer",
  run_in_background=True,
  prompt="Set up CI/CD pipeline, Docker configuration, Terraform infrastructure, K8s manifests, and monitoring for [feature]."
)

Agent(
  subagent_type="agent-orchestrator:deployment-engineer",
  run_in_background=True,
  prompt="Create blue-green deployment plan with rollback procedure and smoke tests for [feature]."
)
```

Wait for both to complete.

## Expected Outputs
- `deploy-monitoring.md` (devops-engineer)
- `deployment-plan.md` (deployment-engineer)

## Content Validation
- Both files exist and are not empty
- If either missing → retry the specific failed agent once
- If still missing after retry → escalate to user

## Conditional Logic
- **SKIP entire phase** if Cloud Provider is "none", "local-only", or "not decided" in project-config.md
