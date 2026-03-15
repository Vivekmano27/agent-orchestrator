---
name: webapp-testing
description: Test web applications using Playwright — E2E tests, UI verification, visual regression, accessibility checks, and cross-browser testing. Use when the user needs "E2E tests", "browser testing", "Playwright", "UI testing", "visual regression", or wants to verify web app behavior.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Web App Testing Skill

Generate Playwright E2E tests using the Page Object Model, structured test files, and CI-ready configuration.

## Constraints

- NEVER use `page.waitForTimeout()` — use `page.waitForSelector()`, `page.waitForURL()`, or `expect().toBeVisible()` with Playwright auto-waiting.
- NEVER use CSS selectors when a role/label/test-id locator exists. Prefer `getByRole()` > `getByLabel()` > `getByTestId()` > CSS.
- NEVER put selectors or URLs as string literals in test bodies — extract them into the Page Object.
- Every test MUST be independently runnable. No test may depend on another test's side effects.
- Every test file MUST clean up its own data (use API calls in `beforeEach`/`afterEach`, not UI clicks).

## Output Format

Write test files to this structure:

```
tests/
  e2e/
    fixtures/
      auth.fixture.ts        # Shared auth state
      test-data.fixture.ts   # Factory functions for test data
    pages/
      login.page.ts          # Page Object per page/component
      dashboard.page.ts
    flows/
      auth.spec.ts           # Tests grouped by user flow
      checkout.spec.ts
    playwright.config.ts
```

## Page Object Model Pattern

```typescript
// tests/e2e/pages/login.page.ts
import { type Locator, type Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.errorAlert = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorAlert).toContainText(message);
  }

  async expectRedirectToDashboard() {
    await expect(this.page).toHaveURL('/dashboard');
  }
}
```

## Fixture Pattern — Authenticated State

```typescript
// tests/e2e/fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

// Store auth state to a file so subsequent tests skip login UI
type AuthFixtures = {
  authenticatedPage: ReturnType<typeof base['page']>;
};

export const test = base.extend<AuthFixtures>({
  storageState: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      process.env.TEST_USER_EMAIL!,
      process.env.TEST_USER_PASSWORD!,
    );
    await page.waitForURL('/dashboard');
    const storage = await context.storageState();
    await context.close();
    await use(storage as any);
  },
});

export { expect } from '@playwright/test';
```

## Test Data Fixture — API Seeding

```typescript
// tests/e2e/fixtures/test-data.fixture.ts
import { test as authenticatedTest } from './auth.fixture';

type TestDataFixtures = {
  seedProject: { id: string; name: string };
};

export const test = authenticatedTest.extend<TestDataFixtures>({
  seedProject: async ({ request }, use) => {
    // Create via API, not UI — faster and independent
    const response = await request.post('/api/projects', {
      data: { name: `test-project-${Date.now()}` },
    });
    const project = await response.json();
    await use(project);
    // Teardown: delete after test
    await request.delete(`/api/projects/${project.id}`);
  },
});
```

## Test File Pattern

```typescript
// tests/e2e/flows/auth.spec.ts
import { test, expect } from '../fixtures/auth.fixture';
import { LoginPage } from '../pages/login.page';

test.describe('Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('redirects to dashboard after valid login', async () => {
    await loginPage.login('user@test.com', 'Password123!');
    await loginPage.expectRedirectToDashboard();
  });

  test('shows inline error for wrong password', async () => {
    await loginPage.login('user@test.com', 'wrong');
    await loginPage.expectError('Invalid credentials');
  });

  test('disables submit while request is in-flight', async ({ page }) => {
    await loginPage.login('user@test.com', 'Password123!');
    await expect(loginPage.submitButton).toBeDisabled();
  });
});
```

## Accessibility Testing

```typescript
// Add as a shared test that runs per-page, not per-flow
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures/auth.fixture';

const pages = ['/', '/dashboard', '/settings', '/projects'];

for (const path of pages) {
  test(`a11y: ${path} has no violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .exclude('.third-party-widget') // Exclude elements you don't control
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
```

## Playwright Config for CI

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/flows',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',          // Capture trace only on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // Mobile viewport — catches responsive bugs
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: process.env.CI
    ? undefined  // CI starts the server separately
    : {
        command: 'npm run dev',
        port: 3000,
        reuseExistingServer: true,
      },
});
```

## CI GitHub Actions Config

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps chromium firefox
      - run: npm run build
      - run: npx playwright test
        env:
          BASE_URL: http://localhost:3000
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

## Visual Regression Pattern

```typescript
// Snapshot testing — only use for stable, design-finalized pages
test('settings page matches snapshot', async ({ page }) => {
  await page.goto('/settings');
  // Wait for all images/fonts to load before snapshot
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('settings.png', {
    maxDiffPixelRatio: 0.01,  // Allow 1% pixel difference (font rendering)
    fullPage: true,
  });
});
```
