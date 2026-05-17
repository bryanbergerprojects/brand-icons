type RGB = { r: number; g: number; b: number };

type ColorWeight = { hex: string; weight: number };

const NEUTRAL_FILLS = new Set(['none', 'transparent', 'inherit', 'currentColor', 'currentcolor']);

const SHORT_HEX = /^#([0-9a-fA-F]{3})$/;
const LONG_HEX = /^#([0-9a-fA-F]{6})$/;
const RGB_FN = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/;

const NAMED_COLORS: Record<string, string> = {
  black: '#000000',
  white: '#FFFFFF',
  red: '#FF0000',
  green: '#008000',
  blue: '#0000FF',
  yellow: '#FFFF00',
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  gray: '#808080',
  grey: '#808080',
  silver: '#C0C0C0',
};

const parseColor = (raw: string): string | null => {
  const value = raw.trim();
  if (NEUTRAL_FILLS.has(value)) return null;
  const short = SHORT_HEX.exec(value);
  if (short) {
    const [, body] = short;
    if (!body) return null;
    const expanded = body
      .split('')
      .map((c) => c + c)
      .join('');
    return `#${expanded.toUpperCase()}`;
  }
  const long = LONG_HEX.exec(value);
  if (long) {
    const [, body] = long;
    if (!body) return null;
    return `#${body.toUpperCase()}`;
  }
  const rgb = RGB_FN.exec(value);
  if (rgb) {
    const [, rStr, gStr, bStr] = rgb;
    if (!rStr || !gStr || !bStr) return null;
    const r = Number.parseInt(rStr, 10);
    const g = Number.parseInt(gStr, 10);
    const b = Number.parseInt(bStr, 10);
    return rgbToHex({ r, g, b });
  }
  const named = NAMED_COLORS[value.toLowerCase()];
  if (named) return named;
  return null;
};

const rgbToHex = ({ r, g, b }: RGB): string => {
  const clamp = (n: number): number => Math.max(0, Math.min(255, Math.round(n)));
  const hh = (n: number): string => clamp(n).toString(16).padStart(2, '0');
  return `#${hh(r)}${hh(g)}${hh(b)}`.toUpperCase();
};

const hexToRgb = (hex: string): RGB => ({
  r: Number.parseInt(hex.slice(1, 3), 16),
  g: Number.parseInt(hex.slice(3, 5), 16),
  b: Number.parseInt(hex.slice(5, 7), 16),
});

const distance = (a: RGB, b: RGB): number => {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

const numAttr = (tag: string, attr: string): number => {
  const re = new RegExp(`\\b${attr}="([^"]+)"`);
  const m = re.exec(tag);
  if (!m?.[1]) return Number.NaN;
  return Number.parseFloat(m[1]);
};

const elementWeight = (tag: string, kind: string): number => {
  if (kind === 'rect') {
    const w = numAttr(tag, 'width');
    const h = numAttr(tag, 'height');
    if (Number.isFinite(w) && Number.isFinite(h)) return Math.max(1, w * h);
    return 100;
  }
  if (kind === 'circle') {
    const r = numAttr(tag, 'r');
    if (Number.isFinite(r)) return Math.max(1, Math.PI * r * r);
    return 100;
  }
  if (kind === 'ellipse') {
    const rx = numAttr(tag, 'rx');
    const ry = numAttr(tag, 'ry');
    if (Number.isFinite(rx) && Number.isFinite(ry)) {
      return Math.max(1, Math.PI * rx * ry);
    }
    return 100;
  }
  if (kind === 'path') {
    const d = /\bd="([^"]+)"/.exec(tag);
    if (!d?.[1]) return 100;
    const nums = d[1].match(/-?\d*\.?\d+/g);
    if (!nums || nums.length < 4) return 100;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = Number.parseFloat(nums[i] ?? 'NaN');
      const y = Number.parseFloat(nums[i + 1] ?? 'NaN');
      if (Number.isFinite(x)) xs.push(x);
      if (Number.isFinite(y)) ys.push(y);
    }
    if (xs.length === 0 || ys.length === 0) return 100;
    const w = Math.max(...xs) - Math.min(...xs);
    const h = Math.max(...ys) - Math.min(...ys);
    return Math.max(1, w * h);
  }
  return 100;
};

const collectGradientStops = (svg: string): Map<string, ColorWeight[]> => {
  const stops = new Map<string, ColorWeight[]>();
  const re = /<(linearGradient|radialGradient)\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/(?:linearGradient|radialGradient)>/g;
  for (let match: RegExpExecArray | null = re.exec(svg); match !== null; match = re.exec(svg)) {
    const id = match[2];
    const body = match[3];
    if (!id || !body) continue;
    const collected: ColorWeight[] = [];
    const stopRe = /<stop\b([^/>]*)\/?>/g;
    for (let stop: RegExpExecArray | null = stopRe.exec(body); stop !== null; stop = stopRe.exec(body)) {
      const attrs = stop[1] ?? '';
      const colorMatch = /\bstop-color="([^"]+)"/.exec(attrs) ?? /\bstop-color:\s*([^;"']+)/.exec(attrs);
      const opacityMatch = /\bstop-opacity="([^"]+)"/.exec(attrs) ?? /\bstop-opacity:\s*([^;"']+)/.exec(attrs);
      if (!colorMatch?.[1]) continue;
      const hex = parseColor(colorMatch[1]);
      if (!hex) continue;
      const opacity = opacityMatch?.[1] ? Number.parseFloat(opacityMatch[1]) : 1;
      collected.push({ hex, weight: Number.isFinite(opacity) ? opacity : 1 });
    }
    stops.set(id, collected);
  }
  return stops;
};

const URL_REF = /^url\(#([^)]+)\)$/;

const resolveFill = (value: string, gradients: Map<string, ColorWeight[]>): ColorWeight[] => {
  const trimmed = value.trim();
  const refMatch = URL_REF.exec(trimmed);
  if (refMatch) {
    const id = refMatch[1];
    if (!id) return [];
    return gradients.get(id) ?? [];
  }
  const hex = parseColor(trimmed);
  if (!hex) return [];
  return [{ hex, weight: 1 }];
};

const cluster = (weighted: ColorWeight[]): ColorWeight[] => {
  const sorted = [...weighted].sort((a, b) => b.weight - a.weight);
  const clusters: { rgb: RGB; hex: string; weight: number }[] = [];
  for (const item of sorted) {
    const rgb = hexToRgb(item.hex);
    let merged = false;
    for (const c of clusters) {
      if (distance(c.rgb, rgb) < 12) {
        c.weight += item.weight;
        merged = true;
        break;
      }
    }
    if (!merged) clusters.push({ rgb, hex: item.hex, weight: item.weight });
  }
  return clusters.sort((a, b) => b.weight - a.weight).map((c) => ({ hex: c.hex, weight: c.weight }));
};

const stripDefs = (svg: string): string =>
  svg
    .replace(/<defs\b[\s\S]*?<\/defs>/g, '')
    .replace(/<clipPath\b[\s\S]*?<\/clipPath>/g, '')
    .replace(/<mask\b[\s\S]*?<\/mask>/g, '')
    .replace(/<symbol\b[\s\S]*?<\/symbol>/g, '');

const PAINTABLE = new Set(['rect', 'circle', 'ellipse', 'path', 'polygon', 'polyline', 'line']);

/**
 * Extract the dominant colors of a `color.svg` string.
 *
 * Scans every painted element (rect, circle, ellipse, path…) plus gradient
 * stops, propagates group-level fill via a stack, weights by approximate
 * surface, clusters near-duplicates (RGB distance < 12), and returns up to
 * 12 uppercase hex values sorted by descending prominence.
 *
 * @param svg raw or optimized SVG markup
 * @returns up to 12 `#RRGGBB` hex strings
 */
export const extractPalette = (svg: string): string[] => {
  const gradients = collectGradientStops(svg);
  const accumulator: ColorWeight[] = [];
  const body = stripDefs(svg);

  const groupStack: { fill: string | undefined; stroke: string | undefined }[] = [];

  const tokenRe = /<\/g\s*>|<(g|rect|circle|ellipse|path|polygon|polyline|line)\b([^>]*?)(\/?)>/g;
  for (let match: RegExpExecArray | null = tokenRe.exec(body); match !== null; match = tokenRe.exec(body)) {
    const token = match[0];
    if (token === '</g>' || /^<\/g\s*>$/.test(token)) {
      groupStack.pop();
      continue;
    }
    const kind = match[1];
    const attrs = match[2];
    const selfClose = match[3] === '/';
    if (!kind || attrs === undefined) continue;

    const fillAttr = /\bfill="([^"]+)"/.exec(attrs)?.[1] ?? /\bfill:\s*([^;"']+)/.exec(attrs)?.[1];
    const strokeAttr = /\bstroke="([^"]+)"/.exec(attrs)?.[1] ?? /\bstroke:\s*([^;"']+)/.exec(attrs)?.[1];

    if (kind === 'g') {
      if (!selfClose) {
        groupStack.push({ fill: fillAttr, stroke: strokeAttr });
      }
      continue;
    }

    if (!PAINTABLE.has(kind)) continue;

    const inheritedFill = (() => {
      if (fillAttr !== undefined) return fillAttr;
      for (let i = groupStack.length - 1; i >= 0; i--) {
        const g = groupStack[i];
        if (g?.fill !== undefined) return g.fill;
      }
      return undefined;
    })();
    const inheritedStroke = (() => {
      if (strokeAttr !== undefined) return strokeAttr;
      for (let i = groupStack.length - 1; i >= 0; i--) {
        const g = groupStack[i];
        if (g?.stroke !== undefined) return g.stroke;
      }
      return undefined;
    })();

    const opacityMatch = /\bfill-opacity="([^"]+)"/.exec(attrs) ?? /\bopacity="([^"]+)"/.exec(attrs);
    const opacity = opacityMatch?.[1] ? Number.parseFloat(opacityMatch[1]) : 1;
    const effectiveOpacity = Number.isFinite(opacity) ? opacity : 1;
    const w = elementWeight(token, kind) * effectiveOpacity;

    if (inheritedFill !== undefined) {
      const resolved = resolveFill(inheritedFill, gradients);
      const share = resolved.length === 0 ? 0 : w / resolved.length;
      for (const r of resolved) {
        accumulator.push({ hex: r.hex, weight: r.weight * share });
      }
    } else {
      const hex = parseColor('black');
      if (hex) accumulator.push({ hex, weight: w });
    }

    if (inheritedStroke !== undefined) {
      const resolved = resolveFill(inheritedStroke, gradients);
      const share = resolved.length === 0 ? 0 : (w * 0.1) / resolved.length;
      for (const r of resolved) {
        accumulator.push({ hex: r.hex, weight: r.weight * share });
      }
    }
  }

  return cluster(accumulator)
    .filter((c) => c.weight > 0)
    .slice(0, 12)
    .map((c) => c.hex);
};

export type PaletteDivergence = {
  declared: string[];
  extracted: string[];
  missingFromExtracted: string[];
  missingFromDeclared: string[];
  divergence: number;
};

/**
 * Compare a declared palette (from meta.years[].palette) against the
 * pipeline-extracted one. Returns a structured diff plus a divergence
 * count (entries present in one but not the other).
 *
 * @param declared palette declared in meta.json
 * @param extracted palette computed by extractPalette
 * @returns divergence summary — `divergence` is what the build checks against
 */
export const comparePalettes = (declared: readonly string[], extracted: readonly string[]): PaletteDivergence => {
  const declaredSet = new Set(declared.map((h) => h.toUpperCase()));
  const extractedSet = new Set(extracted.map((h) => h.toUpperCase()));
  const missingFromExtracted = [...declaredSet].filter((h) => !extractedSet.has(h));
  const missingFromDeclared = [...extractedSet].filter((h) => !declaredSet.has(h));
  return {
    declared: [...declaredSet],
    extracted: [...extractedSet],
    missingFromExtracted,
    missingFromDeclared,
    divergence: missingFromExtracted.length + missingFromDeclared.length,
  };
};
