/**
 * Atlantis Grid Component
 *
 * Matches @jobber/components Grid API for migration path.
 * Grid provides a responsive grid layout system using CSS Grid.
 *
 * @example
 * <Grid>
 *   <Grid.Cell size={{ xs: 12, md: 6, lg: 3 }}>
 *     <Card>Item 1</Card>
 *   </Grid.Cell>
 *   <Grid.Cell size={{ xs: 12, md: 6, lg: 3 }}>
 *     <Card>Item 2</Card>
 *   </Grid.Cell>
 * </Grid>
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Responsive size values for Grid.Cell */
export interface GridCellSize {
  /** Size on extra small screens (default column size if larger sizes not specified) */
  xs?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Size on small screens and up (640px+) */
  sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Size on medium screens and up (768px+) */
  md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Size on large screens and up (1024px+) */
  lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Size on extra large screens and up (1280px+) */
  xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

export interface GridProps {
  /** Child Grid.Cell elements */
  readonly children: ReactNode;
  /** Gap between grid items */
  readonly gap?: 'none' | 'small' | 'base' | 'large';
  /** Additional class name */
  readonly className?: string;
}

export interface GridCellProps {
  /** Cell content */
  readonly children: ReactNode;
  /**
   * Size of the cell in grid columns (out of 12).
   * Can be a single number or responsive object.
   */
  readonly size?: number | GridCellSize;
  /** Additional class name */
  readonly className?: string;
}

const gapClasses = {
  none: 'gap-0',
  small: 'gap-2',
  base: 'gap-4',
  large: 'gap-6',
} as const;

// Tailwind classes for grid column spans
const columnSpanClasses: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
};

const smColumnSpanClasses: Record<number, string> = {
  1: 'sm:col-span-1',
  2: 'sm:col-span-2',
  3: 'sm:col-span-3',
  4: 'sm:col-span-4',
  5: 'sm:col-span-5',
  6: 'sm:col-span-6',
  7: 'sm:col-span-7',
  8: 'sm:col-span-8',
  9: 'sm:col-span-9',
  10: 'sm:col-span-10',
  11: 'sm:col-span-11',
  12: 'sm:col-span-12',
};

const mdColumnSpanClasses: Record<number, string> = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
  5: 'md:col-span-5',
  6: 'md:col-span-6',
  7: 'md:col-span-7',
  8: 'md:col-span-8',
  9: 'md:col-span-9',
  10: 'md:col-span-10',
  11: 'md:col-span-11',
  12: 'md:col-span-12',
};

const lgColumnSpanClasses: Record<number, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  10: 'lg:col-span-10',
  11: 'lg:col-span-11',
  12: 'lg:col-span-12',
};

const xlColumnSpanClasses: Record<number, string> = {
  1: 'xl:col-span-1',
  2: 'xl:col-span-2',
  3: 'xl:col-span-3',
  4: 'xl:col-span-4',
  5: 'xl:col-span-5',
  6: 'xl:col-span-6',
  7: 'xl:col-span-7',
  8: 'xl:col-span-8',
  9: 'xl:col-span-9',
  10: 'xl:col-span-10',
  11: 'xl:col-span-11',
  12: 'xl:col-span-12',
};

function getCellSizeClasses(size?: number | GridCellSize): string {
  if (size === undefined) {
    return 'col-span-12';
  }

  if (typeof size === 'number') {
    return columnSpanClasses[size] || 'col-span-12';
  }

  const classes: string[] = [];

  // XS is the default/base size
  if (size.xs) {
    classes.push(columnSpanClasses[size.xs]);
  } else {
    classes.push('col-span-12');
  }

  if (size.sm) {
    classes.push(smColumnSpanClasses[size.sm]);
  }

  if (size.md) {
    classes.push(mdColumnSpanClasses[size.md]);
  }

  if (size.lg) {
    classes.push(lgColumnSpanClasses[size.lg]);
  }

  if (size.xl) {
    classes.push(xlColumnSpanClasses[size.xl]);
  }

  return classes.join(' ');
}

function GridCell({ children, size, className }: GridCellProps) {
  return (
    <div className={cn(getCellSizeClasses(size), className)}>
      {children}
    </div>
  );
}

export function Grid({ children, gap = 'base', className }: GridProps) {
  return (
    <div className={cn('grid grid-cols-12', gapClasses[gap], className)}>
      {children}
    </div>
  );
}

// Attach Cell as a compound component
Grid.Cell = GridCell;

export type { GridCellSize as GridCellSizeType };
