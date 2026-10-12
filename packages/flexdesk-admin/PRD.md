# PRD: flexdesk-admin -- Deployment Readiness

## Introduction

The `flexdesk-admin` package is a Next.js 16 admin dashboard built on React Admin (`ra-core`) with Atlantis-style components (re-exported from `flexdesk-front/simple-jobber`), Radix UI, shadcn/ui, and Tailwind CSS v4. It provides CRUD interfaces for jobs, clients, invoices, and other resources in the FlexDesk monorepo. The application currently **does not build** due to multiple TypeScript errors across admin components and the Atlantis component bridge. This PRD defines the work to reach a deployable state on Vercel.

## Goals

- Fix all TypeScript errors so `next build` succeeds (currently ~40+ errors across `src/` and the Atlantis bridge)
- Verify every React Admin resource page renders correctly (list, create, edit, show)
- Wire up Google OAuth + JWT authentication against the FlexDesk backend
- Configure Vercel deployment with proper environment variables
- Add error boundary, 404 page, loading states, and basic mobile responsiveness

## User Stories

### US-001: Fix TypeScript errors in Atlantis bridge components

**Description:** As a developer, I need the Atlantis bridge components (`flexdesk-front/simple-jobber/components/atlantis/`) to pass typecheck so the admin build is unblocked.

**Acceptance Criteria:**
- [x] Fix `ConfirmationModal.tsx` -- add missing `onRequestClose` prop to inner `<Modal>`
- [x] Fix `Modal.tsx` -- remove `className` prop from `<ButtonDismiss>` (not in its interface)
- [x] Fix `Card.tsx` -- narrow `CardHeaderAction` render to `ReactNode`
- [x] Fix `DataList.tsx` -- add intermediate `unknown` cast for generic context type; remove duplicate export declarations
- [x] Fix `Autocomplete.tsx` -- remove duplicate export declarations for `AutocompleteOption` / `AutocompleteProps`
- [x] Fix `Glimmer.tsx` -- remove duplicate export declarations for `GlimmerHeaderProps` / `GlimmerTextProps`
- [x] Fix `FormField.tsx` -- remove `id` prop from `<Text>` component usage
- [x] Fix `InputAvatar.tsx` -- add `"interactiveSubtle"` to `IconColorNames` type or map to valid value
- [x] Fix `InputDate.tsx` -- use mutable ref pattern (`useRef<T>(null!)` or cast) for `current` assignment
- [x] Fix `Menu.tsx` -- type the `prev` parameter explicitly; fix read-only `current` ref assignments; fix `setState` updater type
- [x] Fix `Page.tsx` -- install `react-router` types or add type stub; fix `RefObject<T | null>` to `LegacyRef<T>` assignments
- [x] Fix `FormatDate.tsx`, `FormatDateTime.tsx`, `FormatTime.tsx` -- ensure `date-fns` and `date-fns/locale` are resolvable (add as dependency or adjust import path)
- [x] `npx tsc --noEmit` reports zero errors in `../flexdesk-front/simple-jobber/` files
- [x] Typecheck passes

### US-002: Fix TypeScript errors in admin src/ components

**Description:** As a developer, I need all admin source files under `src/components/admin/` to pass typecheck so the build succeeds.

**Acceptance Criteria:**
- [x] Fix `error.tsx` -- narrow `error` from `unknown` to `Error` (line 43: `error.message` on unknown type)
- [x] Fix `layout.tsx` -- change `handleError` parameter from `_: Error` to `_: unknown` to match `ErrorBoundary.onError` signature
- [x] Fix `boolean-input.tsx` -- reconcile `FocusEvent<HTMLButtonElement>` vs `FocusEvent<HTMLInputElement>` for `onBlur`
- [x] Fix `confirm.tsx` -- resolve `ConfirmationModalProps` union discriminant (ensure `message` prop matches expected variant)
- [x] Fix `date-input.tsx` and `date-time-input.tsx` -- fix read-only `ref.current` assignments (use mutable ref pattern)
- [x] Fix `time-input.tsx` -- same read-only `ref.current` fix
- [x] Fix `email-input.tsx` -- add `className` to `EmailInputProps` or remove usage
- [x] Fix `password-input.tsx` -- add `className` to `PasswordInputProps` or remove usage
- [x] Fix `phone-input.tsx` -- add `className` to `PhoneInputProps` or remove usage
- [x] Fix `number-input.tsx` -- narrow `prefix` from `string` to `IconNames` type
- [x] Fix `form.tsx` -- remove `.tsx` extension from import path (TS5097)
- [x] Fix `list.tsx` -- remove `.ts` extension from import path (TS5097)
- [x] Fix `saved-queries.tsx` -- remove `.tsx` extension from import path; change `"label"` to valid `TextElement` value
- [x] Fix `simple-form-iterator.tsx` -- remove `.tsx` extension from import path
- [x] `npx tsc --noEmit` reports zero errors in `src/` files
- [x] Typecheck passes

### US-003: Verify Next.js build succeeds end-to-end

**Description:** As a developer, I need `next build` to complete without errors so the app can be deployed.

**Acceptance Criteria:**
- [x] Run `pnpm --filter flexdesk-admin build` (or `npx next build` in the package directory)
- [x] Build completes with exit code 0
- [x] No runtime errors when starting with `next start`
- [x] Typecheck passes

### US-004: Wire up auth provider for Google OAuth + JWT

**Description:** As an admin user, I need to sign in via Google OAuth so I can access the admin dashboard securely.

**Acceptance Criteria:**
- [x] Create or update `authProvider` with `login`, `logout`, `checkAuth`, `checkError`, `getIdentity` methods
- [x] `login` initiates Google OAuth redirect to backend `/auth/google` endpoint
- [x] Auth callback page (`AuthCallback` component) handles the one-time code exchange (not token-in-URL per security audit)
- [x] JWT stored in localStorage; attached as `Authorization: Bearer <token>` header to all API requests
- [x] `checkAuth` validates token expiry; redirects to login if expired
- [x] `getIdentity` returns user name and avatar from decoded JWT or `/auth/me` endpoint
- [x] Unauthenticated users are redirected to login page
- [x] Typecheck passes

### US-005: Configure data provider for backend API

**Description:** As a developer, I need a configured `dataProvider` that communicates with the FlexDesk NestJS backend so resource pages can fetch and mutate data.

**Acceptance Criteria:**
- [x] Create or update `dataProvider` using `ra-data-json-server` (or custom) pointed at `NEXT_PUBLIC_API_URL`
- [x] `httpClient` attaches JWT from localStorage to every request
- [x] Workspace ID header (`x-workspace-id`) is included per RLS requirements
- [x] Data provider handles standard REST operations: `getList`, `getOne`, `create`, `update`, `delete`
- [x] Error responses (401, 403, 500) are handled gracefully
- [x] Typecheck passes

### US-006: Verify resource pages render correctly

**Description:** As an admin user, I need to navigate to jobs, clients, and invoices and perform CRUD operations.

**Acceptance Criteria:**
- [x] Jobs resource: list page loads with data table; create form submits; edit form loads existing record; show page displays details
- [x] Clients resource: list, create, edit, show pages all render without errors
- [x] Invoices resource: list, create, edit, show pages all render without errors
- [x] Navigation sidebar links to all resources
- [x] Typecheck passes
- [x] Verify changes work in browser

### US-007: Add environment variable configuration and Vercel deployment

**Description:** As a developer, I need environment variables and Vercel config so the app deploys correctly.

**Acceptance Criteria:**
- [x] Create `.env.example` with required variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- [x] Add `vercel.json` or configure via `next.config` for monorepo root directory and build command
- [x] Build command in Vercel set to `pnpm --filter flexdesk-admin build` (or Nx equivalent)
- [x] Output directory points to `packages/flexdesk-admin/.next`
- [x] Environment variables documented in `.env.example`
- [x] Typecheck passes

### US-008: Add error boundary and 404 page

**Description:** As an admin user, I should see a helpful error page when something breaks and a proper 404 when navigating to unknown routes.

**Acceptance Criteria:**
- [x] `error.tsx` component (already exists) renders for uncaught errors with a "Go Back" button
- [x] Create `not-found.tsx` (Next.js App Router convention) or configure `catchAll` prop on `<Admin>` for 404
- [x] 404 page displays a clear message and a link back to the dashboard
- [x] Error boundary in `layout.tsx` catches render errors and displays `Error` component
- [x] Typecheck passes
- [x] Verify changes work in browser

### US-009: Add loading states for all pages

**Description:** As an admin user, I should see loading indicators while data is being fetched so the app does not appear broken.

**Acceptance Criteria:**
- [x] `Loading` component (already exists at `loading.tsx`) shows a spinner/skeleton
- [x] All list pages show loading state while `isPending` is true
- [x] Edit and Show pages show loading state while record is being fetched
- [x] Create pages show loading state on form submission
- [x] Suspense boundary in `layout.tsx` uses `<Loading />` as fallback (already configured -- verify it works)
- [x] Typecheck passes
- [x] Verify changes work in browser

### US-010: Mobile responsive layout

**Description:** As an admin user on a mobile device, I need the layout to be usable on smaller screens.

**Acceptance Criteria:**
- [x] Sidebar collapses on mobile (< 768px) and is accessible via hamburger/trigger button
- [x] Data tables scroll horizontally on narrow screens
- [x] Forms stack vertically on mobile
- [x] Header elements do not overflow on small viewports
- [x] Login page is usable on mobile
- [x] Typecheck passes
- [x] Verify changes work in browser

## Non-Goals

- Implementing new resource types beyond jobs, clients, and invoices
- Adding real-time/WebSocket features to the admin dashboard
- Building a custom design system -- the existing Atlantis bridge and shadcn/ui components are sufficient
- Writing comprehensive E2E tests (unit/integration tests for critical paths are sufficient for deployment)
- Migrating away from `ra-core` to a different admin framework
- Implementing role-based access control (RBAC) beyond basic auth
- Offline support for the admin dashboard

## Technical Considerations

- **Atlantis Bridge Fragility:** The admin re-exports ~50 components from `flexdesk-front/simple-jobber/components/atlantis/` via relative paths (`../../../../flexdesk-front/...`). These components have their own TypeScript errors that block the admin build. Fixes must be made in the `flexdesk-front` package, which is outside `flexdesk-admin` but within the monorepo.
- **React Type Compatibility:** The admin declares `@types/react@^19` in devDependencies but uses `react@^18.3.1` as a dependency. Several type errors (read-only refs, `unknown` error types) stem from React 19 type stricter definitions applied against React 18 code patterns. Consider aligning `@types/react` to `^18` or updating ref patterns to React 19 conventions.
- **Import Path Extensions:** Four files use explicit `.tsx`/`.ts` extensions in imports (`form.tsx`, `list.tsx`, `saved-queries.tsx`, `simple-form-iterator.tsx`), which is invalid without `allowImportingTsExtensions` in tsconfig. Remove the extensions.
- **Security Audit Compliance:** The auth flow must use the one-time code exchange pattern (not token-in-URL) as established in the Feb 2026 security audit. JWT_SECRET is a required env var on the server side.
- **Monorepo Build Order:** `flexdesk-admin` depends on `flexdesk-front` (Atlantis bridge). Nx task dependencies must ensure `flexdesk-front` typechecks before `flexdesk-admin` builds.
- **Next.js 16 + React Admin:** React Admin uses `react-router` for client-side routing inside Next.js. The integration requires the admin to be a client component tree. The existing architecture wraps `CoreAdminContext` and `CoreAdminUI` correctly, but the Next.js App Router page entry point (currently only `globals.css` exists in `src/app/`) needs a `page.tsx` that renders the `<Admin>` component as a client component.
