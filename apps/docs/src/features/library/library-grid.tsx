import type { ManifestEntry } from '@brand-icons/core';
import Fuse, { type IFuseOptions } from 'fuse.js';
import { type ChangeEvent, useMemo, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { latestIconBySlug } from '@/lib/all-icons';
import { useUrlParam } from '@/lib/use-url-param';
import { cn } from '@/lib/utils';

export type LibraryGridProps = {
  icons: readonly ManifestEntry[];
};

const fuseOptions: IFuseOptions<ManifestEntry> = {
  keys: [
    { name: 'name', weight: 0.4 },
    { name: 'slug', weight: 0.3 },
    { name: 'aliases', weight: 0.2 },
    { name: 'tags', weight: 0.15 },
    { name: 'description', weight: 0.1 },
    { name: 'category', weight: 0.05 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
};

const LibraryGrid = ({ icons }: LibraryGridProps) => {
  const [query, setQuery] = useUrlParam('q');
  const [category, setCategory] = useUrlParam('cat');
  const [, startTransition] = useTransition();

  const categories = Array.from(new Set(icons.map((icon) => icon.category))).sort();
  const fuse = useMemo(() => new Fuse([...icons], fuseOptions), [icons]);

  const ranked = query === '' ? icons : fuse.search(query).map((result) => result.item);
  const filtered = category === '' ? ranked : ranked.filter((icon) => icon.category === category);

  const handleQuery = (event: ChangeEvent<HTMLInputElement>): void => {
    const next = event.target.value;
    startTransition(() => setQuery(next));
  };

  const handleCategory = (next: string): void => {
    startTransition(() => setCategory(category === next ? '' : next));
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={query}
          onChange={handleQuery}
          placeholder="Search by name, tag, alias…"
          aria-label="Search icons"
          className="max-w-sm border-ink/15 bg-paper font-mono text-sm shadow-none"
        />
        <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
          {filtered.length} / {icons.length}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleCategory('')}
          className={cn(
            'border px-3 py-1 font-mono text-xs uppercase tracking-widest transition-colors',
            category === '' ? 'border-accent bg-accent text-paper' : 'border-ink/15 text-ink hover:border-accent hover:text-accent'
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => handleCategory(cat)}
            className={cn(
              'border px-3 py-1 font-mono text-xs uppercase tracking-widest transition-colors',
              category === cat ? 'border-accent bg-accent text-paper' : 'border-ink/15 text-ink hover:border-accent hover:text-accent'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-12 font-mono text-xs uppercase tracking-widest text-ink-muted">No icon matches the current filters.</p>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-px bg-ink/10 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((icon) => {
            const Icon = latestIconBySlug[icon.slug];
            return (
              <li key={icon.slug} className="bg-paper">
                <a href={`/icon/${icon.slug}`} className="group flex h-full flex-col gap-4 p-6 transition-colors hover:bg-surface-muted">
                  <div className="flex h-16 items-center justify-start">
                    {Icon ? <Icon size={48} /> : <span className="text-ink-muted">{icon.name}</span>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{icon.name}</span>
                    <span className="font-mono text-xs uppercase tracking-widest text-ink-muted">{icon.category}</span>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LibraryGrid;
