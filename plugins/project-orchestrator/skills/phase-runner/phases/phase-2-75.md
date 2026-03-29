# Phase 2.75: Prototype

**Executor:** ui-designer agent (subagent, foreground)

## Preconditions
- `.claude/specs/[feature]/design.md` exists (Phase 2)
- `.claude/specs/[feature]/api-spec.md` exists (Phase 2)
- `.claude/specs/[feature]/spec-reconciliation.md` exists with no unresolved CRITICAL findings (Phase 2.05)
- `.claude/specs/[feature]/tasks.md` exists (Phase 2.1)
- Git feature branch created (Phase 2.5)

## Dispatch Instructions

**Check if frontend exists in project-config.md.** If no frontend AND no mobile → skip this phase.

```
Agent(
  subagent_type="project-orchestrator:ui-designer",
  prompt="BUILD A WORKING PROTOTYPE with dummy data so the user can click through every flow before real implementation.

          Spec directory: .claude/specs/[feature]/
          Read: design.md (layouts, components, tokens), api-spec.md (endpoint shapes for dummy data),
                requirements.md (user stories to cover), ux.md (user flows and navigation).

          WEB PROTOTYPE (if web frontend in project-config.md):
          - Design system: tokens, theme config, tailwind setup
          - Base layout: shell, navigation, header, footer, sidebar
          - ALL screens from design.md with dummy/hardcoded data
          - Working navigation between all screens
          - One complete page with realistic content as a reference pattern
          - Responsive — works on mobile viewport too

          MOBILE PROTOTYPE (if Flutter in project-config.md):
          - App entry point with theme matching design.md
          - Navigation structure (tab bar / drawer / stack)
          - ALL screen routes defined with shared widgets
          - Dummy data on every screen
          - Working navigation between screens

          KMP PROTOTYPE (if KMP in project-config.md):
          - Shared module with dummy data models
          - Compose Multiplatform UI with navigation
          - All screens with placeholder content

          RULES:
          - Use DUMMY DATA only — no real API calls, no backend dependency
          - Every user story from requirements.md must have a clickable screen
          - Follow design.md exactly for layouts, spacing, colors
          - Code should be clean enough to build on top of (not throwaway)
          - Commit as: feat(prototype): working UI prototype with dummy data

          After building, present to user via AskUserQuestion:
          'Prototype is ready. Run the app and click through every flow.
           What would you like to do?'
          Options: Approve / Found issues / Need to see specific screens"
)
```

Wait for completion.

**After user reviews the prototype:**

If user says "Found issues":
1. Ask what's wrong (AskUserQuestion, free text)
2. Classify: is it a SPEC issue (wrong flow, missing screen) or a PROTOTYPE issue (layout wrong, styling off)?
3. For SPEC issues → re-dispatch affected design agents to update specs, then rebuild prototype
4. For PROTOTYPE issues → re-dispatch ui-designer to fix the prototype
5. Re-present for review

Max 3 review rounds. After that, proceed with whatever the user approves.

## Expected Outputs
- Working prototype code committed to feature branch
- For web: `apps/web/` has base layout + all screens with dummy data
- For mobile: `apps/mobile-flutter/` or `apps/mobile-kmp/` has app shell + all screens
- User approved the prototype

## Content Validation
- At least one committed file exists in `apps/web/` or `apps/mobile-*/`
- User explicitly approved (via AskUserQuestion response)

## Conditional Logic
- **Skip entirely** if no frontend AND no mobile in project-config.md (API-only project)
- **Web only** if no mobile in project-config.md
- **Mobile only** if no web frontend in project-config.md
- **SMALL tasks**: Build only the affected screens, not the full app prototype
