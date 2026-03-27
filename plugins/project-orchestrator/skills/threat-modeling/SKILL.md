---
name: threat-modeling
description: Perform STRIDE threat modeling — Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege. Use when the user says "threat model", "STRIDE analysis", "security assessment", or needs to identify threats before building security controls.
allowed-tools: Read, Grep, Glob
---

# Threat Modeling Skill (STRIDE)

## Step 1 — Discover the Attack Surface

Before modeling threats, build a component inventory from the codebase.
Run these searches and record every hit:

```bash
# Auth boundaries — anywhere trust decisions happen
grep -rn "verify\|authenticate\|authorize\|isAdmin\|requireRole\|jwt\|passport\|guard" --include="*.ts" --include="*.py" --include="*.go" --include="*.java"

# Data ingress — every place external input enters
grep -rn "req\.body\|req\.params\|req\.query\|request\.data\|@Body\|@Query\|@Param\|r\.FormValue\|getParameter" --include="*.ts" --include="*.py" --include="*.go" --include="*.java"

# Secrets and tokens in config
grep -rn "SECRET\|API_KEY\|TOKEN\|PASSWORD\|PRIVATE_KEY" --include="*.env*" --include="*.yml" --include="*.yaml" --include="*.json" --include="*.toml"

# File upload handlers
grep -rn "multer\|FileInterceptor\|UploadFile\|multipart\|FormFile" --include="*.ts" --include="*.py" --include="*.go"

# External service calls (outbound trust)
grep -rn "fetch(\|axios\.\|http\.get\|http\.post\|requests\.\|HttpClient\|grpc\.Dial" --include="*.ts" --include="*.py" --include="*.go" --include="*.java"

# Database queries — potential injection sites
grep -rn "raw(\|rawQuery\|execute(\|cursor\.execute\|db\.Exec\|createQueryBuilder\|\.query(" --include="*.ts" --include="*.py" --include="*.go"
```

Map each finding to a component from `architecture.md` (or equivalent). If no architecture doc exists, build the component list from the directory structure and route definitions.

## Step 2 — Build the Threat Matrix

For every component found in Step 1, evaluate all six STRIDE categories.
Skip categories that genuinely do not apply (e.g., Repudiation is irrelevant for a static asset CDN).

**Constraint:** Do NOT list a threat without a concrete attack scenario that references an actual file and line from the codebase. Generic threats like "attacker could spoof identity" are worthless. Write: "The `/api/auth/login` endpoint in `src/auth/auth.controller.ts:42` accepts email/password but has no rate limiting, enabling credential-stuffing attacks."

**Constraint:** Every mitigation must reference a specific code change (file path, function, config key) or a library to install. Never write "add input validation" without specifying what validation, where, and using what (e.g., `zod.string().email()` in the request DTO).

## Step 3 — Classify Severity

Use this risk matrix (Likelihood x Impact):

| | Low Impact | Medium Impact | High Impact |
|---|---|---|---|
| **High Likelihood** | Medium | High | Critical |
| **Medium Likelihood** | Low | Medium | High |
| **Low Likelihood** | Info | Low | Medium |

- **High Impact**: Data breach, privilege escalation, full system compromise
- **Medium Impact**: Unauthorized read access, session hijacking, service degradation
- **Low Impact**: Information leakage (version headers, stack traces), minor DoS

## Output Format

Write the file to `.claude/specs/{feature}/security-audit.md` using this exact structure:

```markdown
# Threat Model — {Feature/Service Name}

**Date:** {YYYY-MM-DD}
**Scope:** {list of components/services analyzed}
**Architecture ref:** {path to architecture.md or equivalent}

## Attack Surface Inventory

| # | Component | Entry Point | Trust Boundary | Data Sensitivity |
|---|-----------|-------------|----------------|------------------|
| 1 | {name}    | {route/handler + file:line} | {internal/external/cross-service} | {public/internal/confidential/restricted} |

## Threat Matrix

### {Component Name}

| STRIDE | Threat | Attack Scenario | Severity | Mitigation | File(s) to Change |
|--------|--------|-----------------|----------|------------|--------------------|
| S | {specific threat} | {concrete scenario with file:line} | {Critical/High/Medium/Low/Info} | {specific code change} | {file paths} |
| T | ... | ... | ... | ... | ... |

_(repeat for each component)_

## Critical Findings (Severity >= High)

1. **{Title}** — {one-line summary}
   - **File:** `{path}:{line}`
   - **Attack:** {step-by-step scenario}
   - **Fix:** {exact code change or config}
   - **Effort:** {S/M/L}

## Recommended Priority Order

1. {Critical fix} — blocks deployment
2. {High fix} — address this sprint
3. {Medium fix} — next sprint backlog

## Data Flow Diagrams

For each cross-service boundary, document:
- Source -> Destination
- Protocol (HTTP/gRPC/message queue)
- Auth mechanism on the wire
- What happens if auth fails (does it fail open or closed?)
```

## Constraints

- Never model threats in the abstract. Every threat row must trace back to a grep hit from Step 1.
- If architecture.md does not exist, tell the orchestrator that threat modeling is blocked until architecture is documented. Do not invent an architecture.
- Do not explain STRIDE categories to the user. They are a framework for your analysis, not deliverable content.
- If a component has no threats in a STRIDE category, omit that row. Do not write "N/A" rows.
- Rate every finding. Unrated findings are useless to the security-auditor agent downstream.

## Anti-Patterns

- **Threat modeling after launch** — threat models should be created during design, not as an afterthought after deployment; finding threats early is 10x cheaper to fix
- **Only modeling external threats** — ignoring insider threats and supply chain risks; STRIDE covers elevation of privilege and repudiation for a reason
- **No severity ratings** — listing threats without rating them; teams can't prioritize without severity (Critical/High/Medium/Low)
- **Theoretical threats with no context** — listing generic threats that don't apply to the specific system; every threat should reference a specific component or data flow
- **Modeling without the codebase** — running STRIDE from a whiteboard diagram only; the grep-based discovery step grounds the model in actual code
- **Not updating the model** — threat models are living documents; new features and integrations change the attack surface

## Checklist

- [ ] Attack surface discovered (auth boundaries, data ingress, storage, egress, external services)
- [ ] All STRIDE categories evaluated per component
- [ ] Each threat has severity rating (Critical/High/Medium/Low)
- [ ] Mitigations proposed for High and Critical findings
- [ ] Threat model references specific files and code patterns found during discovery
- [ ] Data flow diagram included showing trust boundaries
- [ ] Findings saved to `.claude/specs/[feature]/threat-model.md`
- [ ] Model reviewed when new features or integrations are added
