# FlexDesk Mobile -- Screen Specifications

> React Native iPhone CRM for small home service businesses.
> Target: busy tradespeople (plumbers, electricians, cleaners, landscapers) using one-handed between jobs.

---

## Global Navigation

**Bottom Tab Bar** -- fixed at screen bottom, 4 tabs.

| Tab | Label | Icon |
|-----|-------|------|
| 1 | Home | house outline |
| 2 | Clients | person outline |
| 3 | Calendar | calendar outline |
| 4 | Invoices | document-text outline |

- Active tab: olive green fill with label visible.
- Inactive tabs: warm gray, icon only (no label) to save space.
- Tab bar background: white, 1px top border in `#E8E4DF`.
- Height: 80pt (includes safe area inset on notched iPhones).
- All tap targets minimum 44x44pt.

**Floating Action Button (FAB)**

- Position: centered horizontally, 16pt above the tab bar.
- Size: 56pt circle.
- Color: dark olive green `#3D5A3E` with white `+` icon (24pt).
- Shadow: 0 4 12 rgba(0,0,0,0.15).
- Tap opens a contextual quick-create depending on the active tab:
  - Home tab --> bottom sheet with options: "New Client", "New Job", "New Invoice".
  - Clients tab --> navigate to new-client form.
  - Calendar tab --> navigate to new-job form.
  - Invoices tab --> navigate to new-invoice form.

---

## Screen 1: Dashboard (Home)

The landing screen. Gives a 5-second glance at business health.

### Layout (top to bottom)

#### 1.1 Status Bar + Header
- Status bar: default iOS style (dark text on light background).
- Header row: workspace name left-aligned (16pt semibold, `#2C2C2C`), user avatar circle (32pt) right-aligned. Tap avatar opens a settings sheet (out of scope for v1).
- Height: 56pt.

#### 1.2 Onboarding / Tip Card (dismissable)
- Shown conditionally when the workspace has <3 clients OR <1 job.
- Full-width rounded card (border-radius 16pt), soft peach background `#FFF3EB`.
- Left: 40pt icon (e.g., waving hand, toolbox).
- Right: text "Add your first client to get started" (14pt medium, `#4A4A4A`), single line.
- Top-right corner: `X` close button (24pt tap target 44x44pt). Dismissing sets a local flag so the card does not return.
- Bottom of card: single CTA link text "Add Client >" in olive green, taps to Clients tab with new-client form open.

#### 1.3 Business Health Ring
- Centered horizontally, 160pt diameter.
- Circular progress ring, 10pt stroke:
  - Filled arc: olive green `#6B8F5E`.
  - Empty arc: `#E8E4DF`.
- Center content:
  - Large bold number: completed jobs count this week (32pt bold, `#2C2C2C`).
  - Divider line below: thin 40pt line, `#D5D0CA`.
  - Below divider: target number (18pt regular, `#8A8580`), e.g., "of 10".
- Below the ring: label "Jobs this week" (13pt regular, `#8A8580`), centered.

**Data source:**
- Numerator: count of jobs with `status = COMPLETED` and `completedAt` within current Mon-Sun week.
- Denominator: workspace weekly target (hardcoded to 10 for v1; configurable later).

#### 1.4 Metric Cards -- 2x2 Grid
- 16pt horizontal padding, 12pt gap between cards.
- Each card: rounded rectangle (border-radius 14pt), white `#FFFFFF`, shadow 0 2 8 rgba(0,0,0,0.06).
- Card inner padding: 14pt.
- Card layout (vertical):
  - Top-left: icon in a 28pt circle with tinted background.
  - Below icon: metric value (22pt bold, `#2C2C2C`).
  - Below value: label (12pt regular, `#8A8580`).

| Card | Icon | Icon BG | Value | Label |
|------|------|---------|-------|-------|
| Active Clients | person.2 | `#EDE7F6` | count | "Active Clients" |
| Pending Jobs | clock | `#FFF8E1` | count | "Pending Jobs" |
| Unpaid Invoices | doc.text | `#FFEBEE` | count + total | "Unpaid" |
| Weekly Revenue | dollarsign.circle | `#E8F5E9` | $ total | "This Week" |

**Data sources:**
- Active Clients: count of `Customer` records in the workspace.
- Pending Jobs: count of jobs with `status IN (SCHEDULED, DISPATCHED)`.
- Unpaid Invoices: count and sum of `Invoice` where `status IN (SENT, OVERDUE)`. Display as "3 / $1,240".
- Weekly Revenue: sum of `Invoice.total` where `status = PAID` and `paidAt` within current Mon-Sun.

#### 1.5 Empty State (entire dashboard)
- If workspace has zero clients and zero jobs:
  - Hide the health ring and metric grid.
  - Show a centered illustration placeholder (gray circle, 120pt) with text below: "Welcome to FlexDesk" (18pt semibold) and "Tap + to add your first client or job" (14pt regular, `#8A8580`).

### Interactions
- Pull-to-refresh reloads all metric data.
- Tapping a metric card navigates to its respective tab (Active Clients -> Clients tab, Pending Jobs -> Calendar tab, Unpaid -> Invoices tab filtered to unpaid, Weekly Revenue -> Invoices tab).
- Screen is scroll-locked (no scroll) unless content overflows on iPhone SE.

---

## Screen 2: Client List

### Layout (top to bottom)

#### 2.1 Header
- Title "Clients" left-aligned (24pt bold, `#2C2C2C`).
- Right side: client count badge (e.g., "47") in a small rounded pill (`#F0EDE8` background, 12pt medium).
- Height: 56pt.

#### 2.2 Search Bar
- Full-width minus 16pt horizontal padding.
- Rounded rectangle (border-radius 12pt), background `#F5F2EE`.
- Magnifying glass icon left, placeholder text "Search clients..." in `#B5AFA8`.
- On focus: border 1px `#6B8F5E`, keyboard appears.
- Search filters on `Customer.name`, `Customer.email`, `Customer.phone` -- client-side for v1.
- Clear button (X circle) appears when text is entered.

#### 2.3 Client List (ScrollView)
- Vertical list of client cards separated by 10pt gap.
- Each card:
  - White rounded card (border-radius 14pt), shadow 0 2 6 rgba(0,0,0,0.05).
  - Horizontal padding 14pt, vertical padding 12pt.
  - **Row 1:** Client avatar circle (36pt, initials on `#6B8F5E` background, white text 14pt bold) + client name (16pt semibold, `#2C2C2C`).
  - **Row 2:** Two info chips side by side:
    - "Last job: Jan 15" (12pt regular, `#8A8580`) -- from most recent `Job.completedAt` for this customer.
    - "$2,340 total" (12pt regular, `#8A8580`) -- sum of all `Invoice.total` where `status = PAID` for this customer.
  - Right side of card: chevron-right icon (`#C5C0B8`).

#### 2.4 Expanded Client Detail (inline)
- Tapping a card expands it in-place (animated, 200ms ease-out).
- Expanded content appears below row 2:
  - **Phone row:** phone icon + phone number (tappable, opens iOS dialer via `tel:` link). If null, show "--".
  - **Email row:** envelope icon + email address (tappable, opens `mailto:`). If null, show "--".
  - **Jobs summary:** "12 jobs completed" (from count of `Job` where `status = COMPLETED` for this customer).
  - **Quick actions row:** two small rounded buttons side by side:
    - "New Job" (olive green outline) -- navigates to new-job form with this customer pre-selected.
    - "New Invoice" (olive green outline) -- navigates to new-invoice form with this customer pre-selected.
- Tapping the card again or tapping another card collapses it.

#### 2.5 Empty State
- Centered illustration placeholder (gray circle, 100pt).
- Text: "No clients yet" (18pt semibold, `#2C2C2C`).
- Subtext: "Add your first client to start tracking jobs and revenue" (14pt regular, `#8A8580`).
- CTA button: "Add Client" (olive green filled rounded button, white text).

#### 2.6 Search Empty State
- When search has no results:
  - Text: "No clients match \"{query}\"" (16pt regular, `#8A8580`), centered.

### Interactions
- Pull-to-refresh reloads client list.
- List is sorted alphabetically by `Customer.name` (A-Z).
- Keyboard dismiss: tapping outside the search bar or scrolling dismisses the keyboard.

---

## Screen 3: Job Calendar

### Layout (top to bottom)

#### 3.1 Header
- Title "Calendar" left-aligned (24pt bold, `#2C2C2C`).
- Right side: "Today" text button (14pt medium, olive green). Tapping it scrolls to the current week.
- Height: 56pt.

#### 3.2 Week Strip
- Horizontal strip showing Mon through Sun for the current week.
- Each day cell:
  - Width: equal division of screen width minus 32pt padding (7 columns).
  - Top: day abbreviation (11pt regular, `#8A8580`) -- "Mon", "Tue", etc.
  - Below: date number (16pt semibold, `#2C2C2C`).
  - Today indicator: date number shown in a 32pt olive green circle with white text.
  - Dot indicator below date: small 6pt dot if that day has jobs. Color matches the highest-priority job status on that day.
- Week navigation: swipe left for next week, swipe right for previous week. Animated slide transition (250ms).
- Current week/month label centered above the strip: "Feb 10 - 16, 2026" (13pt regular, `#8A8580`).

#### 3.3 Day Job List (ScrollView)
- Tapping a day in the week strip loads that day's jobs below.
- Default selected day: today.
- Jobs listed vertically, sorted by `scheduledStartTime` ascending.
- Each job card:
  - White rounded card (border-radius 14pt), shadow 0 2 6 rgba(0,0,0,0.05).
  - **Left edge:** 4pt vertical color bar (rounded) indicating status:
    - `SCHEDULED` / `DISPATCHED`: soft blue `#90B8DE`.
    - `IN_PROGRESS`: warm amber `#E8B44F`.
    - `COMPLETED`: olive green `#6B8F5E`.
    - `CANCELLED` / `ON_HOLD`: warm gray `#B5AFA8`.
  - **Card content:**
    - **Row 1:** Time range (14pt semibold, `#2C2C2C`) -- e.g., "9:00 AM - 11:00 AM" from `scheduledStartTime` and `scheduledEndTime`. If no times, show "Unscheduled".
    - **Row 2:** Job title (15pt medium, `#2C2C2C`) -- from `Job.title`.
    - **Row 3:** Client name (13pt regular, `#8A8580`) -- from `Customer.name` via `Job.customerId`.
    - **Row 4:** Address (12pt regular, `#B5AFA8`) -- from `Property.street, Property.city` if `propertyId` set, otherwise from `Job.location.address`. Truncated to 1 line.

#### 3.4 Job Detail Overlay (bottom sheet)
- Tapping a job card opens a bottom sheet (slides up, 60% screen height, rounded top corners 20pt).
- Handle bar at top (40pt wide, 4pt height, `#D5D0CA`, centered).
- Content:
  - **Status pill:** rounded pill showing current status text + color.
  - **Job title:** 20pt bold, `#2C2C2C`.
  - **Client name:** 15pt regular, `#6B8F5E`, tappable (navigates to Clients tab with this client expanded).
  - **Time:** icon + "9:00 AM - 11:00 AM, Mon Feb 10" (14pt regular).
  - **Address:** icon + full address (14pt regular), tappable (opens Apple Maps with the coordinates).
  - **Description:** `Job.description` if present, 14pt regular, `#4A4A4A`, max 4 lines with "Show more" toggle.
  - **Action buttons row** (bottom of sheet):
    - If `SCHEDULED`: "Start Job" (filled olive green button).
    - If `IN_PROGRESS`: "Complete Job" (filled olive green button).
    - If `COMPLETED`: "Create Invoice" (outlined olive green button) -- only if no linked invoice exists.
- Swipe down or tap outside to dismiss.

#### 3.5 Empty State (day)
- When selected day has no jobs:
  - Centered text: "No jobs on {Day, Month Date}" (16pt regular, `#8A8580`).
  - Below: "Tap + to schedule a job" (13pt regular, `#B5AFA8`).

### Interactions
- Swipe on week strip to change weeks.
- Tap day cell to load that day's jobs.
- Tap job card to open detail bottom sheet.
- Status updates via action buttons trigger an API call and optimistically update the UI.

---

## Screen 4: Invoicing

### Layout (top to bottom)

#### 4.1 Header
- Title "Invoices" left-aligned (24pt bold, `#2C2C2C`).
- Right side: filter icon button (funnel, `#8A8580`). Tap toggles a filter chip row below.
- Height: 56pt.

#### 4.2 Filter Chips (collapsible)
- Hidden by default. Shown when filter icon is tapped.
- Horizontal scrollable row of rounded pill buttons:
  - "All" (default selected), "Paid", "Pending", "Overdue".
  - Selected chip: olive green background `#6B8F5E`, white text.
  - Unselected chip: `#F0EDE8` background, `#4A4A4A` text.
- Filters map to `InvoiceStatus`: Paid = `PAID`, Pending = `SENT` + `DRAFT`, Overdue = `OVERDUE`.

#### 4.3 Outstanding Summary Card
- Full-width rounded card (border-radius 16pt), soft warm gradient or solid `#FFF8F0`.
- Inner padding 16pt.
- **Left column:**
  - "Total Outstanding" label (12pt regular, `#8A8580`).
  - Dollar amount (28pt bold, `#2C2C2C`) -- sum of `Invoice.total` where `status IN (SENT, OVERDUE)`.
- **Right column:**
  - Two small stacked stats:
    - "{N} pending" with yellow dot (12pt, `#8A8580`).
    - "{N} overdue" with red-orange dot (12pt, `#8A8580`).

#### 4.4 Invoice List (ScrollView)
- Vertical list of invoice rows separated by 8pt gap.
- Each invoice row:
  - White rounded card (border-radius 12pt), shadow 0 1 4 rgba(0,0,0,0.04).
  - Horizontal padding 14pt, vertical padding 12pt.
  - **Left content:**
    - Client name (15pt semibold, `#2C2C2C`) -- from `Customer.name` via `Invoice.customerId`.
    - Invoice number + date below (12pt regular, `#8A8580`) -- `Invoice.invoiceNumber` + formatted `Invoice.createdAt`.
  - **Right content (vertically centered):**
    - Amount (16pt bold, `#2C2C2C`) -- `Invoice.total` formatted as currency.
    - Status pill below the amount:
      - `PAID`: green background `#E8F5E9`, green text `#2E7D32`.
      - `SENT`: yellow background `#FFF8E1`, amber text `#F57F17`.
      - `OVERDUE`: red-orange background `#FFF3E0`, red text `#D84315`.
      - `DRAFT`: gray background `#F0EDE8`, gray text `#8A8580`.
      - `CANCELLED`: gray background, strikethrough text.
    - Pill size: auto-width, 6pt vertical padding, 10pt horizontal, border-radius 8pt, 11pt semibold.

#### 4.5 Quick-Create Invoice (bottom sheet)
- Triggered by the FAB when on the Invoices tab.
- Bottom sheet slides up (80% screen height, rounded top corners 20pt).
- Handle bar at top.
- **Form fields (vertical stack, 14pt gap):**
  1. **Client selector:** tappable row showing "Select Client" placeholder or selected client name. Tap opens a searchable client picker sub-sheet (reuses client list search from Screen 2).
  2. **Amount:** large number input (28pt, centered), with "$" prefix. Numeric keyboard.
  3. **Description:** multi-line text input (3 lines visible), placeholder "What was this for?" (14pt, `#B5AFA8`).
  4. **Due date:** date picker row, defaults to 30 days from today. Shows formatted date, tap opens iOS date picker wheel.
- **Action buttons (bottom, safe area aware):**
  - "Save as Draft" (outlined button, left).
  - "Send Invoice" (filled olive green button, right).
- Validation: client and amount are required. Show inline red text "Required" below empty required fields on submit attempt.

#### 4.6 Empty State
- Centered illustration placeholder (gray circle, 100pt).
- Text: "No invoices yet" (18pt semibold, `#2C2C2C`).
- Subtext: "Create your first invoice after completing a job" (14pt regular, `#8A8580`).

#### 4.7 Filtered Empty State
- When a filter is active but yields no results:
  - Text: "No {filter} invoices" (16pt regular, `#8A8580`), centered.

### Interactions
- Pull-to-refresh reloads invoice list.
- List sorted by `Invoice.createdAt` descending (newest first).
- Tapping an invoice row is a no-op for v1 (detail screen is out of scope).
- Filter selection immediately filters the list with a fade animation (150ms).

---

## Shared Patterns

### Typography Scale
| Use | Size | Weight |
|-----|------|--------|
| Screen title | 24pt | Bold |
| Section header | 18pt | Semibold |
| Card title / primary | 15-16pt | Semibold |
| Body / secondary | 14pt | Regular |
| Caption / label | 12-13pt | Regular |
| Metric large | 22-32pt | Bold |

### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| olive-green | `#6B8F5E` | Primary accent, progress ring, active tab, CTAs |
| dark-green | `#3D5A3E` | FAB background |
| text-primary | `#2C2C2C` | Headings, bold values |
| text-secondary | `#8A8580` | Labels, captions |
| text-muted | `#B5AFA8` | Placeholders, tertiary info |
| bg-screen | `#FAF8F5` | Screen background (warm off-white) |
| bg-card | `#FFFFFF` | Card surfaces |
| bg-input | `#F5F2EE` | Search bar, input backgrounds |
| bg-chip-inactive | `#F0EDE8` | Unselected filter chips, badges |
| border-light | `#E8E4DF` | Dividers, tab bar top border |
| shadow-card | `rgba(0,0,0,0.06)` | Card elevation |
| status-blue | `#90B8DE` | Scheduled jobs |
| status-amber | `#E8B44F` | In-progress jobs |
| status-green-bg | `#E8F5E9` | Paid pill background |
| status-yellow-bg | `#FFF8E1` | Pending pill background |
| status-red-bg | `#FFF3E0` | Overdue pill background |
| onboarding-bg | `#FFF3EB` | Tip card background |

### Spacing System
- Screen horizontal padding: 16pt.
- Card inner padding: 14pt.
- Gap between cards: 10-12pt.
- Section gap: 20pt.

### Interaction Standards
- All tap targets: minimum 44x44pt.
- Card press: subtle scale down to 0.98 + slight opacity (0.85) on press, 100ms.
- Bottom sheets: drag-to-dismiss, tap-outside-to-dismiss.
- Pull-to-refresh: all scrollable lists support it.
- Haptic feedback: light impact on FAB tap, medium impact on status change actions.

### Safe Area
- Top: respect iOS status bar + notch.
- Bottom: tab bar sits above home indicator. FAB floats above tab bar.
- All content padded to avoid notch/home indicator overlap.

### Offline Behavior (v1)
- App reads from local cache (IndexedDB sync from flexdesk-core).
- When offline, show a small yellow banner below the header: "You're offline -- changes will sync when connected" (12pt, amber background).
- All create/update actions queue locally and sync when connectivity returns.

### Loading States
- Skeleton screens: cards show pulsing gray rounded rectangles matching card layout.
- No spinners. Use skeleton placeholders for all loading states.
- Skeleton pulse color: alternate between `#F0EDE8` and `#E8E4DF`, 1.2s cycle.

### Error States
- Network errors: toast notification at top, auto-dismiss after 4s. Red-orange background, white text.
- Form validation: inline red text below the offending field, 12pt.

---

## Data Model Reference

All data comes from the existing FlexDesk backend API, scoped by `workspaceId` (RLS).

| Screen | Primary Models | Key Fields Used |
|--------|---------------|-----------------|
| Dashboard | Job, Customer, Invoice | Job.status, Job.completedAt, Invoice.status, Invoice.total, Invoice.paidAt |
| Client List | Customer, Job, Invoice, Property | Customer.name/email/phone, Job.completedAt (last job), Invoice.total (revenue) |
| Job Calendar | Job, Customer, Property | Job.scheduledDate, scheduledStartTime, scheduledEndTime, status, title; Customer.name; Property.street/city |
| Invoicing | Invoice, Customer | Invoice.invoiceNumber, status, total, createdAt, dueDate; Customer.name |
