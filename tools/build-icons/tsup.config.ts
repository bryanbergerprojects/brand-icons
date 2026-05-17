import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { cli: 'src/cli.ts' },
  format: ['esm'],
  target: 'es2022',
  platform: 'node',
  dts: false,
  sourcemap: true,
  clean: true,
  splitting: false,
  shims: false,
  banner: { js: '#!/usr/bin/env node' },
});
