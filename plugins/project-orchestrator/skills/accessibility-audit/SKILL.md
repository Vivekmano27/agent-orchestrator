---
name: accessibility-audit
description: Validate WCAG 2.1 AA/AAA compliance — ARIA labels, keyboard navigation, color contrast, screen reader support, focus management, and semantic HTML. Use when the user mentions "accessibility", "WCAG", "a11y", "screen reader", "keyboard navigation", or needs to make their app accessible to all users.
allowed-tools: Read, Bash, Grep, Glob
---

# Accessibility Audit Skill

## Step 1 — Static Analysis (Grep-Based)

Scan the codebase for common violations before running any tools:

```bash
# Images without alt attributes
grep -rn "<img" --include="*.tsx" --include="*.jsx" --include="*.html" --include="*.vue" | grep -v "alt="

# Click handlers on non-interactive elements (div, span)
grep -rn "onClick\|@click\|v-on:click" --include="*.tsx" --include="*.jsx" --include="*.vue" | grep -i "div\|span" | grep -v "role="

# Autofocus (disorienting for screen reader users)
grep -rn "autoFocus\|autofocus" --include="*.tsx" --include="*.jsx" --include="*.html" --include="*.vue"

# Positive tabindex (breaks natural tab order)
grep -rn 'tabIndex=.[1-9]\|tabindex="[1-9]' --include="*.tsx" --include="*.jsx" --include="*.html" --include="*.vue"

# Missing form labels — inputs without associated labels
grep -rn "<input\|<select\|<textarea" --include="*.tsx" --include="*.jsx" --include="*.html" | grep -v "aria-label\|aria-labelledby\|id="

# Missing lang attribute on html
grep -rn "<html" --include="*.html" --include="*.tsx" --include="*.jsx" | grep -v 'lang='

# Inline styles that hide focus outlines
grep -rn "outline.*none\|outline.*0\|\:focus.*outline" --include="*.css" --include="*.scss" --include="*.tsx" --include="*.jsx"
```

## Step 2 — Automated Testing with axe-core + Playwright

Create `e2e/a11y/{page}.a11y.spec.ts` for each page:

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Shared a11y assertion — use on every page
async function runAxeAudit(page, options?: { exclude?: string[] }) {
  const excludeSelectors = options?.exclude ?? [];
  let builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])  // WCAG 2.1 AA
    .disableRules([
      'color-contrast',  // re-enable after fixing known issues; disable only if you have a tracking issue
    ]);

  for (const sel of excludeSelectors) {
    builder = builder.exclude(sel);
  }

  const results = await builder.analyze();

  // Format violations for readable test output
  const violations = results.violations.map(v => ({
    rule: v.id,
    impact: v.impact,
    description: v.description,
    nodes: v.nodes.map(n => n.html).slice(0, 3), // first 3 offending elements
  }));

  expect(violations, `axe found ${violations.length} violations`).toEqual([]);
}

test.describe('Dashboard accessibility', () => {
  test('passes axe audit', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await runAxeAudit(page);
  });

  test('passes axe audit in dark mode', async ({ page }) => {
    await page.goto('/dashboard');
    // Toggle dark mode — contrast ratios often fail here
    await page.click('[data-testid="theme-toggle"]');
    await runAxeAudit(page);
  });
});
```

**Install dependency:**
```bash
npm install -D @axe-core/playwright
```

**Constraint:** Never disable axe rules without filing a tracking issue. The `disableRules` array must have a comment explaining why each rule is disabled and a link to the issue that will re-enable it.

## Step 3 — Keyboard Navigation Testing

Test every interactive flow with keyboard only. Create `e2e/a11y/keyboard.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Keyboard navigation', () => {
  test('tab order follows visual order on main page', async ({ page }) => {
    await page.goto('/');
    const focusOrder: string[] = [];

    // Tab through the page and record focus order
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.getAttribute('data-testid') ? '[' + el.getAttribute('data-testid') + ']' : ''}` : 'none';
      });
      focusOrder.push(focused);
      // Stop if we've tabbed past the page (focus returns to browser chrome)
      if (focused === 'body' || focused === 'none') break;
    }

    // Verify skip-nav link is first focusable element
    expect(focusOrder[0]).toContain('skip');
  });

  test('modal traps focus correctly', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="open-modal"]');
    await page.waitForSelector('[role="dialog"]');

    // Tab through all modal elements
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return dialog?.contains(document.activeElement) ?? false;
      });
      expect(focused, `Tab ${i}: focus escaped modal`).toBe(true);
    }

    // Escape closes the modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('dropdown menu navigable with arrow keys', async ({ page }) => {
    await page.goto('/');
    // Focus the dropdown trigger
    await page.focus('[data-testid="menu-trigger"]');
    await page.keyboard.press('Enter');
    await expect(page.locator('[role="menu"]')).toBeVisible();

    // Arrow down moves through items
    await page.keyboard.press('ArrowDown');
    const firstItem = await page.evaluate(() =>
      document.activeElement?.getAttribute('role')
    );
    expect(firstItem).toBe('menuitem');

    // Escape closes
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="menu"]')).not.toBeVisible();
  });
});
```

## Step 4 — Keyboard Navigation Checklist (Manual Verification)

For each interactive component, verify:

| Component Type | Required Keyboard Behavior |
|---|---|
| Button | `Enter` and `Space` activate |
| Link | `Enter` activates, visible focus ring |
| Modal/Dialog | Focus trapped inside, `Escape` closes, focus returns to trigger on close |
| Dropdown menu | `Enter`/`Space` opens, `ArrowDown`/`ArrowUp` navigate, `Escape` closes |
| Tabs | `ArrowLeft`/`ArrowRight` switch tabs, `Tab` moves to tab panel content |
| Accordion | `Enter`/`Space` toggle, `ArrowDown`/`ArrowUp` move between headers |
| Form | `Tab` moves between fields, `Enter` submits, errors announced by screen reader |
| Toast/Alert | `role="alert"` or `aria-live="polite"` so screen readers announce it |
| Autocomplete | `ArrowDown` into suggestions, `Enter` selects, `Escape` dismisses |

## Output Format

Write to `.claude/specs/{feature}/a11y-report.md`:

```markdown
# Accessibility Audit Report — {Feature Name}

**Date:** {YYYY-MM-DD}
**Standard:** WCAG 2.1 AA
**Pages tested:** {count}
**Axe violations found:** {count}
**Keyboard issues found:** {count}

## Summary

| Severity | Count |
|----------|-------|
| Critical (blocks users) | {n} |
| Serious (major barrier) | {n} |
| Moderate (inconvenient) | {n} |
| Minor (best practice) | {n} |

## Static Analysis Findings

| # | Pattern | Files Affected | Fix |
|---|---------|----------------|-----|
| 1 | Images without alt text | `src/components/Card.tsx:15`, `src/components/Hero.tsx:8` | Add descriptive alt or alt="" if decorative |
| 2 | onClick on div without role | `src/components/Sidebar.tsx:42` | Change to `<button>` or add `role="button" tabIndex={0} onKeyDown={handleEnter}` |

## Axe Audit Results

### {Page Name} — {route}

| Rule | Impact | Elements | Fix |
|------|--------|----------|-----|
| color-contrast | serious | `.nav-link` (3 instances) | Change color from `#777` to `#595959` for 4.5:1 ratio against `#fff` |
| button-name | critical | `button.icon-btn` (2 instances) | Add `aria-label="Close dialog"` |

## Keyboard Navigation Results

| Flow | Status | Issue |
|------|--------|-------|
| Main nav tab order | PASS | — |
| Settings modal focus trap | FAIL | Focus escapes to background when Shift+Tab from first element |
| Dropdown menu arrow keys | FAIL | ArrowDown does not move focus to menu items |

## Remediation Priority

1. **Critical** — {description, file:line, exact fix}
2. **Serious** — {description, file:line, exact fix}
3. **Moderate** — {description, file:line, exact fix}
```

## Constraints

- Never approve a page as "accessible" based only on axe results. Axe catches ~30-40% of WCAG violations. Keyboard testing and semantic HTML review are mandatory.
- Every `onClick` on a `<div>` or `<span>` is a finding. The fix is always: use `<button>` if it triggers an action, `<a>` if it navigates. Adding `role="button"` to a div is a last resort, not a first choice.
- Do not add `aria-label` to elements that already have visible text. Redundant ARIA is a violation (WCAG 4.1.2). Use `aria-label` only for icon-only buttons and inputs without visible labels.
- When reporting color contrast violations, always include the specific hex values and the required ratio. "Low contrast" without numbers is not actionable.
- Do not count the same component rendered multiple times as multiple violations. `Card.tsx` missing alt text is one finding, regardless of how many times `<Card>` is rendered on a page.

## Anti-Patterns

- **Axe-only audits** — automated tools catch 30-40% of issues; keyboard testing and semantic HTML review are mandatory
- **Decorative ARIA** — adding aria-label to elements with visible text; redundant ARIA is itself a violation (WCAG 4.1.2)
- **div with onClick** — using div/span as buttons; always use semantic elements (button, a) instead of role="button"
- **Color-only indicators** — using red/green only for status; always pair color with icons or text
- **Skipping keyboard testing** — assuming mouse-accessible means keyboard-accessible; test Tab, Enter, Escape, Arrow flows
- **Vague contrast findings** — reporting "low contrast" without hex values and ratios; include specific numbers
