# FlexDesk Mobile -- Component Design Specs

> Reference for building every reusable UI component.
> All color and size values refer to tokens exported from `src/theme/colors.ts` and `src/theme/tokens.ts`.

---

## 1. MetricCircle

Circular progress ring with a bold number inside and a label below. Used for the dashboard "Jobs this week" hero widget.

### Dimensions
| Property | Value | Token |
|----------|-------|-------|
| Outer diameter | 160 pt | `size.healthRingDiameter` |
| Stroke width | 10 pt | `size.healthRingStroke` |
| Inner divider line | 40 pt wide, 1 pt tall | `size.healthRingDivider` |

### Colors
| Element | Value | Token |
|---------|-------|-------|
| Filled arc | `#6B8F5E` | `brand.olive` |
| Empty arc | `#E8E4DF` | `border.light` |
| Center number | `#2C2C2C` | `text.primary` |
| "of N" text | `#8A8580` | `text.secondary` |
| Divider line | `#D5D0CA` | `border.divider` |
| Label below ring | `#8A8580` | `text.secondary` |

### Typography
| Element | Size | Weight | Token |
|---------|------|--------|-------|
| Center number | 32 pt | Bold | `typography.metricLarge` |
| "of N" | 18 pt | Regular | `fontSize.lg` / `fontWeight.regular` |
| Label below | 13 pt | Regular | `typography.captionMd` |

### Layout
- Centered horizontally on screen.
- Label ("Jobs this week") centered 8 pt below the ring.
- Ring arc starts at 12-o'clock, fills clockwise.

### States
| State | Behavior |
|-------|----------|
| Default | Shows progress arc proportional to completed / target. |
| Zero data | Arc is fully empty-color; center shows "0". |
| Over target | Arc is fully filled; number shows actual count (e.g. "12"). |
| Loading | Replaced by a 160 pt circular skeleton placeholder. |

---

## 2. StatBubble (Metric Card)

Rounded card used in the dashboard 2x2 grid. Shows an icon, a bold metric, and a label.

### Dimensions
| Property | Value | Token |
|----------|-------|-------|
| Card border-radius | 14 pt | `radius.lg` |
| Inner padding | 14 pt | -- |
| Icon circle | 28 pt | `size.metricIconCircle` |
| Grid gap between cards | 12 pt | `spacing.md` |

### Colors
| Element | Value | Token |
|---------|-------|-------|
| Card background | `#FFFFFF` | `background.card` |
| Card shadow | 0 2 8 rgba(0,0,0,0.06) | `shadows.card` |
| Icon circle BG (varies) | see below | `metricIconBg.*` |
| Metric number | `#2C2C2C` | `text.primary` |
| Label | `#8A8580` | `text.secondary` |

Icon background per variant:
- Active Clients: `metricIconBg.clients` (`#EDE7F6`)
- Pending Jobs: `metricIconBg.jobs` (`#FFF8E1`)
- Unpaid Invoices: `metricIconBg.invoices` (`#FFEBEE`)
- Weekly Revenue: `metricIconBg.revenue` (`#E8F5E9`)

### Typography
| Element | Size | Weight | Token |
|---------|------|--------|-------|
| Value | 22 pt | Bold | `typography.metricMedium` |
| Label | 12 pt | Regular | `typography.caption` |

### Layout
- 2 columns, equal width, 12 pt gap, 16 pt screen-edge padding.
- Content stacked vertically: icon circle -> value -> label.

### States
| State | Behavior |
|-------|----------|
| Default | Displays metric data. |
| Pressed | Scale 0.98, opacity 0.85, 100 ms. Navigates to relevant tab. |
| Loading | Skeleton card (same dimensions, pulsing fill). |

---

## 3. ClientCard

White expandable card showing client name, summary stats, and contact actions.

### Dimensions
| Property | Value | Token |
|----------|-------|-------|
| Border-radius | 14 pt | `radius.lg` |
| Horizontal padding | 14 pt | -- |
| Vertical padding | 12 pt | -- |
| Avatar circle | 36 pt | `size.clientAvatar` |
| Gap between cards | 10 pt | -- |

### Colors
| Element | Value | Token |
|---------|-------|-------|
| Card background | `#FFFFFF` | `background.card` |
| Card shadow | 0 2 6 rgba(0,0,0,0.05) | `shadows.cardSubtle` |
| Avatar background | `#6B8F5E` | `brand.olive` |
| Avatar initials | `#FFFFFF` | `text.onPrimary` |
| Client name | `#2C2C2C` | `text.primary` |
| Info chips | `#8A8580` | `text.secondary` |
| Chevron | `#C5C0B8` | -- |

### Typography
| Element | Size | Weight | Token |
|---------|------|--------|-------|
| Client name | 16 pt | Semibold | `typography.cardTitle` |
| Info chips | 12 pt | Regular | `typography.caption` |
| Avatar initials | 14 pt | Bold | `size.avatarFontSize` / `fontWeight.bold` |

### Layout
- Row 1: Avatar (left) + name (center-left) + chevron (far right).
- Row 2: "Last job: Jan 15" chip + "$2,340 total" chip, side by side below name.
- Expanded section (below row 2, animated 200 ms ease-out):
  - Phone row (icon + tappable number).
  - Email row (icon + tappable address).
  - Jobs summary line ("12 jobs completed").
  - Quick-action buttons row: "New Job" + "New Invoice" (olive green outline).

### States
| State | Behavior |
|-------|----------|
| Default (collapsed) | Shows rows 1-2 only. |
| Pressed | Scale 0.98 + opacity 0.85 for 100 ms, then expand. |
| Expanded | Rows 1-2 + expanded section visible. Only one card expanded at a time. |
| Loading | Skeleton card matching collapsed layout. |

---

## 4. JobBlock

Calendar job card with a colored left-edge status bar.

### Dimensions
| Property | Value | Token |
|----------|-------|-------|
| Border-radius | 14 pt | `radius.lg` |
| Status bar width | 4 pt | `size.jobStatusBarWidth` |
| Card inner padding | 14 pt | -- |

### Colors
| Element | Value | Token |
|---------|-------|-------|
| Card background | `#FFFFFF` | `background.card` |
| Card shadow | 0 2 6 rgba(0,0,0,0.05) | `shadows.cardSubtle` |
| Status bar (SCHEDULED/DISPATCHED) | `#90B8DE` | `jobStatus.scheduled` |
| Status bar (IN_PROGRESS) | `#E8B44F` | `jobStatus.inProgress` |
| Status bar (COMPLETED) | `#6B8F5E` | `jobStatus.completed` |
| Status bar (CANCELLED/ON_HOLD) | `#B5AFA8` | `jobStatus.cancelled` |

### Typography
| Element | Size | Weight | Token |
|---------|------|--------|-------|
| Time range | 14 pt | Semibold | -- |
| Job title | 15 pt | Medium | `typography.cardTitleSm` adjusted to medium |
| Client name | 13 pt | Regular | `typography.captionMd` |
| Address | 12 pt | Regular | `typography.caption` |

### Layout
- Left edge: 4 pt vertical color bar (full card height, rounded ends).
- Content stacked vertically with 4 pt gaps:
  - Time range (e.g. "9:00 AM - 11:00 AM").
  - Job title.
  - Client name (secondary color).
  - Address (muted color, single line, truncated).

### States
| State | Behavior |
|-------|----------|
| Default | Displays job info. |
| Pressed | Scale 0.98, opacity 0.85 for 100 ms. Opens job detail bottom sheet. |
| Loading | Skeleton card with left bar placeholder. |

---

## 5. InvoiceRow

List row showing client name, invoice number, amount, and a status pill.

### Dimensions
| Property | Value | Token |
|----------|-------|-------|
| Border-radius | 12 pt | `radius.md` |
| Horizontal padding | 14 pt | -- |
| Vertical padding | 12 pt | -- |
| Gap between rows | 8 pt | -- |

### Colors
| Element | Value | Token |
|---------|-------|-------|
| Card background | `#FFFFFF` | `background.card` |
| Card shadow | 0 1 4 rgba(0,0,0,0.04) | `shadows.cardLight` |
| Client name | `#2C2C2C` | `text.primary` |
| Invoice number + date | `#8A8580` | `text.secondary` |
| Amount | `#2C2C2C` | `text.primary` |

### Typography
| Element | Size | Weight |
|---------|------|--------|
| Client name | 15 pt | Semibold |
| Invoice # + date | 12 pt | Regular |
| Amount | 16 pt | Bold |
| Status pill text | 11 pt | Semibold |

### Layout
- Left column: client name (top), invoice number + date (bottom).
- Right column (vertically centered): amount (top), status pill (bottom).

### States
| State | Behavior |
|-------|----------|
| Default | Displays invoice info. |
| Pressed | Scale 0.98, opacity 0.85 for 100 ms. No-op in v1. |
| Loading | Skeleton row matching layout. |

---

## 6. StatusPill

Small rounded badge showing a status label with tinted background.

### Dimensions
| Property | Value | Token |
|----------|-------|-------|
| Horizontal padding | 10 pt | `size.pillPaddingH` |
| Vertical padding | 6 pt | `size.pillPaddingV` |
| Border-radius | 8 pt | `size.pillRadius` |

### Color Variants
| Status | Background | Text | Token |
|--------|-----------|------|-------|
| Paid | `#E8F5E9` | `#2E7D32` | `invoiceStatus.paid` |
| Sent / Pending | `#FFF8E1` | `#F57F17` | `invoiceStatus.sent` |
| Overdue | `#FFF3E0` | `#D84315` | `invoiceStatus.overdue` |
| Draft | `#F0EDE8` | `#8A8580` | `invoiceStatus.draft` |
| Cancelled | `#F0EDE8` | `#8A8580` (+ strikethrough) | `invoiceStatus.cancelled` |

### Typography
- 11 pt, Semibold (`typography.pillLabel`).

### States
| State | Behavior |
|-------|----------|
| Default | Static display. |
| Cancelled | Same as Draft colors but text has strikethrough decoration. |

---

## 7. TipCard

Dismissable onboarding/tip card shown conditionally on the dashboard.

### Dimensions
| Property | Value | Token |
|----------|-------|-------|
| Border-radius | 16 pt | `radius.xl` |
| Inner padding | 16 pt | -- |
| Icon size | 40 pt | `size.iconXl` |
| Close button tap area | 44 x 44 pt | `size.minTapTarget` |

### Colors
| Element | Value | Token |
|---------|-------|-------|
| Background | `#FFF3EB` | `background.tipCard` |
| Body text | `#4A4A4A` | `text.onTip` |
| CTA link text | `#6B8F5E` | `text.link` |
| Close icon | `#8A8580` | `text.secondary` |

### Typography
| Element | Size | Weight |
|---------|------|--------|
| Body text | 14 pt | Medium |
| CTA link | 14 pt | Medium |

### Layout
- Full-width, horizontal row: icon (left, 40 pt) + text block (center) + close button (top-right).
- CTA link at card bottom: "Add Client >" left-aligned.

### States
| State | Behavior |
|-------|----------|
| Default | Visible when workspace has < 3 clients OR < 1 job. |
| Dismissed | Tapping X sets a local flag; card does not appear again. |
| CTA tapped | Navigates to Clients tab with new-client form open. |

---

## 8. FAB (Floating Action Button)

Large circular button for quick-create actions.

### Dimensions
| Property | Value | Token |
|----------|-------|-------|
| Diameter | 56 pt | `size.fabSize` |
| Icon size | 24 pt | `size.fabIconSize` |
| Position | Centered horizontally, 16 pt above tab bar | `size.fabBottomOffset` |

### Colors
| Element | Value | Token |
|---------|-------|-------|
| Background | `#3D5A3E` | `brand.oliveDark` |
| Icon ("+") | `#FFFFFF` | `text.onPrimary` |
| Shadow | 0 4 12 rgba(0,0,0,0.15) | `shadows.fab` |

### States
| State | Behavior |
|-------|----------|
| Default | Dark green circle with white "+" icon. |
| Pressed | Scale 0.95, opacity 0.9 for 100 ms. Light haptic impact. |
| Contextual action | Tap opens bottom sheet (Home tab) or navigates to create form (other tabs). |

---

## 9. TabBar

Bottom navigation bar with 4 tabs and a floating FAB above.

### Dimensions
| Property | Value | Token |
|----------|-------|-------|
| Total height (incl. safe area) | 80 pt | `size.tabBarTotalHeight` |
| Content height | 52 pt | `size.tabBarContentHeight` |
| Top border | 1 px | `size.tabBarBorderWidth` |
| Icon size | 24 pt | `size.iconLg` |
| Min tap target | 44 x 44 pt | `size.minTapTarget` |

### Colors
| Element | Value | Token |
|---------|-------|-------|
| Background | `#FFFFFF` | `background.card` |
| Top border | `#E8E4DF` | `border.light` |
| Active icon + label | `#6B8F5E` | `brand.olive` |
| Inactive icon | `#8A8580` | `text.secondary` |

### Tabs
| Index | Label | Icon (Ionicons) |
|-------|-------|-----------------|
| 1 | Home | `home-outline` / `home` (active) |
| 2 | Clients | `person-outline` / `person` (active) |
| 3 | Calendar | `calendar-outline` / `calendar` (active) |
| 4 | Invoices | `document-text-outline` / `document-text` (active) |

### States
| State | Behavior |
|-------|----------|
| Active tab | Filled icon variant, olive green, label visible below icon. |
| Inactive tab | Outline icon variant, warm gray, no label (icon only). |

---

## 10. SearchBar

Rounded search input used on the Clients tab.

### Dimensions
| Property | Value | Token |
|----------|-------|-------|
| Border-radius | 12 pt | `radius.md` |
| Height | 44 pt | `size.minTapTarget` |
| Horizontal screen padding | 16 pt | `spacing.lg` |
| Icon size | 20 pt | `size.iconMd` |

### Colors
| Element | Value | Token |
|---------|-------|-------|
| Background | `#F5F2EE` | `background.input` |
| Placeholder text | `#B5AFA8` | `text.muted` |
| Input text | `#2C2C2C` | `text.primary` |
| Search icon | `#B5AFA8` | `text.muted` |
| Focused border | 1 px `#6B8F5E` | `border.inputFocus` |
| Clear button icon | `#8A8580` | `text.secondary` |

### Typography
| Element | Size | Weight |
|---------|------|--------|
| Placeholder / input text | 14 pt | Regular |

### States
| State | Behavior |
|-------|----------|
| Default | Placeholder visible, no border. |
| Focused | 1 px olive-green border, keyboard appears. |
| Has text | Clear (X) button appears at right end. |
| Blurred with text | Border removed, text remains, clear button visible. |

---

## Shared Interaction Patterns

### Press Feedback
All tappable cards and buttons use:
- `pressFeedback.scale` (0.98) + `pressFeedback.opacity` (0.85)
- Duration: `duration.fast` (100 ms)

### Pull-to-Refresh
Available on: Dashboard, Client List, Invoice List.
Uses default iOS refresh control.

### Bottom Sheets
- Rounded top corners: `size.sheetTopRadius` (20 pt).
- Handle bar: `size.sheetHandleWidth` x `size.sheetHandleHeight` (40 x 4 pt), color `border.divider`.
- Dismiss: swipe down or tap scrim (`background.overlay`).
- Shadow: `shadows.bottomSheet`.

### Loading / Skeleton
- All components have a skeleton state matching their layout dimensions.
- Pulse animation cycles between `skeleton.base` and `skeleton.shimmer` over `size.skeletonCycleDuration` (1200 ms).

### Error Toast
- Background: `feedback.toastErrorBg`, text: `feedback.toastErrorText`.
- Auto-dismiss after 4 seconds.
- Positioned below status bar.

### Offline Banner
- Background: `feedback.offlineBanner`, text: `feedback.offlineText`.
- Text: "You're offline -- changes will sync when connected" (12 pt).
- Shown below header when no network.

### Haptics
- FAB tap: light impact.
- Status change (Start Job, Complete Job): medium impact.
