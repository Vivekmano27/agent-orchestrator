# Solo Dev Orchestrator — All-in-One Plugin v2.0

## Everything Included (119 files)

| Component | Count | Included? |
|-----------|-------|-----------|
| Agents | 21 | ✅ YES |
| Agent Teams | 3 | ✅ YES |
| Commands | 17 | ✅ YES |
| Skills | 62 | ✅ YES |
| Hooks | 2 | ✅ YES |
| Steering Docs | 3 | ✅ YES |
| CLAUDE.md | 1 | ✅ YES |
| Plugin Manifest | 2 | ✅ YES |
| Install Script | 1 | ✅ YES |
| README | 1 | ✅ YES |

**This is ONE package. Nothing else to install. No separate downloads.**

## Quick Install

### Option 1: Install Script (recommended)
```bash
# Extract the zip
unzip solo-dev-orchestrator-v2.zip -d /tmp/plugin

# Run installer (installs to current project)
cd your-project
bash /tmp/plugin/install.sh .

# Or install globally
bash /tmp/plugin/install.sh ~
```

### Option 2: Plugin Mode
```bash
# Run Claude Code with plugin directory
claude --plugin-dir /path/to/solo-dev-orchestrator

# Or for GitHub-hosted marketplace
claude plugin marketplace add your-github/solo-dev-orchestrator
claude plugin install solo-dev-orchestrator
```

### Option 3: Manual Copy
```bash
unzip solo-dev-orchestrator-v2.zip -d /tmp/plugin
cp -r /tmp/plugin/agents/* your-project/.claude/agents/
cp -r /tmp/plugin/commands/* your-project/.claude/commands/
cp -r /tmp/plugin/skills/* your-project/.claude/skills/
cp -r /tmp/plugin/hooks/* your-project/.claude/hooks/
cp -r /tmp/plugin/steering/* your-project/.claude/steering/
cp /tmp/plugin/CLAUDE.md your-project/
```

## Verify Installation
```bash
cd your-project && claude
> /check-agents      # All 21 agents + 3 teams loaded?
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
4. After you say "go" → backend-developer + frontend-developer + test-engineer build it
5. code-reviewer reviews everything
6. Atomic commits per task

## Tech Stack Support
- ✅ NestJS + PostgreSQL (backend)
- ✅ Python / Django (AI service)
- ✅ React / Next.js (web frontend)
- ✅ Flutter (mobile)
- ✅ Kotlin Multiplatform / KMP (mobile)
- ✅ AWS (ECS Fargate, RDS, S3, CloudFront)
- ✅ Docker + Kubernetes
- ✅ GitHub Actions (CI/CD)

## All 17 Commands

### Core Workflow
| Command | Description |
|---------|-------------|
| `/build-feature <desc>` | End-to-end feature (auto-classifies SMALL/MEDIUM/BIG) |
| `/quick-fix <error>` | Autonomous bug fix (no approval needed) |
| `/run-tests` | Complete test suite across ALL services |
| `/deploy <env>` | Deploy to staging or production |
| `/review-pr <branch>` | 3-way parallel review (code + security + performance) |
| `/setup-service <name> <type>` | Scaffold new NestJS or Python microservice |

### Monitoring & Status
| Command | Description |
|---------|-------------|
| `/status` | Full project dashboard |
| `/pending` | Pending tasks by priority + blockers |
| `/check-agents` | Verify all agents loaded + healthy |
| `/check-teams` | Agent team activity + progress |
| `/health-check` | Service health (API, DB, Redis) |
| `/context-check` | Context window usage + tips |

### Management
| Command | Description |
|---------|-------------|
| `/retry-failed` | Retry failed tasks with new approach |
| `/digest` | Generate session summary |
| `/sprint-plan <goal>` | Create sprint plan from backlog |
| `/generate-types` | Generate TS/Dart from API spec |
| `/migration <action> <svc>` | Database migration management |

## Mixed Autonomy (Solo Dev Optimized)
| Size | Files | What Happens | You Do |
|------|-------|-------------|--------|
| SMALL | 1-3 | Fully autonomous | Nothing |
| MEDIUM | 4-10 | Agents plan → you approve → they build | Approve plan |
| BIG | 10+ | Full SDD gates at 4 checkpoints | Approve at gates |
