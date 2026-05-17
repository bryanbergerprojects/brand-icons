import { lookupIcon, resolveYear } from '../icons/data';
import type { ColorMode, IconBrandYearRender, Variant } from '../types';
import { resolveColorMode } from '../utils/color-mode';
import { parseBackground } from '../utils/parse-bg';
import { parseSize } from '../utils/parse-size';

const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_INNER = /<svg[^>]*>([\s\S]*)<\/svg>/;

const extractInner = (svgString: string): string => {
  const match = SVG_INNER.exec(svgString);
  return match?.[1] ?? '';
};

const VARIANTS: ReadonlySet<Variant> = new Set(['color', 'mono']);
const MODES: ReadonlySet<ColorMode> = new Set(['as-is', 'bw', 'wb', 'mono']);

const readVariant = (attr: string | null): Variant => {
  if (attr === null) return 'color';
  return VARIANTS.has(attr as Variant) ? (attr as Variant) : 'color';
};

const readMode = (attr: string | null): ColorMode => {
  if (attr === null) return 'as-is';
  return MODES.has(attr as ColorMode) ? (attr as ColorMode) : 'as-is';
};

/**
 * `<brand-icon name="apple" year="1976">` custom element. Looks up the
 * brand-year in the bundled core manifest, applies size / variant / mode /
 * color / background / title, and renders an `<svg>` child. Re-renders on
 * any observed attribute change.
 *
 * `year` defaults to `meta.latest` for the brand. `variant` defaults to
 * `color`. `mode` defaults to `as-is`. `background="true"` paints the
 * brand color behind the icon; any other CSS color value is used verbatim.
 */
export class BrandIcon extends HTMLElement {
  static readonly observedAttributes = [
    'name',
    'year',
    'size',
    'variant',
    'mode',
    'color',
    'background',
    'title',
    'class',
  ] as const;

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    if (!this.isConnected) return;
    this.render();
  }

  private render(): void {
    const name = this.getAttribute('name');
    if (name === null) {
      this.replaceChildren();
      return;
    }
    const yearAttr = this.getAttribute('year');
    const year = resolveYear(name, yearAttr);
    if (year === undefined) {
      this.replaceChildren();
      return;
    }
    const data = lookupIcon(name, year);
    if (data === undefined) {
      this.replaceChildren();
      return;
    }

    const title = this.getAttribute('title');
    const className = this.getAttribute('class');
    const size = parseSize(this.getAttribute('size'));
    const requestedVariant = readVariant(this.getAttribute('variant'));
    const mode = readMode(this.getAttribute('mode'));
    const color = this.getAttribute('color');

    const { variant: activeVariant, styleString } = resolveColorMode({
      mode,
      variant: requestedVariant,
      color,
    });
    const svgString = activeVariant === 'mono' ? data.mono : data.color;
    const inner = extractInner(svgString);
    const bgColor = parseBackground({
      background: this.getAttribute('background'),
      brandColor: data.brandColor,
    });

    const svg = buildSvg({
      inner,
      size,
      title,
      styleString,
      bgColor,
      className,
    });
    this.replaceChildren(svg);
  }
}

type BuildSvgInput = {
  inner: string;
  size: string;
  title: string | null;
  styleString: string | undefined;
  bgColor: string | undefined;
  className: string | null;
};

const buildSvg = (input: BuildSvgInput): SVGSVGElement => {
  const { inner, size, title, styleString, bgColor, className } = input;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  if (className !== null) svg.setAttribute('class', className);
  if (styleString !== undefined) svg.setAttribute('style', styleString);
  if (title !== null) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', title);
    const titleEl = document.createElementNS(SVG_NS, 'title');
    titleEl.textContent = title;
    svg.appendChild(titleEl);
  }
  if (bgColor !== undefined) {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('fill', bgColor);
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', '24');
    rect.setAttribute('height', '24');
    svg.appendChild(rect);
  }
  const g = document.createElementNS(SVG_NS, 'g');
  g.innerHTML = inner;
  svg.appendChild(g);
  return svg;
};

declare global {
  interface HTMLElementTagNameMap {
    'brand-icon': BrandIcon;
  }
}

export const registerBrandIcon = (): void => {
  if (typeof customElements === 'undefined') return;
  if (customElements.get('brand-icon') !== undefined) return;
  customElements.define('brand-icon', BrandIcon);
};

export type { IconBrandYearRender };
