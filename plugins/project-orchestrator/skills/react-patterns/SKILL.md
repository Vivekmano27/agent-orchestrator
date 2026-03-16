---
name: react-patterns
description: Implement React best practices when DELEGATED by the frontend-developer or senior-engineer agents — hooks patterns, server components, state management, error boundaries, performance optimization. Not a standalone entry point for building applications.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# React Patterns Skill

Modern React patterns for production applications.

## Component Pattern
```tsx
// Prefer function components with TypeScript
interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  isEditable?: boolean;
}

export function TaskCard({ task, onComplete, isEditable = false }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleComplete = useCallback(() => {
    onComplete(task.id);
  }, [task.id, onComplete]);

  return (
    <div role="article" aria-label={`Task: ${task.title}`}>
      {/* Component content */}
    </div>
  );
}
```

## Custom Hook Pattern
```tsx
// Extract reusable logic into hooks
function useAsync<T>(asyncFn: () => Promise<T>, deps: any[] = []) {
  const [state, setState] = useState<{
    data: T | null;
    error: Error | null;
    isLoading: boolean;
  }>({ data: null, error: null, isLoading: true });

  useEffect(() => {
    let cancelled = false;
    setState(prev => ({ ...prev, isLoading: true }));
    
    asyncFn()
      .then(data => { if (!cancelled) setState({ data, error: null, isLoading: false }); })
      .catch(error => { if (!cancelled) setState({ data: null, error, isLoading: false }); });
    
    return () => { cancelled = true; };
  }, deps);

  return state;
}
```

## Error Boundary
```tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
```

## Performance Rules
1. **Memoize expensive computations:** `useMemo` for derived data
2. **Stable callbacks:** `useCallback` for functions passed to children
3. **Lazy load routes:** `React.lazy()` + `Suspense`
4. **Virtualize long lists:** react-window or tanstack-virtual
5. **Avoid prop drilling:** Context for truly global state, composition for the rest
