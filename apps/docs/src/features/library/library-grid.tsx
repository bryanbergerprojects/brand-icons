import type { ManifestEntry } from '@brand-icons/core';
import Fuse, { type IFuseOptions } from 'fuse.js';
import { type ChangeEvent, useMemo, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { latestIconBySlug } from '@/lib/all-icons';
import { useUrlParam } from '@/lib/use-url-param';
import { cn } from '@/lib/utils';

export type LibraryGridProps = {
  icons: readonly ManifestEntry[];
};

type SortMode = 'alpha-asc' | 'alpha-desc' | 'added-desc';

const SORT_OPTIONS: readonly { value: SortMode; label: string }[] = [
  { value: 'alpha-asc', label: 'A → Z' },
  { value: 'alpha-desc', label: 'Z → A' },
  { value: 'added-desc', label: 'Recently added' },
];

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

const parseList = (raw: string): readonly string[] => (raw === '' ? [] : raw.split(',').filter((value) => value !== ''));

const isSortMode = (value: string): value is SortMode => SORT_OPTIONS.some((option) => option.value === value);

const LibraryGrid = ({ icons }: LibraryGridProps) => {
  const [query, setQuery] = useUrlParam('q');
  const [categoriesParam, setCategoriesParam] = useUrlParam('cat');
  const [sortParam, setSortParam] = useUrlParam('sort');
  const [, startTransition] = useTransition();

  const activeCategories = parseList(categoriesParam);
  const sort: SortMode = isSortMode(sortParam) ? sortParam : 'alpha-asc';

  const allCategories = Array.from(new Set(icons.map((icon) => icon.category))).sort();
  const fuse = useMemo(() => new Fuse([...icons], fuseOptions), [icons]);

  const ranked = query === '' ? icons : fuse.search(query).map((result) => result.item);
  const filtered = activeCategories.length === 0 ? ranked : ranked.filter((icon) => activeCategories.includes(icon.category));

  const sorted = (() => {
    if (sort === 'alpha-desc') return [...filtered].sort((a, b) => b.name.localeCompare(a.name));
    if (sort === 'added-desc') return [...filtered].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    if (query !== '') return filtered;
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  })();

  const handleQuery = (event: ChangeEvent<HTMLInputElement>): void => {
    const next = event.target.value;
    startTransition(() => setQuery(next));
  };

  const handleToggleCategory = (category: string): void => {
    const next = activeCategories.includes(category)
      ? activeCategories.filter((value) => value !== category)
      : [...activeCategories, category];
    startTransition(() => setCategoriesParam(next.join(',')));
  };

  const handleClearCategories = (): void => {
    startTransition(() => setCategoriesParam(''));
  };

  const handleSort = (next: string): void => {
    if (!isSortMode(next)) return;
    startTransition(() => setSortParam(next === 'alpha-asc' ? '' : next));
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
        <div className="flex items-center gap-4">
          <Select value={sort} onValueChange={handleSort}>
            <SelectTrigger
              aria-label="Sort icons"
              className="h-9 rounded-none border-ink/15 bg-paper font-mono text-xs uppercase tracking-widest shadow-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none border-ink/15 bg-paper">
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="rounded-none font-mono text-xs uppercase tracking-widest">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
            {sorted.length} / {icons.length}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleClearCategories}
          className={cn(
            'border px-3 py-1 font-mono text-xs uppercase tracking-widest transition-colors',
            activeCategories.length === 0
              ? 'border-accent bg-accent text-paper'
              : 'border-ink/15 text-ink hover:border-accent hover:text-accent'
          )}
        >
          All
        </button>
        {allCategories.map((cat) => {
          const active = activeCategories.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              aria-pressed={active}
              onClick={() => handleToggleCategory(cat)}
              className={cn(
                'border px-3 py-1 font-mono text-xs uppercase tracking-widest transition-colors',
                active ? 'border-accent bg-accent text-paper' : 'border-ink/15 text-ink hover:border-accent hover:text-accent'
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {sorted.length === 0 ? (
        <p className="mt-12 font-mono text-xs uppercase tracking-widest text-ink-muted">No icon matches the current filters.</p>
      ) : (
        <ul className="mt-10 grid grid-cols-2 border-t border-l border-ink/10 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((icon) => {
            const Icon = latestIconBySlug[icon.slug];
            return (
              <li key={icon.slug} className="border-r border-b border-ink/10 bg-paper">
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
