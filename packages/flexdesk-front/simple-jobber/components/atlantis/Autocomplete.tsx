/**
 * Autocomplete Component
 *
 * Atlantis-style type-ahead input component matching @jobber/components Autocomplete API.
 * Used for free-form text input with suggestions that appear as the user types.
 *
 * Key differences from Combobox:
 * - Autocomplete: Free-form input where user can type anything, suggestions are optional
 * - Combobox: Selection from a fixed list of options
 *
 * @see https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-autocomplete--docs
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { Icon } from './Icon';
import { useDebouncedCallback } from './hooks/useDebounce';

// ====================
// Types
// ====================

export interface AutocompleteOption {
  /** A unique identifier for the option */
  id: string | number;
  /** The value to be visually displayed */
  label: string;
  /** Optional description shown below the label */
  description?: string;
  /** Custom data that will be passed back on selection */
  data?: unknown;
}

export interface AutocompleteProps {
  /** Current input value */
  value: string;
  /** Callback when input value changes */
  onChange: (value: string) => void;
  /** Callback when an option is selected from suggestions */
  onSelect?: (option: AutocompleteOption) => void;
  /** Function to get autocomplete options based on input value */
  getOptions: (inputValue: string) => Promise<AutocompleteOption[]> | AutocompleteOption[];
  /** Debounce time in ms for getOptions calls (default: 300) */
  debounce?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum characters required before showing suggestions (default: 1) */
  minChars?: number;
  /** Maximum number of suggestions to show (default: 10) */
  maxSuggestions?: number;
  /** Text to show when no suggestions found */
  noResultsText?: string;
  /** Loading text shown while fetching suggestions */
  loadingText?: string;
  /** Size variant */
  size?: 'small' | 'large';
  /** Show invalid state */
  invalid?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Read-only state */
  readonly?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Input name attribute */
  name?: string;
  /** Input id attribute */
  id?: string;
  /** Prefix icon name */
  prefix?: string;
  /** Whether to clear suggestions when input loses focus */
  clearOnBlur?: boolean;
  /** Aria label for accessibility */
  ariaLabel?: string;
}

// ====================
// Main Autocomplete Component
// ====================

export const Autocomplete = ({
  value,
  onChange,
  onSelect,
  getOptions,
  debounce = 300,
  placeholder = '',
  minChars = 1,
  maxSuggestions = 10,
  noResultsText = 'No results found',
  loadingText = 'Loading...',
  size,
  invalid = false,
  disabled = false,
  readonly = false,
  className = '',
  name,
  id,
  prefix,
  clearOnBlur = true,
  ariaLabel,
}: AutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const fetchIdRef = useRef(0);

  const listId = useMemo(() => `autocomplete-list-${id || Math.random().toString(36).slice(2)}`, [id]);

  // Size classes
  const sizeClasses = {
    small: 'text-sm py-1.5',
    large: 'text-base py-3',
    default: 'text-sm py-2',
  };

  const inputSizeClass = sizeClasses[size || 'default'];

  // Fetch options with debounce
  const fetchOptions = useCallback(
    async (inputValue: string) => {
      const fetchId = ++fetchIdRef.current;

      if (inputValue.length < minChars) {
        setOptions([]);
        setHasSearched(false);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);

      try {
        const result = await getOptions(inputValue);
        // Only update if this is still the latest request
        if (fetchId === fetchIdRef.current) {
          setOptions(result.slice(0, maxSuggestions));
          setIsOpen(true);
          setHighlightedIndex(-1);
        }
      } catch (error) {
        console.error('Error fetching autocomplete options:', error);
        if (fetchId === fetchIdRef.current) {
          setOptions([]);
        }
      } finally {
        if (fetchId === fetchIdRef.current) {
          setLoading(false);
        }
      }
    },
    [getOptions, minChars, maxSuggestions]
  );

  // Debounced fetch using useDebounce hook
  const [debouncedFetchOptions] = useDebouncedCallback(fetchOptions, debounce);

  // Trigger debounced fetch when value changes
  useEffect(() => {
    debouncedFetchOptions(value);
  }, [value, debouncedFetchOptions]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (clearOnBlur) {
          setIsOpen(false);
          setOptions([]);
          setHasSearched(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, clearOnBlur]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedOption = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedOption) {
        highlightedOption.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
    },
    [onChange]
  );

  const handleSelect = useCallback(
    (option: AutocompleteOption) => {
      onChange(option.label);
      onSelect?.(option);
      setIsOpen(false);
      setOptions([]);
      setHasSearched(false);
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    },
    [onChange, onSelect]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isOpen) {
        if (event.key === 'ArrowDown' && options.length > 0) {
          event.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && options[highlightedIndex]) {
            handleSelect(options[highlightedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          break;
        case 'Tab':
          setIsOpen(false);
          break;
        case 'Home':
          if (isOpen) {
            event.preventDefault();
            setHighlightedIndex(0);
          }
          break;
        case 'End':
          if (isOpen) {
            event.preventDefault();
            setHighlightedIndex(options.length - 1);
          }
          break;
      }
    },
    [isOpen, options, highlightedIndex, handleSelect]
  );

  const handleFocus = useCallback(() => {
    // Re-open suggestions if we have previous results
    if (value.length >= minChars && options.length > 0) {
      setIsOpen(true);
    }
  }, [value, minChars, options.length]);

  const showDropdown = isOpen && (loading || hasSearched);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        {prefix && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text--secondary)] pointer-events-none">
            <Icon name={prefix as 'search'} size="small" />
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readonly}
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-controls={isOpen ? listId : undefined}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-activedescendant={
            highlightedIndex >= 0 ? `${listId}-option-${highlightedIndex}` : undefined
          }
          role="combobox"
          className={`
            w-full px-3 ${inputSizeClass}
            ${prefix ? 'pl-9' : ''}
            bg-[var(--color-surface)] text-[var(--color-text)]
            border rounded-lg
            placeholder:text-[var(--color-text--secondary)]
            focus:outline-none focus:border-[var(--color-interactive)] focus:ring-2 focus:ring-[var(--color-interactive)]/20
            transition-colors duration-150
            ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--color-surface--background)]' : ''}
            ${readonly ? 'bg-[var(--color-surface--background)]' : ''}
            ${invalid ? 'border-[var(--color-critical)]' : 'border-[var(--color-border)]'}
          `}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[var(--color-interactive)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg py-1"
        >
          {loading ? (
            <li className="px-3 py-4 text-center text-sm text-[var(--color-text--secondary)]">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[var(--color-interactive)] border-t-transparent rounded-full animate-spin" />
                {loadingText}
              </div>
            </li>
          ) : options.length === 0 ? (
            <li className="px-3 py-4 text-center text-sm text-[var(--color-text--secondary)]">
              {noResultsText}
            </li>
          ) : (
            options.map((option, index) => {
              const isHighlighted = index === highlightedIndex;

              return (
                <li
                  key={option.id}
                  id={`${listId}-option-${index}`}
                  role="option"
                  aria-selected={isHighlighted}
                  className={`
                    px-3 py-2 cursor-pointer
                    transition-colors duration-100
                    ${isHighlighted ? 'bg-[var(--color-surface--hover)]' : ''}
                    hover:bg-[var(--color-surface--hover)]
                  `}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="text-sm text-[var(--color-text)]">
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-xs text-[var(--color-text--secondary)] mt-0.5">
                      {option.description}
                    </div>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
};

