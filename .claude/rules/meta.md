---
description: meta.json schema and constraints — brand-level, year-aware (years[], palette[], latest)
paths:
  - 'icons/**/meta.json'
  - 'tools/build-icons/src/validation.ts'
---

# meta.json Rules

Every brand directory contains **one** `meta.json` at the brand root
(`icons/<slug>/meta.json`) — never per year. The Zod schema in
`tools/build-icons` is the source of truth; these rules make it legible
to humans.

## §1 Must follow

### 1.1 Required shape

```json
{
  "slug": "apple",
  "name": "Apple",
  "category": "platforms",
  "description": "American hardware and software company (Mac, iPhone, iPad).",
  "tags": ["hardware", "macos", "ios", "consumer-electronics", "cupertino"],
  "brandColor": "#000000",
  "url": "https://apple.com",
  "license": "Trademark — usage for identification (fair use)",
  "latest": "2017",
  "years": [
    {
      "year": "1976",
      "palette": ["#A6CE39", "#FFB81C", "#F37021", "#E51E32", "#7B287D", "#0079C2"],
      "source": "https://...",
      "notes": "Rainbow Apple, designed by Rob Janoff."
    },
    {
      "year": "1998",
      "palette": ["#000000"],
      "source": "https://..."
    },
    {
      "year": "2017",
      "palette": ["#000000"],
      "source": "https://..."
    }
  ],
  "addedAt": "2026-05-16",
  "updatedAt": "2026-05-16"
}
```

Required: `slug`, `name`, `category`, `description`, `tags`, `brandColor`,
`url`, `license`, `latest`, `years` (≥1 entry), `addedAt`, `updatedAt`.
Optional: `repository`, `aliases`, `notes`. Each `years[]` entry requires
`year`, `palette`, `source`; `notes` optional.

### 1.2 `slug` constraints

- kebab-case ASCII (`[a-z0-9-]+`).
- No leading / trailing `-`, no consecutive `--`.
- Must match the parent directory name exactly.
- Cannot collide with another icon's `slug` or `aliases` entry.

### 1.3 `category` is a closed enum

Exactly one of:

```
ai · dev-tools · platforms · productivity · social · communication ·
design · payments · analytics · e-commerce · search-web · storage-cloud ·
media · gaming · finance · other
```

Adding a new category is breaking and requires ≥ 3 candidate icons.

### 1.4 `description`

- 20–200 characters.
- Neutral, factual prose. No marketing language ("amazing", "leading", "best-in-class").
- Ends with a period.
- Mentions what the brand does, not what it markets.

### 1.5 `tags`

- 5 to 10 entries.
- Lowercase kebab-case ASCII.
- Distinct from `slug`, `name`, `category` (no redundancy).
- Sorted from most to least specific.

### 1.6 `brandColor`

- Format `#RRGGBB` (uppercase hex), no shorthand.
- Equals the dominant color of the **`latest`** year's `color.svg` —
  pipeline derives it from `years[latest].palette[0]` if omitted, but
  the canonical value lives here for clarity.
- Used to render the `background` prop default.

### 1.7 `url` and `repository`

- `url`: official site of the brand. Must respond 200.
- `repository`: optional fallback when no marketing site exists.

### 1.8 `license`

Literal string: `"Trademark — usage for identification (fair use)"`.
A deliberate constant — any deviation triggers a Zod error.

### 1.9 Dates

- `addedAt`: never mutates after creation.
- `updatedAt`: refreshed whenever any file under `icons/<slug>/**` changes.
- Both ISO 8601 date-only (`YYYY-MM-DD`).

### 1.10 `latest` must resolve

`meta.latest` must equal one of `meta.years[].year`. The pipeline
exposes the matching entry as the default export of the icon component
(`<AppleIcon />` ≡ `<AppleIcon.Latest />`).

### 1.11 `years[].year`

- Format `^\d{4}$` (string, not number — preserves leading zero safety
  and matches the directory name `icons/<slug>/<year>/`).
- A directory `icons/<slug>/<year>/` MUST exist with both `color.svg`
  and `mono.svg` for every entry.
- Sorted ascending in the file (chronological).
- No duplicates.

### 1.12 `years[].palette`

- 1 to 12 hex colors `#RRGGBB`, uppercase.
- Dominant colors of that year's `color.svg`, sorted by surface area
  (most prominent first).
- Pipeline extracts via SVG fill scan + clustering; humans may edit
  the result but the build will re-extract and fail the build on
  divergence > 1 entry.

### 1.13 `years[].source`

The URL the SVG was downloaded from. `web.archive.org/wayback/...`
permitted for retired official assets — see open question in
[[00-vision-stack]].

## §2 Conventions

### 2.1 `aliases`

Alternative slugs that resolve in docs search but don't get their own
directory. Must not collide with another icon's `slug` or `aliases`.

```json
"aliases": ["visual-studio-code", "ms-code"]
```

### 2.2 `years[].notes`

Free-form one-liner per millésime: designer, context, anecdote.
Surfaces in the docs site under the year picker.

### 2.3 Brand-level `notes`

Optional free-form one-liner for the brand itself (e.g. raster fallback
on a specific year, non-square viewBox justification). Surfaces in CI
logs, not in the docs gallery.

### 2.4 Key ordering

Stable order for clean diffs:

```
slug → name → category → description → tags → brandColor →
url → repository → license → aliases → latest → years →
addedAt → updatedAt → notes
```

Within each `years[]` entry: `year → palette → source → notes`.

The build pipeline rewrites `meta.json` in this order after validation.
