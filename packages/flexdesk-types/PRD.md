# PRD: @service-flex/types -- Deployment Readiness

## Introduction

`@service-flex/types` is a shared, pure-TypeScript type-definition package in the FlexDesk monorepo (pnpm + Nx). It provides entity interfaces, enum constants, color maps, and UI helper objects consumed by every other package in the workspace: `flexdesk-core`, `flexdesk-ui`, `flexdesk-preview-v2`, `flexdesk-admin`, `flexdesk-portal`, and `flexdesk-mobile`. Because every frontend and library depends on these types at compile time, this package must be complete, correct, and stable before any downstream package can ship.

Build: `tsup` (CJS + ESM + DTS). Typecheck: `tsc --noEmit`. No runtime dependencies.

---

## Goals

- Every Prisma schema model has a matching frontend type exported from this package.
- Enum values in TypeScript match the Prisma schema exactly -- no drift.
- Create/Update DTO input types exist for every entity that supports mutation.
- All exported types and interfaces have JSDoc comments.
- Barrel exports are clean -- consumers can import from `@service-flex/types`, `@service-flex/types/entities`, or `@service-flex/types/auth`.
- The `package.json` exports map and the `tsup.config.ts` entry points stay in sync.
- Zero runtime code beyond const-object enums and pure helper functions already present.

---

## Non-Goals

- No runtime validation (that belongs in `flexdesk-server` or `zod` schemas).
- No React component types (those belong in `flexdesk-ui`).
- No API route definitions or OpenAPI specs.
- No changes to the Prisma schema itself.

---

## User Stories

### US-001: Add Property entity type

**Description:** As a frontend developer, I need a `Property` interface so I can render customer service locations and link them to jobs.

**Acceptance Criteria:**
- [ ] Create `src/entities/property.ts`
- [ ] Define `Property` interface with all fields from the Prisma `Property` model: `id`, `workspaceId`, `customerId`, `name`, `isPrimary`, `street`, `street2`, `city`, `state`, `zip`, `country`, `lat`, `lng`, `accessNotes`, `serviceNotes`, `syncStatus`, `lastSyncedAt`, `syncVersion`, `createdAt`, `updatedAt`
- [ ] Define `PropertyCreateInput` and `PropertyUpdateInput` types
- [ ] Add JSDoc comments to the interface and all non-obvious fields
- [ ] Export from `src/entities/index.ts` barrel
- [ ] Typecheck passes

---

### US-002: Add Part and JobPart entity types

**Description:** As a frontend developer, I need `Part` and `JobPart` interfaces so I can build the parts inventory UI and track parts used on jobs.

**Acceptance Criteria:**
- [ ] Create `src/entities/part.ts`
- [ ] Define `Part` interface with all Prisma fields: `id`, `workspaceId`, `sku`, `name`, `description`, `category`, `unitCost`, `unitPrice`, `quantityOnHand`, `reorderPoint`, `reorderQuantity`, `isActive`, `syncStatus`, `lastSyncedAt`, `syncVersion`, `createdAt`, `updatedAt`
- [ ] Define `PartCreateInput` and `PartUpdateInput` types
- [ ] Define `JobPart` interface with all Prisma fields: `id`, `jobId`, `partId`, `quantity`, `unitPrice`, `total`, `notes`, `syncStatus`, `lastSyncedAt`, `syncVersion`, `createdAt`, `updatedAt`
- [ ] Define `JobPartCreateInput` and `JobPartUpdateInput` types
- [ ] Add JSDoc comments to both interfaces
- [ ] Export from `src/entities/index.ts` barrel
- [ ] Typecheck passes

---

### US-003: Add JobNote and JobAttachment entity types

**Description:** As a frontend developer, I need `JobNote` and `JobAttachment` interfaces so I can render the notes/attachments panel on the job detail page.

**Acceptance Criteria:**
- [ ] Create `src/entities/job-note.ts`
- [ ] Define `JobNote` interface with Prisma fields: `id`, `jobId`, `userId`, `content`, `isInternal`, `createdAt`
- [ ] Define `JobNoteCreateInput` type
- [ ] Create `src/entities/job-attachment.ts`
- [ ] Define `JobAttachment` interface with Prisma fields: `id`, `jobId`, `fileName`, `fileUrl`, `fileSize`, `mimeType`, `createdAt`
- [ ] Define `JobAttachmentCreateInput` type
- [ ] Add JSDoc comments to both interfaces
- [ ] Export both from `src/entities/index.ts` barrel
- [ ] Typecheck passes

---

### US-004: Add RecurringJobTemplate entity type

**Description:** As a frontend developer, I need a `RecurringJobTemplate` interface so I can build the recurring-jobs management UI.

**Acceptance Criteria:**
- [ ] Create `src/entities/recurring-job-template.ts`
- [ ] Define `RecurringJobTemplate` interface with all Prisma fields: `id`, `workspaceId`, `customerId`, `technicianId`, `propertyId`, `title`, `description`, `priority` (JobPriority), `frequency`, `interval`, `dayOfWeek`, `dayOfMonth`, `startDate`, `endDate`, `nextRunDate`, `estimatedDuration`, `location`, `isActive`, `syncStatus`, `lastSyncedAt`, `syncVersion`, `createdAt`, `updatedAt`
- [ ] Define `RecurringJobFrequency` const object with values `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `CUSTOM`
- [ ] Define `RecurringJobTemplateCreateInput` and `RecurringJobTemplateUpdateInput` types
- [ ] Add JSDoc comments
- [ ] Export from `src/entities/index.ts` barrel
- [ ] Typecheck passes

---

### US-005: Add NotificationPreference entity type

**Description:** As a frontend developer, I need a `NotificationPreference` interface so I can build the customer notification settings UI.

**Acceptance Criteria:**
- [ ] Create `src/entities/notification-preference.ts`
- [ ] Define `NotificationPreference` interface with all Prisma fields: `id`, `customerId`, `emailEnabled`, `smsEnabled`, `pushEnabled`, `jobDispatched`, `jobReminder`, `jobCompleted`, `invoiceSent`, `paymentReceived`, `estimateSent`, `estimateFollowUp`, `marketingMessages`, `reminderHoursBefore`, `quietHoursStart`, `quietHoursEnd`, `createdAt`, `updatedAt`
- [ ] Define `NotificationPreferenceUpdateInput` type (create is implicit via customer)
- [ ] Add JSDoc comments
- [ ] Export from `src/entities/index.ts` barrel
- [ ] Typecheck passes

---

### US-006: Add Role and Permission entity types

**Description:** As a frontend developer, I need `Role`, `Permission`, and `RolePermission` interfaces so I can build the RBAC settings page in the admin panel.

**Acceptance Criteria:**
- [ ] Create `src/entities/role.ts`
- [ ] Define `Role` interface with Prisma fields: `id`, `workspaceId`, `name`, `description`, `isSystem`, `isDefault`, `createdAt`, `updatedAt`
- [ ] Define `RoleCreateInput` and `RoleUpdateInput` types
- [ ] Define `Permission` interface with Prisma fields: `id`, `resource`, `action`, `description`, `createdAt`
- [ ] Define `RolePermission` interface with Prisma fields: `id`, `roleId`, `permissionId`, `scope`, `conditions`, `createdAt`
- [ ] Define `RolePermissionCreateInput` type
- [ ] Add JSDoc comments
- [ ] Export from `src/entities/index.ts` barrel
- [ ] Typecheck passes

---

### US-007: Add WorkspaceMember and User entity types to auth module

**Description:** As a frontend developer, I need `WorkspaceMember` and `User` interfaces so I can render team management views and user profiles.

**Acceptance Criteria:**
- [ ] Create `src/auth/workspace-member.ts`
- [ ] Define `User` interface with Prisma fields: `id`, `email`, `firstName`, `lastName`, `avatarUrl`, `authProvider`, `lastLoginAt`, `createdAt`, `updatedAt` (exclude `passwordHash`, `refreshToken`)
- [ ] Define `WorkspaceMember` interface with Prisma fields: `id`, `workspaceId`, `userId`, `role`, `roleId`, `createdAt`
- [ ] Define `WorkspaceMemberCreateInput` type
- [ ] Add `subscriptionTier`, `subscriptionStatus`, `subscriptionInterval`, `subscriptionCurrentPeriodEnd`, `stripeCustomerId` fields to the existing `Workspace` interface in `src/auth/user.ts`
- [ ] Add JSDoc comments
- [ ] Export from `src/auth/index.ts` barrel
- [ ] Typecheck passes

---

### US-008: Audit and align existing enum values against Prisma schema

**Description:** As a developer, I need confidence that every const-object enum in this package matches its Prisma counterpart exactly, preventing runtime mismatches.

**Acceptance Criteria:**
- [ ] Verify `JobStatus` values match Prisma enum `JobStatus` -- currently correct (SCHEDULED, DISPATCHED, IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD)
- [ ] Verify `JobPriority` values match Prisma enum `JobPriority` -- currently correct (LOW, MEDIUM, HIGH, URGENT)
- [ ] Verify `SyncStatus` values match Prisma enum `SyncStatus` -- currently correct (PENDING, SYNCING, SYNCED, CONFLICT, FAILED)
- [ ] Verify `InvoiceStatus` values match Prisma enum `InvoiceStatus` -- currently correct (DRAFT, SENT, PAID, OVERDUE, CANCELLED)
- [ ] Verify `EstimateStatus` values match Prisma enum `EstimateStatus` -- currently correct (DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED, CONVERTED)
- [ ] Add a comment block at the top of each enum file referencing the Prisma schema as source of truth
- [ ] Typecheck passes

---

### US-009: Align Job interface with current Prisma schema fields

**Description:** As a frontend developer, I need the `Job` interface to include fields that exist in Prisma but are currently missing from the type: `propertyId`, `scheduledAt` (legacy), `startedAt`, `completedAt`, `estimatedDuration`, `recurringTemplateId`, `syncVersion`, `location`.

**Acceptance Criteria:**
- [ ] Add `propertyId?: string | null` to `Job` interface
- [ ] Add `scheduledAt?: Date | string | null` (legacy field)
- [ ] Rename `actualStartTime` to `startedAt` and `actualEndTime` to `completedAt` to match Prisma, keeping old names as deprecated aliases
- [ ] Add `estimatedDuration?: number | null`
- [ ] Add `recurringTemplateId?: string | null`
- [ ] Add `syncVersion: number` (rename from `localVersion`/`serverVersion`)
- [ ] Add `location?: { address?: string; lat?: number; lng?: number } | null`
- [ ] Update `JobCreateInput` to include new optional fields
- [ ] Add JSDoc comments to all new and existing fields
- [ ] Typecheck passes

---

### US-010: Align Customer interface with current Prisma schema

**Description:** As a frontend developer, I need the `Customer` interface to match the Prisma schema, which uses a JSON `address` field and includes sync metadata.

**Acceptance Criteria:**
- [ ] Replace flat address fields (`address`, `city`, `state`, `zipCode`, `latitude`, `longitude`) with `address?: { street?: string; city?: string; state?: string; zip?: string; lat?: number; lng?: number } | null` to match Prisma JSON field
- [ ] Keep flat fields as a deprecated `CustomerFlat` alias for migration
- [ ] Add `syncStatus`, `lastSyncedAt`, `syncVersion` fields
- [ ] Remove `status` field (not in Prisma schema) or document it as frontend-only
- [ ] Add JSDoc comments
- [ ] Typecheck passes

---

### US-011: Align Technician interface with current Prisma schema

**Description:** As a frontend developer, I need the `Technician` interface to include Prisma fields currently missing: `licenseNumber`, `specialties`, `currentLocation`, `isAvailable`, Stripe Connect fields, and sync metadata.

**Acceptance Criteria:**
- [ ] Add `licenseNumber?: string | null`
- [ ] Add `specialties: string[]`
- [ ] Add `currentLocation?: { lat: number; lng: number; updatedAt: string } | null`
- [ ] Add `isAvailable: boolean`
- [ ] Add `stripeAccountId?: string | null`, `stripeChargesEnabled: boolean`, `stripeOnboardingComplete: boolean`
- [ ] Add `syncStatus`, `lastSyncedAt`, `syncVersion` fields
- [ ] Update `TechnicianCreateInput` accordingly
- [ ] Add JSDoc comments
- [ ] Typecheck passes

---

### US-012: Align Estimate interface with current Prisma schema

**Description:** As a frontend developer, I need the `Estimate` interface to include Prisma fields currently missing: `title`, `description`, `discount`, `sentAt`, `viewedAt`, `respondedAt`, `estimatedDuration`, `location`, `priority`, `convertedJobId`, `customerNotes`, `terms`, sync metadata.

**Acceptance Criteria:**
- [ ] Add `title: string` and `description?: string | null`
- [ ] Add `discount?: number | null`
- [ ] Add `sentAt`, `viewedAt`, `respondedAt` date fields
- [ ] Add `estimatedDuration?: number | null`
- [ ] Add `location?: { address?: string; lat?: number; lng?: number } | null`
- [ ] Add `priority: JobPriority`
- [ ] Add `convertedJobId?: string | null`
- [ ] Add `customerNotes?: string | null` and `terms?: string | null`
- [ ] Add `syncStatus`, `lastSyncedAt`, `syncVersion` fields
- [ ] Add `serviceType?: string | null` to `EstimateLineItem`
- [ ] Update `EstimateCreateInput` accordingly
- [ ] Add JSDoc comments
- [ ] Typecheck passes

---

### US-013: Align Invoice interface with current Prisma schema

**Description:** As a frontend developer, I need the `Invoice` interface to match Prisma, which uses `amount`/`tax`/`total` (Decimal) instead of `subtotal`/`taxRate`/`taxAmount`, and includes `stripePaymentId` and sync metadata.

**Acceptance Criteria:**
- [ ] Replace `subtotal` with `amount: number` to match Prisma
- [ ] Replace `taxRate`/`taxAmount` with `tax: number`
- [ ] Add `stripePaymentId?: string | null`
- [ ] Add `syncStatus`, `lastSyncedAt`, `syncVersion` fields
- [ ] Remove `InvoiceLineItem.total` computation assumption note in JSDoc
- [ ] Update `InvoiceCreateInput` accordingly
- [ ] Add JSDoc comments
- [ ] Typecheck passes

---

### US-014: Add JSDoc comments to all existing exported types

**Description:** As a developer consuming this package, I want JSDoc documentation on every exported interface, type, const, and function so my IDE provides useful hover information.

**Acceptance Criteria:**
- [ ] Add JSDoc to `ObjectRecord` interface and its fields
- [ ] Add JSDoc to `PaginatedResponse` and `ApiResponse` interfaces
- [ ] Add JSDoc to all status/priority const objects explaining their purpose
- [ ] Add JSDoc to all color maps and choice arrays
- [ ] Add JSDoc to `normalizeJobStatus` function
- [ ] Add JSDoc to `legacyStatusMap`
- [ ] Add JSDoc to all `*CreateInput` and `*UpdateInput` types
- [ ] Typecheck passes

---

### US-015: Validate package.json exports map and tsup entry points

**Description:** As a consumer of this package, I need all subpath imports (`@service-flex/types/entities`, `@service-flex/types/auth`) to resolve correctly after build.

**Acceptance Criteria:**
- [ ] Verify `tsup.config.ts` entry points match `package.json` exports map keys
- [ ] Current state is correct (root, `/entities`, `/auth`) -- confirm after all new files are added that no new subpath is needed
- [ ] Run `pnpm --filter @service-flex/types build` and verify `dist/` output contains `index.js`, `index.mjs`, `index.d.ts`, `entities/index.*`, `auth/index.*`
- [ ] Verify no circular imports exist between entity files
- [ ] Typecheck passes

---

## Technical Considerations

**Key file paths:**
- Package root: `packages/flexdesk-types/`
- Source: `packages/flexdesk-types/src/`
- Entity types: `packages/flexdesk-types/src/entities/`
- Auth types: `packages/flexdesk-types/src/auth/`
- Prisma schema (source of truth): `packages/flexdesk-server/prisma/schema.prisma`
- Build config: `packages/flexdesk-types/tsup.config.ts`

**Build commands:**
- Build: `pnpm --filter @service-flex/types build`
- Typecheck: `pnpm --filter @service-flex/types typecheck`
- Lint: `pnpm --filter @service-flex/types lint`

**Current state summary (what exists vs what is missing):**
- Existing entity types: `Job`, `Customer`, `Technician`, `Invoice`, `Estimate`, `ServiceRequest`, `ServiceProvider`
- Missing entity types: `Property`, `Part`, `JobPart`, `JobNote`, `JobAttachment`, `RecurringJobTemplate`, `NotificationPreference`, `Role`, `Permission`, `RolePermission`, `User`, `WorkspaceMember`
- Existing auth types: `JwtPayload`, `AuthenticatedUser`, `LoginCredentials`, `LoginResponse`, `RefreshTokenResponse`, `Workspace`, `UserRole`, `UserPermissions`
- Existing enums: `JobStatus`, `JobPriority`, `SyncStatus`, `InvoiceStatus`, `EstimateStatus`, `ClientStatus`, `RequestStatus`, `ServiceProviderStatus`, `TeamMemberRole`, `UserRole`
- Existing interfaces have field drift from the Prisma schema (documented in US-009 through US-013)
- No test files exist
- `ServiceRequest` and `ServiceProvider` do not have corresponding Prisma models (they may be legacy or planned) -- leave as-is
