import { readdirSync } from 'node:fs';
import { defineConfig } from 'tsup';

const iconEntries = (): Record<string, string> => {
  const entries: Record<string, string> = {};
  try {
    for (const file of readdirSync('src/icons')) {
      if (!file.endsWith('.tsx')) continue;
      const name = file.replace(/\.tsx$/, '');
      if (name === 'index') continue;
      entries[`icons/${name}`] = `src/icons/${file}`;
    }
  } catch {
    /* not generated yet */
  }
  return entries;
};

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    ...iconEntries(),
  },
  format: ['esm'],
  target: 'es2022',
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['react', 'react/jsx-runtime', 'react-dom', '@brand-icons/core'],
});
