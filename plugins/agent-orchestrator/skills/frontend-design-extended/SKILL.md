---
name: frontend-design-extended
description: Create distinctive frontend interfaces when DELEGATED by the frontend-developer or ui-designer agents. Provides design systems, component architecture, responsive layouts, animations, and accessibility patterns. Do NOT invoke directly for new application requests — those go through project-orchestrator first.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Frontend Design Extended Skill

Create production-grade frontends that avoid generic AI aesthetics.

## Design Thinking Process
1. **Purpose:** What problem does this interface solve?
2. **Tone:** Pick a bold direction — brutally minimal, luxury, playful, editorial, retro-futuristic
3. **Constraints:** Framework, performance, accessibility
4. **Differentiation:** What makes this unforgettable?

## Component Architecture

### Atomic Design Pattern
```
Atoms → Molecules → Organisms → Templates → Pages
  │         │           │           │          │
Button   SearchBar   Header    DashLayout  Dashboard
Input    CardItem    Sidebar   AuthLayout  LoginPage
Icon     FormField   DataGrid  ListLayout  UsersList
```

### Component File Structure
```
components/
├── ui/              → Primitive atoms (Button, Input, Badge)
│   ├── button.tsx
│   ├── button.test.tsx
│   └── button.stories.tsx
├── features/        → Domain-specific organisms
│   ├── task-card/
│   ├── sprint-board/
│   └── user-avatar/
└── layouts/         → Page templates
    ├── dashboard-layout.tsx
    └── auth-layout.tsx
```

## Responsive Breakpoints
```css
/* Mobile-first approach */
--bp-sm: 640px;   /* Small phones → landscape */
--bp-md: 768px;   /* Tablets */
--bp-lg: 1024px;  /* Small laptops */
--bp-xl: 1280px;  /* Desktops */
--bp-2xl: 1536px; /* Large screens */
```

## Color System Template
```css
:root {
  /* Brand */
  --color-primary-50: #eef2ff;
  --color-primary-500: #6366f1;
  --color-primary-900: #312e81;
  
  /* Semantic */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* Surface */
  --color-bg: #ffffff;
  --color-surface: #f8fafc;
  --color-border: #e2e8f0;
  --color-text: #1e293b;
  --color-text-secondary: #64748b;
}

/* Dark mode */
[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-border: #334155;
  --color-text: #f1f5f9;
}
```

## Animation Principles
- **Page load:** Staggered reveals with `animation-delay`
- **Transitions:** 200-300ms for UI, 400-600ms for page transitions
- **Hover states:** Subtle scale (1.02) + shadow lift
- **Loading states:** Skeleton screens, not spinners
- **Reduced motion:** Always respect `prefers-reduced-motion`

## Accessibility Checklist
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible and styled
- [ ] Color contrast ≥ 4.5:1 (AA) for text
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Error messages linked to inputs (aria-describedby)
- [ ] Skip link for main content
- [ ] Respects prefers-reduced-motion
- [ ] Respects prefers-color-scheme
