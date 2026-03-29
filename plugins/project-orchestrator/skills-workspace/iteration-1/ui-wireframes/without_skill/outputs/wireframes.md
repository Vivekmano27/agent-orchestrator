# Admin Dashboard Wireframes

## Table of Contents
1. [Navigation & Layout Structure](#navigation--layout-structure)
2. [Screen 1: Dashboard Overview](#screen-1-dashboard-overview)
3. [Screen 2: User Management](#screen-2-user-management)
4. [Screen 3: Settings Page](#screen-3-settings-page)
5. [Navigation Flow](#navigation-flow)
6. [Responsive Breakpoints](#responsive-breakpoints)
7. [Component States](#component-states)

---

## Navigation & Layout Structure

### Global Layout (Desktop - 1280px+)

```
+------------------------------------------------------------------+
|  [Logo]  Admin Dashboard       [Search...]    [Bell] [Avatar v]  |
+----------+-------------------------------------------------------+
|          |                                                       |
| SIDEBAR  |              MAIN CONTENT AREA                        |
|          |                                                       |
| [#] Dash |                                                       |
| [P] Users|                                                       |
| [G] Sett |                                                       |
|          |                                                       |
|          |                                                       |
|          |                                                       |
|          |                                                       |
|----------|                                                       |
| COLLAPSE |                                                       |
| [<<]     |                                                       |
+----------+-------------------------------------------------------+
```

### Sidebar Navigation Items

```
+------------------------+
|   ADMIN DASHBOARD      |
|   [Logo]               |
+------------------------+
|                        |
|  [#] Dashboard         |  <-- Active: highlighted bg, bold text
|  [P] User Management   |
|  [G] Settings          |
|                        |
|  ---- SEPARATOR ----   |
|                        |
|  [?] Help & Support    |
|  [>] Collapse Sidebar  |
|                        |
+------------------------+
```

- Sidebar width: 240px expanded, 64px collapsed (icon-only)
- Active item: left border accent + background highlight
- Hover: subtle background change

---

## Screen 1: Dashboard Overview

### Desktop Layout (1280px+)

```
+----------+-------------------------------------------------------+
|          |  Dashboard Overview                                   |
| SIDEBAR  |  Welcome back, Admin              [Date Range Picker] |
|          |                                                       |
|          |  +------------+ +------------+ +------------+ +-----+ |
|          |  | Total Users| | Revenue    | | Active     | |Conv | |
|          |  |            | |            | | Sessions   | |Rate | |
|          |  |   12,847   | |  $48,290   | |   1,423    | |3.2% | |
|          |  |  +12.5%    | |  +8.3%     | |  -2.1%     | |+0.4%| |
|          |  |  [^ graph] | |  [^ graph] | |  [v graph] | |[^]  | |
|          |  +------------+ +------------+ +------------+ +-----+ |
|          |                                                       |
|          |  +-----------------------------+ +------------------+ |
|          |  | Revenue Over Time           | | Recent Activity  | |
|          |  |                             | |                  | |
|          |  |    ^                         | | [*] John signed  | |
|          |  |   /|\    /\                  | |     up - 2m ago  | |
|          |  |  / | \  /  \    /\           | |                  | |
|          |  | /  |  \/    \  /  \          | | [$] Payment of   | |
|          |  |/   |        \/    \___       | |     $99 - 5m ago | |
|          |  +----+--+--+--+--+--+--+-     | |                  | |
|          |  Jan Feb Mar Apr May Jun Jul    | | [!] Server alert | |
|          |  |                             | |     - 12m ago    | |
|          |  | [Line] [Bar] [Area]         | |                  | |
|          |  +-----------------------------+ | [*] Emma updated | |
|          |                                  |     profile -15m  | |
|          |                                  |                  | |
|          |                                  | [*] 3 new users  | |
|          |                                  |     joined -30m   | |
|          |                                  |                  | |
|          |                                  | [View All ->]    | |
|          |                                  +------------------+ |
+----------+-------------------------------------------------------+
```

### KPI Card Detail

```
+---------------------------+
|  Total Users         [i]  |   [i] = info tooltip icon
|                           |
|  12,847                   |   <- Primary metric (large, bold)
|  +12.5% vs last month    |   <- Trend indicator (green up / red down)
|  [___/^^^/---/^^^]        |   <- Mini sparkline chart
+---------------------------+
```

### Recent Activity Feed Item

```
+------------------------------------------+
|  [Avatar]  John Smith signed up           |
|            New user registration          |
|            2 minutes ago            [...]  |
+------------------------------------------+
```

---

## Screen 2: User Management

### Desktop Layout (1280px+)

```
+----------+-------------------------------------------------------+
|          |  User Management                                      |
| SIDEBAR  |                                                       |
|          |  +---------------------------------------------------+|
|          |  | [Search users...          ]  [Role v] [Status v]  ||
|          |  |                              [Date Range] [Clear] ||
|          |  +---------------------------------------------------+|
|          |                                                       |
|          |  [+ Add User]  Selected: 3  [Bulk Actions v]          |
|          |                                                       |
|          |  +---------------------------------------------------+|
|          |  | [x] | Name        | Email        |Role  |Status|^ ||
|          |  |-----|-------------|--------------|------|------|--||
|          |  | [x] | John Smith  | john@ex.com  |Admin |Active|..||
|          |  | [ ] | Emma Wilson | emma@ex.com  |User  |Active|..||
|          |  | [x] | Mike Brown  | mike@ex.com  |Editor|Inact.|..||
|          |  | [ ] | Sara Jones  | sara@ex.com  |User  |Pend. |..||
|          |  | [x] | Alex Lee   | alex@ex.com  |Admin |Active|..||
|          |  | [ ] | Lisa Chen  | lisa@ex.com  |User  |Active|..||
|          |  | [ ] | Tom Davis  | tom@ex.com   |Editor|Active|..||
|          |  | [ ] | Amy White  | amy@ex.com   |User  |Susp. |..||
|          |  +---------------------------------------------------+|
|          |                                                       |
|          |  Showing 1-8 of 247 users    [< 1 2 3 ... 31 >]      |
|          |                                                       |
+----------+-------------------------------------------------------+
```

### Search & Filter Bar Detail

```
+----------------------------------------------------------------------+
|                                                                      |
|  [Q Search users by name or email...                              ]  |
|                                                                      |
|  Filters:                                                            |
|  [Role: All Roles  v]  [Status: All  v]  [Joined: Any Time  v]      |
|                                                                      |
|  Active filters: [Admin x] [Active x]          [Clear All Filters]   |
|                                                                      |
+----------------------------------------------------------------------+
```

### Bulk Actions Dropdown

```
+--------------------+
| Bulk Actions    v  |
+--------------------+
| Activate           |
| Deactivate         |
| Change Role >      |
| Export Selected     |
| ---- SEPARATOR --- |
| Delete Selected    |  <-- Red/danger styling
+--------------------+
```

### Row Action Menu (three-dot menu)

```
          +-------------------+
          | View Profile      |
          | Edit User         |
          | Reset Password    |
          | ---- SEPARATOR -- |
          | Suspend User      |
          | Delete User       |  <-- Red/danger
          +-------------------+
```

### Add User Modal

```
+------------------------------------------+
|  Add New User                       [X]  |
|                                          |
|  First Name*                             |
|  [________________________]              |
|                                          |
|  Last Name*                              |
|  [________________________]              |
|                                          |
|  Email*                                  |
|  [________________________]              |
|                                          |
|  Role*                                   |
|  [Select Role           v]              |
|                                          |
|  [ ] Send welcome email                 |
|                                          |
|  [Cancel]              [Create User]     |
+------------------------------------------+
```

---

## Screen 3: Settings Page

### Desktop Layout with Tabs (1280px+)

```
+----------+-------------------------------------------------------+
|          |  Settings                                             |
| SIDEBAR  |                                                       |
|          |  [Profile]  [Notifications]  [Billing]                |
|          |  =========                                            |
|          |                                                       |
|          |  (Tab content rendered below based on active tab)     |
|          |                                                       |
+----------+-------------------------------------------------------+
```

### Tab 1: Profile Settings

```
+----------+-------------------------------------------------------+
|          |  Settings                                             |
| SIDEBAR  |                                                       |
|          |  [Profile]  [Notifications]  [Billing]                |
|          |  =========                                            |
|          |                                                       |
|          |  Profile Information                                  |
|          |  --------------------------------------------------- |
|          |                                                       |
|          |  +--------+                                           |
|          |  |        |  [Upload Photo]  [Remove]                 |
|          |  | Avatar |                                           |
|          |  |  img   |  Max 2MB. JPG, PNG, or GIF.              |
|          |  +--------+                                           |
|          |                                                       |
|          |  First Name*              Last Name*                  |
|          |  [John______________]     [Smith_____________]        |
|          |                                                       |
|          |  Email*                                               |
|          |  [john@example.com__]     (Verified [check])          |
|          |                                                       |
|          |  Phone                                                |
|          |  [+1 555-123-4567___]                                 |
|          |                                                       |
|          |  Bio                                                  |
|          |  [________________________________]                   |
|          |  [________________________________]                   |
|          |  0/250 characters                                     |
|          |                                                       |
|          |  --------------------------------------------------- |
|          |                                                       |
|          |  Change Password                                      |
|          |                                                       |
|          |  Current Password*                                    |
|          |  [************************]    [eye icon]             |
|          |                                                       |
|          |  New Password*                                        |
|          |  [________________________]    [eye icon]             |
|          |  Strength: [====------] Fair                          |
|          |                                                       |
|          |  Confirm Password*                                    |
|          |  [________________________]    [eye icon]             |
|          |                                                       |
|          |                    [Cancel Changes]  [Save Changes]   |
|          |                                                       |
+----------+-------------------------------------------------------+
```

### Tab 2: Notification Settings

```
+----------+-------------------------------------------------------+
|          |  Settings                                             |
| SIDEBAR  |                                                       |
|          |  [Profile]  [Notifications]  [Billing]                |
|          |              ==============                           |
|          |                                                       |
|          |  Email Notifications                                  |
|          |  --------------------------------------------------- |
|          |                                                       |
|          |  Security Alerts                          [ON  (o)]   |
|          |  Login from new device, password changes               |
|          |                                                       |
|          |  Product Updates                          [(o)  OFF]  |
|          |  New features and improvements                        |
|          |                                                       |
|          |  Weekly Reports                           [ON  (o)]   |
|          |  Summary of weekly activity                           |
|          |                                                       |
|          |  Marketing                                [(o)  OFF]  |
|          |  Promotions and offers                                |
|          |                                                       |
|          |  --------------------------------------------------- |
|          |                                                       |
|          |  Push Notifications                                   |
|          |  --------------------------------------------------- |
|          |                                                       |
|          |  New User Signups                         [ON  (o)]   |
|          |  Get notified when new users register                 |
|          |                                                       |
|          |  Payment Received                         [ON  (o)]   |
|          |  Get notified on new payments                         |
|          |                                                       |
|          |  System Alerts                            [ON  (o)]   |
|          |  Critical system notifications                        |
|          |                                                       |
|          |  --------------------------------------------------- |
|          |                                                       |
|          |  Notification Schedule                                |
|          |  [Immediate v]   Quiet hours: [10 PM] to [7 AM]       |
|          |                                                       |
|          |                    [Cancel Changes]  [Save Changes]   |
|          |                                                       |
+----------+-------------------------------------------------------+
```

### Tab 3: Billing Settings

```
+----------+-------------------------------------------------------+
|          |  Settings                                             |
| SIDEBAR  |                                                       |
|          |  [Profile]  [Notifications]  [Billing]                |
|          |                              =========                |
|          |                                                       |
|          |  Current Plan                                         |
|          |  --------------------------------------------------- |
|          |                                                       |
|          |  +------------------------------------------------+  |
|          |  |  PRO PLAN                     $49/month         |  |
|          |  |                                                 |  |
|          |  |  * Up to 10,000 users                           |  |
|          |  |  * Advanced analytics                           |  |
|          |  |  * Priority support                             |  |
|          |  |  * API access                                   |  |
|          |  |                                                 |  |
|          |  |  Next billing: April 15, 2026                   |  |
|          |  |                                                 |  |
|          |  |  [Change Plan]              [Cancel Plan]       |  |
|          |  +------------------------------------------------+  |
|          |                                                       |
|          |  Payment Method                                       |
|          |  --------------------------------------------------- |
|          |                                                       |
|          |  [VISA icon]  **** **** **** 4242   Exp: 12/27        |
|          |               [Edit]  [Remove]  [+ Add New Card]     |
|          |                                                       |
|          |  Billing History                                      |
|          |  --------------------------------------------------- |
|          |                                                       |
|          |  | Date        | Description      | Amount | Status | |
|          |  |-------------|------------------|--------|--------| |
|          |  | Mar 15 2026 | Pro Plan Monthly | $49.00 | Paid   | |
|          |  | Feb 15 2026 | Pro Plan Monthly | $49.00 | Paid   | |
|          |  | Jan 15 2026 | Pro Plan Monthly | $49.00 | Paid   | |
|          |  | Dec 15 2025 | Pro Plan Monthly | $49.00 | Paid   | |
|          |                                                       |
|          |  [Download All Invoices]                              |
|          |                                                       |
+----------+-------------------------------------------------------+
```

---

## Navigation Flow

### Site Map & User Flows

```
                    +-------------------+
                    |    Login Page     |
                    +--------+----------+
                             |
                             v
                    +-------------------+
                    |    Dashboard      |  <-- Default landing page
                    |    Overview       |
                    +--------+----------+
                             |
              +--------------+--------------+
              |                             |
              v                             v
    +-------------------+         +-------------------+
    |  User Management  |         |     Settings      |
    |                   |         |                   |
    |  - Search/Filter  |         |  - Profile Tab   |
    |  - View Table     |         |  - Notif. Tab    |
    |  - Bulk Actions   |         |  - Billing Tab   |
    +--------+----------+         +-------------------+
             |
    +--------+----------+
    |                   |
    v                   v
+----------+    +-----------+
| Add User |    | User      |
| (Modal)  |    | Detail    |
+----------+    | (Modal/   |
                |  Drawer)  |
                +-----------+
```

### Key Navigation Patterns

1. **Sidebar Navigation**: Primary navigation between Dashboard, Users, Settings
2. **Tab Navigation**: Within Settings page (Profile / Notifications / Billing)
3. **Modal Overlays**: Add User, Edit User, Delete Confirmation
4. **Breadcrumbs**: Not needed (flat hierarchy, max 2 levels deep)
5. **Back Navigation**: Browser back button supported via URL routing

### URL Structure

```
/dashboard              -> Dashboard Overview
/users                  -> User Management Table
/users?role=admin       -> Filtered view (query params preserve filters)
/settings               -> Settings (redirects to /settings/profile)
/settings/profile       -> Profile Tab
/settings/notifications -> Notifications Tab
/settings/billing       -> Billing Tab
```

---

## Responsive Breakpoints

### Breakpoint Definitions

| Breakpoint | Width        | Layout Changes                          |
|------------|-------------|-----------------------------------------|
| Desktop    | >= 1280px   | Full sidebar + content                  |
| Laptop     | 1024-1279px | Narrower sidebar (icons + short labels) |
| Tablet     | 768-1023px  | Collapsed sidebar (icon-only, overlay)  |
| Mobile     | < 768px     | Bottom nav or hamburger menu            |

### Tablet Layout (768-1023px)

```
+---+----------------------------------------------------------+
|[=]|  Admin Dashboard          [Search]    [Bell] [Avatar]    |
+---+----------------------------------------------------------+
|                                                              |
|  +------------+ +------------+ +------------+ +----------+  |
|  | Total Users| | Revenue    | | Sessions   | | Conv Rate|  |
|  |   12,847   | |  $48,290   | |   1,423    | |   3.2%   |  |
|  |  +12.5%    | |  +8.3%     | |  -2.1%     | |  +0.4%   |  |
|  +------------+ +------------+ +------------+ +----------+  |
|                                                              |
|  +----------------------------------------------------------+
|  | Revenue Over Time                                        |
|  | (full width chart)                                       |
|  +----------------------------------------------------------+
|                                                              |
|  +----------------------------------------------------------+
|  | Recent Activity (full width, below chart)                |
|  +----------------------------------------------------------+
|                                                              |
+--------------------------------------------------------------+
```

- Sidebar collapses to icon-only (64px) or hidden behind hamburger
- KPI cards: 4 across (narrower) or 2x2 grid
- Chart and activity feed stack vertically (full width each)

### Mobile Layout (< 768px)

```
+------------------------------------------+
|  [=]  Admin Dashboard        [Bell] [Av] |
+------------------------------------------+
|                                          |
|  +----------------+ +----------------+   |
|  | Total Users    | | Revenue        |   |
|  |   12,847       | |  $48,290       |   |
|  |  +12.5%        | |  +8.3%         |   |
|  +----------------+ +----------------+   |
|  +----------------+ +----------------+   |
|  | Sessions       | | Conv Rate      |   |
|  |   1,423        | |   3.2%         |   |
|  |  -2.1%         | |  +0.4%         |   |
|  +----------------+ +----------------+   |
|                                          |
|  +--------------------------------------+|
|  | Revenue Over Time                    ||
|  | (simplified chart, swipeable)        ||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  | Recent Activity                      ||
|  | [*] John signed up - 2m ago          ||
|  | [$] Payment $99 - 5m ago             ||
|  | [!] Server alert - 12m ago           ||
|  | [View All]                           ||
|  +--------------------------------------+|
|                                          |
+------------------------------------------+
|  [#]Dash    [P]Users    [G]Settings      |
+------------------------------------------+
```

- Sidebar replaced with bottom tab navigation
- KPI cards: 2x2 grid
- All content stacks vertically
- Table (User Management) converts to card list on mobile

### Mobile User Management (< 768px)

```
+------------------------------------------+
|  [=]  User Management       [+] [Bell]   |
+------------------------------------------+
|  [Search users...                     ]  |
|  [Filters v]                             |
+------------------------------------------+
|                                          |
|  +--------------------------------------+|
|  | [x] John Smith                       ||
|  |     john@example.com                 ||
|  |     Admin  |  Active       [...]     ||
|  +--------------------------------------+|
|  | [ ] Emma Wilson                      ||
|  |     emma@example.com                 ||
|  |     User   |  Active       [...]     ||
|  +--------------------------------------+|
|  | [ ] Mike Brown                       ||
|  |     mike@example.com                 ||
|  |     Editor |  Inactive     [...]     ||
|  +--------------------------------------+|
|                                          |
|  [Load More]                             |
|                                          |
+------------------------------------------+
|  [#]Dash    [P]Users    [G]Settings      |
+------------------------------------------+
```

### Mobile Settings (< 768px)

```
+------------------------------------------+
|  [<]  Settings              [Bell] [Av]  |
+------------------------------------------+
|  [Profile] [Notif.] [Billing]            |
|  =========                               |
+------------------------------------------+
|                                          |
|  +--------+                              |
|  | Avatar |  [Upload]  [Remove]          |
|  +--------+                              |
|                                          |
|  First Name*                             |
|  [John__________________________]        |
|                                          |
|  Last Name*                              |
|  [Smith_________________________]        |
|                                          |
|  Email*                                  |
|  [john@example.com______________]        |
|                                          |
|  (... remaining fields stack full width) |
|                                          |
|  [Cancel]     [Save Changes]             |
|                                          |
+------------------------------------------+
|  [#]Dash    [P]Users    [G]Settings      |
+------------------------------------------+
```

---

## Component States

### KPI Card States

| State    | Appearance                                              |
|----------|---------------------------------------------------------|
| Loading  | Skeleton placeholder (pulsing gray bars for metric/trend)|
| Loaded   | Full display with metric, trend, and sparkline          |
| Error    | "Failed to load" message with [Retry] button            |
| Hover    | Subtle elevation/shadow increase, cursor pointer        |
| Positive | Green trend arrow up, green percentage text             |
| Negative | Red trend arrow down, red percentage text               |

```
Loading:               Error:                 Hover:
+---------------+     +---------------+      +---------------+
| [____]   [_]  |     | Total Users   |      | Total Users   |
|               |     |               |      |               |
| [________]    |     |  [!] Failed   |      |   12,847      |
| [______]      |     |  to load      |      |  +12.5%       |
| [_________]   |     |  [Retry]      |      | [___/^^^]     |
+---------------+     +---------------+      +~~~~~~~~~~~~~~~+
                                               ^ shadow/lift
```

### Table Row States

| State    | Appearance                                     |
|----------|------------------------------------------------|
| Default  | White background, gray border-bottom            |
| Hover    | Light gray background (#f9fafb)                |
| Selected | Light blue background (#eff6ff), checkbox filled|
| Disabled | Muted text, non-interactive                     |

### Button States

| State    | Primary Button      | Secondary Button   | Danger Button      |
|----------|--------------------|--------------------|---------------------|
| Default  | Blue bg, white text| White bg, gray bdr | White bg, gray bdr  |
| Hover    | Darker blue        | Light gray bg      | Light red bg        |
| Active   | Darkest blue       | Medium gray bg     | Medium red bg       |
| Disabled | Gray bg, muted text| Gray bg, muted text| Gray bg, muted text |
| Loading  | Spinner + "..."    | Spinner + "..."    | Spinner + "..."     |

```
Default:         Hover:           Loading:         Disabled:
[Save Changes]   [Save Changes]   [Saving...]      [Save Changes]
  blue bg          dark blue bg     blue + spin       gray bg
```

### Form Input States

| State       | Appearance                                     |
|-------------|------------------------------------------------|
| Default     | Gray border (#d1d5db), white background         |
| Focus       | Blue border (#3b82f6), blue ring/glow           |
| Filled      | Dark text, gray border                          |
| Error       | Red border (#ef4444), red error text below       |
| Disabled    | Light gray background, muted border              |
| Success     | Green border (#10b981), green checkmark           |

```
Default:                   Focus:                     Error:
+--------------------+    +--------------------+     +--------------------+
| Placeholder text   |    | User input_        |     | bad@               |
+--------------------+    +====================+     +--------------------+
                           blue border + glow         red border
                                                      "Invalid email"
```

### Toggle Switch States

```
OFF:              ON:               Disabled:
+-------+        +-------+         +-------+
| (o)   |        |   (o) |         | (o)   |
+-------+        +-------+         +-------+
 gray bg          blue bg           light gray, no pointer
```

### Modal / Dialog States

| State   | Appearance                                      |
|---------|-------------------------------------------------|
| Opening | Fade in backdrop (0.5s), slide up modal          |
| Open    | Dark backdrop overlay, centered modal, focus trap |
| Closing | Fade out backdrop, slide down modal               |
| Confirm | Destructive actions show warning icon + red button |

```
Delete Confirmation:
+------------------------------------------+
|  [!] Delete User                    [X]  |
|                                          |
|  Are you sure you want to delete         |
|  John Smith? This action cannot be       |
|  undone.                                 |
|                                          |
|  [Cancel]              [Delete User]     |
|                         ^^ red button    |
+------------------------------------------+
```

### Notification Badge States

```
No notifications:    Has notifications:    Many notifications:
    [Bell]              [Bell](3)             [Bell](99+)
```

### Pagination States

```
First page:     Middle page:      Last page:
[< 1 2 3 ... 31 >]   [< ... 14 15 16 ... 31 >]   [< ... 29 30 31 >]
 ^ disabled            both active                   > disabled
```

### Tab States

| State    | Appearance                                     |
|----------|------------------------------------------------|
| Active   | Bold text, bottom border accent (blue, 2px)    |
| Inactive | Normal weight, no bottom border, muted color   |
| Hover    | Slightly darker text, subtle bottom border      |
| Disabled | Muted text, no hover effect, cursor default     |

```
Active:           Inactive:         Hover:
[Profile]         [Notifications]   [Billing]
=========                           ---------
 bold, blue        normal, gray      normal, light underline
```

### Toast / Snackbar Notifications

```
Success:                              Error:
+-------------------------------------+  +-------------------------------------+
| [check] Changes saved successfully  |  | [X] Failed to save. Please retry.   |
|                              [Dismiss]  |                              [Retry]  |
+-------------------------------------+  +-------------------------------------+
  green accent                              red accent
```

### Empty States

```
No users match filters:
+--------------------------------------------------+
|                                                  |
|              [illustration]                      |
|                                                  |
|          No users found                          |
|   Try adjusting your search or filters           |
|                                                  |
|          [Clear Filters]                         |
|                                                  |
+--------------------------------------------------+

No billing history:
+--------------------------------------------------+
|                                                  |
|          No billing history yet                  |
|   Your invoices will appear here                 |
|                                                  |
+--------------------------------------------------+
```

---

## Design Tokens Summary

| Token              | Value                                      |
|--------------------|--------------------------------------------|
| Primary Color      | Blue (#3b82f6)                             |
| Success            | Green (#10b981)                            |
| Warning            | Amber (#f59e0b)                            |
| Danger             | Red (#ef4444)                              |
| Text Primary       | Gray 900 (#111827)                         |
| Text Secondary     | Gray 500 (#6b7280)                         |
| Background         | White (#ffffff)                             |
| Surface            | Gray 50 (#f9fafb)                          |
| Border             | Gray 200 (#e5e7eb)                         |
| Border Radius      | 8px (cards), 6px (inputs), 4px (buttons)   |
| Sidebar Width      | 240px expanded, 64px collapsed             |
| Content Max Width  | 1200px                                     |
| Spacing Scale      | 4px base (4, 8, 12, 16, 24, 32, 48, 64)   |
| Font Family        | Inter (UI), Mono for metrics               |
| Font Sizes         | 12px (caption), 14px (body), 16px (subtitle), 20px (title), 28px (h1) |
