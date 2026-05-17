import type { Category, ManifestEntry } from '@brand-icons/core';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { SearchIcon } from 'lucide-react';
import { type ChangeEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { latestIconBySlug } from '@/lib/all-icons';
import { useUrlParam } from '@/lib/use-url-param';
import { cn } from '@/lib/utils';

export type LibraryGridProps = {
  icons: readonly ManifestEntry[];
};

type IconSize = 24 | 32 | 48;
type SortMode = 'alpha' | 'family';

type CategoryRow = {
  readonly value: Category;
  readonly label: string;
  readonly count: number;
};

type GridGeometry = {
  readonly cols: number;
  readonly rowHeight: number;
};

const SIZE_OPTIONS: readonly IconSize[] = [24, 32, 48];
const SORT_OPTIONS: readonly { value: SortMode; label: string }[] = [
  { value: 'alpha', label: 'A→Z' },
  { value: 'family', label: 'CATEGORY' },
];

const GEOMETRY: Readonly<Record<IconSize, GridGeometry>> = {
  24: { cols: 12, rowHeight: 92 },
  32: { cols: 10, rowHeight: 108 },
  48: { cols: 8, rowHeight: 132 },
};

const isSize = (value: string): value is `${IconSize}` => value === '24' || value === '32' || value === '48';
const isSort = (value: string): value is SortMode => value === 'alpha' || value === 'family';

const formatCategory = (category: Category): string =>
  category
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const isMeta = (event: KeyboardEvent | globalThis.KeyboardEvent): boolean => event.metaKey || event.ctrlKey;

const LibraryGrid = ({ icons }: LibraryGridProps) => {
  const [query, setQuery] = useUrlParam('q');
  const [families, setFamilies] = useState<ReadonlySet<Category>>(new Set());
  const [size, setSize] = useState<IconSize>(32);
  const [sort, setSort] = useState<SortMode>('alpha');
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  const categories: readonly CategoryRow[] = useMemo(() => {
    const counts = new Map<Category, number>();
    for (const icon of icons) counts.set(icon.category, (counts.get(icon.category) ?? 0) + 1);
    return [...counts.entries()]
      .map(([value, count]) => ({ value, label: formatCategory(value), count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [icons]);

  const q = query.trim().toLowerCase();
  const filtered = icons.filter((icon) => {
    const matchesQuery = q === '' || icon.name.toLowerCase().includes(q) || icon.category.toLowerCase().includes(q);
    const matchesFamily = families.size === 0 || families.has(icon.category);
    return matchesQuery && matchesFamily;
  });
  const sorted =
    sort === 'family'
      ? [...filtered].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
      : [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  const activeFilters = families.size + (query !== '' ? 1 : 0);
  const { cols, rowHeight } = GEOMETRY[size];
  const rowCount = Math.ceil(sorted.length / cols);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => rowHeight,
    overscan: 6,
    scrollMargin,
    initialRect: { width: 1280, height: 900 },
  });

  useEffect(() => {
    const update = (): void => {
      const next = listRef.current?.offsetTop ?? 0;
      setScrollMargin((prev) => (prev === next ? prev : next));
    };
    update();
    window.addEventListener('resize', update);
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    return () => {
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, []);

  const clearAll = (): void => {
    startTransition(() => {
      setQuery('');
      setFamilies(new Set());
    });
  };

  const handleQuery = (event: ChangeEvent<HTMLInputElement>): void => {
    const next = event.target.value;
    startTransition(() => setQuery(next));
  };

  const handleInputKey = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Escape') {
      event.currentTarget.blur();
      return;
    }
    if (event.key === 'Backspace' && query === '' && families.size > 0) {
      event.preventDefault();
      startTransition(() => setFamilies(new Set()));
    }
  };

  const handleToggleFamily = (value: Category): void => {
    startTransition(() => {
      const next = new Set(families);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      setFamilies(next);
    });
  };

  const handleSizeChange = (value: string): void => {
    if (!isSize(value)) return;
    setSize(Number(value) as IconSize);
  };

  const handleSortChange = (value: string): void => {
    if (!isSort(value)) return;
    setSort(value);
  };

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'k' && isMeta(event)) {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <>
      <section className="border-b border-ink px-10 py-14">
        <div className="flex items-center gap-3 font-mono text-mono font-bold uppercase tracking-meta text-ink-soft">
          <span className="text-accent">—</span>
          <span>·</span>
          <span>Catalog</span>
          <span>·</span>
          <span>{icons.length.toLocaleString('en-US')} icons</span>
          <span>·</span>
          <span>{categories.length} categories</span>
        </div>
        <h1 className="m-0 mt-6 text-h1-xl font-extrabold tracking-display">
          The full <span className="text-accent">library</span>.
        </h1>

        <div className="mt-8 flex flex-wrap items-stretch gap-4">
          <label className="border-thin h-14.5 max-w-230 flex flex-1 items-center gap-3.5 border-ink bg-paper px-4.5">
            <SearchIcon className="size-5 text-ink-soft" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={handleQuery}
              onKeyDown={handleInputKey}
              placeholder="Search by name or category…"
              aria-label="Search icons by name or family"
              className="flex-1 bg-transparent text-base font-medium tracking-tight text-ink outline-none placeholder:text-ink-soft"
            />
            <kbd className="font-mono text-mono uppercase tracking-mono text-ink-soft">⌘ K</kbd>
          </label>

          {activeFilters > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              className="border-thin tracking-pill px-5.5 border-ink bg-transparent text-xs font-semibold uppercase text-ink hover:bg-ink hover:text-paper"
            >
              Clear {activeFilters} {activeFilters === 1 ? 'filter' : 'filters'} ×
            </button>
          ) : null}
        </div>
      </section>

      <section className="grid grid-cols-[260px_1fr] border-b border-ink">
        <aside className="w-65 border-r border-ink px-7 py-8 pb-15">
          <div className="border-b border-paper-alt pb-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-mono-sm font-bold uppercase tracking-mono text-ink-soft">Category</span>
              <span className="font-mono text-mono-sm text-ink-soft">
                {families.size}/{categories.length}
              </span>
            </div>
            <ul className="mt-3.5 flex flex-col gap-2">
              {categories.map((cat) => {
                const checked = families.has(cat.value);
                return (
                  <li key={cat.value}>
                    <label className="group flex w-full cursor-pointer items-center justify-between py-1 text-left text-13 font-medium text-ink hover:text-accent">
                      <span className="flex items-center gap-2.5">
                        <input type="checkbox" checked={checked} onChange={() => handleToggleFamily(cat.value)} className="sr-only" />
                        <span
                          aria-hidden
                          className={cn('border-thin size-3.5 border-ink transition-colors', checked ? 'bg-accent' : 'bg-paper')}
                        />
                        {cat.label}
                      </span>
                      <span className="font-mono text-mono-sm text-ink-soft">{cat.count}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          <pre className="mt-6 whitespace-pre font-mono text-mono-sm leading-mono-relaxed text-ink-soft">{`// ⌘K focus search
// ⌫ to clear filters
// ↵ to open icon`}</pre>
        </aside>

        <div className="bg-paper-warm">
          <div className="sticky top-12 z-10 flex items-center justify-between border-b border-ink bg-paper-warm px-8 py-3.5">
            <p aria-live="polite" className="font-mono text-mono text-ink">
              <span className="mr-2 text-accent">●</span>
              {sorted.length} icons · filtered from {icons.length}
            </p>
            <div className="flex items-center gap-5">
              <ToggleGroup
                type="single"
                value={String(size)}
                onValueChange={handleSizeChange}
                variant="segment"
                aria-label="Icon size"
                className="rounded-none"
              >
                {SIZE_OPTIONS.map((option) => (
                  <ToggleGroupItem key={option} value={String(option)} className="h-7 min-w-9 px-2.5 py-1">
                    {option}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <ToggleGroup
                type="single"
                value={sort}
                onValueChange={handleSortChange}
                variant="segment-accent"
                aria-label="Sort order"
                className="rounded-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <ToggleGroupItem key={option.value} value={option.value} className="h-7 px-2.5 py-1">
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="px-10 py-30 text-center">
              <p className="text-h2 font-extrabold tracking-display-sm text-ink">No match.</p>
              <p className="mx-auto mt-4 max-w-100 text-13 text-ink-soft-2">Try clearing one of the filters, or type fewer characters.</p>
              <Button variant="accent" size="cta" onClick={clearAll} className="mt-7 rounded-none">
                Clear all filters
              </Button>
            </div>
          ) : (
            <div ref={listRef} className="relative" style={{ height: `${totalSize}px` }}>
              {virtualRows.map((row) => {
                const startIndex = row.index * cols;
                return (
                  <div
                    key={row.key}
                    data-index={row.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${row.size}px`,
                      transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
                      display: 'grid',
                      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    }}
                  >
                    {sorted.slice(startIndex, startIndex + cols).map((icon, c) => {
                      const idx = startIndex + c;
                      const Icon = latestIconBySlug[icon.slug];
                      const id = String(idx + 1).padStart(4, '0');
                      return (
                        <a
                          key={icon.slug}
                          href={`/icon/${icon.slug}`}
                          className="group relative flex h-full flex-col items-center gap-2 border-r border-b border-ink bg-paper px-2 pt-3.5 pb-2.5 text-ink transition-colors hover:bg-paper-alt"
                        >
                          <span className="left-1.75 top-1.25 absolute font-mono text-mono-xs font-bold uppercase opacity-50">{id}</span>
                          <span className="flex flex-1 items-center justify-center">
                            {Icon ? (
                              <Icon size={size} variant="color" />
                            ) : (
                              <span className="font-mono text-mono-xs uppercase opacity-50">{icon.name}</span>
                            )}
                          </span>
                          <span className="text-mono-sm font-medium tracking-tight">{icon.name}</span>
                        </a>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {sorted.length > 0 ? (
            <div className="flex items-center justify-between border-r border-ink bg-paper px-8 py-5">
              <p className="font-mono text-mono text-ink-soft">
                {sorted.length} of {icons.length} icons rendered on demand
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
};

export default LibraryGrid;
