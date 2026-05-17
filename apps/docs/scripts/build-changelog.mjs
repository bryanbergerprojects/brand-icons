#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..');
const PACKAGES_DIR = join(REPO_ROOT, 'packages');
const OUT_DIR = join(HERE, '..', 'src', 'generated');
const OUT_FILE = join(OUT_DIR, 'releases.json');

const REPO_SLUG = 'bryanbergerprojects/brand-icons';
const MAX_RELEASES = 5;
const MAX_ITEMS = 5;

const SECTION_TAG = {
  'Major Changes': 'major',
  'Minor Changes': 'minor',
  'Patch Changes': 'patch',
};
const SECTION_KIND = {
  'Major Changes': 'breaking',
  'Minor Changes': 'add',
  'Patch Changes': 'fix',
};
const TAG_RANK = { patch: 1, minor: 2, major: 3 };
const KIND_PRIORITY = ['breaking', 'add', 'perf', 'fix'];

const isPrerelease = (v) => v.includes('-');

const inferKind = (desc, section) => {
  if (/^breaking[\s:!]/i.test(desc) || /^!/.test(desc)) return 'breaking';
  if (/^feat[\s(:!]/i.test(desc) || /^add\b/i.test(desc) || /^new\b/i.test(desc)) return 'add';
  if (/^perf[\s(:!]/i.test(desc)) return 'perf';
  if (/^fix[\s(:!]/i.test(desc)) return 'fix';
  return SECTION_KIND[section] ?? 'fix';
};

const cleanDesc = (raw) => {
  let d = raw.trim();
  d = d.replace(/^[a-f0-9]{6,40}:\s*/i, '');
  d = d.replace(/^(feat|fix|perf|breaking|add|new)(\([^)]+\))?!?:\s*/i, '');
  return d.trim();
};

const parseChangelog = (md) => {
  const versions = new Map();
  let curVersion = null;
  let curSection = null;
  for (const line of md.split('\n')) {
    const v = line.match(/^##\s+([0-9]+\.[0-9]+\.[0-9]+[^\s]*)\s*$/);
    if (v) {
      curVersion = v[1];
      curSection = null;
      if (!versions.has(curVersion)) versions.set(curVersion, { items: [], sections: new Set() });
      continue;
    }
    if (!curVersion) continue;
    const s = line.match(/^###\s+(.+?)\s*$/);
    if (s) {
      curSection = s[1].trim();
      if (SECTION_TAG[curSection]) versions.get(curVersion).sections.add(curSection);
      continue;
    }
    const it = line.match(/^-\s+(.+)$/);
    if (it && curSection) {
      const raw = it[1].trim();
      if (/^updated dependencies/i.test(raw)) continue;
      const hashStripped = raw.replace(/^[a-f0-9]{6,40}:\s*/i, '');
      const kind = inferKind(hashStripped, curSection);
      const desc = cleanDesc(raw);
      if (!desc) continue;
      versions.get(curVersion).items.push({ kind, desc });
    }
  }
  return versions;
};

const cmpSemverDesc = (a, b) => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const ai = pa[i] ?? 0;
    const bi = pb[i] ?? 0;
    if (ai !== bi) return bi - ai;
  }
  return 0;
};

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getTagDate = (version) => {
  try {
    const out = execSync(`git log -1 --format=%aI v${version}`, {
      cwd: REPO_ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.toString().trim() || null;
  } catch {
    return null;
  }
};

const trimItems = (items) => {
  if (items.length <= MAX_ITEMS) return { items, truncated: false };
  const byKind = new Map(KIND_PRIORITY.map((k) => [k, []]));
  for (const it of items) {
    if (!byKind.has(it.kind)) byKind.set(it.kind, []);
    byKind.get(it.kind).push(it);
  }
  const picked = [];
  const seen = new Set();
  for (const k of KIND_PRIORITY) {
    const g = byKind.get(k);
    if (g && g.length && picked.length < MAX_ITEMS) {
      picked.push(g[0]);
      seen.add(g[0]);
    }
  }
  for (const k of KIND_PRIORITY) {
    const g = byKind.get(k) ?? [];
    for (const it of g) {
      if (picked.length >= MAX_ITEMS) break;
      if (seen.has(it)) continue;
      picked.push(it);
      seen.add(it);
    }
    if (picked.length >= MAX_ITEMS) break;
  }
  return { items: picked, truncated: true };
};

const write = (releases) => {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, `${JSON.stringify(releases, null, 2)}\n`, 'utf8');
  console.log(`[changelog] wrote ${releases.length} release(s) → ${OUT_FILE}`);
};

const main = () => {
  if (!existsSync(PACKAGES_DIR)) {
    write([]);
    return;
  }

  const aggregated = new Map();
  for (const pkg of readdirSync(PACKAGES_DIR)) {
    const file = join(PACKAGES_DIR, pkg, 'CHANGELOG.md');
    if (!existsSync(file)) continue;
    const parsed = parseChangelog(readFileSync(file, 'utf8'));
    for (const [version, { items, sections }] of parsed) {
      if (isPrerelease(version)) continue;
      if (!aggregated.has(version)) aggregated.set(version, { tag: 'patch', items: new Map() });
      const slot = aggregated.get(version);
      for (const s of sections) {
        const t = SECTION_TAG[s];
        if (t && TAG_RANK[t] > TAG_RANK[slot.tag]) slot.tag = t;
      }
      for (const it of items) {
        const key = it.desc.toLowerCase();
        if (!slot.items.has(key)) slot.items.set(key, it);
      }
    }
  }

  const releases = [...aggregated.entries()]
    .sort(([a], [b]) => cmpSemverDesc(a, b))
    .slice(0, MAX_RELEASES)
    .map(([v, { tag, items }]) => {
      const all = [...items.values()];
      const { items: trimmed, truncated } = trimItems(all);
      return {
        v,
        d: formatDate(getTagDate(v)),
        tag,
        items: trimmed,
        truncated,
        url: `https://github.com/${REPO_SLUG}/releases/tag/v${v}`,
      };
    });

  write(releases);
};

main();
