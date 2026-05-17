import { useEffect, useLayoutEffect, useState } from 'react';
import { TIMELINE_YEARS } from '@/lib/landing-data';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const HERO_SELECTOR = '[data-hero-section]';
const PLAYGROUND_SELECTOR = '[data-playground-wrapper]';

const TimelineBackdrop = () => {
  const [topPx, setTopPx] = useState<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    const section = document.querySelector<HTMLElement>(HERO_SELECTOR);
    const playground = document.querySelector<HTMLElement>(PLAYGROUND_SELECTOR);
    if (!section || !playground) return;

    const recompute = (): void => {
      const sectionRect = section.getBoundingClientRect();
      const playgroundRect = playground.getBoundingClientRect();
      setTopPx(playgroundRect.bottom - sectionRect.top);
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(playground);
    observer.observe(section);
    window.addEventListener('resize', recompute);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, []);

  const style: React.CSSProperties = topPx === null ? { top: '50%' } : { top: `${topPx}px` };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-30 -right-[800px] z-0 flex flex-row gap-20 overflow-hidden whitespace-nowrap select-none font-mono text-canvas font-extrabold tracking-display-xl text-paper-alt -translate-y-1/2"
      style={style}
    >
      {TIMELINE_YEARS.map((year) => (
        <span key={year}>{year}</span>
      ))}
    </div>
  );
};

export default TimelineBackdrop;
