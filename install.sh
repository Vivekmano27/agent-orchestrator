#!/bin/bash
# ============================================================
# Solo Dev Orchestrator — Installer
# Installs all 21 agents, 3 teams, 17 commands, 62 skills,
# 2 hooks, steering docs, and CLAUDE.md into your project.
# ============================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

DEST="${1:-.}"

echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Solo Dev Orchestrator — Full Installer       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Detect script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Create directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p "$DEST/.claude/agents"
mkdir -p "$DEST/.claude/commands"
mkdir -p "$DEST/.claude/hooks"
mkdir -p "$DEST/.claude/steering"
mkdir -p "$DEST/.claude/skills"
mkdir -p "$DEST/.claude/specs"
mkdir -p "$DEST/.claude/rules"

# Copy agents (21 agents + 3 teams)
echo -e "${YELLOW}Installing 24 agent files (21 agents + 3 teams)...${NC}"
cp "$SCRIPT_DIR"/agents/*.md "$DEST/.claude/agents/"
AGENT_COUNT=$(ls "$DEST/.claude/agents/"*.md | wc -l)
echo -e "  ${GREEN}✅ $AGENT_COUNT agent files installed${NC}"

# Copy commands (17)
echo -e "${YELLOW}Installing 17 commands...${NC}"
cp "$SCRIPT_DIR"/commands/*.md "$DEST/.claude/commands/"
CMD_COUNT=$(ls "$DEST/.claude/commands/"*.md | wc -l)
echo -e "  ${GREEN}✅ $CMD_COUNT commands installed${NC}"

# Copy skills (62)
echo -e "${YELLOW}Installing 62 skills...${NC}"
cp -r "$SCRIPT_DIR"/skills/* "$DEST/.claude/skills/"
SKILL_COUNT=$(ls -d "$DEST/.claude/skills/"*/ | wc -l)
echo -e "  ${GREEN}✅ $SKILL_COUNT skills installed${NC}"

# Copy hooks (2)
echo -e "${YELLOW}Installing 2 hooks...${NC}"
cp "$SCRIPT_DIR"/hooks/*.sh "$DEST/.claude/hooks/"
chmod +x "$DEST/.claude/hooks/"*.sh
HOOK_COUNT=$(ls "$DEST/.claude/hooks/"*.sh | wc -l)
echo -e "  ${GREEN}✅ $HOOK_COUNT hooks installed${NC}"

# Copy steering docs (3)
echo -e "${YELLOW}Installing 3 steering documents...${NC}"
cp "$SCRIPT_DIR"/steering/*.md "$DEST/.claude/steering/"
echo -e "  ${GREEN}✅ Steering docs installed${NC}"

# Copy CLAUDE.md (only if not exists — don't overwrite user's)
if [ ! -f "$DEST/CLAUDE.md" ]; then
  echo -e "${YELLOW}Installing CLAUDE.md template...${NC}"
  cp "$SCRIPT_DIR/CLAUDE.md" "$DEST/"
  echo -e "  ${GREEN}✅ CLAUDE.md installed${NC}"
else
  echo -e "  ${YELLOW}⚠️  CLAUDE.md already exists — skipped (won't overwrite yours)${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          INSTALLATION COMPLETE ✅                ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Agents:   $AGENT_COUNT (21 agents + 3 teams)           ║${NC}"
echo -e "${GREEN}║  Commands: $CMD_COUNT                                   ║${NC}"
echo -e "${GREEN}║  Skills:   $SKILL_COUNT                                   ║${NC}"
echo -e "${GREEN}║  Hooks:    $HOOK_COUNT                                    ║${NC}"
echo -e "${GREEN}║  Steering: 3 docs                                ║${NC}"
echo -e "${GREEN}║  CLAUDE.md: ✅                                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. cd $DEST"
echo "  2. Edit .claude/steering/product.md with your product vision"
echo "  3. Edit .claude/steering/tech.md if your stack differs"
echo "  4. Run: claude"
echo "  5. Try: /check-agents  (verify everything loaded)"
echo "  6. Try: /status        (project dashboard)"
echo "  7. Try: /build-feature \"Add user authentication with JWT\""
