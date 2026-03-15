#!/bin/bash
# ============================================================
# Solo Dev Orchestrator — Installer
# Installs all 24 agents (21 + 3 teams), 25 commands, 63 skills,
# 1 hooks config, 3 rules, and CLAUDE.md into
# your project.
# ============================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DEST="${1:-.}"

echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Solo Dev Orchestrator — Full Installer       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Detect script directory (repo root)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$SCRIPT_DIR/plugins/agent-orchestrator"

# Verify plugin directory exists
if [ ! -d "$PLUGIN_DIR/agents" ]; then
  echo -e "${RED}Error: Plugin directory not found at $PLUGIN_DIR${NC}"
  echo "Make sure you're running this from the repo root."
  exit 1
fi

# Create directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p "$DEST/.claude/agents"
mkdir -p "$DEST/.claude/commands"
mkdir -p "$DEST/.claude/hooks"
mkdir -p "$DEST/.claude/skills"
mkdir -p "$DEST/.claude/specs"
mkdir -p "$DEST/.claude/rules"

# Copy agents (21 agents + 3 teams)
echo -e "${YELLOW}Installing agents (21 + 3 teams)...${NC}"
cp "$PLUGIN_DIR"/agents/*.md "$DEST/.claude/agents/"
AGENT_COUNT=$(ls "$DEST/.claude/agents/"*.md 2>/dev/null | wc -l | tr -d ' ')
echo -e "  ${GREEN}$AGENT_COUNT agent files installed${NC}"

# Copy commands (25)
echo -e "${YELLOW}Installing 25 commands...${NC}"
cp "$PLUGIN_DIR"/commands/*.md "$DEST/.claude/commands/"
CMD_COUNT=$(ls "$DEST/.claude/commands/"*.md 2>/dev/null | wc -l | tr -d ' ')
echo -e "  ${GREEN}$CMD_COUNT commands installed${NC}"

# Copy skills (63)
echo -e "${YELLOW}Installing 63 skills...${NC}"
cp -r "$PLUGIN_DIR"/skills/* "$DEST/.claude/skills/"
SKILL_COUNT=$(ls -d "$DEST/.claude/skills/"*/ 2>/dev/null | wc -l | tr -d ' ')
echo -e "  ${GREEN}$SKILL_COUNT skills installed${NC}"

# Copy hooks (JSON config)
echo -e "${YELLOW}Installing hooks config...${NC}"
cp "$PLUGIN_DIR"/hooks/hooks.json "$DEST/.claude/hooks/"
echo -e "  ${GREEN}hooks.json installed${NC}"

# Copy rules (3)
echo -e "${YELLOW}Installing 3 rules...${NC}"
cp "$SCRIPT_DIR"/rules/*.md "$DEST/.claude/rules/"
RULE_COUNT=$(ls "$DEST/.claude/rules/"*.md 2>/dev/null | wc -l | tr -d ' ')
echo -e "  ${GREEN}$RULE_COUNT rules installed${NC}"

# Copy settings.json
if [ -f "$PLUGIN_DIR/settings.json" ]; then
  cp "$PLUGIN_DIR/settings.json" "$DEST/.claude/"
  echo -e "  ${GREEN}settings.json installed${NC}"
fi

# Copy CLAUDE.md (only if not exists — don't overwrite user's)
if [ ! -f "$DEST/CLAUDE.md" ]; then
  echo -e "${YELLOW}Installing CLAUDE.md template...${NC}"
  cp "$SCRIPT_DIR/CLAUDE.md" "$DEST/"
  echo -e "  ${GREEN}CLAUDE.md installed${NC}"
else
  echo -e "  ${YELLOW}CLAUDE.md already exists — skipped (won't overwrite yours)${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          INSTALLATION COMPLETE                   ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════╣${NC}"
printf "${GREEN}║  Agents:   %-3s (incl. project-setup + 3 teams)  ║${NC}\n" "$AGENT_COUNT"
printf "${GREEN}║  Commands: %-3s                                  ║${NC}\n" "$CMD_COUNT"
printf "${GREEN}║  Skills:   %-3s                                  ║${NC}\n" "$SKILL_COUNT"
printf "${GREEN}║  Hooks:    1 (hooks.json)                        ║${NC}\n"
printf "${GREEN}║  Rules:    %-3s                                  ║${NC}\n" "$RULE_COUNT"
printf "${GREEN}║  CLAUDE.md: installed                             ║${NC}\n"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. cd $DEST"
echo "  2. Run: claude"
echo "  3. Try: /check-agents  (verify everything loaded)"
echo "  4. Try: /status        (project dashboard)"
echo "  5. Try: /build-feature \"Add user authentication with JWT\""
echo ""
echo "Note: No steering files needed! The project-setup agent will"
echo "interview you about tech stack, CI/CD, testing, and infrastructure"
echo "at the start of every new project."
