/**
 * Atlantis Divider Component
 *
 * Matches @jobber/components Divider API for migration path.
 * Divider provides a visual separation between content sections.
 *
 * @example
 * <Divider />
 * <Divider direction="vertical" />
 * <Divider size="thick" />
 */
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export type DividerDirection = 'horizontal' | 'vertical';
export type DividerSize = 'thin' | 'base' | 'thick';

export interface DividerProps {
  /** Divider direction (default: horizontal) */
  readonly direction?: DividerDirection;
  /** Divider thickness */
  readonly size?: DividerSize;
  /** Additional class name */
  readonly className?: string;
  /** Additional inline styles */
  readonly style?: CSSProperties;
}

const directionClasses: Record<DividerDirection, string> = {
  'horizontal': 'w-full h-px',
  'vertical': 'h-full w-px',
};

const sizeClasses: Record<DividerDirection, Record<DividerSize, string>> = {
  'horizontal': {
    'thin': 'h-px',
    'base': 'h-[2px]',
    'thick': 'h-1',
  },
  'vertical': {
    'thin': 'w-px',
    'base': 'w-[2px]',
    'thick': 'w-1',
  },
};

export function Divider({
  direction = 'horizontal',
  size = 'thin',
  className,
  style,
}: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation={direction}
      className={cn(
        'bg-[--color-border] shrink-0',
        direction === 'horizontal' ? 'w-full' : 'h-full',
        sizeClasses[direction][size],
        className
      )}
      style={style}
    />
  );
}
