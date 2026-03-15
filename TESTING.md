# Testing the Solo Dev Orchestrator

## Automated Validation

Run the plugin validator to check structure and cross-references:

```bash
bash plugins/agent-orchestrator/validate-plugin.sh
```

This checks:
- Agent/command/skill file counts match expected values
- Every skill directory has a SKILL.md with >15 lines
- hooks.json is valid JSON
- All agent frontmatter has required fields (name, description, tools)
- All skill references in agents resolve to existing directories
- Output-producing agents have the Write tool

## Manual Smoke Test

### 1. Install Test
```bash
# Create fresh temp directory
mkdir /tmp/test-project && cd /tmp/test-project

# Run installer
bash /path/to/agent-orchestrator/install.sh .

# Verify file counts
ls .claude/agents/*.md | wc -l      # Should be 35
ls .claude/commands/*.md | wc -l    # Should be 26
ls -d .claude/skills/*/ | wc -l    # Should be 66
ls .claude/hooks/hooks.json         # Should exist
ls .claude/rules/*.md | wc -l      # Should be 3
```

### 2. Plugin Mode Test
```bash
# Start Claude with the plugin
claude --plugin-dir /path/to/agent-orchestrator/plugins/agent-orchestrator

# Run these commands:
> /check-agents      # All 30 agents + 5 teams should show green
> /status            # Dashboard should render
> /pending           # Should show no pending tasks
```

### 3. Pipeline Test (SMALL task)
```bash
> /build-feature "Add a hello world endpoint"
```

Verify:
- Orchestrator asks 3 setup questions (tech stack, features, local run)
- Orchestrator classifies as SMALL (1-3 files)
- All 9 phases run autonomously (no approval gates for SMALL)
- Phase 3 dispatches feature-team (check agent activity)
- Phase 6 dispatches review-team
- Spec files written to .claude/specs/
- Code committed to feature branch

### 4. Pipeline Test (BIG task — gate verification)
```bash
> /build-feature "Full user authentication with JWT, refresh tokens, OAuth, RBAC, and admin panel"
```

Verify:
- Classified as BIG (10+ files)
- Gate 1 fires after Phase 1 with spec summary
- Gate 2 fires after Phase 2 with design summary
- "Request changes" option works (re-runs affected agent)
- "Cancel" option cleans up specs and branch

### 5. Cleanup
```bash
rm -rf /tmp/test-project
```
