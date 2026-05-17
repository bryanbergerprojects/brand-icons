import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Apple1976Icon,
  Apple1998Icon,
  Apple2017Icon,
  AppleLatestIcon,
} from '../src/icons';

const render = (element: React.ReactElement): string =>
  renderToStaticMarkup(element);

describe('AppleLatestIcon', () => {
  it('is the same reference as Apple2017Icon (latest alias)', () => {
    expect(AppleLatestIcon).toBe(Apple2017Icon);
  });

  it('renders identical markup to Apple2017Icon', () => {
    expect(render(<AppleLatestIcon />)).toBe(render(<Apple2017Icon />));
  });
});

describe('per-year markup divergence', () => {
  it('1976, 1998 and 2017 render distinct SVG content', () => {
    const a = render(<Apple1976Icon />);
    const b = render(<Apple1998Icon />);
    const c = render(<Apple2017Icon />);
    expect(a).not.toBe(b);
    expect(b).not.toBe(c);
    expect(a).not.toBe(c);
  });
});

describe('variant prop', () => {
  it('color (default) inlines the rainbow palette for Apple 1976', () => {
    const out = render(<Apple1976Icon />);
    expect(out).toContain('#75BD21');
  });

  it('mono swaps to currentColor', () => {
    const out = render(<Apple2017Icon variant="mono" />);
    expect(out).toContain('currentColor');
    expect(out).not.toContain('#000000');
  });
});

describe('size prop', () => {
  it('defaults to 1em', () => {
    expect(render(<Apple2017Icon />)).toContain('width="1em"');
  });

  it('serializes a numeric size in pixels', () => {
    expect(render(<Apple2017Icon size={32} />)).toContain('width="32"');
  });

  it('passes any CSS length string through', () => {
    expect(render(<Apple2017Icon size="2rem" />)).toContain('width="2rem"');
  });
});

describe('background prop', () => {
  it('paints brandColor when true', () => {
    const out = render(<Apple2017Icon background />);
    expect(out).toContain('<rect fill="#000000"');
  });

  it('paints an explicit string color', () => {
    const out = render(<Apple2017Icon background="#ff0000" />);
    expect(out).toContain('<rect fill="#ff0000"');
  });

  it('omits the rect when background is unset', () => {
    expect(render(<Apple2017Icon />)).not.toContain('<rect ');
  });
});

describe('title prop', () => {
  it('injects a <title> and role="img" when set', () => {
    const out = render(<Apple2017Icon title="Apple" />);
    expect(out).toContain('<title>Apple</title>');
    expect(out).toContain('role="img"');
    expect(out).toContain('aria-label="Apple"');
  });

  it('omits role and title when unset', () => {
    const out = render(<Apple2017Icon />);
    expect(out).not.toContain('<title>');
    expect(out).not.toContain('role="img"');
  });
});

describe('className prop', () => {
  it('forwards className onto the root svg', () => {
    expect(render(<Apple2017Icon className="size-6 text-red-500" />)).toContain(
      'class="size-6 text-red-500"',
    );
  });
});

describe('mode prop', () => {
  it('mode=bw applies grayscale filter', () => {
    expect(render(<Apple2017Icon mode="bw" />)).toContain(
      'style="filter:grayscale(1)"',
    );
  });

  it('mode=wb applies grayscale + invert filter', () => {
    expect(render(<Apple2017Icon mode="wb" />)).toContain(
      'style="filter:grayscale(1) invert(1)"',
    );
  });

  it('mode=mono forces mono variant + style.color', () => {
    const out = render(<Apple2017Icon mode="mono" color="#ff0080" />);
    expect(out).toContain('currentColor');
    expect(out).toContain('style="color:#ff0080"');
  });

  it('mode=mono with no color falls back to currentColor', () => {
    const out = render(<Apple1976Icon mode="mono" />);
    expect(out).toContain('currentColor');
    expect(out).toContain('style="color:currentColor"');
  });
});
