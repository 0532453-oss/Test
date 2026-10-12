/**
 * FlexDesk Mobile -- Design Tokens
 *
 * Typography, spacing (8 pt grid), radii, shadows, and component dimensions.
 * Uses iOS system font (SF Pro) via React Native's default `System` family.
 */

import { Platform } from 'react-native';

// ── Font family (SF Pro on iOS, Roboto on Android) ──────────────────────────
const SYSTEM_FONT = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

// ── Font weights (numeric strings for React Native) ─────────────────────────
export const fontWeight = {
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
} as const;

// ── Font sizes ──────────────────────────────────────────────────────────────
export const fontSize = {
  xs:       11,
  sm:       12,
  caption:  13,
  body:     14,
  bodyLg:   15,
  md:       16,
  lg:       18,
  xl:       20,
  xxl:      22,
  title:    24,
  metric:   28,
  hero:     32,
  display:  48,
} as const;

// ── Line heights (approx 1.35 - 1.5x font size, rounded to even numbers) ──
export const lineHeight = {
  xs:       16,
  sm:       16,
  caption:  18,
  body:     20,
  bodyLg:   22,
  md:       22,
  lg:       24,
  xl:       28,
  xxl:      30,
  title:    32,
  metric:   36,
  hero:     40,
  display:  56,
} as const;

// ── Pre-composed text styles ────────────────────────────────────────────────
export const typography = {
  screenTitle: {
    fontFamily: SYSTEM_FONT,
    fontSize: fontSize.title,
    lineHeight: lineHeight.title,
    fontWeight: fontWeight.bold,
  },
  sectionHeader: {
    fontFamily: SYSTEM_FONT,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontWeight: fontWeight.semibold,
  },
  cardTitle: {
    fontFamily: SYSTEM_FONT,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.semibold,
  },
  cardTitleSm: {
    fontFamily: SYSTEM_FONT,
    fontSize: fontSize.bodyLg,
    lineHeight: lineHeight.bodyLg,
    fontWeight: fontWeight.semibold,
  },
  body: {
    fontFamily: SYSTEM_FONT,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: fontWeight.regular,
  },
  bodyMedium: {
    fontFamily: SYSTEM_FONT,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: fontWeight.medium,
  },
  caption: {
    fontFamily: SYSTEM_FONT,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.regular,
  },
  captionMd: {
    fontFamily: SYSTEM_FONT,
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
    fontWeight: fontWeight.regular,
  },
  metricLarge: {
    fontFamily: SYSTEM_FONT,
    fontSize: fontSize.hero,
    lineHeight: lineHeight.hero,
    fontWeight: fontWeight.bold,
  },
  metricMedium: {
    fontFamily: SYSTEM_FONT,
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.xxl,
    fontWeight: fontWeight.bold,
  },
  metricOutstanding: {
    fontFamily: SYSTEM_FONT,
    fontSize: fontSize.metric,
    lineHeight: lineHeight.metric,
    fontWeight: fontWeight.bold,
  },
  pillLabel: {
    fontFamily: SYSTEM_FONT,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontWeight: fontWeight.semibold,
  },
  countBadge: {
    fontFamily: SYSTEM_FONT,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.medium,
  },
} as const;

// ── Spacing (8 pt grid) ─────────────────────────────────────────────────────
export const spacing = {
  xxs:  2,
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  xxxxl: 48,
} as const;

// ── Border radius ───────────────────────────────────────────────────────────
export const radius = {
  xs:     4,
  sm:     8,
  md:     12,
  lg:     14,
  xl:     16,
  xxl:    20,
  pill:   24,
  circle: 9999,
} as const;

// ── Shadows (React Native style objects) ────────────────────────────────────
export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLight: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardSubtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  fab: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  bottomSheet: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ── Component dimensions ────────────────────────────────────────────────────
export const size = {
  // Tap targets
  minTapTarget:        44,

  // Header
  headerHeight:        56,

  // Tab bar
  tabBarContentHeight: 52,
  tabBarTotalHeight:   80,  // Includes safe-area bottom inset on notched phones
  tabBarBorderWidth:   1,

  // FAB
  fabSize:             56,
  fabIconSize:         24,
  fabBottomOffset:     16,  // Above tab bar

  // Dashboard health ring
  healthRingDiameter:  160,
  healthRingStroke:    10,
  healthRingDivider:   40,  // Width of small divider line inside ring

  // Metric cards (dashboard 2x2)
  metricIconCircle:    28,

  // Client list
  clientAvatar:        36,

  // Calendar
  weekDayCircle:       32,  // Today indicator circle
  weekDotSize:         6,   // Has-jobs indicator dot
  jobStatusBarWidth:   4,   // Left color bar on job cards

  // Bottom sheet
  sheetHandleWidth:    40,
  sheetHandleHeight:   4,
  sheetTopRadius:      20,

  // Status pill
  pillPaddingH:        10,
  pillPaddingV:        6,
  pillRadius:          8,

  // Icons (default)
  iconSm:              16,
  iconMd:              20,
  iconLg:              24,
  iconXl:              40,

  // Skeleton loading
  skeletonCycleDuration: 1200, // ms

  // Avatar initials
  avatarFontSize:      14,

  // Empty-state illustration placeholder
  emptyIllustration:   100,
  emptyIllustrationLg: 120,
} as const;

// ── Animation durations (ms) ────────────────────────────────────────────────
export const duration = {
  fast:     100,
  normal:   150,
  expand:   200,
  slide:    250,
} as const;

// ── Press feedback ──────────────────────────────────────────────────────────
export const pressFeedback = {
  scale:   0.98,
  opacity: 0.85,
} as const;

// ── Convenience re-export ───────────────────────────────────────────────────
export const tokens = {
  fontWeight,
  fontSize,
  lineHeight,
  typography,
  spacing,
  radius,
  shadows,
  size,
  duration,
  pressFeedback,
} as const;

export type Tokens = typeof tokens;
