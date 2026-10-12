/**
 * StatusLabel - Local implementation matching @jobber/components StatusLabel API
 *
 * This provides the same interface as the Atlantis component library's StatusLabel,
 * allowing future migration to the actual library when fully integrated.
 *
 * A pill-shaped badge with a colored dot indicator and text label, used for:
 * - Entity statuses (client, job, invoice, request)
 * - Priority levels
 * - Category labels
 *
 * @see https://atlantis.getjobber.com/components/StatusLabel
 */
import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Status types matching Atlantis StatusLabel component
 */
export type StatusLabelStatus =
  | 'success'
  | 'warning'
  | 'critical'
  | 'informative'
  | 'inactive';

/**
 * Alignment options for the status indicator dot
 */
export type StatusLabelAlignment = 'start' | 'end';

export interface StatusLabelProps {
  /**
   * Label text to display
   */
  readonly label: string;

  /**
   * Status type determines the color scheme
   * @default "inactive"
   */
  readonly status?: StatusLabelStatus;

  /**
   * Alignment of the status indicator dot
   * @default "start"
   */
  readonly alignment?: StatusLabelAlignment;

  /**
   * Additional CSS class
   */
  readonly className?: string;
}

/**
 * Atlantis-style status colors using design tokens
 * Each status has: dot color, background color, and text color
 * Colors adapt to light/dark theme via CSS custom properties
 */
const statusStyles: Record<StatusLabelStatus, { dot: string; bg: string; text: string }> = {
  success: {
    dot: 'bg-[var(--color-success)]',
    bg: 'bg-[var(--color-success--surface)]',
    text: 'text-[var(--color-success--text)]',
  },
  warning: {
    dot: 'bg-[var(--color-warning)]',
    bg: 'bg-[var(--color-warning--surface)]',
    text: 'text-[var(--color-warning--text)]',
  },
  critical: {
    dot: 'bg-[var(--color-critical)]',
    bg: 'bg-[var(--color-critical--surface)]',
    text: 'text-[var(--color-critical--text)]',
  },
  informative: {
    dot: 'bg-[var(--color-informative)]',
    bg: 'bg-[var(--color-informative--surface)]',
    text: 'text-[var(--color-informative--text)]',
  },
  inactive: {
    dot: 'bg-[var(--color-inactive)]',
    bg: 'bg-[var(--color-inactive--surface)]',
    text: 'text-[var(--color-text--secondary)]',
  },
};

/**
 * StatusLabel component following Atlantis/Jobber design system
 *
 * Renders a pill-shaped badge with a colored dot indicator and text label,
 * matching the Jobber Atlantis design system StatusLabel component.
 */
export function StatusLabel({
  label,
  status = 'inactive',
  alignment = 'start',
  className,
}: StatusLabelProps) {
  const styles = statusStyles[status];

  const dotElement = (
    <span
      className={cn('rounded-full flex-shrink-0 h-2 w-2 min-w-2', styles.dot)}
      aria-hidden="true"
    />
  );

  return (
    <div
      role="status"
      className={cn(
        'inline-flex items-center gap-2',
        'px-3 py-1',
        'rounded-full',
        'text-xs font-medium',
        styles.bg,
        styles.text,
        className
      )}
    >
      {alignment === 'start' && dotElement}
      {label}
      {alignment === 'end' && dotElement}
    </div>
  );
}

export default StatusLabel;
