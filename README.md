# Solo Dev Orchestrator — All-in-One Plugin v2.1

## Everything Included

| Component | Count | Included? |
|-----------|-------|-----------|
| Agents | 35 | YES |
| Agent Teams | 5 | YES |
| Commands | 26 | YES |
| Skills | 65 | YES |
| Hooks | 1 (hooks.json) | YES |
| Rules | 3 | YES |
| Steering Docs | 3 | YES |
| CLAUDE.md | 1 | YES |
| Plugin Manifest | 2 | YES |
| Install Script | 1 | YES |
| README | 1 | YES |

**This is ONE package. Nothing else to install. No separate downloads.**

## Quick Install

### Option 1: Plugin Mode (recommended)
```bash
# Run Claude Code with plugin directory
claude --plugin-dir /path/to/solo-dev-orchestrator/plugins/agent-orchestrator

# Or for GitHub-hosted marketplace
claude plugin marketplace add your-github/solo-dev-orchestrator
claude plugin install solo-dev-orchestrator
```

### Option 2: Install Script
```bash
# Clone the repo
git clone your-github/solo-dev-orchestrator /tmp/plugin

# Run installer (installs to current project)
cd your-project
bash /tmp/plugin/install.sh .

# Or install globally
bash /tmp/plugin/install.sh ~
```

### Option 3: Manual Copy
```bash
PLUGIN=/path/to/solo-dev-orchestrator/plugins/agent-orchestrator
cp -r $PLUGIN/agents/* your-project/.claude/agents/
cp -r $PLUGIN/commands/* your-project/.claude/commands/
cp -r $PLUGIN/skills/* your-project/.claude/skills/
cp -r $PLUGIN/hooks/* your-project/.claude/hooks/
cp -r /path/to/solo-dev-orchestrator/steering/* your-project/.claude/steering/
cp -r /path/to/solo-dev-orchestrator/rules/* your-project/.claude/rules/
cp /path/to/solo-dev-orchestrator/CLAUDE.md your-project/
```

## Verify Installation
```bash
cd your-project && claude
> /check-agents      # All agents + teams loaded?
> /status            # Project dashboard
> /pending           # Any tasks waiting?
```

## First Run
```bash
> /build-feature "Add user authentication with JWT and refresh tokens"
```
The orchestrator will:
1. Classify this as MEDIUM (4-10 files, 2 services)
2. Have product-manager write a quick spec
3. Present the plan for your approval
4. After you say "go" -> backend-developer + frontend-developer + test-engineer build it
5. code-reviewer reviews everything
6. Atomic commits per task

## Tech Stack Support
- NestJS + PostgreSQL (backend)
- Python / Django (AI service)
- React / Next.js (web frontend)
- Flutter (mobile)
- Kotlin Multiplatform / KMP (mobile)
- AWS (ECS Fargate, RDS, S3, CloudFront)
- Docker + Kubernetes
- GitHub Actions (CI/CD)

## All 26 Commands

### Core Workflow
| Command | Description |
|---------|-------------|
| `/build-feature <desc>` | End-to-end feature (auto-classifies SMALL/MEDIUM/BIG) |
| `/new <desc>` | Start new project or feature — full agent pipeline |
| `/add-feature <desc>` | Add feature to in-progress pipeline (smart cascade) |
| `/start <desc>` | Alias for /new |
| `/quick-fix <error>` | Autonomous bug fix (no approval needed) |
| `/init-project <name>` | Full monorepo scaffold (the FIRST command for new projects) |
| `/setup-service <name> <type>` | Scaffold new NestJS or Python microservice |
| `/run-tests` | Complete test suite across ALL services |
| `/deploy <env>` | Deploy to staging or production |
| `/review-pr <branch>` | 3-way parallel review (code + security + performance) |

### Monitoring & Status
| Command | Description |
|---------|-------------|
| `/status` | Full project dashboard |
| `/pending` | Pending tasks by priority + blockers |
| `/check-agents` | Verify all agents loaded + healthy |
| `/check-teams` | Agent team activity + progress |
| `/health-check` | Service health (API, DB, Redis) |
| `/context-check` | Context window usage + tips |
| `/logs` | View agent activity log and progress |
| `/cost-track` | Track API token usage and costs per agent |

### Management
| Command | Description |
|---------|-------------|
| `/retry-failed` | Retry failed tasks with new approach |
| `/digest` | Generate session summary |
| `/sprint-plan <goal>` | Create sprint plan from backlog |
| `/generate-types` | Generate TS/Dart from API spec |
| `/migration <action> <svc>` | Database migration management |
| `/backup <name>` | Create named checkpoint for easy rollback |
| `/rollback <target>` | Undo last agent changes (by commit, count, or checkpoint) |
| `/switch-model <agent> <model>` | Switch agent model between Opus and Sonnet |

## Mixed Autonomy (Solo Dev Optimized)
| Size | Files | What Happens | You Do |
|------|-------|-------------|--------|
| SMALL | 1-3 | Fully autonomous | Nothing |
| MEDIUM | 4-10 | Agents plan -> you approve -> they build | Approve plan |
| BIG | 10+ | Full SDD gates at 4 checkpoints | Approve at gates |
