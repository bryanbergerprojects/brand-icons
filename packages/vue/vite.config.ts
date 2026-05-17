import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const here = path.dirname(fileURLToPath(import.meta.url));

const iconEntries = (): Record<string, string> => {
  const entries: Record<string, string> = {};
  try {
    for (const file of readdirSync(path.join(here, 'src/icons'))) {
      if (!file.endsWith('.vue')) continue;
      const name = file.replace(/\.vue$/, '');
      entries[`icons/${name}`] = path.join(here, 'src/icons', file);
    }
  } catch {
    /* not generated yet */
  }
  return entries;
};

export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2022',
    sourcemap: true,
    minify: false,
    lib: {
      entry: {
        index: path.join(here, 'src/index.ts'),
        ...iconEntries(),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => id === 'vue' || id.startsWith('@brand-icons/core'),
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        preserveModules: false,
      },
      treeshake: true,
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
