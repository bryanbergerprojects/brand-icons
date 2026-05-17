# Brand Icons — Documentation site

Astro 5 static site that documents the Brand Icons library and ships:

- A searchable icon gallery.
- A live playground per icon (size, variant, background, color).
- Per-framework code snippets and SVG downloads.
- MDX documentation pages (install, usage, contributing, brand-owners).
- Year-aware icon detail pages (`/icon/<slug>`).

## Stack

- **Astro 5** — `output: 'static'`, MDX content collections, no SSR, no API routes.
- **React 19 Islands** via `@astrojs/react` — hydrated only with `client:*` directives.
- **Tailwind CSS v4** — CSS-first config via `@theme` in `src/styles/global.css`. No `tailwind.config.ts`.
- **shadcn/ui** (Tailwind v4 compat) — primitives copied into `src/components/ui/`.
- **lucide-react** — UI chrome icons (not the catalogue).
- **MDX** — `@astrojs/mdx` for docs + resources collections.
- **Shiki** — code highlighting (dual `github-light` / `github-dark`).
- **Fuse.js** — fuzzy search in the gallery island.
- **`@brand-icons/react`** + **`@brand-icons/core`** — manifest imported at build time.

## Layout

```
apps/docs/
├── astro.config.mjs           # @astrojs/react + @astrojs/mdx + @tailwindcss/vite
├── components.json            # shadcn config (Tailwind v4 mode)
├── tsconfig.json              # extends astro/tsconfigs/strict + repo base
├── public/                    # static assets served as-is
└── src/
    ├── env.d.ts
    ├── content.config.ts      # Astro v5 content collections at src/ root
    ├── styles/global.css      # @import "tailwindcss" + @theme tokens
    ├── lib/                   # cn(), generic utils
    ├── layouts/               # base.astro and friends
    ├── pages/                 # routes only
    ├── components/            # static .astro chrome + shadcn ui/
    ├── features/              # business islands (gallery, search, playground)
    └── content/
        ├── docs/              # MDX guides
        └── resources/         # license, contributing, brand-owners…
```

## Commands

```bash
pnpm --filter docs dev         # astro dev
pnpm --filter docs build       # astro build → dist/
pnpm --filter docs preview     # serve dist/ locally
pnpm --filter docs typecheck   # astro check + tsc --noEmit
pnpm --filter docs test        # vitest run
```

## Conventions

- `.astro` pages stay zero-JS by default. React components hydrate only via
  `client:load` / `client:idle` / `client:visible` / `client:only` — pick the
  lightest that works (see `.claude/rules/astro.md`).
- Manifest data is loaded in Astro frontmatter and serialized as props to
  islands. Never `fetch('/manifest.json')` at runtime.
- shadcn components live in `src/components/ui/` and are never restyled from
  call sites — change tokens in `global.css` instead.
- Dynamic icon pages use `getStaticPaths` over `manifest` from
  `@brand-icons/core`.

## Hosting

Static `dist/` deployed to Scaleway Serverless Containers (region `fr-par`)
behind a tiny static adapter — or direct to a CDN. See
`.claude/plan/09-release-deploy.md`.

## Roadmap

Detailed implementation plan: [`.claude/plan/website/`](../../.claude/plan/website/README.md).
Phase tracking: [`.claude/plan/06-docs-site.md`](../../.claude/plan/06-docs-site.md).
