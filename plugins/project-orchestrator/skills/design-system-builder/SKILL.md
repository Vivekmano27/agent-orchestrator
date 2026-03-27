---
name: design-system-builder
description: "Create component libraries, design tokens, theme systems, and shared UI primitives for consistent cross-app design. Use when building a design system, component library, theme configuration, or shared UI kit. Also use when setting up Tailwind config, creating reusable components, or defining a visual language for a project. Trigger on \"design system\", \"component library\", \"design tokens\", \"theme setup\", \"Storybook\"."
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Design System Builder Skill

Build a complete, themeable design system with tokens, components, and documentation. A design system ensures visual consistency across all screens and makes it easy to build new features without reinventing UI primitives.

## When to Use

- Setting up a new project's visual foundation (colors, spacing, typography)
- Building a shared component library used across multiple pages
- Creating a dark mode / theme switching system
- Defining Tailwind CSS configuration from design tokens
- Building form components, buttons, modals, and other primitives
- Documenting component APIs and usage guidelines

## Design Token Structure

Tokens are the single source of truth for visual properties. Define them as TypeScript constants and derive framework configs from them:

```typescript
// tokens/colors.ts
export const colors = {
  primary: {
    50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe',
    500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
    900: '#312e81',
  },
  gray: {
    50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
    500: '#64748b', 700: '#334155', 900: '#0f172a',
  },
  semantic: {
    success: '#10b981', warning: '#f59e0b',
    error: '#ef4444', info: '#3b82f6',
  },
} as const;

// tokens/spacing.ts
export const spacing = {
  xs: '4px', sm: '8px', md: '16px',
  lg: '24px', xl: '32px', '2xl': '48px',
} as const;

// tokens/typography.ts
export const typography = {
  fontFamily: {
    sans: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  fontSize: {
    xs: '0.75rem', sm: '0.875rem', base: '1rem',
    lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem',
    '3xl': '1.875rem', '4xl': '2.25rem',
  },
} as const;
```

## Tailwind Config from Tokens

```typescript
// tailwind.config.ts
import { colors, spacing, typography } from './tokens';

export default {
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        gray: colors.gray,
        success: colors.semantic.success,
        warning: colors.semantic.warning,
        error: colors.semantic.error,
      },
      spacing,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
    },
  },
} satisfies Config;
```

## Component Template

Every shared component follows this structure:

```tsx
// components/ui/button.tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles applied to all variants
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        ghost: 'hover:bg-gray-100 text-gray-700',
        danger: 'bg-error text-white hover:bg-red-600',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
```

## Theme System (Dark Mode)

```tsx
// providers/theme-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({ theme: 'system', setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.toggle('dark', isDark);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

## Component Inventory

For a new project, build these primitives first (in this order):

| Priority | Component | Variants | Key Behavior |
|----------|-----------|----------|-------------|
| P0 | Button | primary, secondary, ghost, danger + sm/md/lg | Loading state, disabled, focus ring |
| P0 | Input | text, email, password, number | Error state, label, help text |
| P0 | Card | default, interactive, selected | Hover state, click handler |
| P0 | Modal / Dialog | default, confirm, alert | Focus trap, Escape to close, backdrop click |
| P1 | Select / Dropdown | single, multi | Search/filter, keyboard navigation |
| P1 | Table | sortable, selectable | Column resize, pagination |
| P1 | Toast | success, error, warning, info | Auto-dismiss, stack, action button |
| P2 | Tabs | horizontal, vertical | Keyboard nav, active indicator |
| P2 | Tooltip | top, right, bottom, left | Delay, touch support |
| P2 | Avatar | image, initials, icon | Fallback chain, status indicator |

## Anti-Patterns

- **Tokens in component files** — hardcoding `#6366f1` in a component instead of using the token; all visual values must come from the token system
- **Inconsistent naming** — mixing `sm/md/lg` and `small/medium/large` across components; pick one convention and stick to it
- **Missing focus styles** — removing or not adding `focus-visible` rings; keyboard users must see where focus is
- **Non-composable components** — building a `<DataTable>` that can't accept custom cell renderers; components should compose through children and render props
- **Theme-unaware components** — hardcoding colors that don't respect dark mode; use CSS variables or Tailwind dark: prefix
- **No loading/disabled states** — building a Button without `isLoading` and `disabled` variants; every interactive component needs these

## Checklist

- [ ] Design tokens defined (colors, spacing, typography, shadows, radii)
- [ ] Tailwind config extends from token files (not hardcoded)
- [ ] P0 components built (Button, Input, Card, Modal)
- [ ] All components have variants (size, color, state)
- [ ] Focus styles visible on all interactive elements
- [ ] Dark mode supported via ThemeProvider or CSS variables
- [ ] Components use `forwardRef` for DOM access
- [ ] Components accept `className` prop for composition
- [ ] Loading and disabled states implemented on all interactive components
- [ ] Component APIs documented with TypeScript interfaces
