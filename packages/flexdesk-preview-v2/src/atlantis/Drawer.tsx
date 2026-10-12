import React, { useEffect, useCallback } from 'react';
import type { ReactNode, CSSProperties, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Heading } from './Heading';
import { ButtonDismiss } from './ButtonDismiss';

/**
 * Drawer Component
 *
 * A slide-in drawer component that appears from the side of the screen.
 * Matches the @jobber/components Drawer API.
 *
 * @example
 * ```tsx
 * <Drawer
 *   open={isOpen}
 *   title="Filters"
 *   onRequestClose={() => setIsOpen(false)}
 * >
 *   <FilterForm />
 * </Drawer>
 * ```
 */

export interface DrawerProps {
  /**
   * Unique identifier for the drawer
   */
  id?: string;

  /**
   * The content to display inside the drawer
   */
  children: ReactNode;

  /**
   * The title displayed in the drawer header
   */
  title: string;

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
   * @default 'right'
   */
  side?: 'left' | 'right';

  /**
   * Width of the drawer
   * @default '320px'
   */
  width?: string | number;

  /**
   * Whether to show the overlay backdrop
   * @default true
   */
  showOverlay?: boolean;

  /**
   * Whether clicking the overlay closes the drawer
   * @default true
   */
  closeOnOverlayClick?: boolean;
}

export function Drawer({
  id,
  title,
  children,
  open = false,
  onRequestClose,
  side = 'right',
  width = '320px',
  showOverlay = true,
  closeOnOverlayClick = true,
}: DrawerProps) {
  // Handle escape key
  const handleKeyDown = useCallback(
    (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onRequestClose();
      }
    },
    [open, onRequestClose]
  );

  // Add escape key listener
  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [open, handleKeyDown]);

  // Don't render anything if not open and no animation
  if (!open) {
    return null;
  }

  const widthValue = typeof width === 'number' ? `${width}px` : width;

  const drawerContent = (
    <>
      {/* Overlay */}
      {showOverlay && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          data-state={open ? 'open' : 'closed'}
          onClick={closeOnOverlayClick ? onRequestClose : undefined}
          aria-hidden="true"
          style={{
            opacity: open ? 1 : 0,
          }}
        />
      )}

      {/* Drawer Panel */}
      <aside
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!open}
        className={`
          fixed top-0 z-50 flex h-full flex-col
          bg-[var(--color-surface)] border-[var(--color-border)]
          shadow-xl
          transition-transform duration-300 ease-in-out
          ${side === 'right' ? 'right-0 border-l rounded-l-2xl' : 'left-0 border-r rounded-r-2xl'}
        `}
        style={{
          width: widthValue,
          maxWidth: '100vw',
          transform: open
            ? 'translateX(0)'
            : side === 'right'
            ? 'translateX(100%)'
            : 'translateX(-100%)',
        }}
        onKeyUp={(event: KeyboardEvent<HTMLElement>) => {
          if (event.key === 'Escape') {
            onRequestClose();
          }
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3"
          data-testid="drawer-header"
        >
          <div className="flex-1 min-w-0">
            <Heading level={3}>{title}</Heading>
          </div>
          <ButtonDismiss
            onClick={onRequestClose}
            ariaLabel={`Close ${title || 'drawer'}`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">{children}</div>
        </div>
      </aside>
    </>
  );

  // Render into portal
  const container = typeof document !== 'undefined' ? document.body : null;
  if (!container) return null;

  return createPortal(drawerContent, container);
}

// Compound component types for SideDrawer-style API
export interface DrawerTitleProps {
  children: ReactNode;
}

export interface DrawerToolbarProps {
  children: ReactNode;
}

export interface DrawerActionsProps {
  children: ReactNode;
}

export interface DrawerFooterProps {
  children: ReactNode;
}

// Compound components (for SideDrawer-style composition)
function DrawerTitle({ children }: DrawerTitleProps) {
  return <div className="drawer-title">{children}</div>;
}

function DrawerToolbar({ children }: DrawerToolbarProps) {
  return <div className="border-b border-[var(--color-border)] px-4 py-2">{children}</div>;
}

function DrawerActions({ children }: DrawerActionsProps) {
  return <div className="flex items-center gap-2">{children}</div>;
}

function DrawerFooter({ children }: DrawerFooterProps) {
  return (
    <div className="mt-auto border-t border-[var(--color-border)] px-4 py-3">
      {children}
    </div>
  );
}

// Attach compound components
Drawer.Title = DrawerTitle;
Drawer.Toolbar = DrawerToolbar;
Drawer.Actions = DrawerActions;
Drawer.Footer = DrawerFooter;
