# Estimation: Real-Time Notification System (NestJS + React)

## Step 1: Feature Decomposition

Break the feature into concrete, estimable tasks:

### Tasks:
1. **WebSocket gateway setup** — NestJS Gateway with Socket.IO adapter, connection/disconnection lifecycle, authentication handshake
2. **Notification data model** — Database schema for notifications (type, title, body, read/unread, user_id, timestamps), TypeORM entity, migration
3. **Notification service (backend)** — CRUD operations, mark read/unread, bulk mark-all-read, query with pagination and filters
4. **Notification REST API** — Endpoints for fetching history, marking read, updating preferences (used alongside WebSocket for initial load and fallback)
5. **Real-time emission layer** — Integrate Socket.IO emit into existing business logic (e.g., order events, system alerts) with notification type support (info, warning, error)
6. **Notification center UI (React)** — Bell icon with unread badge, dropdown/panel with notification list, read/unread visual states, infinite scroll or pagination
7. **Notification preferences page (React)** — User preferences form: per-type toggles (info/warning/error), push notification opt-in, delivery channel preferences; backend API for preferences CRUD
8. **WebSocket client integration (React)** — Socket.IO client hook, reconnection logic, optimistic UI updates on receive, context provider for notification state
9. **Firebase Cloud Messaging (FCM) integration** — Firebase Admin SDK setup in NestJS, service worker registration in React, device token management, push payload formatting
10. **Mobile push notification support** — FCM integration for mobile clients (React Native or PWA), token registration endpoint, background/foreground notification handling
11. **Testing** — Unit tests for notification service, WebSocket gateway tests, integration tests for REST endpoints, E2E tests for notification flow, FCM mock tests
12. **Documentation** — API docs for notification endpoints, WebSocket event catalog, FCM setup guide, preference schema docs

---

## Step 2: Score Each Complexity Factor

| Task | Code Changes (files) | New Concepts | Dependencies | Testing | Risk | Score |
|------|---------------------|-------------|-------------|---------|------|-------|
| 1. WebSocket gateway setup | 3-4 files (gateway, module, adapter config) = **2** | Socket.IO + NestJS gateway pattern = **2** | Socket.IO adapter = **1** | Integration tests = **2** | Some unknowns with auth handshake = **2** | **9 (M)** |
| 2. Notification data model | 2-3 files (entity, migration, DTO) = **1** | Standard ORM pattern = **1** | None = **1** | Unit tests = **1** | Well-understood = **1** | **5 (S)** |
| 3. Notification service (backend) | 3-4 files (service, module updates) = **2** | Standard CRUD = **1** | None = **1** | Unit + integration = **2** | Low = **1** | **7 (S)** |
| 4. Notification REST API | 4-5 files (controller, DTOs, guards) = **2** | Standard REST = **1** | Auth guard = **1** | Integration tests = **2** | Low = **1** | **7 (S)** |
| 5. Real-time emission layer | 6-8 files (inject into existing services) = **2** | Event-driven emit pattern = **2** | Touches existing business logic = **2** | Integration + E2E = **3** | Touching existing code = **2** | **11 (L)** |
| 6. Notification center UI | 6-8 files (components, hooks, styles) = **2** | Dropdown/panel UI pattern = **1** | None = **1** | Unit + visual = **2** | Medium (UX polish) = **2** | **8 (M)** |
| 7. Notification preferences page | 5-7 files (page, form, API calls, backend endpoint) = **2** | Preferences schema = **1** | Backend pref API = **2** | Unit + integration = **2** | Some unknowns on preference granularity = **2** | **9 (M)** |
| 8. WebSocket client integration | 3-4 files (hook, context, provider) = **2** | Socket.IO React hook = **2** | Socket.IO client = **1** | Unit tests = **1** | Reconnection edge cases = **2** | **8 (M)** |
| 9. FCM integration (backend) | 4-5 files (service, module, config, token entity) = **2** | Firebase Admin SDK = **2** | External: Firebase = **3** | Mock-based tests = **2** | External dependency = **3** | **12 (L)** |
| 10. Mobile push support | 5-6 files (service worker, token registration, handlers) = **2** | Push API / FCM client = **2** | Firebase + browser Push API = **3** | E2E difficult = **3** | Significant unknowns (mobile browser compat) = **3** | **13 (L)** |
| 11. Testing | 8-12 files = **3** | WebSocket test patterns = **2** | Test infra for WS = **2** | All types = **3** | Medium = **2** | **12 (L)** |
| 12. Documentation | 3-4 files = **1** | None = **1** | None = **1** | None = **1** | Low = **1** | **5 (S)** |

---

## Step 3: Map to Effort

| Task | Score | Size | Story Points | Solo Dev Time |
|------|-------|------|-------------|--------------|
| 1. WebSocket gateway setup | 9 | M | 3-5 | 1-2 days |
| 2. Notification data model | 5 | S | 1-2 | < 4 hours |
| 3. Notification service (backend) | 7 | S | 1-2 | < 4 hours |
| 4. Notification REST API | 7 | S | 1-2 | 4-6 hours |
| 5. Real-time emission layer | 11 | L | 8-13 | 3-5 days |
| 6. Notification center UI | 8 | M | 3-5 | 1-2 days |
| 7. Notification preferences page | 9 | M | 3-5 | 1-2 days |
| 8. WebSocket client integration | 8 | M | 3-5 | 1-2 days |
| 9. FCM integration (backend) | 12 | L | 8-13 | 3-5 days |
| 10. Mobile push support | 13 | L | 8-13 | 3-5 days |
| 11. Testing | 12 | L | 8-13 | 3-5 days |
| 12. Documentation | 5 | S | 1-2 | < 4 hours |

---

## Step 4: Apply Risk Multipliers

| Risk Factor | Multiplier | Applies To | Reasoning |
|-------------|-----------|-----------|-----------|
| New technology | x1.5 | FCM integration (#9, #10) | First time integrating Firebase Admin SDK, service workers, and push notification APIs — significant learning curve and platform-specific gotchas |
| External API dependency | x1.3 | FCM integration (#9, #10) | Firebase has its own auth, token lifecycle, and payload constraints that may not behave as documented |
| No existing tests | x1.4 | WebSocket testing (#11) | WebSocket gateway testing requires specialized test setup (mock Socket.IO clients, async event assertions) that likely doesn't exist yet |

**Compound risk on FCM tasks (#9, #10):** New technology (x1.5) + External API (x1.3) = **x1.5** (use highest, don't multiply — the risks overlap since both stem from Firebase unfamiliarity).

**Overall risk multiplier for feature:** x1.3 (weighted — most tasks are well-understood NestJS/React patterns, but FCM and WebSocket testing introduce meaningful uncertainty).

---

## Step 5: Produce the Estimate

### Task Breakdown Summary

| Task | Base Estimate | Risk-Adjusted |
|------|--------------|---------------|
| 1. WebSocket gateway setup | 1-2 days | 1-2 days |
| 2. Notification data model | 0.25-0.5 days | 0.25-0.5 days |
| 3. Notification service (backend) | 0.25-0.5 days | 0.25-0.5 days |
| 4. Notification REST API | 0.5-0.75 days | 0.5-0.75 days |
| 5. Real-time emission layer | 3-5 days | 3-5 days |
| 6. Notification center UI | 1-2 days | 1-2 days |
| 7. Notification preferences page | 1-2 days | 1-2 days |
| 8. WebSocket client integration | 1-2 days | 1-2 days |
| 9. FCM integration (backend) | 3-5 days | 4.5-7.5 days |
| 10. Mobile push support | 3-5 days | 4.5-7.5 days |
| 11. Testing | 3-5 days | 4-7 days |
| 12. Documentation | 0.25-0.5 days | 0.25-0.5 days |

**Note:** Tasks 1-4 are sequential (backend foundation). Tasks 6-8 can partially overlap with 5. Tasks 9-10 are sequential but can parallel with UI work. Task 11 is partially embedded in each task but has a dedicated hardening phase.

### Final Estimation

| Factor | Score | Reasoning |
|--------|-------|-----------|
| Code Changes | **3** | 40-60+ files across backend gateway, services, controllers, entities, migrations, React components, hooks, context providers, service workers, and tests |
| New Concepts | **2** | Socket.IO gateway pattern (NestJS-specific), Firebase Admin SDK, Push API / service workers — not brand-new architecture but 2-3 new patterns |
| Dependencies | **3** | External: Firebase/FCM (Google cloud service), Socket.IO (real-time transport), Browser Push API; Internal: touches existing business logic for event emission |
| Testing | **3** | Unit tests, WebSocket integration tests (specialized), REST API tests, E2E notification flow tests, FCM mock tests — multiple test types including hard-to-test real-time flows |
| Risk | **2** | Socket.IO and notification CRUD are well-documented; FCM integration and mobile push have meaningful unknowns around token management, platform differences, and service worker lifecycle |
| **Total** | **13** | |
| **Size** | **L (Large) — bordering XL** | |
| **Story Points** | **34-55** | Sum across all 12 tasks |
| **Base Estimate** | **18-30 days** | Summed solo dev time |
| **Risk Multiplier** | **x1.3** | FCM external dependency + new technology for push notifications; WebSocket testing requires new test infrastructure |
| **Final Estimate** | **23-39 days (approx. 5-8 weeks solo dev)** | |
| **Confidence** | **Medium** | WebSocket + notification CRUD is well-understood (high confidence). FCM/push notifications introduce real unknowns — Firebase token lifecycle, service worker compatibility across browsers/devices, and mobile-specific edge cases drag confidence down. The emission layer (#5) risk depends heavily on how many existing services need modification. |

### Assumptions

- NestJS backend and React frontend already exist with established patterns (auth, modules, routing)
- PostgreSQL (or equivalent) is the existing database with TypeORM or Prisma
- Firebase project already exists or can be provisioned quickly
- "Mobile" means either a React Native app or PWA — native iOS/Android SDKs would add 1-2 weeks
- No existing WebSocket infrastructure — this is being built from scratch
- Notification types (info, warning, error) are display-level categories, not separate delivery pipelines
- One developer working solo (no parallelization across developers)
- Code review and deployment time excluded (development effort only)

### Recommendations

1. **Phase the work:** Ship WebSocket + notification center (tasks 1-8) first as a standalone release (~2-3 weeks). Add FCM/push (tasks 9-10) as a follow-up phase — this isolates the highest-risk work.
2. **Spike FCM early:** Spend 2-4 hours on a Firebase push notification proof-of-concept before committing to the full estimate. This will significantly reduce uncertainty on tasks 9-10.
3. **Consider SSE as fallback:** Server-Sent Events are simpler than WebSocket for one-way notification delivery. If bidirectional communication isn't needed, SSE reduces complexity on tasks 1 and 8.

### Checklist

- [x] Feature decomposed into 12 concrete tasks
- [x] Each task scored on all 5 complexity factors
- [x] Mapped to size (S/M/L/XL) and story points
- [x] Risk multipliers applied (x1.5 for FCM tasks, x1.4 for WebSocket testing, x1.3 overall)
- [x] Estimate expressed as a range (23-39 days / 5-8 weeks)
- [x] Confidence level stated with reasoning (Medium)
- [x] Testing effort explicitly included (dedicated task #11 + embedded in each task)
- [x] Assumptions documented (8 assumptions listed)
