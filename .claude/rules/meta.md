---
description: meta.json schema and constraints — required fields, categories, slug rules, validation
paths:
  - 'icons/**/meta.json'
  - 'tools/build-icons/src/validation.ts'
---

# meta.json Rules

Every icon directory contains a `meta.json` validated by Zod in
`tools/build-icons`. The schema is the source of truth — these rules
make the schema legible to humans.

## §1 Must follow

### 1.1 Required fields

```json
{
  "slug": "github",
  "name": "GitHub",
  "category": "dev-tools",
  "description": "Platform for hosting and collaborating on Git-based source code.",
  "tags": ["git", "code", "vcs", "repository", "collaboration", "open-source", "devops"],
  "brandColor": "#181717",
  "url": "https://github.com",
  "license": "Trademark — usage for identification (fair use)",
  "addedAt": "2026-05-16",
  "updatedAt": "2026-05-16"
}
```

All of the above are mandatory. `repository`, `source`, `aliases`, `notes` are optional.

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

Adding a new category is a breaking change and requires ≥ 3 candidate
icons to justify.

### 1.4 `description`

- 20–200 characters.
- Neutral, factual prose. No marketing language ("amazing", "leading", "best-in-class").
- Ends with a period.
- Mentions what the brand does, not what it markets.

### 1.5 `tags`

- 5 to 10 entries.
- Lowercase, kebab-case, ASCII only.
- Distinct from `slug`, `name`, `category` (no redundancy).
- Sorted from most to least specific.

```json
// ❌ Bad — too few, redundant with name, marketing
["github", "best", "vcs"]

// ✅ Good
["git", "code", "vcs", "repository", "collaboration", "open-source", "devops"]
```

### 1.6 `brandColor`

- Format `#RRGGBB` (uppercase hex), no shorthand.
- Must match the dominant color of the official logo (or the primary brand color when the logo is multicolor).
- Used to render the `*-bg` variants — choose a value with sufficient contrast against white text at 16 px.

### 1.7 `url` and `repository`

- `url`: official site of the brand. Must respond 200.
- `repository`: optional fallback when no marketing site exists (open-source projects). Must point to the brand's organization or canonical repo.

### 1.8 `license`

Literal string: `"Trademark — usage for identification (fair use)"`.
Other text triggers a validation error — this field is a deliberate
constant so we cannot accidentally claim ownership.

### 1.9 Dates

- `addedAt`: never mutates after creation.
- `updatedAt`: refreshed whenever any file in the icon folder changes.
- Both ISO 8601 date-only (`YYYY-MM-DD`).

## §2 Conventions

### 2.1 `aliases`

Use for alternative slugs that should redirect / resolve in the docs
search but not occupy their own directory.

```json
"aliases": ["visual-studio-code", "ms-code"]
```

Aliases must not collide with another icon's `slug` or `aliases`.

### 2.2 `source`

The URL the SVG was downloaded from. Helps reviewers verify authenticity.

```json
"source": "https://github.com/logos"
```

### 2.3 `notes`

Free-form one-liner for unusual situations (e.g. raster fallback used, non-square viewBox justification). Surfaces in CI logs, not in the docs site.

### 2.4 Ordering of keys

Stable order for clean diffs:

```
slug → name → category → description → tags → brandColor →
url → repository → source → license → aliases → addedAt → updatedAt → notes
```

The build pipeline rewrites `meta.json` in this order after validation.
