/**
 * Atlantis Container Component
 *
 * Matches @jobber/components Container API for migration path.
 * Container provides a consistent max-width and horizontal padding
 * for page content. Used within Frame for full app layout.
 *
 * Supports visual variants (elevated, outlined, flat) for use as
 * dashboard card containers with consistent styling.
 *
 * @example
 * // Page-width container (default behavior)
 * <Container>
 *   <Page title="Dashboard">
 *     <Content>...</Content>
 *   </Page>
 * </Container>
 *
 * @example
 * // Dashboard card container with elevation
 * <Container variant="elevated">
 *   <Heading level={3}>Today's Schedule</Heading>
 *   <DataList data={jobs} />
 * </Container>
 *
 * @example
 * // Outlined container for grouped content
 * <Container variant="outlined" padding="large">
 *   <Content>...</Content>
 * </Container>
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ContainerSize = 'small' | 'base' | 'large' | 'fill';

export type ContainerVariant = 'elevated' | 'outlined' | 'flat';

export type ContainerPadding = 'none' | 'small' | 'base' | 'large';

export interface ContainerProps {
  /** Content to display inside the container */
  readonly children: ReactNode;

  /**
   * Size of the container determining max-width.
   * - small: max-width 640px (for forms, narrow content)
   * - base: max-width 1024px (default, good for most pages)
   * - large: max-width 1280px (for wide content, dashboards)
   * - fill: 100% width (no max-width constraint)
   * @default "base"
   */
  readonly size?: ContainerSize;

  /**
   * Visual variant of the container.
   * - elevated: white background with shadow (for dashboard cards)
   * - outlined: white background with border (for grouped content)
   * - flat: white background, no border or shadow (for subtle grouping)
   * When not specified, container acts as a page-width wrapper only.
   */
  readonly variant?: ContainerVariant;

  /**
   * Padding inside the container when a variant is set.
   * - none: no padding
   * - small: 12px (p-3)
   * - base: 16px (p-4), 24px on sm+ (sm:p-6)
   * - large: 24px (p-6), 32px on lg+ (lg:p-8)
   * @default "base"
   */
  readonly padding?: ContainerPadding;

  /**
   * Additional class names for custom styling.
   */
  readonly className?: string;
}

const sizeClasses: Record<ContainerSize, string> = {
  small: 'max-w-2xl',
  base: 'max-w-5xl',
  large: 'max-w-7xl',
  fill: 'w-full',
};

const variantClasses: Record<ContainerVariant, string> = {
  elevated: 'bg-[--color-surface] rounded-xl shadow-sm',
  outlined: 'bg-[--color-surface] rounded-xl border border-[--color-border]',
  flat: 'bg-[--color-surface] rounded-xl',
};

const paddingClasses: Record<ContainerPadding, string> = {
  none: '',
  small: 'p-3',
  base: 'p-4 sm:p-6',
  large: 'p-6 lg:p-8',
};

export function Container({
  children,
  size = 'base',
  variant,
  padding = 'base',
  className,
}: ContainerProps) {
  // When a variant is specified, render as a styled card-like container
  if (variant) {
    return (
      <div
        className={cn(
          variantClasses[variant],
          paddingClasses[padding],
          className,
        )}
      >
        {children}
      </div>
    );
  }

  // Default behavior: page-width wrapper with max-width and horizontal padding
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </div>
  );
}
