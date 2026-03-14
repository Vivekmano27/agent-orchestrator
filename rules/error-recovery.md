# Error Recovery Protocol

When an agent fails mid-task:

## Automatic Recovery
1. Task executor retries once with different approach
2. If still fails → marks task as "failed" in progress tracker
3. Continues to next non-blocked task
4. Reports all failures at end of session

## Manual Recovery
1. Run `/retry-failed` → attempts all failed tasks with fresh context
2. Run `/rollback N` → undo last N commits if changes broke something
3. Run `/rollback last-checkpoint` → restore to last /backup point

## Prevention
- Orchestrator creates automatic checkpoint before BIG features
- Each task has verification command — failures caught immediately
- Test suite runs after each implementation phase

## Escalation
If an agent fails 3 times on the same task → stop and ask the user.
Include: task description, error message, files involved, what was tried.
