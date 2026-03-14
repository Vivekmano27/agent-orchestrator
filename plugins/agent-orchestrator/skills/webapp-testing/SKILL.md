---
name: webapp-testing
description: Test web applications using Playwright — E2E tests, UI verification, visual regression, accessibility checks, and cross-browser testing. Use when the user needs "E2E tests", "browser testing", "Playwright", "UI testing", "visual regression", or wants to verify web app behavior.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Web App Testing Skill

Automated browser testing with Playwright.

## E2E Test Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@test.com');
    await page.fill('[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'wrong@test.com');
    await page.fill('[name="password"]', 'wrong');
    await page.click('button[type="submit"]');
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});
```

## Accessibility Testing
```typescript
import AxeBuilder from '@axe-core/playwright';

test('should pass accessibility checks', async ({ page }) => {
  await page.goto('/dashboard');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```
