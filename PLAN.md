# Brand Icons — Plan détaillé

> Librairie NPM d'icônes de marque au format SVG, multi-variants, multi-frameworks, accompagnée d'un site documentation.

---

## 1. Vision

Bibliothèque d'icônes de marque pour intégration rapide dans applications web. Différenciation vs simple-icons / lucide :

- **Multi-variants par icône** : color officiel, mono-dark, mono-light, custom (style Lucide stroke-based homemade).
- **Avec / sans background** pour chaque variant quand applicable.
- **Multi-frameworks first-class** : React, Vue, Svelte, Web Components, SVG bruts.
- **Recherche puissante** côté site doc (description + tags + url marque).
- **Agent Claude Code** pour ajouter de nouvelles icônes automatiquement (sources web + raster→SVG).

---

## 2. Stack technique

| Domaine | Choix |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Build packages | tsup (esbuild) |
| Tests | Vitest |
| Lint / format | Biome |
| Format dist | ESM only, TS strict |
| Versioning / release | Changesets + GitHub Actions auto-publish (provenance NPM) |
| Site doc | Next.js 15 (App Router) + shadcn/ui v4 + Tailwind v4 + lucide-react + MDX |
| Conversion raster→SVG | Hybride : potrace/imagetracerjs → Claude nettoie |
| CI | GitHub Actions |
| Deploy doc | Scaleway (Serverless Containers — Next.js standalone Docker) |
| License code | MIT |
| Node target | 20+ |

---

## 3. Structure monorepo

```
brand-icons/
├── packages/
│   ├── core/                 # @brand-icons/core
│   ├── react/                # @brand-icons/react
│   ├── vue/                  # @brand-icons/vue
│   ├── svelte/               # @brand-icons/svelte
│   └── web-components/       # @brand-icons/wc
├── apps/
│   └── docs/                 # Site Next.js (privé, non publié)
├── icons/                    # Source unique de vérité
│   └── github/
│       ├── meta.json
│       ├── color.svg
│       ├── color-bg.svg       # optionnel
│       ├── mono.svg
│       └── custom.svg
├── tools/
│   ├── build-icons/          # Pipeline génération
│   └── raster-to-svg/        # Helpers conversion image→SVG
├── .claude/
│   └── agents/
│       └── icon-fetcher.md   # Subagent ajout d'icônes
├── .changeset/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── BRAND_OWNERS.md
├── LICENSE                   # MIT
├── README.md
├── biome.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── turbo.json
```

---

## 4. Packages NPM publiés (scope `@brand-icons`)

| Package | Description | Dépend de |
|---|---|---|
| `@brand-icons/core` | SVG raw (string), manifest JSON, types TS, métadonnées | — |
| `@brand-icons/react` | Composants React `.tsx` générés | core |
| `@brand-icons/vue` | Composants Vue 3 `.vue` générés | core |
| `@brand-icons/svelte` | Composants Svelte 5 `.svelte` générés | core |
| `@brand-icons/wc` | Web components `<brand-icon>` | core |

Toutes les icônes tree-shakable (un fichier par icône, barrel `index.ts` qui réexporte).

---

## 5. Source unique de vérité : `icons/<slug>/`

### 5.1 Fichiers par icône

```
icons/github/
├── meta.json
├── color.svg          # Officiel multi-couleur (obligatoire)
├── color-bg.svg       # Optionnel — généré auto si absent
├── mono.svg           # Source mono (fill="currentColor") — dark/light dérivent
└── custom.svg         # Lucide-style stroke 1.5px
```

### 5.2 Schéma `meta.json`

```json
{
  "slug": "github",
  "name": "GitHub",
  "category": "dev-tools",
  "description": "Plateforme d'hébergement de code source et de collaboration utilisant Git.",
  "tags": ["git", "code", "vcs", "repository", "collaboration", "open-source", "devops"],
  "brandColor": "#181717",
  "url": "https://github.com",
  "repository": "https://github.com/github",
  "source": "https://github.com/logos",
  "license": "Trademark — usage identification (fair use)",
  "aliases": [],
  "addedAt": "2026-05-16",
  "updatedAt": "2026-05-16"
}
```

### 5.3 Champs obligatoires / optionnels

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| `slug` | string kebab-case | ✅ | Identifiant unique |
| `name` | string | ✅ | Nom officiel marque |
| `category` | enum (voir §6) | ✅ | Liste fermée |
| `description` | string ≤ 200 chars | ✅ | Pour recherche + tooltip site |
| `tags` | string[] | ✅ | Recherche fuzzy (min 3 tags) |
| `brandColor` | hex | ✅ | Pour `background={true}` |
| `url` | URL | ✅ | Site officiel marque |
| `repository` | URL | ❌ | Fallback si pas de site (rare) |
| `source` | URL | ❌ | Origine du SVG (press kit) |
| `license` | string | ✅ | Texte trademark |
| `aliases` | string[] | ❌ | Synonymes recherche (ex "ms-code" pour VS Code) |
| `addedAt` / `updatedAt` | ISO date | ✅ | Auto par script |

---

## 6. Catégories (liste fermée)

```ts
type Category =
  | "ai"              // Claude, OpenAI, Gemini, Mistral...
  | "dev-tools"       // GitHub, GitLab, VS Code, JetBrains...
  | "platforms"       // Apple, Microsoft, Google, AWS, Azure...
  | "productivity"    // Atlassian, Notion, Linear, Asana...
  | "social"          // Facebook, Meta, LinkedIn, X, Instagram...
  | "communication"   // Slack, Discord, Zoom, Teams...
  | "design"          // Figma, Sketch, Framer, Adobe...
  | "payments"        // Stripe, PayPal, Visa...
  | "analytics"       // GA, Mixpanel, Amplitude, PostHog...
  | "e-commerce"      // Shopify, WooCommerce...
  | "search-web"      // Google Search, Bing, DuckDuckGo...
  | "storage-cloud"   // Dropbox, Drive, S3...
  | "media"           // Spotify, YouTube, Netflix...
  | "gaming"          // Steam, PlayStation, Xbox...
  | "finance"         // Coinbase, Revolut, Wise...
  | "other";          // Fallback dernier recours
```

Ajout d'une catégorie = changement breaking versioning, justifié par 3+ icônes minimum.

---

## 7. Pipeline build (`tools/build-icons`)

### 7.1 Étapes

1. **Scan** `icons/*/meta.json` → charge en mémoire.
2. **Validation** schéma (Zod) : meta.json + présence `color.svg` + `mono.svg` + `custom.svg`.
3. **SVGO** optimisation tous SVG (preset par défaut + `removeViewBox: false`, `convertColors: false` pour color, `convertColors: { currentColor: true }` pour mono).
4. **Génération variants dérivés** :
   - `mono-dark` = `mono.svg` (utilise `currentColor`, couleur défaut `#0a0a0a`).
   - `mono-light` = `mono.svg` (couleur défaut `#fafafa`).
   - `color-bg` si absent → `<svg><rect fill={brandColor} rx="20%"/><g transform="scale(0.75) translate(...)">{color}</g></svg>` avec padding 12.5%, rayon arrondi 20%.
   - `mono-dark-bg` / `mono-light-bg` / `custom-bg` idem.
5. **Génération `core/src/icons/<slug>.ts`** :
   ```ts
   export const github = {
     color: '<svg ...>...</svg>',
     colorBg: '<svg ...>...</svg>',
     monoDark: '<svg ...>...</svg>',
     monoLight: '<svg ...>...</svg>',
     custom: '<svg ...>...</svg>',
     meta: { /* meta.json */ }
   } as const;
   ```
6. **Génération `core/src/manifest.ts`** : agrégat de toutes meta pour le site doc.
7. **Génération composants framework** via templates Eta :
   - `packages/react/src/icons/Github.tsx`
   - `packages/vue/src/icons/Github.vue`
   - `packages/svelte/src/icons/Github.svelte`
   - `packages/web-components/src/icons/github.ts`
8. **Génération barrels** `index.ts` (un export nommé par icône).
9. **tsup build** chaque package en parallèle (Turbo).

### 7.2 Cache

Turbo cache par hash de :
- `icons/**/*`
- `tools/build-icons/templates/**`
- Version de SVGO

Build incrémental = secondes après changement d'1 icône.

---

## 8. API composants

### 8.1 Types partagés (`@brand-icons/core`)

```ts
export type Variant = "color" | "mono-dark" | "mono-light" | "custom";

export interface BrandIconProps {
  /** Taille en px ou string CSS. Défaut: 24 */
  size?: number | string;
  /** Variant à afficher. Défaut: 'color' */
  variant?: Variant;
  /** Fond : true = brandColor, string = hex/css, false = aucun. Défaut: false */
  background?: boolean | string;
  /** Override couleur pour variants mono. Défaut: currentColor */
  color?: string;
  /** Texte accessible (a11y). Si absent => aria-hidden */
  title?: string;
  /** Classe CSS additionnelle */
  className?: string;
}
```

### 8.2 React

```tsx
import { GithubIcon, FigmaIcon } from '@brand-icons/react';

<GithubIcon />                                          // 24px, color, no bg
<GithubIcon size={32} />
<GithubIcon variant="mono-dark" />
<GithubIcon variant="mono-light" color="#888" />
<GithubIcon variant="color" background />               // fond #181717
<GithubIcon variant="custom" background="#000" size={64} />
<FigmaIcon title="Open in Figma" />
```

### 8.3 Vue 3

```vue
<script setup>
import { GithubIcon } from '@brand-icons/vue';
</script>
<template>
  <GithubIcon :size="32" variant="mono-dark" />
</template>
```

### 8.4 Svelte 5

```svelte
<script>
  import { GithubIcon } from '@brand-icons/svelte';
</script>
<GithubIcon size={32} variant="custom" background />
```

### 8.5 Web Components

```html
<script type="module">
  import '@brand-icons/wc';
</script>
<brand-icon name="github" variant="mono-dark" size="32"></brand-icon>
<brand-icon name="github" variant="color" background></brand-icon>
```

### 8.6 SVG bruts depuis core

```ts
import { github } from '@brand-icons/core/icons/github';

document.body.innerHTML = github.color;
```

---

## 9. Subagent Claude Code — `.claude/agents/icon-fetcher.md`

### 9.1 Frontmatter

```yaml
---
name: icon-fetcher
description: Add a new brand icon to the library. Fetches source from the web, converts raster to SVG if needed, generates all variants (color, mono, custom), creates meta.json, validates and commits.
tools: WebFetch, WebSearch, Read, Write, Edit, Bash, Glob
---
```

### 9.2 Workflow

1. **Input** : nom marque (ex `"linear"`) ou URL source.
2. **Recherche source** :
   - WebSearch `"<brand> brand assets svg logo"` + `"<brand> press kit"`.
   - Priorité sites officiels (press / brand / about).
3. **Téléchargement** :
   - Si SVG dispo → WebFetch + sauvegarde temp.
   - Si seulement PNG/JPEG/WebP → sauve raster, exécute `pnpm run trace -- <file>` (tools/raster-to-svg, utilise `potrace`/`imagetracerjs`).
   - LLM relit SVG brut + image originale, simplifie paths, ajuste viewBox 24×24.
4. **Génération variants** :
   - `color.svg` ← source officielle nettoyée.
   - `mono.svg` ← LLM applique `fill="currentColor"`, supprime gradients, fusionne paths.
   - `custom.svg` ← LLM redessine forme géométrique stroke 1.5px (style Lucide).
5. **Extraction `brandColor`** : couleur dominante du logo officiel.
6. **`meta.json`** : remplit slug, name, category (demande user si ambigu), description, tags (5–10), url, repository.
7. **Validation** : exécute `pnpm build:icons --icon=<slug>` → confirme aucune erreur.
8. **Git** :
   - Branche `add-icon/<slug>`.
   - Commit `feat(icons): add <name>`.
   - Changeset `.changeset/add-<slug>.md`.
9. **Output** : rapport (paths créés, preview SVG, prochain step `pnpm changeset version` ou ouverture PR).

### 9.3 Garde-fous

- Refuse si marque déjà présente (sauf flag `--update`).
- Refuse images < 256×256 (qualité insuffisante).
- Demande confirmation user pour catégorie si plusieurs candidates.
- N'override jamais `custom.svg` existant (manuel only) sauf `--force`.

---

## 10. Site documentation (`apps/docs`)

### 10.1 Stack

- **Next.js 15** App Router (RSC + Server Actions)
- **Tailwind CSS v4** (config CSS-first via `@theme`, pas de `tailwind.config.js`)
- **shadcn/ui v4** (components Radix + Tailwind v4, installation CLI `npx shadcn@latest add`)
- **lucide-react** pour icônes UI du site (search, copy, download, chevron, sun/moon, etc.)
- **MDX** (`@next/mdx`) pour pages doc
- **Fuse.js** pour recherche fuzzy galerie icônes
- **Shiki** pour highlight code blocks (transformers : copy button, line highlight)
- **next-themes** pour toggle dark/light (essentiel pour preview variants mono-dark/mono-light)

Lit `@brand-icons/core` via dépendance workspace pour manifest + SVG.

### 10.1.1 Composants shadcn/ui utilisés

`button`, `input`, `dialog`, `dropdown-menu`, `select`, `slider`, `switch`, `tabs`, `toggle`, `toggle-group`, `tooltip`, `badge`, `card`, `separator`, `command` (recherche ⌘K), `sheet` (filtres mobile), `sonner` (toast copy confirmation), `popover` (color picker), `scroll-area`.

### 10.1.2 Convention icônes UI vs icônes librairie

- **Icônes UI site** (chrome, navigation, actions) → `lucide-react` (Search, Copy, Download, Sun, Moon, Github comme lien repo, etc.).
- **Icônes catalogue** (preview, playground, galerie) → `@brand-icons/react` (dogfooding).

Pas de conflit possible : namespaces différents.

### 10.2 Pages

| Route | Contenu |
|---|---|
| `/` | Hero, stats (X icônes, Y variants), grille featured, CTA install |
| `/icons` | Galerie complète, search bar, filtres (catégorie multi-select, variants dispo, has-bg), tri (alpha, récent, populaire) |
| `/icons/[slug]` | Détail : preview grande, **playground live** (sliders size 16-128, toggles variant, toggle/color picker background, color picker pour mono, dark/light bg preview), **tabs code** (React / Vue / Svelte / WC / SVG raw), **download buttons** par variant SVG, metadata (description, tags, lien marque) |
| `/docs/install` | Install per package, peer deps |
| `/docs/usage` | Props API, exemples |
| `/docs/contributing` | Comment ajouter icône (manuel + subagent) |
| `/docs/icon-guidelines` | Règles design (24×24 viewBox, currentColor, stroke 1.5px custom, simplification) |
| `/brand-owners` | Procédure retrait trademark + form/email/template GitHub issue |

### 10.3 Recherche

Fuse.js index sur `name + slug + tags + description + aliases + category`. Score config :

```ts
{
  keys: [
    { name: 'name', weight: 0.4 },
    { name: 'slug', weight: 0.3 },
    { name: 'aliases', weight: 0.2 },
    { name: 'tags', weight: 0.15 },
    { name: 'description', weight: 0.1 },
    { name: 'category', weight: 0.05 }
  ],
  threshold: 0.35
}
```

### 10.4 Playground component

Composant client React avec state local. UI construite avec shadcn/ui :

- **`<Slider>`** pour size (16 → 128 px).
- **`<ToggleGroup>`** pour variant (color / mono-dark / mono-light / custom).
- **`<Switch>`** pour activer background, **`<Popover>` + color picker** si custom hex.
- **`<Popover>` + color picker** pour override `color` sur variants mono.
- **`<Tabs>`** pour switch framework code snippet (React / Vue / Svelte / WC / SVG).
- **`<Button variant="ghost">`** + icône lucide `Copy` → clipboard (toast `sonner`).
- **`<Button>`** + icône lucide `Download` → trigger download blob SVG par variant.

State local React, génération code snippet via template literals en temps réel. Preview rendue dans cadre avec damier transparence + toggle dark/light bg pour valider lisibilité.

### 10.5 Recherche ⌘K

`<Command>` shadcn (cmdk) déclenché par raccourci ⌘K / Ctrl+K. Liste résultats Fuse.js. Sélection → navigate `/icons/<slug>`. Inclut shortcuts pages doc ("install", "contributing").

---

## 11. Legal — `BRAND_OWNERS.md` (Option 2)

Contenu :

1. **Disclaimer** : « Toutes les marques, logos et noms commerciaux sont la propriété de leurs propriétaires respectifs. Leur inclusion dans cette librairie ne constitue ni endossement ni affiliation. Usage à fins d'identification (fair use). »
2. **Procédure retrait** :
   - Email : `contact@bryanberger.dev` (subject `[Brand Icons Removal] <Brand>`)
   - OU GitHub issue template `trademark-removal.yml`
   - Délai d'engagement : retrait sous 7 jours ouvrés après vérification identité ayant droit
3. **Modifications demandées** : possible de demander ajustement (couleur, version) sans retrait complet.
4. **Contact maintainer** : Bryan Berger, contact@bryanberger.dev.

License code : MIT (fichier `LICENSE` séparé). SVG marques = trademark des propriétaires (mentionné dans README + chaque `meta.json.license`).

---

## 12. CI/CD

### 12.1 `.github/workflows/ci.yml`

Trigger : push + PR.

Steps :
- Setup pnpm + Node 20.
- Install (frozen-lockfile).
- `turbo lint` (Biome check).
- `turbo typecheck` (tsc --noEmit strict).
- `turbo test` (Vitest unit + snapshot SVG).
- `turbo build` (validation build OK).
- `turbo build --filter=docs` (validation site doc compile).

### 12.2 `.github/workflows/release.yml`

Trigger : push `main`.

Steps :
- Changesets action :
  - Si changesets pending → ouvre/met à jour PR "Version Packages".
  - Si release PR merged → publish NPM avec provenance + crée tags + GitHub releases.
- Deploy Scaleway via workflow séparé `deploy-docs.yml` déclenché sur tag release.

### 12.3 `.github/workflows/deploy-docs.yml`

Trigger : push tag `docs-v*` ou release Changesets sur main.

Steps :
- Setup pnpm + Node 20.
- `pnpm build --filter=docs` (Next.js standalone).
- Login Scaleway Container Registry (`docker login rg.fr-par.scw.cloud`).
- Build image Docker depuis `apps/docs/Dockerfile`.
- Push image taggée (`latest` + commit SHA).
- `scw container container update <container-id> registry-image=<tag>` via Scaleway CLI.

### 12.4 Hébergement Scaleway

- **Service** : Scaleway Serverless Containers, région `fr-par`.
- **Container Registry** : `rg.fr-par.scw.cloud/<namespace>/brand-icons-docs`.
- **Image** : Next.js 15 `output: "standalone"` dans Dockerfile multi-stage.
- **Resources** : 256-512 MiB RAM, 70 mVCPU (ajustable selon trafic).
- **Domain** : custom `brand-icons.bryanberger.dev` (ou similaire) mappé au container.
- **Secrets GitHub Actions** : `SCW_ACCESS_KEY`, `SCW_SECRET_KEY`, `SCW_PROJECT_ID`, `SCW_DEFAULT_REGION=fr-par`, `SCW_REGISTRY_NAMESPACE`, `SCW_CONTAINER_ID`.

---

## 13. Tests

| Type | Cible | Outil |
|---|---|---|
| Unit | Pipeline build (validation, génération variants) | Vitest |
| Snapshot | SVG générés (détecter régressions visuelles) | Vitest + `toMatchFileSnapshot` |
| Visual | Composants rendus (React Testing Library) | Vitest + happy-dom |
| Schema | Validation `meta.json` toutes icônes | Zod + Vitest |
| Manifest | Cohérence (slugs uniques, brandColor valide hex, url valides) | Vitest |

---

## 14. Icônes pilotes (sprint 2)

13 icônes pour valider pipeline avant scaling :

| Slug | Nom | Catégorie | Notes |
|---|---|---|---|
| `github` | GitHub | dev-tools | Logo simple, idéal référence |
| `gitlab` | GitLab | dev-tools | Couleurs complexes (tanuki) — test color-bg |
| `google` | Google | platforms | Multi-couleur G — test mono difficile |
| `apple` | Apple | platforms | Mono natif, simple — test custom challenge |
| `atlassian` | Atlassian | productivity | Gradient bleu — test simplification |
| `facebook` | Facebook | social | Mono bleu — test bg blanc |
| `meta` | Meta | social | Infinity loop gradient — test conversion mono |
| `claude` | Claude | ai | Anthropic — test ai category |
| `openai` | OpenAI | ai | Logo trèfle — test custom stroke |
| `gemini` | Gemini | ai | Étoile multi-couleur — test brandColor extraction |
| `vscode` | VS Code | dev-tools | Microsoft — alias `visual-studio-code` |
| `microsoft` | Microsoft | platforms | 4 carrés — test variant custom |
| `linkedin` | LinkedIn | social | "in" bleu — test bg + mono |

Tags exemples :
- `github`: `["git", "code", "vcs", "repository", "collaboration", "open-source", "devops"]`
- `claude`: `["ai", "llm", "anthropic", "chatbot", "assistant"]`
- `vscode`: `["editor", "ide", "microsoft", "development", "code-editor"]`

---

## 15. Roadmap

| Sprint | Livrable | Durée estimée |
|---|---|---|
| 1 | Setup monorepo (pnpm/Turbo/Biome/Changesets/tsup/Vitest), tsconfig base, CI lint+test+build | 2-3j |
| 2 | Schéma `icons/`, 13 icônes pilotes faites main (color + mono + custom + meta.json) | 4-5j |
| 3 | `tools/build-icons` complet (validation Zod, SVGO, dérivations bg/mono-dark/mono-light, génération manifest + core) | 3-4j |
| 4 | Package `@brand-icons/react` + templates + build + tests snapshot | 2j |
| 5 | Packages `@brand-icons/vue` + `@brand-icons/svelte` + `@brand-icons/wc` | 3j |
| 6 | Site `apps/docs` : init Next.js 15 + Tailwind v4 + shadcn/ui (CLI add components), structure layout, galerie + search/filtres, MDX pages docs | 5-6j |
| 7 | Site : playground live + code copy + download SVG | 3j |
| 8 | Subagent `icon-fetcher.md` + `tools/raster-to-svg` helper | 3-4j |
| 9 | CI publish Changesets + provenance NPM + Dockerfile + workflow deploy Scaleway + BRAND_OWNERS.md | 3j |
| 10 | Premier batch +20 icônes via subagent pour valider workflow scalable | 2-3j |

Total MVP publiable : ~5-6 semaines temps plein.

---

## 16. Questions ouvertes restantes

- **Tests visuels** : ajouter Chromatic / Playwright snapshot screenshots du site doc (CI lourde mais utile contre régressions UI) ?
- **Bench taille bundle** : track via size-limit dans CI (alerte si un import dépasse seuil) ?
- **Internationalisation site doc** : FR + EN dès départ ou EN only initial ?
- **Theming site doc** : dark/light/system toggle via `next-themes` (✅ acquis avec shadcn/ui) — confirmer si OK.
- **Analytics** : Plausible / Umami pour tracker icônes les plus consultées (driver priorisation ajouts) ?

---

## 17. Sprint 1.5 — Setup polish (en cours)

Travaux post initial commit, avant Sprint 2.

### 17.1 Hébergement
- Bascule Vercel → **Scaleway Serverless Containers**.
- Dockerfile `apps/docs/Dockerfile` (multi-stage, Next.js standalone) **(à créer sprint 6/9)**.
- Workflow `.github/workflows/deploy-docs.yml` **(à créer sprint 9)**.

### 17.2 Installation dépendances
- `pnpm install` à la racine du monorepo.
- Commit `pnpm-lock.yaml`.

### 17.3 CLAUDE.md racine
Document chargé automatiquement dans le contexte Claude Code. Format optimisé d'après doc officielle :
- Concis (< 200 lignes).
- Sections : Project overview · Commands · Architecture · Conventions · Workflows.
- Pas de banalités. Spécifique au repo.
- Liste les commandes pnpm/turbo utiles.
- Pointe vers `.claude/rules/*.md` pour règles détaillées.
- Pointe vers `.claude/agents/*.md` pour subagents disponibles.
- Note les fichiers générés (ne pas éditer manuellement).

### 17.4 Split agents

Le précédent `icon-fetcher.md` était trop large. Découpe en deux agents spécialisés :

#### `.claude/agents/icon-fetcher.md` (mis à jour — acquisition)
Responsabilité : récupérer source officielle d'une marque et produire `color.svg` + `mono.svg` + `meta.json`.
- WebSearch + WebFetch source SVG officiel.
- Fallback raster (PNG/JPEG/WebP) → tracer + nettoyage Claude.
- Normalisation viewBox 24×24, suppression metadata.
- Génération `mono.svg` (currentColor, flatten).
- Remplit `meta.json` (slug, name, category, description, tags, brandColor, url, repository, source, license).
- Ne crée **pas** `custom.svg` — délègue à `icon-maker`.

#### `.claude/agents/icon-maker.md` (nouveau — design custom variant)
Responsabilité : créer la variante `custom.svg` style Lucide-stroke à partir de `color.svg` (et/ou `mono.svg`).
- Analyse forme du logo (`Read color.svg`, identifie primitives géométriques).
- Redessine en stroke 1.5px arrondi, fill="none", currentColor.
- viewBox 24×24, contenu dans 20×20 centré.
- Style cohérent avec [Lucide](https://lucide.dev) : minimalisme, primitives reconnaissables, lisibilité 16-24px.
- Valide via `pnpm build:icons --icon=<slug>` après écriture.
- Peut aussi générer variantes d'icônes "homemade" depuis brief texte (pas de logo officiel).

#### Workflow combiné
```bash
/agents icon-fetcher add linear
# → icons/linear/color.svg + mono.svg + meta.json créés
/agents icon-maker draw linear
# → icons/linear/custom.svg créé
```

### 17.5 Rules `.claude/rules/`

Inspirées de `snapship-next`, adaptées au scope librairie d'icônes (pas de DB, pas d'auth, pas de Server Actions). Frontmatter avec `paths` pour scoping ciblé.

| Fichier | Scope | Origine |
|---|---|---|
| `typescript.md` | `**/*.{ts,tsx}` | snapship-next adapté |
| `react.md` | composants React de `packages/react` + `apps/docs` | snapship-next adapté |
| `tests.md` | `**/__tests__/**`, `**/*.test.ts` | snapship-next adapté Vitest + snapshot SVG |
| `monorepo.md` | racine — workspace rules | nouveau |
| `svg.md` | `icons/**/*.svg`, `packages/*/src/icons/**` | nouveau (project-specific) |
| `meta.md` | `icons/**/meta.json` | nouveau (project-specific) |
| `commits.md` | git messages | snapship-next adapté (conventional) |

### 17.6 Ordre d'exécution

1. ✅ Update `PLAN.md` (Scaleway + section §17).
2. `pnpm install` → lockfile.
3. Write `CLAUDE.md` racine.
4. Update `.claude/agents/icon-fetcher.md` (retirer custom variant).
5. Write `.claude/agents/icon-maker.md`.
6. Write `.claude/rules/{typescript,react,tests,monorepo,svg,meta,commits}.md`.
7. Commit `chore: add Claude Code context, rules, agents; switch deploy to Scaleway`.
8. Push.

---

## 18. Décisions verrouillées

- ✅ Scope NPM : `@brand-icons/*`
- ✅ License code : MIT
- ✅ Catégories : liste fermée (§6)
- ✅ Métadonnées : description + tags + url + repository (fallback)
- ✅ Format dist : ESM only, TS strict
- ✅ Monorepo : pnpm + Turborepo
- ✅ Site doc : Next.js 15 + shadcn/ui v4 + Tailwind v4 + lucide-react + MDX
- ✅ Hébergement docs : Scaleway Serverless Containers (région `fr-par`)
- ✅ Agents : split `icon-fetcher` (acquisition) + `icon-maker` (custom variant design)
- ✅ Frameworks supportés : React + Vue + Svelte + Web Components + SVG raw
- ✅ Variant custom : style Lucide stroke 1.5px
- ✅ Pipeline build : génération automatique + override manuel possible
- ✅ Agent : subagent Claude Code dans `.claude/agents/`
- ✅ Conversion raster→SVG : hybride tracer + Claude
- ✅ Legal : disclaimer + procédure retrait active (Option 2)
- ✅ Versioning : Changesets + auto-publish NPM
- ✅ Naming : kebab-case par marque
- ✅ Tooling : tsup + Vitest + Biome
- ✅ Icônes pilotes (13) : GitHub, GitLab, Google, Apple, Atlassian, Facebook, Meta, Claude, OpenAI, Gemini, VS Code, Microsoft, LinkedIn
