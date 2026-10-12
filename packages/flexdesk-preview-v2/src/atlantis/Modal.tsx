/**
 * Modal Component - Atlantis-style modal dialog
 *
 * Matches @jobber/components Modal API for consistent patterns.
 * Provides centered modal dialogs with header, content, and footer sections.
 *
 * @see {@link https://atlantis.getjobber.com/components/modal Atlantis Modal documentation}
 */

import * as React from 'react';
import { ButtonDismiss } from './ButtonDismiss';
import { Button, type ButtonType, type ButtonVariation } from './Button';
import { Heading } from './Heading';

// ============================================================================
// Types
// ============================================================================

export type ModalSize = 'small' | 'medium' | 'large';

export interface ModalAction {
  /** Label text for the action button */
  label: string;
  /** Click handler for the action */
  onClick: () => void;
  /** Button type (primary, secondary, tertiary) */
  type?: ButtonType;
  /** Button variation (work, learning, subtle, destructive) */
  variation?: ButtonVariation;
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Icon name to display in button */
  icon?: string;
}

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal requests to be closed */
  onRequestClose: () => void;
  /** Modal title (displayed in header) */
  title?: React.ReactNode;
  /** Primary action button configuration */
  primaryAction?: ModalAction;
  /** Secondary action button configuration */
  secondaryAction?: ModalAction;
  /** Tertiary action (rendered on left side of footer) */
  tertiaryAction?: ModalAction;
  /** Size of the modal */
  size?: ModalSize;
  /** Whether to show the close button */
  dismissible?: boolean;
  /** Content to render inside the modal */
  children?: React.ReactNode;
  /** Additional CSS class name */
  className?: string;
}

export interface ModalHeaderProps {
  /** Header content/title */
  children?: React.ReactNode;
  /** Additional CSS class name */
  className?: string;
}

export interface ModalContentProps {
  /** Modal body content */
  children?: React.ReactNode;
  /** Additional CSS class name */
  className?: string;
}

export interface ModalFooterProps {
  /** Footer content (typically action buttons) */
  children?: React.ReactNode;
  /** Additional CSS class name */
  className?: string;
}

// ============================================================================
// Size Mapping
// ============================================================================

const sizeClasses: Record<ModalSize, string> = {
  small: 'sm:max-w-sm',
  medium: 'sm:max-w-lg',
  large: 'sm:max-w-2xl',
};

// ============================================================================
// Modal Component
// ============================================================================

export function Modal({
  open,
  onRequestClose,
  title,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  size = 'medium',
  dismissible = true,
  children,
  className = '',
}: ModalProps) {
  // Handle escape key
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) {
        onRequestClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, dismissible, onRequestClose]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && dismissible) {
      onRequestClose();
    }
  };

  const hasFooterActions = primaryAction || secondaryAction || tertiaryAction;
  const hasTitle = title !== undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={hasTitle ? 'modal-title' : undefined}
    >
      {/* Overlay */}
      <div
        className="fixed inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className={`
          relative z-50 w-full max-w-[calc(100%-2rem)] ${sizeClasses[size]}
          bg-white rounded-2xl border border-[var(--color-border)] shadow-xl
          flex flex-col max-h-[calc(100vh-2rem)]
          ${className}
        `}
      >
        {/* Header */}
        {(hasTitle || dismissible) && (
          <div className="flex items-center justify-between p-6 pb-0">
            {hasTitle && (
              <Heading id="modal-title" level={3} element="h2">
                {title}
              </Heading>
            )}
            {dismissible && (
              <ButtonDismiss
                ariaLabel="Close modal"
                onClick={onRequestClose}
                className={hasTitle ? '' : 'ml-auto'}
              />
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {hasFooterActions && (
          <div className="flex items-center justify-between gap-2 p-6 pt-0">
            {/* Tertiary action (left aligned) */}
            <div>
              {tertiaryAction && (
                <Button
                  type="tertiary"
                  variation={tertiaryAction.variation || 'subtle'}
                  onClick={tertiaryAction.onClick}
                  loading={tertiaryAction.loading}
                  disabled={tertiaryAction.disabled}
                >
                  {tertiaryAction.label}
                </Button>
              )}
            </div>

            {/* Primary and secondary actions (right aligned) */}
            <div className="flex items-center gap-2">
              {secondaryAction && (
                <Button
                  type={secondaryAction.type || 'secondary'}
                  variation={secondaryAction.variation || 'subtle'}
                  onClick={secondaryAction.onClick}
                  loading={secondaryAction.loading}
                  disabled={secondaryAction.disabled}
                >
                  {secondaryAction.label}
                </Button>
              )}
              {primaryAction && (
                <Button
                  type={primaryAction.type || 'primary'}
                  variation={primaryAction.variation || 'work'}
                  onClick={primaryAction.onClick}
                  loading={primaryAction.loading}
                  disabled={primaryAction.disabled}
                >
                  {primaryAction.label}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Compound Components
// ============================================================================

/**
 * Modal.Header - Header section with title
 */
function ModalHeader({ children, className = '' }: ModalHeaderProps) {
  return (
    <div className={`flex flex-col gap-2 text-center sm:text-left ${className}`}>
      {children}
    </div>
  );
}

/**
 * Modal.Content - Main content area
 */
function ModalContent({ children, className = '' }: ModalContentProps) {
  return (
    <div className={`py-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Modal.Footer - Footer section with actions
 */
function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`flex flex-col-reverse gap-2 sm:flex-row sm:justify-end ${className}`}>
      {children}
    </div>
  );
}

// Attach compound components
Modal.Header = ModalHeader;
Modal.Content = ModalContent;
Modal.Footer = ModalFooter;
