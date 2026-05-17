import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';
import {
  Apple1976Icon,
  Apple1998Icon,
  Apple2017Icon,
  AppleLatestIcon,
  GitHub2008Icon,
  GitHubLatestIcon,
  VSCode2017Icon,
} from '../src/icons';

type AnyProps = Record<string, unknown>;

const renderIcon = (Component: unknown, props: AnyProps = {}): SVGSVGElement => {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const instance = mount(Component as never, { target, props });
  const svg = target.querySelector('svg');
  if (svg === null) throw new Error('svg not mounted');
  const cleanup = (): void => {
    unmount(instance);
    target.remove();
  };
  Object.defineProperty(svg, '__cleanup', { value: cleanup });
  return svg;
};

describe('alias identity', () => {
  it('AppleLatestIcon resolves to Apple2017Icon', () => {
    expect(AppleLatestIcon).toBe(Apple2017Icon);
  });
  it('GitHubLatestIcon differs from GitHub2008Icon', () => {
    expect(GitHubLatestIcon).not.toBe(GitHub2008Icon);
  });
});

describe('renders default svg', () => {
  it('emits viewBox 0 0 24 24 + 1em sizing', () => {
    const svg = renderIcon(Apple1976Icon);
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('width')).toBe('1em');
    expect(svg.getAttribute('height')).toBe('1em');
  });
});

describe('per-year markup divergence', () => {
  it('Apple1976 ≠ Apple1998', () => {
    const a = renderIcon(Apple1976Icon).outerHTML;
    const b = renderIcon(Apple1998Icon).outerHTML;
    expect(a).not.toBe(b);
  });
  it('Apple1976 ≠ Apple2017', () => {
    const a = renderIcon(Apple1976Icon).outerHTML;
    const c = renderIcon(Apple2017Icon).outerHTML;
    expect(a).not.toBe(c);
  });
});

describe('size prop', () => {
  it('numeric size becomes string width/height', () => {
    const svg = renderIcon(Apple1976Icon, { size: 32 });
    expect(svg.getAttribute('width')).toBe('32');
    expect(svg.getAttribute('height')).toBe('32');
  });
  it('string size passes through', () => {
    const svg = renderIcon(Apple1976Icon, { size: '2rem' });
    expect(svg.getAttribute('width')).toBe('2rem');
  });
});

describe('title prop', () => {
  it('emits role=img + aria-label + <title>', () => {
    const svg = renderIcon(Apple1976Icon, { title: 'Apple 1976' });
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Apple 1976');
    expect(svg.querySelector('title')?.textContent).toBe('Apple 1976');
  });
  it('skips role + title when undefined', () => {
    const svg = renderIcon(Apple1976Icon);
    expect(svg.getAttribute('role')).toBeNull();
    expect(svg.querySelector('title')).toBeNull();
  });
});

describe('background prop', () => {
  it('true uses brandColor', () => {
    const svg = renderIcon(Apple1976Icon, { background: true });
    expect(svg.querySelector('rect')?.getAttribute('fill')).toBe('#000000');
  });
  it('string uses literal color', () => {
    const svg = renderIcon(Apple1976Icon, { background: '#abc' });
    expect(svg.querySelector('rect')?.getAttribute('fill')).toBe('#abc');
  });
  it('false omits rect', () => {
    const svg = renderIcon(Apple1976Icon, { background: false });
    expect(svg.querySelector('rect')).toBeNull();
  });
});

describe('mode prop', () => {
  it('bw applies grayscale filter', () => {
    const svg = renderIcon(Apple1976Icon, { mode: 'bw' });
    expect(svg.getAttribute('style') ?? '').toContain('grayscale(1)');
  });
  it('wb applies grayscale + invert filter', () => {
    const svg = renderIcon(Apple1976Icon, { mode: 'wb' });
    const style = svg.getAttribute('style') ?? '';
    expect(style).toContain('grayscale(1)');
    expect(style).toContain('invert(1)');
  });
  it('mono with color sets style.color', () => {
    const svg = renderIcon(Apple1976Icon, { mode: 'mono', color: '#ff0080' });
    expect(svg.getAttribute('style') ?? '').toContain('#ff0080');
  });
});

describe('className prop', () => {
  it('applies className to svg', () => {
    const svg = renderIcon(Apple1976Icon, { className: 'my-icon' });
    expect(svg.classList.contains('my-icon')).toBe(true);
  });
});

describe('VSCode2017 brand-name based naming', () => {
  it('mounts via brand-name-derived component', () => {
    const svg = renderIcon(VSCode2017Icon);
    expect(svg).toBeTruthy();
  });
});
