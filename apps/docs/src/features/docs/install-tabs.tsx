import { useState } from 'react';

import CopyButton from '@/features/docs/copy-button';
import { cn } from '@/lib/utils';

const FRAMEWORKS = ['react', 'vue', 'svelte', 'wc'] as const;
type Framework = (typeof FRAMEWORKS)[number];

const FRAMEWORK_LABEL: Record<Framework, string> = {
  react: 'React',
  vue: 'Vue',
  svelte: 'Svelte',
  wc: 'Web Components',
};

const MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const;
type Manager = (typeof MANAGERS)[number];

export type InstallCommand = {
  readonly source: string;
  readonly html: string;
};

export type InstallTabsProps = {
  commands: Record<Framework, Record<Manager, InstallCommand>>;
};

const InstallTabs = ({ commands }: InstallTabsProps) => {
  const [framework, setFramework] = useState<Framework>('react');
  const [manager, setManager] = useState<Manager>('pnpm');
  const current = commands[framework][manager];

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-y-2">
          {FRAMEWORKS.map((f) => {
            const active = f === framework;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFramework(f)}
                className={cn(
                  'border border-ink px-2.5 py-1 font-mono text-mono font-semibold uppercase tracking-mono -ml-px first:ml-0 transition-colors',
                  active ? 'bg-accent text-paper' : 'bg-paper text-ink hover:bg-paper-alt'
                )}
                aria-pressed={active}
              >
                {FRAMEWORK_LABEL[f]}
              </button>
            );
          })}
        </div>

        <div className="flex">
          {MANAGERS.map((m) => {
            const active = m === manager;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setManager(m)}
                className={cn(
                  'border border-ink px-2.5 py-1 font-mono text-mono font-semibold uppercase tracking-mono -ml-px first:ml-0 transition-colors',
                  active ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-paper-alt'
                )}
                aria-pressed={active}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative border border-ink bg-ink text-paper">
        <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2">
          <span className="font-mono text-mono-sm font-bold uppercase tracking-mono text-white/55">shell</span>
          <CopyButton source={current.source} />
        </div>
        <div
          className="shiki-host overflow-x-auto px-4.5 py-4 font-mono text-13 leading-mono"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output pre-rendered at build with controlled source strings
          dangerouslySetInnerHTML={{ __html: current.html }}
        />
      </div>
    </div>
  );
};

export default InstallTabs;
