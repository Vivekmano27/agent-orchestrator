---
description: "Show project status dashboard — pending tasks, agent activity, test results, deployment status, and overall health. The main monitoring command."
---

## Interaction Rule
When confirmation, clarification, or approval is needed, **always use the `AskUserQuestion` tool** — never write questions as plain text.


## Mission
Display a comprehensive project status dashboard.

## Gather Status

1. **Read pending tasks** from:
   - feature_list.json (feature statuses)
   - .claude/specs/*/tasks.md (task statuses)
   - claude-progress.txt (session progress)

2. **Check test status**:
   - Read latest test results from CI or local run
   - Check coverage reports

3. **Check deployment status**:
   - Read deployment logs
   - Check service health endpoints

4. **Check git status**:
   - Current branch
   - Uncommitted changes
   - Commits ahead/behind main

## Output Format
```
╔══════════════════════════════════════════════════╗
║              PROJECT STATUS DASHBOARD            ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  📋 TASKS                                        ║
║  ├── Total features: 24                          ║
║  ├── Completed: 18 (75%)                         ║
║  ├── In Progress: 3                              ║
║  ├── Pending: 2                                  ║
║  └── Failed: 1 ⚠️                                ║
║                                                  ║
║  🧪 TESTS                                        ║
║  ├── Last run: 2026-03-14 10:30                  ║
║  ├── Passed: 142/145                             ║
║  ├── Failed: 3 ❌                                 ║
║  └── Coverage: 82%                               ║
║                                                  ║
║  🔒 SECURITY                                     ║
║  ├── Last audit: 2026-03-13                      ║
║  ├── Critical: 0                                 ║
║  └── High: 1 ⚠️ (dependency update needed)       ║
║                                                  ║
║  🚀 DEPLOYMENT                                   ║
║  ├── Staging: v1.4.2 (deployed 2h ago) ✅        ║
║  ├── Production: v1.4.1 (deployed 3d ago) ✅     ║
║  └── Pending migrations: 1                       ║
║                                                  ║
║  🌿 GIT                                          ║
║  ├── Branch: feature/ai-content-gen              ║
║  ├── Uncommitted: 0 files                        ║
║  ├── Ahead of main: 7 commits                    ║
║  └── Last commit: "feat(ai): add content gen"    ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

## How to Gather Each Section

### Tasks
```bash
# Check feature_list.json
cat feature_list.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
features = data.get('features', [])
total = len(features)
by_status = {}
for f in features:
    s = f.get('status', 'pending')
    by_status[s] = by_status.get(s, 0) + 1
print(f'Total: {total}')
for s, c in by_status.items():
    print(f'  {s}: {c}')
"
```

### Git
```bash
echo "Branch: $(git branch --show-current)"
echo "Uncommitted: $(git status --porcelain | wc -l) files"
echo "Ahead of main: $(git rev-list main..HEAD --count) commits"
echo "Last commit: $(git log -1 --format='%s')"
```
