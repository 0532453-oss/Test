import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@flexdesk/core': path.resolve(__dirname, '../flexdesk-core/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
