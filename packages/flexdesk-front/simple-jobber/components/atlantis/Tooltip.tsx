import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';

/**
 * Atlantis Tooltip Component
 *
 * A tooltip component that matches @jobber/components Tooltip API.
 * Displays contextual information when hovering or focusing on trigger element.
 *
 * @example
 * // Basic usage with message prop
 * <Tooltip message="This is helpful information">
 *   <Button>Hover me</Button>
 * </Tooltip>
 *
 * @example
 * // With placement
 * <Tooltip message="Shows above" placement="top">
 *   <Icon name="help" />
 * </Tooltip>
 *
 * @example
 * // Controlled visibility
 * <Tooltip message="Info" open={isOpen}>
 *   <span>Controlled tooltip</span>
 * </Tooltip>
 */

export type TooltipPlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end';

export interface TooltipProps {
  /**
   * The content to show in the tooltip
   */
  message: React.ReactNode;

  /**
   * The trigger element that the tooltip is attached to
   */
  children: React.ReactElement;

  /**
   * Preferred placement of the tooltip relative to trigger
   * @default 'top'
   */
  placement?: TooltipPlacement;

  /**
   * Controlled open state
   */
  open?: boolean;

  /**
   * Callback when open state changes
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Delay before showing tooltip (ms)
   * @default 300
   */
  showDelay?: number;

  /**
   * Delay before hiding tooltip (ms)
   * @default 0
   */
  hideDelay?: number;

  /**
   * Whether tooltip should be disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Maximum width of the tooltip
   */
  maxWidth?: number | string;
}

// Calculate position based on trigger element and placement
function calculatePosition(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  placement: TooltipPlacement,
  offset: number = 8
): { top: number; left: number; actualPlacement: TooltipPlacement } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  let top = 0;
  let left = 0;
  let actualPlacement = placement;

  // Calculate initial position based on placement
  switch (placement) {
    case 'top':
    case 'top-start':
    case 'top-end':
      top = triggerRect.top + scrollY - tooltipRect.height - offset;
      break;
    case 'bottom':
    case 'bottom-start':
    case 'bottom-end':
      top = triggerRect.bottom + scrollY + offset;
      break;
    case 'left':
      top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
      left = triggerRect.left + scrollX - tooltipRect.width - offset;
      break;
    case 'right':
      top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
      left = triggerRect.right + scrollX + offset;
      break;
  }

  // Calculate horizontal alignment for top/bottom placements
  if (placement === 'top' || placement === 'bottom') {
    left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
  } else if (placement === 'top-start' || placement === 'bottom-start') {
    left = triggerRect.left + scrollX;
  } else if (placement === 'top-end' || placement === 'bottom-end') {
    left = triggerRect.right + scrollX - tooltipRect.width;
  }

  // Viewport boundary checks and flipping
  const padding = 8;

  // Check if tooltip overflows top - flip to bottom
  if (top < scrollY + padding && (placement === 'top' || placement === 'top-start' || placement === 'top-end')) {
    top = triggerRect.bottom + scrollY + offset;
    actualPlacement = placement.replace('top', 'bottom') as TooltipPlacement;
  }

  // Check if tooltip overflows bottom - flip to top
  if (top + tooltipRect.height > scrollY + viewportHeight - padding &&
      (placement === 'bottom' || placement === 'bottom-start' || placement === 'bottom-end')) {
    top = triggerRect.top + scrollY - tooltipRect.height - offset;
    actualPlacement = placement.replace('bottom', 'top') as TooltipPlacement;
  }

  // Check if tooltip overflows left - flip to right
  if (left < scrollX + padding && placement === 'left') {
    left = triggerRect.right + scrollX + offset;
    actualPlacement = 'right';
  }

  // Check if tooltip overflows right - flip to left
  if (left + tooltipRect.width > scrollX + viewportWidth - padding && placement === 'right') {
    left = triggerRect.left + scrollX - tooltipRect.width - offset;
    actualPlacement = 'left';
  }

  // Ensure tooltip stays within horizontal bounds
  left = Math.max(scrollX + padding, Math.min(left, scrollX + viewportWidth - tooltipRect.width - padding));

  return { top, left, actualPlacement };
}

// Get arrow styles based on placement
function getArrowStyles(placement: TooltipPlacement): React.CSSProperties {
  const arrowSize = 6;
  const base: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
  };

  switch (placement) {
    case 'top':
    case 'top-start':
    case 'top-end':
      return {
        ...base,
        bottom: -arrowSize,
        left: placement === 'top' ? '50%' : placement === 'top-start' ? '12px' : undefined,
        right: placement === 'top-end' ? '12px' : undefined,
        transform: placement === 'top' ? 'translateX(-50%)' : undefined,
        borderWidth: `${arrowSize}px ${arrowSize}px 0`,
        borderColor: 'var(--color-surface--background) transparent transparent transparent',
      };
    case 'bottom':
    case 'bottom-start':
    case 'bottom-end':
      return {
        ...base,
        top: -arrowSize,
        left: placement === 'bottom' ? '50%' : placement === 'bottom-start' ? '12px' : undefined,
        right: placement === 'bottom-end' ? '12px' : undefined,
        transform: placement === 'bottom' ? 'translateX(-50%)' : undefined,
        borderWidth: `0 ${arrowSize}px ${arrowSize}px`,
        borderColor: 'transparent transparent var(--color-surface--background) transparent',
      };
    case 'left':
      return {
        ...base,
        top: '50%',
        right: -arrowSize,
        transform: 'translateY(-50%)',
        borderWidth: `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`,
        borderColor: 'transparent transparent transparent var(--color-surface--background)',
      };
    case 'right':
      return {
        ...base,
        top: '50%',
        left: -arrowSize,
        transform: 'translateY(-50%)',
        borderWidth: `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`,
        borderColor: 'transparent var(--color-surface--background) transparent transparent',
      };
    default:
      return base;
  }
}

export function Tooltip({
  message,
  children,
  placement = 'top',
  open: controlledOpen,
  onOpenChange,
  showDelay = 300,
  hideDelay = 0,
  disabled = false,
  maxWidth = 250,
}: TooltipProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [actualPlacement, setActualPlacement] = useState<TooltipPlacement>(placement);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const tooltipId = useId();
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Update position when tooltip opens
  useEffect(() => {
    if (!isOpen || !triggerRef.current || !tooltipRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const { top, left, actualPlacement: newPlacement } = calculatePosition(
        triggerRect,
        tooltipRect,
        placement
      );

      setPosition({ top, left });
      setActualPlacement(newPlacement);
    };

    // Initial position
    updatePosition();

    // Update on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, placement]);

  const setOpen = useCallback((value: boolean) => {
    if (!isControlled) {
      setInternalOpen(value);
    }
    onOpenChange?.(value);
  }, [isControlled, onOpenChange]);

  const handleShow = useCallback(() => {
    if (disabled) return;

    clearTimeout(hideTimeoutRef.current);
    showTimeoutRef.current = setTimeout(() => {
      setOpen(true);
    }, showDelay);
  }, [disabled, showDelay, setOpen]);

  const handleHide = useCallback(() => {
    clearTimeout(showTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, hideDelay);
  }, [hideDelay, setOpen]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      clearTimeout(showTimeoutRef.current);
      clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Clone child and add event handlers
  const trigger = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e: React.MouseEvent) => {
      handleShow();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleHide();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      handleShow();
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      handleHide();
      children.props.onBlur?.(e);
    },
    'aria-describedby': isOpen ? tooltipId : undefined,
  });

  // Tooltip content
  const tooltipContent = isOpen && mounted && (
    createPortal(
      <div
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          zIndex: 9999,
          maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
          backgroundColor: 'var(--color-surface--background)',
          color: 'var(--color-surface)',
          padding: '6px 10px',
          borderRadius: 'var(--radius-base, 8px)',
          fontSize: '12px',
          lineHeight: '1.4',
          fontWeight: 400,
          boxShadow: 'var(--shadow-low, 0px 1px 2px rgba(0,0,0,0.25), 0px 0px 2px rgba(0,0,0,0.1))',
          pointerEvents: 'none',
          wordWrap: 'break-word',
          animation: 'tooltipFadeIn 150ms ease-out',
        }}
      >
        {message}
        <span style={getArrowStyles(actualPlacement)} />
        <style>{`
          @keyframes tooltipFadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </div>,
      document.body
    )
  );

  return (
    <>
      {trigger}
      {tooltipContent}
    </>
  );
}

export default Tooltip;
