# PRD: FlexDesk Deployment Readiness

## Introduction

FlexDesk is a field service management (FSM) SaaS platform for small service businesses (HVAC, plumbing, electrical, landscaping). It handles job scheduling, dispatching, invoicing, customer management, and technician coordination. The codebase is a pnpm + Nx monorepo with a NestJS backend, React frontends, and shared libraries.

This PRD identifies every gap between the current state and a production-grade deployment. The goal is to systematically close these gaps so the app can be deployed to real users with confidence. Each user story is sized for one AI context window (~10 min).

### Current State Summary

| Component | Build | Tests | Deployment Ready |
|-----------|-------|-------|------------------|
| **flexdesk-server** | Passes | 311/344 (91%) | Needs hardening |
| **flexdesk-preview-v2** | Passes | 21 tests | Needs hardening |
| **flexdesk-admin** | TS Error | N/A | Blocked by type error |
| **flexdesk-website** | Passes | N/A | Low priority |

### What Works

- Full Prisma schema (17 models, enums, indexes, workspace RLS)
- JWT + Google OAuth auth flow with one-time code exchange
- Job lifecycle state machine (SCHEDULED -> DISPATCHED -> IN_PROGRESS -> COMPLETED)
- Billing module (Stripe payments, subscriptions, Connect payouts)
- Notification module (SendGrid email, Twilio SMS)
- Google Maps integration (geocoding, geofencing)
- Recurring job engine (cron-based generation)
- Offline-first sync metadata on all entities
- Multi-tenant workspace isolation via Prisma extension + AsyncLocalStorage
- Rate limiting (100 req/60s), body size limits, Helmet headers
- Dockerfile with multi-stage build
- Docker Compose for local development
- Preview-v2 frontend with dashboard, job CRUD, client/technician views, invoicing, estimates, settings

### What Needs Work (Deployment Blockers)

1. **No CI/CD pipeline** - No GitHub Actions workflows exist
2. **No health check depth** - `/health` returns static OK, doesn't verify DB connectivity
3. **No database seeding for production** - Permissions/roles table needs initial seed
4. **Missing error monitoring** - No Sentry or equivalent
5. **No logging infrastructure** - Console-only, no structured logging
6. **flexdesk-admin build broken** - TypeScript error in autocomplete-input.tsx
7. **No automated migration on deploy** - Dockerfile runs migrate, but Railway build doesn't
8. **Missing input validation** - Some endpoints lack DTO validation
9. **No rate limiting on auth endpoints** - Login/register should have stricter limits
10. **CORS not enforced in production** - Requires CORS_ORIGIN env var but no validation
11. **No backup strategy** - No automated DB backups documented
12. **Missing Stripe webhook signature verification** - Needs production webhook secret

---

## Goals

- Make `flexdesk-server` and `flexdesk-preview-v2` deployment-ready on Railway + Vercel
- Establish CI/CD pipeline with automated build, test, and deploy
- Add production observability (error tracking, structured logging, health checks)
- Harden authentication and authorization for real-world use
- Seed production database with required reference data (permissions, default roles)
- Fix all build-blocking TypeScript errors across deployable packages
- Document production runbook for incident response

---

## User Stories

### Phase 1: Build Fixes & CI/CD Foundation

### US-001: Fix flexdesk-admin TypeScript build error
**Description:** As a developer, I need the admin app to compile so it can be deployed alongside the preview app.

**Acceptance Criteria:**
- [x] Identify and fix the TypeScript error in `packages/flexdesk-admin` (reported in `autocomplete-input.tsx`)
- [x] `pnpm --filter flexdesk-admin build` completes without errors
- [x] No new TypeScript errors introduced
- [x] Typecheck passes

---

### US-002: Create GitHub Actions CI workflow for server
**Description:** As a developer, I want automated CI checks on every push so broken code doesn't reach production.

**Acceptance Criteria:**
- [x] Create `.github/workflows/ci.yml`
- [x] Triggers on push to `main` and on pull requests
- [x] Steps: checkout, setup Node 20, setup pnpm, install dependencies, generate Prisma client, build `flexdesk-server`, run `flexdesk-server` tests
- [x] Uses caching for `node_modules` and `.nx` to speed up builds
- [x] Workflow passes on current `main` branch
- [x] Typecheck passes

---

### US-003: Create GitHub Actions CI workflow for frontend
**Description:** As a developer, I want frontend builds validated in CI to catch errors before deploy.

**Acceptance Criteria:**
- [x] Add frontend job to `.github/workflows/ci.yml` (or separate workflow)
- [x] Builds `flexdesk-types`, `flexdesk-utils`, `flexdesk-core`, `flexdesk-ui` shared libs first
- [x] Builds `flexdesk-preview-v2`
- [x] Runs `flexdesk-preview-v2` tests (vitest)
- [x] Workflow passes on current `main` branch
- [x] Typecheck passes

---

### Phase 2: Health Checks & Observability

### US-004: Add deep health check endpoint
**Description:** As an operator, I want the health check to verify database connectivity so monitoring can detect outages.

**Acceptance Criteria:**
- [x] Update `packages/flexdesk-server/src/modules/health/health.controller.ts`
- [x] `GET /api/v1/health` returns `{ status: "ok", database: "connected", timestamp: "..." }` when DB is reachable
- [x] Returns `{ status: "degraded", database: "disconnected", timestamp: "..." }` with HTTP 503 when DB is unreachable
- [x] Add a simple `SELECT 1` query via Prisma `$queryRaw` to verify DB
- [x] Endpoint remains `@Public()` (no auth required)
- [x] Typecheck passes

---

### US-005: Add structured logging with request context
**Description:** As an operator, I need structured JSON logs so I can search and filter logs in Railway.

**Acceptance Criteria:**
- [x] Create `packages/flexdesk-server/src/core/logger/logger.service.ts` implementing NestJS `LoggerService`
- [x] Log format: JSON with `timestamp`, `level`, `message`, `requestId`, `workspaceId`, `userId`, `method`, `url`, `statusCode`, `duration`
- [x] Generate unique `requestId` per request via middleware (UUID)
- [x] Store `requestId` in `AsyncLocalStorage` (can reuse existing workspace context pattern)
- [x] Replace default NestJS logger with custom logger in `main.ts`
- [x] Typecheck passes

---

### US-006: Add Sentry error tracking integration
**Description:** As an operator, I want unhandled exceptions reported to Sentry so I can find and fix production errors.

**Acceptance Criteria:**
- [x] Install `@sentry/nestjs` in `flexdesk-server`
- [x] Initialize Sentry in `main.ts` with DSN from `SENTRY_DSN` env var (optional - skip if not set)
- [x] Add Sentry global exception filter that captures exceptions and re-throws for NestJS handling
- [x] Add `SENTRY_DSN` to `.env.example` and `.env.production.example` with placeholder
- [x] Typecheck passes

---

### Phase 3: Database & Data Integrity

### US-007: Create database seed script for production roles and permissions
**Description:** As a developer, I need the roles and permissions tables seeded with initial data so RBAC works on first deploy.

**Acceptance Criteria:**
- [x] Create `packages/flexdesk-server/prisma/seed.ts`
- [x] Seed default permissions: `jobs:create`, `jobs:read`, `jobs:update`, `jobs:delete`, `jobs:assign`, `customers:create`, `customers:read`, `customers:update`, `customers:delete`, `invoices:create`, `invoices:read`, `invoices:update`, `invoices:delete`, `estimates:create`, `estimates:read`, `estimates:update`, `estimates:delete`, `technicians:read`, `technicians:update`, `reports:read`, `settings:manage`
- [x] Seed uses `upsert` to be idempotent (safe to run multiple times)
- [x] Add `"prisma": { "seed": "ts-node prisma/seed.ts" }` to `package.json`
- [x] `pnpm prisma db seed` completes without errors
- [x] Typecheck passes

---

### US-008: Add database connection pooling configuration
**Description:** As an operator, I need connection pooling configured so the database handles concurrent requests without exhausting connections.

**Acceptance Criteria:**
- [x] Update `DATABASE_URL` docs to include `?connection_limit=10&pool_timeout=30` for Railway/Neon
- [x] Add `DIRECT_URL` support in `schema.prisma` for Neon (separate direct connection for migrations)
- [x] Add `directUrl = env("DIRECT_URL")` to `datasource db` block in schema.prisma (Prisma supports this)
- [x] Update `.env.example` and `.env.production.example` with `DIRECT_URL` placeholder
- [x] Typecheck passes

---

### Phase 4: Authentication & Security Hardening

### US-009: Add stricter rate limiting on auth endpoints
**Description:** As an operator, I want auth endpoints rate-limited more aggressively to prevent brute-force attacks.

**Acceptance Criteria:**
- [x] Apply `@Throttle({ default: { limit: 5, ttl: 60000 } })` to `POST /auth/login`
- [x] Apply `@Throttle({ default: { limit: 3, ttl: 60000 } })` to `POST /auth/register`
- [x] Apply `@Throttle({ default: { limit: 5, ttl: 60000 } })` to `POST /auth/refresh`
- [x] Apply `@Throttle({ default: { limit: 10, ttl: 60000 } })` to `GET /auth/google`
- [x] Verify existing account lockout (5 attempts, 15-min window) still works alongside throttling
- [x] Typecheck passes

---

### US-010: Validate CORS_ORIGIN is set in production
**Description:** As a developer, I want the server to fail fast if CORS_ORIGIN is not configured in production, preventing open CORS.

**Acceptance Criteria:**
- [x] In `main.ts`, when `NODE_ENV=production`, throw an error if `CORS_ORIGIN` env var is empty or undefined
- [x] Log a clear error message: "CORS_ORIGIN must be set in production. Set it to your frontend domains."
- [x] In development, continue to allow `*` or default origins
- [x] Typecheck passes

---

### US-011: Add CSRF protection for cookie-based endpoints
**Description:** As a developer, I want CSRF protection on state-changing endpoints to prevent cross-site request forgery.

**Acceptance Criteria:**
- [x] Install `csurf` or implement custom CSRF token validation middleware
- [x] Apply CSRF check to all non-`@Public()` POST/PUT/DELETE endpoints
- [x] Exclude webhook endpoints (`/webhooks/stripe`) from CSRF (they use signature verification)
- [x] Frontend sends CSRF token via `X-CSRF-Token` header
- [x] Typecheck passes

---

### US-012: Enforce HTTPS redirect in production
**Description:** As an operator, I want all HTTP traffic redirected to HTTPS in production.

**Acceptance Criteria:**
- [x] Add middleware in `main.ts` that checks `x-forwarded-proto` header (Railway sets this)
- [x] If protocol is `http` and `NODE_ENV=production`, respond with 301 redirect to `https://` equivalent
- [x] Skip for health check endpoint (load balancers may use HTTP)
- [x] Typecheck passes

---

### Phase 5: Stripe & Webhooks Production Readiness

### US-013: Add Stripe webhook signature verification guard
**Description:** As a developer, I want Stripe webhooks verified by signature so attackers can't send fake events.

**Acceptance Criteria:**
- [x] Verify that `packages/flexdesk-server/src/modules/billing` webhook handler validates `stripe-signature` header using `STRIPE_WEBHOOK_SECRET`
- [x] If signature validation is missing, add it using `stripe.webhooks.constructEvent(body, sig, secret)`
- [x] Raw body must be preserved for signature validation (not parsed by JSON middleware)
- [x] Add `rawBody: true` to the webhook route or use a raw body middleware
- [x] Return 400 if signature invalid, 200 if valid
- [x] Typecheck passes

---

### US-014: Handle critical Stripe webhook events
**Description:** As a developer, I need the webhook handler to process essential billing events so subscription status stays in sync.

**Acceptance Criteria:**
- [x] Handle `customer.subscription.updated` - update workspace `subscriptionStatus`, `subscriptionTier`, `subscriptionCurrentPeriodEnd`
- [x] Handle `customer.subscription.deleted` - set workspace `subscriptionStatus` to `canceled`
- [x] Handle `invoice.payment_succeeded` - update related Invoice to PAID status
- [x] Handle `invoice.payment_failed` - flag invoice, optionally notify workspace owner
- [x] All handlers are idempotent (processing same event twice produces same result)
- [x] Typecheck passes

---

### Phase 6: Email & Notification Production Readiness

### US-015: Add graceful degradation for missing external services
**Description:** As a developer, I want the server to start even if SendGrid/Twilio/Stripe keys are missing, with those features disabled.

**Acceptance Criteria:**
- [x] In `NotificationService`, check if `SENDGRID_API_KEY` is set before attempting to send email; log warning and skip if not configured
- [x] In `NotificationService`, check if `TWILIO_ACCOUNT_SID` is set before attempting SMS; log warning and skip if not configured
- [x] In `StripeManagerModule`, check if `STRIPE_SECRET_KEY` is set; if not, disable billing endpoints and return 503 with message "Billing not configured"
- [x] In `MapsModule`, check if `GOOGLE_MAPS_API_KEY` is set; if not, skip geocoding and log warning
- [x] Server starts and passes health check even with no external service keys configured
- [x] Typecheck passes

---

### US-016: Create email templates for critical notifications
**Description:** As a user, I want professional email notifications so my customers see a polished experience.

**Acceptance Criteria:**
- [x] Create `packages/flexdesk-server/src/modules/notifications/templates/` directory
- [x] Create `job-dispatched.ts` template: "A technician has been dispatched to your location"
- [x] Create `job-completed.ts` template: "Your service has been completed"
- [x] Create `invoice-sent.ts` template: "You have a new invoice from {workspaceName}"
- [x] Create `estimate-sent.ts` template: "You have a new estimate from {workspaceName}"
- [x] Each template exports a function: `(data: TemplateData) => { subject: string; html: string; text: string }`
- [x] Templates use inline CSS (email-safe), no external stylesheets
- [x] Typecheck passes

---

### Phase 7: Frontend Production Hardening

### US-017: Add environment validation to preview-v2
**Description:** As a developer, I want the frontend to validate required env vars at build time so deploys don't fail silently.

**Acceptance Criteria:**
- [x] Create `packages/flexdesk-preview-v2/src/app/config/validateEnv.ts`
- [x] At app startup, check that `VITE_API_URL` is set (required in production)
- [x] If missing and not in demo mode, show a user-friendly error screen instead of a broken app
- [x] Log missing variables to console for debugging
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-018: Add 404 page for unknown routes
**Description:** As a user, I want a helpful 404 page instead of a blank screen when I navigate to a bad URL.

**Acceptance Criteria:**
- [x] Create `packages/flexdesk-preview-v2/src/views/NotFound.tsx`
- [x] Display "Page not found" heading, brief message, and a "Go to Dashboard" link
- [x] Add catch-all route `<Route path="*" element={<NotFound />} />` in `AppRoutes.tsx`
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-019: Add loading state to Google OAuth flow
**Description:** As a user, I want visual feedback during Google OAuth redirect so I don't think the app is broken.

**Acceptance Criteria:**
- [x] On the OAuth callback page (`/auth/callback` or equivalent), show a spinner with "Signing you in..." text
- [x] If code exchange fails, show an error message with "Try again" button that redirects to login
- [x] Handle edge case where user navigates directly to callback URL without auth code (redirect to login)
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### US-020: Add service worker for offline capability
**Description:** As a technician in the field, I want the app to work offline so I can view my jobs even without internet.

**Acceptance Criteria:**
- [x] Create `packages/flexdesk-preview-v2/public/sw.js` service worker
- [x] Cache the app shell (HTML, CSS, JS bundles) using cache-first strategy
- [x] Cache API responses for `GET /jobs` and `GET /customers` using stale-while-revalidate
- [x] Register service worker in `main.tsx` (only in production)
- [x] Show "Offline" banner when navigator.onLine is false
- [x] Typecheck passes
- [x] Verify changes work in browser

---

### Phase 8: Deployment Configuration

### US-021: Create Railway deployment configuration
**Description:** As a developer, I need Railway-specific configuration so the backend deploys correctly.

**Acceptance Criteria:**
- [x] Create `packages/flexdesk-server/railway.json` with build and deploy settings
- [x] Set `buildCommand`: `pnpm install && pnpm prisma generate && pnpm build`
- [x] Set `startCommand`: `pnpm prisma migrate deploy && node dist/main`
- [x] Set `healthcheckPath`: `/api/v1/health`
- [x] Set `restartPolicyType`: `ON_FAILURE`
- [x] Typecheck passes

---

### US-022: Create Vercel deployment configuration for preview-v2
**Description:** As a developer, I need Vercel config so the frontend deploys with correct settings.

**Acceptance Criteria:**
- [x] Create `packages/flexdesk-preview-v2/vercel.json`
- [x] Configure SPA rewrites: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
- [x] Set build output directory to `dist`
- [x] Add cache headers for static assets (1 year for hashed files, no-cache for index.html)
- [x] Typecheck passes

---

### US-023: Add production build validation script
**Description:** As a developer, I want a single command that validates the entire monorepo is deployment-ready.

**Acceptance Criteria:**
- [x] Create `scripts/validate-deploy.sh`
- [x] Steps: build shared libs, build server, run server tests, build preview-v2, run preview-v2 tests
- [x] Exit with non-zero code if any step fails
- [x] Print summary at end: "All checks passed" or "FAILED: [list of failures]"
- [x] Add `"validate:deploy"` script to root `package.json`
- [x] Typecheck passes

---

### Phase 9: Production Runbook & Documentation

### US-024: Create production runbook
**Description:** As an operator, I need a runbook so I know how to handle common production issues.

**Acceptance Criteria:**
- [x] Create `RUNBOOK.md` in the repository root
- [x] Include sections: "Common Alerts & Responses", "Database Operations", "Rollback Procedure", "Scaling Guide", "Secret Rotation"
- [x] Common Alerts: server down (check Railway logs, restart), DB connection errors (check Neon status, connection limits), high error rate (check Sentry, recent deploys)
- [x] Database Operations: how to run migrations, how to connect to prod DB, how to create a backup
- [x] Rollback: how to revert Railway deploy, how to rollback Vercel deploy
- [x] Secret Rotation: how to rotate JWT_SECRET, STRIPE keys, Google OAuth credentials
- [x] Typecheck passes (no code changes, doc only)

---

### US-025: Update environment variable documentation
**Description:** As a developer, I need clear documentation of every required and optional env var for production.

**Acceptance Criteria:**
- [x] Update `.env.production.example` with all current env vars, grouped by category
- [x] Add inline comments marking each var as `# REQUIRED` or `# OPTIONAL`
- [x] Add `JWT_REFRESH_SECRET` (required), `JOB_TOKEN_SECRET` (required), `CUSTOMER_PORTAL_SECRET` (required) if missing
- [x] Add `SENTRY_DSN` (optional), `DIRECT_URL` (optional for Neon)
- [x] Verify every env var used in codebase has a corresponding entry in the example file
- [x] Typecheck passes (no code changes, doc only)

---

## Non-Goals

- **Mobile native app** - Out of scope for this PRD. FlexDesk Mobile is a separate project.
- **AI Agent integration** - The OpenClaw AI agent (flexdesk-agent) is tracked separately in AI_AGENT_STRATEGY.md.
- **Feature additions** - No new business features (e.g., new modules, new entities). This PRD is purely about deployment readiness.
- **Performance optimization** - No query optimization, caching layer, or CDN setup. Those come after first deploy.
- **Horizontal scaling** - The app runs as a single instance. Multi-instance (load balancing, Redis sessions) comes later.
- **E2E testing** - End-to-end tests (Playwright/Cypress) are valuable but not a deployment blocker.
- **Custom domain setup** - DNS configuration is manual and documented in DEPLOYMENT.md.
- **Marketing website deployment** - flexdesk-website is low priority and not blocking.

---

## Technical Considerations

### Existing Patterns to Reuse

- **AsyncLocalStorage pattern** from `workspace-context.ts` - Reuse for request ID propagation in structured logging (US-005)
- **`@Public()` decorator** from auth module - Already used to exempt routes from JWT; health check already uses it
- **Prisma client extension pattern** from `workspace-middleware.ts` - Well-established, no changes needed
- **Toast system** in preview-v2 - Already handles API errors via `handleApiError()` in `apiDataProvider.ts`
- **ErrorBoundary** - Already wraps the app root; provides "Go to Dashboard" link

### Key File Locations

| Concern | File |
|---------|------|
| Server entry | `packages/flexdesk-server/src/main.ts` |
| App module | `packages/flexdesk-server/src/app.module.ts` |
| Auth module | `packages/flexdesk-server/src/modules/auth/` |
| Billing module | `packages/flexdesk-server/src/modules/billing/` |
| Health controller | `packages/flexdesk-server/src/modules/health/` |
| Workspace RLS | `packages/flexdesk-server/src/utils/workspace-middleware.ts` |
| Workspace context | `packages/flexdesk-server/src/utils/workspace-context.ts` |
| Prisma schema | `packages/flexdesk-server/prisma/schema.prisma` |
| Frontend routes | `packages/flexdesk-preview-v2/src/app/routes/AppRoutes.tsx` |
| Frontend API client | `packages/flexdesk-preview-v2/src/shared/hooks/useApi.ts` |
| Frontend data provider | `packages/flexdesk-preview-v2/src/providers/apiDataProvider.ts` |
| Frontend env config | `packages/flexdesk-preview-v2/src/app/config/env.ts` |
| Dockerfile | `packages/flexdesk-server/Dockerfile` |
| Docker Compose | `docker-compose.yml` (root) |

### Infrastructure

| Service | Provider | Cost |
|---------|----------|------|
| Backend API | Railway | $5-20/mo |
| PostgreSQL | Neon (free) or Railway | $0-15/mo |
| Frontend (preview-v2) | Vercel (free) | $0 |
| Frontend (admin) | Vercel (free) | $0 |
| Email | SendGrid (free 100/day) | $0 |
| SMS | Twilio (pay-per-use) | ~$0.008/SMS |
| Payments | Stripe (2.9% + $0.30) | Per transaction |
| Maps | Google Maps (10K free/mo) | $0 |
| Error tracking | Sentry (free 5K events/mo) | $0 |

### Dependencies to Watch

| Package | Version | Note |
|---------|---------|------|
| `@prisma/client` | ^6.19.2 | Major version - check migration compatibility |
| `@nestjs/common` | ^10.3.0 | Stable, no upgrade needed |
| `stripe` | ^14.14.0 | Active development, keep updated |
| `react` | ^18.3.1 | Pinned via pnpm overrides |
| `node` | >=20.0.0 | Required by engines field |
| `pnpm` | 9.0.0 | Pinned via packageManager field |

---

## Implementation Priority

Execute in this order. Earlier phases unblock later ones.

| Phase | Stories | Impact | Effort |
|-------|---------|--------|--------|
| 1. Build Fixes & CI/CD | US-001 to US-003 | Unblocks all deployment | Low |
| 2. Health & Observability | US-004 to US-006 | Production monitoring | Medium |
| 3. Database | US-007 to US-008 | Data integrity | Low |
| 4. Auth & Security | US-009 to US-012 | Security hardening | Medium |
| 5. Stripe & Webhooks | US-013 to US-014 | Revenue operations | Medium |
| 6. Notifications | US-015 to US-016 | Service reliability | Medium |
| 7. Frontend Hardening | US-017 to US-020 | User experience | Medium |
| 8. Deploy Config | US-021 to US-023 | Deployment automation | Low |
| 9. Documentation | US-024 to US-025 | Operational readiness | Low |

**Minimum viable deployment**: Phases 1 + 2 + 3 + 4 (US-001 through US-012)
**Full production readiness**: All phases (US-001 through US-025)
