/**
 * ButtonDismiss - Local implementation matching @jobber/components ButtonDismiss API
 *
 * This provides the same interface as the Atlantis component library's ButtonDismiss,
 * allowing future migration to the actual library when fully integrated.
 *
 * Used for close/dismiss actions on modals, drawers, alerts, and popovers.
 */
import React from 'react';
import { Button } from './Button';

export interface ButtonDismissProps {
  /**
   * Click handler for dismiss action
   */
  onClick?(
    event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  ): void;

  /**
   * Accessible label for screen readers (required)
   */
  readonly ariaLabel: string;

  /**
   * Additional CSS class name
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
    <Button
      ariaLabel={ariaLabel}
      icon="remove"
      onClick={onClick}
      type="tertiary"
      variation="subtle"
      className={className}
    />
  );
}

export default ButtonDismiss;
