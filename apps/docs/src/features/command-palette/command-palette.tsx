import type { ManifestEntry } from '@brand-icons/core';
import Fuse, { type IFuseOptions } from 'fuse.js';
import { useEffect, useMemo, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

export type DocLink = { title: string; href: string };

export type CommandPaletteProps = {
  icons: readonly ManifestEntry[];
  docs: readonly DocLink[];
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

const ICON_LIMIT = 24;

const CommandPalette = ({ icons, docs }: CommandPaletteProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const fuse = useMemo(() => new Fuse([...icons], fuseOptions), [icons]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const handleClick = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-open-command-palette]')) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    document.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const iconResults = query === '' ? icons.slice(0, ICON_LIMIT) : fuse.search(query, { limit: ICON_LIMIT }).map((result) => result.item);

  const handleNavigate = (href: string): void => {
    setOpen(false);
    window.location.href = href;
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Search brand-icons" description="Find an icon or jump to a doc page.">
      <CommandInput value={query} onValueChange={setQuery} placeholder="Search icons, docs…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {iconResults.length > 0 ? (
          <CommandGroup heading="Icons">
            {iconResults.map((icon) => (
              <CommandItem
                key={icon.slug}
                value={`icon ${icon.name} ${icon.slug} ${icon.aliases.join(' ')}`}
                onSelect={() => handleNavigate(`/icon/${icon.slug}`)}
              >
                <span className="truncate">{icon.name}</span>
                <CommandShortcut className="font-mono uppercase tracking-widest">{icon.category}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        <CommandSeparator />
        <CommandGroup heading="Docs">
          {docs.map((doc) => (
            <CommandItem key={doc.href} value={`doc ${doc.title} ${doc.href}`} onSelect={() => handleNavigate(doc.href)}>
              {doc.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
