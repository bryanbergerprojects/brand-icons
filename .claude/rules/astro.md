---
description: Astro rules — static output, frontmatter data, island hydration, content collections, env
paths:
  - 'apps/docs/**/*.astro'
  - 'apps/docs/**/*.mdx'
  - 'apps/docs/src/content/**'
  - 'apps/docs/astro.config.*'
---

# Astro Rules

> **§1 Must follow** — non-negotiable. **§2 Conventions** — project style.
> React → `react.md`. UI vs business → `components.md`.

`apps/docs` is **Astro 5, `output: 'static'`**. No SSR, no API routes, no Astro Actions.

---

## §1 Must follow

### 1.1 Data loaded in frontmatter, never at runtime

Manifest, MDX, derived data → frontmatter (`---`). Serialized at build. Never `fetch('/manifest.json')` from a client component.

```astro
---
import { manifest } from '@brand-icons/core';
import Gallery from '@/components/gallery';
---
<Gallery icons={manifest} client:visible />
```

### 1.2 Pick the lightest `client:*` directive

| Directive             | When                                                    |
| --------------------- | ------------------------------------------------------- |
| (none)                | Static markup. Default.                                 |
| `client:visible`      | Below-the-fold interactive.                             |
| `client:idle`         | Above-the-fold non-critical.                            |
| `client:media`        | Conditional on viewport.                                |
| `client:load`         | Above-the-fold, interactive on first paint.             |
| `client:only="react"` | Cannot SSR (uses `window` at module scope).             |

`client:load` everywhere = SPA bundle.

### 1.3 No `.astro` imports inside React islands

`.astro` components only render from `.astro` / `.mdx`. Importing one from `.tsx` crashes the build. Pass serializable props, or use `<slot />`.

### 1.4 Validate frontmatter with Zod via Content Collections (v5 API)

Schema at `src/content.config.ts` (root of `src/`, **not** inside `src/content/`).

- `loader` required — `glob` from `astro/loaders`, or `file` / custom.
- `type: 'content'` removed in v5.
- `z` imported from `astro/zod`.

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(20).max(200),
    order: z.number().int().nonnegative(),
  }),
});

export const collections = { guides };
```

### 1.5 Secrets via `astro:env`, never `PUBLIC_*`

Static mode = no runtime server. Secrets live at build time. Use typed `astro:env`:

- `astro:env/client` — public, available in islands.
- `astro:env/server` — server/build. Importing from a client-bound module = build error.

```ts
// astro.config.ts
env: {
  schema: {
    PUBLIC_POKEAPI:   envField.string({ context: 'client', access: 'public' }),
    BUILD_API_TOKEN:  envField.string({ context: 'server', access: 'secret' }),
  },
}
```

Legacy `import.meta.env.PUBLIC_*` allowed for trivial public values only.

### 1.6 Routes only in `src/pages/`

URL-producing `.astro` files live exclusively in `apps/docs/src/pages/`. Reusable chunks → `src/components/` or `src/layouts/`.

### 1.7 No request-time globals

Static output: `Astro.request.headers`, `Astro.cookies`, runtime `Astro.url.search` are unavailable. Read query state inside the **client island** (`URLSearchParams` in `useEffect`).

---

## §2 Conventions

### 2.1 File layout

```
apps/docs/src/
├── pages/             # routes only
├── layouts/
├── components/
│   ├── ui/            # shadcn primitives (React)
│   └── *.astro        # static chrome
├── features/          # business islands (search, playground)
├── content.config.ts  # v5: at src/ root
├── content/<col>/     # MDX data
├── styles/global.css
└── lib/               # generic utils
```

### 2.2 Dynamic routes — `getStaticPaths`

Every `[param].astro` enumerates slugs at build.

```astro
---
import { manifest } from '@brand-icons/core';
import IconDetail from '@/features/icon-detail';

export const getStaticPaths = () =>
  manifest.map((icon) => ({ params: { slug: icon.slug }, props: { icon } }));

const { icon } = Astro.props;
---
<IconDetail icon={icon} client:visible />
```

### 2.3 Layouts

Layouts wrap chrome (header, footer, theme script). Pages use one `<BaseLayout>`. Nested via `<slot />`.

### 2.4 MDX rendering (v5)

`render` is a top-level import from `astro:content` — `entry.render()` removed. Unknown slugs in static mode never reach a render; they fall through to host 404.

```astro
---
// src/pages/guides/[...slug].astro
import { getCollection, render } from 'astro:content';

export const getStaticPaths = async () => {
  const entries = await getCollection('guides');
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
};

const { Content } = await render(Astro.props.entry);
---
<Content />
```

Code blocks → built-in Shiki (`markdown.shikiConfig`). Never a JS highlighter in an island.

### 2.5 Styling

- Tailwind v4 only — `@import "tailwindcss";` + `@theme { ... }` in `src/styles/global.css`. No `tailwind.config.ts`.
- `.astro` `<style>` for layout one-offs. Reusable visuals → Tailwind.
- Theme: `class` strategy, inline `<head>` script to avoid FOUC.

### 2.6 Assets

- Brand icons → `@brand-icons/react` in islands.
- Raster → `<Image />` from `astro:assets`, source under `src/assets/`.
- Never import from `public/` in components — Vite cannot fingerprint.
