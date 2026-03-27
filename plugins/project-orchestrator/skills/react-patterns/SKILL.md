---
name: react-patterns
description: "Implement React best practices when DELEGATED by the frontend-developer or senior-engineer agents — hooks patterns, server components, client components, state management with Zustand/Context, data fetching with TanStack Query, form handling with React Hook Form + Zod, error boundaries, and performance optimization. Not a standalone entry point for building applications. Use when implementing React/Next.js features, building UI components, managing state, or optimizing frontend performance."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# React Patterns Skill

Modern React patterns for production applications using Next.js App Router, TypeScript, and the latest React APIs.

## When to Use

- Implementing React components with proper TypeScript typing
- Setting up state management (Zustand for client state, TanStack Query for server state)
- Building forms with validation
- Adding error boundaries and loading states
- Optimizing re-renders and bundle size
- Working with React Server Components vs Client Components

## Server Components vs Client Components

The default in Next.js App Router is Server Components. Only add `'use client'` when you need interactivity:

```tsx
// app/products/page.tsx — Server Component (default, no directive needed)
// Can: fetch data directly, access DB, read files, use async/await
// Cannot: use hooks, event handlers, browser APIs
export default async function ProductsPage() {
  const products = await db.product.findMany();

  return (
    <div>
      <h1>Products</h1>
      <ProductGrid products={products} />
      <AddProductButton /> {/* Client component for interactivity */}
    </div>
  );
}
```

```tsx
// components/AddProductButton.tsx — Client Component (needs 'use client')
'use client';

import { useState } from 'react';

export function AddProductButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Add Product</button>
      {isOpen && <AddProductModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
```

**Rule of thumb:** Push `'use client'` as far down the component tree as possible. A page can be a server component with small client component islands for interactivity.

## Component Pattern

```tsx
// Prefer function components with explicit TypeScript interfaces
interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  isEditable?: boolean;
}

export function TaskCard({ task, onComplete, isEditable = false }: TaskCardProps) {
  const handleComplete = useCallback(() => {
    onComplete(task.id);
  }, [task.id, onComplete]);

  return (
    <article aria-label={`Task: ${task.title}`}>
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      {isEditable && (
        <button onClick={handleComplete} aria-label={`Complete task: ${task.title}`}>
          Complete
        </button>
      )}
    </article>
  );
}
```

## State Management

### Zustand (Client State)

Use Zustand for UI state that doesn't come from the server (modals, filters, sidebar state):

```typescript
// stores/ui-store.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeFilter: string;
  toggleSidebar: () => void;
  setFilter: (filter: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeFilter: 'all',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setFilter: (filter) => set({ activeFilter: filter }),
}));
```

### TanStack Query (Server State)

Use TanStack Query for data that comes from APIs — it handles caching, refetching, and loading states:

```typescript
// hooks/use-products.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => api.products.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.products.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Usage in a component
function ProductList() {
  const { data: products, isLoading, error } = useProducts();
  const createProduct = useCreateProduct();

  if (isLoading) return <ProductListSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!products?.length) return <EmptyState message="No products yet" />;

  return products.map((p) => <ProductCard key={p.id} product={p} />);
}
```

## Custom Hook Pattern

```tsx
// hooks/use-debounced-value.ts
function useDebouncedValue<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

// hooks/use-async.ts — generic async state handler
function useAsync<T>(asyncFn: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<{
    data: T | null;
    error: Error | null;
    isLoading: boolean;
  }>({ data: null, error: null, isLoading: true });

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true }));

    asyncFn()
      .then((data) => { if (!cancelled) setState({ data, error: null, isLoading: false }); })
      .catch((error) => { if (!cancelled) setState({ data: null, error, isLoading: false }); });

    return () => { cancelled = true; };
  }, deps);

  return state;
}
```

## Form Handling (React Hook Form + Zod)

```tsx
// components/CreateProductForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  price: z.number().positive('Price must be positive'),
  category: z.enum(['electronics', 'clothing', 'food']),
  description: z.string().max(500).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export function CreateProductForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const onSubmit = async (data: ProductFormData) => {
    await api.products.create(data);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" {...register('name')} aria-invalid={!!errors.name} />
        {errors.name && <p role="alert">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="price">Price</label>
        <input id="price" type="number" step="0.01" {...register('price', { valueAsNumber: true })} />
        {errors.price && <p role="alert">{errors.price.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  );
}
```

## Error Boundary

```tsx
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', { error: error.message, componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <div>Something went wrong. Please try again.</div>;
    }
    return this.props.children;
  }
}
```

## Performance Optimization

1. **Memoize expensive computations:** `useMemo` for derived data that's costly to recompute
2. **Stable callbacks:** `useCallback` for functions passed to memoized children
3. **Lazy load routes:** `React.lazy()` + `Suspense` for code-split pages
4. **Virtualize long lists:** `@tanstack/react-virtual` for lists > 100 items
5. **Avoid prop drilling:** Zustand or Context for truly global state; composition for the rest
6. **Image optimization:** Use `next/image` with explicit width/height for layout stability

```tsx
// Lazy loading example
const SettingsPage = React.lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SettingsPage />
    </Suspense>
  );
}
```

## Anti-Patterns

- **`'use client'` at the page level** — makes the entire page a client component, losing SSR benefits; push client directives down to the smallest interactive component
- **Fetching in useEffect** — for server data, use TanStack Query or server components; raw useEffect fetching loses caching, deduplication, and loading state management
- **Prop drilling through 4+ levels** — signals that state should be lifted into Zustand or Context, not passed through intermediary components
- **Inline object/function creation in JSX** — `style={{...}}` or `onClick={() => fn(x)}` creates new references every render; extract to variables or use useCallback
- **Missing loading/error/empty states** — every data-driven component needs all three states handled; users staring at blank screens is a bug
- **Giant components** — a component over 200 lines should be split; each component should have one clear responsibility

## Checklist

- [ ] Server Components used by default; `'use client'` only where interactivity is needed
- [ ] Server state managed with TanStack Query (not raw useEffect)
- [ ] Client state managed with Zustand (not prop drilling or excessive Context)
- [ ] Forms use React Hook Form + Zod for validation
- [ ] Error boundaries placed at route level and around critical sections
- [ ] Loading states shown with skeletons (not spinners) for layout stability
- [ ] Empty states handled with helpful messages and CTAs
- [ ] Long lists virtualized with @tanstack/react-virtual
- [ ] Images use next/image with explicit dimensions
- [ ] All interactive elements have proper aria labels
