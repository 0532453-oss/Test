import React, { useEffect, useCallback, useRef } from 'react';
import type { ReactNode, CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Heading } from './Heading';
import { ButtonDismiss } from './ButtonDismiss';

/**
 * SideDrawer Component
 *
 * A slide-in drawer component optimized for mobile navigation.
 * Matches the @jobber/components SideDrawer API.
 *
 * Unlike the standard Drawer, SideDrawer is designed for navigation patterns:
 * - Always slides from the left on mobile devices
 * - Full viewport height
 * - Supports navigation menu content
 * - Has built-in header with title and close button
 *
 * @example
 * ```tsx
 * <SideDrawer
 *   open={isMobileMenuOpen}
 *   onRequestClose={() => setIsMobileMenuOpen(false)}
 * >
 *   <NavMenu onItemClick={() => setIsMobileMenuOpen(false)} />
 * </SideDrawer>
 * ```
 */

export interface SideDrawerProps {
  /**
   * Unique identifier for the drawer
   */
  id?: string;

  /**
   * The content to display inside the side drawer
   */
  children: ReactNode;

  /**
   * Optional title displayed in the drawer header
   */
  title?: string;

  /**
   * Whether the drawer is currently open
   * @default false
   */
  open?: boolean;

  /**
   * Callback when the drawer requests to be closed
   */
  onRequestClose: () => void;

  /**
   * Side of the screen the drawer slides in from
   * Navigation drawers typically slide from the left
   * @default 'left'
   */
  side?: 'left' | 'right';

  /**
   * Width of the side drawer
   * @default '18rem' (matches mobile sidebar width)
   */
  width?: string | number;

  /**
   * Additional actions to render in the header (right side)
   */
  headerActions?: ReactNode;

  /**
   * ARIA label for the drawer (used if no title is provided)
   */
  ariaLabel?: string;
}

export function SideDrawer({
  id,
  title,
  children,
  open = false,
  onRequestClose,
  side = 'left',
  width = '18rem',
  headerActions,
  ariaLabel = 'Navigation menu',
}: SideDrawerProps) {
  const drawerRef = useRef<HTMLElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Handle escape key
  const handleKeyDown = useCallback(
    (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onRequestClose();
      }
    },
    [open, onRequestClose]
  );

  // Focus management
  useEffect(() => {
    if (open) {
      // Store the previously focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement;

      // Focus the drawer container
      if (drawerRef.current) {
        drawerRef.current.focus();
      }

      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';

        // Restore focus to previously focused element
        if (previouslyFocusedElement.current) {
          previouslyFocusedElement.current.focus();
        }
      };
    }
  }, [open, handleKeyDown]);

  // Don't render anything if not open
  if (!open) {
    return null;
  }

  const widthValue = typeof width === 'number' ? `${width}px` : width;

  const drawerContent = (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200"
        data-state={open ? 'open' : 'closed'}
        onClick={onRequestClose}
        aria-hidden="true"
        style={{
          opacity: open ? 1 : 0,
        }}
      />

      {/* Drawer Panel */}
      <aside
        ref={drawerRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={title || ariaLabel}
        aria-hidden={!open}
        tabIndex={-1}
        className={`
          fixed top-0 z-50 flex h-full flex-col
          bg-sidebar text-sidebar-foreground
          shadow-xl
          transition-transform duration-200 ease-in-out
          ${side === 'right' ? 'right-0 rounded-l-2xl' : 'left-0 rounded-r-2xl'}
          focus:outline-none
        `}
        style={{
          width: widthValue,
          maxWidth: '100vw',
          transform: open
            ? 'translateX(0)'
            : side === 'right'
            ? 'translateX(100%)'
            : 'translateX(-100%)',
          '--sidebar-width': widthValue,
        } as CSSProperties}
      >
        {/* Header - only shown if title or headerActions provided */}
        {(title || headerActions) && (
          <div
            className="flex items-center justify-between gap-2 border-b border-sidebar-border px-4 py-3"
            data-testid="side-drawer-header"
          >
            {title && (
              <div className="flex-1 min-w-0">
                <Heading level={3}>{title}</Heading>
              </div>
            )}
            <div className="flex items-center gap-2">
              {headerActions}
              <ButtonDismiss
                onClick={onRequestClose}
                ariaLabel="Close navigation menu"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </>
  );

  // Render into portal
  const container = typeof document !== 'undefined' ? document.body : null;
  if (!container) return null;

  return createPortal(drawerContent, container);
}

/**
 * Compound component types for SideDrawer composition
 */
export interface SideDrawerHeaderProps {
  children: ReactNode;
}

export interface SideDrawerContentProps {
  children: ReactNode;
}

export interface SideDrawerFooterProps {
  children: ReactNode;
}

// Compound components for more complex layouts
function SideDrawerHeader({ children }: SideDrawerHeaderProps) {
  return (
    <div className="border-b border-sidebar-border px-4 py-3">
      {children}
    </div>
  );
}

function SideDrawerContent({ children }: SideDrawerContentProps) {
  return <div className="flex-1 overflow-y-auto p-4">{children}</div>;
}

function SideDrawerFooter({ children }: SideDrawerFooterProps) {
  return (
    <div className="mt-auto border-t border-sidebar-border px-4 py-3">
      {children}
    </div>
  );
}

// Attach compound components
SideDrawer.Header = SideDrawerHeader;
SideDrawer.Content = SideDrawerContent;
SideDrawer.Footer = SideDrawerFooter;
