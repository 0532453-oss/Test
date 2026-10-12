# FlexDesk Mobile — Comprehensive Engineering PRD

> **Author:** Senior Engineering Lead
> **Date:** February 2026
> **Status:** Draft
> **Audience:** Mobile engineers, backend engineers, QA, DevOps

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Architecture Decision: React Native](#3-architecture-decision-react-native)
4. [Backend API Contract](#4-backend-api-contract)
5. [Authentication & Session Management](#5-authentication--session-management)
6. [Offline-First Architecture](#6-offline-first-architecture)
7. [Security Requirements](#7-security-requirements)
8. [Push Notifications](#8-push-notifications)
9. [Location Services & Geofencing](#9-location-services--geofencing)
10. [Data Models & Local Schema](#10-data-models--local-schema)
11. [Screen-by-Screen Feature Spec](#11-screen-by-screen-feature-spec)
12. [File Uploads & Media](#12-file-uploads--media)
13. [Third-Party Integrations](#13-third-party-integrations)
14. [Performance Budgets](#14-performance-budgets)
15. [Testing Strategy](#15-testing-strategy)
16. [CI/CD & Distribution](#16-cicd--distribution)
17. [Environment & Configuration](#17-environment--configuration)
18. [Migration Plan from Prototype](#18-migration-plan-from-prototype)
19. [Risk Register](#19-risk-register)
20. [Appendix: Full API Reference](#appendix-a-full-api-reference)

---

## 1. Executive Summary

FlexDesk Mobile is a React Native app for **field technicians and small business owners** in the home services industry. It connects to the existing FlexDesk NestJS backend (deployed on Railway) and provides:

- **Daily schedule management** with real-time job status transitions
- **Customer & property lookup** with contact actions (call, text, navigate)
- **Invoice creation and tracking** with Stripe payment links
- **Offline-first operation** — technicians work in areas with poor connectivity
- **GPS-based geofencing** — validates technician presence before starting jobs
- **Route optimization** — optimal daily route via Google Maps Routes API

A UI prototype already exists at `packages/flexdesk-mobile` (React Native 0.73.6, 4 screens, mock data only). This PRD covers **everything needed to ship a production app** connected to the real backend.

---

## 2. Current State Analysis

### 2.1 What Exists

| Component | Status | Notes |
|-----------|--------|-------|
| `packages/flexdesk-mobile` | Prototype | 4 screens, 10 components, mock data, no backend connection |
| `packages/flexdesk-server` | Production | 21 controllers, full REST API, JWT auth, workspace RLS |
| `packages/flexdesk-core` | Production | IndexedDB sync manager, API client, auth hooks (web-only) |
| `packages/flexdesk-types` | Production | Shared TypeScript interfaces |
| `packages/flexdesk-ui` | Production | Web component library (not usable in RN) |

### 2.2 Existing Mobile Package Structure

```
packages/flexdesk-mobile/
├── App.tsx                          # Entry point (NavigationContainer + SafeAreaProvider)
├── package.json                     # RN 0.73.6, React Navigation 6.x
├── src/
│   ├── components/                  # 10 components (JobBlock, ClientCard, InvoiceRow, etc.)
│   ├── screens/                     # 4 screens (Dashboard, ClientList, JobCalendar, Invoicing)
│   ├── navigation/MainTabNavigator  # Bottom tab navigator
│   ├── data/mockData.ts             # Mock data (needs replacement with API layer)
│   └── theme/                       # Design tokens (colors, typography, spacing)
├── DESIGN.md                        # Component design specifications
├── SCREENS.md                       # Screen layout specifications
└── PRD.md                           # UI polish PRD (debug/animations)
```

### 2.3 Reusable Shared Packages

These existing monorepo packages can be consumed by the mobile app:

| Package | What to Reuse | What to Replace |
|---------|--------------|----------------|
| `@service-flex/types` | Entity interfaces, enums (`JobStatus`, `InvoiceStatus`, etc.), validation schemas | Nothing — use directly |
| `@service-flex/core` | Auth token logic, data provider patterns, sync queue architecture | IndexedDB → WatermelonDB, `fetch()` → Axios, `localStorage` → Keychain |
| `flexdesk-utils` | Date formatting, currency formatting, string utils, validation helpers | Nothing — pure TS, no React/DOM dependency |

**Cannot reuse:** `flexdesk-ui` (web React components with CSS), `flexdesk-web-admin` (web page components), Atlantis design system (CSS-based). The mobile app has its own React Native component library with design tokens already in `src/theme/`.

### 2.4 What's Missing (This PRD Covers)

- API client layer (Axios/fetch + auth interceptors)
- Authentication flow (login, register, OAuth, token refresh)
- Offline sync engine (SQLite/WatermelonDB replacing IndexedDB)
- Push notifications (FCM + APNs)
- Background location tracking
- Geofence validation
- File upload (job photos, signatures)
- Stripe payment integration
- Error handling & retry logic
- App distribution (TestFlight, Play Store)
- Security hardening

---

## 3. Architecture Decision: React Native

### 3.1 Stack Choices

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | React Native 0.73+ | Already chosen, prototype exists, team knows React |
| **Navigation** | React Navigation 6.x | Already in prototype |
| **State Management** | Zustand + React Query | Zustand for local state, React Query for server cache |
| **API Client** | Axios | Interceptors for auth tokens, retry logic, request/response transforms |
| **Local Database** | WatermelonDB | Fast, lazy-loaded, SQLite-backed, built for offline-first RN apps |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Cross-platform, free, handles APNs bridging |
| **Location** | react-native-geolocation-service | Background tracking, high accuracy |
| **Maps** | react-native-maps | Google Maps on Android, Apple Maps on iOS |
| **File Handling** | react-native-image-picker + react-native-blob-util | Camera, gallery, upload |
| **Secure Storage** | react-native-keychain | Biometric-protected token storage |
| **Crash Reporting** | Sentry (react-native-sentry) | Error tracking, breadcrumbs |

### 3.2 Project Structure (Target)

```
packages/flexdesk-mobile/
├── App.tsx
├── src/
│   ├── api/                    # Axios instance, endpoint functions, interceptors
│   │   ├── client.ts           # Axios instance with auth interceptor
│   │   ├── auth.api.ts         # login, register, refresh, logout
│   │   ├── jobs.api.ts         # CRUD, status transitions, sync
│   │   ├── customers.api.ts    # CRUD, search, details
│   │   ├── invoices.api.ts     # CRUD, send, payment links
│   │   ├── estimates.api.ts    # CRUD, lifecycle actions
│   │   ├── technicians.api.ts  # Profile, location, availability
│   │   └── reports.api.ts      # Dashboard metrics
│   ├── auth/                   # Auth context, token management, guards
│   │   ├── AuthContext.tsx
│   │   ├── useAuth.ts
│   │   └── tokenStorage.ts     # Keychain-backed secure storage
│   ├── components/             # Existing 10 + new components
│   ├── db/                     # WatermelonDB schema, models, sync
│   │   ├── schema.ts
│   │   ├── models/
│   │   └── sync.ts             # Push/pull sync with server
│   ├── hooks/                  # Shared hooks (useLocation, useNetwork, etc.)
│   ├── navigation/             # Stack + Tab navigators, deep linking
│   ├── notifications/          # FCM setup, handlers, permission requests
│   ├── screens/                # Existing 4 + new screens (Login, JobDetail, etc.)
│   ├── services/               # Background services (location, sync cron)
│   ├── store/                  # Zustand stores (auth, ui, sync status)
│   ├── theme/                  # Existing design tokens
│   ├── types/                  # TypeScript types (import from @service-flex/types where possible)
│   └── utils/                  # Formatting, validation, helpers
```

---

## 4. Backend API Contract

### 4.1 Base URL

```
Production: https://your-app.up.railway.app/api/v1
Staging:    https://your-staging-app.up.railway.app/api/v1
Local:      http://localhost:3001/api/v1
```

### 4.2 Global API Behaviors

| Behavior | Implementation |
|----------|---------------|
| **Auth** | Bearer token in `Authorization` header for all non-`@Public()` routes |
| **Workspace Scoping** | Automatic via JWT `workspaceId` claim — no client-side filtering needed |
| **Rate Limiting** | 100 requests/60s per IP (global), 5/60s on auth endpoints |
| **Body Size** | 1 MB max (JSON), larger for file uploads |
| **Validation** | Whitelist validation — unknown fields rejected with 400 |
| **Error Format** | `{ statusCode, message, error, timestamp, path }` |
| **UUID Params** | All `:id` params validated as UUID — malformed IDs return 400 |

### 4.3 Real-Time Gap

**No WebSocket gateway exists on the server.** There are no `.gateway.ts` files. All data fetching is REST-based with polling. For the mobile app:
- Use React Query's `refetchInterval` (5-10s) for active screens (dispatch board, job tracking)
- Push notifications (FCM) serve as the real-time trigger for critical events (new job assigned, schedule change)
- A WebSocket gateway is a P2 backend enhancement — not a blocker for MVP

### 4.4 CORS for Mobile

The server's CORS allowlist is configured via `CORS_ORIGIN` env var. **React Native does not enforce CORS** (it's a browser-only mechanism), so mobile API calls work without CORS configuration. However, if using a WebView for OAuth, ensure the redirect URL is handled natively.

### 4.4 Complete Endpoint Inventory

#### Auth (`/api/v1/auth`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `GET` | `/google` | Public | Initiate Google OAuth | WebView or system browser |
| `GET` | `/google/callback` | Public | OAuth callback | Deep link back to app |
| `POST` | `/exchange-code` | Public | Exchange one-time code for tokens | After OAuth callback |
| `POST` | `/register` | Public (5/min) | Email/password registration | Registration screen |
| `POST` | `/login` | Public | Email/password login | Login screen |
| `POST` | `/refresh` | Public | Refresh access token | Token interceptor |
| `GET` | `/me` | JWT | Get current user profile | Profile screen, app init |
| `POST` | `/logout` | JWT | Invalidate refresh token | Settings > Logout |

#### Jobs (`/api/v1/jobs`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `POST` | `/` | JWT | Create job | Quick-create from FAB |
| `GET` | `/` | JWT | List all jobs (filter: status, customerId, technicianId) | Job list views |
| `GET` | `/sync?date=YYYY-MM-DD` | JWT | Get technician's jobs for a date | **Primary mobile endpoint** — daily schedule |
| `GET` | `/scheduled?startDate&endDate` | JWT | Jobs in date range | Calendar week view |
| `GET` | `/:id` | JWT | Get single job | Job detail screen |
| `GET` | `/:id/details` | JWT | Job with all relations (customer, technician, notes, attachments, parts) | Job detail screen (full) |
| `PUT` | `/:id` | JWT | Update job fields | Edit job form |
| `PATCH` | `/:id/status` | JWT | Transition job status | Start Job, Complete Job buttons |
| `PATCH` | `/:id/assign` | JWT | Assign technician | Dispatch (admin only) |
| `DELETE` | `/:id` | JWT | Delete job | Admin only |

#### Technicians (`/api/v1/technicians`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `POST` | `/` | JWT | Create technician | Admin only |
| `GET` | `/` | JWT | List all (filter: available) | Dispatch views |
| `GET` | `/me` | JWT | **Current tech profile** | Profile screen, app init |
| `GET` | `/:id` | JWT | Get technician by ID | Team views |
| `PATCH` | `/:id` | JWT | Update profile | Edit profile |
| `PATCH` | `/location` | JWT | **Update GPS location** | Background location service |
| `PATCH` | `/:id/availability` | JWT | Toggle availability | Availability switch |
| `GET` | `/:id/next-job` | JWT | Next scheduled job with travel time | Dashboard widget |

#### Customers (`/api/v1/customers`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `POST` | `/` | JWT | Create customer | Quick-create form |
| `GET` | `/` | JWT | List all (search query param) | Client list + search |
| `GET` | `/:id` | JWT | Get customer | Customer detail |
| `GET` | `/:id/details` | JWT | Customer with recent jobs | Customer detail screen |
| `PUT` | `/:id` | JWT | Update customer | Edit customer |
| `DELETE` | `/:id` | JWT | Delete customer | Admin only |

#### Invoices (`/api/v1/invoices`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `POST` | `/from-job/:jobId` | JWT | Create invoice from completed job | Auto-create after job completion |
| `GET` | `/` | JWT | List all (filter: status) | Invoice list |
| `GET` | `/:id` | JWT | Get invoice | Invoice detail |
| `GET` | `/by-customer/:customerId` | JWT | Invoices for customer | Customer detail tab |
| `PATCH` | `/:id/status` | JWT | Update status | Status management |
| `POST` | `/:id/send` | JWT | Send invoice to customer | Send button |
| `POST` | `/:id/mark-paid` | JWT | Mark as paid | Manual payment recording |
| `POST` | `/:id/payment-link` | JWT | Generate Stripe payment link | Share link with customer |
| `GET` | `/payment-status/:paymentIntentId` | JWT | Check payment status | Payment tracking |

#### Estimates (`/api/v1/estimates`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `POST` | `/` | JWT | Create estimate | On-site quoting |
| `GET` | `/` | JWT | List all (filter: status) | Estimates list |
| `GET` | `/:id` | JWT | Get estimate | Detail view |
| `GET` | `/by-customer/:customerId` | JWT | Estimates for customer | Customer tab |
| `PATCH` | `/:id` | JWT | Update (draft only) | Edit form |
| `POST` | `/:id/send` | JWT | Send to customer | Send button |
| `POST` | `/:id/mark-viewed` | JWT | Track customer viewed | Portal integration |
| `POST` | `/:id/accept` | JWT | Customer accepts | Portal integration |
| `POST` | `/:id/reject` | JWT | Customer rejects | Portal integration |
| `POST` | `/:id/convert-to-job` | JWT | Convert to job | After acceptance |
| `DELETE` | `/:id` | JWT | Delete (draft only) | Draft management |
| `POST` | `/check-expired` | JWT | Expire old estimates | Background check |

#### Properties (`/api/v1/properties`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `POST` | `/` | JWT | Create property | Add service location |
| `GET` | `/` | JWT | List all | Property lookup |
| `GET` | `/:id` | JWT | Get property | Property detail |
| `GET` | `/by-customer/:customerId` | JWT | Properties for customer | Customer detail |
| `PATCH` | `/:id` | JWT | Update property | Edit address/notes |
| `DELETE` | `/:id` | JWT | Delete property | Admin |

#### Parts & Inventory (`/api/v1/parts`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `POST` | `/` | JWT | Create part | Inventory management |
| `GET` | `/` | JWT | List all parts | Parts catalog |
| `GET` | `/low-stock` | JWT | Low stock alerts | Dashboard notification |
| `GET` | `/:id` | JWT | Get part | Part detail |
| `PATCH` | `/:id` | JWT | Update part | Edit part |
| `DELETE` | `/:id` | JWT | Soft-delete part | Remove from catalog |
| `POST` | `/:id/job/:jobId` | JWT | **Add part to job** | On-site part tracking |
| `PATCH` | `/job-part/:jobPartId` | JWT | Update quantity on job | Adjust part usage |
| `DELETE` | `/job-part/:jobPartId` | JWT | Remove part from job | Remove part |

#### Reports (`/api/v1/reports`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `GET` | `/revenue` | JWT | Revenue metrics | Dashboard stats |
| `GET` | `/technician-performance` | JWT | Tech performance | Performance dashboard |
| `GET` | `/customer-analytics` | JWT | Customer metrics | Analytics tab |
| `GET` | `/dashboard` | JWT | **Combined dashboard summary** | Dashboard screen |

#### Job Parts (`/api/v1/jobs/:jobId/parts`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `GET` | `/:jobId/parts` | JWT | List parts used in a job | Job detail parts tab |
| `GET` | `/:jobId/parts/totals` | JWT | Get cost/price/profit totals | Job detail summary |
| `POST` | `/:jobId/parts` | JWT | **Add part to job** | On-site part tracking |
| `PATCH` | `/:jobId/parts/:jobPartId` | JWT | Update part quantity | Adjust usage |
| `DELETE` | `/:jobId/parts/:jobPartId` | JWT | Remove part from job | Remove part |

#### Recurring Templates (`/api/v1/recurring-templates`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `POST` | `/` | JWT | Create recurring template | Admin |
| `POST` | `/process-all` | JWT | Generate all recurring jobs | Admin/cron |
| `POST` | `/:id/generate` | JWT | Generate single job from template | Admin |

#### Properties (`/api/v1/properties`) — Extended

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `GET` | `/search?q=` | JWT | Search properties | Address lookup |
| `GET` | `/by-customer/:cid/primary` | JWT | Get customer's primary property | Default address |
| `GET` | `/:id/with-relations` | JWT | Property with customer + jobs | Property detail |
| `POST` | `/:id/set-primary` | JWT | Set as primary property | Property management |
| `POST` | `/migrate/:customerId` | JWT | Migrate legacy address to property | Data migration |

#### Workspaces (`/api/v1/workspaces`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `POST` | `/` | JWT | Create workspace | Onboarding |
| `GET` | `/mine` | JWT | Get user's workspaces | Workspace switcher |
| `GET` | `/:id` | JWT | Get workspace | Settings |
| `GET` | `/:id/stats` | JWT | Workspace statistics | Dashboard |
| `PUT` | `/:id` | OWNER/ADMIN | Update workspace | Settings |
| `POST` | `/:id/members` | OWNER/ADMIN | Add member | Team management |
| `DELETE` | `/:id/members/:memberId` | OWNER/ADMIN | Remove member | Team management |
| `PUT` | `/:id/members/:memberId/role` | OWNER/ADMIN | Update member role | Team management |

#### Roles & Permissions (`/api/v1/roles`, `/api/v1/permissions`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `POST` | `/roles` | OWNER/ADMIN | Create role | Admin |
| `GET` | `/roles` | JWT | List all roles | Role assignment UI |
| `GET` | `/roles/default` | JWT | Get default role | Onboarding |
| `GET` | `/roles/:id` | JWT | Get role | Role detail |
| `GET` | `/roles/check/:userId/:resource/:action` | JWT | **Check permission** | Client-side RBAC |
| `GET` | `/roles/user/:userId/permissions` | JWT | Get all user permissions | Feature gating |
| `GET` | `/permissions` | JWT | List all permissions | Admin |

#### Route Optimization (`/api/v1/routes`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `GET` | `/status` | JWT | Check if Maps API configured | Feature detection |
| `POST` | `/optimize` | JWT | Optimize waypoints | Generic route |
| `POST` | `/optimize-technician` | JWT | **Optimize tech's daily route** | Daily route view |
| `POST` | `/directions` | JWT | Get directions A→B | Navigation |
| `POST` | `/distance-matrix` | JWT | Distance matrix | Travel time estimates |

#### Notification Preferences (`/api/v1/notification-preferences`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `GET` | `/:customerId` | JWT | Get notification prefs | Customer detail |
| `PUT` | `/:customerId` | JWT | Update prefs | Settings |
| `GET` | `/:customerId/check/:type/:channel` | JWT | Check if notification enabled | Before sending |

#### Customer Portal (`/api/v1/customer-portal`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `POST` | `/generate-token` | JWT | Generate portal token for customer | Share portal link |
| `GET` | `/` | Portal Token | Get portal data | Customer view |
| `GET` | `/invoices` | Portal Token | Customer's invoices | Customer view |
| `POST` | `/invoices/:id/pay` | Portal Token | Generate payment link | Customer self-pay |

#### Public Tracking (`/api/v1/public`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `GET` | `/track?token=xxx` | None (signed token) | Track job + technician location | Share tracking link with customer |

#### Stripe Connect (`/api/v1/stripe`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `POST` | `/onboard/:technicianId` | JWT | Create Express account + onboarding link | Tech payout setup |
| `GET` | `/account/:technicianId/status` | JWT | Get Stripe account status | Payout status |

#### Stripe Subscriptions (`/api/v1/subscriptions`)

| Method | Path | Auth | Purpose | Mobile Use |
|--------|------|------|---------|------------|
| `GET` | `/tiers` | Public | List subscription tiers | Pricing screen |
| `POST` | `/create-checkout-session` | Public | Create Stripe checkout | Upgrade flow |
| `GET` | `/workspace/:wid/subscription` | JWT | Get current subscription | Settings |
| `DELETE` | `/workspace/:wid/subscription` | OWNER/ADMIN | Cancel subscription | Settings |
| `POST` | `/workspace/:wid/billing-portal` | OWNER/ADMIN | Open Stripe billing portal | Billing management |

#### Health & Webhooks

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/health` | Public | Basic health check |
| `GET` | `/health/ready` | Public | Readiness probe (503 if DB down) |
| `GET` | `/health/live` | Public | Liveness probe (always 200) |
| `GET` | `/health/details` | JWT | Detailed health (DB + services) |
| `POST` | `/webhooks/stripe` | Public (signature verified) | Stripe webhooks (server-only) |

---

## 5. Authentication & Session Management

### 5.1 Auth Flow for Mobile

```
┌──────────────────────────────────────────────────────────┐
│                    APP LAUNCH                             │
│                                                           │
│  1. Check Keychain for stored tokens                      │
│     ├── Tokens found → validate access token expiry       │
│     │   ├── Valid → GET /auth/me → Home Screen            │
│     │   └── Expired → POST /refresh → new tokens → Home  │
│     └── No tokens → Login Screen                          │
│                                                           │
│  LOGIN SCREEN                                             │
│     ├── Email/Password → POST /auth/login                 │
│     ├── Google OAuth → System Browser → Deep Link back    │
│     └── Register → POST /auth/register                    │
│                                                           │
│  TOKEN STORAGE (react-native-keychain)                    │
│     ├── accessToken  → Keychain (biometric-protected)     │
│     ├── refreshToken → Keychain (biometric-protected)     │
│     └── NEVER in AsyncStorage, NEVER in plain text        │
│                                                           │
│  TOKEN REFRESH (Axios interceptor)                        │
│     ├── 401 response → POST /refresh with refreshToken    │
│     ├── Success → update Keychain, retry original request │
│     ├── Failure → clear Keychain → Login Screen           │
│     └── Queue concurrent requests during refresh          │
└──────────────────────────────────────────────────────────┘
```

### 5.2 Google OAuth on Mobile

The server uses a **one-time code exchange** flow (not token-in-URL). For mobile:

1. Open system browser (or in-app browser tab) to `GET /api/v1/auth/google`
2. User authenticates with Google
3. Server callback redirects to `flexdesk://auth/callback?code=XXXX`
4. App captures deep link, extracts code
5. App calls `POST /api/v1/auth/exchange-code` with the code
6. Receives `access_token` + `refresh_token`
7. Stores both in Keychain

**Deep Link Configuration:**
```
iOS: flexdesk://auth/callback
Android: flexdesk://auth/callback
Universal Links: https://flexdesk.com/auth/callback (requires apple-app-site-association)
```

**Backend Change Required:** Add `flexdesk://auth/callback` as a valid redirect URL for mobile clients. Currently the server only redirects to `FRONTEND_URL`.

### 5.3 Token Lifecycle

| Token | Expiry | Storage | Refresh |
|-------|--------|---------|---------|
| Access Token (JWT) | 15 minutes | Keychain | Auto via interceptor |
| Refresh Token | 7 days | Keychain (httpOnly cookie on web) | On access token expiry |

### 5.4 JWT Payload (What the App Receives)

```typescript
interface JWTPayload {
  sub: string;        // User ID (UUID)
  email: string;      // User email
  role: string;       // Workspace role: OWNER | ADMIN | MEMBER | TECHNICIAN
  workspaceId: string; // Active workspace ID (UUID)
  iat: number;        // Issued at
  exp: number;        // Expiry
}
```

### 5.5 Axios Auth Interceptor (Reference Implementation)

```typescript
// src/api/client.ts
import axios from 'axios';
import { getTokens, setTokens, clearTokens } from '../auth/tokenStorage';

const api = axios.create({
  baseURL: Config.API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

api.interceptors.request.use(async (config) => {
  const { accessToken } = await getTokens();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken } = await getTokens();
        const { data } = await axios.post(`${Config.API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        await setTokens(data.access_token, data.refresh_token);
        failedQueue.forEach((p) => p.resolve(data.access_token));
        failedQueue = [];
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        failedQueue.forEach((p) => p.reject(refreshError));
        failedQueue = [];
        await clearTokens();
        // Navigate to login screen
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 6. Offline-First Architecture

### 6.1 Why Offline-First Matters

Field technicians frequently work in basements, rural areas, and buildings with poor connectivity. The app must:

- Allow viewing today's schedule with zero network
- Allow starting/completing jobs offline
- Queue status changes, notes, and photos for sync
- Resolve conflicts when back online

### 6.2 Sync Strategy

The server already supports sync via:
- `syncStatus` field on all major entities (PENDING, SYNCING, SYNCED, CONFLICT, FAILED)
- `syncVersion` for optimistic locking
- `lastSyncedAt` timestamps
- `GET /jobs/sync?date=YYYY-MM-DD` endpoint for partial daily sync

**Mobile Sync Architecture:**

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   UI Layer   │ ←────── │ WatermelonDB │ ←────── │  Sync Engine │
│  (Screens)   │         │   (SQLite)   │ ──────→ │  (Background)│
└──────────────┘         └──────────────┘         └──────┬───────┘
                                                          │
                                                          │ HTTP
                                                          ▼
                                                   ┌──────────────┐
                                                   │  NestJS API  │
                                                   │  (Railway)   │
                                                   └──────────────┘
```

### 6.3 What to Cache Locally

| Entity | Cache Strategy | TTL | Sync Trigger |
|--------|---------------|-----|--------------|
| Jobs (today) | Full sync | Pull on app open, every 5 min | Background + pull-to-refresh |
| Jobs (week) | Partial | Pull when calendar scrolls | On-demand |
| Customers | Full list (names, IDs) | 1 hour | Lazy on first access |
| Customer details | On-demand | 30 min | When customer screen opens |
| Invoices | Recent 50 | 15 min | Pull-to-refresh |
| Technician profile | Full | On login | Profile edits |
| Parts catalog | Full | 1 hour | Background |
| Properties | By customer | 30 min | Lazy load |

### 6.4 Offline Write Queue

When offline, mutations (status changes, notes, etc.) are queued:

```typescript
interface SyncQueueItem {
  id: string;              // UUID
  endpoint: string;        // e.g., 'PATCH /jobs/:id/status'
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  payload: any;            // Request body
  createdAt: Date;         // When queued
  retryCount: number;      // Max 5
  status: 'pending' | 'syncing' | 'failed';
  entityType: string;      // 'job', 'invoice', etc.
  entityId: string;        // UUID of the entity
}
```

**Conflict Resolution:**
- `syncVersion` mismatch → server returns 409
- App shows conflict UI: "This job was updated by another user. Keep your changes or use server version?"
- For critical fields (status), server wins by default
- For notes/attachments, merge (append) strategy

### 6.5 Network Status Detection

```typescript
// Use @react-native-community/netinfo
import NetInfo from '@react-native-community/netinfo';

// Subscribe to changes
NetInfo.addEventListener(state => {
  store.setOnline(state.isConnected && state.isInternetReachable);
  if (state.isConnected) {
    syncEngine.processQueue(); // Flush pending mutations
  }
});
```

Show the existing `OfflineBanner` component (from DESIGN.md) when `!isConnected`.

---

## 7. Security Requirements

### 7.1 Token Security

| Requirement | Implementation |
|------------|----------------|
| Token storage | `react-native-keychain` with biometric access control |
| Never in AsyncStorage | AsyncStorage is unencrypted plaintext on disk |
| Never in Redux/Zustand persisted state | State snapshots can leak to disk |
| Certificate pinning | Pin Railway's TLS certificate (prevents MITM) |
| Token in headers only | Never append tokens to URLs or query strings |

### 7.2 Network Security

| Requirement | Implementation |
|------------|----------------|
| HTTPS only | Reject HTTP connections; use `NSAppTransportSecurity` (iOS) |
| Certificate pinning | TrustKit (iOS) / OkHttp CertificatePinner (Android) |
| No sensitive data in logs | Redact tokens from Axios request/error logs |
| Request timeout | 15s default, 60s for file uploads |
| Retry with backoff | Exponential backoff (1s, 2s, 4s, 8s, 16s) max 5 retries |

### 7.3 Data Security

| Requirement | Implementation |
|------------|----------------|
| Local DB encryption | WatermelonDB supports SQLCipher for encrypted SQLite |
| Keychain protection | `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` |
| Screen capture protection | Blur app content in app switcher (iOS) |
| Clipboard safety | Don't copy tokens or PII to clipboard |
| Jailbreak/root detection | Optional: `jail-monkey` library for detection |

### 7.4 Input Validation

The server uses `class-validator` with whitelist mode — unknown fields are stripped. But the mobile app should also validate:

- UUID format before sending `:id` params
- Date format (YYYY-MM-DD) before sending date queries
- Email format on registration
- Password minimum length (8 chars) on registration
- Numeric fields (amounts) are positive numbers
- Text fields have reasonable max lengths

### 7.5 RBAC Enforcement

The JWT contains a `role` field. The app should:

- Hide admin-only features (delete job, manage roles) for TECHNICIAN role
- Show full management UI for OWNER/ADMIN
- Disable dispatch features for non-dispatcher roles
- The server enforces RBAC server-side — the app hides UI but does not rely solely on client-side guards

### 7.6 Backend Security Already in Place

These protections are already implemented server-side (from Feb 2026 audit):

- Rate limiting: 100 req/60s global, 5 req/60s on auth endpoints
- Body size limits: 1 MB
- Helmet security headers
- Workspace RLS via Prisma extension (automatic data isolation)
- Bcrypt password hashing (10 rounds)
- Account lockout after 5 failed login attempts (15 min)
- Refresh token hashing in DB (revocable)
- One-time auth code exchange (OAuth tokens never in URLs)
- Parameterized queries via Prisma (SQL injection prevention)
- Global `ValidationPipe` with whitelist (mass assignment prevention)
- Required env vars for secrets (JWT_SECRET, JOB_TOKEN_SECRET, CUSTOMER_PORTAL_SECRET)

---

## 8. Push Notifications

### 8.1 Current State

The server has **email (SendGrid) and SMS (Twilio)** notifications but **no push notification infrastructure**. This must be built.

### 8.2 Architecture

```
┌──────────┐    ┌───────────┐    ┌──────────┐    ┌──────────┐
│  NestJS  │───→│  FCM API  │───→│  APNs /  │───→│  Mobile  │
│  Server  │    │ (Firebase) │    │ FCM SDK  │    │   App    │
└──────────┘    └───────────┘    └──────────┘    └──────────┘
```

### 8.3 Backend Changes Required

1. **New model: `DeviceToken`**

```prisma
model DeviceToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique  // FCM registration token
  platform  String   // 'ios' | 'android'
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id])
  @@map("device_tokens")
}
```

2. **New endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/devices/register` | Register FCM token |
| `DELETE` | `/devices/:token` | Unregister token (logout) |

3. **Firebase Admin SDK** integration in `NotificationService`:
   - Send push alongside email/SMS
   - Respect `NotificationPreference` settings

### 8.4 Notification Types

| Event | Push Title | Push Body | Data Payload |
|-------|-----------|-----------|-------------|
| Job Dispatched | "New Job Assigned" | "{title} at {time}" | `{ jobId, type: 'job_dispatched' }` |
| Job Reminder | "Upcoming Job" | "{title} in {hours}h" | `{ jobId, type: 'job_reminder' }` |
| Invoice Paid | "Payment Received" | "{customer} paid {amount}" | `{ invoiceId, type: 'payment_received' }` |
| Schedule Change | "Schedule Updated" | "Your {date} schedule changed" | `{ date, type: 'schedule_change' }` |
| Estimate Accepted | "Estimate Accepted" | "{customer} accepted {title}" | `{ estimateId, type: 'estimate_accepted' }` |

### 8.5 Mobile Implementation

```typescript
// src/notifications/setup.ts
import messaging from '@react-native-firebase/messaging';

async function requestPermission(): Promise<string | null> {
  const authStatus = await messaging().requestPermission();
  const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED
    || authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    const token = await messaging().getToken();
    await api.post('/devices/register', { token, platform: Platform.OS });
    return token;
  }
  return null;
}

// Handle foreground messages
messaging().onMessage(async remoteMessage => {
  // Show in-app notification banner (not system notification)
  showInAppNotification(remoteMessage);
});

// Handle background/quit messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  // Update local DB if needed
  if (remoteMessage.data?.type === 'schedule_change') {
    await syncEngine.syncTodaySchedule();
  }
});

// Handle notification tap (app opened from notification)
messaging().onNotificationOpenedApp(remoteMessage => {
  navigateToScreen(remoteMessage.data);
});
```

---

## 9. Location Services & Geofencing

### 9.1 Why Location Matters

The server **requires geofence validation** for `DISPATCHED → IN_PROGRESS` status transition. The technician must be within 500m of the job site.

### 9.2 Background Location Tracking

```typescript
// Update technician location every 5 minutes when app is active
// Update every 15 minutes in background (battery optimization)

import Geolocation from 'react-native-geolocation-service';

const watchId = Geolocation.watchPosition(
  (position) => {
    api.patch('/technicians/location', {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });
  },
  (error) => console.warn('Location error:', error),
  {
    enableHighAccuracy: true,
    distanceFilter: 100,  // Minimum 100m movement to trigger update
    interval: 300000,     // 5 min (Android)
    fastestInterval: 60000, // 1 min minimum (Android)
    showsBackgroundLocationIndicator: true, // iOS blue bar
  }
);
```

### 9.3 Geofence Check Before Starting Job

```typescript
async function canStartJob(job: Job): Promise<{ allowed: boolean; distance?: number }> {
  const position = await getCurrentPosition();
  const jobLocation = job.location; // { lat, lng }

  if (!jobLocation?.lat || !jobLocation?.lng) {
    return { allowed: true }; // No location set, allow start
  }

  const distance = haversineDistance(
    position.coords.latitude,
    position.coords.longitude,
    jobLocation.lat,
    jobLocation.lng,
  );

  return {
    allowed: distance <= 500, // 500m radius (matches server)
    distance: Math.round(distance),
  };
}
```

### 9.4 Permissions Required

**iOS (`Info.plist`):**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>FlexDesk needs your location to verify you're at the job site and optimize your route.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>FlexDesk uses background location to keep your position updated for dispatch and route optimization.</string>
```

**Android (`AndroidManifest.xml`):**
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

---

## 10. Data Models & Local Schema

### 10.1 WatermelonDB Schema

Map the server's Prisma models to a local SQLite schema for offline support:

```typescript
// src/db/schema.ts
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'jobs',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'workspace_id', type: 'string', isIndexed: true },
        { name: 'customer_id', type: 'string', isIndexed: true },
        { name: 'technician_id', type: 'string', isIndexed: true },
        { name: 'property_id', type: 'string', isOptional: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'priority', type: 'string' },
        { name: 'scheduled_date', type: 'string', isOptional: true, isIndexed: true },
        { name: 'scheduled_start_time', type: 'string', isOptional: true },
        { name: 'scheduled_end_time', type: 'string', isOptional: true },
        { name: 'location_lat', type: 'number', isOptional: true },
        { name: 'location_lng', type: 'number', isOptional: true },
        { name: 'estimated_duration', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' },
        { name: 'sync_version', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'customers',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string' },
        { name: 'sync_version', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'invoices',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'job_id', type: 'string' },
        { name: 'customer_id', type: 'string', isIndexed: true },
        { name: 'invoice_number', type: 'string' },
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'amount', type: 'number' },
        { name: 'tax', type: 'number' },
        { name: 'total', type: 'number' },
        { name: 'due_date', type: 'number', isOptional: true },
        { name: 'paid_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' },
        { name: 'sync_version', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'properties',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'customer_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'is_primary', type: 'boolean' },
        { name: 'street', type: 'string' },
        { name: 'city', type: 'string' },
        { name: 'state', type: 'string' },
        { name: 'zip', type: 'string' },
        { name: 'lat', type: 'number', isOptional: true },
        { name: 'lng', type: 'number', isOptional: true },
        { name: 'access_notes', type: 'string', isOptional: true },
        { name: 'service_notes', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'parts',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'sku', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'category', type: 'string', isOptional: true },
        { name: 'unit_cost', type: 'number' },
        { name: 'unit_price', type: 'number' },
        { name: 'quantity_on_hand', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'endpoint', type: 'string' },
        { name: 'method', type: 'string' },
        { name: 'payload', type: 'string' }, // JSON stringified
        { name: 'entity_type', type: 'string' },
        { name: 'entity_id', type: 'string' },
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'retry_count', type: 'number' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
```

### 10.2 Key Enums (From Prisma Schema)

```typescript
// Must match server-side exactly
enum JobStatus {
  SCHEDULED = 'SCHEDULED',
  DISPATCHED = 'DISPATCHED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

enum JobPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

enum EstimateStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CONVERTED = 'CONVERTED',
}

enum SyncStatus {
  PENDING = 'PENDING',
  SYNCING = 'SYNCING',
  SYNCED = 'SYNCED',
  CONFLICT = 'CONFLICT',
  FAILED = 'FAILED',
}
```

### 10.3 Valid Job Status Transitions (Client-Side Enforcement)

```typescript
const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  SCHEDULED:   [JobStatus.DISPATCHED, JobStatus.CANCELLED],
  DISPATCHED:  [JobStatus.IN_PROGRESS, JobStatus.CANCELLED],
  IN_PROGRESS: [JobStatus.COMPLETED, JobStatus.ON_HOLD, JobStatus.CANCELLED],
  ON_HOLD:     [JobStatus.IN_PROGRESS, JobStatus.CANCELLED],
  COMPLETED:   [], // Terminal
  CANCELLED:   [], // Terminal
};

// DISPATCHED → IN_PROGRESS requires geofence check (500m)
```

---

## 11. Screen-by-Screen Feature Spec

### 11.1 Login Screen (NEW)

**Not in prototype — must be built.**

| Element | Details |
|---------|---------|
| Logo | FlexDesk logo centered |
| Email input | `keyboardType="email-address"`, `autoCapitalize="none"` |
| Password input | `secureTextEntry`, toggle visibility |
| Login button | `POST /auth/login` |
| Google button | System browser → OAuth flow → deep link back |
| Register link | Navigate to Register screen |
| Forgot password | Phase 2 (not implemented on server yet) |
| Error states | Invalid credentials, account locked (5 attempts / 15 min), network error |

### 11.2 Dashboard Screen (ENHANCE)

**Existing prototype needs real data.**

| Widget | API Source | Offline |
|--------|-----------|---------|
| Business Health Ring | `GET /reports/dashboard` → jobCompletionRate | Cached value |
| Active Clients stat | `GET /reports/dashboard` → customerMetrics.active | Cached |
| Pending Jobs stat | `GET /reports/dashboard` → jobMetrics.pending | Cached |
| Unpaid Invoices stat | `GET /reports/dashboard` → invoiceMetrics.unpaid | Cached |
| Weekly Revenue stat | `GET /reports/dashboard` → revenueMetrics.thisMonth | Cached |
| Next Job widget (NEW) | `GET /technicians/:id/next-job` | From local jobs DB |
| TipCard | Local state only | N/A |

### 11.3 Client List Screen (ENHANCE)

| Feature | API | Notes |
|---------|-----|-------|
| List all clients | `GET /customers` | Paginate if > 100 |
| Search | `GET /customers?search=query` | Debounce 300ms |
| Client detail (expand) | `GET /customers/:id/details` | Shows recent jobs |
| Call action | `Linking.openURL('tel:${phone}')` | Native dialer |
| Text action | `Linking.openURL('sms:${phone}')` | Native SMS |
| Navigate action | Open Google Maps to property address | |
| New Client (FAB) | `POST /customers` | Form bottom sheet |

### 11.4 Job Calendar Screen (ENHANCE)

| Feature | API | Notes |
|---------|-----|-------|
| Today's jobs | `GET /jobs/sync?date=today` | Primary sync endpoint |
| Week view | `GET /jobs/scheduled?startDate&endDate` | 7-day range |
| Job detail sheet | `GET /jobs/:id/details` | Full relations |
| Start Job | `PATCH /jobs/:id/status` body: `{status: 'IN_PROGRESS'}` | Geofence check first |
| Complete Job | `PATCH /jobs/:id/status` body: `{status: 'COMPLETED'}` | Triggers invoice auto-create |
| Add note | Requires new endpoint or job update | |
| Add photo | File upload to job attachments | |
| Parts used | `POST /parts/:id/job/:jobId` | Track parts on-site |
| Route (NEW) | `GET /route-optimization/technician/:id/route?date=` | Google Maps Routes |

### 11.5 Invoicing Screen (ENHANCE)

| Feature | API | Notes |
|---------|-----|-------|
| List invoices | `GET /invoices` | Filter by status |
| Invoice detail | `GET /invoices/:id` | |
| Create from job | `POST /invoices/from-job/:jobId` | After job completion |
| Send invoice | `POST /invoices/:id/send` | Email to customer |
| Share payment link | `POST /invoices/:id/payment-link` | Returns Stripe URL |
| Mark paid | `POST /invoices/:id/mark-paid` | Manual recording |

### 11.6 New Screens Needed

| Screen | Priority | Purpose |
|--------|----------|---------|
| Login / Register | P0 | Auth |
| Job Detail (full screen) | P0 | Complete job view with notes, photos, parts |
| Estimate Create/Edit | P1 | On-site quoting |
| Profile / Settings | P1 | Tech profile, availability toggle, logout |
| Property Detail | P2 | Address, access notes, service history |
| Notifications Center | P2 | In-app notification history |

---

## 12. File Uploads & Media

### 12.1 Job Photos

Technicians need to take before/after photos at job sites.

**Flow:**
1. Capture via `react-native-image-picker` (camera or gallery)
2. Compress to max 1920px width, JPEG 80% quality
3. Upload to server (new endpoint needed) or directly to S3 pre-signed URL
4. Server creates `JobAttachment` record with `fileName`, `fileUrl`, `fileSize`, `mimeType`

**Backend Change Required:** Add file upload endpoint:
```
POST /jobs/:id/attachments (multipart/form-data)
```

### 12.2 Customer Signatures

For job completion proof:
1. Capture via `react-native-signature-canvas`
2. Convert to PNG
3. Upload as job attachment with `mimeType: 'image/png'`

### 12.3 Offline Photo Queue

Photos taken offline are stored locally and queued for upload:
- Store in app's document directory (not temp)
- Queue upload in `sync_queue` with `entityType: 'attachment'`
- Upload when connectivity returns
- Show upload progress indicator

---

## 13. Third-Party Integrations

### 13.1 Integration Matrix

| Service | Server Integration | Mobile Integration | Notes |
|---------|-------------------|-------------------|-------|
| **Stripe** | Full (payments, Connect, subscriptions, webhooks) | Share payment links only (no SDK needed) | Use `Linking.openURL(stripeUrl)` |
| **Google Maps** | Distance Matrix, Geocoding, Routes API | `react-native-maps` for display, server for calculations | Map views on job detail, route optimization |
| **SendGrid** | Transactional email | None (server-side only) | Push notifications replace some email |
| **Twilio** | SMS | None (server-side only) | Could add in-app calling via Twilio SDK (P3) |
| **Firebase** | None currently | FCM for push notifications | Requires Firebase project setup |
| **Sentry** | None currently | Crash reporting + performance monitoring | Add to both server + mobile |

### 13.2 Google Maps in Mobile

```typescript
// Job detail map showing property location
import MapView, { Marker } from 'react-native-maps';

<MapView
  region={{
    latitude: job.location.lat,
    longitude: job.location.lng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }}
>
  <Marker coordinate={{ latitude: job.location.lat, longitude: job.location.lng }} />
</MapView>
```

**Navigate to job site:**
```typescript
const navigateToJob = (lat: number, lng: number) => {
  const url = Platform.select({
    ios: `maps:0,0?q=${lat},${lng}`,
    android: `google.navigation:q=${lat},${lng}`,
  });
  Linking.openURL(url);
};
```

---

## 14. Performance Budgets

### 14.1 App Launch

| Metric | Target | Notes |
|--------|--------|-------|
| Cold start to interactive | < 2s | Hermes engine pre-compiled |
| Token validation + /me call | < 500ms | Parallel with UI render |
| First meaningful paint (dashboard) | < 1.5s | Use cached data, lazy-load reports |

### 14.2 Navigation

| Metric | Target |
|--------|--------|
| Tab switch | < 100ms |
| Screen push (stack) | < 200ms |
| Bottom sheet open | < 150ms (spring animation) |

### 14.3 Network

| Metric | Target |
|--------|--------|
| API response (P95) | < 500ms |
| Daily sync (full) | < 2s |
| Photo upload (5MB) | < 10s on 4G |

### 14.4 Bundle Size

| Metric | Target |
|--------|--------|
| iOS binary (IPA) | < 30 MB |
| Android APK | < 25 MB |
| Android AAB | < 20 MB |

### 14.5 Battery & Memory

| Metric | Target |
|--------|--------|
| Background location drain | < 5% battery/hour |
| Memory usage (resident) | < 150 MB |
| Background sync interval | 5 min (active), 15 min (background) |

---

## 15. Testing Strategy

### 15.1 Test Pyramid

| Layer | Tool | Coverage Target | What to Test |
|-------|------|----------------|-------------|
| **Unit** | Jest | 80%+ | Utils, formatters, sync logic, state machines |
| **Component** | React Native Testing Library | 70%+ | Screen renders, user interactions, conditional UI |
| **Integration** | MSW (Mock Service Worker) | Key flows | Auth flow, sync flow, CRUD operations |
| **E2E** | Detox | Critical paths | Login → View Schedule → Start Job → Complete → Invoice |

### 15.2 Critical E2E Flows

1. **Technician Daily Flow:** Login → Dashboard → View Today's Jobs → Navigate to Job Site → Start Job (geofence pass) → Add Notes + Photos → Complete Job → Auto-Invoice Generated
2. **Offline Flow:** Go offline → View cached schedule → Start job → Add notes → Go online → Verify sync
3. **Auth Flow:** Login → Token expires → Auto-refresh → Continue working
4. **Payment Flow:** View invoice → Generate payment link → Share with customer

---

## 16. CI/CD & Distribution

### 16.1 Build Pipeline

```
┌──────────┐    ┌───────────┐    ┌──────────┐    ┌──────────────┐
│  GitHub   │───→│  GitHub   │───→│  Build   │───→│  TestFlight  │
│   Push    │    │  Actions  │    │  (EAS /  │    │  + Play      │
│           │    │  (CI)     │    │  Fastlane)│    │  Console     │
└──────────┘    └───────────┘    └──────────┘    └──────────────┘
```

### 16.2 CI Checks (Every PR)

```yaml
# .github/workflows/mobile-ci.yml
- TypeScript typecheck (tsc --noEmit)
- ESLint
- Jest unit + component tests
- Android build (debug APK)
- iOS build (simulator, no signing)
```

### 16.3 Distribution

| Channel | Tool | Trigger |
|---------|------|---------|
| iOS Internal Testing | TestFlight | Push to `release/*` branch |
| iOS App Store | App Store Connect | Manual promotion from TestFlight |
| Android Internal Testing | Google Play Internal Track | Push to `release/*` branch |
| Android Play Store | Google Play Console | Manual promotion |
| OTA Updates | EAS Update (Expo) or CodePush | For JS-only changes |

### 16.4 Build Tool Recommendation

**Expo Application Services (EAS)** — even without Expo framework:
- Cloud builds (no local Mac needed for iOS)
- OTA updates for JS bundle changes
- Build profiles (development, preview, production)
- Integrates with GitHub Actions

---

## 17. Environment & Configuration

### 17.1 Mobile Environment Variables

```typescript
// Use react-native-config for build-time env vars
// .env.development
API_URL=http://localhost:3001/api/v1
GOOGLE_MAPS_KEY=AIza...
SENTRY_DSN=https://...@sentry.io/...
FIREBASE_PROJECT_ID=flexdesk-mobile
ENV=development

// .env.staging
API_URL=https://your-staging-app.up.railway.app/api/v1
GOOGLE_MAPS_KEY=AIza...
SENTRY_DSN=https://...@sentry.io/...
FIREBASE_PROJECT_ID=flexdesk-mobile
ENV=staging

// .env.production
API_URL=https://your-app.up.railway.app/api/v1
GOOGLE_MAPS_KEY=AIza...
SENTRY_DSN=https://...@sentry.io/...
FIREBASE_PROJECT_ID=flexdesk-mobile
ENV=production
```

### 17.2 Backend Changes Required (Summary)

| Change | Priority | Effort |
|--------|----------|--------|
| Add mobile redirect URL to OAuth callback | P0 | Small |
| Add `CORS_ORIGIN` entry for mobile (if using WebView) | P0 | Small |
| Add `DeviceToken` model + FCM registration endpoints | P0 | Medium |
| Add Firebase Admin SDK to NotificationService | P0 | Medium |
| Add file upload endpoint for job attachments | P1 | Medium |
| Add job notes CRUD endpoint | P1 | Small |
| Add pagination to list endpoints (cursor-based) | P1 | Medium |
| Add `lastModified` header for conditional sync | P2 | Small |
| Add WebSocket gateway for real-time dispatch updates | P2 | Large |

### 17.3 Firebase Project Setup

1. Create Firebase project: "flexdesk-mobile"
2. Add iOS app (bundle ID: `com.flexdesk.mobile`)
3. Add Android app (package: `com.flexdesk.mobile`)
4. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
5. Enable Cloud Messaging
6. Add Firebase Admin SDK credentials to server env

---

## 18. Migration Plan from Prototype

### Phase 1: Foundation (Week 1-2)

- [ ] Set up development environment (Xcode, Android Studio, simulators)
- [ ] Upgrade React Native if needed (0.73.6 → latest stable)
- [ ] Add all new dependencies (Axios, WatermelonDB, Keychain, etc.)
- [x] Implement API client (`src/api/client.ts`) with auth interceptor
- [x] Implement token storage (`react-native-keychain`)
- [x] Build Login + Register screens
- [x] Implement Google OAuth deep link flow
- [ ] Add backend: mobile OAuth redirect URL support

### Phase 2: Core Data Flow (Week 3-4)

- [x] Set up WatermelonDB schema and models
- [ ] Replace `mockData.ts` with API calls on all 4 screens
- [ ] Implement Dashboard with `GET /reports/dashboard`
- [ ] Implement Client List with `GET /customers` + search
- [ ] Implement Job Calendar with `GET /jobs/sync` + `GET /jobs/scheduled`
- [ ] Implement Invoice List with `GET /invoices`
- [ ] Add pull-to-refresh on all list screens
- [ ] Add loading skeletons (specs already in DESIGN.md)

### Phase 3: Job Lifecycle (Week 5-6)

- [ ] Build Job Detail screen (full screen, not just bottom sheet)
- [ ] Implement job status transitions with geofence validation
- [ ] Add job notes (text input → API)
- [ ] Add job photo capture + upload
- [ ] Add parts tracking on jobs
- [ ] Implement "Complete Job" flow (notes + signature + parts → complete → auto-invoice)
- [ ] Add backend: file upload endpoints

### Phase 4: Offline & Sync (Week 7-8)

- [ ] Implement sync engine (pull from server → WatermelonDB, push queue → server)
- [ ] Network status detection + offline banner
- [ ] Queue offline mutations (status changes, notes)
- [ ] Conflict resolution UI
- [ ] Background sync (when app is backgrounded)
- [ ] Test offline → online flow thoroughly

### Phase 5: Notifications & Location (Week 9-10)

- [ ] Set up Firebase project + FCM
- [ ] Add backend: DeviceToken model + registration endpoint
- [ ] Add backend: Firebase Admin SDK integration
- [ ] Implement push notification handling (foreground, background, tap)
- [ ] Implement background location tracking
- [ ] Add route optimization display (Google Maps)
- [ ] Add backend: push notification sending alongside email/SMS

### Phase 6: Polish & Ship (Week 11-12)

- [ ] Profile/Settings screen (availability toggle, logout, app version)
- [ ] Estimates screen (create, send, lifecycle)
- [ ] Error handling (global error boundary, toast notifications)
- [ ] Crash reporting (Sentry)
- [ ] Performance optimization (Hermes, lazy screens, image caching)
- [ ] Certificate pinning
- [ ] App icons, splash screen, app store assets
- [ ] E2E tests (Detox)
- [ ] TestFlight + Play Store internal testing
- [ ] App Store / Play Store submission

---

## 19. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Background location drains battery | High | Medium | Use `distanceFilter` (100m), reduce update frequency in background, test on real devices |
| Offline sync conflicts | Medium | High | Implement clear conflict resolution UI, server-wins for status fields, merge for notes |
| OAuth deep link not intercepted | Medium | Medium | Test on multiple OS versions, add Universal Links as fallback |
| WatermelonDB migration complexity | Low | High | Start with simple schema, plan migration strategy from v1 |
| Large photo uploads on slow networks | High | Medium | Compress aggressively, queue uploads, show progress, allow cancel |
| Push notification delivery reliability | Medium | Medium | Use FCM high-priority for job dispatches, fall back to SMS for critical alerts |
| React Native version compatibility | Low | High | Pin all native dependency versions, test on CI with specific RN version |
| App Store rejection | Low | High | Follow Apple guidelines for location usage justification, ensure privacy policy |

---

## Appendix A: Full API Reference

### Server Health

```
GET /api/v1/health → { status: "ok", timestamp: "..." }
```

### Authentication

```
GET  /api/v1/auth/google                      → Redirect to Google
GET  /api/v1/auth/google/callback              → Redirect to app with code
POST /api/v1/auth/exchange-code                → { access_token, refresh_token }
POST /api/v1/auth/register                     → { accessToken, user }
POST /api/v1/auth/login                        → { access_token, refresh_token, user }
POST /api/v1/auth/refresh                      → { access_token, refresh_token }
GET  /api/v1/auth/me                           → { id, email, fullName, role, workspaceId, avatarUrl }
POST /api/v1/auth/logout                       → { message }
```

### Jobs

```
POST   /api/v1/jobs                            → Job
GET    /api/v1/jobs?status=&customerId=&technicianId= → Job[]
GET    /api/v1/jobs/sync?date=YYYY-MM-DD       → Job[]
GET    /api/v1/jobs/scheduled?startDate=&endDate= → Job[]
GET    /api/v1/jobs/:id                        → Job
GET    /api/v1/jobs/:id/details                → Job (with relations)
PUT    /api/v1/jobs/:id                        → Job
PATCH  /api/v1/jobs/:id/status                 → Job
PATCH  /api/v1/jobs/:id/assign                 → Job
DELETE /api/v1/jobs/:id                        → Job
```

### Technicians

```
POST   /api/v1/technicians                     → Technician
GET    /api/v1/technicians?available=           → Technician[]
GET    /api/v1/technicians/me                  → Technician
GET    /api/v1/technicians/:id                 → Technician
PATCH  /api/v1/technicians/:id                 → Technician
PATCH  /api/v1/technicians/location            → void
PATCH  /api/v1/technicians/:id/availability    → Technician
GET    /api/v1/technicians/:id/next-job        → NextJobResponse
```

### Customers

```
POST   /api/v1/customers                       → Customer
GET    /api/v1/customers?search=               → Customer[]
GET    /api/v1/customers/:id                   → Customer
GET    /api/v1/customers/:id/details           → Customer (with jobs)
PUT    /api/v1/customers/:id                   → Customer
DELETE /api/v1/customers/:id                   → Customer
```

### Invoices

```
POST   /api/v1/invoices/from-job/:jobId        → Invoice
GET    /api/v1/invoices?status=                → Invoice[]
GET    /api/v1/invoices/:id                    → Invoice
GET    /api/v1/invoices/by-customer/:customerId → Invoice[]
PATCH  /api/v1/invoices/:id/status             → Invoice
POST   /api/v1/invoices/:id/send               → Invoice
POST   /api/v1/invoices/:id/mark-paid          → Invoice
POST   /api/v1/invoices/:id/payment-link       → { url, paymentIntentId }
GET    /api/v1/invoices/payment-status/:piId   → { status }
```

### Estimates

```
POST   /api/v1/estimates                       → Estimate
GET    /api/v1/estimates?status=               → Estimate[]
GET    /api/v1/estimates/:id                   → Estimate
GET    /api/v1/estimates/by-customer/:cid      → Estimate[]
PATCH  /api/v1/estimates/:id                   → Estimate
POST   /api/v1/estimates/:id/send              → Estimate
POST   /api/v1/estimates/:id/mark-viewed       → Estimate
POST   /api/v1/estimates/:id/accept            → Estimate
POST   /api/v1/estimates/:id/reject            → Estimate
POST   /api/v1/estimates/:id/convert-to-job    → Estimate
DELETE /api/v1/estimates/:id                   → void
POST   /api/v1/estimates/check-expired         → { expiredCount }
```

### Properties

```
POST   /api/v1/properties                      → Property
GET    /api/v1/properties                      → Property[]
GET    /api/v1/properties/:id                  → Property
GET    /api/v1/properties/by-customer/:cid     → Property[]
PATCH  /api/v1/properties/:id                  → Property
DELETE /api/v1/properties/:id                  → Property
```

### Parts & Inventory

```
POST   /api/v1/parts                           → Part
GET    /api/v1/parts                           → Part[]
GET    /api/v1/parts/low-stock                 → Part[]
GET    /api/v1/parts/:id                       → Part
PATCH  /api/v1/parts/:id                       → Part
DELETE /api/v1/parts/:id                       → Part
POST   /api/v1/parts/:id/job/:jobId            → JobPart
PATCH  /api/v1/parts/job-part/:jobPartId       → JobPart
DELETE /api/v1/parts/job-part/:jobPartId       → void
```

### Reports

```
GET    /api/v1/reports/revenue                 → RevenueReport
GET    /api/v1/reports/technician-performance  → TechPerformanceReport
GET    /api/v1/reports/customer-analytics      → CustomerAnalyticsReport
GET    /api/v1/reports/dashboard               → DashboardSummary
```

### Job Parts

```
GET    /api/v1/jobs/:jobId/parts               → JobPart[]
GET    /api/v1/jobs/:jobId/parts/totals        → { totalCost, totalPrice, totalProfit }
POST   /api/v1/jobs/:jobId/parts               → JobPart
PATCH  /api/v1/jobs/:jobId/parts/:jpId         → JobPart
DELETE /api/v1/jobs/:jobId/parts/:jpId         → void
```

### Recurring Templates

```
POST   /api/v1/recurring-templates             → RecurringJobTemplate
POST   /api/v1/recurring-templates/process-all → { generatedCount }
POST   /api/v1/recurring-templates/:id/generate → Job
```

### Workspaces

```
POST   /api/v1/workspaces                      → Workspace
GET    /api/v1/workspaces/mine                 → Workspace[]
GET    /api/v1/workspaces/:id                  → Workspace
GET    /api/v1/workspaces/:id/stats            → WorkspaceStats
PUT    /api/v1/workspaces/:id                  → Workspace
POST   /api/v1/workspaces/:id/members          → WorkspaceMember
DELETE /api/v1/workspaces/:id/members/:mid     → void
PUT    /api/v1/workspaces/:id/members/:mid/role → WorkspaceMember
```

### Roles & Permissions

```
POST   /api/v1/roles                           → Role
GET    /api/v1/roles                           → Role[]
GET    /api/v1/roles/default                   → Role
GET    /api/v1/roles/:id                       → Role
GET    /api/v1/roles/check/:uid/:resource/:action → { hasPermission }
GET    /api/v1/roles/user/:uid/permissions     → Permission[]
GET    /api/v1/permissions                     → Permission[]
GET    /api/v1/permissions/by-resource/:res    → Permission[]
```

### Route Optimization

```
GET    /api/v1/routes/status                   → { configured: boolean }
POST   /api/v1/routes/optimize                 → OptimizedRoute
POST   /api/v1/routes/optimize-technician      → TechnicianRoute
POST   /api/v1/routes/directions               → Directions
POST   /api/v1/routes/distance-matrix          → DistanceMatrix
```

### Notification Preferences

```
GET    /api/v1/notification-preferences/:cid   → NotificationPreference
PUT    /api/v1/notification-preferences/:cid   → NotificationPreference
GET    /api/v1/notification-preferences/:cid/check/:type/:channel → { enabled }
```

### Customer Portal

```
POST   /api/v1/customer-portal/generate-token  → { token, url }
GET    /api/v1/customer-portal                 → PortalData
GET    /api/v1/customer-portal/invoices        → Invoice[]
POST   /api/v1/customer-portal/invoices/:id/pay → { paymentUrl }
```

### Public Tracking

```
GET    /api/v1/public/track?token=xxx          → { job, technicianLocation }
```

### Stripe Connect

```
POST   /api/v1/stripe/onboard/:techId         → { url }
GET    /api/v1/stripe/account/:techId/status   → { charges_enabled, payouts_enabled }
```

### Stripe Subscriptions

```
GET    /api/v1/subscriptions/tiers             → SubscriptionTier[]
POST   /api/v1/subscriptions/create-checkout-session → { sessionUrl }
GET    /api/v1/subscriptions/workspace/:wid/subscription → Subscription
DELETE /api/v1/subscriptions/workspace/:wid/subscription → void
POST   /api/v1/subscriptions/workspace/:wid/billing-portal → { url }
```

### Health & Webhooks

```
GET    /api/v1/health                          → { status: "ok" }
GET    /api/v1/health/ready                    → 200 or 503
GET    /api/v1/health/live                     → 200 (always)
GET    /api/v1/health/details                  → { db, services }
POST   /api/v1/webhooks/stripe                → void (signature verified)
```

---

*This PRD is a living document. Update it as backend endpoints are added, mobile features ship, and the architecture evolves.*
