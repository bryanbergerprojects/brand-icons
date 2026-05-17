---
description: Naming, file structure, and side-effect rules for React hooks (used inside Astro islands)
paths:
  - '**/use-*.ts'
  - '**/use-*.tsx'
  - '**/*.tsx'
---

# Hook Rules

> See also: `react.md` (deps, memoization, event handlers), `components.md` (UI vs business split), `astro.md` (island boundary).

## §1 Must follow

### 1.1 Generic hooks stay domain-agnostic

Hooks under `apps/docs/src/lib/` (or any future shared package) must not
know about brands, icons, palettes, or any catalog concept. Domain hooks
belong in `apps/docs/src/features/<feature>/`.

```ts
// ❌ Bad — generic file leaks the icon domain
// apps/docs/src/lib/use-selected-icon.ts
export const useSelectedIcon = () => {
  const [slug, setSlug] = useUrlParam('icon');
  return manifest.find((i) => i.slug === slug);
};

// ✅ Good — primitive in lib, domain hook in features/
// apps/docs/src/lib/use-url-param.ts          → no domain
// apps/docs/src/features/icons/use-selected-icon.ts → wraps it
```

### 1.2 Side effects must be signalled in the hook name

Hooks that perform a network call, subscription, storage write, or
clipboard write must say so in their name. Read-only hooks keep the
bare `use` prefix (`useManifest`, `useTheme`).

```ts
// ❌ Bad — name implies read, body mutates
export const useTheme = () => {
  return { set: (mode: Mode) => localStorage.setItem('theme', mode) };
};

// ✅ Good — side effect surfaced
export const usePersistTheme = () => {
  const persistTheme = (mode: Mode) => localStorage.setItem('theme', mode);
  return { persistTheme };
};
```

### 1.3 Disable `react-hooks/exhaustive-deps` only with a reason

Every disable must explain why — never silent.

```ts
// ❌ Bad
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { trackPageView(); }, []);

// ✅ Good
// Run once on mount — pageView must not refire when filters change.
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { trackPageView(); }, []);
```

### 1.4 No browser API at hook module scope

Astro pre-renders React islands during build. A hook that touches
`window`, `document`, `localStorage`, or `customElements` at module
scope crashes `astro build`. Wrap reads in `useEffect` (or guard with
`typeof window !== 'undefined'` for the initial value).

```ts
// ❌ Bad — crashes SSR build
const initial = localStorage.getItem('theme');
export const useTheme = () => useState(initial);

// ✅ Good — read on mount
export const useTheme = () => {
  const [theme, setTheme] = useState<Mode>('light');
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Mode | null;
    if (stored) setTheme(stored);
  }, []);
  return [theme, setTheme] as const;
};
```

## §2 Conventions

### 2.1 File structure

- One hook per file, named after the hook (`use-manifest.ts`).
- Generic hooks → `apps/docs/src/lib/`.
- Business hooks → `apps/docs/src/features/<feature>/`.

### 2.2 Scope

One hook does one thing — coherence of scope, no line-count limit.

### 2.3 Returned handlers prefixed with `handle`

Props use `on*` (see `react.md`). Handlers returned by a hook use
`handle*`.

```ts
// ❌ Bad
const useToggle = () => {
  const [open, setOpen] = useState(false);
  return { open, toggle: () => setOpen((v) => !v) };
};

// ✅ Good
const useToggle = () => {
  const [open, setOpen] = useState(false);
  return { open, handleToggle: () => setOpen((v) => !v) };
};
```

### 2.4 `useState` is for ephemeral UI state only

Open/closed flags, draft inputs, hover/focus, optimistic flags.

- Static data (manifest, MDX content) → passed in as props from Astro,
  see `astro.md` §1.1.
- Shareable URL state (search, filter, selected item) → `useUrlParam`
  or equivalent, see `components.md` §1.4.

```ts
// ❌ Bad — manifest in client state
const [icons, setIcons] = useState<IconMeta[]>([]);
useEffect(() => { fetch('/manifest.json').then((r) => r.json()).then(setIcons); }, []);

// ✅ Good — manifest arrives as a prop
const Gallery = ({ icons }: { icons: IconMeta[] }) => { ... };
```

### 2.5 Mutations use `useTransition`

When an island performs a non-trivial state update (filter recompute,
SVG transform), wrap it in `useTransition` to keep the UI responsive.
Astro static mode has no server actions — the work runs in the browser.

```ts
const [isPending, startTransition] = useTransition();
const handleFilter = (category: Category) => {
  startTransition(() => setCategory(category));
};
```
