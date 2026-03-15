---
name: data-visualization
description: Build charts, dashboards, and data-driven UI in React/Next.js using Recharts, Chart.js, or D3. Covers responsive sizing, accessibility, real-time updates, loading states, and error handling.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Data Visualization

## When to Use

- Adding charts, graphs, or dashboards to the React/Next.js frontend
- Choosing between Recharts, Chart.js, and D3 for a visualization need
- Building responsive, accessible data visualizations
- Implementing real-time data dashboards with polling or WebSocket

## Patterns

### Chart Library Selection

| Library | Best For | Trade-off |
|---------|----------|-----------|
| **Recharts** | Standard charts (bar, line, pie, area) | Declarative, React-native, larger bundle |
| **Chart.js** (react-chartjs-2) | Performance-critical, many data points | Canvas-based, imperative config |
| **D3** | Custom/novel visualizations | Steep learning curve, full control |

Default to **Recharts** unless you need canvas performance or a custom visualization.

### Recharts Example

```typescript
"use client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface RevenueChartProps {
  data: { month: string; revenue: number; target: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div role="img" aria-label={`Revenue chart showing ${data.length} months of data`}>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(v: number) => `$${v / 1000}k`} />
          <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, ""]} />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} />
          <Line type="monotone" dataKey="target" stroke="#9ca3af" strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Dashboard Layout (Tailwind CSS Grid)

```typescript
export function DashboardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{children}</div>
  );
}

export function DashboardCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-medium text-gray-500">{title}</h3>
      {children}
    </div>
  );
}
```

### Loading, Empty, and Error States

```typescript
export function ChartWrapper({ isLoading, error, isEmpty, children }: {
  isLoading: boolean; error: Error | null; isEmpty: boolean; children: React.ReactNode;
}) {
  if (isLoading) return <div className="flex h-80 items-center justify-center"><Spinner /></div>;
  if (error) return <div className="flex h-80 items-center justify-center text-red-500">{error.message}</div>;
  if (isEmpty) return <div className="flex h-80 items-center justify-center text-gray-400">No data available</div>;
  return <>{children}</>;
}
```

### Real-Time Updates

Prefer **polling** (simpler, cache-friendly). Use **WebSocket** only for sub-second latency.

```typescript
import { useQuery } from "@tanstack/react-query";

export function useDashboardData(endpoint: string, refetchInterval = 30_000) {
  return useQuery({
    queryKey: ["dashboard", endpoint],
    queryFn: () => fetch(endpoint).then((res) => res.json()),
    refetchInterval,
    staleTime: refetchInterval / 2,
  });
}
```

### Accessibility

- Wrap every chart in `<div role="img" aria-label="...">` with a meaningful summary
- Use color-blind safe palettes (blue/orange, not red/green)
- Provide a data table alternative behind a toggle for screen readers

## Anti-Patterns

- **Using D3 for a simple bar chart** -- Recharts handles standard charts with far less code
- **Fixed pixel dimensions** -- always use `ResponsiveContainer` or CSS-based sizing
- **Red/green color pairs** -- ~8% of men are red-green color blind; use blue/orange
- **No loading or error states** -- charts that silently show nothing confuse users
- **Fetching data inside chart components** -- separate data fetching (hooks) from presentation
- **Polling at < 5s intervals** -- overloads backend; 15-30s is sufficient for dashboards
- **Charts in server components** -- they need browser APIs; mark them `"use client"`

## Checklist

- [ ] Chart library chosen based on complexity (Recharts default, D3 for custom)
- [ ] All charts wrapped in `ResponsiveContainer` or equivalent
- [ ] Loading, error, and empty states handled with `ChartWrapper`
- [ ] `role="img"` and `aria-label` on every chart container
- [ ] Color palette is color-blind safe
- [ ] Data fetching in custom hooks with TanStack Query
- [ ] Dashboard layout uses CSS Grid with responsive breakpoints
- [ ] Real-time dashboards use 30s polling unless sub-second latency needed
- [ ] Chart components are client components (`"use client"`)
