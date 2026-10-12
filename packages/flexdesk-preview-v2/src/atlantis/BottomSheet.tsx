/**
 * BottomSheet Component - Atlantis-style bottom sheet overlay
 *
 * A slide-up panel that appears from the bottom of the screen with a drag handle,
 * backdrop overlay, and optional heading/cancel button. Matches the
 * @jobber/components-native BottomSheet API adapted for web.
 *
 * @example
 * ```tsx
 * const sheetRef = useRef<BottomSheetRef>(null);
 *
 * <BottomSheet
 *   ref={sheetRef}
 *   heading="Quick Actions"
 *   showCancel
 *   onClose={() => console.log('closed')}
 * >
 *   <BottomSheetOption text="Edit" icon="edit" onPress={() => {}} />
 * </BottomSheet>
 *
 * // Open programmatically:
 * sheetRef.current?.open();
 * ```
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import type { ReactNode, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { createPortal } from 'react-dom';
import { Heading } from './Heading';
import { Divider } from './Divider';
import { Button } from './Button';
import { Icon, type IconNames } from './Icon';

// ============================================================================
// Types
// ============================================================================

export interface BottomSheetProps {
  /** Content to render inside the bottom sheet */
  children: ReactNode;

  /** Optional heading displayed at the top of the sheet */
  heading?: string;

  /** Whether to show a cancel button in the footer */
  showCancel?: boolean;

  /** Label for the cancel button */
  cancelLabel?: string;

  /** Callback when the sheet opens */
  onOpen?: () => void;

  /** Callback when the sheet closes */
  onClose?: () => void;

  /** Whether clicking the backdrop closes the sheet */
  closeOnBackdropClick?: boolean;

  /** Additional CSS class name for the sheet panel */
  className?: string;
}

export interface BottomSheetRef {
  /** Open the bottom sheet */
  open: () => void;
  /** Close the bottom sheet */
  close: () => void;
}

export interface BottomSheetOptionProps {
  /** Display text for the option */
  text: string;

  /** Icon name from Atlantis Icon set (optional) */
  icon?: IconNames;

  /** Whether this option is destructive (renders in red) */
  destructive?: boolean;

  /** Click handler */
  onPress: () => void;
}

// ============================================================================
// Drag threshold (pixels user must drag down to dismiss)
// ============================================================================

const DRAG_DISMISS_THRESHOLD = 100;

// ============================================================================
// BottomSheet Component
// ============================================================================

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  function BottomSheet(
    {
      children,
      heading,
      showCancel = false,
      cancelLabel = 'Cancel',
      onOpen,
      onClose,
      closeOnBackdropClick = true,
      className = '',
    },
    ref
  ) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const dragStartY = useRef<number | null>(null);
    const sheetRef = useRef<HTMLDivElement>(null);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mouseListenersRef = useRef<{ move: (ev: globalThis.MouseEvent) => void; up: () => void } | null>(null);

    // Expose open/close via ref
    useImperativeHandle(ref, () => ({
      open: () => {
        setIsOpen(true);
        setIsAnimating(true);
      },
      close: () => {
        handleClose();
      },
    }));

    const handleClose = useCallback(() => {
      setIsAnimating(false);
      setDragOffset(0);
      // Clear any previous close timer
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      // Wait for close animation to finish before unmounting
      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null;
        setIsOpen(false);
        onClose?.();
      }, 300);
    }, [onClose]);

    // Cleanup timers and mouse listeners on unmount
    useEffect(() => {
      return () => {
        if (closeTimerRef.current) {
          clearTimeout(closeTimerRef.current);
        }
        if (mouseListenersRef.current) {
          document.removeEventListener('mousemove', mouseListenersRef.current.move);
          document.removeEventListener('mouseup', mouseListenersRef.current.up);
        }
      };
    }, []);

    // Fire onOpen when sheet becomes visible
    useEffect(() => {
      if (isOpen && isAnimating) {
        onOpen?.();
      }
    }, [isOpen, isAnimating, onOpen]);

    // Escape key handler
    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }, [isOpen, handleClose]);

    // ---- Drag handling ----
    const handleDragStart = useCallback((clientY: number) => {
      dragStartY.current = clientY;
    }, []);

    const handleDragMove = useCallback((clientY: number) => {
      if (dragStartY.current === null) return;
      const delta = clientY - dragStartY.current;
      // Only allow dragging downward
      setDragOffset(Math.max(0, delta));
    }, []);

    const handleDragEnd = useCallback(() => {
      if (dragOffset > DRAG_DISMISS_THRESHOLD) {
        handleClose();
      } else {
        setDragOffset(0);
      }
      dragStartY.current = null;
    }, [dragOffset, handleClose]);

    // Mouse drag handlers (for desktop)
    const onMouseDown = useCallback(
      (e: ReactMouseEvent) => {
        // Clean up any previous listeners
        if (mouseListenersRef.current) {
          document.removeEventListener('mousemove', mouseListenersRef.current.move);
          document.removeEventListener('mouseup', mouseListenersRef.current.up);
        }
        handleDragStart(e.clientY);
        const onMouseMove = (ev: globalThis.MouseEvent) => handleDragMove(ev.clientY);
        const onMouseUp = () => {
          handleDragEnd();
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          mouseListenersRef.current = null;
        };
        mouseListenersRef.current = { move: onMouseMove, up: onMouseUp };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      },
      [handleDragStart, handleDragMove, handleDragEnd]
    );

    // Touch drag handlers (for mobile)
    const onTouchStart = useCallback(
      (e: ReactTouchEvent) => {
        handleDragStart(e.touches[0].clientY);
      },
      [handleDragStart]
    );

    const onTouchMove = useCallback(
      (e: ReactTouchEvent) => {
        handleDragMove(e.touches[0].clientY);
      },
      [handleDragMove]
    );

    const onTouchEnd = useCallback(() => {
      handleDragEnd();
    }, [handleDragEnd]);

    // Backdrop click
    const handleBackdropClick = useCallback(
      (e: ReactMouseEvent) => {
        if (e.target === e.currentTarget && closeOnBackdropClick) {
          handleClose();
        }
      },
      [closeOnBackdropClick, handleClose]
    );

    if (!isOpen) return null;

    const container = typeof document !== 'undefined' ? document.body : null;
    if (!container) return null;

    const sheetContent = (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center"
        role="dialog"
        aria-modal="true"
        aria-label={heading || 'Bottom sheet'}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity duration-300"
          style={{ opacity: isAnimating ? 1 : 0 }}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />

        {/* Sheet Panel */}
        <div
          ref={sheetRef}
          className={`
            relative z-50 w-full max-w-lg
            bg-white dark:bg-gray-900 rounded-t-2xl shadow-lg
            transition-transform duration-300 ease-out
            flex flex-col
            max-h-[85vh]
            ${className}
          `}
          style={{
            transform: isAnimating
              ? `translateY(${dragOffset}px)`
              : 'translateY(100%)',
          }}
        >
          {/* Drag Handle */}
          <div
            className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing select-none"
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            aria-label="Drag to dismiss"
            role="button"
            tabIndex={0}
          >
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>

          {/* Heading */}
          {heading && (
            <div className="px-4 py-2 text-center">
              <Heading level={4} element="h2">
                {heading}
              </Heading>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {children}
          </div>

          {/* Cancel Footer */}
          {showCancel && (
            <div className="px-4 pb-4 pt-2">
              <Divider />
              <div className="pt-3">
                <Button
                  type="tertiary"
                  variation="subtle"
                  fullWidth
                  onClick={handleClose}
                >
                  {cancelLabel}
                </Button>
              </div>
            </div>
          )}

          {/* Safe area padding for mobile devices */}
          <div className="pb-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    );

    return createPortal(sheetContent, container);
  }
);

// ============================================================================
// BottomSheetOption - Individual action item within a BottomSheet
// ============================================================================

export function BottomSheetOption({
  text,
  icon,
  destructive = false,
  onPress,
}: BottomSheetOptionProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={`
        w-full flex items-center gap-3 px-4 py-3
        text-left text-base rounded-lg
        hover:bg-gray-100 dark:hover:bg-gray-800
        active:bg-gray-200 dark:active:bg-gray-700
        transition-colors duration-150
        ${destructive ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}
      `}
    >
      {icon && (
        <Icon
          name={icon}
          size="base"
          color={destructive ? 'critical' : undefined}
        />
      )}
      <span>{text}</span>
    </button>
  );
}
