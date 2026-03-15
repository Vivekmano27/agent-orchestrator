#!/bin/bash
# ============================================================
# Solo Dev Orchestrator — Plugin Validator
# Checks that all agent files, skills, commands, and hooks are
# properly structured and cross-referenced.
# ============================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ERRORS=0
WARNINGS=0

echo "╔══════════════════════════════════════════════╗"
echo "║       PLUGIN VALIDATION                      ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# 1. Count agents
AGENT_COUNT=$(ls "$SCRIPT_DIR"/agents/*.md 2>/dev/null | wc -l | tr -d ' ')
echo -e "Agents: $AGENT_COUNT files"
if [ "$AGENT_COUNT" -lt 35 ]; then
  echo -e "  ${RED}ERROR: Expected 35+ agents, found $AGENT_COUNT${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "  ${GREEN}OK${NC}"
fi

# 2. Count commands
CMD_COUNT=$(ls "$SCRIPT_DIR"/commands/*.md 2>/dev/null | wc -l | tr -d ' ')
echo -e "Commands: $CMD_COUNT files"
if [ "$CMD_COUNT" -lt 26 ]; then
  echo -e "  ${RED}ERROR: Expected 26 commands, found $CMD_COUNT${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "  ${GREEN}OK${NC}"
fi

# 3. Count skills
SKILL_COUNT=$(ls -d "$SCRIPT_DIR"/skills/*/ 2>/dev/null | wc -l | tr -d ' ')
echo -e "Skills: $SKILL_COUNT directories"
if [ "$SKILL_COUNT" -lt 66 ]; then
  echo -e "  ${RED}ERROR: Expected 66 skills, found $SKILL_COUNT${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "  ${GREEN}OK${NC}"
fi

# 4. Check each skill has SKILL.md
echo -e "Skill content check:"
for skill_dir in "$SCRIPT_DIR"/skills/*/; do
  skill_name=$(basename "$skill_dir")
  skill_file="$skill_dir/SKILL.md"
  if [ ! -f "$skill_file" ]; then
    echo -e "  ${RED}ERROR: $skill_name/ missing SKILL.md${NC}"
    ERRORS=$((ERRORS + 1))
  else
    line_count=$(wc -l < "$skill_file" | tr -d ' ')
    if [ "$line_count" -lt 15 ]; then
      echo -e "  ${YELLOW}WARNING: $skill_name has only $line_count lines (stub?)${NC}"
      WARNINGS=$((WARNINGS + 1))
    fi
  fi
done
echo -e "  ${GREEN}Skill content check done${NC}"

# 5. Validate hooks.json
echo -e "Hooks config:"
if [ -f "$SCRIPT_DIR/hooks/hooks.json" ]; then
  if python3 -m json.tool "$SCRIPT_DIR/hooks/hooks.json" > /dev/null 2>&1; then
    echo -e "  ${GREEN}hooks.json is valid JSON${NC}"
  else
    echo -e "  ${RED}ERROR: hooks.json is invalid JSON${NC}"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo -e "  ${RED}ERROR: hooks/hooks.json not found${NC}"
  ERRORS=$((ERRORS + 1))
fi

# 6. Check agents have required frontmatter fields
echo -e "Agent frontmatter check:"
for agent_file in "$SCRIPT_DIR"/agents/*.md; do
  agent_name=$(basename "$agent_file" .md)
  # Check for name field
  if ! head -20 "$agent_file" | grep -q "^name:"; then
    echo -e "  ${RED}ERROR: $agent_name missing 'name:' in frontmatter${NC}"
    ERRORS=$((ERRORS + 1))
  fi
  # Check for description field
  if ! head -20 "$agent_file" | grep -q "^description:"; then
    echo -e "  ${RED}ERROR: $agent_name missing 'description:' in frontmatter${NC}"
    ERRORS=$((ERRORS + 1))
  fi
  # Check for tools field
  if ! head -20 "$agent_file" | grep -q "^tools:"; then
    echo -e "  ${YELLOW}WARNING: $agent_name missing 'tools:' in frontmatter${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
done
echo -e "  ${GREEN}Agent frontmatter check done${NC}"

# 7. Check skill references in agents resolve
echo -e "Skill reference check:"
for agent_file in "$SCRIPT_DIR"/agents/*.md; do
  agent_name=$(basename "$agent_file" .md)
  # Extract skills list from frontmatter
  in_skills=false
  while IFS= read -r line; do
    if [[ "$line" == "skills:" ]]; then
      in_skills=true
      continue
    fi
    if $in_skills; then
      if [[ "$line" =~ ^[[:space:]]*-[[:space:]]+(.*) ]]; then
        skill_ref=$(echo "${BASH_REMATCH[1]}" | tr -d ' ')
        if [ ! -d "$SCRIPT_DIR/skills/$skill_ref" ]; then
          echo -e "  ${RED}ERROR: $agent_name references skill '$skill_ref' which does not exist${NC}"
          ERRORS=$((ERRORS + 1))
        fi
      else
        in_skills=false
      fi
    fi
  done < "$agent_file"
done
echo -e "  ${GREEN}Skill reference check done${NC}"

# 8. Check phase-runner skill and phase files
echo -e "Phase runner check:"
PHASE_DIR="$SCRIPT_DIR/skills/phase-runner/phases"
if [ -f "$SCRIPT_DIR/skills/phase-runner/SKILL.md" ]; then
  echo -e "  ${GREEN}phase-runner/SKILL.md exists${NC}"
else
  echo -e "  ${RED}ERROR: skills/phase-runner/SKILL.md not found${NC}"
  ERRORS=$((ERRORS + 1))
fi

EXPECTED_PHASES=("phase-0.md" "phase-0-5.md" "phase-0-75.md" "phase-1.md" "phase-2.md" "phase-2-1.md" "phase-2-5.md" "phase-3.md" "phase-4.md" "phase-5.md" "phase-6.md" "phase-7.md" "phase-8.md")
PHASE_COUNT=0
for phase_file in "${EXPECTED_PHASES[@]}"; do
  if [ -f "$PHASE_DIR/$phase_file" ]; then
    PHASE_COUNT=$((PHASE_COUNT + 1))
  else
    echo -e "  ${RED}ERROR: Missing phase file: phases/$phase_file${NC}"
    ERRORS=$((ERRORS + 1))
  fi
done
echo -e "  Phase files: $PHASE_COUNT/13"
if [ "$PHASE_COUNT" -eq 13 ]; then
  echo -e "  ${GREEN}All phase files present${NC}"
fi

# Check orchestrator references phase-runner skill
if grep -q "phase-runner" "$SCRIPT_DIR/agents/project-orchestrator.md"; then
  echo -e "  ${GREEN}Orchestrator references phase-runner${NC}"
else
  echo -e "  ${RED}ERROR: Orchestrator does not reference phase-runner skill${NC}"
  ERRORS=$((ERRORS + 1))
fi
echo -e "  ${GREEN}Phase runner check done${NC}"

# 9. Check phase-validator hook exists
echo -e "Phase validator hook check:"
if [ -f "$SCRIPT_DIR/hooks/phase-validator.sh" ]; then
  echo -e "  ${GREEN}phase-validator.sh exists${NC}"
  if grep -q "Agent" "$SCRIPT_DIR/hooks/hooks.json" | grep -q "phase-validator" 2>/dev/null || grep -q "phase-validator" "$SCRIPT_DIR/hooks/hooks.json"; then
    echo -e "  ${GREEN}Registered in hooks.json${NC}"
  else
    echo -e "  ${YELLOW}WARNING: phase-validator.sh may not be registered in hooks.json${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "  ${YELLOW}WARNING: hooks/phase-validator.sh not found${NC}"
  WARNINGS=$((WARNINGS + 1))
fi
echo -e "  ${GREEN}Phase validator check done${NC}"

# 10. Check agents that write output have Write tool
echo -e "Write tool check for output-producing agents:"
for agent_name in business-analyst security-auditor code-reviewer performance-reviewer review-team; do
  agent_file="$SCRIPT_DIR/agents/$agent_name.md"
  if [ -f "$agent_file" ]; then
    if ! head -20 "$agent_file" | grep "^tools:" | grep -q "Write"; then
      echo -e "  ${RED}ERROR: $agent_name produces output but lacks Write tool${NC}"
      ERRORS=$((ERRORS + 1))
    fi
  fi
done
echo -e "  ${GREEN}Write tool check done${NC}"

# Summary
echo ""
echo "╔══════════════════════════════════════════════╗"
if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo -e "║  ${GREEN}RESULT: HEALTHY (0 errors, 0 warnings)${NC}       ║"
elif [ "$ERRORS" -eq 0 ]; then
  echo -e "║  ${YELLOW}RESULT: OK ($WARNINGS warnings)${NC}                    ║"
else
  echo -e "║  ${RED}RESULT: FAILED ($ERRORS errors, $WARNINGS warnings)${NC}       ║"
fi
echo "╚══════════════════════════════════════════════╝"

exit $ERRORS
