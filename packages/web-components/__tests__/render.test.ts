import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import '../src/index';

const mountIcon = (attrs: Record<string, string>): HTMLElement => {
  const el = document.createElement('brand-icon');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  return el;
};

const getSvg = (host: HTMLElement): SVGSVGElement => {
  const svg = host.querySelector('svg');
  if (svg === null) throw new Error('svg not rendered');
  return svg;
};

beforeAll(() => {
  expect(customElements.get('brand-icon')).toBeDefined();
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('default render', () => {
  it('renders apple latest with viewBox + 1em size', () => {
    const host = mountIcon({ name: 'apple' });
    const svg = getSvg(host);
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('width')).toBe('1em');
    expect(svg.getAttribute('height')).toBe('1em');
  });
  it('resolves year=latest to meta.latest (apple → 2017)', () => {
    const a = mountIcon({ name: 'apple' });
    const b = mountIcon({ name: 'apple', year: '2017' });
    expect(getSvg(a).outerHTML).toBe(getSvg(b).outerHTML);
  });
});

describe('per-year divergence', () => {
  it('apple 1976 ≠ apple 1998 ≠ apple 2017', () => {
    const a = getSvg(mountIcon({ name: 'apple', year: '1976' })).outerHTML;
    const b = getSvg(mountIcon({ name: 'apple', year: '1998' })).outerHTML;
    const c = getSvg(mountIcon({ name: 'apple', year: '2017' })).outerHTML;
    expect(a).not.toBe(b);
    expect(b).not.toBe(c);
    expect(a).not.toBe(c);
  });
});

describe('attribute reactivity', () => {
  it('re-renders when year attr changes', () => {
    const host = mountIcon({ name: 'apple', year: '1976' });
    const before = getSvg(host).outerHTML;
    host.setAttribute('year', '2017');
    const after = getSvg(host).outerHTML;
    expect(after).not.toBe(before);
  });
  it('re-renders when size attr changes', () => {
    const host = mountIcon({ name: 'apple', size: '24' });
    expect(getSvg(host).getAttribute('width')).toBe('24');
    host.setAttribute('size', '48');
    expect(getSvg(host).getAttribute('width')).toBe('48');
  });
});

describe('size attr', () => {
  it('numeric string passes through', () => {
    const host = mountIcon({ name: 'apple', size: '32' });
    expect(getSvg(host).getAttribute('width')).toBe('32');
  });
  it('CSS length passes through', () => {
    const host = mountIcon({ name: 'apple', size: '2rem' });
    expect(getSvg(host).getAttribute('width')).toBe('2rem');
  });
});

describe('title attr', () => {
  it('emits role=img + aria-label + <title>', () => {
    const host = mountIcon({ name: 'apple', title: 'Apple' });
    const svg = getSvg(host);
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Apple');
    expect(svg.querySelector('title')?.textContent).toBe('Apple');
  });
  it('skips role + title when absent', () => {
    const host = mountIcon({ name: 'apple' });
    const svg = getSvg(host);
    expect(svg.getAttribute('role')).toBeNull();
    expect(svg.querySelector('title')).toBeNull();
  });
});

describe('background attr', () => {
  it('"true" uses brandColor', () => {
    const host = mountIcon({ name: 'apple', background: 'true' });
    expect(getSvg(host).querySelector('rect')?.getAttribute('fill')).toBe('#000000');
  });
  it('string passes through', () => {
    const host = mountIcon({ name: 'apple', background: '#abc' });
    expect(getSvg(host).querySelector('rect')?.getAttribute('fill')).toBe('#abc');
  });
  it('"false" omits rect', () => {
    const host = mountIcon({ name: 'apple', background: 'false' });
    expect(getSvg(host).querySelector('rect')).toBeNull();
  });
});

describe('mode attr', () => {
  it('bw applies grayscale filter', () => {
    const host = mountIcon({ name: 'apple', mode: 'bw' });
    expect(getSvg(host).getAttribute('style') ?? '').toContain('grayscale(1)');
  });
  it('wb applies grayscale + invert', () => {
    const host = mountIcon({ name: 'apple', mode: 'wb' });
    const style = getSvg(host).getAttribute('style') ?? '';
    expect(style).toContain('grayscale(1)');
    expect(style).toContain('invert(1)');
  });
  it('mono with color sets style.color', () => {
    const host = mountIcon({ name: 'apple', mode: 'mono', color: '#ff0080' });
    expect(getSvg(host).getAttribute('style') ?? '').toContain('#ff0080');
  });
});

describe('class attr', () => {
  it('applies class to svg', () => {
    const host = mountIcon({ name: 'apple', class: 'my-icon' });
    expect(getSvg(host).getAttribute('class')).toBe('my-icon');
  });
});

describe('unknown brand / year', () => {
  it('renders nothing for unknown brand', () => {
    const host = mountIcon({ name: 'nonexistent-brand' });
    expect(host.querySelector('svg')).toBeNull();
  });
  it('renders nothing for unknown year', () => {
    const host = mountIcon({ name: 'apple', year: '9999' });
    expect(host.querySelector('svg')).toBeNull();
  });
});

describe('VSCode (multi-word brand name)', () => {
  it('mounts via slug=vscode', () => {
    const host = mountIcon({ name: 'vscode' });
    expect(host.querySelector('svg')).toBeTruthy();
  });
});
