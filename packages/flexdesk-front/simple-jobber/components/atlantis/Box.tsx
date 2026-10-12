/**
 * Atlantis Box Component
 *
 * A layout primitive matching @jobber/components Box API.
 * Box provides a flexible container with consistent design tokens
 * for spacing, borders, radii, backgrounds, and layout control.
 *
 * Used as the foundational shape element for cards, modals, drawers,
 * popovers, and all container-type components in the design system.
 *
 * @example
 * // Simple padded surface
 * <Box padding="base" background="surface" radius="base">
 *   <Text>Content in a box</Text>
 * </Box>
 *
 * @example
 * // Elevated card shape
 * <Box padding="large" background="surface" radius="large" shadow="base">
 *   <Heading level={3}>Card Title</Heading>
 *   <Text>Card content</Text>
 * </Box>
 *
 * @example
 * // Horizontal layout
 * <Box direction="row" gap="base" alignItems="center">
 *   <Icon name="calendar" />
 *   <Text>Scheduled for tomorrow</Text>
 * </Box>
 */
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types - matching Atlantis Box API
// ============================================================================

/** Spacing scale matching Atlantis space tokens */
export type BoxSpacing =
  | 'none'
  | 'smallest'
  | 'smaller'
  | 'small'
  | 'base'
  | 'large'
  | 'larger'
  | 'largest'
  | 'extravagant';

/** Border radius tokens matching Atlantis radius tokens */
export type BoxRadius = 'small' | 'base' | 'large' | 'larger' | 'circle';

/** Shadow elevation tokens matching Atlantis shadow tokens */
export type BoxShadow = 'low' | 'base' | 'high';

/** Semantic background color tokens */
export type BoxBackground =
  | 'surface'
  | 'surface--background'
  | 'surface--hover'
  | 'surface--reverse'
  | 'border'
  | 'interactive'
  | 'interactive--hover'
  | 'critical'
  | 'warning'
  | 'success'
  | 'informative'
  | 'inactive';

/** Border width tokens */
export type BoxBorderWidth = 'base' | 'thick';

/** Dimension values */
export type BoxDimension = number | `${string}%` | 'auto' | 'shrink' | 'grow';

/** Per-side spacing */
export interface BoxSpaceObject {
  readonly top?: BoxSpacing;
  readonly bottom?: BoxSpacing;
  readonly left?: BoxSpacing;
  readonly right?: BoxSpacing;
  readonly horizontal?: BoxSpacing;
  readonly vertical?: BoxSpacing;
}

/** Per-side border width */
export interface BoxBorderObject {
  readonly top?: BoxBorderWidth;
  readonly bottom?: BoxBorderWidth;
  readonly left?: BoxBorderWidth;
  readonly right?: BoxBorderWidth;
}

export interface BoxProps {
  /** HTML element to render as */
  readonly as?: 'div' | 'span' | 'section' | 'article' | 'aside' | 'main';

  /** Semantic background color */
  readonly background?: BoxBackground;

  /** Border width (uniform or per-side) */
  readonly border?: BoxBorderWidth | BoxBorderObject;

  /** Border color (semantic token name) */
  readonly borderColor?: BoxBackground;

  /** Flex direction */
  readonly direction?: CSSProperties['flexDirection'];

  /** Gap between children (flex gap) */
  readonly gap?: BoxSpacing;

  /** Height */
  readonly height?: BoxDimension;

  /** Width */
  readonly width?: BoxDimension;

  /** Margin (uniform or per-side) */
  readonly margin?: BoxSpacing | BoxSpaceObject;

  /** Padding (uniform or per-side) */
  readonly padding?: BoxSpacing | BoxSpaceObject;

  /** Border radius */
  readonly radius?: BoxRadius;

  /** Shadow elevation */
  readonly shadow?: BoxShadow;

  /** CSS position */
  readonly position?: CSSProperties['position'];

  /** Flex justify-content */
  readonly justifyContent?: CSSProperties['justifyContent'];

  /** Flex align-items */
  readonly alignItems?: CSSProperties['alignItems'];

  /** Flex align-self */
  readonly alignSelf?: CSSProperties['alignSelf'];

  /** CSS overflow */
  readonly overflow?: CSSProperties['overflow'];

  /** Whether to preserve whitespace */
  readonly preserveWhiteSpace?: boolean;

  /** Tab index for focusable boxes */
  readonly tabIndex?: number;

  /** Children */
  readonly children?: ReactNode;

  /** Additional CSS class */
  readonly className?: string;

  /** Click handler */
  readonly onClick?: (e: React.MouseEvent<HTMLElement>) => void;

  /** Additional inline styles */
  readonly style?: CSSProperties;
}

// ============================================================================
// Token mappings - Tailwind classes for design tokens
// ============================================================================

/**
 * Spacing token → Tailwind padding/margin classes
 * Maps to Atlantis space tokens:
 *   smallest: 4px, smaller: 8px, small: 12px, base: 16px,
 *   large: 24px, larger: 32px, largest: 48px, extravagant: 64px
 */
const spacingMap: Record<BoxSpacing, string> = {
  none: '0',
  smallest: '1',     // 4px
  smaller: '2',      // 8px
  small: '3',        // 12px
  base: '4',         // 16px
  large: '6',        // 24px
  larger: '8',       // 32px
  largest: '12',     // 48px
  extravagant: '16', // 64px
};

/**
 * Border radius token → Tailwind class
 * Maps to Atlantis radius tokens:
 *   small: 4px (rounded), base: 8px (rounded-lg),
 *   large: 16px (rounded-2xl), larger: 24px (rounded-3xl), circle: 100% (rounded-full)
 */
const radiusClasses: Record<BoxRadius, string> = {
  small: 'rounded',        // 4px
  base: 'rounded-lg',      // 8px
  large: 'rounded-2xl',    // 16px
  larger: 'rounded-3xl',   // 24px
  circle: 'rounded-full',  // 100%
};

/**
 * Shadow token → Tailwind class
 * Maps to Atlantis shadow tokens:
 *   low: subtle shadow, base: card elevation, high: modal/overlay elevation
 */
const shadowClasses: Record<BoxShadow, string> = {
  low: 'shadow-sm',
  base: 'shadow-md',
  high: 'shadow-xl',
};

/**
 * Background color → CSS variable
 */
const backgroundMap: Record<BoxBackground, string> = {
  'surface': 'var(--color-surface)',
  'surface--background': 'var(--color-surface--background)',
  'surface--hover': 'var(--color-surface--hover)',
  'surface--reverse': 'var(--color-surface--reverse)',
  'border': 'var(--color-border)',
  'interactive': 'var(--color-interactive)',
  'interactive--hover': 'var(--color-interactive--hover)',
  'critical': 'var(--color-critical)',
  'warning': 'var(--color-warning)',
  'success': 'var(--color-success)',
  'informative': 'var(--color-informative)',
  'inactive': 'var(--color-inactive)',
};

/**
 * Gap token → Tailwind class
 */
const gapClasses: Record<BoxSpacing, string> = {
  none: 'gap-0',
  smallest: 'gap-1',
  smaller: 'gap-2',
  small: 'gap-3',
  base: 'gap-4',
  large: 'gap-6',
  larger: 'gap-8',
  largest: 'gap-12',
  extravagant: 'gap-16',
};

// ============================================================================
// Utility functions
// ============================================================================

function getPaddingClasses(padding: BoxSpacing | BoxSpaceObject | undefined): string {
  if (!padding) return '';

  if (typeof padding === 'string') {
    return `p-${spacingMap[padding]}`;
  }

  const classes: string[] = [];
  if (padding.horizontal) classes.push(`px-${spacingMap[padding.horizontal]}`);
  if (padding.vertical) classes.push(`py-${spacingMap[padding.vertical]}`);
  if (padding.top) classes.push(`pt-${spacingMap[padding.top]}`);
  if (padding.bottom) classes.push(`pb-${spacingMap[padding.bottom]}`);
  if (padding.left) classes.push(`pl-${spacingMap[padding.left]}`);
  if (padding.right) classes.push(`pr-${spacingMap[padding.right]}`);
  return classes.join(' ');
}

function getMarginClasses(margin: BoxSpacing | BoxSpaceObject | undefined): string {
  if (!margin) return '';

  if (typeof margin === 'string') {
    return `m-${spacingMap[margin]}`;
  }

  const classes: string[] = [];
  if (margin.horizontal) classes.push(`mx-${spacingMap[margin.horizontal]}`);
  if (margin.vertical) classes.push(`my-${spacingMap[margin.vertical]}`);
  if (margin.top) classes.push(`mt-${spacingMap[margin.top]}`);
  if (margin.bottom) classes.push(`mb-${spacingMap[margin.bottom]}`);
  if (margin.left) classes.push(`ml-${spacingMap[margin.left]}`);
  if (margin.right) classes.push(`mr-${spacingMap[margin.right]}`);
  return classes.join(' ');
}

function getBorderClasses(border: BoxBorderWidth | BoxBorderObject | undefined): string {
  if (!border) return '';

  if (typeof border === 'string') {
    return border === 'thick' ? 'border-2' : 'border';
  }

  const classes: string[] = [];
  if (border.top) classes.push(border.top === 'thick' ? 'border-t-2' : 'border-t');
  if (border.bottom) classes.push(border.bottom === 'thick' ? 'border-b-2' : 'border-b');
  if (border.left) classes.push(border.left === 'thick' ? 'border-l-2' : 'border-l');
  if (border.right) classes.push(border.right === 'thick' ? 'border-r-2' : 'border-r');
  return classes.join(' ');
}

function getDimensionStyle(
  value: BoxDimension | undefined,
  property: 'width' | 'height'
): CSSProperties {
  if (value === undefined || value === 'auto') return {};

  if (value === 'grow') return { [property]: '100%', flex: property === 'width' ? '1 1 auto' : undefined };
  if (value === 'shrink') return { [property]: 'auto', flex: property === 'width' ? '0 0 auto' : undefined };
  if (typeof value === 'number') return { [property]: `${value}px` };
  return { [property]: value };
}

// ============================================================================
// Component
// ============================================================================

export function Box({
  as: Tag = 'div',
  background,
  border,
  borderColor,
  direction,
  gap,
  height,
  width,
  margin,
  padding,
  radius,
  shadow,
  position = 'relative',
  justifyContent,
  alignItems,
  alignSelf,
  overflow,
  preserveWhiteSpace,
  tabIndex,
  children,
  className,
  onClick,
  style,
}: BoxProps) {
  const classes = cn(
    'flex flex-col',
    getPaddingClasses(padding),
    getMarginClasses(margin),
    getBorderClasses(border),
    radius && radiusClasses[radius],
    shadow && shadowClasses[shadow],
    gap && gapClasses[gap],
    preserveWhiteSpace && 'whitespace-pre-wrap',
    className,
  );

  const inlineStyles: CSSProperties = {
    ...(background && { backgroundColor: backgroundMap[background] }),
    ...(borderColor && { borderColor: backgroundMap[borderColor] }),
    ...(direction && { flexDirection: direction }),
    ...(justifyContent && { justifyContent }),
    ...(alignItems && { alignItems }),
    ...(alignSelf && { alignSelf }),
    ...(overflow && { overflow }),
    ...(position && { position }),
    ...getDimensionStyle(width, 'width'),
    ...getDimensionStyle(height, 'height'),
    ...style,
  };

  return (
    <Tag
      className={classes}
      style={inlineStyles}
      tabIndex={tabIndex}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}

export default Box;
