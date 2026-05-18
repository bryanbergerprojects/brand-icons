import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://brand-icons.com',
  integrations: [
    react(),
    mdx(),
    sitemap({
      filter: (page) => !page.startsWith('https://brand-icons.com/og/') && page !== 'https://brand-icons.com/og.png',
      changefreq: 'weekly',
      priority: 0.7,
      serialize: (entry) => {
        if (entry.url === 'https://brand-icons.com/') {
          return { ...entry, priority: 1, changefreq: 'weekly' };
        }
        if (entry.url.includes('/icon/')) {
          return { ...entry, priority: 0.8, changefreq: 'monthly' };
        }
        return entry;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: false,
    },
  },
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
});
