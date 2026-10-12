# PRD: flexdesk-ui -- Deployment Readiness

## Introduction

The `flexdesk-ui` package is a React 18 component library for the FlexDesk monorepo, built with tsup and styled with Tailwind CSS. It provides domain-specific components (FlexDeskCalendar, JobCard, InvoiceCard, TechnicianCard, GeofenceIndicator), input components (AddressPicker, TimePicker, LineItemInput, InvoiceForm, JobCompletionForm), layout components (PageHeader, Sidebar), and utility hooks. It is consumed by `flexdesk-preview-v2`, `flexdesk-admin`, and `flexdesk-portal`. The package has a vitest test setup and some existing tests, but has significant gaps: five of six package.json export paths point to files that do not exist (`./index.ts`, `./primitives/index.ts`, `./patterns/index.ts`, `./domain/index.ts`, `./layouts/index.ts`), several components have no tests, and multiple input/layout component barrel files are empty stubs.

## Goals

- Fix broken package.json exports map so consumers can import from all declared entry points
- Ensure all component barrel files re-export their components (several are empty stubs with only a comment)
- Add at least one test per exported component (currently 7 test files for ~20+ components)
- Verify FlexDeskCalendar works with all four view modes (day, week, month-grid, month-agenda)
- Add type exports for all component props
- Add accessibility attributes to interactive components
- Ensure Tailwind CSS configuration is portable for consumers

## User Stories

### US-001: Create root index.ts entry point

**Description:** As a consumer of `flexdesk-ui`, I need `import { ... } from "flexdesk-ui"` to work, because the package.json `"."` export points to `./src/index.ts` which does not exist.

**Acceptance Criteria:**
- [ ] Create `src/index.ts` that re-exports from all sub-modules: calendar, data-display, inputs, layout, hooks, utils
- [ ] All existing components are accessible via the root import
- [ ] Type exports for all component props are included
- [ ] No circular dependency warnings
- [ ] Typecheck passes

### US-002: Create missing barrel files for export map paths

**Description:** As a consumer, I need the `"./primitives"`, `"./patterns"`, `"./domain"`, and `"./layouts"` export paths to resolve, because the package.json exports map references `./src/primitives/index.ts`, `./src/patterns/index.ts`, `./src/domain/index.ts`, and `./src/layouts/index.ts` -- none of which exist.

**Acceptance Criteria:**
- [ ] Decide how existing components map to the three-tier architecture: primitives (low-level: badges, indicators), patterns (composite: cards, forms, calendar), domain (business-specific: job-card, invoice-card, technician-card, geofence)
- [ ] Create `src/primitives/index.ts` re-exporting JobStatusBadge, PaymentStatusBadge, and GeofenceIndicator
- [ ] Create `src/patterns/index.ts` re-exporting PageHeader, Sidebar, PriceBreakdownTable, AddressPicker, TimePicker, LineItemInput
- [ ] Create `src/domain/index.ts` re-exporting JobCard, InvoiceCard, TechnicianCard, InvoiceForm, JobCompletionForm, FlexDeskCalendar, maps, route optimizer, technician schedule
- [ ] Create `src/layouts/index.ts` re-exporting PageHeader and Sidebar (currently `./src/layouts/index.ts` is missing but referenced in exports map)
- [ ] All export paths in package.json resolve without errors
- [ ] Typecheck passes

### US-003: Populate empty stub barrel files

**Description:** As a developer, I need the empty stub files (`price-breakdown-table/index.ts`, `address-picker/index.ts`, `line-item-input/index.ts`, `time-picker/index.ts`, `page-header/index.ts`) to actually export components, because they currently contain only a comment and no exports.

**Acceptance Criteria:**
- [ ] `src/data-display/price-breakdown-table/index.ts` -- either create the PriceBreakdownTable component or remove from exports if not yet implemented
- [ ] `src/inputs/address-picker/index.ts` -- either create the AddressPicker component or remove from exports
- [ ] `src/inputs/line-item-input/index.ts` -- either create the LineItemInput component or remove from exports
- [ ] `src/inputs/time-picker/index.ts` -- either create the TimePicker component or remove from exports
- [ ] `src/layout/page-header/index.ts` -- either create the PageHeader component or remove from exports
- [ ] Each implemented component exports its props type
- [ ] Each stub that remains unimplemented is marked with a `TODO` and throws at runtime: `throw new Error("Not yet implemented")`
- [ ] Typecheck passes

### US-004: Add tests for data-display components without coverage

**Description:** As a developer, I need tests for components that currently have none, so we can safely refactor and catch regressions.

**Acceptance Criteria:**
- [ ] Add test for `JobCard` -- renders job title, status badge, click handler fires
- [ ] Add test for `GeofenceIndicator` -- renders "within radius" and "outside radius" states
- [ ] Add test for `RouteOptimizer` -- renders without crashing with mock data
- [ ] Add test for `TechnicianSchedule` -- renders schedule entries
- [ ] Add test for `TechnicianLocation` -- renders location data
- [ ] All new tests pass with `vitest run`
- [ ] Typecheck passes

### US-005: Add tests for input components

**Description:** As a developer, I need tests for the input components so I can verify form behavior.

**Acceptance Criteria:**
- [ ] Add test for `InvoiceForm` -- renders form fields, validates required fields
- [ ] Add test for `JobCompletionForm` -- renders completion fields, submits with valid data
- [ ] Add test for `AddressPicker` (once implemented) -- renders input, shows suggestions
- [ ] Add test for `TimePicker` (once implemented) -- renders input, selects time value
- [ ] Add test for `LineItemInput` (once implemented) -- renders line item fields, add/remove rows
- [ ] All new tests pass with `vitest run`
- [ ] Typecheck passes

### US-006: Add tests for layout and calendar components

**Description:** As a developer, I need tests for the Sidebar, PageHeader, and FlexDeskCalendar components.

**Acceptance Criteria:**
- [ ] Add test for `Sidebar` -- renders menu items, toggle open/close state
- [ ] Add test for `PageHeader` (once implemented) -- renders title and actions
- [ ] Add test for `FlexDeskCalendar` -- renders without crashing when given mock Job data
- [ ] Add test for `job-event-card` -- TimeGridJobEventCard and DateGridJobEventCard render event info
- [ ] Add test for `calendar-context` -- CalendarProvider passes context values to children
- [ ] All new tests pass with `vitest run`
- [ ] Typecheck passes

### US-007: Verify FlexDeskCalendar view modes

**Description:** As a user of the scheduling interface, I need the calendar to work in day, week, month-grid, and month-agenda views.

**Acceptance Criteria:**
- [ ] FlexDeskCalendar renders with `views={['day']}` and `defaultView="day"`
- [ ] FlexDeskCalendar renders with `views={['week']}` and `defaultView="week"`
- [ ] FlexDeskCalendar renders with `views={['month-grid']}` and `defaultView="month-grid"`
- [ ] FlexDeskCalendar renders with `views={['month-agenda']}` and `defaultView="month-agenda"`
- [ ] FlexDeskCalendar renders with all four views and allows switching between them
- [ ] Events display correctly in each view mode
- [ ] Drag-and-drop works in week and day views (when `readOnly={false}`)
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-008: Export types for all component props

**Description:** As a consumer of `flexdesk-ui`, I need TypeScript types for all component props so I can use the components with full type safety.

**Acceptance Criteria:**
- [ ] `FlexDeskCalendarProps` and `CalendarViewName` are exported from `./calendar`
- [ ] `JobCardProps` type is exported (currently the interface is internal to `JobCard.tsx`)
- [ ] `InvoiceCardProps` type is exported
- [ ] `TechnicianCardProps` type is exported
- [ ] `JobStatusBadgeProps` type is exported
- [ ] `PaymentStatusBadgeProps` type is exported
- [ ] `GeofenceIndicatorProps` type is exported
- [ ] `SidebarProps` type is exported
- [ ] `InvoiceFormProps` type is exported
- [ ] `JobCompletionFormProps` type is exported
- [ ] All prop types are available from the root `flexdesk-ui` import
- [ ] Typecheck passes

### US-009: Add aria labels to interactive components

**Description:** As a user with assistive technology, I need interactive elements to have proper ARIA attributes so I can navigate the interface.

**Acceptance Criteria:**
- [ ] `JobCard` -- add `role="button"` and `aria-label` with job title to clickable card
- [ ] `JobStatusBadge` -- add `aria-label` describing the status (e.g., "Job status: In Progress")
- [ ] `PaymentStatusBadge` -- add `aria-label` describing payment status
- [ ] `GeofenceIndicator` -- add `aria-live="polite"` so distance updates are announced
- [ ] `Sidebar` menu items -- add `aria-current="page"` to active item
- [ ] `FlexDeskCalendar` -- ensure calendar container has `role="application"` and `aria-label="Job schedule calendar"`
- [ ] `TechnicianCard` -- add `aria-label` with technician name
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-010: Ensure Tailwind CSS config is portable for consumers

**Description:** As a developer consuming `flexdesk-ui` in `flexdesk-preview-v2` or `flexdesk-admin`, I need the Tailwind styles to work correctly when I import components.

**Acceptance Criteria:**
- [ ] Verify `tsup` config (or lack thereof -- project.json says "source-only library, no build needed") does not strip CSS classes
- [ ] Document in package README or a comment in `package.json` that consumers must include `flexdesk-ui/src` in their Tailwind `content` paths
- [ ] Verify that FlexDeskCalendar's `@schedule-x/theme-default/dist/index.css` import is included when consuming the calendar
- [ ] Test that a consumer project (e.g., `flexdesk-preview-v2`) renders `flexdesk-ui` components with correct styles
- [ ] No unstyled component flashes in the consumer app
- [ ] Typecheck passes
- [ ] Verify changes work in browser

## Non-Goals

- Building a Storybook instance (desirable but not required for deployment readiness)
- Adding animation or transition systems beyond what Schedule-X provides
- Creating new components not already stubbed or partially implemented
- Supporting React 19 (peer dependency currently specifies `^18.0.0 || ^19.0.0` but active development targets React 18)
- Server-side rendering support (this is a client-side component library)
- Publishing to npm (this is a private workspace package)
- Adding end-to-end visual regression tests

## Technical Considerations

- **Source-Only Library:** The `project.json` build target echoes "source-only library, no build needed." This means consumers import TypeScript source directly. The `tsup` build script in `package.json` is available but not used in production. This affects how Tailwind content scanning works -- consumers must include `flexdesk-ui/src/**/*.tsx` in their Tailwind content config.
- **Missing Root Index:** The most critical issue is that `src/index.ts` does not exist, but the package.json `"."` export points to it. Any consumer doing `import { X } from "flexdesk-ui"` will get a module-not-found error. Only `./calendar` resolves correctly today.
- **Empty Barrel Files:** Five barrel files (`price-breakdown-table`, `address-picker`, `line-item-input`, `time-picker`, `page-header`) are stubs with only a comment. Consumers importing from these will get empty modules. Decide whether to implement them or remove them from the export map.
- **Broken Export Map Paths:** The package.json exports map declares `./primitives`, `./patterns`, `./domain`, and `./layouts` but the corresponding directories and index files do not exist. The actual directory structure is `calendar/`, `data-display/`, `inputs/`, `layout/`, `hooks/`, `utils/` -- these do not align with the declared three-tier architecture.
- **Test Setup:** Vitest is configured with jsdom environment and `@testing-library/jest-dom`. Existing tests (7 files) cover calendar adapter, invoice-card, job-status-badge, payment-status-badge, technician-card, technician type, and geofence validator. Components without tests: JobCard, GeofenceIndicator, RouteOptimizer, TechnicianSchedule, TechnicianLocation, TechnicianLocationMap, JobMap, TechnicianJobMap, Sidebar, InvoiceForm, JobCompletionForm, FlexDeskCalendar, job-event-card, calendar-context.
- **Schedule-X Dependency:** The FlexDeskCalendar wraps Schedule-X v4 with drag-and-drop (v3 compat adapter) and resize plugins. Testing the calendar with jsdom may require mocking Schedule-X internals since it manipulates the DOM directly. Integration-level tests should focus on the adapter functions (`jobToCalendarEvent`, `calendarEventToJobUpdate`) which are pure functions and already have tests.
- **@service-flex/types Dependency:** Several components import from `@service-flex/types` (workspace package). Tests must ensure this package is available or mock the types accordingly.
