import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'date/index': 'src/date/index.ts',
    'format/index': 'src/format/index.ts',
    'validation/index': 'src/validation/index.ts',
    'string/index': 'src/string/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
