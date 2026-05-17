---
description: Component rules — UI vs business split, no restyle shadcn, Astro vs island boundary, scoping
paths:
  - 'apps/docs/**/*.{tsx,astro}'
  - 'packages/react/src/**/*.tsx'
---

# Component Rules

> **§1 Must follow** — non-negotiable. Violation blocks review.
> **§2 Conventions** — project style. Follow unless justified.
> React specifics → `react.md`. Astro page rules → `astro.md`. Hooks → `hooks.md`.

---

## §1 Must follow

### 1.1 No business logic in `apps/docs/src/components/ui/`

`components/ui/` is shadcn/ui scaffolding (Button, Card, Input, Dialog, …).
It receives props and renders. No manifest reads, no theme awareness, no
fetcher calls, no domain types. Business decisions live in
`apps/docs/src/features/[feature]/`.

```tsx
// ❌ Bad — UI imports a feature concern
// src/components/ui/copy-button.tsx
import { useManifest } from '@/features/icons';
export const CopyButton = () => {
  const { selected } = useManifest();
  return <Button onClick={() => copy(selected.svg)}>Copy</Button>;
};

// ✅ Good — props only, business decision lives in caller
// src/components/ui/copy-button.tsx
export const CopyButton = ({ onCopy, ...props }: CopyButtonProps) => (
  <Button onClick={onCopy} {...props}>Copy</Button>
);

// src/features/icons/icon-actions.tsx
const handleCopy = () => copy(icon.svg);
<CopyButton onCopy={handleCopy} />;
```

### 1.2 No data fetch in islands — receive props from Astro

Islands receive their data as serialized props from a `.astro` page that
read the manifest at build time. Never re-fetch in `useEffect`. See
`astro.md` §1.1.

```tsx
// ❌ Bad — island re-fetches what's already in the bundle
const Gallery = () => {
  const [icons, setIcons] = useState([]);
  useEffect(() => { fetch('/manifest.json').then(...).then(setIcons); }, []);
  return <List icons={icons} />;
};

// ✅ Good — Astro passes the manifest, React renders
// page.astro
---
import { manifest } from '@brand-icons/core';
---
<Gallery icons={manifest} client:visible />
```

### 1.3 Never restyle shadcn UI — variants only, layout classes OK

On a `components/ui/*` component, `className` is restricted to **layout**
(spacing, grid, width). Visual styling goes through the component's
variant system (CVA). A new visual need → extend the variant inside
`components/ui/`, never override at the call site.

```tsx
// ❌ Bad — visual override at call site
<Button className="bg-purple-500 text-white shadow-2xl rounded-full" />;
<Card className="border-2 border-red-400" />;

// ✅ Good — variant + layout only
<Button variant="primary" size="lg" className="mt-4 w-full" />;
<Card variant="destructive" className="col-span-2" />;
```

### 1.4 Client state in the URL when shareable — `useState` for ephemeral only

Anything that should be shareable, refreshable, or back-button-navigable
(active tab, search query, selected icon, variant filter) lives in the
URL via `URLSearchParams` (read in an `useEffect` inside the island,
written via `history.replaceState`). Astro static has no server-side
search params — handle them client-side.

`useState` only for state that must disappear on reload: `loading`,
`hover`, `focus`, uncontrolled draft inputs.

```tsx
// ❌ Bad — search & filter lost on refresh
const [q, setQ] = useState('');
const [category, setCategory] = useState<Category | null>(null);

// ✅ Good — URL-driven, refresh-safe, shareable
const [q, setQ] = useUrlParam('q');
const [category, setCategory] = useUrlParam('cat');
```

(`useUrlParam` is a small generic hook in `apps/docs/src/lib/` — kept
domain-agnostic, see `hooks.md`.)

### 1.5 Astro vs island boundary — default `.astro`, opt-in `.tsx`

Default to `.astro` for any non-interactive component (header, footer,
card, layout chunk). Reach for `.tsx` only when the component needs
state, effects, browser APIs, or React-only library hooks. Static
markup in a React island ships KB for no benefit.

```text
// ❌ Bad — static header as a React island
src/components/header.tsx        ← only renders links

// ✅ Good — Astro for static, React for interactive
src/components/header.astro      ← links, no state
src/features/search/search.tsx   ← combobox, fuzzy match
```

---

## §2 Conventions

### 2.1 Location & exports

| Where                                 | What                              | Export                                |
| ------------------------------------- | --------------------------------- | ------------------------------------- |
| `apps/docs/src/components/ui/`        | shadcn primitives, no business    | **Named**, multiple per file (shadcn) |
| `apps/docs/src/components/`           | Layout / chrome (`.astro`)        | Default (Astro convention)            |
| `apps/docs/src/features/[feature]/`   | Business islands & their helpers  | **Default**, one per file             |
| `apps/docs/src/pages/`                | Routes, `getStaticPaths`          | Default (Astro convention)            |
| `packages/react/src/`                 | Library code (generated + index)  | Named                                 |

### 2.2 Scoping reusable parts

- Used by a single feature → live in `features/<feature>/`.
- Used by 2+ features inside `apps/docs` → promote to `src/components/`.
- Used outside `apps/docs` → promote to a `packages/*` workspace.

### 2.3 Push hydration down, not up

Default to `.astro`. Add a React island (`.tsx` + `client:*`) at the
smallest leaf that needs interactivity. Never wrap an entire layout in
`client:load`. See `astro.md` §1.2.

### 2.4 Dynamic route params

Astro `.astro` pages receive `Astro.params` and `Astro.props` from
`getStaticPaths`. Inside an island, params arrive as plain serialized
props — never read `Astro.*` from React.

```astro
---
const { icon } = Astro.props;
---
<IconDetail icon={icon} client:visible />
```

### 2.5 Not-found & error pages

- `src/pages/404.astro` for missing routes (Astro convention).
- For missing-entity inside a dynamic route — filter the slug list in
  `getStaticPaths` so the page is simply not built. There is no
  runtime `notFound()` in static mode.
- Runtime island errors → React error boundary inside the island.

### 2.6 No back button on pages

The breadcrumb already serves navigation. Reserve the back button
for browser-level UX, not in-page chrome.

### 2.7 Image & icon usage

- Icons from `@brand-icons/react` → import the per-icon module, not the
  whole package (tree-shaking is correct but explicit imports are
  faster to grep and document).
- Astro `<Image />` for any non-icon raster, hosted under `src/assets/`.
