import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ['browser'],
  },
  test: {
    environment: 'happy-dom',
    include: ['__tests__/**/*.test.{ts,tsx}'],
    server: {
      deps: {
        inline: [/svelte/],
      },
    },
  },
});
