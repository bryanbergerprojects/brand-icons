import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

type Section = { id: string; num: string; title: string };

const SECTIONS: readonly Section[] = [
  { id: 'install', num: '01', title: 'Install' },
  { id: 'usage', num: '02', title: 'Usage' },
  { id: 'props', num: '03', title: 'Props' },
  { id: 'tree', num: '04', title: 'Tree shaking' },
  { id: 'changelog', num: '05', title: 'Changelog' },
];

const SCROLL_OFFSET = 120;
const GITHUB_EDIT_URL = 'https://github.com/bryanbergerprojects/brand-icons/edit/main/apps/docs/src/pages/docs/index.astro';

export type TocProps = {
  readonly version: string;
};

const Toc = ({ version }: TocProps) => {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0]?.id ?? '');

  useEffect(() => {
    const computeActive = (): void => {
      let current = SECTIONS[0]?.id ?? '';
      for (const section of SECTIONS) {
        const element = document.getElementById(section.id);
        if (!element) continue;
        const top = element.getBoundingClientRect().top;
        if (top - SCROLL_OFFSET < 0) {
          current = section.id;
        }
      }
      setActiveId(current);
    };
    computeActive();
    window.addEventListener('scroll', computeActive, { passive: true });
    window.addEventListener('resize', computeActive);
    return () => {
      window.removeEventListener('scroll', computeActive);
      window.removeEventListener('resize', computeActive);
    };
  }, []);

  return (
    <aside className="hidden self-start px-4 py-6 lg:px-6 sm:py-8 lg:sticky lg:top-20 lg:block lg:min-h-[calc(100vh-80px)] lg:py-10 lg:pr-6 lg:pl-10">
      <nav aria-label="Documentation">
        <p className="mb-4.5 font-mono text-mono font-bold uppercase tracking-meta text-ink-soft">Documentation</p>
        <ul className="flex flex-col">
          {SECTIONS.map((section) => {
            const active = section.id === activeId;
            return (
              <li key={section.id} className="relative">
                {active ? (
                  <span aria-hidden="true" className="absolute top-1/2 -left-10 h-0.5 lg:w-4 xl:w-6 -translate-y-1/2 bg-accent" />
                ) : null}
                <a
                  href={`#${section.id}`}
                  aria-current={active ? 'location' : undefined}
                  className={cn(
                    'flex items-baseline gap-3 border-t border-paper-alt py-2.5 transition-colors',
                    active ? 'text-ink' : 'text-ink-soft hover:text-ink'
                  )}
                >
                  <span className={cn('font-mono text-mono font-bold tracking-mono', active ? 'text-accent' : 'text-ink-soft')}>
                    {section.num}
                  </span>
                  <span className={cn('text-sm', active ? 'font-semibold text-ink' : 'font-medium')}>{section.title}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-9 flex flex-col gap-1 font-mono text-mono-sm text-ink-soft -ml-3 xl:-ml-0">
        <span>{`// v${version} · MIT`}</span>
        <span>
          {'// edit on '}
          <a
            href={GITHUB_EDIT_URL}
            target="_blank"
            rel="noopener"
            className="text-ink transition-colors hover:text-accent text-nowrap whitespace-nowrap"
          >
            [GitHub ↗]
          </a>
        </span>
      </div>
    </aside>
  );
};

export default Toc;
