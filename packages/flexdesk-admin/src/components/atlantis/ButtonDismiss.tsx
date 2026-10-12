/**
 * ButtonDismiss - Local implementation matching @jobber/components ButtonDismiss API
 *
 * This provides the same interface as the Atlantis component library's ButtonDismiss,
 * allowing future migration to the actual library when fully integrated.
 *
 * Used for close/dismiss actions on modals, drawers, alerts, and popovers.
 */
import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonDismissProps {
  /**
   * Click handler for dismiss action
   */
  onClick?(
    event: React.MouseEvent<HTMLButtonElement>,
  ): void;

  /**
   * Accessible label for screen readers (required)
   */
  readonly ariaLabel: string;

  /**
   * Additional CSS class names
   */
  readonly className?: string;
}

/**
 * ButtonDismiss component following Atlantis/Jobber design system
 *
 * A tertiary subtle button with a "remove" (X) icon for dismiss actions.
 * Used for closing modals, drawers, alerts, and popovers.
 */
export function ButtonDismiss({ onClick, ariaLabel, className }: ButtonDismissProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        // Base styles matching Atlantis tertiary subtle button
        'inline-flex items-center justify-center',
        'h-8 w-8 rounded-md',
        'bg-transparent text-muted-foreground',
        'hover:bg-muted hover:text-foreground',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'transition-colors duration-200',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">{ariaLabel}</span>
    </button>
  );
}

export default ButtonDismiss;
