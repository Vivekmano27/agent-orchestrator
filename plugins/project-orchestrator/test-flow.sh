#!/bin/bash
# ============================================================
# Solo Dev Orchestrator — Flow Test
# Structural smoke test that verifies the pipeline flow is
# internally consistent WITHOUT running the actual pipeline.
# Run after any changes to phase files, orchestrator, or hooks.
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
echo "║       FLOW TEST — Pipeline Consistency       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# 1. Verify phase order in orchestrator matches phase-runner
echo "1. Phase order consistency..."
ORCH_PHASES=$(grep -o 'phase-[0-9]\+\(-[0-9]\+\)\?\.md' "$SCRIPT_DIR/agents/project-orchestrator.md" | sort -u | tr '\n' ' ')
RUNNER_PHASES=$(grep -o 'phase-[0-9]\+\(-[0-9]\+\)\?\.md' "$SCRIPT_DIR/skills/phase-runner/SKILL.md" | sort -u | tr '\n' ' ')
if [ "$ORCH_PHASES" = "$RUNNER_PHASES" ]; then
  echo -e "  ${GREEN}OK — orchestrator and phase-runner reference same phase files${NC}"
else
  echo -e "  ${RED}ERROR — phase file references differ${NC}"
  echo "    Orchestrator: $ORCH_PHASES"
  echo "    Phase-runner: $RUNNER_PHASES"
  ERRORS=$((ERRORS + 1))
fi

# 2. Check for stale phase references (old naming)
echo "2. Stale phase references..."
STALE_075=$(grep -rl "phase-0-75\|Phase 0\.75" "$SCRIPT_DIR/agents/" "$SCRIPT_DIR/commands/" "$SCRIPT_DIR/skills/phase-runner/" 2>/dev/null | grep -v "test-flow.sh" || true)
if [ -n "$STALE_075" ]; then
  echo -e "  ${RED}ERROR — stale 'Phase 0.75' references found:${NC}"
  echo "$STALE_075" | while read -r f; do echo "    $f"; done
  ERRORS=$((ERRORS + 1))
else
  echo -e "  ${GREEN}OK — no stale Phase 0.75 references${NC}"
fi

# Match "Phase 0.5" immediately followed (within ~30 chars) by "Project Setup" or "tech stack"
# This catches "Phase 0.5 (Project Setup)" but NOT "Phase 0.5, MEDIUM/BIG), then ... tech stack interview (Phase 1.5)"
STALE_SETUP=$(grep -rn "Phase 0\.5" "$SCRIPT_DIR/agents/" "$SCRIPT_DIR/commands/" 2>/dev/null | grep -v "test-flow.sh" | grep -i "Phase 0\.5.\{0,30\}\(project.setup\|tech.stack\)" || true)
if [ -n "$STALE_SETUP" ]; then
  echo -e "  ${YELLOW}WARNING — possible stale 'Phase 0.5 = tech stack' references:${NC}"
  echo "$STALE_SETUP" | while read -r f; do echo "    $f"; done
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "  ${GREEN}OK — no stale Phase 0.5 = tech stack references${NC}"
fi

# 3. Verify phase-validator hook has all phases
echo "3. Phase validator coverage..."
for phase in "0.5" "1" "1.5" "2" "2.1" "3" "4" "5" "6" "7" "8"; do
  if ! grep -q "\"$phase\"" "$SCRIPT_DIR/hooks/phase-validator.sh" 2>/dev/null; then
    echo -e "  ${RED}ERROR — phase $phase missing from phase-validator.sh${NC}"
    ERRORS=$((ERRORS + 1))
  fi
done
echo -e "  ${GREEN}OK — all phases covered in validator${NC}"

# 4. Verify agents referenced in team dispatches exist
echo "4. Agent existence check..."
for team_file in design-team.md feature-team.md planning-team.md quality-team.md review-team.md; do
  if [ -f "$SCRIPT_DIR/agents/$team_file" ]; then
    # Extract agent names from subagent_type dispatch patterns
    DISPATCHED=$(grep -o 'project-orchestrator:[a-z-]*' "$SCRIPT_DIR/agents/$team_file" 2>/dev/null | sed 's/project-orchestrator://' | sort -u)
    for agent in $DISPATCHED; do
      if [ ! -f "$SCRIPT_DIR/agents/$agent.md" ]; then
        echo -e "  ${RED}ERROR — $team_file dispatches '$agent' but agents/$agent.md doesn't exist${NC}"
        ERRORS=$((ERRORS + 1))
      fi
    done
  fi
done
echo -e "  ${GREEN}OK — all dispatched agents exist${NC}"

# 5. Verify no agent references deleted commands
echo "5. Deleted command references..."
DELETED_CMDS="start switch-model sprint-plan resume"
for cmd in $DELETED_CMDS; do
  # Match "/cmd" as a command (preceded by space, quote, or start-of-line) or "commands/cmd.md" as a file ref
  # Exclude "checkpoint/resume" and similar compound words
  refs=$(grep -rn "[[:space:]\"/]/$cmd\b\|commands/$cmd\.md" "$SCRIPT_DIR/agents/" "$SCRIPT_DIR/commands/" 2>/dev/null | grep -v "test-flow.sh\|continue-pipeline\|checkpoint" | cut -d: -f1 | sort -u || true)
  if [ -n "$refs" ]; then
    echo -e "  ${YELLOW}WARNING — deleted command '/$cmd' still referenced in:${NC}"
    echo "$refs" | while read -r f; do echo "    $f"; done
    WARNINGS=$((WARNINGS + 1))
  fi
done
echo -e "  ${GREEN}OK — no deleted command references found${NC}"

# 6. Verify all agents have checklists
echo "6. Agent checklists..."
MISSING_CHECKLISTS=0
for agent_file in "$SCRIPT_DIR"/agents/*.md; do
  if ! grep -q "## Checklist" "$agent_file"; then
    echo -e "  ${RED}ERROR — $(basename "$agent_file" .md) missing ## Checklist${NC}"
    MISSING_CHECKLISTS=$((MISSING_CHECKLISTS + 1))
    ERRORS=$((ERRORS + 1))
  fi
done
if [ "$MISSING_CHECKLISTS" -eq 0 ]; then
  TOTAL_AGENTS=$(ls "$SCRIPT_DIR"/agents/*.md | wc -l | tr -d ' ')
  echo -e "  ${GREEN}OK — all $TOTAL_AGENTS agents have checklists${NC}"
fi

# 7. Verify skill references resolve
echo "7. Skill reference integrity..."
BROKEN_REFS=0
for agent_file in "$SCRIPT_DIR"/agents/*.md; do
  agent_name=$(basename "$agent_file" .md)
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
          echo -e "  ${RED}ERROR — $agent_name references skill '$skill_ref' which doesn't exist${NC}"
          BROKEN_REFS=$((BROKEN_REFS + 1))
          ERRORS=$((ERRORS + 1))
        fi
      else
        in_skills=false
      fi
    fi
  done < "$agent_file"
done
if [ "$BROKEN_REFS" -eq 0 ]; then
  echo -e "  ${GREEN}OK — all skill references resolve${NC}"
fi

# 8. Verify AskUserQuestion rules for background agents
echo "8. Background agent AskUserQuestion rules..."
BG_AGENTS="static-analyzer performance-reviewer code-reviewer agent-native-reviewer"
for agent in $BG_AGENTS; do
  if [ -f "$SCRIPT_DIR/agents/$agent.md" ]; then
    if grep -q "No AskUserQuestion\|background.*silently\|runs in background" "$SCRIPT_DIR/agents/$agent.md" 2>/dev/null; then
      true  # Good — has background warning
    else
      echo -e "  ${YELLOW}WARNING — $agent runs in background but doesn't warn about AskUserQuestion${NC}"
      WARNINGS=$((WARNINGS + 1))
    fi
  fi
done
echo -e "  ${GREEN}OK — background agents checked${NC}"

# 9. Verify phase preconditions chain correctly
echo "9. Phase precondition chain..."
# Phase 1 should NOT require project-config.md (tech stack comes after)
if grep -q "project-config.md" "$SCRIPT_DIR/skills/phase-runner/phases/phase-1.md" 2>/dev/null; then
  echo -e "  ${RED}ERROR — Phase 1 still requires project-config.md (should be removed — tech stack is Phase 1.5)${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "  ${GREEN}OK — Phase 1 does not require project-config.md${NC}"
fi
# Phase 2 should require project-config.md (from Phase 1.5)
if grep -q "project-config.md" "$SCRIPT_DIR/skills/phase-runner/phases/phase-2.md" 2>/dev/null; then
  echo -e "  ${GREEN}OK — Phase 2 requires project-config.md (from Phase 1.5)${NC}"
else
  echo -e "  ${YELLOW}WARNING — Phase 2 may not check for project-config.md${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "╔══════════════════════════════════════════════╗"
if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo -e "║  ${GREEN}FLOW TEST: PASSED (0 errors, 0 warnings)${NC}    ║"
elif [ "$ERRORS" -eq 0 ]; then
  echo -e "║  ${YELLOW}FLOW TEST: OK ($WARNINGS warnings)${NC}                  ║"
else
  echo -e "║  ${RED}FLOW TEST: FAILED ($ERRORS errors, $WARNINGS warnings)${NC}     ║"
fi
echo "╚══════════════════════════════════════════════╝"

exit $ERRORS
