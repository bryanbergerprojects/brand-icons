import { ChevronDownIcon, MenuIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from './ui/button';

type NavLink = { href: string; label: string };

type MobileNavProps = {
  primaryLinks: readonly NavLink[];
  resources: readonly NavLink[];
  currentPath: string;
};

const isActive = ({ currentPath, href }: { currentPath: string; href: string }): boolean =>
  href === '/' ? currentPath === '/' : currentPath === href || currentPath.startsWith(`${href}/`);

const MobileNav = ({ primaryLinks, resources, currentPath }: MobileNavProps) => {
  const [resourcesOpen, setResourcesOpen] = useState<boolean>(false);
  const resourcesActive = currentPath.startsWith('/resources');

  const handleToggleResources = (): void => setResourcesOpen((open) => !open);

  return (
    <Sheet>
      <SheetTrigger
        aria-label="Open menu"
        className="inline-flex h-9 w-9 items-center justify-center border-thin border-ink bg-paper text-ink transition-colors hover:bg-paper-alt focus-visible:outline-2 focus-visible:outline-accent"
      >
        <MenuIcon className="size-4" />
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-3/4 max-w-sm flex-col gap-0 border-l-thin border-ink bg-paper p-0"
      >
        <SheetHeader className="flex-row justify-between items-center border-b border-ink/30">
          <SheetTitle className="font-mono text-mono-sm font-bold uppercase tracking-uppercase text-ink-soft">Menu</SheetTitle>
          <SheetClose aria-label="Close menu" asChild>
            <Button variant="outline" size="icon-xs">
              <XIcon className="size-2" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <nav className="flex flex-col">
          {primaryLinks.map((link) => {
            const active = isActive({ currentPath, href: link.href });
            return (
              <SheetClose key={link.href} asChild>
                <a
                  href={link.href}
                  className={`flex items-center justify-between border-b border-ink/10 px-5 py-4 text-base font-medium transition-colors hover:bg-paper-alt ${active ? 'text-accent' : 'text-ink'}`}
                >
                  <span>{link.label}</span>
                  <span aria-hidden className="font-mono text-mono opacity-60">
                    →
                  </span>
                </a>
              </SheetClose>
            );
          })}

          <div className="border-b border-ink/10">
            <button
              type="button"
              onClick={handleToggleResources}
              aria-expanded={resourcesOpen}
              aria-controls="mobile-nav-resources"
              className={`flex w-full items-center justify-between px-5 py-4 text-base font-medium transition-colors hover:bg-paper-alt ${resourcesActive ? 'text-accent' : 'text-ink'}`}
            >
              <span>Resources</span>
              <ChevronDownIcon className={`size-4 transition-transform duration-150 ${resourcesOpen ? 'rotate-180' : ''}`} />
            </button>
            {resourcesOpen ? (
              <ul id="mobile-nav-resources" className="bg-paper-alt">
                {resources.map((item) => (
                  <li key={item.href}>
                    <SheetClose asChild>
                      <a
                        href={item.href}
                        className="flex items-center justify-between border-t border-ink/10 px-7 py-3 text-sm font-medium text-ink-soft-2 transition-colors hover:bg-paper"
                      >
                        <span>{item.label}</span>
                        <span aria-hidden className="font-mono text-mono opacity-60">
                          →
                        </span>
                      </a>
                    </SheetClose>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
