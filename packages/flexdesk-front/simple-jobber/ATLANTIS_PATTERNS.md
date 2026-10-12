# Atlantis Design Patterns Guide

## Overview

This document defines the Atlantis design patterns used throughout the FlexDesk application. All UI components and pages follow these patterns for visual consistency and theme support.

## 1. Color Patterns

### Design Token Architecture

All colors are defined as CSS custom properties in `AtlantisThemeContext.tsx` and automatically adapt to light/dark themes.

**Never use Tailwind built-in color classes** (e.g., `bg-blue-500`, `text-red-600`, `dark:bg-green-950`). Always use Atlantis CSS custom properties via Tailwind's arbitrary value syntax.

### Surface Colors

| Token | Usage | Tailwind Class |
|-------|-------|----------------|
| `--color-surface` | Primary background (cards, modals, inputs) | `bg-[--color-surface]` |
| `--color-surface--background` | Page/section background | `bg-[--color-surface--background]` |
| `--color-surface--hover` | Hover states, muted backgrounds | `bg-[--color-surface--hover]` |
| `--color-surface--reverse` | Inverted background | `bg-[--color-surface--reverse]` |

### Text Colors

| Token | Usage | Tailwind Class |
|-------|-------|----------------|
| `--color-text` | Primary text | `text-[--color-text]` |
| `--color-text--secondary` | Secondary/subdued text | `text-[--color-text--secondary]` |
| `--color-text--reverse` | Text on dark backgrounds | `text-[--color-text--reverse]` |

### Interactive Colors

| Token | Usage | Tailwind Class |
|-------|-------|----------------|
| `--color-interactive` | Primary actions, links, active states | `bg-[--color-interactive]`, `text-[--color-interactive]` |
| `--color-interactive--hover` | Hover state for interactive elements | `hover:bg-[--color-interactive--hover]` |
| `--color-interactive--subtle` | Selected rows, subtle highlights | `bg-[--color-interactive--subtle]` |

### Semantic Status Colors

Each status has three tokens: base (dot/icon), surface (background), text (label), and border.

| Status | Base | Surface | Text | Border |
|--------|------|---------|------|--------|
| Success | `--color-success` | `--color-success--surface` | `--color-success--text` | `--color-success--border` |
| Warning | `--color-warning` | `--color-warning--surface` | `--color-warning--text` | `--color-warning--border` |
| Critical | `--color-critical` | `--color-critical--surface` | `--color-critical--text` | `--color-critical--border` |
| Informative | `--color-informative` | `--color-informative--surface` | `--color-informative--text` | `--color-informative--border` |
| Inactive | `--color-inactive` | `--color-inactive--surface` | `--color-text--secondary` | `--color-border` |

**Example - Status badge:**
```tsx
// Correct
'bg-[--color-success--surface] text-[--color-success--text]'

// Wrong - never use Tailwind colors
'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
```

### Border Colors

| Token | Usage | Tailwind Class |
|-------|-------|----------------|
| `--color-border` | Default borders | `border-[--color-border]` |
| `--color-border--hover` | Hover state borders | `border-[--color-border--hover]` |

## 2. Spacing Patterns

### Spacing Scale (Box Component)

Use the Box component's spacing tokens or their Tailwind equivalents:

| Token | Value | Tailwind |
|-------|-------|----------|
| `none` | 0px | `p-0`, `gap-0` |
| `smallest` | 4px | `p-1`, `gap-1` |
| `smaller` | 8px | `p-2`, `gap-2` |
| `small` | 12px | `p-3`, `gap-3` |
| `base` | 16px | `p-4`, `gap-4` |
| `large` | 24px | `p-6`, `gap-6` |
| `larger` | 32px | `p-8`, `gap-8` |
| `largest` | 48px | `p-12`, `gap-12` |

### Spacing Rules

1. **Avoid fractional values**: Do not use `gap-1.5`, `py-0.5`, `px-2.5`, `py-2.5`. Round to the nearest whole token value.
2. **Prefer gap over margin**: Use `gap-*` on flex/grid containers instead of individual `mt-*`/`mb-*` on children.
3. **Use Box component for complex layouts**: When spacing requires per-side control, use the Box component.

## 3. Typography Patterns

### Font Sizes

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--typography-fontSize-small` | 12px | `text-xs` | Hints, captions, badges |
| `--typography-fontSize-base` | 14px | `text-sm` | Body text, labels, buttons |
| `--typography-fontSize-large` | 16px | `text-base` | Section headers |

### Typography Rules

1. Use the `Text` component for body text with `size` and `variation` props.
2. Use the `Heading` component for headings with semantic `level` props.
3. Do not mix raw Tailwind text classes with Text/Heading components.

## 4. Border & Radius Patterns

### Border Widths

| Token | Value | CSS Variable |
|-------|-------|-------------|
| `border-base` | 1px | `--border-base` |
| `border-thick` | 2px | `--border-thick` |

### Border Radius

| Token | Value | Tailwind |
|-------|-------|----------|
| `radius-small` | 4px | `rounded` |
| `radius-base` | 8px | `rounded-lg` |
| `radius-large` | 16px | `rounded-2xl` |
| `radius-larger` | 24px | `rounded-3xl` |
| `circle` | 100% | `rounded-full` |

## 5. Shadow Patterns

| Token | Tailwind | Usage |
|-------|----------|-------|
| `shadow-base` | `shadow-sm` / `shadow-md` | Cards, containers |
| `shadow-high` | `shadow-xl` | Modals, popovers, dropdowns |

## 6. Dark Mode Pattern

**Never use `dark:` Tailwind prefix for colors.** All colors automatically adapt via CSS custom properties set by `AtlantisThemeContext`.

The only acceptable `dark:` usage is for native browser directives like `dark:[color-scheme:dark]` on native date/time inputs.

## 7. Component Patterns

### Status Badges

Use the token mappings from `types.ts` (`jobStatusColors`, `invoiceStatusColors`, etc.) which are pre-defined using Atlantis tokens.

### Form Inputs

- Input backgrounds: `bg-[--color-surface]`
- Input borders: `border-[--color-border]`
- Focus rings: `ring-[--color-interactive]`
- Error states: `border-[--color-critical]` with `text-[--color-critical]`

### Containers and Cards

- Use `Container` component for section grouping (variants: `elevated`, `outlined`, `flat`)
- Use `Card` component for content cards with accent colors
- Background: `bg-[--color-surface]`
- Border: `border-[--color-border]`
- Radius: `rounded-xl` (radius-large)
