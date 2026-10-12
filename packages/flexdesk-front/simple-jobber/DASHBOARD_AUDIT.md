# Dashboard Layout Audit

## 1. Current Container/Card Components Used

### Primary Layout Components
- **`Card` (AtlantisCard)** - Compound component with `Card.Header` and `Card.Body` sub-components
  - Props: `accent` (blue/green/orange/purple), `elevation` (base/elevated), `className`
  - Used for: KPI cards, Today's Schedule card, New Requests card
- **`Grid`** - Responsive 12-column CSS Grid layout system
  - Compound component with `Grid.Cell`
  - Props: `gap` (none/small/base/large), `className`
  - Responsive sizing: xs, sm, md, lg, xl breakpoints
- **`Page`** - Top-level page container
  - Props: `title`, `subtitle`, `className`, `width` (fill/standard/narrow)
  - Manages page header, title, and subtitle layout

### Data Display Components
- **`DataList`** - Flexible list with `DataList.Layout`, `DataList.ItemActions`, `DataList.BulkActions`, `DataList.EmptyState`
- **`StatusLabel`** - Status badge component for job/request statuses
- **`Heading`** - Section titles (levels 2 and 4)
- **`Text`** - Body copy and labels (with `subdued` variation)
- **`Icon`** - Visual indicators (inbox, calendar, timer, clients)
- **`FormatDate`**, **`FormatTime`** - Date/time formatting
- **`Glimmer`** - Loading skeleton animations
- **`Button` (AtlantisButton)** - Action buttons ("View Schedule", "View All")

### Navigation Components
- **`Breadcrumb`** / **`BreadcrumbPage`** - From `@/components/admin`
- **`Link`** - From `react-router` for navigation

## 2. Dashboard Layout Structure

### Overall Architecture
```
Page (title: "Welcome back!", subtitle: "Here's what's happening...")
├── Breadcrumb (navigation)
│
├── Grid gap="base" (KPI Cards Row - mb-6 margin-bottom)
│   ├── Grid.Cell (xs:12, md:6, lg:3) → New Requests KPI Card
│   ├── Grid.Cell (xs:12, md:6, lg:3) → Today's Jobs KPI Card
│   ├── Grid.Cell (xs:12, md:6, lg:3) → Unscheduled Jobs KPI Card
│   └── Grid.Cell (xs:12, md:6, lg:3) → Active Clients KPI Card
│
└── Grid gap="large" (Main Content Row)
    ├── Grid.Cell (xs:12, md:6) → Today's Schedule Card
    └── Grid.Cell (xs:12, md:6) → New Requests Card
```

### Layout Method: CSS Grid (via Atlantis Grid component using Tailwind `grid-cols-12`)

### Responsive Breakpoints
| Breakpoint | KPI Cards | Content Cards |
|------------|-----------|---------------|
| xs (mobile) | Full width (12/12) | Full width (12/12) |
| md (768px+) | 2 per row (6/12) | 2 per row (6/12) |
| lg (1024px+) | 4 per row (3/12) | 2 per row (6/12) |

### Spacing
- Gap between KPI cards: `gap-base` (Tailwind `gap-4`)
- Gap between content cards: `gap-large` (Tailwind `gap-6`)
- Card body padding: `p-4` (1rem)
- Card header padding: `px-4 py-3`
- KPI section bottom margin: `mb-6`

## 3. Dashboard Widgets/Sections

### Section 1: KPI Cards Grid (4 cards)

| Card | Accent Color | Icon | Metric | Label | Link Target |
|------|-------------|------|--------|-------|-------------|
| New Requests | Blue | inbox | Count of NEW requests | "Awaiting response" | `/requests?filter={"status":"NEW"}` |
| Today's Jobs | Green | calendar | Count of today's jobs | "Scheduled for today" | `/schedule` |
| Unscheduled Jobs | Orange | timer | Count of UNSCHEDULED jobs | "Jobs to schedule" | `/jobs?filter={"status":"UNSCHEDULED"}` |
| Active Clients | Purple | clients | Count of ACTIVE clients | "Total active" | `/clients?filter={"status":"ACTIVE"}` |

- Each KPI card is wrapped in a clickable `<Link>` with hover shadow effect
- Large heading (level 2) for the metric number
- Subdued text for the descriptive label

### Section 2: Today's Schedule Card (Left column)
- **Header:** "Today's schedule" title + "View Schedule" button → `/schedule`
- **Body:** DataList of top 5 jobs scheduled for today
  - Each item shows: job title, scheduled time (FormatTime), status badge (StatusLabel)
  - Each item is a clickable link → `/jobs/{id}/show`
- **Empty State:** Calendar icon + "No jobs scheduled for today"

### Section 3: New Requests Card (Right column)
- **Header:** "New requests" title + "View All" button → `/requests`
- **Body:** DataList of top 5 new requests
  - Each item shows: request title, creation date (FormatDate, relative), status badge (StatusLabel)
  - Each item is a clickable link → `/requests/{id}/show`
- **Empty State:** Success icon + "All caught up! No new requests"

## 4. Loading States

### Skeleton Components (defined in DashboardPage.tsx)
- **`KpiCardSkeleton`** - Card with Glimmer rectangles/circles for loading placeholders
- **`ListItemSkeleton`** - Individual list row with Glimmer elements
- **`ListCardSkeleton`** - Complete card with 3 ListItemSkeleton items
- **`DashboardLoadingSkeleton`** - Full dashboard skeleton matching the real layout (4 KPI + 2 content cards)

## 5. Styling Approach

- **Tailwind CSS** utility classes for all styling (no CSS modules/SCSS)
- **CSS Variables** (design tokens) for theming: `--color-border`, `--color-surface`, `--color-surface--hover`, `--color-text`
- **AtlantisThemeContextProvider** for theme configuration (dark mode default)
- Card accent colors via border-left: `border-l-4 border-l-{color}-500`

## 6. Data Fetching

- Uses React Admin's `useGetList` hook with three parallel data sources:
  1. Requests (NEW status, sorted by createdAt desc)
  2. Jobs (100 per page, sorted by scheduledStartAt)
  3. Clients (100 per page)
- Computed stats derived via `useMemo`:
  - Today's jobs (filtered by today's date)
  - Unscheduled jobs (filtered by status)
  - Active clients count

## 7. Component File Reference

| Component | Source File |
|-----------|------------|
| DashboardPage | `dashboard/DashboardPage.tsx` (369 lines) |
| Card | `components/atlantis/Card.tsx` (217 lines) |
| Grid | `components/atlantis/Grid.tsx` (195 lines) |
| Page | `components/atlantis/Page.tsx` (182 lines) |
| Container | `components/atlantis/Container.tsx` (64 lines) |
| DataList | `components/atlantis/DataList.tsx` |
| Glimmer | `components/atlantis/Glimmer.tsx` |
| All Atlantis exports | `components/atlantis/index.ts` (322 lines) |
