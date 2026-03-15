---
name: performance-optimizer
description: Profile and optimize: bundle size, lazy loading, query optimization, caching, memory leak detection. Use when the user mentions "Optimize performance", "Speed up", or related tasks.
allowed-tools: Read, Grep, Glob, Bash
---

# Performance Optimizer Skill

Profile and optimize application performance across frontend (React/Next.js, Flutter), backend (NestJS, Django), and infrastructure layers.

## When to Use

- API response times exceed 200ms (p95)
- Page LCP exceeds 2 seconds
- Mobile cold start exceeds 3 seconds
- Bundle size grows beyond acceptable thresholds
- Database queries are slow or N+1 patterns are detected
- Memory usage climbs over time (leak detection)

## Performance Targets (from tech.md)

| Metric | Target |
|--------|--------|
| API response (p95) | < 200ms |
| Page load (LCP) | < 2s |
| Mobile cold start | < 3s |
| AI inference | < 5s |
| Database queries (p95) | < 50ms |

## Frontend: React / Next.js

### Bundle analysis

```bash
cd apps/web
ANALYZE=true npm run build
# or install and configure next/bundle-analyzer
```

```js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer({ /* existing config */ });
```

### Code splitting with dynamic imports

```tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```

### Image optimization

Always use `next/image` instead of raw `<img>` tags:

```tsx
import Image from 'next/image';
<Image src="/hero.png" alt="Hero" width={1200} height={600} priority />
```

### React memoization (use sparingly)

```tsx
// Memoize expensive computations
const sortedItems = useMemo(() => items.sort(compareFn), [items]);

// Memoize callback references passed to child components
const handleClick = useCallback((id: string) => selectItem(id), [selectItem]);

// Memoize components that receive stable props
const ItemRow = React.memo(({ item }: { item: Item }) => (
  <div>{item.name}</div>
));
```

### Virtualized lists for large datasets

```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList height={600} width="100%" itemCount={items.length} itemSize={50}>
  {({ index, style }) => <div style={style}>{items[index].name}</div>}
</FixedSizeList>
```

## Backend: NestJS

### Caching with Redis

```typescript
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: 6379,
      ttl: 300, // seconds
    }),
  ],
})
export class AppModule {}
```

```typescript
@Injectable()
export class UsersService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async findOne(id: string): Promise<User> {
    const cached = await this.cache.get<User>(`user:${id}`);
    if (cached) return cached;

    const user = await this.usersRepository.findOne({ where: { id } });
    await this.cache.set(`user:${id}`, user, 300);
    return user;
  }
}
```

### Connection pooling

Configure PostgreSQL pool size in the ORM connection options:

```typescript
// Prisma: set in DATABASE_URL
// postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10
```

## Backend: Django

### Eliminate N+1 queries

```python
# BAD: N+1 queries
projects = Project.objects.all()
for p in projects:
    print(p.owner.name)  # hits DB each iteration

# GOOD: eager load with select_related (ForeignKey / OneToOne)
projects = Project.objects.select_related('owner').all()

# GOOD: eager load with prefetch_related (ManyToMany / reverse FK)
projects = Project.objects.prefetch_related('tags').all()
```

### Django cache framework

```python
from django.core.cache import cache

def get_trending_projects():
    result = cache.get('trending_projects')
    if result is None:
        result = list(Project.objects.order_by('-score')[:20].values())
        cache.set('trending_projects', result, timeout=600)
    return result
```

### Database indexes

```python
class Project(models.Model):
    slug = models.SlugField(unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['status', '-created_at']),
        ]
```

## Flutter

### Use const constructors to reduce rebuilds

```dart
// GOOD: compile-time constant, never rebuilds unnecessarily
const SizedBox(height: 16);
const Icon(Icons.check, color: Colors.green);
```

### Use ListView.builder for long lists

```dart
// BAD: builds all children at once
ListView(children: items.map((i) => ItemTile(i)).toList());

// GOOD: builds only visible children
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ItemTile(items[index]),
);
```

### Image caching

```dart
// Use cached_network_image package
CachedNetworkImage(
  imageUrl: imageUrl,
  placeholder: (context, url) => const CircularProgressIndicator(),
  errorWidget: (context, url, error) => const Icon(Icons.error),
);
```

## Profiling Tools

| Layer | Tool | Command / Access |
|-------|------|-----------------|
| React | Chrome DevTools Performance | F12 > Performance tab > Record |
| Next.js | Built-in analytics | `next dev --turbo` + Web Vitals |
| NestJS | Clinic.js | `npx clinic doctor -- node dist/main.js` |
| Django | Django Debug Toolbar | Add `debug_toolbar` to `INSTALLED_APPS` |
| Django | django-silk | Request profiling middleware |
| PostgreSQL | `EXPLAIN ANALYZE` | Run in psql or pgAdmin |
| Flutter | DevTools Performance | `flutter run --profile` > DevTools |

## Anti-Patterns

- **Premature optimization** -- profile first, optimize the measured bottleneck
- **Caching without invalidation** -- always define TTL and invalidate on mutation
- **Over-memoization in React** -- `useMemo`/`useCallback` add overhead; only use when re-renders are measured to be costly
- **Missing database indexes** -- add indexes for columns used in WHERE, ORDER BY, and JOIN clauses
- **Unbounded queries** -- always paginate list endpoints; never `SELECT *` without LIMIT
- **Synchronous heavy computation on the main thread** -- offload to Web Workers (frontend) or Celery/Bull queues (backend)
- **Ignoring bundle size** -- monitor with CI checks; set a size budget

## Checklist

- [ ] Profiled before optimizing (data-driven decisions)
- [ ] API endpoints return within 200ms at p95
- [ ] LCP measured below 2 seconds on target devices
- [ ] Database queries use indexes and avoid N+1 patterns
- [ ] Caching layer has TTL and invalidation on writes
- [ ] Bundle size checked and within budget
- [ ] Large lists use virtualization or pagination
- [ ] No synchronous blocking operations on critical paths
