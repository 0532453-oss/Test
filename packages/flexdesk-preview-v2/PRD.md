# FlexDesk Preview v2 -- Deployment Readiness PRD

## Introduction

FlexDesk Preview v2 is the primary customer-facing React application for FlexDesk, a field service management SaaS platform. The app provides dashboard analytics, job/client/invoice/estimate CRUD, technician management, drag-and-drop scheduling, and settings management including Stripe billing integration. It lives at `packages/flexdesk-preview-v2` within a pnpm + Nx monorepo and is deployed to Vercel.

The core feature set is functional: CRUD flows, authentication, demo mode, error handling, and lazy-loaded routes all work. This PRD covers the remaining deployment-readiness gaps -- environment safety, missing pages, performance hardening, accessibility, error tracking, and production hygiene.

## Goals

- Fail the build when required environment variables are missing in production, eliminating silent demo-mode fallback on real deployments
- Provide a proper 404 page so users on unknown routes see helpful UI instead of a silent redirect
- Show a clear loading state during the Google OAuth redirect flow so users are not staring at a blank screen
- Add a Vite PWA service worker for offline app-shell caching and stale-while-revalidate API responses
- Add a web app manifest so the app is installable on mobile and desktop
- Strip all `console.log` / `console.warn` statements from production bundles
- Integrate Sentry for production error tracking with source maps
- Improve accessibility: add missing ARIA labels, ensure keyboard navigation on interactive components
- Optimize performance: code-split heavy routes, lazy-load images, add WebP support
- Add SEO meta tags for the login and public-facing pages

## User Stories

### US-001: Build-Time Environment Validation

**Description:** As a DevOps engineer, I want the Vite build to fail with a clear error message when `VITE_API_URL` is not set and `NODE_ENV` is `production`, so that the app is never accidentally deployed in demo mode.

**Acceptance Criteria:**
- [x] Create a Vite plugin (or `vite.config.ts` build hook) that checks `process.env.VITE_API_URL` during the `buildStart` phase
- [x] When `mode === 'production'` and `VITE_API_URL` is empty/undefined, throw an error that halts the build with message: `"VITE_API_URL is required for production builds"`
- [x] The check does NOT run during `vite dev` or `vite preview`
- [x] Update `.env.example` to document `VITE_API_URL` as required for production
- [x] Remove the `console.warn` fallback in `src/app/config/env.ts`; replace with a comment noting the build plugin enforces this
- [x] Typecheck passes

### US-002: 404 Not Found Page

**Description:** As a user who navigates to a URL that does not exist, I want to see a friendly "Page Not Found" screen with a link back to the dashboard, so I know the URL is wrong rather than the app being broken.

**Acceptance Criteria:**
- [ ] Create `src/views/errors/NotFoundPage.tsx` with heading "Page Not Found", a brief message, and a "Go to Dashboard" button linking to `/dashboard`
- [ ] Style consistently with the existing `ErrorBoundary` component (same color palette, centered layout)
- [ ] In `src/app/routes/AppRoutes.tsx`, change the `<Route path="*" ...>` catch-all from `<Navigate to={ROUTES.DASHBOARD} replace />` to render `<NotFoundPage />`
- [ ] The 404 page renders inside the `MainLayout` if the user is authenticated, or standalone if not
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-003: OAuth Redirect Loading State

**Description:** As a user returning from Google OAuth, I want to see a loading spinner with "Signing you in..." text while the app exchanges the authorization code, so I know the app is working and not frozen.

**Acceptance Criteria:**
- [ ] Create `src/views/auth/OAuthCallbackPage.tsx` that displays `FullPageSpinner` with "Signing you in..." text
- [ ] The component reads the `code` query parameter from the URL, sends it to `POST ${env.API_URL}/auth/google/callback`, stores the returned token, and navigates to `/dashboard`
- [ ] On failure, display an error message with a "Try Again" link back to `/login`
- [ ] Add a route `/auth/callback` in `AppRoutes.tsx` under the public `AuthLayout` that renders `OAuthCallbackPage`
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-004: Console Statement Cleanup

**Description:** As a developer, I want all `console.log` and `console.warn` statements stripped from production builds so that sensitive data and debug noise do not leak into the browser console.

**Acceptance Criteria:**
- [ ] Add `esbuild.drop: ['console']` (or Terser equivalent) to the production build config in `vite.config.ts`, preserving `console.error` only
- [ ] Alternatively, use `esbuild.pure: ['console.log', 'console.warn', 'console.debug', 'console.info']` to keep `console.error` for runtime crash context
- [ ] Verify the 27 existing console statements across `src/` are removed from the production bundle by inspecting `dist/assets/*.js`
- [ ] The `ErrorBoundary.componentDidCatch` `console.error` call is preserved
- [ ] Typecheck passes

### US-005: Sentry Error Tracking Integration

**Description:** As an on-call engineer, I want unhandled exceptions and rejected promises in production to be reported to Sentry with source maps, so I can diagnose and fix issues without asking users to reproduce them.

**Acceptance Criteria:**
- [ ] Install `@sentry/react` as a dependency
- [ ] Create `src/app/config/sentry.ts` that calls `Sentry.init()` with DSN from `VITE_SENTRY_DSN`, environment from `VITE_APP_ENV`, and `tracesSampleRate: 0.1`
- [ ] Call `sentry.ts` initialization in `src/main.tsx` before `createRoot`
- [ ] Wrap `ErrorBoundary` to also call `Sentry.captureException(error)` in `componentDidCatch`
- [ ] Add `VITE_SENTRY_DSN` and `VITE_APP_ENV` to `.env.example`
- [ ] Add `sentryVitePlugin` to `vite.config.ts` for source map upload (gated behind `SENTRY_AUTH_TOKEN` being set)
- [ ] Typecheck passes

### US-006: Web App Manifest and PWA Metadata

**Description:** As a field technician using the app on a mobile device, I want to install FlexDesk as a PWA to my home screen, so I can access it quickly without opening a browser.

**Acceptance Criteria:**
- [ ] Create `public/manifest.json` with `name: "FlexDesk"`, `short_name: "FlexDesk"`, `start_url: "/"`, `display: "standalone"`, `theme_color: "#3b82f6"`, `background_color: "#ffffff"`, and icon entries for 192x192 and 512x512
- [ ] Add placeholder PNG icons at `public/icons/icon-192.png` and `public/icons/icon-512.png` (solid blue square with "F" is fine for now)
- [ ] Add `<link rel="manifest" href="/manifest.json" />` to `index.html`
- [ ] Add `<meta name="theme-color" content="#3b82f6" />` and `<meta name="apple-mobile-web-app-capable" content="yes" />` to `index.html`
- [ ] Typecheck passes
- [ ] Verify changes work in browser (Chrome DevTools > Application > Manifest shows valid manifest)

### US-007: Service Worker for Offline App Shell

**Description:** As a field technician in an area with poor connectivity, I want the app shell (HTML, CSS, JS) to load from cache even when offline, so I can still view previously loaded data.

**Acceptance Criteria:**
- [ ] Install `vite-plugin-pwa` as a dev dependency
- [ ] Configure the plugin in `vite.config.ts` with `registerType: 'autoUpdate'`, Workbox `runtimeCaching` for app shell (`NetworkFirst` for navigation, `CacheFirst` for `/assets/`), and `StaleWhileRevalidate` for API calls to `env.API_URL`
- [ ] The service worker precaches the app shell (index.html + hashed JS/CSS bundles)
- [ ] Add a toast notification (using existing `ToastProvider`) when a new version is available: "New version available. Refresh to update."
- [ ] The service worker does NOT cache authentication endpoints (`/auth/*`)
- [ ] Typecheck passes
- [ ] Verify changes work in browser (DevTools > Application > Service Workers shows active SW)

### US-008: Accessibility -- ARIA Labels and Keyboard Navigation

**Description:** As a user who relies on a screen reader or keyboard navigation, I want interactive elements to have proper ARIA labels and focus management, so I can operate the app without a mouse.

**Acceptance Criteria:**
- [ ] Add `aria-label` attributes to icon-only buttons in `AppHeader.tsx` and `AppSidebar.tsx` (hamburger menu, notification bell, user avatar dropdown)
- [ ] Add `role="navigation"` and `aria-label="Main navigation"` to the sidebar nav in `AppSidebar.tsx`
- [ ] Add `role="main"` to the content area in `MainLayout.tsx`
- [ ] Ensure all modal components (`AssignTechnicianModal`, `RescheduleModal`, `ConfirmationModal`) trap focus and have `aria-modal="true"` and `aria-labelledby` pointing to their title
- [ ] Add `aria-live="polite"` to toast notification container in `ToastProvider.tsx`
- [ ] Verify tab order flows logically: sidebar nav -> header -> main content
- [ ] Typecheck passes
- [ ] Verify changes work in browser (tab through the app, test with screen reader)

### US-009: Lazy Loading and Code Splitting for Heavy Routes

**Description:** As a user on a slow connection, I want only the code for the current page to load initially, so the app starts faster.

**Acceptance Criteria:**
- [ ] Verify all route-level components in `AppRoutes.tsx` use `React.lazy()` (already true for most; confirm `Schedule` with Schedule-X and `InvoiceCreate`/`InvoiceEdit` which are heavier)
- [ ] Move the `@tanstack/react-query-devtools` import behind a dynamic `import()` gated on `env.IS_DEV`, so it is excluded from production bundles entirely
- [ ] Add a named `Suspense` boundary with a route-level skeleton inside each feature group (jobs, clients, invoices) rather than the single global `FullPageSpinner`
- [ ] Verify with `npx vite-bundle-visualizer` that the Schedule-X chunk and ra-core chunk are separate from the main bundle
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-010: Image Optimization

**Description:** As a user on a mobile device, I want images to load efficiently using modern formats and lazy loading, so pages render faster and use less data.

**Acceptance Criteria:**
- [ ] Install `vite-plugin-image-optimizer` (or equivalent) as a dev dependency
- [ ] Configure it in `vite.config.ts` to convert PNG/JPG to WebP during build
- [ ] Add `loading="lazy"` to all `<img>` tags in views that render user-uploaded content (client avatars, job photos)
- [ ] Add explicit `width` and `height` attributes to prevent layout shift on images with known dimensions (logo, icons)
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-011: SEO Meta Tags for Public Pages

**Description:** As a marketing stakeholder, I want the login page and any public-facing pages to have proper meta tags (title, description, Open Graph), so shared links render well in social previews and search results.

**Acceptance Criteria:**
- [ ] Install `react-helmet-async` (or use Vite HTML plugin) as a dependency
- [ ] Create a `<MetaTags>` wrapper component at `src/shared/components/MetaTags.tsx` that sets `<title>`, `<meta name="description">`, and Open Graph tags
- [ ] Add `<MetaTags>` to the Login page with title "FlexDesk -- Sign In" and description "Sign in to FlexDesk to manage your field service operations"
- [ ] Add `<MetaTags>` to the Dashboard with title "Dashboard -- FlexDesk"
- [ ] Ensure the base `index.html` already has a fallback `<title>` and `<meta name="description">` (already present)
- [ ] Typecheck passes
- [ ] Verify changes work in browser (check `<head>` in DevTools)

### US-012: Vercel Deployment Config Hardening

**Description:** As a DevOps engineer, I want the `vercel.json` to include security headers, cache policies for all static asset types, and proper SPA rewrite rules, so the production deployment is secure and performant.

**Acceptance Criteria:**
- [ ] Confirm the existing SPA rewrite `{ "source": "/(.*)", "destination": "/index.html" }` is present (already done)
- [ ] Add security headers to all routes: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [ ] Add cache header `Cache-Control: public, max-age=31536000, immutable` for `/assets/(.*)` (already done) and also for font files and icon files
- [ ] Add `Cache-Control: no-cache` for `/index.html` and `/manifest.json` so users always get the latest version
- [ ] Verify `vercel.json` passes `vercel dev` locally without errors
- [ ] Typecheck passes

## Non-Goals

- **Native mobile app:** This PRD covers PWA installability only. A React Native or Capacitor wrapper is out of scope.
- **SSR / SSG:** The app remains a client-side SPA. Server-side rendering is not planned.
- **Internationalization (i18n):** Multi-language support is not part of this deployment readiness pass.
- **End-to-end testing:** Playwright or Cypress test suites are deferred to a separate effort.
- **Custom domain and DNS configuration:** Vercel domain setup is handled outside this PRD.
- **Backend API changes:** All stories are frontend-only. Backend endpoints are assumed stable.
- **Design system overhaul:** The Atlantis design system and CoreUI components remain as-is. Only targeted accessibility fixes are in scope.

## Technical Considerations

**Key file paths (relative to `packages/flexdesk-preview-v2/`):**

- `vite.config.ts` -- Build config, plugins, proxy, manual chunks
- `vercel.json` -- Vercel deployment config, rewrites, headers
- `index.html` -- HTML entry point, CSP header, manifest link
- `tsconfig.json` -- TypeScript config with path aliases
- `package.json` -- Dependencies and scripts
- `.env.example` -- Environment variable documentation
- `src/main.tsx` -- App entry point, provider tree mount
- `src/app/config/env.ts` -- Runtime environment config with demo-mode fallback
- `src/app/routes/AppRoutes.tsx` -- All route definitions with lazy imports
- `src/app/routes/routes.ts` -- Route path constants
- `src/app/routes/ProtectedRoute.tsx` -- Auth guard with loading state
- `src/app/providers/AppProviders.tsx` -- Provider composition (ErrorBoundary, QueryProvider, AuthProvider, ToastProvider)
- `src/app/providers/ErrorBoundary.tsx` -- Class-based error boundary with dev-mode details
- `src/app/providers/AuthProvider.tsx` -- Auth context, login/logout, token management
- `src/app/providers/ToastProvider.tsx` -- Toast notification system
- `src/app/layouts/MainLayout.tsx` -- Authenticated layout (sidebar + header + content)
- `src/app/layouts/AuthLayout.tsx` -- Unauthenticated layout (login pages)
- `src/app/layouts/components/AppSidebar.tsx` -- Navigation sidebar
- `src/app/layouts/components/AppHeader.tsx` -- Top header bar
- `src/shared/components/FullPageSpinner.tsx` -- Loading spinner used as Suspense fallback
- `src/providers/apiDataProvider.ts` -- API data provider with field mapping and error handling
- `src/mocks/demoMode.ts` -- Demo mode detection logic
- `src/store.ts` -- Redux store configuration
