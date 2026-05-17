import { ChevronDownIcon, DownloadIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

const MONO_PALETTE: readonly string[] = ['#111111', '#D7361A', '#1F6FEB', '#0E8A4F', '#7A7768'];

export type PlaygroundYear = {
  readonly year: string;
  readonly mono: string;
  readonly color: string;
  readonly palette: readonly string[];
};

export type PlaygroundProps = {
  iconName: string;
  slug: string;
  componentName: string;
  brandColor: string;
  years: readonly PlaygroundYear[];
  defaultYear: string;
  id?: string;
};

const FRAMEWORKS = ['React', 'Vue', 'Svelte', 'WebC', 'SVG'] as const;
type Framework = (typeof FRAMEWORKS)[number];

type ColorMode = 'official' | 'bw' | 'wb' | 'mono';

const COLOR_MODES: readonly { id: ColorMode; label: string }[] = [
  { id: 'official', label: 'Official' },
  { id: 'bw', label: 'B&W' },
  { id: 'wb', label: 'W&B' },
  { id: 'mono', label: 'Mono' },
];

const SIZES: readonly number[] = [16, 24, 32, 48];

const COPY_FEEDBACK_MS = 1400;

const sizedSvg = ({ raw, size }: { raw: string; size: number }): string =>
  raw.replace(
    /<svg([^>]*)>/,
    (_match, attrs: string) => `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, '')} width="${size}" height="${size}">`
  );

const buildSnippets = ({
  componentName,
  slug,
  size,
  year,
  mode,
  monoSvg,
  colorSvg,
}: {
  componentName: string;
  slug: string;
  size: number;
  year: string;
  mode: ColorMode;
  monoSvg: string;
  colorSvg: string;
}): Record<Framework, string> => {
  const variantProp = mode === 'official' ? 'color' : 'mono';
  const raw = mode === 'official' ? colorSvg : monoSvg;
  return {
    React: `import { ${componentName}${year}Icon } from '@brand-icons/react';\n\n<${componentName}${year}Icon size={${size}} variant="${variantProp}" />`,
    Vue: `<script setup>\nimport { ${componentName}${year}Icon } from '@brand-icons/vue';\n</script>\n\n<${componentName}${year}Icon :size="${size}" variant="${variantProp}" />`,
    Svelte: `<script>\n  import { ${componentName}${year}Icon } from '@brand-icons/svelte';\n</script>\n\n<${componentName}${year}Icon size={${size}} variant="${variantProp}" />`,
    WebC: `<brand-icon-${slug}-${year} size="${size}" variant="${variantProp}"></brand-icon-${slug}-${year}>`,
    SVG: sizedSvg({ raw, size }),
  };
};

const downloadBlob = ({ contents, filename }: { contents: string; filename: string }): void => {
  const blob = new Blob([contents], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const Playground = ({ iconName, slug, componentName, brandColor, years, defaultYear, id }: PlaygroundProps) => {
  const initialIndex = Math.max(
    0,
    years.findIndex((entry) => entry.year === defaultYear)
  );
  const [yearIndex, setYearIndex] = useState<number>(initialIndex);
  const [size, setSize] = useState<number>(32);
  const [mode, setMode] = useState<ColorMode>('official');
  const [monoColor, setMonoColor] = useState<string>(MONO_PALETTE[0] ?? brandColor);
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [copiedFramework, setCopiedFramework] = useState<Framework | null>(null);
  const paletteRef = useRef<HTMLDivElement | null>(null);

  const yearEntry = years[yearIndex] ?? years[0];
  if (!yearEntry) throw new Error(`Playground: ${slug} has no year entries`);

  const previewPx = size * 4;

  const stageColor = mode === 'mono' ? monoColor : mode === 'bw' ? '#111111' : mode === 'wb' ? '#f5f4f1' : null;

  const stageBg = mode === 'official' ? 'bg-canvas-grid' : mode === 'bw' ? 'bg-paper' : mode === 'wb' ? 'bg-ink' : 'bg-canvas-grid';

  const stageSvg = mode === 'official' ? yearEntry.color : yearEntry.mono;
  const stageMarkup = sizedSvg({ raw: stageSvg, size: previewPx });

  const snippets = buildSnippets({
    componentName,
    slug,
    size,
    year: yearEntry.year,
    mode,
    monoSvg: yearEntry.mono,
    colorSvg: yearEntry.color,
  });

  useEffect(() => {
    if (copiedFramework === null) return;
    const handle = window.setTimeout(() => setCopiedFramework(null), COPY_FEEDBACK_MS);
    return () => window.clearTimeout(handle);
  }, [copiedFramework]);

  useEffect(() => {
    if (!paletteOpen) return;
    const handleMouseDown = (event: MouseEvent): void => {
      if (paletteRef.current && event.target instanceof Node && !paletteRef.current.contains(event.target)) {
        setPaletteOpen(false);
      }
    };
    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [paletteOpen]);

  const handleCopy = async (framework: Framework): Promise<void> => {
    try {
      await navigator.clipboard.writeText(snippets[framework]);
      setCopiedFramework(framework);
    } catch {}
    setMenuOpen(false);
  };

  const handleDownload = (): void => {
    downloadBlob({ contents: snippets.SVG, filename: `${slug}-${yearEntry.year}-${mode}.svg` });
  };

  const handleModeChange = (next: string): void => {
    if (next === '') return;
    const found = COLOR_MODES.find((entry) => entry.id === next);
    if (!found) return;
    setMode(found.id);
    if (found.id !== 'mono') setPaletteOpen(false);
  };

  const handlePickColor = (hex: string): void => {
    setMonoColor(hex);
    setMode('mono');
    setPaletteOpen(false);
  };

  const colorLabel = mode === 'mono' ? monoColor.toUpperCase() : mode === 'official' ? 'BRAND' : mode === 'bw' ? '#111111' : '#F5F4F1';

  return (
    <div data-playground-wrapper className="relative border border-ink bg-paper-warm">
      <div className="flex items-center justify-between border-b border-ink bg-paper px-4 py-2.5">
        <span className="inline-flex items-center gap-2 text-mono-sm font-bold uppercase tracking-mono">
          <span className="inline-block h-1.5 w-1.5 bg-accent" aria-hidden />
          Live playground
        </span>
        <span className="font-mono text-mono-sm text-ink-soft">
          {iconName}
          {id ? ` · #${id}` : ''} · {yearEntry.year} · {mode}
        </span>
      </div>

      <div className={cn('relative flex h-85 items-center justify-center transition-colors', stageBg)}>
        <span className="pointer-events-none absolute top-0 bottom-0 left-1/2 border-l border-dashed border-black/10" aria-hidden />
        <span className="pointer-events-none absolute top-1/2 right-0 left-0 border-t border-dashed border-black/10" aria-hidden />

        <span
          className="inline-flex items-center justify-center transition-transform duration-200"
          style={{
            color: stageColor ?? undefined,
            width: previewPx,
            height: previewPx,
          }}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time SVG from owned brand modules
          dangerouslySetInnerHTML={{ __html: stageMarkup }}
        />

        <span
          className={cn('absolute top-3 left-3.5 font-mono text-mono-sm font-semibold', mode === 'wb' ? 'text-paper/70' : 'text-ink-soft')}
        >
          24 &times; 24
        </span>
        <span className="absolute top-3 right-3.5 font-mono text-mono-sm font-semibold text-accent">{yearEntry.year}</span>
        <span
          className={cn(
            'absolute bottom-3 left-3.5 font-mono text-mono-sm font-semibold',
            mode === 'wb' ? 'text-paper/70' : 'text-ink-soft'
          )}
        >
          {size}px · {mode}
        </span>
        <span
          className={cn(
            'absolute right-3.5 bottom-3 font-mono text-mono-sm font-semibold',
            mode === 'wb' ? 'text-paper/70' : 'text-ink-soft'
          )}
        >
          preview · {Math.round((size / 24) * 100)}%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-7 gap-y-5 border-t border-ink p-4">
        <div>
          <p className="mb-2 font-mono text-mono-sm font-bold uppercase tracking-uppercase text-ink-soft">Year</p>
          <ToggleGroup
            type="single"
            value={String(yearIndex)}
            onValueChange={(next) => {
              if (next !== '') setYearIndex(Number(next));
            }}
            aria-label="Year"
            className="flex w-full"
          >
            {years.map((entry, index) => (
              <ToggleGroupItem
                key={entry.year}
                value={String(index)}
                variant="segment"
                className="flex-1 py-2 text-mono font-mono font-semibold"
              >
                {entry.year}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div ref={paletteRef} className="relative">
          <p className="mb-2 flex items-baseline gap-1.5 font-mono text-mono-sm font-bold uppercase tracking-uppercase text-ink-soft">
            <span>Colors</span>
            <span className="text-ink">·</span>
            <span className="font-mono normal-case text-ink">{colorLabel}</span>
          </p>
          <div className="flex">
            {COLOR_MODES.map((entry, index) => {
              const active = entry.id === mode;
              const isMonoBtn = entry.id === 'mono';
              return (
                <Button
                  key={entry.id}
                  type="button"
                  variant="segment"
                  size="segment-sm"
                  onClick={() => {
                    handleModeChange(entry.id);
                    if (isMonoBtn) setPaletteOpen((open) => !open);
                  }}
                  aria-pressed={active}
                  aria-haspopup={isMonoBtn ? 'true' : undefined}
                  aria-expanded={isMonoBtn ? paletteOpen : undefined}
                  className={cn('flex-1', index > 0 && '-ml-px')}
                >
                  {isMonoBtn ? (
                    <>
                      <span aria-hidden className="inline-block h-3 w-3 border border-current" style={{ backgroundColor: monoColor }} />
                      <span>{entry.label}</span>
                      <span className={cn('transition-transform duration-150', paletteOpen && 'rotate-180')}>▾</span>
                    </>
                  ) : (
                    <span>{entry.label}</span>
                  )}
                </Button>
              );
            })}
          </div>

          {paletteOpen ? (
            <div className="absolute top-full right-0 z-30 mt-1 flex border border-ink bg-paper p-1.5">
              {MONO_PALETTE.map((hex, index) => {
                const active = hex.toLowerCase() === monoColor.toLowerCase() && mode === 'mono';
                return (
                  <Button
                    key={hex}
                    type="button"
                    variant="swatch"
                    size="swatch-md"
                    onClick={() => handlePickColor(hex)}
                    aria-pressed={active}
                    aria-label={`Pick color ${hex}`}
                    className={cn(index > 0 && '-ml-px')}
                    style={{ backgroundColor: hex }}
                  />
                );
              })}
            </div>
          ) : null}
        </div>

        <div>
          <p className="mb-2 flex items-baseline gap-1.5 font-mono text-mono-sm font-bold uppercase tracking-uppercase text-ink-soft">
            <span>Size</span>
            <span className="text-ink">·</span>
            <span className="font-mono normal-case text-ink">{size} px</span>
          </p>
          <ToggleGroup
            type="single"
            value={String(size)}
            onValueChange={(next) => {
              if (next !== '') setSize(Number(next));
            }}
            aria-label="Size"
            className="flex w-full"
          >
            {SIZES.map((value) => (
              <ToggleGroupItem
                key={value}
                value={String(value)}
                variant="segment-accent"
                className="flex-1 py-2 text-mono font-mono font-semibold"
              >
                {value}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div>
          <p className="mb-2 font-mono text-mono-sm font-bold uppercase tracking-uppercase text-ink-soft">
            <span>Use</span>
            {copiedFramework !== null ? <span className="text-accent"> · {copiedFramework} ✓</span> : null}
          </p>
          <div className="flex gap-1.5">
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="copy-trigger" size="segment-sm" aria-pressed={copiedFramework !== null} className="flex-1">
                  <span>{copiedFramework !== null ? `Copied for ${copiedFramework}` : 'Copy code'}</span>
                  <ChevronDownIcon className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent variant="bureau-dark" side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width)">
                {FRAMEWORKS.map((framework, index) => (
                  <DropdownMenuItem
                    key={framework}
                    variant="bureau-dark"
                    onSelect={() => {
                      void handleCopy(framework);
                    }}
                  >
                    <span>
                      Copy for <strong className="font-semibold">{framework}</strong>
                    </span>
                    <span className="font-mono text-mono text-white/50">⌘ {index + 1}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" variant="ink" size="icon-square-sm" onClick={handleDownload} aria-label="Download SVG">
              <DownloadIcon size={16} strokeWidth={1.75} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Playground;
