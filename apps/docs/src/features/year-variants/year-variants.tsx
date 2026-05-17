import { CheckIcon, ChevronDownIcon, CopyIcon, DownloadIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

export type YearVariantEntry = {
  readonly year: string;
  readonly colorSvg: string;
  readonly palette: readonly string[];
  readonly notes?: string;
};

export type YearVariantsProps = {
  readonly iconName: string;
  readonly slug: string;
  readonly componentName: string;
  readonly entries: readonly YearVariantEntry[];
};

const FRAMEWORKS = ['React', 'Vue', 'Svelte', 'WebC', 'SVG'] as const;
type Framework = (typeof FRAMEWORKS)[number];

const SIZES: readonly number[] = [16, 24, 32, 48];
const COPY_FEEDBACK_MS = 1400;

const sizedSvg = ({ raw, size }: { raw: string; size: number }): string =>
  raw.replace(
    /<svg([^>]*)>/,
    (_match, attrs: string) => `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, '')} width="${size}" height="${size}">`
  );

const formatHex = (hex: string): string => hex.replace(/^#/, '').toUpperCase();

const buildSnippets = ({
  componentName,
  slug,
  size,
  year,
  colorSvg,
}: {
  componentName: string;
  slug: string;
  size: number;
  year: string;
  colorSvg: string;
}): Record<Framework, string> => ({
  React: `<${componentName}${year}Icon size={${size}} variant="color" />`,
  Vue: `<${componentName}${year}Icon :size="${size}" variant="color" />`,
  Svelte: `<${componentName}${year}Icon size={${size}} variant="color" />`,
  WebC: `<brand-icon name="${slug}" year="${year}" size="${size}" variant="color"></brand-icon>`,
  SVG: sizedSvg({ raw: colorSvg, size }),
});

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

type YearVariantCardProps = {
  readonly iconName: string;
  readonly slug: string;
  readonly componentName: string;
  readonly entry: YearVariantEntry;
};

const YearVariantCard = ({ iconName, slug, componentName, entry }: YearVariantCardProps) => {
  const [size, setSize] = useState<number>(32);
  const [copiedSwatch, setCopiedSwatch] = useState<string | null>(null);
  const [copiedFramework, setCopiedFramework] = useState<Framework | null>(null);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    if (copiedSwatch === null) return;
    const handle = window.setTimeout(() => setCopiedSwatch(null), COPY_FEEDBACK_MS);
    return () => window.clearTimeout(handle);
  }, [copiedSwatch]);

  useEffect(() => {
    if (copiedFramework === null) return;
    const handle = window.setTimeout(() => setCopiedFramework(null), COPY_FEEDBACK_MS);
    return () => window.clearTimeout(handle);
  }, [copiedFramework]);

  const previewPx = size * 4;
  const stageMarkup = sizedSvg({ raw: entry.colorSvg, size: previewPx });
  const snippets = buildSnippets({ componentName, slug, size, year: entry.year, colorSvg: entry.colorSvg });

  const handleCopySwatch = async ({ key, value }: { key: string; value: string }): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedSwatch(key);
    } catch {}
  };

  const handleCopyCode = async (framework: Framework): Promise<void> => {
    try {
      await navigator.clipboard.writeText(snippets[framework]);
      setCopiedFramework(framework);
    } catch {}
    setMenuOpen(false);
  };

  const handleDownload = (): void => {
    downloadBlob({ contents: snippets.SVG, filename: `${slug}-${entry.year}-color.svg` });
  };

  return (
    <article className="border border-ink bg-paper">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-ink px-5 py-4">
        <h3 className="m-0 font-sans text-xl font-extrabold tracking-tight text-ink">{entry.year}</h3>
        <span className="font-mono text-mono-sm font-bold uppercase tracking-mono text-ink-soft">
          {iconName} · {entry.year}
        </span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="relative flex h-full min-h-56 items-center justify-center overflow-hidden border-b border-ink bg-canvas-grid md:border-r md:border-b-0">
          <span className="pointer-events-none absolute top-0 bottom-0 left-1/2 border-l border-dashed border-black/10" aria-hidden />
          <span className="pointer-events-none absolute top-1/2 right-0 left-0 border-t border-dashed border-black/10" aria-hidden />

          <span className="pointer-events-none absolute top-3 left-3.5 font-mono text-mono-sm font-semibold text-ink-soft">
            24 &times; 24
          </span>
          <span className="pointer-events-none absolute top-3 right-3.5 font-mono text-mono-sm font-semibold text-accent">
            {entry.year}
          </span>
          <span className="pointer-events-none absolute bottom-3 left-3.5 font-mono text-mono-sm font-semibold text-ink-soft">
            {size}px · color
          </span>
          <span className="pointer-events-none absolute right-3.5 bottom-3 font-mono text-mono-sm font-semibold text-ink-soft">
            preview · {Math.round((size / 24) * 100)}%
          </span>

          <span
            role="img"
            aria-label={`${iconName} ${entry.year} icon in official colors`}
            className="inline-flex items-center justify-center transition-transform duration-200"
            style={{ width: previewPx, height: previewPx }}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time SVG from owned brand modules
            dangerouslySetInnerHTML={{ __html: stageMarkup }}
          />
        </div>

        <div className="flex flex-col">
          <div className="border-b border-ink px-5 py-4">
            <p className="mb-3 font-mono text-mono-sm font-bold uppercase tracking-uppercase text-ink-soft">
              Palette · {entry.palette.length} color{entry.palette.length === 1 ? '' : 's'}
            </p>
            <ul className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(2.75rem, 1fr))' }}>
              {entry.palette.map((hex, index) => {
                const key = `${entry.year}-${hex}-${index}`;
                const isCopied = copiedSwatch === key;
                const label = index === 0 ? 'Ink' : null;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => handleCopySwatch({ key, value: hex.toUpperCase() })}
                      aria-label={`Copy ${hex.toUpperCase()} to clipboard`}
                      className="group flex w-full flex-col gap-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <span
                        className="relative flex h-14 w-full items-end justify-start border border-ink/10 px-2 pb-1.5 font-mono text-mono-xs font-bold uppercase tracking-mono transition-transform group-hover:-translate-y-0.5"
                        style={{ backgroundColor: hex }}
                      >
                        {label ? <span className="text-paper drop-shadow-[0_1px_0_rgba(0,0,0,0.3)]">{label}</span> : null}
                        <span
                          className={cn(
                            'pointer-events-none absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center bg-paper text-ink opacity-0 transition-opacity group-hover:opacity-100',
                            isCopied && 'opacity-100'
                          )}
                          aria-hidden
                        >
                          {isCopied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
                        </span>
                      </span>
                      <span className="font-mono text-mono-xs font-semibold text-ink-soft">{isCopied ? 'Copied' : formatHex(hex)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {entry.notes ? <p className="mt-4 text-13 leading-relaxed text-ink-soft-2">{entry.notes}</p> : null}
          </div>

          <div className="flex flex-col gap-4 px-5 py-4">
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
                    <Button
                      type="button"
                      variant="copy-trigger"
                      size="segment-sm"
                      aria-pressed={copiedFramework !== null}
                      className="flex-1"
                    >
                      <span>{copiedFramework !== null ? `Copied for ${copiedFramework}` : 'Copy code'}</span>
                      <ChevronDownIcon className="size-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent variant="bureau-dark" side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width)">
                    {FRAMEWORKS.map((framework) => (
                      <DropdownMenuItem
                        key={framework}
                        variant="bureau-dark"
                        onSelect={() => {
                          void handleCopyCode(framework);
                        }}
                      >
                        <span>
                          Copy for <strong className="font-semibold">{framework}</strong>
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  type="button"
                  variant="ink"
                  size="icon-square-sm"
                  onClick={handleDownload}
                  aria-label={`Download ${iconName} ${entry.year} SVG`}
                >
                  <DownloadIcon size={16} strokeWidth={1.75} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

const YearVariants = ({ iconName, slug, componentName, entries }: YearVariantsProps) => {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3 font-mono text-mono font-bold uppercase tracking-meta text-ink-soft">
        <span className="text-accent">—</span>
        <span>Year variants</span>
        <span>·</span>
        <span>
          {entries.length} {entries.length === 1 ? 'era' : 'eras'}
        </span>
      </div>

      <div className="flex flex-col gap-8">
        {entries.map((entry) => (
          <YearVariantCard key={entry.year} iconName={iconName} slug={slug} componentName={componentName} entry={entry} />
        ))}
      </div>
    </div>
  );
};

export default YearVariants;
