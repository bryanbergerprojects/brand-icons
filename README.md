# Brand Icons

> Multi-variant, multi-framework brand icons library for the web.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A growing collection of brand SVG icons with multiple variants per brand:

- **Color** — official multi-color logo (current and historical variants per brand).
- **Mono Dark** / **Mono Light** — monochrome variants for light/dark UIs.
- **Year variants** — `<BrandIcon.Latest />`, `<BrandIcon.1984 />` dot-notation API for historical logos.
- **Color conversion** — runtime transforms: black-and-white, inverted, monochrome (white / black / solid color).

Each variant available **with or without background**, in any size, across multiple frameworks.

## Packages

| Package                                        | Description                      |
| ---------------------------------------------- | -------------------------------- |
| [`@brand-icons/core`](./packages/core)         | Raw SVG strings, manifest, types |
| [`@brand-icons/react`](./packages/react)       | React components                 |
| [`@brand-icons/vue`](./packages/vue)           | Vue 3 components                 |
| [`@brand-icons/svelte`](./packages/svelte)     | Svelte 5 components              |
| [`@brand-icons/wc`](./packages/web-components) | Web Components                   |

## Documentation

Full docs and live icon gallery at the project documentation site (to be deployed).

## Quick start

```bash
# React
pnpm add @brand-icons/react

# Vue
pnpm add @brand-icons/vue

# Svelte
pnpm add @brand-icons/svelte

# Web Components
pnpm add @brand-icons/wc
```

```tsx
import { GithubIcon } from '@brand-icons/react';

<GithubIcon size={32} variant="mono-dark" />
<GithubIcon variant="color" background />
```

## Development

This is a [pnpm](https://pnpm.io) + [Turborepo](https://turborepo.com) monorepo.

```bash
pnpm install
pnpm build
pnpm test
pnpm dev
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Icons can be added via the
[`icon-fetcher`](./.claude/agents/icon-fetcher.md) Claude Code agent or manually
under [`icons/`](./icons).

## Brand owners

If you represent a brand whose icon is in this repository and you wish to request
removal or modification, see [BRAND_OWNERS.md](./BRAND_OWNERS.md).

## License

[MIT](./LICENSE) for the source code. Brand assets remain the property of their
respective owners.
