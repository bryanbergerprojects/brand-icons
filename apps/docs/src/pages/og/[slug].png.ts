import { brands, type IconBrand, type ManifestEntry, manifest } from '@brand-icons/core';
import type { APIRoute, GetStaticPaths } from 'astro';
import { renderIconOg } from '@/lib/og/render';

type OgProps = {
  readonly icon: ManifestEntry;
};

const slugToCamel = (slug: string): string => slug.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

const formatCategory = (category: string): string =>
  category
    .split('-')
    .map((part) => (part.length > 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ');

const sortedManifest = [...manifest].sort((a, b) => a.name.localeCompare(b.name));

export const getStaticPaths: GetStaticPaths = () =>
  manifest.map((icon) => ({ params: { slug: icon.slug }, props: { icon } satisfies OgProps }));

export const GET: APIRoute = async ({ props }) => {
  const { icon } = props as OgProps;
  const brand = (brands as Record<string, IconBrand>)[slugToCamel(icon.slug)];
  if (!brand) throw new Error(`Missing brand module for slug: ${icon.slug}`);
  const yearEntry = brand.years[icon.latest];
  if (!yearEntry) throw new Error(`Brand ${icon.slug} missing year entry ${icon.latest}`);

  const idx = sortedManifest.findIndex((entry) => entry.slug === icon.slug);
  const id = String(idx + 1).padStart(4, '0');

  const png = await renderIconOg({
    name: icon.name,
    category: formatCategory(icon.category),
    brandColor: icon.brandColor,
    colorSvg: yearEntry.color,
    id,
    totalIcons: manifest.length,
  });

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
