---
title: "feat: Smart-Skip Pipeline Optimization"
type: feat
status: active
date: 2026-03-15
origin: docs/brainstorms/2026-03-15-plugin-overengineering-audit-brainstorm.md
deepened: 2026-03-15
---

# Smart-Skip Pipeline Optimization

## Enhancement Summary

**Deepened on:** 2026-03-15
**Review agents used:** architecture-strategist, security-sentinel, code-simplicity-reviewer, pattern-recognition-specialist, agent-native-reviewer

### Key Improvements from Deepening
1. **Smart-skip redesigned**: Use inline guards at dispatch sites (not a centralized lookup table) — follows the pattern feature-team.md already uses successfully
2. **Security dedup made safe**: Conditional re-run added — if Phase 5→3 loop was triggered, security-auditor re-runs in Phase 6 on fix files only
3. **Hooks extracted to script file**: Replace 879-char single-line bash blob with a readable 18-line `pre-commit-lint.sh`; drop pre-push test hook entirely
4. **Skill target changed**: Replace arbitrary 80-line minimum with a content quality checklist

### New Considerations Discovered
- The CRITICAL RULE on line 34 already contradicts existing conditional annotations on lines 70-72 — the "NEVER skip" rule is descriptively inaccurate today
- Removing Phase 6 security spot-check creates a real gap for Phase 5→3 fix code
- Pre-push test hook cannot be made generic by file extension — drop it, Phase 4 handles testing
- Ambiguity resolution should be condition-type-specific, not a blanket "fail-open" policy

---

## Overview

The orchestrator currently runs ALL 34 agents on EVERY request regardless of project composition. A Next.js-only web app still dispatches flutter-developer, kmp-developer, python-developer, agent-native-developer, and agent-native-reviewer — all of which produce nothing. This wastes tokens, adds latency, and creates noise.

This plan implements 4 optimizations (see brainstorm: `docs/brainstorms/2026-03-15-plugin-overengineering-audit-brainstorm.md`):

1. **Smart-skip**: Inline guards at each dispatch site skip agents whose domain isn't in the project
2. **Security dedup**: Remove redundant security-auditor from Phase 6 (with conditional re-run safety net)
3. **Dynamic hooks**: Extract to script file, use extension-based detection, drop pre-push test hook
4. **Expand thin skills**: 17 skills need better content (quality checklist, not line count target)

## Problem Statement

**Token waste**: Every pipeline run dispatches 5-8 agents that do nothing because their tech stack isn't in the project. Each agent still loads its system prompt (100-800 lines), reads spec files, and produces either empty output or a "not applicable" message.

**Security redundancy**: `security-auditor` runs in Phase 5 (full OWASP/STRIDE audit) and again in Phase 6 via `review-team` (spot-check). The Phase 6 dispatch is at `review-team.md:49-53`. This is redundant — but removing it naively creates a gap for code changed during the Phase 5→3 feedback loop.

**Brittle hooks**: `hooks.json` hard-codes `services/core-service`, `services/ai-service`, `apps/web` with specific lint/test commands. The 879-character single-line bash command embedded in JSON is unreadable, untestable, and unmaintainable. Any project with different service names gets broken hooks.

**Thin skills**: 17 skills have <50 lines of content, providing minimal value to agents that load them. Some (like `threat-modeling` at 19 lines) contain only information the model already knows from training.

---

## Proposed Solution

### Priority 1: Smart-Skip via Inline Guards

**Files to modify:**
- `plugins/project-orchestrator/agents/project-orchestrator.md` (lines 32-34, 40-93, dispatch blocks)

#### Research Insight: Don't Use a Centralized Lookup Table

The original plan proposed inserting a "Smart-Skip: Build Active Agent List" section with 12 skip rules as a lookup table. **All 5 review agents recommended against this approach.** Reasons:

1. **Two-stage reasoning is fragile**: The LLM must parse project-config.md, build a variable list, then remember to check that list 200+ lines later at each dispatch site. This cross-referencing fails under attention dilution in an 800+ line prompt.
2. **Negation is harder**: Skip rules are negative conditions ("skip if NOT Flutter"). LLMs are measurably worse at following negative instructions.
3. **The codebase already has the right pattern**: `feature-team.md:277-336` uses positive inline guards ("Dispatch if Flutter in project-config.md") directly at the dispatch site. This works reliably.

#### Correct Approach: Inline Guards at Dispatch Sites

Add a **positive conditional gate** directly before each conditional agent's dispatch. This keeps the condition and the action in the same visual block. The model evaluates the condition right before acting — no cross-referencing needed.

**Pattern (following feature-team.md:277-336):**
```markdown
### Phase 7: DevOps — parallel (conditional on project-config.md)

Read project-config.md "Infrastructure > Cloud Provider".
If Cloud Provider is "none" or "local-only", skip Phase 7 entirely
and log: "Skipping Phase 7: no cloud deployment configured."

Otherwise, spawn devops-engineer + deployment-engineer IN PARALLEL:
```

**Update the CRITICAL RULE (line 34):**

Current:
```
CRITICAL RULE: NEVER skip agents. The FULL pipeline runs every time.
```

New:
```
CRITICAL RULE: Always run ALL 9 phases. Within phases, check project-config.md
before dispatching each agent — if the agent's tech stack is absent from the
project, skip that agent and log the skip. Verification phases (Security,
Review) always run regardless of tech stack.
```

**Update the ASCII pipeline diagram (lines 40-93):**

Add a single note below the diagram rather than cluttering every line:
```
Note: Agents marked [C] are conditional — dispatched only when their
tech stack appears in project-config.md. All other agents always run.
```

Then mark conditional agents with `[C]`:
```
PHASE 3: IMPLEMENTATION
  ├── agent-native-developer [C]  → agent definitions, skills, commands
  ├── backend-developer           → API endpoints, business logic
  ├── senior-engineer      [C]    → cross-service integration (skip if single service)
  ├── python-developer     [C]    → AI service, async tasks
  ├── frontend-developer   [C]    → React/Next.js web app
  ├── flutter-developer    [C]    → Flutter mobile app
  └── kmp-developer        [C]    → KMP mobile app
```

#### Research Insight: Tiered Skip Authority

The architecture strategist and pattern recognition specialist both recommend **separating skip authority by tier**:

| Tier | Owns Skip Decisions For | How |
|------|------------------------|-----|
| **Orchestrator** | Phase-level skips (skip entire Phase 7 if no cloud) and standalone agents it dispatches directly | Inline guard before dispatch |
| **Team orchestrators** | Internal agent skips (feature-team skips flutter-developer, design-team skips agent-native-designer) | Already implemented in feature-team.md:277-336 |

The orchestrator should NOT duplicate feature-team's internal skip decisions. Feature-team already reads project-config.md and decides. The orchestrator trusts it.

**Where the orchestrator adds NEW inline guards:**
- Phase 2 dispatch prompt: tell design-team to skip agent-native-designer if no agent-native features
- Phase 7 dispatch: skip devops-engineer + deployment-engineer if no cloud
- Phase 5 dispatch: scale depth by task size (already exists in security-auditor.md:30-36)
- Phase 6 dispatch: tell review-team to skip agent-native-reviewer if no agent-native features

**Where the orchestrator does NOT add guards (team handles it):**
- Phase 3: feature-team already conditionally dispatches frontend/flutter/kmp/python agents
- Phase 4: quality-team already scales test depth by task size

#### Research Insight: Condition-Type-Specific Ambiguity Resolution

Don't use a blanket "when in doubt, run all" policy. Different condition types need different resolution:

| Condition Type | Resolution | Rationale |
|---|---|---|
| Platform presence (Flutter/KMP/web) | **Fail-strict** (do not run) | Binary condition. Running without a platform produces unwanted scaffold. |
| Task size threshold (SMALL/MEDIUM/BIG) | **Fail-open** (run the agent) | Classification uncertainty. Extra agent is cheap insurance. |
| Artifact existence (.claude/agents/) | **Fail-strict** (do not run) | Nothing to operate on. Running would error or produce noise. |
| Config field missing/malformed | **Fail-open** (run the agent) | If project-config.md is unreadable, run all agents. |

#### Research Insight: Skip Cascade Table

When an upstream agent is skipped, downstream agents that depend on its output should also be skipped:

| Config Field | Phase 2 Skip | Phase 3 Skip | Phase 4 Skip | Phase 6 Skip |
|---|---|---|---|---|
| Frontend: none | ui-designer | frontend-developer | qa-automation (browser E2E) | — |
| Mobile: none | — | flutter-developer, kmp-developer | qa-automation (mobile E2E) | — |
| Agent-native: none | agent-native-designer | agent-native-developer | — | agent-native-reviewer |
| Cloud: none | — | — | — | — (Phase 7 skipped entirely) |
| Python: none | — | python-developer | — | — |
| Single service | — | senior-engineer | — | — |

**Expected impact:** 5-8 fewer agent dispatches per typical run. For a Next.js + PostgreSQL web app with no mobile/AI/agent-native: **7 agents skipped**.

---

### Priority 2: Security-Auditor Deduplication (with Safety Net)

**Files to modify:**
- `plugins/project-orchestrator/agents/review-team.md` (lines 30, 49-53)
- `plugins/project-orchestrator/agents/project-orchestrator.md` (Phase 6 section, lines 82-85)

#### Research Insight: Naive Removal is NOT Safe

The security sentinel found a **HIGH severity gap**: the Phase 5→3 feedback loop creates code that would have NO security review if the Phase 6 spot-check is removed naively.

**Timeline that exposes the gap:**
```
Phase 5:  security-auditor finds CRITICAL SQL injection
Phase 5→3: feature-team applies fix
Phase 5:  scoped re-audit verifies fix (but skips secrets-scanner on modified files)
Phase 6:  [PROPOSED] code-reviewer reads security-audit.md, sees "RESOLVED" ✓
          → But what if the fix itself introduced a NEW vulnerability?
          → code-reviewer has 1-line security checklist vs security-auditor's 127-line OWASP skill
          → Code-reviewer can VERIFY known findings, cannot DISCOVER new ones
```

#### Safe Approach: Conditional Re-Run

**Default behavior (common case — no Phase 5→3 loop):**
- Remove security-auditor from review-team Phase 6 dispatch
- code-reviewer reads security-audit.md and verifies findings were addressed
- This covers ~80% of pipeline runs (Phase 5 finds nothing Critical/High)

**Safety net (when Phase 5→3 loop was triggered):**
- If ANY round-trip in Phase 5→3 occurred, re-run security-auditor in Phase 6 **in spot-check mode on fix files only**
- This catches regressions the scoped re-audit's limited skill set missed
- Orchestrator tracks whether Phase 5→3 loop fired and passes this flag to review-team

**For BIG tasks:** Keep the Phase 6 security-auditor spot-check regardless. The blast radius is large enough that a second security pass has meaningful value. The efficiency savings are negligible relative to BIG task total cost.

**Implementation:**

In `review-team.md`, replace the security-auditor dispatch (lines 49-53) with:

```markdown
# Security audit was done in Phase 5. In Phase 6, code-reviewer verifies findings.
# EXCEPTION: If Phase 5→3 loop was triggered, re-run security-auditor on fix files.

# Check dispatch prompt for Phase 5→3 flag:
IF task_size = "BIG" OR phase_5_3_triggered = true:
  Agent(
    subagent_type="project-orchestrator:security-auditor",
    run_in_background=True,
    prompt="SPOT-CHECK mode: review ONLY the Phase 5→3 fix files for new
            vulnerabilities introduced by the fixes. Do NOT repeat full audit.
            Reference: .claude/specs/[feature]/security-audit.md"
  )
```

Update code-reviewer dispatch prompt (line 44-47):
```
Also read .claude/specs/[feature]/security-audit.md (Phase 5 findings).
Verify Critical and High severity items have been addressed in the code.
Flag any unresolved Critical/High security findings as Critical review items.
```

Update review-team.md team composition block (line 30): Remove `security-auditor` from the permanent team member list. Add note: "Security-auditor dispatched conditionally (BIG tasks or post-Phase-5→3 fixes only)."

---

### Priority 3: Dynamic Hooks

**Files to modify:**
- `plugins/project-orchestrator/hooks/hooks.json` (entire file)
- NEW: `plugins/project-orchestrator/hooks/pre-commit-lint.sh`

#### Research Insight: Extract to Script File

The code simplicity reviewer found the current hook is an **879-character single-line bash command** embedded in JSON with escaped quotes. This is:
- Impossible to read or debug
- Impossible to test in isolation
- A maintenance nightmare

**Extract to a script file.** The hooks.json `command` field calls the script.

#### Research Insight: Drop Pre-Push Test Hook

The pre-push test hook **cannot be made generic**. Tests are project-level, not file-level — you cannot infer from `.ts` whether to run `npm test`, `jest`, `vitest`, or `playwright test`. Additionally:
- Phase 4 (quality-team) already runs the full test suite
- Running tests on every `git push` in a hook adds latency and duplicates Phase 4
- If users want pre-push tests, they should use a standard git hook in their repo

#### Research Insight: Lint Per-File, Not Per-Directory

The current approach lints the entire `services/core-service` directory if a single file changed. Per-file linting is both faster and more correct. Most linters (eslint, ruff, dart) walk up the directory tree to find their config automatically.

#### New hooks.json (thin — just calls scripts):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "INPUT=$(cat); CMD=$(echo \"$INPUT\" | jq -r '.tool_input.command // empty' 2>/dev/null || echo ''); if echo \"$CMD\" | grep -qE 'git\\s+commit'; then bash \"${CLAUDE_PLUGIN_ROOT}/hooks/pre-commit-lint.sh\"; fi"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "INPUT=$(cat); CMD=$(echo \"$INPUT\" | jq -r '.tool_input.command // empty' 2>/dev/null || echo ''); if echo \"$CMD\" | grep -qE 'git\\s+commit'; then HASH=$(git rev-parse --short HEAD 2>/dev/null || echo '?'); MSG=$(git log -1 --format='%s' 2>/dev/null || echo ''); BRANCH=$(git branch --show-current 2>/dev/null || echo '?'); TS=$(date '+%Y-%m-%d %H:%M'); echo \"[$TS] $HASH | $BRANCH | $MSG\" >> claude-progress.txt 2>/dev/null || true; fi"
          }
        ]
      },
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "INPUT=$(cat); FILE=$(echo \"$INPUT\" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo ''); if [ -n \"$FILE\" ]; then EXT=\"${FILE##*.}\"; case \"$EXT\" in ts|tsx|js|jsx|json) npx prettier --write \"$FILE\" 2>/dev/null || true ;; py) ruff format \"$FILE\" 2>/dev/null || true ;; dart) dart format \"$FILE\" 2>/dev/null || true ;; kt|kts) which ktlint >/dev/null 2>&1 && ktlint --format \"$FILE\" 2>/dev/null || true ;; go) gofmt -w \"$FILE\" 2>/dev/null || true ;; esac; fi"
          }
        ]
      }
    ]
  }
}
```

#### New hooks/pre-commit-lint.sh (readable, testable):

```bash
#!/bin/bash
# Lint staged files by extension. Skips linters not on PATH.
# Advisory only — warns but does not block commits.
CHANGED=$(git diff --cached --name-only 2>/dev/null) || exit 0
[ -z "$CHANGED" ] && exit 0

ISSUES=0
for FILE in $CHANGED; do
  [ -f "$FILE" ] || continue
  case "${FILE##*.}" in
    ts|tsx|js|jsx)
      command -v eslint >/dev/null 2>&1 && eslint --no-error-on-unmatched-pattern "$FILE" 2>/dev/null || ISSUES=1 ;;
    py)
      command -v ruff >/dev/null 2>&1 && ruff check "$FILE" 2>/dev/null || ISSUES=1 ;;
    dart)
      command -v dart >/dev/null 2>&1 && dart analyze "$FILE" 2>/dev/null || ISSUES=1 ;;
    kt|kts)
      command -v ktlint >/dev/null 2>&1 && ktlint "$FILE" 2>/dev/null || ISSUES=1 ;;
    go)
      command -v golangci-lint >/dev/null 2>&1 && golangci-lint run "$FILE" 2>/dev/null || ISSUES=1 ;;
  esac
done

[ $ISSUES -ne 0 ] && echo "⚠️  Lint issues found in staged files"
exit 0  # advisory — don't block commit
```

**What changed vs current:**
- Extracted from 879-char JSON blob → readable 20-line script
- Removed hard-coded service paths → per-file extension detection
- Removed pre-push test hook entirely → Phase 4 handles testing
- Added `command -v` guards → skip gracefully when tools not installed
- Added Go support (`golangci-lint`) and Go formatting (`gofmt`)
- Kept PostToolUse auto-formatter (already extension-based, just added `go` support)

---

### Priority 4: Expand Thin Skills (Quality Checklist)

**Files to modify:** 17 SKILL.md files

#### Research Insight: Line Count is the Wrong Metric

The agent-native reviewer found that **80 lines is not the right target**. A 30-line skill with a good output template and 3 project-specific constraints is more valuable than an 80-line skill padded with generic best practices.

Example: `threat-modeling/SKILL.md` (19 lines) contains only a STRIDE table. An LLM already knows STRIDE from training. This adds zero value — it consumes context window without adding actionable guidance.

#### Content Quality Checklist (replaces line count target)

Every skill MUST have:
- [ ] **Output format template** — what files to write, what sections to include, what structure to follow. This is the highest-value content because it makes agent output predictable and parseable by downstream agents.
- [ ] **At least one constraint the model would not follow by default** — project-specific rules that override default behavior (e.g., "use Riverpod, not BLoC" or "all API responses must include `request_id`")
- [ ] **No duplicated training knowledge** — don't tell the model what SQL injection is. Tell it WHERE to look for it in THIS project's patterns.
- [ ] **Concrete code examples** using project frameworks, not pseudocode

**Triage of 17 thin skills:**

| Skill | Current Problem | Fix Strategy |
|-------|----------------|--------------|
| threat-modeling (19 lines) | STRIDE table = training data | Rewrite: output template for threat matrix, reference architecture.md components |
| compliance-checker (26 lines) | Generic checklist | Add: output format, framework-specific data handling patterns |
| visual-regression (33 lines) | No tool guidance | Add: Playwright screenshot comparison workflow, threshold config |
| accessibility-audit (35 lines) | Generic WCAG list | Add: output format, axe-core integration, Playwright a11y testing |
| web-quality (35 lines) | Generic Lighthouse list | Add: Lighthouse CI config, Core Web Vitals targets, output format |
| load-tester (38 lines) | No examples | Add: k6 script templates, response time thresholds, output format |
| code-review (40 lines) | 1-line security dimension | Add: output format (severity table), review scope per task size |
| release-manager (41 lines) | Thin checklist | Add: semantic version decision tree, changelog format, git tag workflow |
| terraform-skills (41 lines) | No HCL examples | Add: module patterns, state management, provider config examples |
| k8s-skill (42 lines) | No manifest examples | Add: Deployment/Service/Ingress templates, HPA config |
| monitoring-setup (45 lines) | Incomplete | Add: Prometheus config, alert rules, Grafana dashboard JSON |
| state-machine-designer (45 lines) | No output format | Add: XState/custom state machine output format, guard condition patterns |
| webapp-testing (45 lines) | No Playwright examples | Add: Page Object pattern, test structure, CI config |
| competitor-analysis (47 lines) | No output format | Add: comparison matrix template, scoring rubric |
| product-knowledge (48 lines) | Template placeholder | This is intentionally a template — document it clearly as such |
| task-breakdown (48 lines) | Thin decomposition rules | Add: dependency detection heuristics, effort estimation rubric |
| user-story-writer (49 lines) | No output format | Add: story template with acceptance criteria, edge case prompts |

---

## Acceptance Criteria

### Priority 1: Smart-Skip
- [ ] Inline guards added at each conditional agent's dispatch site (not a centralized lookup table)
- [ ] Guards follow positive-gate pattern from feature-team.md:277-336
- [ ] All 9 phases still run — only individual agents within phases are conditional
- [ ] Skip decisions logged at point of skip
- [ ] ASCII pipeline diagram updated with `[C]` markers and footnote
- [ ] CRITICAL RULE updated to reflect smart-skip + verification-phase exemption
- [ ] Condition-type-specific resolution: platform=strict, size=fail-open, artifact=strict, missing-config=fail-open
- [ ] Skip cascade table documented (upstream skip → downstream impact)
- [ ] Feature-team's existing conditional logic preserved (orchestrator doesn't duplicate)

### Priority 2: Security Dedup
- [ ] security-auditor dispatch REMOVED from review-team.md default path
- [ ] Conditional re-run ADDED: if Phase 5→3 loop triggered OR task_size=BIG, security-auditor runs in spot-check mode
- [ ] code-reviewer prompt UPDATED to verify Phase 5 security-audit.md findings
- [ ] review-team.md team composition block updated
- [ ] ASCII pipeline diagram updated (Phase 6 shows conditional security-auditor)
- [ ] Orchestrator passes `phase_5_3_triggered` flag to review-team dispatch

### Priority 3: Dynamic Hooks
- [ ] Hook logic extracted to `hooks/pre-commit-lint.sh` (readable script, not JSON blob)
- [ ] Pre-commit lint uses per-file extension detection with `command -v` guards
- [ ] Pre-push test hook REMOVED (Phase 4 handles testing)
- [ ] PostToolUse auto-formatter unchanged except: added Go support (`gofmt`)
- [ ] `install.sh` updated to set execute permission on `pre-commit-lint.sh`
- [ ] Works for ANY project structure (no hard-coded service paths)

### Priority 4: Expand Thin Skills
- [ ] All 17 thin skills pass the content quality checklist (output format, non-training-data constraint, concrete examples)
- [ ] Skills that are intentionally templates (product-knowledge) documented as such
- [ ] No skills padded with generic best practices the model already knows

---

## Implementation Phases

### Phase 1: Smart-Skip (Priority 1 — highest impact)

**Files:** `project-orchestrator.md`
**Effort:** Single focused edit session (~30 edits across dispatch blocks)
**Risk:** LOW — additive change. Agents that were running will still run. We're only skipping agents that produce nothing. Cost of a missed skip = wasted tokens (not incorrect output).

**Steps:**
1. Update the CRITICAL RULE (line 34) — new wording with verification-phase exemption
2. Update the ASCII pipeline diagram (lines 40-93) — add `[C]` markers + footnote
3. Add inline guard before Phase 7 dispatch (lines 694-709) for devops/deployment cloud check
4. Add inline guard in Phase 2 dispatch prompt (line 535-545): tell design-team to skip agent-native-designer if no agent-native features
5. Add inline guard in Phase 6 dispatch prompt (line 688-692): tell review-team to skip agent-native-reviewer if no agent-native features
6. Add skip cascade table as a reference section
7. Verify feature-team's existing logic (lines 277-336) is NOT duplicated by new orchestrator guards
8. Update orchestrator description (line 3) — remove "runs FULL pipeline with ALL agents"

### Phase 2: Security Dedup (Priority 2 — safety-critical)

**Files:** `review-team.md`, `project-orchestrator.md`
**Effort:** 30-minute edit
**Risk:** HIGH if done wrong (gap in security coverage). LOW with conditional re-run.

**Steps:**
1. Add `phase_5_3_triggered` flag tracking in orchestrator Phase 5→3 section
2. Pass flag to review-team dispatch prompt
3. In review-team.md: replace security-auditor dispatch (lines 49-53) with conditional logic
4. Update code-reviewer dispatch prompt (lines 44-47) to include security findings verification
5. Update team composition block (line 30)
6. Update Phase 6 ASCII diagram in project-orchestrator.md
7. Verify Phase 5→3 scoped re-audit includes secrets-scanner on modified files (not just new files)

### Phase 3: Dynamic Hooks (Priority 3 — robustness)

**Files:** `hooks/hooks.json`, NEW `hooks/pre-commit-lint.sh`
**Effort:** Full rewrite of hooks.json + new script
**Risk:** MEDIUM — hooks run on every tool use. Test the script manually before deploying.

**Steps:**
1. Create `hooks/pre-commit-lint.sh` with per-file extension-based linting
2. Rewrite `hooks.json` PreToolUse to call the script
3. Remove pre-push test section entirely
4. Add Go support to PostToolUse formatter
5. Update `install.sh` to chmod +x the script
6. Test: create a dummy project, stage .ts and .py files, verify linting runs

### Phase 4: Expand Skills (Priority 4 — content)

**Files:** 17 SKILL.md files
**Effort:** Parallelize across subagents (1 per skill domain)
**Risk:** NONE — additive content only

**Steps:**
1. For each of the 17 skills, research current best practices for that domain
2. Add output format template (highest value content)
3. Add project-specific constraints (things the model wouldn't do by default)
4. Add concrete code examples using project frameworks
5. Remove any content that just repeats what the model already knows
6. Verify each skill passes the content quality checklist

---

## Dependencies & Risks

| Risk | Severity | Impact | Mitigation |
|------|----------|--------|------------|
| Inline guard missed by LLM (attention dilution) | LOW | Agent runs unnecessarily (token waste, not incorrect output) | Guards are 2 lines at dispatch site — minimal attention demand. Feature-team proves this pattern works. |
| Phase 5→3 fix code unreviewed after removing Phase 6 spot-check | HIGH | Security vulnerability shipped | Conditional re-run: if Phase 5→3 loop triggered, security-auditor runs in Phase 6 spot-check mode |
| Pre-commit-lint.sh script fails silently | LOW | Lint issues committed | `exit 0` ensures commits never blocked. Advisory-only mode. |
| Skip cascade inconsistency (Phase 2 skips ui-designer but Phase 3 still dispatches frontend-developer) | MEDIUM | Frontend developer has no design spec | Skip cascade table documents dependencies. Inline guards in both phases reference same config field. |
| Double-skip maintenance burden (orchestrator + feature-team both skip) | LOW | New agent added without guard in one layer | Tiered authority model: orchestrator handles phase-level skips, teams handle internal skips. Document which layer owns which decision. |

---

## Sources & References

### Origin

- **Brainstorm document:** [docs/brainstorms/2026-03-15-plugin-overengineering-audit-brainstorm.md](docs/brainstorms/2026-03-15-plugin-overengineering-audit-brainstorm.md) — Key decisions: keep all 34 agents with smart-skip, fix security duplication, make hooks dynamic, expand thin skills

### Internal References

- Orchestrator dispatch logic: `agents/project-orchestrator.md:456-717`
- Orchestrator CRITICAL RULE: `agents/project-orchestrator.md:34`
- Existing conditional dispatch pattern: `agents/feature-team.md:277-336`
- Review-team security dispatch: `agents/review-team.md:49-53`
- Hooks configuration: `hooks/hooks.json:1-35`
- project-config.md template: `agents/project-setup.md:593-777`
- Security-auditor dual-mode: `agents/security-auditor.md:23-26`
- Phase 5→3 feedback loop: `agents/project-orchestrator.md:321-397`
- Phase 5 security redesign plan: `docs/plans/2026-03-15-006-feat-phase5-security-auditor-redesign-plan.md`
- Code-reviewer skills (security gap): `agents/code-reviewer.md:8-9`
- Security-reviewer skill (127 lines): `skills/security-reviewer/SKILL.md`
- Code-review skill (40 lines, 1-line security): `skills/code-review/SKILL.md:14`

### Research Insights (from deepening)

- **Architecture strategist**: Keep markdown config, fail-open default, separate skip authority by tier, re-read config (don't pass skip lists), exempt verification phases, add skip cascade table
- **Security sentinel**: Phase 5→3 creates unaudited code (HIGH), add conditional re-run, code-reviewer can verify but not discover, keep spot-check for BIG tasks
- **Code simplicity reviewer**: Extract hooks to script file, drop pre-push test hook, lint per-file not per-directory, use `command -v` guards
- **Pattern recognition specialist**: Formalize existing sub-orchestrator-decides pattern, fix CRITICAL RULE contradiction, condition-type-specific ambiguity resolution
- **Agent-native reviewer**: Use inline guards (not lookup table), follow feature-team pattern, replace 80-line target with quality checklist, add validation to validate-plugin.sh
