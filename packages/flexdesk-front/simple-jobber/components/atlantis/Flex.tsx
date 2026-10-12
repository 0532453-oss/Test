/**
 * Atlantis Flex Component
 *
 * Matches @jobber/components Flex API for migration path.
 * Flex provides a flexible layout system using CSS Flexbox.
 *
 * @example
 * <Flex gap="base" align="center" wrap>
 *   <Button>Action 1</Button>
 *   <Button>Action 2</Button>
 * </Flex>
 */
import type { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
export type FlexAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type FlexJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type FlexGap = 'none' | 'smallest' | 'smaller' | 'small' | 'base' | 'large' | 'larger' | 'largest';

export interface FlexProps {
  /** Child elements */
  readonly children: ReactNode;
  /** Flex direction */
  readonly direction?: FlexDirection;
  /** Align items */
  readonly align?: FlexAlign;
  /** Justify content */
  readonly justify?: FlexJustify;
  /** Gap between items */
  readonly gap?: FlexGap;
  /** Whether items can wrap to next line */
  readonly wrap?: boolean;
  /** Make flex container take full width */
  readonly grow?: boolean;
  /** Additional class name */
  readonly className?: string;
  /** Additional inline styles */
  readonly style?: CSSProperties;
  /** HTML element to render (default: div) */
  readonly as?: 'div' | 'section' | 'nav' | 'header' | 'footer' | 'aside' | 'main' | 'ul' | 'ol';
}

const directionClasses: Record<FlexDirection, string> = {
  'row': 'flex-row',
  'row-reverse': 'flex-row-reverse',
  'column': 'flex-col',
  'column-reverse': 'flex-col-reverse',
};

const alignClasses: Record<FlexAlign, string> = {
  'start': 'items-start',
  'center': 'items-center',
  'end': 'items-end',
  'stretch': 'items-stretch',
  'baseline': 'items-baseline',
};

const justifyClasses: Record<FlexJustify, string> = {
  'start': 'justify-start',
  'center': 'justify-center',
  'end': 'justify-end',
  'between': 'justify-between',
  'around': 'justify-around',
  'evenly': 'justify-evenly',
};

const gapClasses: Record<FlexGap, string> = {
  'none': 'gap-0',
  'smallest': 'gap-0.5',
  'smaller': 'gap-1',
  'small': 'gap-2',
  'base': 'gap-3',
  'large': 'gap-4',
  'larger': 'gap-6',
  'largest': 'gap-8',
};

export function Flex({
  children,
  direction = 'row',
  align = 'stretch',
  justify = 'start',
  gap = 'none',
  wrap = false,
  grow = false,
  className,
  style,
  as: Component = 'div',
}: FlexProps) {
  return (
    <Component
      className={cn(
        'flex',
        directionClasses[direction],
        alignClasses[align],
        justifyClasses[justify],
        gapClasses[gap],
        wrap && 'flex-wrap',
        grow && 'flex-grow w-full',
        className
      )}
      style={style}
    >
      {children}
    </Component>
  );
}
