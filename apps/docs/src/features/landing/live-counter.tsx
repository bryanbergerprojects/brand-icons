import { useEffect, useState } from 'react';

const INITIAL = 1248;
const TICK_MS = 2200;
const INCREMENT_CHANCE = 0.3;

const LiveCounter = () => {
  const [count, setCount] = useState<number>(INITIAL);

  useEffect(() => {
    const handle = window.setInterval(() => {
      setCount((prev) => (Math.random() < INCREMENT_CHANCE ? prev + 1 : prev));
    }, TICK_MS);
    return () => window.clearInterval(handle);
  }, []);

  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-ink-soft">
      <span className="inline-block h-1.5 w-1.5 bg-accent animate-pulse [animation-duration:1400ms]" aria-hidden="true" />
      <strong className="font-semibold tabular-nums text-ink">{count.toLocaleString('en-US')}</strong>
      <span>icons in the catalog</span>
    </span>
  );
};

export default LiveCounter;
