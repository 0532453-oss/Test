# FlexDesk CRM — Dashboard UI Technical Audit

**Perspective:** Senior UI Developer (Design Systems)
**Page:** `/` (DashboardPage)
**Date:** January 26, 2026
**Auditor:** Technical UI Review

---

## TL;DR — Why It Feels Suffocated

The dashboard has three compounding problems that create the "suffocated" feeling:

1. **The sidebar and content area have a 1px gap between them.** One pixel. That's it. There is no gutter, no breathing room, no separation. The dark sidebar bleeds directly into the light content area.

2. **The content stretches to 1,649px wide** with only 16px of padding on each side. Every card, every list row, every heading spans nearly the entire viewport. A schedule row like "Emergency Pipe Repair → In Progress" stretches across 1,525px — the eye has to travel the width of a basketball court to connect those two pieces of information.

3. **Every section lives on the same visual plane.** Cards have `shadow-sm` (barely visible), identical `1px` borders, identical white backgrounds, identical `12px` internal padding. There's no sense of foreground vs. background, no layering. Everything is flat, and flat means stacked.

Fix these three things and you'll go from "suffocated startup" to "clean SaaS product."

---

## 1. Layout De-cluttering — Sidebar vs. Content Gutter

### Current State (Measured from Live DOM)

| Property | Current Value | Problem |
|---|---|---|
| Sidebar width | `255px` (16rem) | Fine |
| Sidebar → Content gap | **1px** | Critical. No visual separation. |
| Content `<main>` padding | `0px` | None. Frame provides nothing. |
| Content wrapper (`px-4`) | `16px` left/right | Insufficient for a 1920px viewport |
| Total content width | `1,649px` | Way too wide. No max-width. |

### What's Happening in Code

```
AppLayout.tsx
  └── SidebarProvider (sets --sidebar-width: 16rem)
        └── Frame
              ├── <Sidebar collapsible="icon">   ← fixed position, border-r only
              └── <main class="flex flex-1 flex-col min-w-0 bg-background">
                    └── Content (class="px-4")   ← only 16px side padding
                          └── DashboardPage      ← no max-width, full stretch
```

The `Sidebar` component (sidebar.tsx:219) applies `group-data-[side=left]:border-r` — a single 1px border is the *only* separator between a dark 255px sidebar and a light 1,649px content area.

### Recommended Fix — 3 Layers of Separation

**Layer 1 — Content Area Inner Padding (the "gutter")**

Change the Content wrapper from `px-4` (16px) to `px-6 lg:px-10` (24px → 40px on desktop). This creates a visible breathing zone between the sidebar edge and the first piece of content.

```
Current:  Sidebar | 1px border | 16px pad | Content ←→ Content | 16px pad |
Proposed: Sidebar | 1px border | 40px pad | Content ←→ Content | 40px pad |
```

In `AppLayout.tsx` line 138:
```tsx
// Before
<Content className="px-4">

// After
<Content className="px-6 lg:px-10">
```

That alone adds 48px of visual breathing room (24px more on each side) at the sidebar junction.

**Layer 2 — Max-Width Constraint on Dashboard**

The dashboard should never stretch beyond ~1,280px (`max-w-7xl`) regardless of viewport size. Center it.

In `DashboardPage.tsx` line 209:
```tsx
// Before
<Page title="Welcome back!" subtitle="..." className="pb-8">

// After
<Page title="Welcome back!" subtitle="..." className="pb-8 max-w-7xl mx-auto w-full">
```

This means on a 1920px monitor with a 255px sidebar, you get:

```
255px sidebar | 40px gutter | ~1280px content (centered) | 40px gutter | remaining space
```

Instead of:

```
255px sidebar | 16px | 1649px content (edge to edge) | 16px
```

**Layer 3 — Sidebar Background Bleed Containment**

The sidebar uses `bg-sidebar` (dark navy `#032B3A`). The content uses `bg-background` (warm off-white `#F9F8F6`). A 1px border between those is not enough contrast separation. Two options:

Option A: Add a subtle inset shadow on the main content area to create depth at the edge:
```css
/* On <main> via contentClassName */
shadow-[inset_4px_0_8px_-4px_rgba(0,0,0,0.06)]
```

Option B: Use the `variant="inset"` sidebar mode which adds 16px of padding around the sidebar, creating natural separation. This is the more "Meta-like" approach — Facebook's internal tools use inset sidebars.

---

## 2. Card Typography & Padding — The 8px Grid System

### Current Measurements (Today's Schedule Card)

| Element | Current | 8px Grid Aligned | Issue |
|---|---|---|---|
| Card border-radius | `12px` (rounded-xl) | 12px | OK (1.5 units) |
| Card.Header padding | `12px 16px` (py-3 px-4) | 12/16 | Tight. Header feels cramped. |
| Card.Body padding | `16px` (p-4) | 16px | OK but tight for list content |
| Schedule heading font | `20px / 28px` | 20/28 | Fine |
| Schedule heading margin-bottom | `0px` | 0 | Problem — heading touches content |
| Schedule row height | `36px` total | 36 | Condensed. Rows feel squished. |
| Schedule row internal padding | `12px` (p-3) | 12 | Should be 16px (p-4) for breathing |
| Job title font | `16px / 24px` | 16/24 | OK |
| Time subtitle font | `14px / 20px` | 14/20 | OK |
| Row-to-row gap | `12px` (gap-3 via DataList) | 12 | Tight. Should be 8-12px with more row padding |
| Status label position | right-aligned, 1,525px away from title | - | Catastrophic scannability failure |

### The Core Problem

Each schedule row is **36px tall** containing a title (24px line-height) + a time subtitle (20px line-height) — that's 44px of content in a 36px container with only 12px padding. The content is literally overflowing its comfortable space.

Here's the math on what "breathing" looks like using the 8px grid:

### Recommended Card Redesign — 8px Grid

```
+--Card (rounded-xl, 12px radius)---------------------------------------------+
|                                                                               |
|  +--Header (px-6 = 24px, py-4 = 16px)------------------------------------+  |
|  |  "Today's schedule"  (20px/28px, font-bold)    [View Schedule button]  |  |
|  +------------------------------------------------------------------------+  |
|  |  1px border-b                                                          |  |
|  +--Body (px-6 = 24px, pt-4 = 16px, pb-6 = 24px)-------------------------+  |
|  |                                                                        |  |
|  |  +--Row (px-4 = 16px, py-3.5 = 14px)-------------------------------+  |  |
|  |  |  [StatusDot]  Emergency Pipe Repair          [In Progress] [...] |  |  |
|  |  |               8:00 AM                                            |  |  |
|  |  +------------------------------------------------------------------+  |  |
|  |  12px gap                                                              |  |
|  |  +--Row (px-4 = 16px, py-3.5 = 14px)-------------------------------+  |  |
|  |  |  [StatusDot]  Monthly HVAC Maintenance       [Scheduled]   [...] |  |  |
|  |  |               9:00 AM                                            |  |  |
|  |  +------------------------------------------------------------------+  |  |
|  |  12px gap                                                              |  |
|  |  +--Row (px-4 = 16px, py-3.5 = 14px)-------------------------------+  |  |
|  |  |  [StatusDot]  Kitchen Equipment Install.     [Scheduled]   [...] |  |  |
|  |  |               12:00 PM                                           |  |  |
|  |  +------------------------------------------------------------------+  |  |
|  |                                                                        |  |
|  +------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
```

### Specific Values

**Card.Header** — Increase from `px-4 py-3` (16px/12px) to `px-6 py-4` (24px/16px):
```tsx
// Card header rows in DashboardPage.tsx (lines 297, 360, 405)
// Before
<div className="flex flex-row items-center justify-between px-4 py-3">

// After
<div className="flex flex-row items-center justify-between px-6 py-4">
```

**Card.Body** — Increase from `p-4` (16px all) to `px-6 py-5` (24px horizontal, 20px vertical):
```tsx
// In Card.tsx, CardBody component (line 126)
// Before
<div className={cn('p-4', className)}>

// After
<div className={cn('px-6 py-5', className)}>
```

**Schedule Row Items** — Increase internal padding from `p-3` (12px) to `px-4 py-3.5` (16px/14px):
```tsx
// The DataList item wrapper should have more padding
// This means the clickable area in each row needs:
padding: 14px 16px; // py-3.5 px-4
```

This takes each row from 36px → ~56px. That's a 55% increase in touch target and visual breathing room. On a 756px viewport, you still comfortably fit 3 rows in the card.

**Line-Height Adjustments:**

| Element | Current | Recommended | Reason |
|---|---|---|---|
| Job title | `16px/24px` (1.5) | `16px/24px` | Keep — good ratio |
| Time subtitle | `14px/20px` (1.43) | `14px/20px` | Keep |
| Gap between title and time | `0px` (stacked inline) | `4px` (mt-1) | Add micro-space between title and timestamp |
| Section heading "Today's schedule" | `20px/28px` | `18px/28px` (or keep 20px) | Slightly smaller is more refined |

---

## 3. Visual Depth — Escaping the 2D Flatland

### Current State

Every card on the dashboard uses the exact same visual treatment:

```css
/* Card.tsx line 173 */
border: 1px solid var(--color-border);     /* #DADFE2 */
background: var(--color-surface);          /* #ffffff */
border-radius: 12px;
box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); /* shadow-sm — barely visible */
```

The KPI cards use `elevation="base"` which maps to `shadow-sm`. The content cards use `Container variant="elevated"` but the Container itself doesn't add shadows — it just wraps a Card which has `elevation="none"` by default.

**Result:** Every element sits at the same Z-depth. The page is a stack of identically-styled rectangles. There's no visual hierarchy.

### The Layering Model

Think of the dashboard as 3 visual layers:

```
Layer 0 (Background)  — The page itself (#F9F8F6 warm off-white)
Layer 1 (Cards)       — Content cards (schedule, requests, map)
Layer 2 (Highlights)  — KPI cards, action items, alerts
```

Each layer needs a distinct visual treatment.

### Recommended Shadow System

**Layer 0 — Page Background:**
No change. `#F9F8F6` is a good warm neutral. But add a subtle distinction: the content area background should be *slightly* different from the card background so cards "float."

```css
/* Page/content area background */
background: #F5F4F1;  /* slightly warmer/darker than current #F9F8F6 */
/* OR use the existing --color-surface--background: #F9F8F6 and make cards pure white */
```

**Layer 1 — Content Cards (Schedule, Requests):**
Replace the flat `1px border + shadow-sm` with a more perceptible but still subtle elevation:

```css
/* Recommended for content cards */
border: 1px solid rgba(0, 0, 0, 0.06);      /* softer than #DADFE2 */
box-shadow:
  0 1px 3px 0 rgba(0, 0, 0, 0.04),          /* tight shadow for grounding */
  0 4px 12px 0 rgba(0, 0, 0, 0.03);         /* diffused shadow for lift */
border-radius: 12px;
```

In Tailwind:
```
shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]
border border-black/6
```

This is what Meta's Workplace, Linear, and Notion use. The double-shadow creates a subtle "lifted paper" effect without looking like Bootstrap 2012.

**Layer 2 — KPI Cards (elevated, interactive):**
These should feel *above* the content cards:

```css
/* Recommended for KPI cards */
border: 1px solid rgba(0, 0, 0, 0.08);
box-shadow:
  0 1px 2px 0 rgba(0, 0, 0, 0.06),
  0 6px 16px 0 rgba(0, 0, 0, 0.06);
transition: box-shadow 150ms ease, transform 150ms ease;
```

On hover (already have `hover:shadow-lg`):
```css
box-shadow:
  0 2px 4px 0 rgba(0, 0, 0, 0.08),
  0 8px 24px 0 rgba(0, 0, 0, 0.1);
transform: translateY(-1px);
```

**Implementation in Card.tsx:**

```tsx
// Updated elevationStyles (Card.tsx line 89)
const elevationStyles: Record<CardElevation, string> = {
  none: 'shadow-none',
  base: 'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]',
  elevated: 'shadow-[0_1px_2px_rgba(0,0,0,0.06),0_6px_16px_rgba(0,0,0,0.06)]',
};
```

### Border Treatment

Replace hard `1px solid #DADFE2` borders with softer alternatives:

| Element | Current | Recommended |
|---|---|---|
| Card outer border | `border-[--color-border]` (#DADFE2) | `border-black/[0.06]` — softer, adapts to any bg |
| Card.Header bottom border | `border-b border-[--color-border]` | `border-b border-black/[0.06]` — less visible |
| Schedule row borders | `border rounded-lg` | `border-black/[0.04] rounded-lg` — near-invisible, relies on bg tint |
| KPI card left accent border | `border-l-4 border-l-blue-500` | Keep — good visual differentiator |

---

## 4. Whitespace Strategy — Macro-Whitespace for Scannability

### Current Spacing Architecture

```
Page (pb-8 = 32px bottom)
  └── KPI Container (mb-6 = 24px bottom)
        └── Grid gap="base" (16px between KPI cards)
  └── Content Stack (space-y-6 = 24px between sections)
        ├── Today's Schedule card
        ├── New Requests card
        └── First Job Location card
```

Every gap is either `16px` or `24px`. There is no distinction between:
- The gap between two KPI cards (siblings in a grid) → 16px
- The gap between the KPI section and the Content section (major section break) → 24px
- The gap between Schedule and Requests (sibling content cards) → 24px

They're all nearly the same. The eye can't tell where one section ends and another begins.

### The Macro/Micro Whitespace Model

**Micro-whitespace** (4px–16px): Within components. Between a title and subtitle. Between rows in a list. Inside a card's padding.

**Meso-whitespace** (16px–24px): Between sibling components at the same hierarchy level. Between KPI cards. Between rows.

**Macro-whitespace** (32px–48px): Between major content sections. Between the KPI overview and the detail area. Between the page header and the first content block.

### Current vs. Recommended Spacing Map

| Gap Location | Current | Recommended | Type |
|---|---|---|---|
| Page title → KPI cards | ~24px (inherited) | `40px` (mb-10) | **Macro** — major section break |
| Between KPI cards (horizontal) | `16px` (gap-base) | `16px` | Meso — keep |
| KPI section → Content section | `24px` (mb-6) | `40px` (mb-10) | **Macro** — biggest section break |
| Between content cards (Schedule → Requests) | `24px` (space-y-6) | `24px` | Meso — keep (or 28px) |
| Content cards → Map section | `24px` (space-y-6) | `32px` | Meso/Macro — slight increase |
| Card header → Card body | `0px` (just border) | `0px` | Handled by padding |
| Last card → Page bottom | `32px` (pb-8) | `48px` (pb-12) | **Macro** — page breathing room |

### Implementation

```tsx
// DashboardPage.tsx — Section spacing

// KPI Section: increase bottom margin
<Container variant="flat" padding="none" className="mb-10">  {/* was mb-6 */}
  <Grid gap="base">
    {/* KPI cards */}
  </Grid>
</Container>

// Content sections: keep space-y-6 for sibling cards
<div className="space-y-6">
  {/* Schedule card */}
  {/* Requests card */}
  {/* Map card */}
</div>
```

### The Two-Column Layout Fix

This is the single most important structural change. Currently, "Today's Schedule" and "New Requests" are stacked in a single column at full width. This means:

- Each list row stretches **1,525px** wide
- "Emergency Pipe Repair" is on pixel 250 while "In Progress" is on pixel 1,500
- The user's eye travels 1,250px horizontally to connect a job title with its status
- Every card wastes massive horizontal space

Switch to a 2-column grid (already proven in the loading skeleton at lines 110-121):

```tsx
// Replace <div className="space-y-6"> with:
<Grid gap="large">
  <Grid.Cell size={{ xs: 12, md: 6 }}>
    {/* Today's Schedule card */}
  </Grid.Cell>
  <Grid.Cell size={{ xs: 12, md: 6 }}>
    {/* New Requests card */}
  </Grid.Cell>
</Grid>

{/* Map card below, full width */}
{stats?.todaysJobs?.[0]?.address && (
  <div className="mt-6">
    {/* Map card */}
  </div>
)}
```

This cuts the row scan distance from 1,525px → ~700px. That's the single biggest scannability improvement you can make.

---

## 5. Summary — Priority Implementation Order

### P0 — Do These First (Biggest Impact, Smallest Effort)

| Change | File | What to do |
|---|---|---|
| Add max-width to dashboard | `DashboardPage.tsx:209` | Add `max-w-7xl mx-auto w-full` to Page className |
| Increase content gutter | `AppLayout.tsx:138` | Change `px-4` to `px-6 lg:px-10` |
| Two-column layout for Schedule + Requests | `DashboardPage.tsx:292` | Replace `space-y-6` div with `Grid` (2-col) |
| Increase KPI → Content gap | `DashboardPage.tsx:215` | Change `mb-6` to `mb-10` |

### P1 — Do These Next (Refinement)

| Change | File | What to do |
|---|---|---|
| Card header padding increase | `DashboardPage.tsx:297,360,405` | Change `px-4 py-3` to `px-6 py-4` |
| Card body padding increase | `Card.tsx:126` | Change `p-4` to `px-6 py-5` |
| Upgrade shadow system | `Card.tsx:89-93` | Replace `shadow-sm`/`shadow-md` with double-shadow tokens |
| Soften border colors | `Card.tsx:173` | Replace `border-[--color-border]` with `border-black/[0.06]` |
| Add page bottom breathing | `DashboardPage.tsx:212` | Change `pb-8` to `pb-12` |

### P2 — Polish

| Change | File | What to do |
|---|---|---|
| Background tint separation | `AppLayout.tsx` or theme tokens | Make page bg slightly distinct from card bg |
| Schedule row padding | `DashboardPage.tsx:310` | Add `py-3.5 px-4` to row items |
| Hover micro-interaction on KPI | `DashboardPage.tsx:220-231` | Add `hover:-translate-y-0.5 transition-transform` |
| Hide map when API key missing | `DashboardPage.tsx:401` | Conditionally render only when map is functional |

---

## Visual Comparison — Before vs. After

### Before (Current)
```
|████████████|░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░|
|  Sidebar   |  Welcome back!                                               |
|            |  [KPI] [KPI] [KPI] [KPI] ← stretched across 1600px           |
|            |  [Today's Schedule ← 1525px wide card →                 ]     |
|            |  [New Requests ← 1525px wide card →                     ]     |
|            |  [Map ← 1525px wide card →                              ]     |
|████████████|░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░|
  1px gap ↑    ↑ 16px padding
```

### After (Recommended)
```
|████████████|      ┌─────────────────────────────────────────┐              |
|  Sidebar   |      │  Welcome back!                          │              |
|            |      │  [KPI] [KPI] [KPI] [KPI]  ← max 1280px │              |
|            |      │                                         │              |
|            |      │  [Schedule ← 620px] [Requests ← 620px] │              |
|            |      │                                         │              |
|            |      │  [Map section ← 1280px]                 │              |
|            |      └─────────────────────────────────────────┘              |
|████████████|                                                               |
   ↑ border    ↑ 40px gutter              centered content     40px gutter ↑
```

---

## Final Note

The bones of this app are solid. The component architecture (Card compound components, the Atlantis design system, the Frame/Content/Page hierarchy) is well-structured for a CRM. The data is there, the functionality works, the sidebar nav is clean.

The issue isn't design skill — it's that the layout was built "content-first" without establishing spatial constraints. Once you add the max-width, the gutter, and the two-column grid, the existing components will look dramatically better without changing their internals. The shadow and padding refinements are polish on top of a structural fix.

Start with the P0 list. Four changes, maybe 8 lines of code total, and it'll feel like a different product.
