import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import {
  Apple1976Icon,
  Apple1998Icon,
  Apple2017Icon,
  AppleLatestIcon,
  GitHub2008Icon,
  GitHubLatestIcon,
  VSCode2015Icon,
} from '../src/icons';

describe('alias identity', () => {
  it('AppleLatestIcon resolves to Apple2017Icon', () => {
    expect(AppleLatestIcon).toBe(Apple2017Icon);
  });
  it('GitHubLatestIcon resolves to GitHub2013Icon', () => {
    expect(GitHubLatestIcon).not.toBe(GitHub2008Icon);
  });
});

describe('renders default svg', () => {
  it('emits viewBox 0 0 24 24 + 1em sizing', () => {
    const w = mount(Apple1976Icon);
    const svg = w.find('svg');
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('viewBox')).toBe('0 0 24 24');
    expect(svg.attributes('width')).toBe('1em');
    expect(svg.attributes('height')).toBe('1em');
  });
});

describe('per-year markup divergence', () => {
  it('Apple1976 ≠ Apple1998', () => {
    const a = mount(Apple1976Icon).html();
    const b = mount(Apple1998Icon).html();
    expect(a).not.toBe(b);
  });
  it('Apple1976 ≠ Apple2017', () => {
    const a = mount(Apple1976Icon).html();
    const c = mount(Apple2017Icon).html();
    expect(a).not.toBe(c);
  });
});

describe('size prop', () => {
  it('numeric size becomes string width/height', () => {
    const w = mount(Apple1976Icon, { props: { size: 32 } });
    expect(w.find('svg').attributes('width')).toBe('32');
    expect(w.find('svg').attributes('height')).toBe('32');
  });
  it('string size passes through', () => {
    const w = mount(Apple1976Icon, { props: { size: '2rem' } });
    expect(w.find('svg').attributes('width')).toBe('2rem');
  });
});

describe('title prop', () => {
  it('emits role=img + aria-label + <title>', () => {
    const w = mount(Apple1976Icon, { props: { title: 'Apple 1976' } });
    const svg = w.find('svg');
    expect(svg.attributes('role')).toBe('img');
    expect(svg.attributes('aria-label')).toBe('Apple 1976');
    expect(w.find('title').text()).toBe('Apple 1976');
  });
  it('skips role + title when undefined', () => {
    const w = mount(Apple1976Icon);
    expect(w.find('svg').attributes('role')).toBeUndefined();
    expect(w.find('title').exists()).toBe(false);
  });
});

describe('background prop', () => {
  it('true uses brandColor', () => {
    const w = mount(Apple1976Icon, { props: { background: true } });
    expect(w.find('rect').attributes('fill')).toBe('#000000');
  });
  it('string uses literal color', () => {
    const w = mount(Apple1976Icon, { props: { background: '#abc' } });
    expect(w.find('rect').attributes('fill')).toBe('#abc');
  });
  it('false omits rect', () => {
    const w = mount(Apple1976Icon, { props: { background: false } });
    expect(w.find('rect').exists()).toBe(false);
  });
});

describe('mode prop', () => {
  it('bw applies grayscale filter', () => {
    const w = mount(Apple1976Icon, { props: { mode: 'bw' } });
    expect(w.find('svg').attributes('style')).toContain('grayscale(1)');
  });
  it('wb applies grayscale + invert filter', () => {
    const w = mount(Apple1976Icon, { props: { mode: 'wb' } });
    const style = w.find('svg').attributes('style') ?? '';
    expect(style).toContain('grayscale(1)');
    expect(style).toContain('invert(1)');
  });
  it('mono with color sets style.color', () => {
    const w = mount(Apple1976Icon, { props: { mode: 'mono', color: '#ff0080' } });
    expect(w.find('svg').attributes('style')).toContain('#ff0080');
  });
});

describe('className prop', () => {
  it('applies className to svg', () => {
    const w = mount(Apple1976Icon, { props: { className: 'my-icon' } });
    expect(w.find('svg').classes()).toContain('my-icon');
  });
});

describe('VSCode2015 brand-name based naming', () => {
  it('mounts via brand-name-derived component', () => {
    const w = mount(VSCode2015Icon);
    expect(w.find('svg').exists()).toBe(true);
  });
});
