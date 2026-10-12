import * as React from 'react';
import { Icon, type IconNames } from './Icon';
import { Spinner } from './Spinner';
import { Text } from './Text';
import { Heading } from './Heading';
import { ButtonDismiss } from './ButtonDismiss';

/**
 * Banner Component - Atlantis-style page-level alert banner
 *
 * Matches @jobber/components Banner API:
 * - type: "notice" (info), "success", "warning", "error"
 * - dismissible: whether to show close button
 * - onDismiss: callback when dismissed
 * - primaryAction: optional primary action button
 * - children: banner content
 */

export type BannerType = 'notice' | 'success' | 'warning' | 'error';

export interface BannerAction {
  label: string;
  onClick: () => void;
  loading?: boolean;
}

export interface BannerProps {
  /**
   * The type/variant of the banner
   * @default "notice"
   */
  type?: BannerType;

  /**
   * Whether the banner can be dismissed
   * @default false
   */
  dismissible?: boolean;

  /**
   * Callback when the banner is dismissed
   */
  onDismiss?: () => void;

  /**
   * Optional primary action button
   */
  primaryAction?: BannerAction;

  /**
   * The banner content
   */
  children: React.ReactNode;

  /**
   * Optional title for the banner
   */
  title?: string;

  /**
   * Additional CSS class name
   */
  className?: string;
}

// Map banner types to icon names and colors using Atlantis design tokens
const bannerTypeConfig: Record<BannerType, { icon: IconNames; iconColor: string; bgColor: string; borderColor: string; textColor: string }> = {
  notice: {
    icon: 'info',
    iconColor: 'text-[var(--color-informative--text)]',
    bgColor: 'bg-[var(--color-informative--surface)]',
    borderColor: 'border-[var(--color-informative--border)]',
    textColor: 'text-[var(--color-informative--text)]',
  },
  success: {
    icon: 'checkmark',
    iconColor: 'text-[var(--color-success--text)]',
    bgColor: 'bg-[var(--color-success--surface)]',
    borderColor: 'border-[var(--color-success--border)]',
    textColor: 'text-[var(--color-success--text)]',
  },
  warning: {
    icon: 'warning',
    iconColor: 'text-[var(--color-warning--text)]',
    bgColor: 'bg-[var(--color-warning--surface)]',
    borderColor: 'border-[var(--color-warning--border)]',
    textColor: 'text-[var(--color-warning--text)]',
  },
  error: {
    icon: 'warning',
    iconColor: 'text-[var(--color-critical--text)]',
    bgColor: 'bg-[var(--color-critical--surface)]',
    borderColor: 'border-[var(--color-critical--border)]',
    textColor: 'text-[var(--color-critical--text)]',
  },
};

/**
 * Banner component for displaying page-level alerts and notifications.
 *
 * @example
 * // Error banner
 * <Banner type="error" title="Error" dismissible onDismiss={() => setError(null)}>
 *   Something went wrong. Please try again.
 * </Banner>
 *
 * @example
 * // Success banner with action
 * <Banner
 *   type="success"
 *   title="Saved"
 *   primaryAction={{ label: "View", onClick: () => navigate('/view') }}
 * >
 *   Your changes have been saved.
 * </Banner>
 *
 * @example
 * // Info banner
 * <Banner type="notice">
 *   This is an informational message.
 * </Banner>
 */
export function Banner({
  type = 'notice',
  dismissible = false,
  onDismiss,
  primaryAction,
  children,
  title,
  className = '',
}: BannerProps) {
  const config = bannerTypeConfig[type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        relative flex items-start gap-3 p-4 rounded-lg border
        ${config.bgColor} ${config.borderColor}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
        <Icon name={config.icon} size="base" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <Heading level={4} className={`mb-1 ${config.textColor}`}>
            {title}
          </Heading>
        )}
        <div className={config.textColor}>
          {typeof children === 'string' ? (
            <Text element="span">{children}</Text>
          ) : (
            children
          )}
        </div>

        {/* Primary Action */}
        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            disabled={primaryAction.loading}
            className={`
              mt-3 inline-flex items-center gap-2 text-sm font-medium
              underline underline-offset-2 hover:no-underline
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-interactive)]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${config.textColor}
            `.trim().replace(/\s+/g, ' ')}
          >
            {primaryAction.loading && (
              <Spinner size="small" />
            )}
            {primaryAction.label}
          </button>
        )}
      </div>

      {/* Dismiss Button */}
      {dismissible && onDismiss && (
        <div className="flex-shrink-0">
          <ButtonDismiss
            onClick={onDismiss}
            ariaLabel="Dismiss banner"
          />
        </div>
      )}
    </div>
  );
}

export default Banner;
