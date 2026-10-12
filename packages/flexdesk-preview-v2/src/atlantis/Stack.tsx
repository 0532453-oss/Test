/**
 * Atlantis Stack Component
 *
 * Matches @jobber/components Stack API for migration path.
 * Stack provides a vertical or horizontal layout with consistent spacing.
 *
 * @example
 * <Stack gap="base" align="center">
 *   <Button>Action 1</Button>
 *   <Button>Action 2</Button>
 * </Stack>
 */
import type { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export type StackDirection = 'vertical' | 'horizontal';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around';
export type StackGap = 'none' | 'smallest' | 'smaller' | 'small' | 'base' | 'large' | 'larger' | 'largest';

export interface StackProps {
  /** Child elements */
  readonly children: ReactNode;
  /** Stack direction (default: vertical) */
  readonly direction?: StackDirection;
  /** Align items */
  readonly align?: StackAlign;
  /** Justify content */
  readonly justify?: StackJustify;
  /** Gap between items */
  readonly gap?: StackGap;
  /** Make stack take full width */
  readonly grow?: boolean;
  /** Additional class name */
  readonly className?: string;
  /** Additional inline styles */
  readonly style?: CSSProperties;
  /** HTML element to render (default: div) */
  readonly as?: 'div' | 'section' | 'nav' | 'header' | 'footer' | 'aside' | 'ul' | 'ol';
}

const directionClasses: Record<StackDirection, string> = {
  'vertical': 'flex-col',
  'horizontal': 'flex-row',
};

const alignClasses: Record<StackAlign, string> = {
  'start': 'items-start',
  'center': 'items-center',
  'end': 'items-end',
  'stretch': 'items-stretch',
};

const justifyClasses: Record<StackJustify, string> = {
  'start': 'justify-start',
  'center': 'justify-center',
  'end': 'justify-end',
  'between': 'justify-between',
  'around': 'justify-around',
};

const gapClasses: Record<StackGap, string> = {
  'none': 'gap-0',
  'smallest': 'gap-0.5',
  'smaller': 'gap-1',
  'small': 'gap-2',
  'base': 'gap-3',
  'large': 'gap-4',
  'larger': 'gap-6',
  'largest': 'gap-8',
};

export function Stack({
  children,
  direction = 'vertical',
  align = 'stretch',
  justify = 'start',
  gap = 'base',
  grow = false,
  className,
  style,
  as: Component = 'div',
}: StackProps) {
  return (
    <Component
      className={cn(
        'flex',
        directionClasses[direction],
        alignClasses[align],
        justifyClasses[justify],
        gapClasses[gap],
        grow && 'flex-grow w-full',
        className
      )}
      style={style}
    >
      {children}
    </Component>
  );
}
