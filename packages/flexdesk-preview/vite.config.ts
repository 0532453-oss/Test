import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: "dist/bundle-analysis.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    preserveSymlinks: false,
    // Force resolution from root node_modules
    conditions: ["import", "module", "browser", "default"],
    // Prevent resolving from nested node_modules in temp directory
    mainFields: ["browser", "module", "jsnext:main", "jsnext", "main"],
    alias: [
      // Resolve common dependencies from this package's node_modules
      // This ensures files from other packages (flexdesk-front, flexdesk-admin) can resolve these
      {
        find: "date-fns",
        replacement: path.resolve(__dirname, "node_modules/date-fns"),
      },
      {
        find: "react-error-boundary",
        replacement: path.resolve(__dirname, "node_modules/react-error-boundary"),
      },
      {
        find: "react-hook-form",
        replacement: path.resolve(__dirname, "node_modules/react-hook-form"),
      },
      {
        find: "class-variance-authority",
        replacement: path.resolve(__dirname, "node_modules/class-variance-authority"),
      },
      {
        find: "clsx",
        replacement: path.resolve(__dirname, "node_modules/clsx"),
      },
      {
        find: "tailwind-merge",
        replacement: path.resolve(__dirname, "node_modules/tailwind-merge"),
      },
      // Resolve @service-flex/core to the source
      {
        find: "@service-flex/core",
        replacement: path.resolve(__dirname, "../flexdesk-core/src"),
      },
      // Resolve @service-flex/types to the source
      {
        find: "@service-flex/types",
        replacement: path.resolve(__dirname, "../flexdesk-types/src"),
      },
      // Resolve flexdesk-ui calendar imports to the source
      {
        find: /^flexdesk-ui\/(.*)/,
        replacement: path.resolve(__dirname, "../flexdesk-ui/src/$1"),
      },
      // Resolve Schedule-X packages from flexdesk-ui's node_modules
      {
        find: /^@schedule-x\/(.*)/,
        replacement: path.resolve(__dirname, "../flexdesk-ui/node_modules/@schedule-x/$1"),
      },
      // Resolve temporal-polyfill from flexdesk-ui's node_modules
      {
        find: /^temporal-polyfill(.*)/,
        replacement: path.resolve(__dirname, "../flexdesk-ui/node_modules/temporal-polyfill$1"),
      },
      // Make imports like `@/components/admin` resolve to the admin-kit barrel exports
      {
        find: /^@\/components\/admin$/,
        replacement: path.resolve(__dirname, "../flexdesk-admin/src/components/admin"),
      },
      // Make imports like `@/components/ui/*` resolve to admin-kit's UI components
      {
        find: /^@\/components\/ui\/(.*)/,
        replacement: path.resolve(__dirname, "../flexdesk-admin/src/components/ui/$1"),
      },
      // Make imports like `@/lib/*` resolve to admin-kit's lib
      {
        find: /^@\/lib\/(.*)/,
        replacement: path.resolve(__dirname, "../flexdesk-admin/src/lib/$1"),
      },
      // Make imports like `@/hooks/*` resolve to admin-kit's hooks
      {
        find: /^@\/hooks\/(.*)/,
        replacement: path.resolve(__dirname, "../flexdesk-admin/src/hooks/$1"),
      },
      // Catch-all for @/* imports
      {
        find: /^@\/(.*)/,
        replacement: path.resolve(__dirname, "../flexdesk-admin/src/$1"),
      },
    ],
    // Prefer resolving from root node_modules instead of nested ones
    dedupe: [
      "react",
      "react-dom",
      "react-router",
      "react-router-dom",
      "@tanstack/react-query",
      "ra-core",
      "ag-grid-community",
      "ag-grid-react",
      "ag-grid-enterprise",
      "@mui/material",
      "@emotion/react",
      "@emotion/styled",
    ],
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  optimizeDeps: {
    include: [
      'date-fns',
      'react-router',
      'react-router-dom',
      'react-hook-form',
      'ra-core',
      'ag-grid-react',
      'ag-grid-community',
      'ag-grid-enterprise',
      'react-error-boundary',
      '@tanstack/react-query',
      'react',
      'react-dom',
      'react/jsx-dev-runtime',
      'react-is',
      'scheduler',
      'cookie',
      'set-cookie-parser',
      'split-on-first',
      '@radix-ui/react-primitive',
      '@radix-ui/react-id',
      '@radix-ui/react-compose-refs',
      'file-selector',
      'attr-accept',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
    ],
    exclude: [],
  },
});

