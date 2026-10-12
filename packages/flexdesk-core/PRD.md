# PRD: @service-flex/core -- Deployment Readiness

## Introduction

`@service-flex/core` is a shared React hooks and business-logic library in the FlexDesk monorepo (pnpm + Nx). It provides the `AuthProvider`, `ApiClient`, IndexedDB sync manager, React Admin-compatible data provider, and CRUD hooks consumed by `flexdesk-preview-v2`, `flexdesk-admin`, and `flexdesk-portal`. It depends on `@service-flex/types` (workspace link). This package must be robust, well-tested, and resilient to network failures before any frontend app can deploy to production.

Build: `tsup` (CJS + ESM + DTS, React externalized). Typecheck: `tsc --noEmit`. Peer dependency: `react ^18 || ^19`.

---

## Goals

- API client handles transient failures with retry logic and exponential backoff.
- Expired JWTs are refreshed transparently before requests fail with 401.
- Duplicate POST/PUT submissions from double-clicks are prevented.
- In-flight requests are cancelled on component unmount to avoid state-update-after-unmount errors.
- Sync manager handles network reconnection gracefully and exposes conflict-resolution hooks.
- All subpath exports (`/auth`, `/api`, `/config`, `/data-provider`, `/hooks`) resolve correctly after build.
- Unit tests cover the auth provider and API client core paths.
- A `useOnlineStatus` hook is available for UI components to react to connectivity changes.

---

## Non-Goals

- No UI components (those belong in `flexdesk-ui`).
- No server-side logic or API route handlers.
- No migration of data provider away from React Admin compatibility.
- No WebSocket/real-time subscription layer (future scope).
- No changes to the IndexedDB schema or store names.

---

## User Stories

### US-001: Add retry logic with exponential backoff to ApiClient

**Description:** As a frontend app, I need the API client to automatically retry transient failures (network errors, 500, 502, 503, 429) with exponential backoff so that brief server blips do not surface as user-facing errors.

**Acceptance Criteria:**
- [x] Add a `maxRetries` option to `ApiRequestOptions` (default: 3)
- [x] Add a `retryableStatuses` set: `[429, 500, 502, 503, 504]`
- [x] On a retryable failure, wait `min(1000 * 2^attempt, 30000)` ms before retrying (exponential backoff with 30s cap)
- [x] Add jitter: randomize wait time by +/- 20%
- [x] Do NOT retry on 400, 401, 403, 404, 409, 422 (client errors)
- [x] Do NOT retry if `method` is POST and no idempotency key is provided (to prevent duplicate creation)
- [x] Log retry attempts to `apiDebugStore`
- [x] After all retries exhausted, throw the original error
- [x] Typecheck passes

---

### US-002: Add token refresh interceptor to ApiClient

**Description:** As a frontend app, I need the API client to detect expired JWTs (401 response) and automatically refresh the token before retrying the original request, so users are not logged out unnecessarily.

**Acceptance Criteria:**
- [ ] When a request receives a 401 response, attempt to refresh the token by calling `POST /auth/refresh` with `credentials: 'include'` (refresh token is in httpOnly cookie)
- [ ] If refresh succeeds, store the new access token via `tokenStorage.setAccessToken()` and retry the original request exactly once with the new token
- [ ] If refresh fails (non-2xx), call `tokenStorage.clearAll()` and throw an `AuthenticationError` (new custom error class)
- [ ] Prevent concurrent refresh attempts -- if a refresh is already in-flight, queue subsequent 401 requests and resolve them all when the refresh completes
- [ ] Add `AuthenticationError` class extending `Error` with a `statusCode: 401` property
- [ ] Typecheck passes

---

### US-003: Add request deduplication for mutation requests

**Description:** As a frontend app, I need the API client to prevent duplicate POST/PUT/PATCH/DELETE requests caused by double-clicks or rapid form resubmissions, so that duplicate records are not created.

**Acceptance Criteria:**
- [ ] Track in-flight mutation requests by a key derived from `method + endpoint + JSON.stringify(body)`
- [ ] If an identical mutation request is already in-flight, return the existing promise instead of making a new request
- [ ] Remove the tracking entry when the request completes (success or failure)
- [ ] Add a `skipDeduplication?: boolean` option to `ApiRequestOptions` to opt out
- [ ] GET requests are never deduplicated (they already have caching)
- [ ] Typecheck passes

---

### US-004: Add request cancellation via AbortController

**Description:** As a frontend developer, I need in-flight requests to be cancellable so that when a component unmounts or a user navigates away, pending requests are aborted and do not cause React state-update-after-unmount warnings.

**Acceptance Criteria:**
- [ ] Add an optional `signal?: AbortSignal` parameter to `ApiRequestOptions`
- [ ] Pass the signal to the underlying `fetch()` call
- [ ] When a request is aborted, do NOT retry, do NOT queue for offline sync, do NOT log as an error in `apiDebugStore`
- [ ] Update `useFindOneRecord`, `useFindManyRecords`, `useCreateOneRecord`, and `useUpdateOneRecord` hooks to create an `AbortController` in `useEffect` and abort on cleanup
- [ ] Swallow `AbortError` in hooks -- do not set error state for aborted requests
- [ ] Typecheck passes

---

### US-005: Add type-safe API client helper methods

**Description:** As a frontend developer, I want type-safe CRUD methods on the API client that infer entity types from `@service-flex/types`, so I do not need to specify generic type parameters manually on every call.

**Acceptance Criteria:**
- [ ] Create `src/api/typedClient.ts`
- [ ] Define a `TypedApiClient` class or set of functions with methods: `getJob(id)`, `getJobs(params)`, `createJob(input)`, `updateJob(id, input)`, `deleteJob(id)` -- and equivalents for `Customer`, `Invoice`, `Estimate`, `Technician`, `Property`, `Part`
- [ ] Each method uses the correct entity type from `@service-flex/types` for its return type and input type
- [ ] The typed client wraps the existing `apiClient` singleton -- it does not replace it
- [ ] Export from `src/api/index.ts` barrel
- [ ] Typecheck passes

---

### US-006: Add useOnlineStatus hook

**Description:** As a frontend developer, I need a lightweight `useOnlineStatus` hook that returns the current network connectivity state and re-renders when it changes, so I can show offline banners.

**Acceptance Criteria:**
- [ ] Create `src/hooks/useOnlineStatus.ts`
- [ ] The hook returns `{ isOnline: boolean }`
- [ ] Subscribe to `syncManager.addOnlineListener` on mount, unsubscribe on unmount
- [ ] Initialize with `syncManager.isOnline()` to avoid a flash of wrong state
- [ ] Export from `src/hooks/index.ts` barrel
- [ ] Typecheck passes

---

### US-007: Add sync conflict resolution hooks

**Description:** As a frontend developer, I need hooks that expose sync conflicts so I can build a UI that lets users resolve them (keep local, keep server, or merge).

**Acceptance Criteria:**
- [ ] Create `src/hooks/useSyncConflicts.ts`
- [ ] Define a `SyncConflict` interface: `{ operationId: string; entityType: string; entityId: string; localData: unknown; serverData?: unknown; error: string; errorCategory: SyncErrorCategory; createdAt: string }`
- [ ] The hook returns `{ conflicts: SyncConflict[]; resolveConflict: (operationId: string, resolution: 'keep_local' | 'keep_server' | 'discard') => Promise<void>; isLoading: boolean }`
- [ ] `resolveConflict('keep_local')` re-queues the operation for sync
- [ ] `resolveConflict('keep_server')` removes the operation and refreshes the entity from the server
- [ ] `resolveConflict('discard')` removes the operation without syncing
- [ ] Poll `syncManager.getFailedOperationDetails()` on mount and on sync events
- [ ] Export from `src/hooks/index.ts` barrel
- [ ] Typecheck passes

---

### US-008: Improve sync manager reconnection behavior

**Description:** As an offline-first app, I need the sync manager to handle network reconnection more robustly by debouncing rapid online/offline toggles and processing the queue with progressive retry delays.

**Acceptance Criteria:**
- [ ] Debounce `online` events by 2 seconds before triggering `processSyncQueue` (prevent rapid on/off flapping)
- [ ] After a failed sync batch, schedule a retry with exponential backoff: 5s, 15s, 45s, 120s (max)
- [ ] Reset the backoff timer when a new `online` event fires
- [ ] Add a `lastSyncError` getter that returns the most recent batch-level error
- [ ] Add a `retryFailedOperations()` method that resets `FAILED` operations (below max retries) back to `PENDING` and triggers a sync
- [ ] Typecheck passes

---

### US-009: Add unit tests for AuthProvider

**Description:** As a developer, I need unit tests for the `createAuthProvider` factory so I can refactor with confidence and catch regressions.

**Acceptance Criteria:**
- [ ] Create `src/auth/__tests__/authProvider.test.ts`
- [ ] Add `vitest` as a devDependency and a `test` script to `package.json`
- [ ] Test `login` -- success sets token and user in storage
- [ ] Test `login` -- failure throws with error message
- [ ] Test `logout` -- clears all storage and calls logout endpoint
- [ ] Test `checkAuth` -- succeeds when token is valid
- [ ] Test `checkAuth` -- attempts refresh when identity endpoint returns 401
- [ ] Test `checkAuth` -- throws 'Session expired' when refresh also fails
- [ ] Test `checkError` -- 401 triggers refresh flow
- [ ] Test `checkError` -- 403 throws 'Forbidden'
- [ ] Test `getIdentity` -- returns fresh user from API
- [ ] Test `getIdentity` -- returns cached user when API is unreachable
- [ ] Test `handleCallback` -- exchanges code and stores tokens
- [ ] Mock `fetch` globally using `vi.fn()` -- do not make real network requests
- [ ] All tests pass, typecheck passes

---

### US-010: Add unit tests for ApiClient

**Description:** As a developer, I need unit tests for the `ApiClient` class so I can validate retry logic, token refresh, and deduplication behavior.

**Acceptance Criteria:**
- [ ] Create `src/api/__tests__/client.test.ts`
- [ ] Test `GET` request -- success returns data
- [ ] Test `POST` request -- sends body as JSON
- [ ] Test 500 response triggers retry (after US-001 is implemented)
- [ ] Test 401 response triggers token refresh (after US-002 is implemented)
- [ ] Test duplicate POST deduplication (after US-003 is implemented)
- [ ] Test AbortController cancellation (after US-004 is implemented)
- [ ] Test offline mode queues operation to syncManager
- [ ] Test optimistic update -- cache is updated before request, rolled back on failure
- [ ] Mock `fetch`, `indexedDBClient`, `syncManager`, and `tokenStorage`
- [ ] All tests pass, typecheck passes

---

### US-011: Add useDeleteOneRecord hook

**Description:** As a frontend developer, I need a `useDeleteOneRecord` hook so I can delete entities with optimistic UI updates, consistent with the existing create/update hooks.

**Acceptance Criteria:**
- [ ] Create `src/hooks/useDeleteOneRecord.ts`
- [ ] Define `UseDeleteOneRecordOptions`: `{ objectNameSingular: string; onCompleted?: () => void; onError?: (error: Error) => void }`
- [ ] The hook returns `{ deleteRecord: (id: string) => Promise<void>; loading: boolean; error: Error | null }`
- [ ] `deleteRecord` sends `DELETE /{resource}s/{id}`
- [ ] Optimistic update: remove from IndexedDB cache immediately, restore on failure
- [ ] Accept an optional `AbortSignal` (consistent with US-004)
- [ ] Export from `src/hooks/index.ts` barrel
- [ ] Typecheck passes

---

### US-012: Validate subpath exports resolve correctly after build

**Description:** As a consumer of this package, I need all subpath imports (`@service-flex/core/auth`, `/api`, `/config`, `/data-provider`, `/hooks`) to resolve correctly in both ESM and CJS environments.

**Acceptance Criteria:**
- [ ] Verify `tsup.config.ts` entry map matches `package.json` exports map exactly: root, `/auth`, `/api`, `/config`, `/data-provider`, `/hooks`
- [ ] Run `pnpm --filter @service-flex/core build`
- [ ] Verify `dist/` contains: `index.js`, `index.mjs`, `index.d.ts`, `auth/index.*`, `api/index.*`, `config/index.*`, `data-provider/index.*`, `hooks/index.*`
- [ ] Verify no circular dependency warnings from tsup
- [ ] Verify the `constants/` and `utils/` directories are included in the root barrel export or document that they are internal-only
- [ ] Typecheck passes

---

## Technical Considerations

**Key file paths:**
- Package root: `packages/flexdesk-core/`
- Source: `packages/flexdesk-core/src/`
- API client: `packages/flexdesk-core/src/api/client.ts` (441 lines, singleton `apiClient`)
- Sync manager: `packages/flexdesk-core/src/api/syncManager.ts` (353 lines, singleton `syncManager`)
- IndexedDB client: `packages/flexdesk-core/src/api/indexedDB.ts` (251 lines, singleton `indexedDBClient`)
- Auth provider: `packages/flexdesk-core/src/auth/authProvider.ts` (266 lines, factory `createAuthProvider`)
- Token storage: `packages/flexdesk-core/src/auth/storage.ts` (196 lines, singleton `tokenStorage`)
- useAuth hook: `packages/flexdesk-core/src/auth/useAuth.ts` (139 lines)
- Data provider: `packages/flexdesk-core/src/data-provider/provider.ts` (322 lines, factory `createDataProvider`)
- CRUD hooks: `packages/flexdesk-core/src/hooks/` (5 files)
- Build config: `packages/flexdesk-core/tsup.config.ts`

**Build commands:**
- Build: `pnpm --filter @service-flex/core build`
- Typecheck: `pnpm --filter @service-flex/core typecheck`
- Lint: `pnpm --filter @service-flex/core lint`
- Test (after US-009): `pnpm --filter @service-flex/core test`

**Current state summary (what exists vs what is missing):**

| Capability | Status | Gap |
|---|---|---|
| API client (GET/POST/PUT/PATCH/DELETE) | Exists | No retry logic, no backoff |
| Token auth (Bearer header, X-Workspace-Id) | Exists | No auto-refresh interceptor on 401 |
| Optimistic updates | Exists | Working for single-entity mutations |
| IndexedDB caching (stale-while-revalidate) | Exists | Working for 6 entity types + syncQueue |
| Offline queue (syncManager) | Exists | No debounce on reconnect, no conflict resolution UI hooks |
| Auth provider (login, logout, checkAuth, OAuth callback) | Exists | Token refresh is in authProvider only, not in apiClient |
| Data provider (React Admin compatible) | Exists | No type inference from entity types |
| CRUD hooks (create, findOne, findMany, update) | Exist | Missing delete hook, no AbortController |
| useSyncStatus hook | Exists | Working, polls every 2s |
| useOnlineStatus hook | Missing | Need lightweight connectivity hook |
| Request deduplication | Missing | Double-click protection needed |
| Request cancellation | Missing | No AbortController integration |
| Unit tests | Missing | Zero test files exist |
| Constants (currencies, tax-rates, recurrence) | Stub files only | Empty single-line comment files |
| Utils (currency-formatter, date-time) | Stub files only | Empty single-line comment files |

**Dependency order for implementation:**
1. US-001 (retry logic) -- standalone, no dependencies
2. US-002 (token refresh interceptor) -- standalone, no dependencies
3. US-003 (deduplication) -- standalone, no dependencies
4. US-006 (useOnlineStatus) -- standalone, no dependencies
5. US-008 (sync reconnection) -- standalone, no dependencies
6. US-004 (abort controller) -- depends on hooks existing
7. US-005 (typed client) -- depends on `@service-flex/types` PRD completion
8. US-007 (sync conflicts) -- depends on US-008
9. US-011 (useDeleteOneRecord) -- depends on US-004
10. US-009 (auth tests) -- depends on US-002
11. US-010 (client tests) -- depends on US-001, US-002, US-003, US-004
12. US-012 (validate exports) -- final validation, run last
