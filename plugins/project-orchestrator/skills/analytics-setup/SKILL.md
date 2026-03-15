---
name: analytics-setup
description: Set up privacy-first application analytics for web (React/Next.js) and mobile (Flutter) with PostHog, event tracking architecture, consent management, and server-side tracking from NestJS.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Analytics Setup

## When to Use

- Adding analytics or event tracking to web, mobile, or backend services
- Designing an event taxonomy for product metrics
- Implementing GDPR-compliant consent management
- Adding server-side event tracking from NestJS

## Patterns

### Event Naming Convention

Use `snake_case` with `category.action` format: `user.signed_up`, `project.created`, `page.viewed`, `payment.completed`. Group by domain. Never use camelCase or free-form strings.

### PostHog Integration (React / Next.js)

```typescript
// lib/analytics/posthog-provider.tsx
"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
      capture_pageview: false, // manual tracking for App Router
      mask_all_text: true,
      mask_all_element_attributes: true,
    });
  }, []);
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
```

Identify users after auth (non-PII properties only):

```typescript
posthog.identify(user.id, { plan: user.plan, created_at: user.createdAt });
```

### Consent Management

```typescript
type ConsentStatus = "granted" | "denied" | "pending";

export function setConsent(status: ConsentStatus) {
  localStorage.setItem("analytics_consent", status);
  status === "granted" ? posthog.opt_in_capturing() : posthog.opt_out_capturing();
}
```

Always check consent before initializing analytics. Strip PII from all event properties.

### Mobile Analytics (Flutter)

```dart
class AnalyticsService {
  final Posthog _posthog = Posthog();

  Future<void> trackEvent(String event, {Map<String, dynamic>? properties}) async {
    await _posthog.capture(eventName: event, properties: properties);
  }

  Future<void> identify(String userId, {Map<String, dynamic>? traits}) async {
    await _posthog.identify(userId: userId, userProperties: traits);
  }
}
```

### Server-Side Tracking (NestJS)

```typescript
@Injectable()
export class AnalyticsService {
  private client: PostHog;

  constructor(private config: ConfigService) {
    this.client = new PostHog(this.config.get("POSTHOG_API_KEY")!, {
      host: this.config.get("POSTHOG_HOST"),
    });
  }

  capture(userId: string, event: string, properties?: Record<string, unknown>) {
    this.client.capture({ distinctId: userId, event, properties });
  }
}
```

## Anti-Patterns

- **Free-form event names** -- causes duplicates (`userSignedUp` vs `user_signup`)
- **Tracking PII in events** -- violates GDPR; use user IDs only, never emails or names
- **Initializing analytics before consent** -- check consent before `posthog.init`
- **`capture_pageview: true` with App Router** -- causes duplicate pageviews; track manually
- **Skipping server-side tracking** -- client-side misses ad-blockers and backend events
- **Hardcoding API keys** -- use environment variables

## Checklist

- [ ] Events follow `snake_case` `category.action` convention
- [ ] PostHog initialized with privacy defaults (`mask_all_text`, `mask_all_element_attributes`)
- [ ] Consent banner gates analytics; disabled until user consents
- [ ] `posthog.identify()` called after login with non-PII properties only
- [ ] Pageview tracking is manual for Next.js App Router
- [ ] Flutter analytics service injected via Riverpod provider
- [ ] Server-side tracking configured in NestJS for backend events
- [ ] API keys stored in environment variables, not source code
- [ ] Event schema documented in `docs/analytics-events.md`
