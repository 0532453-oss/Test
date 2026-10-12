/**
 * FlexDesk Mobile -- Color Tokens
 *
 * Warm, Alma-inspired palette for a calm and approachable field-service CRM.
 * Every value is referenced by semantic name so screens never use raw hex.
 */

// ── Core brand ──────────────────────────────────────────────────────────────
export const brand = {
  olive:      '#6B8F5E',  // Primary accent (rings, active tab, CTAs)
  oliveDark:  '#3D5A3E',  // FAB background, deepest green
  oliveLight: '#8DB07E',  // Hover / highlight variant
} as const;

// ── Backgrounds ─────────────────────────────────────────────────────────────
export const background = {
  screen:       '#FAF8F5', // Warm off-white canvas
  card:         '#FFFFFF', // Card / sheet surface
  input:        '#F5F2EE', // Search bars, text inputs
  chipInactive: '#F0EDE8', // Unselected filter chips, count badges
  tipCard:      '#FFF3EB', // Onboarding / tip card (soft peach)
  outstanding:  '#FFF8F0', // Invoice outstanding summary card
  overlay:      'rgba(0,0,0,0.35)', // Bottom-sheet scrim
} as const;

// ── Text ────────────────────────────────────────────────────────────────────
export const text = {
  primary:     '#2C2C2C', // Headings, bold values
  secondary:   '#8A8580', // Labels, captions, sub-info
  muted:       '#B5AFA8', // Placeholders, tertiary info
  onPrimary:   '#FFFFFF', // Text on olive / dark-green surfaces
  onTip:       '#4A4A4A', // Body text on tip-card backgrounds
  link:        '#6B8F5E', // Inline tappable links (olive)
} as const;

// ── Borders & dividers ──────────────────────────────────────────────────────
export const border = {
  light:      '#E8E4DF', // Tab-bar top border, card dividers
  divider:    '#D5D0CA', // Thin in-card separators (e.g. health-ring)
  inputFocus: '#6B8F5E', // Search bar focused border
} as const;

// ── Job-status colors (left-edge bar on calendar cards) ─────────────────────
export const jobStatus = {
  scheduled:  '#90B8DE', // SCHEDULED / DISPATCHED - soft blue
  inProgress: '#E8B44F', // IN_PROGRESS           - warm amber
  completed:  '#6B8F5E', // COMPLETED             - olive green
  cancelled:  '#B5AFA8', // CANCELLED / ON_HOLD   - warm gray
} as const;

// ── Invoice-status pills ────────────────────────────────────────────────────
export const invoiceStatus = {
  paid:      { bg: '#E8F5E9', text: '#2E7D32' },
  sent:      { bg: '#FFF8E1', text: '#F57F17' },
  overdue:   { bg: '#FFF3E0', text: '#D84315' },
  draft:     { bg: '#F0EDE8', text: '#8A8580' },
  cancelled: { bg: '#F0EDE8', text: '#8A8580' },
} as const;

// ── Metric-card icon tint backgrounds (dashboard 2x2 grid) ─────────────────
export const metricIconBg = {
  clients:  '#EDE7F6', // Soft lavender
  jobs:     '#FFF8E1', // Warm yellow
  invoices: '#FFEBEE', // Soft pink
  revenue:  '#E8F5E9', // Pale green
} as const;

// ── Shadows (used with React Native shadow* / elevation props) ──────────────
export const shadow = {
  card: {
    color:   '#000000',
    opacity: 0.06,
    offset:  { width: 0, height: 2 },
    radius:  8,
  },
  cardLight: {
    color:   '#000000',
    opacity: 0.04,
    offset:  { width: 0, height: 1 },
    radius:  4,
  },
  fab: {
    color:   '#000000',
    opacity: 0.15,
    offset:  { width: 0, height: 4 },
    radius:  12,
  },
} as const;

// ── Skeleton loading ────────────────────────────────────────────────────────
export const skeleton = {
  base:    '#F0EDE8',
  shimmer: '#E8E4DF',
} as const;

// ── Feedback ────────────────────────────────────────────────────────────────
export const feedback = {
  error:        '#D84315',
  errorBg:      '#FFF3E0',
  offlineBanner: '#FFF8E1',
  offlineText:  '#F57F17',
  toastErrorBg: '#D84315',
  toastErrorText: '#FFFFFF',
} as const;

// ── Convenience re-export ───────────────────────────────────────────────────
export const colors = {
  brand,
  background,
  text,
  border,
  jobStatus,
  invoiceStatus,
  metricIconBg,
  shadow,
  skeleton,
  feedback,
} as const;

export type Colors = typeof colors;
