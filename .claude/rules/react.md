---
description: React rules — Astro Islands boundary, hooks, memoization, deps arrays, list keys
paths:
  - 'apps/docs/**/*.tsx'
  - 'packages/react/**/*.tsx'
  - '**/use*.ts'
---

# React Rules

> **§1 Must follow** — non-negotiable.
> **§2 Conventions** — project style.
> Astro page structure → `astro.md`. Component split → `components.md`. Hooks → `hooks.md`.

---

## §1 Must follow

### 1.1 No data fetching in `useEffect` — read at build time

`apps/docs` is Astro static. The icon manifest is imported from
`@brand-icons/core` at build time and passed to React islands as serialized
props. Never wrap it in `fetch` from `useEffect` — that loses SSG, costs a
double render in StrictMode, and breaks offline previews.

```tsx
// ❌ Bad — runtime fetch in an island
'use client';
const Gallery = () => {
  const [icons, setIcons] = useState([]);
  useEffect(() => {
    fetch('/manifest.json').then((r) => r.json()).then(setIcons);
  }, []);
  return <List icons={icons} />;
};

// ✅ Good — manifest baked into the page
// page.astro
---
import { manifest } from '@brand-icons/core';
import Gallery from '@/components/gallery';
---
<Gallery icons={manifest} client:visible />
```

### 1.2 Island boundary at the smallest interactive leaf

React components hydrate via `client:*` directives. Pick the **lowest**
component that actually needs interactivity. Wrapping a whole layout in
`client:load` ships the entire React tree, defeating the islands model.

```astro
<!-- ❌ Bad — whole page hydrated -->
<Layout client:load>
  <Header />
  <IconSearch icons={icons} />
  <Footer />
</Layout>

<!-- ✅ Good — only the interactive island hydrates -->
<Header />
<IconSearch icons={icons} client:visible />
<Footer />
```

Directive preference: `client:visible` > `client:idle` > `client:load` >
`client:only`. Use `client:only="react"` only when the component cannot
SSR (browser-only APIs at module scope).

### 1.3 No memoization without a profiler proof

`useMemo` / `useCallback` / `memo` only when a measured bottleneck exists.
Default is no memo. Premature memoization adds noise and ref churn for zero
gain.

```tsx
// ❌ Bad
const value = useMemo(() => compute(icon), [icon]);
const onClick = useCallback(() => fn(slug), [slug]);

// ✅ Good
const value = compute(icon);
const onClick = () => fn(slug);
```

### 1.4 Dependency arrays — primitives only

`useEffect`, `useMemo`, `useCallback` deps = primitives. Object / array /
function refs change every render → infinite loop or stale closure. Extract
the primitive fields out.

```tsx
// ❌ Bad — object ref changes every render
useEffect(() => { sync(filters); }, [filters]);

// ✅ Good
useEffect(() => {
  sync({ category: filters.category, size: filters.size });
}, [filters.category, filters.size]);
```

### 1.5 Error feedback — never silent

UI handlers → toast / inline error / fallback UI. Never empty `catch`,
never `console.error` alone.

```tsx
// ❌ Bad
try { await copy(svg); } catch (e) { console.error(e); }

// ✅ Good
try { await copy(svg); } catch (e: unknown) {
  toast.error('Copy failed. Try again.');
}
```

### 1.6 `key` prop — stable id, never `index`

Use `icon.slug` for icon lists, `category.id` for categories. `index`
desyncs state when the list reorders or filters.

```tsx
// ❌ Bad
{icons.map((icon, i) => <IconCard key={i} icon={icon} />)}

// ✅ Good
{icons.map((icon) => <IconCard key={icon.slug} icon={icon} />)}
```

### 1.7 No business logic in `apps/docs/src/components/ui/`

`ui/` is shadcn/ui scaffolding — props in, markup out. Filters, search,
manifest reads, theme switching → `apps/docs/src/features/` or a
page-level island.

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

- Compose (`children`, compound components) before reaching for context.
- One responsibility per component.
- Shared logic → custom hook (`use*`) — see `hooks.md`.
- Prop drilling > 3 levels → composition or context.

### 2.3 File grouping

- Solo component → kebab-case file: `icon-card.tsx`.
- Compound → folder with `index.tsx`, satellites alongside.
- Components consumed by sibling folders sit at the shared parent.

### 2.4 Event handlers

- Props: `on*` (`onSelect`, `onChange`).
- Implementations: `handle*` (`handleSelect`).

### 2.5 Conditional rendering

Ternary `cond ? <X /> : null` over `cond && <X />` — `0` and `NaN` render
as text otherwise.

```tsx
// ❌ Bad — count=0 renders "0"
<>{count && <Badge>{count}</Badge>}</>

// ✅ Good
<>{count > 0 ? <Badge>{count}</Badge> : null}</>
```

### 2.6 Generated React components (`packages/react/src/icons/`)

Generated files. **Never edit by hand.** To change their shape, edit the
template in `tools/build-icons/templates/react/icon.eta` and run
`pnpm build:icons`.

### 2.7 SSR-safe Web Components inside Astro

`@brand-icons/wc` registers custom elements on import. Astro pre-renders
React islands during build — accessing `customElements` at module scope
crashes the build. Import it from an effect inside a `client:only` (or
gated by `typeof window !== 'undefined'`) island.

```tsx
'use client';
import { useEffect } from 'react';
export const RegisterWc = () => {
  useEffect(() => {
    void import('@brand-icons/wc');
  }, []);
  return null;
};
```

```astro
<RegisterWc client:only="react" />
```

### 2.8 Context pattern

File `{feature}-provider.tsx`. Required exports:

- Types: `{Feature}ContextValue`, `{Feature}ProviderProps`
- Values: `{feature}Context` (`createContext<...|null>(null)`),
  `{Feature}Provider`, `use{Feature}` with a guard
  (`if (!ctx) throw new Error(...)`).

Provider lives at the top of the island, not above the Astro page.
