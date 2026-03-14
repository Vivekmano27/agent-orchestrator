---
name: ui-wireframes
description: Create UI wireframes, screen layouts, navigation flows, and component specifications using ASCII art, Mermaid diagrams, and structured markdown. Use when the user needs wireframes, mockups, screen layouts, navigation maps, or UI specifications before building the frontend.
allowed-tools: Read, Write, Grep, Glob
---

# UI Wireframes Skill

Create structured UI specifications that agents can implement directly.

## Screen Layout Template
```markdown
## Screen: [Name] (/route/path)
**Purpose:** [What user does here]
**Auth:** Required | Public
**Layout:** Dashboard | Auth | Full-width

### Wireframe
```
┌─────────────────────────────────────────┐
│  Logo    [Nav Item] [Nav Item]  [Avatar]│ ← Header
├────────┬────────────────────────────────┤
│        │                                │
│ [Link] │  Page Title           [+ New]  │
│ [Link] │  ─────────────────────────     │
│ [Link] │  ┌──────┐ ┌──────┐ ┌──────┐   │
│ [Link] │  │Card 1│ │Card 2│ │Card 3│   │
│        │  └──────┘ └──────┘ └──────┘   │
│        │                                │
│Sidebar │  Content Area                  │
└────────┴────────────────────────────────┘
```

### Components on This Screen
| Component | Data Source | Actions |
|-----------|-----------|---------|
| Header | auth context | logout, profile |
| Sidebar | navigation config | route change |
| Card Grid | GET /api/items | click → detail page |
| New Button | — | opens create modal |

### States
- **Loading:** Skeleton cards (3 placeholders)
- **Empty:** "No items yet. Create your first one!" + CTA
- **Error:** Toast notification with retry button
- **Mobile:** Sidebar collapses to hamburger menu
```

## Navigation Flow (Mermaid)
```mermaid
flowchart TD
    Landing --> Login
    Landing --> Register
    Login --> Dashboard
    Register --> Onboarding
    Onboarding --> Dashboard
    Dashboard --> ProjectList
    ProjectList --> ProjectDetail
    ProjectDetail --> TaskBoard
    TaskBoard --> TaskDetail
```
