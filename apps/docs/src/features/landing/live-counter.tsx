export type LiveCounterProps = {
  readonly count: number;
};

const LiveCounter = ({ count }: LiveCounterProps) => (
  <span className="inline-flex items-center gap-2 text-xs font-medium text-ink-soft">
    <span className="inline-block h-1.5 w-1.5 bg-accent animate-pulse [animation-duration:1400ms]" aria-hidden="true" />
    <strong className="font-semibold tabular-nums text-ink">{count.toLocaleString('en-US')}</strong>
    <span>{count === 1 ? 'icon' : 'icons'} in the catalog</span>
  </span>
);

export default LiveCounter;
