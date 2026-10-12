/**
 * Combobox Component
 *
 * Atlantis-style searchable dropdown component matching @jobber/components Combobox API.
 * Used for selecting a single item from a list with search/filter capability.
 *
 * @see https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-combobox--docs
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  createContext,
  useContext,
} from 'react';
import { Icon } from './Icon';
import { useDebouncedCallback } from './hooks/useDebounce';

// ====================
// Types
// ====================

export interface ComboboxOption {
  /** A unique identifier for the option */
  id: string | number;
  /** The value to be visually displayed in the Combobox options list */
  label: string;
  /** An optional component to be displayed before the label */
  prefix?: React.ReactNode;
  /** Custom render function for the option */
  customRender?: (option: ComboboxOptionRenderContext) => React.ReactNode;
}

export interface ComboboxOptionRenderContext {
  id: string | number;
  label: string;
  prefix?: React.ReactNode;
  isSelected: boolean;
  defaultContent: React.ReactElement;
}

export interface ComboboxProps {
  /** The options available for selection */
  options: ComboboxOption[];
  /** The currently selected options */
  selected: ComboboxOption[];
  /** Callback function invoked upon the selection of an option */
  onSelect: (selection: ComboboxOption[]) => void;
  /** When true, Combobox will allow for multiple selections */
  multiSelect?: boolean;
  /** Placeholder text shown in the activator when nothing is selected */
  placeholder?: string;
  /** The encapsulating noun for the content of the combobox */
  subjectNoun?: string;
  /** Debounced callback function invoked on Combobox search input change */
  onSearch?: (searchValue: string) => void;
  /** The amount of time in ms to debounce the onSearch callback */
  onSearchDebounce?: number;
  /** Callback to load more options when user scrolls to bottom of list */
  onLoadMore?: () => void;
  /** Callback function invoked upon the Combobox menu closing */
  onClose?: () => void;
  /** Should the Combobox display the loading state */
  loading?: boolean;
  /** The Chip heading for the trigger */
  label?: string;
  /** Disable the combobox */
  disabled?: boolean;
  /** Show invalid state styling */
  invalid?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Children - can include Combobox.Activator for custom trigger */
  children?: React.ReactNode;
}

export interface ComboboxActivatorProps {
  children:
    | React.ReactElement
    | ((props: ComboboxActivatorRenderProps) => React.ReactElement);
}

export interface ComboboxActivatorRenderProps {
  ariaExpanded: boolean;
  ariaControls: string;
  ariaLabel?: string;
  role: 'combobox';
  open: () => void;
}

export interface ComboboxActionProps {
  /** The function to call when the action is clicked */
  onClick: (event: React.MouseEvent<HTMLButtonElement>, options: { searchValue: string }) => void;
  /** The label text of the action */
  label: string | ((options: { searchValue: string }) => string);
  /** Determine if the action is visible */
  visible?: boolean | ((options: { searchValue: string }) => boolean);
  /** Keeps the Combobox open when the action is clicked */
  keepOpenOnClick?: boolean;
}

// Context for sharing state between compound components
interface ComboboxContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  searchValue: string;
  contentId: string;
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

const useComboboxContext = () => {
  const context = useContext(ComboboxContext);
  if (!context) {
    throw new Error('Combobox compound components must be used within a Combobox');
  }
  return context;
};

// ====================
// Combobox Activator (custom trigger)
// ====================

const ComboboxActivator = ({ children }: ComboboxActivatorProps) => {
  const { open, setOpen, contentId } = useComboboxContext();

  const renderProps: ComboboxActivatorRenderProps = {
    ariaExpanded: open,
    ariaControls: contentId,
    role: 'combobox',
    open: () => setOpen(true),
  };

  if (typeof children === 'function') {
    return children(renderProps);
  }

  return React.cloneElement(children, {
    'aria-expanded': open,
    'aria-controls': contentId,
    role: 'combobox',
    onClick: (e: React.MouseEvent) => {
      children.props.onClick?.(e);
      setOpen(true);
    },
  });
};

// ====================
// Combobox Action (bottom action button)
// ====================

const ComboboxAction = ({ onClick, label, visible = true, keepOpenOnClick = false }: ComboboxActionProps) => {
  const { searchValue, setOpen } = useComboboxContext();

  const isVisible = typeof visible === 'function' ? visible({ searchValue }) : visible;
  const labelText = typeof label === 'function' ? label({ searchValue }) : label;

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      className="w-full px-3 py-2 text-left text-sm text-[var(--color-interactive)] hover:bg-[var(--color-surface--hover)] flex items-center gap-2 transition-colors"
      onClick={(e) => {
        onClick(e, { searchValue });
        if (!keepOpenOnClick) {
          setOpen(false);
        }
      }}
    >
      <Icon name="add" size="small" />
      {labelText}
    </button>
  );
};

// ====================
// Main Combobox Component
// ====================

export const Combobox = ({
  options,
  selected,
  onSelect,
  multiSelect = false,
  placeholder = 'Select...',
  subjectNoun = 'items',
  onSearch,
  onSearchDebounce = 300,
  onLoadMore,
  onClose,
  loading = false,
  label,
  disabled = false,
  invalid = false,
  className = '',
  children,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const contentId = useMemo(() => `combobox-content-${Math.random().toString(36).slice(2)}`, []);

  // Check if children contains a custom activator
  const hasCustomActivator = React.Children.toArray(children).some(
    (child) => React.isValidElement(child) && child.type === ComboboxActivator
  );

  // Check if children contains actions
  const actionElements = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === ComboboxAction
  );

  // Filter options based on search value (if not using external search)
  const filteredOptions = useMemo(() => {
    if (onSearch) {
      // External search handles filtering
      return options;
    }
    if (!searchValue) {
      return options;
    }
    const lowerSearch = searchValue.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(lowerSearch)
    );
  }, [options, searchValue, onSearch]);

  // Debounced search using useDebounce hook
  const [debouncedSearch] = useDebouncedCallback(
    (value: string) => {
      if (onSearch) {
        onSearch(value);
      }
    },
    onSearchDebounce
  );

  // Trigger debounced search when searchValue changes
  useEffect(() => {
    if (onSearch) {
      debouncedSearch(searchValue);
    }
  }, [searchValue, debouncedSearch, onSearch]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSearchValue('');
    setHighlightedIndex(-1);
    onClose?.();
  }, [onClose]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, handleClose]);

  // Focus input when opening
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Handle infinite scroll for load more
  useEffect(() => {
    if (!onLoadMore || !listRef.current || !open) return;

    const handleScroll = () => {
      const list = listRef.current;
      if (!list) return;

      const { scrollTop, scrollHeight, clientHeight } = list;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        onLoadMore();
      }
    };

    const list = listRef.current;
    list.addEventListener('scroll', handleScroll);

    return () => {
      list.removeEventListener('scroll', handleScroll);
    };
  }, [onLoadMore, open]);

  const handleOpen = useCallback(() => {
    if (!disabled) {
      setOpen(true);
    }
  }, [disabled]);

  const handleSelect = useCallback(
    (option: ComboboxOption) => {
      if (multiSelect) {
        const isSelected = selected.some((s) => s.id === option.id);
        if (isSelected) {
          onSelect(selected.filter((s) => s.id !== option.id));
        } else {
          onSelect([...selected, option]);
        }
      } else {
        onSelect([option]);
        handleClose();
      }
    },
    [selected, onSelect, multiSelect, handleClose]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          handleClose();
          break;
        case 'Home':
          event.preventDefault();
          setHighlightedIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setHighlightedIndex(filteredOptions.length - 1);
          break;
      }
    },
    [filteredOptions, highlightedIndex, handleSelect, handleClose]
  );

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedOption = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedOption) {
        highlightedOption.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const getDisplayValue = () => {
    if (selected.length === 0) {
      return placeholder;
    }
    if (selected.length === 1) {
      return selected[0].label;
    }
    return `${selected.length} ${subjectNoun} selected`;
  };

  const isOptionSelected = (option: ComboboxOption) => {
    return selected.some((s) => s.id === option.id);
  };

  const contextValue: ComboboxContextValue = {
    open,
    setOpen,
    searchValue,
    contentId,
  };

  return (
    <ComboboxContext.Provider value={contextValue}>
      <div ref={wrapperRef} className={`relative ${className}`}>
        {/* Overlay when open */}
        {open && (
          <div
            className="fixed inset-0 z-40"
            onClick={handleClose}
            aria-hidden="true"
          />
        )}

        {/* Custom activator or default trigger */}
        {hasCustomActivator ? (
          children
        ) : (
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={contentId}
            aria-haspopup="listbox"
            disabled={disabled}
            onClick={handleOpen}
            className={`
              w-full flex items-center justify-between gap-2
              px-3 py-2 min-h-[40px]
              text-sm text-left
              bg-[var(--color-surface)] border rounded-lg
              transition-colors duration-150
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[var(--color-border--hover)]'}
              ${invalid ? 'border-[var(--color-critical)]' : 'border-[var(--color-border)]'}
              ${open ? 'border-[var(--color-interactive)] ring-2 ring-[var(--color-interactive)]/20' : ''}
            `}
          >
            <span
              className={
                selected.length === 0
                  ? 'text-[var(--color-text--secondary)]'
                  : 'text-[var(--color-text)]'
              }
            >
              {getDisplayValue()}
            </span>
            <Icon
              name={open ? 'arrowUp' : 'arrowDown'}
              size="small"
              className="text-[var(--color-text--secondary)] shrink-0"
            />
          </button>
        )}

        {/* Dropdown content */}
        {open && (
          <div
            id={contentId}
            className="absolute z-50 mt-1 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden"
            role="listbox"
            aria-multiselectable={multiSelect}
          >
            {/* Search input */}
            <div className="p-2 border-b border-[var(--color-border)]">
              <div className="relative">
                <Icon
                  name="search"
                  size="small"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text--secondary)]"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Search ${subjectNoun}...`}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--color-surface--background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-interactive)] focus:ring-2 focus:ring-[var(--color-interactive)]/20"
                  aria-autocomplete="list"
                />
              </div>
            </div>

            {/* Options list */}
            <ul
              ref={listRef}
              className="max-h-60 overflow-auto py-1"
              role="listbox"
            >
              {loading ? (
                <li className="px-3 py-8 text-center text-sm text-[var(--color-text--secondary)]">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[var(--color-interactive)] border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </div>
                </li>
              ) : filteredOptions.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-[var(--color-text--secondary)]">
                  {searchValue ? `No ${subjectNoun} match "${searchValue}"` : `No ${subjectNoun} available`}
                </li>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = isOptionSelected(option);
                  const isHighlighted = index === highlightedIndex;

                  const defaultContent = (
                    <div className="flex items-center gap-2 flex-1">
                      {option.prefix}
                      <span>{option.label}</span>
                    </div>
                  );

                  const content = option.customRender
                    ? option.customRender({
                        id: option.id,
                        label: option.label,
                        prefix: option.prefix,
                        isSelected,
                        defaultContent,
                      })
                    : defaultContent;

                  return (
                    <li
                      key={option.id}
                      role="option"
                      aria-selected={isSelected}
                      className={`
                        flex items-center gap-2 px-3 py-2 text-sm cursor-pointer
                        transition-colors duration-100
                        ${isHighlighted ? 'bg-[var(--color-surface--hover)]' : ''}
                        ${isSelected ? 'bg-[var(--color-interactive)]/10' : ''}
                        hover:bg-[var(--color-surface--hover)]
                      `}
                      onClick={() => handleSelect(option)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      {multiSelect && (
                        <div
                          className={`
                            w-4 h-4 shrink-0 border rounded flex items-center justify-center
                            ${isSelected ? 'bg-[var(--color-interactive)] border-[var(--color-interactive)]' : 'border-[var(--color-border)]'}
                          `}
                        >
                          {isSelected && (
                            <Icon name="checkmark" size="small" className="text-white" />
                          )}
                        </div>
                      )}
                      {content}
                      {!multiSelect && isSelected && (
                        <Icon
                          name="checkmark"
                          size="small"
                          className="ml-auto text-[var(--color-interactive)] shrink-0"
                        />
                      )}
                    </li>
                  );
                })
              )}
            </ul>

            {/* Actions */}
            {actionElements.length > 0 && (
              <div className="border-t border-[var(--color-border)]">
                {actionElements}
              </div>
            )}
          </div>
        )}
      </div>
    </ComboboxContext.Provider>
  );
};

// Attach compound components
Combobox.Activator = ComboboxActivator;
Combobox.Action = ComboboxAction;

export type { ComboboxProps as ComboboxComponentProps };
