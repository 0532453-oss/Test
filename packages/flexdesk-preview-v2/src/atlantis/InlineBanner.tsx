/**
 * InlineBanner - A contextual banner for inline tips, guidance, and warnings.
 *
 * Provides a simplified API for the most common inline banner use cases:
 * - Info banners for helpful tips and guidance
 * - Warning banners for scheduling conflicts or cautionary messages
 *
 * Uses the Banner component internally with sensible defaults for inline usage
 * (smaller visual weight, appropriate icons, dismissible by default).
 */
import * as React from 'react';
import { Banner, type BannerType } from './Banner';
import { Text } from './Text';

export interface InlineBannerProps {
  /**
   * The banner variant.
   * - "info": Blue informational banner for tips and guidance
   * - "warning": Yellow warning banner for conflicts or cautions
   * @default "info"
   */
  variant?: 'info' | 'warning';

  /**
   * The message content to display.
   */
  children: React.ReactNode;

  /**
   * Optional title displayed above the message.
   */
  title?: string;

  /**
   * Whether the banner can be dismissed by the user.
   * @default true
   */
  dismissible?: boolean;

  /**
   * Callback when the banner is dismissed.
   */
  onDismiss?: () => void;

  /**
   * Additional CSS class name.
   */
  className?: string;
}

const variantToType: Record<'info' | 'warning', BannerType> = {
  info: 'notice',
  warning: 'warning',
};

/**
 * InlineBanner component for contextual tips and warnings within forms.
 *
 * @example
 * ```tsx
 * // Info banner for guidance
 * <InlineBanner variant="info">
 *   Job numbers are auto-generated if left blank.
 * </InlineBanner>
 *
 * // Warning banner for caution
 * <InlineBanner variant="warning" title="Scheduling conflict">
 *   The selected team member has another job at this time.
 * </InlineBanner>
 * ```
 */
export function InlineBanner({
  variant = 'info',
  children,
  title,
  dismissible = true,
  onDismiss,
  className,
}: InlineBannerProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Banner
      type={variantToType[variant]}
      title={title}
      dismissible={dismissible}
      onDismiss={handleDismiss}
      className={className}
    >
      {typeof children === 'string' ? (
        <Text element="span" size="small">{children}</Text>
      ) : (
        children
      )}
    </Banner>
  );
}

export default InlineBanner;
