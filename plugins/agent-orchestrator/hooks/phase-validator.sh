#!/bin/bash
# ============================================================
# Phase Validator Hook — Advisory PreToolUse check
# Warns (but does not block) if an agent team is dispatched
# before its prerequisite phases are complete in progress.md.
# ============================================================

INPUT=$(cat)
SUBAGENT_TYPE=$(echo "$INPUT" | jq -r '.tool_input.subagent_type // empty' 2>/dev/null || echo '')

# Only check agent-orchestrator subagent types
if [[ "$SUBAGENT_TYPE" != agent-orchestrator:* ]]; then
  exit 0
fi

AGENT_NAME="${SUBAGENT_TYPE#agent-orchestrator:}"

# Map agent/team names to their expected phase
declare -A AGENT_PHASE_MAP
AGENT_PHASE_MAP[project-setup]="0.5"
AGENT_PHASE_MAP[product-manager]="1"
AGENT_PHASE_MAP[business-analyst]="1"
AGENT_PHASE_MAP[ux-researcher]="1"
AGENT_PHASE_MAP[design-team]="2"
AGENT_PHASE_MAP[task-decomposer]="2.1"
AGENT_PHASE_MAP[feature-team]="3"
AGENT_PHASE_MAP[quality-team]="4"
AGENT_PHASE_MAP[security-auditor]="5"
AGENT_PHASE_MAP[review-team]="6"
AGENT_PHASE_MAP[devops-engineer]="7"
AGENT_PHASE_MAP[deployment-engineer]="7"
AGENT_PHASE_MAP[technical-writer]="8"

EXPECTED_PHASE="${AGENT_PHASE_MAP[$AGENT_NAME]}"

# If agent not in our map, allow it
if [ -z "$EXPECTED_PHASE" ]; then
  exit 0
fi

# Map phases to their prerequisite phases
declare -A PREREQ_MAP
PREREQ_MAP["0.5"]="0"
PREREQ_MAP["1"]="0.5"
PREREQ_MAP["2"]="1"
PREREQ_MAP["2.1"]="2"
PREREQ_MAP["3"]="2.1"
PREREQ_MAP["4"]="3"
PREREQ_MAP["5"]="4"
PREREQ_MAP["6"]="5"
PREREQ_MAP["7"]="6"
PREREQ_MAP["8"]="7"

PREREQ_PHASE="${PREREQ_MAP[$EXPECTED_PHASE]}"

# If no prerequisite or it's Phase 0, allow
if [ -z "$PREREQ_PHASE" ]; then
  exit 0
fi

# Find progress.md — search common spec directories
PROGRESS_FILE=""
for spec_dir in .claude/specs/*/; do
  if [ -f "${spec_dir}progress.md" ]; then
    PROGRESS_FILE="${spec_dir}progress.md"
    break
  fi
done

# If no progress.md found, this might be a fresh run — allow
if [ -z "$PROGRESS_FILE" ]; then
  exit 0
fi

# Check if prerequisite phase is marked COMPLETE
if grep -q "| ${PREREQ_PHASE} .* COMPLETE" "$PROGRESS_FILE" 2>/dev/null || \
   grep -q "| ${PREREQ_PHASE} |.*| COMPLETE" "$PROGRESS_FILE" 2>/dev/null; then
  # Prerequisite is complete, allow
  exit 0
fi

# Check for feedback loop dispatches (Phase N→3) — these bypass normal ordering
PROMPT=$(echo "$INPUT" | jq -r '.tool_input.prompt // empty' 2>/dev/null || echo '')
if echo "$PROMPT" | grep -qE 'PHASE [0-9]+→[0-9]+ FEEDBACK|TARGETED FIX|SCOPED RE-'; then
  exit 0
fi

# Advisory warning — print but don't block (exit 0)
echo "⚠️  PHASE ORDER WARNING: Dispatching $AGENT_NAME (Phase $EXPECTED_PHASE) but prerequisite Phase $PREREQ_PHASE may not be complete. Check progress.md."
exit 0
