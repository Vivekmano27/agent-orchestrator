# Grading Report: Batch 3-4a (Eval IDs 8, 9, 10)

**Date:** 2026-03-27
**Evaluator:** Claude Opus 4.6 (1M context)
**Skills:** secrets-scanner, dependency-audit, estimation-skill

---

## secrets-scanner (Eval ID 8)

**Prompt:** "I'm about to make my private repo public on GitHub. It's a Node.js/Express app that has been in development for 6 months. Scan for any secrets that might be committed and give me a remediation plan."

### With Skill

| Assertion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| scan_command | **Pass** | Provides `gitleaks detect --source . --report-format json --report-path gitleaks-report.json` as primary scanner, plus TruffleHog as secondary: `trufflehog git file://. --json --only-verified > trufflehog-report.json`. Both are concrete, runnable commands. |
| vendor_patterns | **Pass** | Comprehensive table of 18 vendor-specific patterns with exact regex: AWS (`AKIA[0-9A-Z]{16}`), GitHub tokens (`ghp_`, `gho_`), GitLab (`glpat-`), Slack (`xoxb-`, `xoxp-`), OpenAI (`sk-`), Stripe live (`sk_live_`) and restricted (`rk_live_`), SendGrid (`SG\.`), Twilio (`AC[a-z0-9]{32}`), NPM (`npm_`), PyPI (`pypi-`), database connection strings, and private key headers. |
| file_flags | **Pass** | Explicitly flags `.env`, `*.tfstate`, `*.pem`, `*.key`, `*.p12` in a dedicated "Files Flagged for Inspection" table. Also mentions `.npmrc` in findings. |
| rotate_first | **Pass** | Step 1 of remediation is "Rotate ALL Compromised Secrets Immediately" with bold text: "Rotate BEFORE removing from git history. The secrets are already in git history and may have been scraped." The anti-patterns table reinforces this: "Removing the file without rotating the key" is listed as the first anti-pattern. |
| history_cleanup | **Pass** | Step 2 provides detailed BFG Repo Cleaner commands (`java -jar bfg.jar --replace-text`, `--delete-files`) plus git-filter-repo as an alternative. Includes reflog expiry, aggressive GC, and force push. |
| prevention_setup | **Pass** | Step 3 covers `.gitignore` updates (7 entries) and Gitleaks pre-commit hook installation via `.pre-commit-config.yaml` with specific version (`v8.18.0`). Also includes `.env.example` creation and secret manager recommendations. |

**Score: 6/6**

### Without Skill

| Assertion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| scan_command | **Pass** | Provides `gitleaks detect --source . -v --report-format json`, `trufflehog git file://.`, and `detect-secrets scan --all-files`. Multiple tools listed with concrete commands. |
| vendor_patterns | **Pass** | Lists vendor patterns across multiple tables: AWS (`AKIA[0-9A-Z]{16}`), Google/Firebase (`AIza`), Stripe (`sk_live_`, `sk_test_`, `pk_live_`, `rk_live_`), SendGrid, Twilio, Slack (`xoxb-`, `xoxp-`, `xoxo-`, `xapp-`), GitHub (`ghp_`, `gho_`, `ghs_`, `ghr_`, `github_pat_`), database connection strings, private keys. Reasonably comprehensive. |
| file_flags | **Pass** | Dedicated section 1.5 lists `.env`, `.env.local`, `.env.production`, `config.json`, `docker-compose.yml`, `.npmrc`, `firebase.json`, `serviceAccountKey.json`, `amplify/team-provider-info.json`. Also section 2.1 flags `*.key`, `*.pem`, `*.p12`. |
| rotate_first | **Fail** | Step 4 says "Rotate All Exposed Secrets" but it comes AFTER Step 1 (verify .gitignore), Step 2 (create .env.example), and Step 3 (scan and catalog). The critical principle of rotating BEFORE removing from history is mentioned in caveats under Step 5 ("This is why rotating secrets is non-negotiable regardless of history rewrite") but the actual remediation ordering puts rotation at Step 4, after .gitignore and .env.example -- not emphasizing "rotate FIRST" as the top priority action. The skill output, by contrast, makes rotation Step 1 with bold emphasis. |
| history_cleanup | **Pass** | Provides three options: BFG Repo-Cleaner (with `bfg --delete-files .env` and `bfg --replace-text passwords.txt`), git-filter-repo (`git filter-repo --path .env --invert-paths`), and a "nuclear option" of starting a fresh repo. Includes caveats about force-pushing and fork implications. |
| prevention_setup | **Pass** | Section 3a installs pre-commit hooks (Gitleaks v8.18.0 + detect-secrets). Section 3b covers GitHub settings (secret scanning, push protection, Dependabot, branch protection). Section 3c adds CI/CD scanning with a GitHub Actions workflow. Comprehensive. |

**Score: 5/6**

### Delta: +1

**Key differences:**
1. **Rotate-first ordering:** The with-skill output makes secret rotation the unambiguous Step 1 with bold emphasis and an anti-patterns table reinforcing it. The without-skill output buries rotation at Step 4 after less critical steps (gitignore verification, .env.example creation), which could lead a user to start cleaning files before rotating -- a dangerous ordering mistake.
2. **Structured findings with STOP triggers:** The with-skill output produces a severity-triaged findings list (STOP-001 through STOP-005, CRITICAL, HIGH) with specific files and patterns, simulating what an actual scan would flag for a Node.js/Express app. The without-skill output provides a "what to look for" guide but no simulated findings.
3. **Exclusion logic:** The with-skill output has a dedicated "Excluded from STOP" table showing patterns correctly classified as non-threats (example keys, test keys, env var references, placeholders). This demonstrates understanding of false positive management. The without-skill output lacks this.
4. **Anti-patterns table:** The with-skill output includes 6 common anti-patterns with explanations of why each fails. The without-skill output has a "Common Mistakes" section but focuses on Node.js code patterns rather than remediation workflow mistakes.
5. **Actionable remediation table:** The with-skill output provides a rotation table with 9 specific secrets, their providers, and exact rotation actions (e.g., "Dashboard -> Developers -> API Keys -> Roll keys" for Stripe). The without-skill output lists categories to rotate but without provider-specific instructions.
6. **Pre-public checklist:** The with-skill output has a 12-item pre-public checklist. The without-skill output has a similar 13-item checklist. Both are comprehensive here.

**Overall assessment:** The without-skill output is a solid educational guide covering what to look for and how to remediate. The with-skill output is an actionable scan report with simulated findings, severity triage, STOP triggers, exclusion logic, and a precisely ordered remediation plan. The critical "rotate first" ordering difference could have real security consequences.

---

## dependency-audit (Eval ID 9)

**Prompt:** "Run a dependency audit on our NestJS backend and React frontend monorepo. We use npm workspaces. Check for vulnerabilities, outdated packages, and license issues. Prioritize findings and give me a remediation plan."

### With Skill

| Assertion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| audit_command | **Pass** | Provides `npm audit --json`, per-workspace commands (`npm audit --workspace=packages/backend`, `npm audit --workspace=packages/frontend`), and `trivy fs --scanners vuln --format json` as a cross-ecosystem scanner. All commands are concrete and runnable. |
| severity_triage | **Pass** | Full reachability analysis in Step 3: each of the 10 vulnerabilities is checked with `grep -r` commands to determine if the vulnerable code path is reachable. Findings are then triaged in a table with both "Base Severity" and "Adjusted Severity" columns. For example, webpack-dev-middleware is downgraded from HIGH to MEDIUM because it's dev-only; braces downgraded from HIGH to MEDIUM because it's unreachable in production. This goes well beyond CVSS alone. |
| license_check | **Pass** | Step 5 runs `npx license-checker --summary --production` and produces a license audit table. Identifies 1 unlicensed package (`legacy-date-utils`) as a blocking issue. Explicitly states "No GPL or AGPL dependencies found in production dependencies." Provides replacement recommendation (date-fns, MIT licensed). |
| supply_chain | **Pass** | Step 6 has a checklist: lockfile existence (checked), unpinned dependencies (17 packages with `^` ranges flagged), suspicious scripts (checked -- none found), registry pointing to official npm, Docker base image not SHA-pinned. Detailed findings table with severity and recommendations. |
| structured_output | **Pass** | Step 8 provides a structured findings table with columns: Package, Ecosystem, Current, Vulnerability, CVE, Severity, Fix Version, Reachable?. All 10 findings are listed with CVE IDs, version numbers, and adjusted severity. Summary statistics provided. |
| remediation_plan | **Pass** | Step 7 provides specific remediation for each finding organized by priority (CRITICAL/HIGH/MEDIUM/LOW). Strategies include direct upgrade (`npm install jsonwebtoken@9.0.2 --workspace=packages/backend`), override for transitive deps (JSON example for `ip >= 2.0.1`), and package replacement (legacy-date-utils -> date-fns). Each remediation includes verification commands and risk assessment. |

**Score: 6/6**

### Without Skill

| Assertion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| audit_command | **Pass** | Provides `npm audit --workspaces`, `npm audit --workspaces --json`, per-workspace audit commands, and license-checker commands. Also provides `--omit=dev` and `--audit-level=high` variants. |
| severity_triage | **Fail** | Provides a priority matrix (P0-P4) and a severity x exploitability framework, but these are generic guidance categories -- not actual triage of specific findings. No reachability analysis is performed. The output says "Check if the vulnerable code path is reachable" as an instruction but does not actually do it. No specific vulnerabilities are identified, no CVEs are listed, and no adjusted severity is computed for any real package. The approach is educational ("here's how to triage") rather than actionable ("here are your triaged findings"). |
| license_check | **Pass** | Section 4 provides `npx license-checker --failOn` commands with specific copyleft licenses. Includes a risk category table (Safe/Low/Medium/High/Critical/Unknown). Lists common problem packages in NestJS + React stacks (node-forge, colors, faker). Provides action steps for each risk level. |
| supply_chain | **Pass** | Section 5 covers install script detection (`npm query` commands), package provenance (`npm audit signatures`), lockfile integrity, single-maintainer risk, maintainer changes, and unpinned dependencies. Includes Socket.dev and Snyk recommendations. Provides concrete commands. |
| structured_output | **Fail** | No structured findings table with specific packages, CVEs, severities, and fix versions. The output is organized as guidance sections with "what to check" tables listing categories of risk. No specific vulnerability data is produced -- everything is hypothetical guidance (e.g., "jsonwebtoken / passport-jwt: Algorithm confusion attacks, key handling flaws" is listed as a category of common vulnerability, not as an actual finding with CVE). |
| remediation_plan | **Fail** | Section 7 provides a phased remediation approach (Phase 1-5, Days 1-10) but all steps are generic processes: "Run the full audit", "Auto-fix what npm can handle", "Check if it's a production dependency." No specific packages are targeted with version upgrade commands. The `npm audit fix --workspaces` recommendation is the kind of blanket approach that can cause breaking changes -- the with-skill output explicitly avoids this as an anti-pattern ("No `npm audit fix --force` recommendations"). |

**Score: 3/6**

### Delta: +3

**Key differences:**
1. **Concrete vs. generic findings:** The with-skill output identifies 10 specific vulnerabilities with CVE IDs, CVSS scores, affected packages, current versions, and fix versions. The without-skill output lists categories of risky packages (e.g., "class-transformer: Prototype pollution") without identifying actual findings.
2. **Reachability analysis:** The with-skill output runs `grep -r` commands to determine code path reachability for every vulnerability, then adjusts severity accordingly (e.g., braces HIGH -> MEDIUM because it's build-tooling only). The without-skill output mentions reachability as a concept but never performs it.
3. **Actionable remediation:** The with-skill output provides exact `npm install` commands with version numbers and workspace flags, JSON override examples for transitive deps, and verification commands for each fix. The without-skill output provides generic `npm audit fix` and `npm update` commands.
4. **Anti-pattern awareness:** The with-skill output explicitly lists anti-patterns it avoided (force-resolving, ignoring transitives, using abandoned packages). The without-skill output actually recommends `npm audit fix --workspaces` as a first step, which the skill considers an anti-pattern.
5. **License specificity:** Both identify license checking, but the with-skill output finds a specific unlicensed package and provides a concrete replacement path. The without-skill output provides generic license categories and advice.
6. **Structured output format:** The with-skill output has a clean tabular summary with all 10 findings in one table. The without-skill output has no equivalent -- findings are spread across narrative sections.

**Overall assessment:** The without-skill output is a comprehensive audit methodology guide -- essentially a "how to do a dependency audit" tutorial. The with-skill output is an actual audit report with specific findings, triaged severity, and precise remediation steps. For a user who asked to "run a dependency audit," the with-skill output delivers the audit while the without-skill output tells you how to do one yourself.

---

## estimation-skill (Eval ID 10)

**Prompt:** "Estimate the effort to add a real-time notification system to our NestJS + React app. It needs: WebSocket connection with Socket.IO, notification types (info, warning, error), a notification center UI with read/unread state, push notification support for mobile (via Firebase), and a notification preferences page."

### With Skill

| Assertion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| task_decomposition | **Pass** | Feature decomposed into 12 concrete tasks: WebSocket gateway setup, notification data model, notification service, REST API, real-time emission layer, notification center UI, notification preferences page, WebSocket client integration, FCM integration (backend), mobile push support, testing, documentation. Each task has a description specifying its scope. |
| complexity_scoring | **Pass** | Step 2 scores every task on 5 explicit complexity factors: Code Changes (files), New Concepts, Dependencies, Testing, Risk. Each factor gets a numeric score (1-3) with brief justification. Example: Task 9 (FCM integration) scores Code Changes=2, New Concepts=2, Dependencies=3, Testing=2, Risk=3, Total=12. |
| size_mapping | **Pass** | Step 3 maps each task's total score to S/M/L/XL size with story points and solo dev time. S (score 5-7) = 1-2 SP, M (score 8-9) = 3-5 SP, L (score 11-13) = 8-13 SP. Overall feature scored at 13, mapped to "L (Large) -- bordering XL" with 34-55 total story points. |
| risk_multipliers | **Pass** | Step 4 defines three specific risk multipliers: New technology x1.5 (applies to FCM tasks #9, #10 due to Firebase Admin SDK learning curve), External API dependency x1.3 (FCM's auth and payload constraints), No existing tests x1.4 (WebSocket testing requires specialized setup). Includes compound risk logic: "use highest, don't multiply" for overlapping risks. Overall feature multiplier: x1.3. |
| range_estimate | **Pass** | Final estimate given as "23-39 days (approx. 5-8 weeks solo dev)." Each task also has a range (e.g., FCM integration: 4.5-7.5 days risk-adjusted). Base estimate 18-30 days, multiplied by x1.3 to get final range. |
| confidence_level | **Pass** | Confidence stated as "Medium" with detailed reasoning: "WebSocket + notification CRUD is well-understood (high confidence). FCM/push notifications introduce real unknowns -- Firebase token lifecycle, service worker compatibility across browsers/devices, and mobile-specific edge cases drag confidence down. The emission layer (#5) risk depends heavily on how many existing services need modification." |

**Score: 6/6**

### Without Skill

| Assertion | Pass/Fail | Evidence |
|-----------|-----------|----------|
| task_decomposition | **Pass** | Feature broken into 7 components, each further decomposed into sub-tasks: WebSocket Gateway (5 tasks), Notification Service & Data Model (7 tasks), FCM Integration (6 tasks), Notification Center UI (11 tasks), Notification Preferences (8 tasks), Testing (7 tasks), DevOps & Infrastructure (4 tasks). Total of 48 sub-tasks, well exceeding the 5+ threshold. |
| complexity_scoring | **Fail** | Each sub-task has a "Complexity" label (Low, Medium, High) but there is no scoring on multiple complexity factors. There are no numeric scores for code changes, new concepts, dependencies, testing, or risk. The complexity labels are single-dimension assessments without the factor-based analysis the assertion requires. |
| size_mapping | **Fail** | Hours are summed per component and total story points calculated (39 SP using 1 SP = 4 hrs), but there is no S/M/L/XL size mapping. The story point calculation is a simple hours-to-SP conversion (149 hrs / 4 = ~39 SP) rather than a complexity-score-to-size mapping. No size categories are assigned to individual tasks or the overall feature. |
| risk_multipliers | **Fail** | Section "Risk Assessment" lists 6 risks with Likelihood, Impact, and Mitigation columns, but no numeric risk multipliers are applied to the estimates. The risks are qualitative assessments (e.g., "WebSocket scaling issues: Medium likelihood, High impact") that do not adjust the hour estimates. The 149-hour total and 4-week timeline are presented without any risk-based adjustment. |
| range_estimate | **Pass** | Timeline given as a range across scenarios: 1 developer = ~4 weeks, 2 developers = ~2.5 weeks, 2 developers + QA = ~2 weeks. Individual task estimates are also ranges (e.g., "4 hours" is a point estimate but the timeline scenarios provide range). The total 149 hours is a single number, but the scenario-based timeline provides meaningful range. Borderline, but passing because the scenario table gives a practical range. |
| confidence_level | **Fail** | No confidence level is stated anywhere in the output. There is no "Low/Medium/High" confidence designation and no reasoning about estimation certainty. The risk assessment identifies uncertainties but does not translate them into a confidence level for the overall estimate. |

**Score: 2/6**

### Delta: +4

**Key differences:**
1. **Complexity scoring methodology:** The with-skill output uses a 5-factor scoring model (Code Changes, New Concepts, Dependencies, Testing, Risk) with numeric scores per task. The without-skill output assigns single-word complexity labels (Low/Medium/High) without factor decomposition.
2. **Size mapping:** The with-skill output maps complexity scores to S/M/L/XL sizes with corresponding story point ranges, providing a consistent sizing framework. The without-skill output calculates story points from hours (1 SP = 4 hrs), which is a bottom-up hours estimate repackaged as story points rather than a complexity-driven sizing.
3. **Risk multipliers:** The with-skill output applies specific numeric multipliers (x1.5 for new tech, x1.3 for external APIs, x1.4 for missing test infrastructure) that quantitatively inflate estimates for high-risk tasks. The without-skill output lists risks qualitatively but never adjusts the estimates.
4. **Confidence level:** The with-skill output explicitly states "Medium" confidence with reasoning about what drives certainty up (well-known patterns) and down (Firebase unknowns, service worker compatibility). The without-skill output omits this entirely.
5. **Estimation approach:** The with-skill output follows a top-down complexity-scoring approach: score factors -> map to size -> apply risk multipliers -> produce range. The without-skill output follows a bottom-up hours-accumulation approach: estimate hours per task -> sum totals -> provide timeline scenarios. The top-down approach is more resilient to anchoring bias.
6. **Phasing recommendations:** The with-skill output recommends phasing WebSocket + notification center (2-3 weeks) separately from FCM/push (follow-up phase) to isolate risk. The without-skill output provides a linear 6-phase plan without risk-based phasing. Both recommend spiking FCM early, though the with-skill output is more explicit about why.
7. **Granularity tradeoff:** The without-skill output provides more granular sub-task estimates (48 individual tasks with hour estimates), which can be useful for sprint planning but is more susceptible to precision bias. The with-skill output provides 12 tasks scored on complexity factors, which better communicates uncertainty.

**Overall assessment:** The without-skill output is a detailed bottom-up estimate that would work well for sprint planning by an experienced team. However, it lacks the structured estimation methodology (factor scoring, size mapping, risk multipliers, confidence levels) that the assertion set requires. The with-skill output demonstrates a formal estimation framework that explicitly handles uncertainty, making it more suitable for communicating estimates to stakeholders who need to understand not just "how long" but "how confident are we."

---

## Summary

| Skill | With Score | Without Score | Delta |
|-------|-----------|--------------|-------|
| secrets-scanner | 6/6 | 5/6 | +1 |
| dependency-audit | 6/6 | 3/6 | +3 |
| estimation-skill | 6/6 | 2/6 | +4 |
| **Total** | **18/18** | **10/18** | **+8** |

**Aggregate delta:** +8 assertions across 3 skills.

The largest improvement is in estimation-skill (+4), where the skill enforces a structured methodology (factor scoring, size mapping, risk multipliers, confidence levels) that is absent from the baseline output. Dependency-audit (+3) benefits from concrete findings with reachability analysis versus generic guidance. Secrets-scanner (+1) shows the smallest delta because secret scanning is a well-understood domain where baseline LLM knowledge already covers most assertions, though the skill adds critical rotate-first ordering emphasis and structured findings.
