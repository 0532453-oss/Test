# FlexDesk Architecture

FlexDesk is a field service management (FSM) platform for scheduling, dispatching, and billing service jobs. It is built as a pnpm + Nx monorepo with a NestJS backend, React frontends, and shared libraries.

---

## High-Level System Diagram

```
                         Internet
                            |
           ┌────────────────┼────────────────┐
           |                |                |
     ┌───────────┐   ┌───────────┐   ┌───────────┐
     │  Vercel   │   │  Vercel   │   │  Vercel   │
     │  Admin    │   │ Preview   │   │  Website  │
     │ (Next.js) │   │  (Vite)   │   │ (Next.js) │
     └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
           │                │                │
           └────────────────┼────────────────┘
                            │ HTTPS / REST
                    ┌───────┴────────┐
                    │   Railway      │
                    │  NestJS API    │
                    │  /api/v1/*     │
                    └───────┬────────┘
                            │
                    ┌───────┴────────┐
                    │  PostgreSQL    │
                    │  (Railway /    │
                    │   Neon)        │
                    └────────────────┘

External Services: Stripe, SendGrid, Twilio, Google Maps
```

---

## Monorepo Structure

All packages live under `packages/`. Nx handles task orchestration (build, test, lint) and caching. pnpm workspaces handle dependency resolution.

### Applications

| Package | Framework | Purpose |
|---------|-----------|---------|
| `flexdesk-server` | NestJS | REST API, business logic, database |
| `flexdesk-admin` | Next.js | Back-office admin dashboard |
| `flexdesk-preview-v2` | Vite + React | Primary customer-facing app |
| `flexdesk-website` | Next.js | Marketing website |
| `flexdesk-portal` | Next.js | Customer self-service portal |
| `flexdesk-agent` | Node.js | AI agent for automated customer comms (Twilio) |

### Shared Libraries

| Package | Purpose |
|---------|---------|
| `flexdesk-types` (`@service-flex/types`) | Shared TypeScript types, entity interfaces, constants |
| `flexdesk-core` (`@service-flex/core`) | Shared hooks, data providers, auth logic (React) |
| `flexdesk-ui` | Reusable UI component library (primitives, patterns, domain components) |
| `flexdesk-utils` | Pure utility functions (date, formatting) -- no React dependency |
| `flexdesk-maps` | Google Maps integration components |
| `flexdesk-analytics` (`@service-flex/analytics`) | Event tracking (stub) |

### Other / Legacy

| Package | Status |
|---------|--------|
| `flexdesk-front` | Legacy frontend (superseded by preview-v2) |
| `flexdesk-preview` | Legacy preview app (superseded by preview-v2) |
| `flexdesk-web-admin` | Legacy admin (superseded by flexdesk-admin) |
| `flexdesk-cli` | CLI tooling (stub) |
| `create-flexdesk-app` | Project scaffolding (stub) |
| `atlantis` | Experimental (stub) |
| `coreui-template-reference` | UI reference template |

### Package Dependency Graph

```
flexdesk-types  <──────────┐
     ^                     │
     │                     │
flexdesk-utils             │
     ^                     │
     │                     │
flexdesk-core  ────────────┤
     ^                     │
     │                     │
flexdesk-ui  ──────────────┤
     ^                     │
     │                     │
     ├── flexdesk-preview-v2 (Vite + React)
     ├── flexdesk-admin      (Next.js)
     ├── flexdesk-portal     (Next.js)
     │
flexdesk-server  (standalone -- no shared lib deps at runtime)
```

Types flow from `flexdesk-types` upward. The server uses Prisma-generated types internally, not the shared types package.

---

## Backend Architecture (flexdesk-server)

### Entry Point

`src/main.ts` bootstraps the NestJS application with:
- Helmet security headers
- Cookie parser
- Request body size limits (1 MB)
- Global prefix: `/api/v1`
- CORS (explicit origin list, required in production)
- Global `ValidationPipe` with whitelist + transform
- Global `HttpExceptionFilter`
- Swagger docs (opt-in via `ENABLE_SWAGGER=true`)

### Module Organization

```
AppModule
├── ThrottlerModule          (rate limiting: 100 req / 60s per IP)
├── CoreModule               (global: Prisma, Config, RequestLogger)
├── AuthModule               (JWT + Google OAuth, Passport strategies)
├── JobsModule               (job lifecycle)
│   ├── JobSchedulingManagerModule
│   ├── JobDispatchManagerModule
│   ├── JobCompletionManagerModule
│   └── RecurrenceEngine     (cron-based recurring job generation)
├── BillingModule            (invoicing + payments)
│   ├── InvoiceManagerModule
│   └── StripeManagerModule  (payments, Connect, subscriptions, webhooks)
├── MapsModule               (global: Google Maps geocoding)
├── NotificationModule       (global: SendGrid email, Twilio SMS)
├── HealthModule             (health check endpoint)
└── QueueWorkerModule        (cron-based background processors)
```

Standalone services registered directly on `AppModule` (not yet extracted into modules):
- Technician, Customer, Workspace, CustomerPortal, Estimate, Property, RouteOptimization, Part, Report, Role

### Manager Pattern

Complex feature modules use hierarchical sub-modules called "Managers." Each manager encapsulates a bounded domain concern:

```
JobsModule
├── JobSchedulingManagerModule   -- calendar scheduling logic
├── JobDispatchManagerModule     -- technician assignment + dispatch
└── JobCompletionManagerModule   -- completion workflows, triggers invoicing

BillingModule
├── InvoiceManagerModule         -- invoice CRUD, line items, PDF
└── StripeManagerModule          -- payment intent, Connect, subscriptions
```

Managers are self-contained NestJS modules with their own service and can be imported independently by other modules (e.g., `JobsModule` imports `InvoiceManagerModule` to generate invoices on job completion).

### Global Guards (applied to every route)

1. **ThrottlerGuard** -- rate limiting (100 req / 60s)
2. **JwtAuthGuard** -- JWT Bearer token validation. Routes can opt out with `@Public()`.
3. **RolesGuard** -- role-based access control via `@Roles('ADMIN')` decorator.

### Global Interceptors

- **WorkspaceInterceptor** -- extracts `workspaceId` from the authenticated user's JWT payload and stores it in `AsyncLocalStorage` for the duration of the request. All downstream Prisma queries are automatically scoped to that workspace.

### Job Status State Machine

Jobs follow a strict finite state machine:

```
SCHEDULED ──> DISPATCHED ──> IN_PROGRESS ──> COMPLETED
    │              │              │
    │              │              └──> ON_HOLD ──> IN_PROGRESS
    │              │              │
    └──> CANCELLED └──> CANCELLED └──> CANCELLED
```

- `DISPATCHED -> IN_PROGRESS` requires geofence validation (technician must be near job site).
- `COMPLETED` and `CANCELLED` are terminal states.
- Transitions are validated by `jobStatusMachine.ts`.

### Background Processing

The `QueueWorkerModule` uses `@nestjs/schedule` for cron-based task processing:
- **JobNotificationProcessor** -- reminders, completion alerts
- **InvoiceGenerationProcessor** -- auto-generate invoices for completed jobs
- **ReportGenerationProcessor** -- daily/weekly report compilation

---

## Data Layer

### Prisma ORM + PostgreSQL

The schema is defined in `packages/flexdesk-server/prisma/schema.prisma`. Key entities:

| Entity | Description |
|--------|-------------|
| `Workspace` | Tenant container. Holds Stripe subscription fields. |
| `User` | Login identity. Supports email/password and Google OAuth. |
| `WorkspaceMember` | Join table: User <-> Workspace with role assignment. |
| `Job` | Core work order. Linked to customer, technician, property. |
| `Customer` | Service recipient. Has properties and notification preferences. |
| `Technician` | Field worker. Linked to User 1:1. Stripe Connect fields for payouts. |
| `Invoice` / `InvoiceLineItem` | Billing records tied to jobs. |
| `RecurringJobTemplate` | Defines recurrence rules (weekly/biweekly/monthly). |
| `Estimate` / `EstimateLineItem` | Quotes that can be converted to jobs. |
| `Property` | Service location (multiple per customer). |
| `Part` / `JobPart` | Inventory tracking and per-job part usage. |
| `Role` / `Permission` / `RolePermission` | Granular RBAC system. |

### Workspace Isolation (Row-Level Security)

Multi-tenancy is enforced at the ORM level through a Prisma client extension:

1. **WorkspaceInterceptor** (NestJS interceptor) reads `workspaceId` from the JWT and calls `runWithWorkspace()`.
2. **workspace-context.ts** stores the workspace ID in Node.js `AsyncLocalStorage`, making it available for the entire async call chain without passing it explicitly.
3. **workspace-middleware.ts** defines a `Prisma.defineExtension` that intercepts all query operations on workspace-scoped models. It automatically:
   - Adds `WHERE workspaceId = ?` to all reads, updates, and deletes.
   - Sets `workspaceId` on all creates.
4. The set of scoped models is explicit: `Job`, `Technician`, `Customer`, `Invoice`, `Estimate`, `Property`, `Part`, `JobPart`, `RecurringJobTemplate`, `Role`, `WorkspaceMember`.

If no workspace context exists (e.g., migrations, seeds, queue workers), queries pass through unfiltered.

### Offline Sync Support

Most entities carry sync metadata fields:
- `syncStatus` (PENDING, SYNCING, SYNCED, CONFLICT, FAILED)
- `lastSyncedAt`
- `syncVersion` (optimistic locking for conflict detection)

The frontend (`flexdesk-core`) includes an IndexedDB-based sync manager for offline-first operation.

---

## Frontend Architecture

### Primary App: flexdesk-preview-v2 (Vite + React 18)

- **Build tool**: Vite
- **UI framework**: CoreUI for React + Radix UI primitives + custom `flexdesk-ui` components
- **State management**: Redux Toolkit + React Query (TanStack Query)
- **Routing**: React Router
- **Data fetching**: TanStack React Query with `ra-core` data provider patterns

### Admin Dashboard: flexdesk-admin (Next.js)

- Server-side rendered admin panel
- Uses Radix UI component primitives

### Component Library: flexdesk-ui

Three-tier component architecture:
- **Primitives** (`flexdesk-ui/primitives`) -- low-level Radix-based components (Button, Input, Dialog)
- **Patterns** (`flexdesk-ui/patterns`) -- composed UI patterns (DataTable, FormSection, SearchableList)
- **Domain** (`flexdesk-ui/domain`) -- business-specific components (JobCard, InvoicePreview, TechnicianAvatar)

### Shared Core: flexdesk-core

Exports via subpath imports:
- `@service-flex/core/auth` -- authentication hooks and token management
- `@service-flex/core/api` -- API client configuration
- `@service-flex/core/data-provider` -- data provider for React Admin patterns
- `@service-flex/core/hooks` -- shared React hooks
- `@service-flex/core/config` -- environment configuration

---

## Authentication Flow

### Google OAuth (Primary)

```
1. User clicks "Sign in with Google"
2. Frontend redirects to: GET /api/v1/auth/google
3. NestJS GoogleStrategy redirects to Google consent screen
4. Google redirects back to: /api/v1/auth/google/callback
5. Server finds or creates User + Workspace
6. Server generates JWT access token (15m) + refresh token (7d)
7. Server stores tokens mapped to a one-time auth code (60s TTL)
8. Server redirects to frontend with auth code in URL (not the tokens)
9. Frontend exchanges auth code for tokens: POST /api/v1/auth/exchange-code
10. Tokens stored in localStorage on the client
```

### Email/Password

```
1. POST /api/v1/auth/register  -- create account, returns tokens
2. POST /api/v1/auth/login     -- validate credentials, returns tokens
```

- Passwords hashed with bcrypt (10 rounds).
- Account lockout after 5 failed attempts (15-minute lockout window).
- Refresh tokens are hashed and stored in the database for revocation.

### Token Structure

The JWT access token payload contains:
- `sub` -- user ID
- `email` -- user email
- `role` -- workspace role (OWNER, ADMIN, MEMBER, TECHNICIAN)
- `workspaceId` -- active workspace

### Authorization

- `@Public()` decorator exempts routes from JWT authentication.
- `@Roles('ADMIN', 'OWNER')` decorator restricts routes by workspace role.
- Granular RBAC via `Role` / `Permission` models (resource + action pairs with optional scope).

---

## Deployment Architecture

### Backend: Railway

- Runs NestJS API as a single service
- PostgreSQL as a Railway add-on (or Neon for free tier)
- Environment variables configured in Railway dashboard
- Deploys on push to main branch
- Prisma migrations run manually via Railway shell

### Frontend: Vercel

- Each frontend app is deployed as a separate Vercel project, all from the same Git repo
- `flexdesk-admin` -- Next.js preset
- `flexdesk-preview-v2` -- Vite preset
- `flexdesk-website` -- Next.js preset
- Environment variables set per-project in Vercel dashboard

### External Service Dependencies

| Service | Purpose | Integration Point |
|---------|---------|-------------------|
| **Stripe** | Payments, subscriptions, Connect payouts | `StripeManagerModule`, webhook at `/api/v1/webhooks/stripe` |
| **SendGrid** | Transactional email | `NotificationService` |
| **Twilio** | SMS notifications | `NotificationService`, `flexdesk-agent` |
| **Google Maps** | Geocoding, directions, geofencing | `MapsModule`, frontend components |

---

## Key Design Decisions

1. **Workspace-scoped RLS via Prisma extension** -- Chosen over PostgreSQL-level RLS for portability and testability. The `AsyncLocalStorage` approach avoids prop-drilling `workspaceId` through every service method.

2. **Manager pattern for complex modules** -- Inspired by Twenty CRM. Each manager is a self-contained NestJS module, enabling independent testing and cross-module reuse (e.g., `InvoiceManagerModule` used by both `BillingModule` and `JobsModule`).

3. **One-time auth code exchange** -- OAuth tokens are never exposed in URLs. After Google callback, the server issues a short-lived code that the frontend exchanges for tokens via a POST request.

4. **Cron-based background processing** -- Uses `@nestjs/schedule` instead of a separate queue (Redis/BullMQ) to reduce infrastructure complexity. Can be upgraded to BullMQ when throughput demands it.

5. **Offline-first sync model** -- Entities carry `syncStatus` and `syncVersion` fields. The frontend uses IndexedDB for local persistence, with optimistic locking to detect conflicts on re-sync.

6. **Monorepo with shared libraries** -- `flexdesk-types`, `flexdesk-core`, and `flexdesk-ui` are consumed by multiple frontend apps. `flexdesk-utils` provides framework-agnostic utilities. This avoids code duplication while keeping packages independently buildable.

7. **Global modules for cross-cutting services** -- `CoreModule` (Prisma), `NotificationModule`, and `MapsModule` are `@Global()` so they are available everywhere without explicit imports.

8. **Job status state machine** -- Transitions are validated by a dedicated module (`jobStatusMachine.ts`) with geofence requirements for the `DISPATCHED -> IN_PROGRESS` transition, ensuring technicians are physically at the job site.
