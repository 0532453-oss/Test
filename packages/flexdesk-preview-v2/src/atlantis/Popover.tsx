import React, { useRef, useState, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { ButtonDismiss } from './ButtonDismiss';

/**
 * Popover component matching @jobber/components Popover API.
 *
 * Provides a floating panel anchored to a trigger element.
 * Used for filter dropdowns, action menus, info panels, and other floating content.
 *
 * @example Basic usage with trigger
 * ```tsx
 * const [open, setOpen] = useState(false);
 * const triggerRef = useRef<HTMLButtonElement>(null);
 *
 * <Button ref={triggerRef} onClick={() => setOpen(!open)}>Open</Button>
 * <Popover
 *   open={open}
 *   onRequestClose={() => setOpen(false)}
 *   attachTo={triggerRef}
 *   preferredPlacement="below"
 * >
 *   <p>Popover content</p>
 * </Popover>
 * ```
 *
 * @example With compound components
 * ```tsx
 * <Popover open={open} onRequestClose={() => setOpen(false)} attachTo={triggerRef}>
 *   <Popover.Header>Filter Options</Popover.Header>
 *   <Popover.Content>
 *     <Checkbox label="Option 1" />
 *     <Checkbox label="Option 2" />
 *   </Popover.Content>
 *   <Popover.DismissButton onClick={() => setOpen(false)} />
 * </Popover>
 * ```
 */

export type PopoverPlacement =
  | 'above'
  | 'below'
  | 'left'
  | 'right'
  | 'above-start'
  | 'above-end'
  | 'below-start'
  | 'below-end';

export interface PopoverProps {
  /** Whether the popover is visible */
  open: boolean;
  /** Callback when popover should close */
  onRequestClose: () => void;
  /** Reference element to attach popover to */
  attachTo: React.RefObject<HTMLElement | null>;
  /** Preferred placement relative to attachTo element */
  preferredPlacement?: PopoverPlacement;
  /** Popover content */
  children: React.ReactNode;
  /** Whether clicking outside closes the popover (default: true) */
  dismissOnClickOutside?: boolean;
  /** Whether pressing Escape closes the popover (default: true) */
  dismissOnEscape?: boolean;
  /** Offset from the attachTo element in pixels (default: 4) */
  offset?: number;
  /** Width of the popover (default: auto) */
  width?: number | string;
  /** Maximum height of the popover */
  maxHeight?: number | string;
  /** aria-label for the popover */
  ariaLabel?: string;
}

// Context for compound components
const PopoverContext = React.createContext<{
  onRequestClose: () => void;
} | null>(null);

/**
 * Calculate the position of the popover relative to the anchor element
 */
function calculatePosition(
  anchorRect: DOMRect,
  popoverRect: DOMRect,
  placement: PopoverPlacement,
  offset: number
): { top: number; left: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let top = 0;
  let left = 0;

  // Calculate base position based on placement
  switch (placement) {
    case 'above':
      top = anchorRect.top - popoverRect.height - offset;
      left = anchorRect.left + (anchorRect.width - popoverRect.width) / 2;
      break;
    case 'above-start':
      top = anchorRect.top - popoverRect.height - offset;
      left = anchorRect.left;
      break;
    case 'above-end':
      top = anchorRect.top - popoverRect.height - offset;
      left = anchorRect.right - popoverRect.width;
      break;
    case 'below':
      top = anchorRect.bottom + offset;
      left = anchorRect.left + (anchorRect.width - popoverRect.width) / 2;
      break;
    case 'below-start':
      top = anchorRect.bottom + offset;
      left = anchorRect.left;
      break;
    case 'below-end':
      top = anchorRect.bottom + offset;
      left = anchorRect.right - popoverRect.width;
      break;
    case 'left':
      top = anchorRect.top + (anchorRect.height - popoverRect.height) / 2;
      left = anchorRect.left - popoverRect.width - offset;
      break;
    case 'right':
      top = anchorRect.top + (anchorRect.height - popoverRect.height) / 2;
      left = anchorRect.right + offset;
      break;
  }

  // Ensure popover stays within viewport bounds
  if (left < 8) left = 8;
  if (left + popoverRect.width > viewportWidth - 8) {
    left = viewportWidth - popoverRect.width - 8;
  }
  if (top < 8) top = 8;
  if (top + popoverRect.height > viewportHeight - 8) {
    top = viewportHeight - popoverRect.height - 8;
  }

  return { top, left };
}

export function Popover({
  open,
  onRequestClose,
  attachTo,
  preferredPlacement = 'below-start',
  children,
  dismissOnClickOutside = true,
  dismissOnEscape = true,
  offset = 4,
  width,
  maxHeight,
  ariaLabel,
}: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const popoverId = useId();

  // Update position when open changes or on scroll/resize
  const updatePosition = useCallback(() => {
    if (!open || !attachTo.current || !popoverRef.current) return;

    const anchorRect = attachTo.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const newPosition = calculatePosition(anchorRect, popoverRect, preferredPlacement, offset);

    setPosition(newPosition);
    setIsPositioned(true);
  }, [open, attachTo, preferredPlacement, offset]);

  // Initial positioning and resize/scroll handling
  useEffect(() => {
    if (!open) {
      setIsPositioned(false);
      return;
    }

    // Use requestAnimationFrame to ensure popover is rendered before calculating position
    const rafId = requestAnimationFrame(() => {
      updatePosition();
    });

    // Update position on scroll and resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  // Handle click outside
  useEffect(() => {
    if (!open || !dismissOnClickOutside) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is outside popover and attachTo element
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        attachTo.current &&
        !attachTo.current.contains(target)
      ) {
        onRequestClose();
      }
    };

    // Use setTimeout to avoid immediate close when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, dismissOnClickOutside, onRequestClose, attachTo]);

  // Handle Escape key
  useEffect(() => {
    if (!open || !dismissOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onRequestClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, dismissOnEscape, onRequestClose]);

  // Focus management
  useEffect(() => {
    if (open && popoverRef.current) {
      // Focus the first focusable element in the popover
      const focusable = popoverRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) {
        focusable.focus();
      }
    }
  }, [open, isPositioned]);

  if (!open) return null;

  return createPortal(
    <PopoverContext.Provider value={{ onRequestClose }}>
      <div
        ref={popoverRef}
        id={popoverId}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className="fixed z-50 bg-white dark:bg-[#1a1a1a] text-[var(--color-text)] rounded-xl border border-[var(--color-border)] shadow-md outline-none animate-in fade-in-0 zoom-in-95"
        style={{
          top: position.top,
          left: position.left,
          width: width ?? 'auto',
          maxHeight: maxHeight ?? 'calc(100vh - 16px)',
          visibility: isPositioned ? 'visible' : 'hidden',
          overflow: 'auto',
        }}
      >
        {children}
      </div>
    </PopoverContext.Provider>,
    document.body
  );
}

// Compound component: Popover.Header
interface PopoverHeaderProps {
  children: React.ReactNode;
  className?: string;
}

function PopoverHeader({ children, className = '' }: PopoverHeaderProps) {
  return (
    <div className={`px-4 pt-4 pb-2 font-medium text-sm ${className}`}>
      {children}
    </div>
  );
}

// Compound component: Popover.Content
interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
}

function PopoverContent({ children, className = '' }: PopoverContentProps) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

// Compound component: Popover.DismissButton
interface PopoverDismissButtonProps {
  /** Click handler - if not provided, uses popover's onRequestClose */
  onClick?: () => void;
  /** aria-label for accessibility */
  ariaLabel?: string;
}

function PopoverDismissButton({
  onClick,
  ariaLabel = 'Close popover',
}: PopoverDismissButtonProps) {
  const context = React.useContext(PopoverContext);

  return (
    <div className="absolute top-2 right-2">
      <ButtonDismiss
        onClick={onClick ?? context?.onRequestClose}
        ariaLabel={ariaLabel}
      />
    </div>
  );
}

// Attach compound components
Popover.Header = PopoverHeader;
Popover.Content = PopoverContent;
Popover.DismissButton = PopoverDismissButton;

export type { PopoverHeaderProps, PopoverContentProps, PopoverDismissButtonProps };
