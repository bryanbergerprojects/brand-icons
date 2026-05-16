---
description: React rules — Server/Client boundary, hooks, memoization, deps arrays, list keys
paths:
  - 'apps/docs/**/*.tsx'
  - 'packages/react/**/*.tsx'
  - '**/use*.ts'
---

# React Rules

> **§1 Must follow** — non-negotiable.
> **§2 Conventions** — project style.

---

## §1 Must follow

### 1.1 No data fetching in `useEffect` — Server Components first

Server-side data → Server Component (`async`). `useEffect` + `fetch` on the client causes lost SSR, double fetches in StrictMode, race conditions.

In `apps/docs`, the icon manifest is read at build time. Never wrap it in a client-side fetch.

```tsx
// ❌ Bad
'use client';
const Page = () => {
  const [icons, setIcons] = useState([]);
  useEffect(() => { fetch('/manifest.json').then(r => r.json()).then(setIcons); }, []);
  return <Gallery icons={icons} />;
};

// ✅ Good
import { manifest } from '@brand-icons/core';
const Page = () => <Gallery icons={manifest} />;
```

### 1.2 `'use client'` at the lowest boundary

Mark the smallest interactive leaf, never an entire page. Children passed from Server Components stay server-rendered.

### 1.3 No memoization without a profiler proof

`useMemo` / `useCallback` / `memo` only when a measured bottleneck exists. Default is no memo.

### 1.4 Dependency arrays: primitives only

Destructure primitive fields out of objects when feeding deps.

```tsx
// ❌ Bad — object ref changes every render
useEffect(() => { sync(filters); }, [filters]);

// ✅ Good
useEffect(() => {
  sync({ category: filters.category, size: filters.size });
}, [filters.category, filters.size]);
```

### 1.5 Error feedback, never silent

UI handlers → toast / inline error. Never empty `catch`, never `console.error` alone.

### 1.6 `key` prop: stable id, never `index`

Use `icon.slug` for icon lists, `category.id` for category lists. `index` desyncs state when the list reorders or filters.

### 1.7 No business logic in `apps/docs/components/ui/`

`ui/` is shadcn/ui scaffolding. It receives props and renders. Filters, search, manifest reads → `apps/docs/features/` or page-level components.

---

## §2 Conventions

### 2.1 Declaration & naming

- Props type: `{ComponentName}Props`. Export when consumed by a parent.
- `children` → `PropsWithChildren`.
- Arrow function `const`, never `function` keyword.

```tsx
export type IconCardProps = { icon: IconMeta; onSelect?: (slug: string) => void };
export const IconCard = ({ icon, onSelect }: IconCardProps) => { ... };
```

### 2.2 Composition over props

- Compose (`children`, compound components) before introducing context.
- One responsibility per component.
- Shared logic → custom hook (`use*`).
- Prop drilling > 3 levels → composition or context.

### 2.3 File grouping

- Solo component → kebab-case file: `icon-card.tsx`.
- Compound → folder with `index.tsx`, satellites alongside.
- Components consumed by sibling folders sit at the shared parent.

### 2.4 Event handlers

- Props: `on*` (`onSelect`, `onChange`).
- Implementations: `handle*` (`handleSelect`).

### 2.5 Conditional rendering

Use ternary `cond ? <X /> : null` over `cond && <X />` — `0` and `NaN` render as text otherwise.

### 2.6 Generated React components (`packages/react/src/icons/`)

Generated files. **Never edit by hand.** To change their shape, edit
the template in `tools/build-icons/templates/react/icon.eta` and run
`pnpm build:icons`.

### 2.7 SSR-safe Web Components

`@brand-icons/wc` registers custom elements on import. The docs site
must import it dynamically from a client component to avoid `customElements`
access during SSR.

```tsx
'use client';
import { useEffect } from 'react';
const ImportWc = () => {
  useEffect(() => { void import('@brand-icons/wc'); }, []);
  return null;
};
```
