---
description: "Create a named checkpoint/backup before risky operations. Uses git tags so you can /rollback to it later."
argument-hint: "<checkpoint-name>"
disable-model-invocation: true
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Create a safe checkpoint before risky agent operations.

## Steps
1. Ensure all changes are committed
2. Create git tag: `git tag checkpoint/[name]-[timestamp]`
3. Confirm: "Checkpoint created. Use `/rollback checkpoint/[name]` to restore."

## Auto-Backup
The orchestrator SHOULD create automatic checkpoints before:
- BIG feature implementation
- Database migrations
- Cross-service refactors
- Any operation touching > 10 files

## Usage
```
/backup before-auth-refactor
/backup pre-migration
/backup stable-v1
```

## Restore
```
/rollback checkpoint/before-auth-refactor
```
