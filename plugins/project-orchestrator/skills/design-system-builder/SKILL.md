---
name: design-system-builder
description: Create component libraries, design tokens, theme systems, and shared UI primitives for consistent cross-app design. Use when building a design system, component library, theme configuration, or shared UI kit for React, Vue, Flutter, or any framework.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Design System Builder Skill

Build a complete, themeable design system with tokens, components, and documentation.

## Design Token Structure
```typescript
// tokens/colors.ts
export const colors = {
  primary: {
    50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe',
    500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
    900: '#312e81'
  },
  gray: {
    50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
    500: '#64748b', 700: '#334155', 900: '#0f172a'
  },
  semantic: {
    success: '#10b981', warning: '#f59e0b',
    error: '#ef4444', info: '#3b82f6'
  }
} as const;

// tokens/spacing.ts
export const spacing = {
  xs: '4px', sm: '8px', md: '16px',
  lg: '24px', xl: '32px', '2xl': '48px'
} as const;

// tokens/typography.ts
export const typography = {
  fontFamily: {
    sans: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace"
  },
  fontSize: {
    xs: '0.75rem', sm: '0.875rem', base: '1rem',
    lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem',
    '3xl': '1.875rem', '4xl': '2.25rem'
  }
} as const;
```

## Component Template
```typescript
// components/ui/button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}

// Must include:
// - All variant styles
// - Loading state with spinner
// - Disabled state styling
// - Focus ring for accessibility
// - Keyboard interaction (Enter/Space)
// - aria-label when icon-only
```
