import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { existsSync } from 'fs'
import { exec } from 'child_process'

// Function to find Chrome executable on Windows
function getChromePath(): string | null {
  if (process.platform === 'win32') {
    const possiblePaths = [
      process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe` : null,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ].filter((p): p is string => p !== null)
    
    for (const chromePath of possiblePaths) {
      if (existsSync(chromePath)) {
        return chromePath
      }
    }
  }
  return null
}

// Plugin to validate required env vars during production builds
function envValidationPlugin() {
  return {
    name: 'env-validation',
    buildStart() {
      if (process.env.NODE_ENV === 'production' && !process.env.VITE_API_URL) {
        throw new Error('VITE_API_URL is required for production builds')
      }
    },
  }
}

// Plugin to open Chrome after server starts
function openChromePlugin() {
  let opened = false
  return {
    name: 'open-chrome',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        if (!opened) {
          opened = true
          const chromePath = getChromePath()
          if (chromePath) {
            const url = `http://localhost:${server.config.server.port || 5175}`
            exec(`"${chromePath}" "${url}"`, (error) => {
              if (error) {
                console.warn('Failed to open Chrome:', error.message)
              }
            })
          }
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Only open Chrome in dev mode
    ...(mode === 'development' ? [openChromePlugin()] : []),
    // Validate required env vars during production builds
    ...(mode === 'production' ? [envValidationPlugin()] : []),
  ],

  server: {
    port: 5175,
    open: false, // Disable default browser opening, we'll handle it with the plugin
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Don't rewrite - backend expects /api/v1 prefix
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      // Map @flexdesk/core deep imports to source files in the monorepo
      '@flexdesk/core': path.resolve(__dirname, '../flexdesk-core/src'),
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['mixed-decls', 'color-functions', 'global-builtin', 'import'],
        additionalData: `@use "@/styles/variables" as *;`,
      },
    },
  },

  build: {
    sourcemap: false,
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          coreui: ['@coreui/react', '@coreui/coreui'],
          'ra-core': ['ra-core'],
          'redux': ['@reduxjs/toolkit', 'react-redux', 'redux'],
        },
      },
    },
  },
}))
