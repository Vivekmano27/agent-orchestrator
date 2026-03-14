# Publishing to GitHub — Step by Step

## Step 1: Create GitHub Repo

```bash
cd /path/to/solo-dev-orchestrator
git init
git add .
git commit -m "Initial commit: solo-dev-orchestrator plugin v2.1"

# Create repo on GitHub (using GitHub CLI)
gh repo create solo-dev-orchestrator --public --source=. --push

# Or manually: create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/solo-dev-orchestrator.git
git push -u origin main
```

## Step 2: Update marketplace.json with YOUR repo URL

Edit `.claude-plugin/marketplace.json` and update the `owner` fields:
```json
{
  "owner": {
    "name": "YOUR_GITHUB_USERNAME",
    "email": "your@email.com"
  }
}
```

Commit and push:
```bash
git add .claude-plugin/marketplace.json
git commit -m "fix: update marketplace owner"
git push
```

## Step 3: Install from GitHub

```bash
# Add the marketplace
claude plugin marketplace add YOUR_USERNAME/solo-dev-orchestrator

# Install the plugin
claude plugin install solo-dev-orchestrator
```

## If Marketplace Fails — Use These Alternatives

### Alternative A: Plugin Directory (MOST RELIABLE)
```bash
# Clone repo
git clone https://github.com/YOUR_USERNAME/solo-dev-orchestrator.git ~/solo-dev-plugin

# Run Claude with plugin loaded
claude --plugin-dir ~/solo-dev-plugin
```

### Alternative B: Install Script (copies into project)
```bash
git clone https://github.com/YOUR_USERNAME/solo-dev-orchestrator.git /tmp/plugin
cd /path/to/your-project
bash /tmp/plugin/install.sh .
claude
```

### Alternative C: Direct plugin install from local path
```bash
git clone https://github.com/YOUR_USERNAME/solo-dev-orchestrator.git ~/solo-dev-plugin
claude plugin add ~/solo-dev-plugin
```

## Verify Installation
```bash
claude
> /check-agents    # Should show 21 agents + 3 teams
> /status          # Project dashboard
```

## Troubleshooting

### "Failed to parse marketplace file"
- Ensure `.claude-plugin/marketplace.json` is at repo ROOT
- Validate JSON: `python3 -c "import json; json.load(open('.claude-plugin/marketplace.json'))"`
- Check owner field has both `name` and `email`

### "Marketplace file not found"
- The file MUST be at: `<repo-root>/.claude-plugin/marketplace.json`
- NOT inside any subfolder
- Check: `ls -la .claude-plugin/`

### "Plugin install fails"
- Try `claude --plugin-dir ./` from inside the repo (tests locally first)
- If that works, the plugin is fine — it's a marketplace config issue
- Use Alternative A or B instead
