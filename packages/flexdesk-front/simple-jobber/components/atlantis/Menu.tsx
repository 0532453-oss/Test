import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useContext,
  createContext,
  forwardRef,
  useId,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconNames } from './Icon';

/**
 * Atlantis Menu Component
 *
 * A menu component that matches @jobber/components Menu API.
 * Displays a dropdown menu with actions and navigation items.
 *
 * @example
 * // Basic usage with trigger
 * <Menu>
 *   <Menu.Trigger>
 *     <Button>Actions</Button>
 *   </Menu.Trigger>
 *   <Menu.Content>
 *     <Menu.Item onClick={handleEdit}>Edit</Menu.Item>
 *     <Menu.Item onClick={handleDelete} destructive>Delete</Menu.Item>
 *   </Menu.Content>
 * </Menu>
 *
 * @example
 * // With sections and header
 * <Menu>
 *   <Menu.Trigger><Button>Menu</Button></Menu.Trigger>
 *   <Menu.Content>
 *     <Menu.Section>
 *       <Menu.Header>Actions</Menu.Header>
 *       <Menu.Item icon="edit" onClick={handleEdit}>Edit</Menu.Item>
 *       <Menu.Item icon="copy" onClick={handleCopy}>Copy</Menu.Item>
 *     </Menu.Section>
 *     <Menu.Separator />
 *     <Menu.Item icon="trash" onClick={handleDelete} destructive>Delete</Menu.Item>
 *   </Menu.Content>
 * </Menu>
 */

export type MenuPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'bottom'
  | 'top-start'
  | 'top-end'
  | 'top';

// Context for menu state
interface MenuContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
  menuId: string;
  triggerId: string;
  placement: MenuPlacement;
  closeOnSelect: boolean;
  handleClose: () => void;
  focusedIndex: number;
  setFocusedIndex: React.Dispatch<React.SetStateAction<number>>;
  itemsRef: React.MutableRefObject<(HTMLElement | null)[]>;
  registerItem: (index: number, element: HTMLElement | null) => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('Menu compound components must be used within a Menu');
  }
  return context;
}

export interface MenuProps {
  /**
   * Menu content including Trigger and Content
   */
  children: React.ReactNode;

  /**
   * Controlled open state
   */
  open?: boolean;

  /**
   * Callback when open state changes
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Placement of menu relative to trigger
   * @default 'bottom-start'
   */
  placement?: MenuPlacement;

  /**
   * Whether menu closes when an item is selected
   * @default true
   */
  closeOnSelect?: boolean;
}

export function Menu({
  children,
  open: controlledOpen,
  onOpenChange,
  placement = 'bottom-start',
  closeOnSelect = true,
}: MenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const triggerRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<(HTMLElement | null)[]>([]);

  const menuId = useId();
  const triggerId = useId();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setIsOpen = useCallback(
    (open: boolean) => {
      if (!isControlled) {
        setInternalOpen(open);
      }
      onOpenChange?.(open);
      if (!open) {
        setFocusedIndex(-1);
      }
    },
    [isControlled, onOpenChange]
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [setIsOpen]);

  const registerItem = useCallback(
    (index: number, element: HTMLElement | null) => {
      itemsRef.current[index] = element;
    },
    []
  );

  const contextValue: MenuContextValue = {
    isOpen,
    setIsOpen,
    triggerRef: triggerRef as React.RefObject<HTMLElement>,
    menuId,
    triggerId,
    placement,
    closeOnSelect,
    handleClose,
    focusedIndex,
    setFocusedIndex,
    itemsRef,
    registerItem,
  };

  return (
    <MenuContext.Provider value={contextValue}>{children}</MenuContext.Provider>
  );
}

// Menu.Trigger component
export interface MenuTriggerProps {
  children: React.ReactElement;
  /**
   * Custom trigger button. If not provided, wraps children.
   */
  asChild?: boolean;
}

function MenuTrigger({ children, asChild = true }: MenuTriggerProps) {
  const { isOpen, setIsOpen, triggerRef, menuId, triggerId } = useMenuContext();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(!isOpen);
    },
    [isOpen, setIsOpen]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
    },
    [setIsOpen]
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{
      ref?: React.Ref<HTMLElement>;
      onClick?: (e: React.MouseEvent) => void;
      onKeyDown?: (e: React.KeyboardEvent) => void;
      'aria-haspopup'?: boolean;
      'aria-expanded'?: boolean;
      'aria-controls'?: string;
      id?: string;
    }>, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent) => {
        handleClick(e);
        (children.props as { onClick?: (e: React.MouseEvent) => void }).onClick?.(e);
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        handleKeyDown(e);
        (children.props as { onKeyDown?: (e: React.KeyboardEvent) => void }).onKeyDown?.(e);
      },
      'aria-haspopup': true,
      'aria-expanded': isOpen,
      'aria-controls': isOpen ? menuId : undefined,
      id: triggerId,
    });
  }

  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-haspopup={true}
      aria-expanded={isOpen}
      aria-controls={isOpen ? menuId : undefined}
      id={triggerId}
    >
      {children}
    </button>
  );
}

// Menu.Content component
export interface MenuContentProps {
  children: React.ReactNode;
  /**
   * Alignment of menu to trigger
   * @default 'start'
   */
  align?: 'start' | 'center' | 'end';
  /**
   * Width of menu
   */
  width?: number | string;
  /**
   * Additional class names
   */
  className?: string;
}

function MenuContent({ children, align, width, className }: MenuContentProps) {
  const {
    isOpen,
    setIsOpen,
    triggerRef,
    menuId,
    triggerId,
    placement,
    handleClose,
    focusedIndex,
    setFocusedIndex,
    itemsRef,
  } = useMenuContext();

  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  // Count menu items for keyboard navigation
  const itemCount = itemsRef.current.filter(Boolean).length;

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Calculate position
  useEffect(() => {
    if (!isOpen || !triggerRef.current || !menuRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current || !menuRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      const padding = 8;

      let top = 0;
      let left = 0;

      // Vertical positioning
      if (placement.startsWith('bottom')) {
        top = triggerRect.bottom + scrollY + 4;
        // Flip to top if not enough space below
        if (top + menuRect.height > scrollY + viewportHeight - padding) {
          top = triggerRect.top + scrollY - menuRect.height - 4;
        }
      } else {
        top = triggerRect.top + scrollY - menuRect.height - 4;
        // Flip to bottom if not enough space above
        if (top < scrollY + padding) {
          top = triggerRect.bottom + scrollY + 4;
        }
      }

      // Horizontal positioning
      const effectiveAlign = align || (placement.includes('end') ? 'end' : placement.includes('start') ? 'start' : 'center');

      if (effectiveAlign === 'end') {
        left = triggerRect.right + scrollX - menuRect.width;
      } else if (effectiveAlign === 'center') {
        left = triggerRect.left + scrollX + (triggerRect.width - menuRect.width) / 2;
      } else {
        left = triggerRect.left + scrollX;
      }

      // Ensure within horizontal bounds
      left = Math.max(
        scrollX + padding,
        Math.min(left, scrollX + viewportWidth - menuRect.width - padding)
      );

      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, placement, align]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, handleClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev < itemCount - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : itemCount - 1));
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(itemCount - 1);
          break;
        case 'Tab':
          e.preventDefault();
          handleClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, setFocusedIndex, itemCount]);

  // Focus management
  useEffect(() => {
    if (focusedIndex >= 0 && itemsRef.current[focusedIndex]) {
      itemsRef.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  // Focus first item when menu opens
  useEffect(() => {
    if (isOpen && itemCount > 0) {
      // Small delay to ensure items are registered
      setTimeout(() => {
        setFocusedIndex(0);
      }, 0);
    }
  }, [isOpen, itemCount, setFocusedIndex]);

  if (!isOpen || !mounted) return null;

  const menuContent = (
    <div
      ref={menuRef}
      id={menuId}
      role="menu"
      aria-labelledby={triggerId}
      tabIndex={-1}
      className={className}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 9999,
        minWidth: width || 180,
        maxWidth: width || 320,
        width: width || 'auto',
        backgroundColor: 'var(--color-surface--background, hsl(0 0% 100%))',
        border: '1px solid var(--color-border, hsl(214 32% 91%))',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
        padding: '4px',
        outline: 'none',
        animation: 'menuFadeIn 150ms ease-out',
      }}
    >
      <MenuItemIndexProvider>{children}</MenuItemIndexProvider>
      <style>{`
        @keyframes menuFadeIn {
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
    </div>
  );

  return createPortal(menuContent, document.body);
}

// Context for tracking item indices
const MenuItemIndexContext = createContext<{
  getNextIndex: () => number;
  resetIndex: () => void;
}>({
  getNextIndex: () => 0,
  resetIndex: () => {},
});

function MenuItemIndexProvider({ children }: { children: React.ReactNode }) {
  const indexRef = useRef(0);

  const getNextIndex = useCallback(() => {
    return indexRef.current++;
  }, []);

  const resetIndex = useCallback(() => {
    indexRef.current = 0;
  }, []);

  // Reset on mount
  useEffect(() => {
    indexRef.current = 0;
  }, []);

  return (
    <MenuItemIndexContext.Provider value={{ getNextIndex, resetIndex }}>
      {children}
    </MenuItemIndexContext.Provider>
  );
}

// Menu.Item component
export interface MenuItemProps {
  /**
   * Item content
   */
  children: React.ReactNode;

  /**
   * Click handler
   */
  onClick?: (e: React.MouseEvent) => void;

  /**
   * Optional icon to display
   */
  icon?: IconNames;

  /**
   * Whether item is disabled
   */
  disabled?: boolean;

  /**
   * Whether item is destructive (red styling)
   */
  destructive?: boolean;

  /**
   * Whether item is currently selected/checked
   */
  selected?: boolean;

  /**
   * Additional class names
   */
  className?: string;
}

const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(
  ({ children, onClick, icon, disabled, destructive, selected, className }, ref) => {
    const { closeOnSelect, handleClose, registerItem, focusedIndex, setFocusedIndex } =
      useMenuContext();
    const { getNextIndex } = useContext(MenuItemIndexContext);
    const indexRef = useRef(-1);
    const itemRef = useRef<HTMLDivElement | null>(null);

    // Get index on mount
    useEffect(() => {
      indexRef.current = getNextIndex();
      registerItem(indexRef.current, itemRef.current);
    }, [getNextIndex, registerItem]);

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (disabled) return;
        onClick?.(e);
        if (closeOnSelect) {
          handleClose();
        }
      },
      [disabled, onClick, closeOnSelect, handleClose]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e as unknown as React.MouseEvent);
          if (closeOnSelect) {
            handleClose();
          }
        }
      },
      [disabled, onClick, closeOnSelect, handleClose]
    );

    const handleMouseEnter = useCallback(() => {
      if (!disabled) {
        setFocusedIndex(indexRef.current);
      }
    }, [disabled, setFocusedIndex]);

    const isFocused = focusedIndex === indexRef.current;

    return (
      <div
        ref={(el) => {
          itemRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
          registerItem(indexRef.current, el);
        }}
        role="menuitem"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        aria-disabled={disabled}
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          fontSize: '14px',
          lineHeight: '20px',
          borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          color: destructive
            ? 'var(--color-critical, hsl(0 72% 51%))'
            : 'var(--color-text, hsl(210 20% 20%))',
          backgroundColor: isFocused
            ? 'var(--color-surface--hover, hsl(210 20% 96%))'
            : 'transparent',
          outline: 'none',
          transition: 'background-color 100ms ease',
        }}
      >
        {icon && (
          <Icon
            name={icon}
            size="small"
            color={destructive ? 'critical' : undefined}
          />
        )}
        <span style={{ flex: 1 }}>{children}</span>
        {selected && (
          <Icon name="checkmark" size="small" />
        )}
      </div>
    );
  }
);

MenuItem.displayName = 'MenuItem';

// Menu.Section component
export interface MenuSectionProps {
  children: React.ReactNode;
}

function MenuSection({ children }: MenuSectionProps) {
  return <div role="group">{children}</div>;
}

// Menu.Header component
export interface MenuHeaderProps {
  children: React.ReactNode;
}

function MenuHeader({ children }: MenuHeaderProps) {
  return (
    <div
      style={{
        padding: '8px 12px 4px',
        fontSize: '12px',
        fontWeight: 500,
        color: 'var(--color-text--secondary, hsl(210 15% 55%))',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {children}
    </div>
  );
}

// Menu.Separator component
function MenuSeparator() {
  return (
    <div
      role="separator"
      style={{
        height: '1px',
        margin: '4px 0',
        backgroundColor: 'var(--color-border, hsl(214 32% 91%))',
      }}
    />
  );
}

// Menu.RadioGroup component
export interface MenuRadioGroupProps {
  /**
   * Current selected value
   */
  value: string;

  /**
   * Callback when value changes
   */
  onValueChange: (value: string) => void;

  /**
   * Radio items
   */
  children: React.ReactNode;
}

// Context for radio group
const MenuRadioGroupContext = createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

function MenuRadioGroup({ value, onValueChange, children }: MenuRadioGroupProps) {
  return (
    <MenuRadioGroupContext.Provider value={{ value, onValueChange }}>
      <div role="group">{children}</div>
    </MenuRadioGroupContext.Provider>
  );
}

// Menu.RadioItem component
export interface MenuRadioItemProps {
  /**
   * Value for this radio item
   */
  value: string;

  /**
   * Item content
   */
  children: React.ReactNode;

  /**
   * Whether item is disabled
   */
  disabled?: boolean;

  /**
   * Additional class names
   */
  className?: string;
}

const MenuRadioItem = forwardRef<HTMLDivElement, MenuRadioItemProps>(
  ({ value, children, disabled, className }, ref) => {
    const radioContext = useContext(MenuRadioGroupContext);
    const { closeOnSelect, handleClose, registerItem, focusedIndex, setFocusedIndex } =
      useMenuContext();
    const { getNextIndex } = useContext(MenuItemIndexContext);
    const indexRef = useRef(-1);
    const itemRef = useRef<HTMLDivElement | null>(null);

    // Get index on mount
    useEffect(() => {
      indexRef.current = getNextIndex();
      registerItem(indexRef.current, itemRef.current);
    }, [getNextIndex, registerItem]);

    const isSelected = radioContext?.value === value;

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (disabled) return;
        radioContext?.onValueChange(value);
        if (closeOnSelect) {
          handleClose();
        }
      },
      [disabled, radioContext, value, closeOnSelect, handleClose]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          radioContext?.onValueChange(value);
          if (closeOnSelect) {
            handleClose();
          }
        }
      },
      [disabled, radioContext, value, closeOnSelect, handleClose]
    );

    const handleMouseEnter = useCallback(() => {
      if (!disabled) {
        setFocusedIndex(indexRef.current);
      }
    }, [disabled, setFocusedIndex]);

    const isFocused = focusedIndex === indexRef.current;

    return (
      <div
        ref={(el) => {
          itemRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
          registerItem(indexRef.current, el);
        }}
        role="menuitemradio"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        aria-checked={isSelected}
        aria-disabled={disabled}
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          paddingLeft: '32px',
          fontSize: '14px',
          lineHeight: '20px',
          borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          color: 'var(--color-text, hsl(210 20% 20%))',
          backgroundColor: isFocused
            ? 'var(--color-surface--hover, hsl(210 20% 96%))'
            : 'transparent',
          outline: 'none',
          position: 'relative',
          transition: 'background-color 100ms ease',
        }}
      >
        {isSelected && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="checkmark" size="small" />
          </span>
        )}
        {children}
      </div>
    );
  }
);

MenuRadioItem.displayName = 'MenuRadioItem';

// Attach compound components
Menu.Trigger = MenuTrigger;
Menu.Content = MenuContent;
Menu.Item = MenuItem;
Menu.Section = MenuSection;
Menu.Header = MenuHeader;
Menu.Separator = MenuSeparator;
Menu.RadioGroup = MenuRadioGroup;
Menu.RadioItem = MenuRadioItem;

export default Menu;
