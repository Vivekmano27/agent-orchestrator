---
name: code-simplify
description: Review and simplify code — extract reusable utilities, reduce duplication, improve naming, simplify logic, and enhance readability. Use when the user says "simplify", "clean up", "refactor", "reduce complexity", "code smell", or after implementation to improve code quality.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Code Simplify Skill

Review changed code and fix quality issues automatically.

## What to Look For
1. **Duplication** — Extract shared logic into utilities
2. **Complexity** — Simplify nested conditionals, reduce cyclomatic complexity
3. **Naming** — Variables/functions should describe what, not how
4. **Long functions** — Break into smaller, single-responsibility functions
5. **Dead code** — Remove unused imports, variables, functions
6. **Magic numbers** — Extract into named constants
7. **Deep nesting** — Use early returns, guard clauses
8. **Inconsistent patterns** — Align with project conventions

## Refactoring Patterns

### Before: Deep Nesting
```typescript
function processOrder(order) {
  if (order) {
    if (order.items.length > 0) {
      if (order.status === 'pending') {
        // actual logic buried 3 levels deep
      }
    }
  }
}
```

### After: Guard Clauses
```typescript
function processOrder(order) {
  if (!order) return;
  if (order.items.length === 0) return;
  if (order.status !== 'pending') return;
  
  // actual logic at top level
}
```

### Before: Duplication
```typescript
// Same validation in 3 places
const isValidEmail = email => /^[^@]+@[^@]+\.[^@]+$/.test(email);
```

### After: Shared Utility
```typescript
// lib/validation.ts — used everywhere
export const isValidEmail = (email: string): boolean =>
  /^[^@]+@[^@]+\.[^@]+$/.test(email);
```

## Process
1. Run `git diff` to see all changed files
2. For each file, check the 8 quality criteria
3. Fix issues directly — don't just flag them
4. Run tests to verify behavior unchanged
5. Create commit: `refactor(scope): simplify [what was improved]`
