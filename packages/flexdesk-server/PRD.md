# PRD: flexdesk-server Deployment Readiness

## Introduction

The FlexDesk server (`packages/flexdesk-server`) is a NestJS backend API for a field service management SaaS platform. It is part of a pnpm + Nx monorepo deployed to Railway via a multi-stage Dockerfile. The server currently builds, passes 91% of tests (311/344), and handles auth, jobs, billing, notifications, estimates, and RBAC. A security audit was completed in February 2026.

This PRD defines the remaining work to bring the server from "works in development" to "production-ready." Each user story is scoped to be completable in a single context window (~10 minutes of AI work).

## Goals

- Ensure the server fails fast on misconfiguration rather than silently degrading in production
- Add structured logging and error tracking for production observability
- Harden auth rate limiting and Stripe webhook handling against abuse
- Seed RBAC permissions and system roles so new deployments are functional out of the box
- Optimize database connection pooling for Neon serverless Postgres
- Ensure graceful degradation when optional external services are unconfigured
- Fix the 33 failing tests to reach a clean CI baseline
- Finalize Railway deployment configuration

## User Stories

---

### US-001: Seed Script for Permissions and System Roles

**Description:** As a developer deploying FlexDesk for the first time, I want a seed script that populates the `permissions` table with all standard resource/action pairs so that the RBAC system is functional immediately after migration.

**Acceptance Criteria:**
- [x] A `prisma/seed.ts` script exists that calls `RoleService.ensureStandardPermissions()` logic directly against Prisma (no NestJS bootstrap required)
- [x] The seed inserts all 66 permissions (11 resources x 6 actions) defined in `RESOURCES` and `ACTIONS` constants from `role.service.ts`
- [x] The seed is idempotent: running it twice does not create duplicate rows (uses `upsert` or `findUnique` + `create`)
- [x] `package.json` has a `"db:seed": "ts-node prisma/seed.ts"` script
- [x] `prisma/schema.prisma` does NOT need changes (Permission model already exists and is workspace-agnostic)
- [x] The seed script logs how many permissions were created vs. already existed
- [x] Typecheck passes

---

### US-002: Stricter Rate Limiting on Auth Endpoints

**Description:** As a security engineer, I want the login and registration endpoints to have stricter per-IP rate limits so that brute-force and credential-stuffing attacks are throttled.

**Acceptance Criteria:**
- [x] `POST /api/v1/auth/login` is rate-limited to 5 requests per 60 seconds per IP (already has no decorator; add `@Throttle`)
- [x] `POST /api/v1/auth/register` rate limit is tightened from 5/60s to 3 requests per 60 seconds per IP
- [x] `POST /api/v1/auth/exchange-code` is rate-limited to 10 requests per 60 seconds per IP
- [x] `POST /api/v1/auth/refresh` is rate-limited to 10 requests per 60 seconds per IP
- [x] The global 100/60s rate limit remains unchanged for all other endpoints
- [x] Existing auth tests still pass (update mocks if `@Throttle` decorators affect test setup)
- [x] Typecheck passes

---

### US-003: Deep Health Check on Public Endpoint

**Description:** As a Railway deployment, I want the `/api/v1/health` endpoint (used by `healthcheckPath` in `railway.json`) to verify database connectivity so that Railway does not route traffic to an instance with a broken DB connection.

**Acceptance Criteria:**
- [x] The `GET /api/v1/health` endpoint (currently returns static `{ status: 'ok' }`) is updated to call `healthService.checkDatabase()` and return the DB status
- [x] If the database is unreachable, the endpoint returns HTTP 503 with `{ status: 'unhealthy', database: { status: 'down' } }`
- [x] If the database is reachable, the endpoint returns HTTP 200 with `{ status: 'healthy', database: { status: 'up', latencyMs: <number> } }`
- [x] The endpoint remains public (no auth required) via the existing `@Public()` decorator
- [x] The `/api/v1/health/ready` and `/api/v1/health/live` endpoints remain unchanged
- [x] `railway.json` `healthcheckPath` remains `/api/v1/health` (no change needed)
- [x] Typecheck passes

---

### US-004: Structured JSON Logging

**Description:** As a DevOps engineer, I want all server logs emitted as structured JSON so that Railway log aggregation, search, and alerting work correctly.

**Acceptance Criteria:**
- [x] A custom NestJS `LoggerService` is implemented in `src/core/logging/json-logger.service.ts` that formats log output as single-line JSON objects with fields: `timestamp`, `level`, `context`, `message`, `correlationId`, `traceId` (optional)
- [x] The logger is registered in `main.ts` via `app.useLogger(new JsonLoggerService())` for production (`NODE_ENV=production`)
- [x] In development (`NODE_ENV !== 'production'`), the default NestJS colored logger is preserved
- [x] The `HttpExceptionFilter` continues to use `Logger` (it will inherit the custom logger)
- [x] No changes to existing `this.logger.log()` / `this.logger.error()` calls throughout the codebase are needed
- [x] Typecheck passes

---

### US-005: Graceful Degradation for External Services

**Description:** As an operator deploying FlexDesk without all third-party API keys configured, I want the server to start successfully and log warnings rather than crashing when SendGrid, Twilio, Google Maps, or Stripe are not configured.

**Acceptance Criteria:**
- [x] `NotificationService.onModuleInit()` already logs warnings for unconfigured SendGrid/Twilio (verified, no change needed)
- [x] `StripeService` constructor already logs a warning and sets `this.stripe = null` when unconfigured (verified, no change needed)
- [x] `MapsModule` is audited: if the Google Maps API key is missing, the maps service logs a warning on init and returns a clear error (HTTP 400 or 503) when map endpoints are called rather than throwing an unhandled exception
- [x] A startup log line in `main.ts` (after `app.listen`) summarizes which external services are configured vs. missing, using the `HealthService.checkExternalServices()` method
- [x] The server process does NOT crash or refuse to start when any combination of external service keys is missing
- [x] Typecheck passes

---

### US-006: Handle Critical Stripe Subscription Webhook Events

**Description:** As a billing operator, I want the Stripe webhook handler to process `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, and `invoice.payment_failed` events so that workspace subscription state stays in sync with Stripe.

**Acceptance Criteria:**
- [x] `StripeService.handleWebhook()` switch statement adds cases for `customer.subscription.updated` and `customer.subscription.deleted` that delegate to the existing `StripeSubscriptionService.handleSubscriptionUpdated()` and `handleSubscriptionDeleted()` methods
- [x] `StripeService.handleWebhook()` adds a case for `invoice.payment_succeeded` that looks up the subscription from the invoice and calls `handleSubscriptionUpdated()` to refresh `subscriptionCurrentPeriodEnd`
- [x] `StripeService.handleWebhook()` adds a case for `invoice.payment_failed` that logs a warning with the workspace ID and invoice ID
- [x] `StripeSubscriptionService` is injected into `StripeService` (add to constructor if not already present)
- [x] Existing webhook tests are updated or new tests are added for the new event types
- [x] Typecheck passes

---

### US-007: CORS_ORIGIN Validation and HTTPS Redirect

**Description:** As a security engineer, I want the server to fail fast in production if `CORS_ORIGIN` is not set, and to enforce HTTPS redirects so that credentials are never transmitted over plain HTTP.

**Acceptance Criteria:**
- [x] The `CORS_ORIGIN` fail-fast check in `main.ts` already exists (verified: throws `Error('CORS_ORIGIN must be set in production')`)
- [x] An HTTPS redirect middleware is added for production: if `NODE_ENV=production` and the request `x-forwarded-proto` header is `http`, respond with 301 redirect to the HTTPS equivalent URL
- [x] The HTTPS redirect is registered before all other middleware in `main.ts` (before `helmet()`)
- [x] The HTTPS redirect is skipped for the `/api/v1/health/live` endpoint (liveness probes may use HTTP internally)
- [x] In non-production environments, no redirect is applied
- [x] Typecheck passes

---

### US-008: Database Connection Pooling for Neon

**Description:** As a DevOps engineer deploying to Railway with Neon Postgres, I want the Prisma client configured with appropriate connection pooling settings so that the serverless database handles concurrent connections efficiently.

**Acceptance Criteria:**
- [x] The `DATABASE_URL` in the Prisma schema continues to use `env("DATABASE_URL")` (no change to schema)
- [x] Documentation is added as a comment in `prisma/schema.prisma` explaining that for Neon, the `DATABASE_URL` should use the pooled connection string (`-pooler` suffix) and include `?pgbouncer=true&connection_limit=10`
- [x] `PrismaService` (in `src/core/database/prisma.service.ts`) is updated to pass `datasources.db.url` from `ConfigService` if a `DATABASE_URL` override is provided, enabling runtime connection string configuration
- [x] A `DIRECT_DATABASE_URL` env var is documented (as a comment) for use with `prisma migrate` commands that need a direct (non-pooled) connection
- [x] Typecheck passes

---

### US-009: Sentry Error Tracking Integration

**Description:** As an on-call engineer, I want unhandled exceptions and errors to be reported to Sentry so that I receive alerts and can debug production issues with stack traces and context.

**Acceptance Criteria:**
- [x] `@sentry/node` is added to `dependencies` in `package.json`
- [x] A `src/core/sentry/sentry.module.ts` global module initializes Sentry with `Sentry.init()` using `SENTRY_DSN` from `ConfigService`
- [x] If `SENTRY_DSN` is not set, Sentry is not initialized and a warning is logged (graceful degradation)
- [x] The `HttpExceptionFilter` is updated to call `Sentry.captureException(exception)` for 5xx errors only (not 4xx client errors)
- [x] The Sentry release is set to `process.env.RAILWAY_GIT_COMMIT_SHA || 'local'` for deploy tracking
- [x] The Sentry environment is set to `process.env.NODE_ENV || 'development'`
- [x] Typecheck passes

---

### US-010: Fix Failing Tests

**Description:** As a developer, I want all 344 tests passing so that the CI pipeline is green and test failures indicate real regressions rather than pre-existing issues.

**Acceptance Criteria:**
- [x] Run `pnpm test` and identify the 33 failing tests
- [x] Fix each failing test: update mocks, fix assertions, or fix the underlying code if the test exposes a real bug
- [x] No tests are deleted or skipped (`it.skip`, `xit`, `xdescribe`) to achieve the pass count
- [x] All 344 tests pass: `Tests: 344 passed, 344 total`
- [x] No new test files are created unless a test file was accidentally deleted
- [x] Typecheck passes

---

### US-011: Railway Deployment Config Hardening

**Description:** As a DevOps engineer, I want the `railway.json` and `Dockerfile` finalized for production so that deploys are reliable and observable.

**Acceptance Criteria:**
- [x] `railway.json` adds `"numReplicas": 1` (explicit default, can be scaled later)
- [x] `railway.json` adds `"healthcheckPath": "/api/v1/health"` (already present, verify)
- [x] `Dockerfile` runner stage sets `EXPOSE 3001` (already present, verify)
- [x] `Dockerfile` CMD runs migrations before starting: `prisma migrate deploy && node dist/main` (already present, verify)
- [x] The `Dockerfile` does not copy `.env` files or source maps into the production image
- [x] The `Dockerfile` runner stage uses a non-root user (already present: `nestjs` user, verify)
- [x] A `.dockerignore` file exists in the server package (or monorepo root) that excludes `node_modules`, `.env`, `dist`, `coverage`, `.git`
- [x] Typecheck passes

---

### US-012: Stripe Webhook Signature Verification Hardening

**Description:** As a security engineer, I want Stripe webhook signature verification to be robust against replay attacks and timing issues so that forged webhook payloads are rejected.

**Acceptance Criteria:**
- [x] `StripeService.handleWebhook()` already verifies signatures using `stripe.webhooks.constructEvent()` with the raw body (verified)
- [x] The `STRIPE_WEBHOOK_SECRET` env var is validated on startup: if `STRIPE_SECRET_KEY` is set but `STRIPE_WEBHOOK_SECRET` is not, log a warning that webhooks will reject all events
- [x] The webhook controller returns HTTP 400 (not 500) when signature verification fails (already returns `BadRequestException`, verify)
- [x] Add a Stripe webhook tolerance window: pass `{ tolerance: 300 }` (5 minutes) to `constructEvent()` to reject events older than 5 minutes
- [x] Typecheck passes

---

### US-013: Email Template for Estimate Sent

**Description:** As an account manager, I want customers to receive a branded email when an estimate is sent so that they can review and respond to it.

**Acceptance Criteria:**
- [x] `NotificationService` already has an `estimate-sent` template in `renderEmailTemplate()` (verified)
- [x] A new `notifyEstimateSent()` method is added to `NotificationService` that accepts an `Estimate` and `CustomerWithPreference`, builds the email payload using the `estimate-sent` template, and sends via `sendNotificationWithPreferences()`
- [x] The SMS fallback message includes the estimate number and a link to view the estimate
- [x] The method respects customer notification preferences for the `estimateSent` notification type
- [x] The estimate link is constructed as `${publicBaseUrl}/estimates/${estimate.id}`
- [x] Typecheck passes

---

### US-014: Startup Environment Validation

**Description:** As an operator, I want the server to validate all required environment variables at startup and fail fast with a clear error message listing every missing variable, rather than crashing later with a cryptic error.

**Acceptance Criteria:**
- [x] A `src/core/config/env-validation.ts` file exports a validation function that checks for required env vars: `DATABASE_URL`, `JWT_SECRET`, `JOB_TOKEN_SECRET`, `CUSTOMER_PORTAL_SECRET`
- [x] The validation function checks for conditionally required vars: if `NODE_ENV=production`, also require `CORS_ORIGIN`
- [x] If any required vars are missing, the function throws an error listing ALL missing vars (not just the first one)
- [x] The validation is called in `main.ts` before `NestFactory.create()`
- [x] The existing `CORS_ORIGIN` check in `main.ts` can be removed since it is now handled by the validation function
- [x] Typecheck passes

## Non-Goals

- **Frontend changes:** This PRD covers only `packages/flexdesk-server`. No changes to `flexdesk-admin`, `flexdesk-agent`, or other frontend packages.
- **CI/CD pipeline setup:** GitHub Actions, Railway auto-deploy triggers, and branch protection rules are out of scope.
- **Load testing or performance benchmarks:** Connection pooling config is set to reasonable defaults; load testing is a separate effort.
- **Git history cleanup:** The `SECURITY_TODO.md` describes BFG-based secret scrubbing. This is a manual, coordinated operation and is not included here.
- **Database migrations:** No schema changes are proposed. All stories work with the existing 23-model Prisma schema.
- **Monitoring dashboards:** Sentry integration provides error tracking; Grafana/Datadog dashboards are out of scope.
- **WebSocket or real-time features:** No changes to the sync engine or offline-first architecture.
- **Mobile push notifications:** The `pushEnabled` preference field exists but push notification infrastructure is not part of this PRD.

## Technical Considerations

- **Monorepo builds:** The Dockerfile copies `flexdesk-types`, `flexdesk-core`, and `flexdesk-utils` packages. Any new dependency must be available in the flat `node_modules` created by `pnpm install --shamefully-hoist`.
- **Prisma version:** The schema uses Prisma 6.19.2. The seed script must use the same `@prisma/client` version. The `prisma/seed.ts` approach avoids bootstrapping the full NestJS app.
- **Railway environment:** Railway injects `PORT`, `RAILWAY_GIT_COMMIT_SHA`, and `RAILWAY_ENVIRONMENT` automatically. The Dockerfile exposes port 3001 but Railway overrides this with the `PORT` env var.
- **Neon connection pooling:** Neon provides two connection strings per database: a pooled one (via PgBouncer) and a direct one. Prisma migrations require the direct URL. Application queries should use the pooled URL with `?pgbouncer=true&connection_limit=10`.
- **Stripe webhook ordering:** Stripe does not guarantee event delivery order. The subscription webhook handlers must be idempotent -- updating workspace fields to the current state rather than toggling.
- **Rate limiting storage:** `@nestjs/throttler` uses in-memory storage by default. For multi-replica deployments, this means each replica has its own counter. A Redis-backed store would be needed for true distributed rate limiting, but this is acceptable for the initial single-replica deployment.
- **Test suite:** The 33 failing tests may be caused by missing mocks for services added during the security audit (e.g., new guards, interceptors). Fixing them may require updating `providers` arrays in test modules.
- **Backward compatibility:** The `RoleService.checkLegacyRolePermission()` method ensures the granular RBAC system is backward-compatible with the legacy string-based roles (`OWNER`, `ADMIN`, `MEMBER`, `TECHNICIAN`). The seed script populates permissions but does not force-migrate existing workspace members to the new role system.
