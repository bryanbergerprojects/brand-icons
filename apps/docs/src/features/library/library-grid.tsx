import type { Category, ManifestEntry } from '@brand-icons/core';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { SearchIcon, SlidersHorizontalIcon } from 'lucide-react';
import { type ChangeEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
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

type Breakpoint = 'mobile' | 'sm' | 'md' | 'lg';

const SIZE_OPTIONS: readonly IconSize[] = [24, 32, 48];
const SORT_OPTIONS: readonly { value: SortMode; label: string }[] = [
  { value: 'alpha', label: 'A→Z' },
  { value: 'family', label: 'CATEGORY' },
];

const ROW_HEIGHT: Readonly<Record<IconSize, number>> = {
  24: 92,
  32: 108,
  48: 132,
};

const DESKTOP_COLS: Readonly<Record<IconSize, number>> = {
  24: 12,
  32: 10,
  48: 8,
};

const BREAKPOINT_COLS: Readonly<Record<Exclude<Breakpoint, 'lg'>, number>> = {
  mobile: 2,
  sm: 4,
  md: 8,
};

const resolveBreakpoint = (width: number): Breakpoint => {
  if (width >= 1024) return 'lg';
  if (width >= 768) return 'md';
  if (width >= 640) return 'sm';
  return 'mobile';
};

const resolveGeometry = ({ breakpoint, size }: { breakpoint: Breakpoint; size: IconSize }): GridGeometry => ({
  cols: breakpoint === 'lg' ? DESKTOP_COLS[size] : BREAKPOINT_COLS[breakpoint],
  rowHeight: ROW_HEIGHT[size],
});

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
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');

  useEffect(() => {
    const sync = (): void => setBreakpoint(resolveBreakpoint(window.innerWidth));
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

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
  const { cols, rowHeight } = resolveGeometry({ breakpoint, size });
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

  const categoryList = (
    <ul className="flex flex-col gap-2">
      {categories.map((cat) => {
        const checked = families.has(cat.value);
        return (
          <li key={cat.value}>
            <label className="group flex w-full cursor-pointer items-center justify-between py-1 text-left text-13 font-medium text-ink hover:text-accent">
              <span className="flex items-center gap-2.5">
                <input type="checkbox" checked={checked} onChange={() => handleToggleFamily(cat.value)} className="sr-only" />
                <span aria-hidden className={cn('border-thin size-3.5 border-ink transition-colors', checked ? 'bg-accent' : 'bg-paper')} />
                {cat.label}
              </span>
              <span className="font-mono text-mono-sm text-ink-soft">{cat.count}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <section className="border-b border-ink px-4 py-10 sm:px-6 sm:py-12 md:px-8 lg:px-10 lg:py-14">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-mono font-bold uppercase tracking-meta text-ink-soft">
          <span className="text-accent">—</span>
          <span>Catalog</span>
          <span>·</span>
          <span>{icons.length.toLocaleString('en-US')} icons</span>
          <span>·</span>
          <span>{categories.length} categories</span>
        </div>
        <h1 className="m-0 mt-5 text-stat font-extrabold tracking-display-sm sm:mt-6 sm:text-h3 md:text-h2 lg:text-h1">
          The full <span className="text-accent">library</span>.
        </h1>

        <div className="mt-7 flex flex-wrap items-stretch gap-3 sm:gap-4 lg:mt-8">
          <label className="border-thin h-12 max-w-230 flex flex-1 items-center gap-3 border-ink bg-paper px-3.5 sm:h-14.5 sm:gap-3.5 sm:px-4.5">
            <SearchIcon className="size-4 shrink-0 text-ink-soft sm:size-5" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={handleQuery}
              onKeyDown={handleInputKey}
              placeholder="Search…"
              aria-label="Search icons by name or family"
              className="min-w-0 flex-1 bg-transparent text-sm font-medium tracking-tight text-ink outline-none placeholder:text-ink-soft sm:text-base"
            />
            <kbd className="hidden font-mono text-mono uppercase tracking-mono text-ink-soft sm:inline">⌘ K</kbd>
          </label>

          <Drawer>
            <DrawerTrigger
              aria-label="Open category filters"
              className="border-thin inline-flex h-12 items-center justify-center gap-2 border-ink bg-paper px-4 text-13 font-medium uppercase tracking-pill text-ink transition-colors hover:bg-paper-alt focus-visible:outline-2 focus-visible:outline-accent sm:h-14.5 sm:px-5 lg:hidden"
            >
              <SlidersHorizontalIcon className="size-4" aria-hidden />
              <span className="hidden sm:inline">Filters</span>
              {families.size > 0 ? (
                <span className="bg-accent text-paper inline-flex h-5 min-w-5 items-center justify-center px-1 font-mono text-mono-sm font-bold">
                  {families.size}
                </span>
              ) : null}
            </DrawerTrigger>
            <DrawerContent className="border-t-thin border-ink bg-paper">
              <DrawerHeader className="flex-row items-center justify-between border-b border-ink/30 text-left">
                <DrawerTitle className="font-mono text-mono-sm font-bold uppercase tracking-uppercase text-ink-soft">
                  Categories ({families.size}/{categories.length})
                </DrawerTitle>
              </DrawerHeader>
              <div className="flex-1 overflow-y-auto px-5 py-5">{categoryList}</div>
              {families.size > 0 ? (
                <div className="border-t border-ink/30 p-4">
                  <Button variant="outline" className="w-full" onClick={() => startTransition(() => setFamilies(new Set()))}>
                    Clear {families.size} {families.size === 1 ? 'filter' : 'filters'}
                  </Button>
                </div>
              ) : null}
            </DrawerContent>
          </Drawer>

          {activeFilters > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              className="border-thin tracking-pill h-12 border-ink bg-transparent px-4 text-xs font-semibold uppercase text-ink hover:bg-ink hover:text-paper sm:h-14.5 sm:px-5.5"
            >
              Clear {activeFilters} ×
            </button>
          ) : null}
        </div>
      </section>

      <section className="border-b border-ink lg:grid lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-ink px-7 py-8 pb-15 lg:block">
          <div className="border-b border-paper-alt pb-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-mono-sm font-bold uppercase tracking-mono text-ink-soft">Category</span>
              <span className="font-mono text-mono-sm text-ink-soft">
                {families.size}/{categories.length}
              </span>
            </div>
            <div className="mt-3.5">{categoryList}</div>
          </div>
        </aside>

        <div className="bg-paper-warm">
          <div className="sticky top-12 z-10 flex items-center justify-between gap-4 border-b border-ink bg-paper-warm px-4 py-3 sm:px-6 sm:py-3.5 md:px-8">
            <p aria-live="polite" className="truncate font-mono text-mono text-ink">
              <span className="mr-2 text-accent">●</span>
              <span className="hidden sm:inline">
                {sorted.length} icons · filtered from {icons.length}
              </span>
              <span className="sm:hidden">{sorted.length} icons</span>
            </p>
            <div className="flex shrink-0 items-center gap-3 sm:gap-5">
              <ToggleGroup
                type="single"
                value={String(size)}
                onValueChange={handleSizeChange}
                variant="segment"
                aria-label="Icon size"
                className="hidden rounded-none md:flex"
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
            <div className="px-6 py-20 text-center sm:px-10 sm:py-30">
              <p className="text-h3 font-extrabold tracking-display-sm text-ink sm:text-h2">No match.</p>
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
            <div className="flex items-center justify-between border-r border-ink bg-paper px-4 py-4 sm:px-6 sm:py-5 md:px-8">
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
