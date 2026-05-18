import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://brand-icons.com');
  const body = ['User-agent: *', 'Allow: /', 'Disallow: /og/', '', `Sitemap: ${new URL('/sitemap-index.xml', base).toString()}`, ''].join(
    '\n'
  );

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
