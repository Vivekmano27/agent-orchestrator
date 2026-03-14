---
name: visual-regression
description: Capture and compare UI screenshots before/after changes to detect unintended visual differences. Use when the user mentions "visual regression", "screenshot testing", "UI diff", "visual comparison", or needs to ensure UI changes don't break existing pages.
allowed-tools: Read, Bash, Grep, Glob
---

# Visual Regression Skill

Automated visual comparison testing with Playwright.

## Setup
```typescript
// playwright.config.ts
export default defineConfig({
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01, // 1% tolerance
    },
  },
});
```

## Test Template
```typescript
test('dashboard matches baseline', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('dashboard.png', {
    fullPage: true,
    mask: [page.locator('.dynamic-timestamp')], // mask changing content
  });
});
```
