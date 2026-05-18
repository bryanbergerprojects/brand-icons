import { manifest } from '@brand-icons/core';
import type { APIRoute } from 'astro';
import { renderDefaultOg } from '@/lib/og/render';

export const GET: APIRoute = async () => {
  const png = await renderDefaultOg({ totalIcons: manifest.length });
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
