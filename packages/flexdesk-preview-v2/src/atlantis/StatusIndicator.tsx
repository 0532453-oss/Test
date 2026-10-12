/**
 * StatusIndicator - Local implementation matching @jobber/components StatusIndicator API
 *
 * This provides the same interface as the Atlantis component library's StatusIndicator,
 * allowing future migration to the actual library when fully integrated.
 *
 * Used for showing status with icon and label, particularly useful for:
 * - Trend indicators (up/down/neutral)
 * - Status displays
 * - Compact status information
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { Icon, type IconNames } from './Icon';

export type StatusIndicatorStatus =
  | 'success'
  | 'warning'
  | 'critical'
  | 'informative'
  | 'inactive';

export interface StatusIndicatorProps {
  /**
   * Label text to display next to the indicator
   */
  readonly label?: string;

  /**
   * Status type determines the color scheme
   * @default "inactive"
   */
  readonly status?: StatusIndicatorStatus;

  /**
   * Icon to display. If not provided, a default status dot is shown
   */
  readonly icon?: IconNames;

  /**
   * Additional CSS class
   */
  readonly className?: string;
}

/**
 * Map status to color classes using Atlantis design tokens
 */
const statusColors: Record<StatusIndicatorStatus, { icon: string; text: string }> = {
  success: {
    icon: 'text-[var(--color-success--text)]',
    text: 'text-[var(--color-success--text)]',
  },
  warning: {
    icon: 'text-[var(--color-warning--text)]',
    text: 'text-[var(--color-warning--text)]',
  },
  critical: {
    icon: 'text-[var(--color-critical--text)]',
    text: 'text-[var(--color-critical--text)]',
  },
  informative: {
    icon: 'text-[var(--color-informative--text)]',
    text: 'text-[var(--color-informative--text)]',
  },
  inactive: {
    icon: 'text-[var(--color-inactive)]',
    text: 'text-[var(--color-text--secondary)]',
  },
};

/**
 * StatusIndicator component following Atlantis/Jobber design system
 */
export function StatusIndicator({
  label,
  status = 'inactive',
  icon,
  className,
}: StatusIndicatorProps) {
  const colors = statusColors[status];

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {icon ? (
        <span className={cn('flex-shrink-0', colors.icon)}>
          <Icon name={icon} size="small" />
        </span>
      ) : (
        <span
          className={cn(
            'flex-shrink-0 h-2 w-2 rounded-full',
            status === 'success' && 'bg-[var(--color-success)]',
            status === 'warning' && 'bg-[var(--color-warning)]',
            status === 'critical' && 'bg-[var(--color-critical)]',
            status === 'informative' && 'bg-[var(--color-informative)]',
            status === 'inactive' && 'bg-[var(--color-inactive)]'
          )}
        />
      )}
      {label && (
        <span className={cn('text-xs font-medium', colors.text)}>
          {label}
        </span>
      )}
    </span>
  );
}

export default StatusIndicator;
