# PRD: FlexDesk Mobile -- Deployment Readiness

## Introduction

`@flexdesk/mobile` is a React Native 0.73.6 app within the FlexDesk pnpm + Nx monorepo. It serves field technicians and business owners with a bottom-tab interface (Home, Clients, Calendar, Invoices). The app already has substantial scaffolding: an Axios API client with JWT refresh (`src/api/client.ts`), Keychain token storage (`src/auth/tokenStorage.ts`), deep-link Google OAuth (`src/auth/deepLinking.ts`), WatermelonDB offline sync with push/pull and queue processing (`src/db/sync.ts`), network detection with auto-reconnect sync (`src/store/networkStore.ts`), geofence utilities (`src/utils/geofence.ts`), and typed API modules for jobs, customers, invoices, technicians, parts, and reports. React Query hooks power all screens. The DashboardScreen still imports `WORKSPACE_NAME` from `mockData.ts` and some screens may still reference mock data for fallback rendering. This PRD covers the remaining work to reach a shippable v1.

## Goals

- Eliminate all remaining mock data dependencies so every screen reads from the live FlexDesk API
- Verify iOS and Android builds compile without errors
- Set up push notifications via Firebase Cloud Messaging
- Configure App Store and Play Store distribution (bundle ID, signing, icons, splash)
- Wire deep linking for all supported routes (job detail, invoice, calendar)
- Integrate camera for job photos and GPS for technician location updates
- Add crash reporting via Sentry React Native
- Achieve end-to-end offline capability: queue mutations offline, sync on reconnect

## User Stories

---

### US-M01: Remove remaining mock data imports from DashboardScreen

**Description:** As a developer, I want to remove the `WORKSPACE_NAME` import from `mockData.ts` in `DashboardScreen.tsx` and source the workspace name from the authenticated user context or the dashboard API response, so no screen depends on hardcoded sample data.

**Acceptance Criteria:**

- [ ] `DashboardScreen.tsx` no longer imports from `src/data/mockData.ts`
- [ ] Workspace name is sourced from the auth context (`user.workspaceName`) or the dashboard API response
- [ ] If workspace name is unavailable, fall back to a generic placeholder ("My Business")
- [ ] No other screen files import from `src/data/mockData.ts`
- [ ] Typecheck passes

---

### US-M02: Audit and remove all mockData.ts usage across the codebase

**Description:** As a developer, I want to verify that no production code path references `src/data/mockData.ts`, so the app exclusively uses real API data and WatermelonDB.

**Acceptance Criteria:**

- [ ] Run a codebase search for `mockData` imports across all files in `src/`
- [ ] Remove or replace every import found (excluding test files if any)
- [ ] The file `src/data/mockData.ts` is either deleted or moved to a `__fixtures__` directory
- [ ] All screens render correctly when API returns empty arrays (empty states show)
- [ ] Typecheck passes

---

### US-M03: Verify iOS build compiles

**Description:** As a developer, I want to confirm the iOS build compiles without errors on a macOS machine, so we can proceed toward TestFlight distribution.

**Acceptance Criteria:**

- [ ] Run `cd ios && pod install` successfully
- [ ] Run `npx react-native run-ios` or `xcodebuild -workspace ... -scheme ... -sdk iphonesimulator` without build errors
- [ ] All native module linking is correct (WatermelonDB, Keychain, Geolocation, ImagePicker, NetInfo, Config, Gesture Handler, Screens, Safe Area, SVG)
- [ ] App launches in the iOS Simulator and displays the Login screen
- [ ] Typecheck passes

---

### US-M04: Verify Android build compiles

**Description:** As a developer, I want to confirm the Android build compiles without errors, so we can proceed toward Play Store distribution.

**Acceptance Criteria:**

- [ ] Run `cd android && ./gradlew assembleDebug` without build errors
- [ ] All native module auto-linking is resolved (no missing package errors)
- [ ] App launches in an Android emulator and displays the Login screen
- [ ] WatermelonDB JSI module loads without crash on Android
- [ ] Typecheck passes

---

### US-M05: Set up Firebase Cloud Messaging for push notifications

**Description:** As a technician, I want to receive push notifications when I am dispatched to a new job, so I can respond quickly without polling the app.

**Acceptance Criteria:**

- [ ] Install `@react-native-firebase/app` and `@react-native-firebase/messaging`
- [ ] Create Firebase project with iOS bundle ID `com.flexdesk.mobile` and Android package `com.flexdesk.mobile`
- [ ] Add `GoogleService-Info.plist` to iOS project and `google-services.json` to `android/app/`
- [ ] Create `src/notifications/setup.ts` with `requestPermission()` and `registerToken()`
- [ ] After login, request notification permission and register FCM token via `POST /devices/register`
- [ ] On logout, unregister token via `DELETE /devices/:token` and call `messaging().deleteToken()`
- [ ] Subscribe to `messaging().onTokenRefresh()` to re-register on token rotation
- [ ] Typecheck passes

---

### US-M06: Handle push notification display and navigation

**Description:** As a technician, I want tapping a push notification to open the relevant screen (job detail, invoice, calendar), so I can take action immediately.

**Acceptance Criteria:**

- [ ] Create `src/notifications/handlers.ts`
- [ ] Foreground handler: show in-app banner (Animated slide-down, auto-dismiss 5s) with title and body
- [ ] Tapping the banner navigates based on `data.type`: `job_dispatched` -> JobDetail, `payment_received` -> Invoices, `schedule_change` -> Calendar
- [ ] Background handler: if `type === 'schedule_change'`, call `pullSync()` silently
- [ ] Cold launch handler: `messaging().getInitialNotification()` navigates after auth check
- [ ] Typecheck passes
- [ ] Verify changes work in browser

---

### US-M07: Configure App Store and Play Store distribution

**Description:** As a developer, I want to configure app signing, bundle IDs, icons, and splash screen so the app can be submitted to both stores.

**Acceptance Criteria:**

- [ ] Set iOS bundle identifier to `com.flexdesk.mobile` in Xcode project settings
- [ ] Create provisioning profiles: Development + App Store Distribution
- [ ] Generate Android release keystore and configure `android/app/build.gradle` signing config
- [ ] Add app icons: 1024x1024 source for iOS, adaptive icon 108dp for Android
- [ ] Add splash screen: FlexDesk logo centered on the brand olive background
- [ ] Add all required iOS privacy descriptions in `Info.plist` (location, camera, photo library)
- [ ] Build iOS archive and verify IPA exports
- [ ] Build Android `bundleRelease` and verify AAB outputs
- [ ] Typecheck passes

---

### US-M08: Configure deep linking for all supported routes

**Description:** As a technician, I want to open the app directly to a specific job or invoice when tapping a link in an email or SMS, so I do not have to navigate manually.

**Acceptance Criteria:**

- [ ] Expand the `linking` config in `App.tsx` to map `flexdesk://job/:jobId` to JobDetailScreen
- [ ] Add route mapping for `flexdesk://invoices` to InvoicingScreen
- [ ] Add route mapping for `flexdesk://calendar/:date` to JobCalendarScreen with selected date
- [ ] Verify iOS URL scheme `flexdesk` is registered in `Info.plist`
- [ ] Verify Android intent filter for `flexdesk://` is configured in `AndroidManifest.xml`
- [ ] The existing OAuth deep link (`flexdesk://auth/callback`) continues to work
- [ ] Typecheck passes
- [ ] Verify changes work in browser

---

### US-M09: Integrate camera for job photo capture

**Description:** As a technician, I want to take photos on a job site and upload them to the job record, so the office has visual documentation.

**Acceptance Criteria:**

- [ ] The `react-native-image-picker` dependency is already in `package.json`; verify it links correctly on both platforms
- [ ] The `uploadJobAttachment` function in `src/api/jobs.api.ts` already handles multipart upload; wire it to the JobDetailScreen
- [ ] "Take Photo" button on JobDetailScreen opens an action sheet: Camera / Photo Library / Cancel
- [ ] Camera option calls `launchCamera({ mediaType: 'photo', quality: 0.8, maxWidth: 1920 })`
- [ ] After capture, call `uploadJobAttachment(jobId, file, onProgress)` with a progress indicator
- [ ] On success, invalidate job details query; on error, show retry toast
- [ ] Add `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` to iOS `Info.plist`
- [ ] Add `CAMERA` permission to Android `AndroidManifest.xml`
- [ ] Typecheck passes
- [ ] Verify changes work in browser

---

### US-M10: Implement background GPS tracking for technician location

**Description:** As a dispatcher, I want to see a technician's real-time location on the admin map, so I can give customers accurate ETAs.

**Acceptance Criteria:**

- [ ] The `react-native-geolocation-service` dependency is already in `package.json`; verify native linking
- [ ] Create `src/services/locationService.ts` with `startTracking()` and `stopTracking()`
- [ ] `startTracking()` calls `Geolocation.watchPosition()` with `enableHighAccuracy: true`, `distanceFilter: 100`, `interval: 300000`
- [ ] On position update, call `PATCH /technicians/location` with `{ lat, lng }`; throttle to max 1 call per 60 seconds
- [ ] In AuthContext, start tracking on login if user is a technician; stop on logout
- [ ] Add `ACCESS_FINE_LOCATION` and `ACCESS_BACKGROUND_LOCATION` to Android manifest
- [ ] Add `NSLocationAlwaysAndWhenInUseUsageDescription` to iOS `Info.plist`
- [ ] On API error, log silently; never crash from a failed location update
- [ ] Typecheck passes

---

### US-M11: Wire offline mutation queueing into all create/update screens

**Description:** As a technician working in a basement with no signal, I want my actions (add note, update status, add part) to be queued and synced automatically when connectivity returns.

**Acceptance Criteria:**

- [ ] The `enqueueMutation()` function exists in `src/db/sync.ts`; wire it into `src/hooks/mutations.ts`
- [ ] Each mutation hook checks `useNetwork().isOnline` before choosing direct API call vs. `enqueueMutation()`
- [ ] Job status updates, notes, and part additions all go through this path
- [ ] When offline, show a toast "Saved offline -- will sync when connected"
- [ ] The existing `SyncStatusBar` component already displays `pendingQueueCount`; verify it shows the count
- [ ] On reconnect, the network store triggers `pushSync()` then `pullSync()` (already implemented)
- [ ] Typecheck passes
- [ ] Verify changes work in browser

---

### US-M12: Add error handling and crash reporting with Sentry

**Description:** As a developer, I want unhandled exceptions and API errors to be reported to Sentry, so I can diagnose issues in production.

**Acceptance Criteria:**

- [ ] Install `@sentry/react-native`
- [ ] Initialize Sentry in `App.tsx` with DSN from `Config.SENTRY_DSN`
- [ ] Wrap the App component with `Sentry.wrap(App)`
- [ ] Create `src/components/ErrorBoundary.tsx` with fallback UI ("Something went wrong" + Retry)
- [ ] Wrap `RootNavigator` with `ErrorBoundary`
- [ ] Create `src/utils/errorHandler.ts` mapping HTTP status codes to user-friendly messages
- [ ] After login, set Sentry user context; on logout, clear it
- [ ] Typecheck passes

---

### US-M13: Build conflict resolution UI for sync queue

**Description:** As a technician, I want to see and resolve sync conflicts (e.g., job was updated by someone else while I was offline), so my changes are not silently lost.

**Acceptance Criteria:**

- [ ] Create `src/components/ConflictModal.tsx`
- [ ] Query `sync_queue` for items with `status = 'CONFLICT'` after each `pushSync()`
- [ ] Modal shows entity type, local value vs. server value
- [ ] "Keep My Changes" button re-pushes with a force header
- [ ] "Use Server Version" button discards the local change, pulls server data, and deletes the queue item
- [ ] "Dismiss" button keeps the conflict for later resolution
- [ ] For job status conflicts, auto-resolve with server version and show toast
- [ ] Typecheck passes

---

### US-M14: Set up CI pipeline for mobile builds

**Description:** As a developer, I want a GitHub Actions workflow that runs typecheck, lint, and native builds on every PR touching the mobile package.

**Acceptance Criteria:**

- [ ] Create `.github/workflows/mobile-ci.yml`
- [ ] Trigger on push/PR for paths `packages/flexdesk-mobile/**`
- [ ] Job 1: Lint and Typecheck (Node 18, `pnpm --filter @flexdesk/mobile typecheck && lint`)
- [ ] Job 2: Android debug build (`./gradlew assembleDebug`)
- [ ] Job 3: iOS simulator build (`xcodebuild -sdk iphonesimulator`)
- [ ] Cache `node_modules`, `.gradle`, and `Pods`
- [ ] Typecheck passes

## Non-Goals

- No dark mode (v2)
- No iPad or tablet layout optimization
- No in-app estimate creation or editing
- No WebSocket real-time updates (use polling + push notifications)
- No route optimization or map view for multiple job stops
- No profile or settings screen beyond logout
- No in-app VoIP calling via Twilio SDK

## Technical Considerations

- All source files live in `packages/flexdesk-mobile/`
- The Axios API client (`src/api/client.ts`) is already configured with JWT refresh, HTTPS enforcement, and Keychain-backed token storage
- WatermelonDB sync (`src/db/sync.ts`) already implements pull and push with exponential backoff, conflict marking, and FIFO queue processing
- The geofence utility (`src/utils/geofence.ts`) implements haversine distance with a 500m radius check
- Deep linking for OAuth is already functional (`src/auth/deepLinking.ts`); additional routes need to be added to the React Navigation linking config
- Backend API: `https://your-app.up.railway.app/api/v1`
- Auth: JWT Bearer, 15-minute access token, 7-day refresh token, workspace-scoped, 100 req/60s rate limit
- Backend changes needed for deployment: DeviceToken model + push notification endpoints, file upload endpoint validation
- The `react-native-image-picker` and `react-native-geolocation-service` packages are declared in `package.json` but native linking must be verified on both platforms
- The existing `PRD.md` covered the full build-out plan; this deployment-readiness PRD covers the remaining gaps to reach a shippable state
