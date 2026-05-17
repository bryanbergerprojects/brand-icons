import { useState } from 'react';

import { cn } from '@/lib/utils';

const COPY_RESET_MS = 1100;

export type CopyButtonProps = {
  source: string;
};

const CopyButton = ({ source }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    if (!source) return;
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_RESET_MS);
    } catch (_e: unknown) {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy code"
      aria-live="polite"
      className={cn(
        'border px-2.5 py-0.5 font-mono text-mono-sm font-bold uppercase tracking-cap transition-colors',
        copied ? 'border-accent bg-accent text-paper' : 'border-white/25 bg-transparent text-paper hover:bg-white/10'
      )}
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  );
};

export default CopyButton;
