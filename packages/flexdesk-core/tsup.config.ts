import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'auth/index': 'src/auth/index.ts',
    'api/index': 'src/api/index.ts',
    'config/index': 'src/config/index.ts',
    'data-provider/index': 'src/data-provider/index.ts',
    'hooks/index': 'src/hooks/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom'],
  splitting: false,
  treeshake: true,
});
