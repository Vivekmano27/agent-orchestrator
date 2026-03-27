---
name: visual-regression
description: Capture and compare UI screenshots before/after changes to detect unintended visual differences. Use when the user mentions "visual regression", "screenshot testing", "UI diff", "visual comparison", or needs to ensure UI changes don't break existing pages.
allowed-tools: Read, Bash, Grep, Glob
---

# Visual Regression Skill

## Step 1 — Inventory Pages to Test

Scan the codebase for routes/pages that need visual coverage:

```bash
# Next.js App Router pages
find . -path "*/app/**/page.tsx" -o -path "*/app/**/page.jsx" | grep -v node_modules

# Next.js Pages Router
find . -path "*/pages/**/*.tsx" -o -path "*/pages/**/*.jsx" | grep -v node_modules | grep -v "_app\|_document"

# React Router routes
grep -rn "path=\|<Route" --include="*.tsx" --include="*.jsx" | grep -v node_modules

# Vue Router
grep -rn "path:" --include="router*" --include="*.ts" --include="*.js" | grep -v node_modules
```

For each route found, create a visual regression test. Prioritize pages with complex layouts, data tables, dashboards, and landing pages over simple text-only pages.

## Step 2 — Configure Playwright for Visual Testing

Create or update `playwright.config.ts` with visual regression settings:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/visual',
  snapshotDir: './e2e/visual/__snapshots__',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}-{projectName}{ext}',
  updateSnapshots: 'missing', // only create new baselines, never auto-update
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,  // 1% pixel tolerance — catches real regressions
      threshold: 0.2,            // per-pixel color threshold (0-1) — 0.2 handles anti-aliasing
      animations: 'disabled',    // freeze CSS animations/transitions
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'tablet',
      use: { viewport: { width: 768, height: 1024 } },
    },
  ],
  webServer: {
    command: 'npm run dev',       // adjust per project
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

**Constraint:** Always test at minimum desktop (1280px) and mobile (375px) viewports. Single-viewport testing misses responsive layout regressions, which are the most common visual bugs.

## Step 3 — Write Visual Tests

Place tests in `e2e/visual/{page-name}.visual.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

// Helper: wait for all images and fonts to load before screenshot
async function waitForVisualStability(page) {
  await page.waitForLoadState('networkidle');
  // Wait for web fonts — prevents CLS from late-loading fonts
  await page.evaluate(() => document.fonts.ready);
  // Wait for lazy images
  await page.evaluate(() => {
    const images = Array.from(document.images);
    return Promise.all(
      images
        .filter(img => !img.complete)
        .map(img => new Promise(resolve => {
          img.onload = img.onerror = resolve;
        }))
    );
  });
  // Extra settle time for CSS transitions
  await page.waitForTimeout(300);
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Seed deterministic data or mock API responses
    await page.route('**/api/**', route => {
      // Return fixture data to eliminate data-driven flakiness
      const url = route.request().url();
      if (url.includes('/api/stats')) {
        return route.fulfill({ json: { users: 1234, revenue: 56789 } });
      }
      return route.continue();
    });
  });

  test('full page', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot('dashboard-full.png', {
      fullPage: true,
      mask: [
        page.locator('[data-testid="timestamp"]'),
        page.locator('[data-testid="avatar"]'),  // user-specific content
      ],
    });
  });

  test('sidebar collapsed', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[data-testid="sidebar-toggle"]');
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot('dashboard-sidebar-collapsed.png', {
      fullPage: true,
    });
  });

  test('empty state', async ({ page }) => {
    await page.route('**/api/stats', route =>
      route.fulfill({ json: { users: 0, revenue: 0 } })
    );
    await page.goto('/dashboard');
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot('dashboard-empty.png');
  });
});
```

## Step 4 — CI Integration

Add to `.github/workflows/visual-regression.yml`:

```yaml
name: Visual Regression
on:
  pull_request:
    paths:
      - 'src/**'
      - 'app/**'
      - 'components/**'
      - 'styles/**'
      - '*.css'

jobs:
  visual:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium webkit
      - run: npx playwright test --config=playwright.config.ts --project=desktop-chrome --project=mobile-safari
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: visual-regression-diff
          path: |
            e2e/visual/test-results/
          retention-days: 7
```

**Constraint:** Visual regression tests MUST NOT run with `updateSnapshots: 'all'` in CI. Baselines are updated locally and committed. If CI auto-updates baselines, regressions silently pass.

## Step 5 — Baseline Management

Generate baselines locally:

```bash
# First run — creates baseline snapshots
npx playwright test --config=playwright.config.ts --update-snapshots

# Commit baselines to git (they ARE source-controlled)
git add e2e/visual/__snapshots__/
git commit -m "chore: update visual regression baselines"
```

When a test fails in CI:
1. Download the diff artifact (contains `expected`, `actual`, and `diff` images)
2. If the change is intentional, update baselines locally and commit
3. If the change is unintentional, fix the regression

## Output Format

Write to `.claude/specs/{feature}/visual-regression-report.md`:

```markdown
# Visual Regression Report — {Feature Name}

**Date:** {YYYY-MM-DD}
**Baseline commit:** {sha}
**Comparison commit:** {sha}

## Test Inventory

| # | Page | Route | Viewports | States Tested | Status |
|---|------|-------|-----------|---------------|--------|
| 1 | Dashboard | /dashboard | desktop, mobile | full, empty, collapsed sidebar | PASS |
| 2 | Login | /login | desktop, mobile | default, error state | FAIL |

## Failures

### {Page Name} — {viewport}

- **Diff percentage:** {X.XX%}
- **Region affected:** {top-nav / hero / sidebar / footer}
- **Root cause:** {CSS change in `src/styles/nav.css:23` / missing responsive breakpoint / font loading race}
- **Screenshot paths:**
  - Expected: `e2e/visual/__snapshots__/{path}`
  - Actual: `e2e/visual/test-results/{path}`
  - Diff: `e2e/visual/test-results/{path}`

## New Pages Without Coverage

| Route | Priority | Reason |
|-------|----------|--------|
| /settings | High | Complex form layout |
| /about | Low | Static text only |
```

## Constraints

- Always mask dynamic content (timestamps, avatars, random IDs, ads) with `mask` or `css: 'media'` options. A flaky visual test is worse than no test.
- Always mock API data in visual tests. Never screenshot against live/staging data.
- Do not screenshot pages behind authentication without first programmatically logging in via `storageState` or API-based auth. Never use `page.fill` on a login form in every test — it's slow and fragile.
- Name screenshots descriptively: `{page}-{state}-{viewport}.png`, not `screenshot-1.png`.
- If `toHaveScreenshot` fails with >5% diff on first run, the test setup is wrong (animations not disabled, data not mocked). Fix the setup, don't raise the threshold above 2%.

## Anti-Patterns

- **Unmasked dynamic content** — timestamps, avatars, random IDs cause false positives; always mask dynamic regions
- **Live data screenshots** — screenshotting against real API data; mock all data for deterministic results
- **High diff thresholds** — setting maxDiffPixelRatio above 2% to avoid fixing flaky tests; fix the root cause instead
- **Generic screenshot names** — `screenshot-1.png` gives no context; use `{page}-{state}-{viewport}.png`
- **No viewport coverage** — only testing desktop; test mobile and tablet viewports too
- **Login form in every test** — using page.fill for auth in each test; use storageState for session reuse

## Checklist

- [ ] Baseline screenshots generated for all key pages
- [ ] Dynamic content masked (timestamps, avatars, ads)
- [ ] API data mocked for deterministic results
- [ ] Multiple viewports tested (mobile, tablet, desktop)
- [ ] Animations disabled in test configuration
- [ ] Screenshots named descriptively with page-state-viewport convention
- [ ] Diff threshold set at 1-2% (not higher)
- [ ] CI pipeline runs visual regression on PRs
