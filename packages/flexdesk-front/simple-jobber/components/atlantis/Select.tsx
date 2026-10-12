/**
 * Select - Local implementation matching @jobber/components Select API
 *
 * This provides the same interface as the Atlantis component library's Select,
 * allowing future migration to the actual library when fully integrated.
 *
 * Supports two modes:
 * - Native mode (default): Uses a native <select> element
 * - Searchable mode: Custom dropdown with search/filter for long lists
 *
 * @see https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-select--docs
 */
import React, { forwardRef, useId, useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

export type SelectSize = 'small' | 'large';

export interface SelectOption {
  /**
   * Option value (used as the actual value)
   */
  readonly value: string | number;

  /**
   * Option label (displayed to user)
   */
  readonly label: string;

  /**
   * Whether the option is disabled
   */
  readonly disabled?: boolean;
}

export interface SelectProps {
  /**
   * Select value
   */
  readonly value?: string | number;

  /**
   * Default value for uncontrolled usage
   */
  readonly defaultValue?: string | number;

  /**
   * Placeholder text when no value is selected
   */
  readonly placeholder?: string;

  /**
   * Select name attribute
   */
  readonly name?: string;

  /**
   * Select id attribute
   */
  readonly id?: string;

  /**
   * Whether the select is disabled
   * @default false
   */
  readonly disabled?: boolean;

  /**
   * Whether the select is in an invalid state
   * @default false
   */
  readonly invalid?: boolean;

  /**
   * Whether the select is required
   * @default false
   */
  readonly required?: boolean;

  /**
   * Size variant
   */
  readonly size?: SelectSize;

  /**
   * Options to display in the select
   */
  readonly options?: SelectOption[];

  /**
   * Children (option elements) - alternative to options prop (native mode only)
   */
  readonly children?: React.ReactNode;

  /**
   * Custom class name
   */
  readonly className?: string;

  /**
   * Whether the select should be inline (compact width)
   * @default false
   */
  readonly inline?: boolean;

  /**
   * Description text displayed below the input
   */
  readonly description?: string;

  /**
   * Error message to display
   */
  readonly error?: string;

  /**
   * Prefix icon or text
   */
  readonly prefix?: React.ReactNode;

  /**
   * Suffix icon or text
   */
  readonly suffix?: React.ReactNode;

  /**
   * Text alignment
   */
  readonly align?: 'left' | 'center' | 'right';

  /**
   * Whether to show a clear button when a value is selected
   * @default false
   */
  readonly clearable?: boolean;

  /**
   * Whether to show a search input in the dropdown for filtering options.
   * When enabled, renders a custom dropdown instead of native <select>.
   * @default false
   */
  readonly searchable?: boolean;

  /**
   * Change handler - receives the new value
   */
  readonly onChange?: (value: string | number | undefined) => void;

  /**
   * Native change handler (native mode only)
   */
  readonly onNativeChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;

  /**
   * Focus handler
   */
  readonly onFocus?: (event: React.FocusEvent<HTMLSelectElement>) => void;

  /**
   * Blur handler
   */
  readonly onBlur?: (event: React.FocusEvent<HTMLSelectElement>) => void;

  /**
   * Aria label for accessibility
   */
  readonly ariaLabel?: string;

  /**
   * Aria describedby for accessibility
   */
  readonly ariaDescribedBy?: string;

  /**
   * Whether to autofocus on mount
   * @default false
   */
  readonly autoFocus?: boolean;
}

/**
 * Select component following Atlantis/Jobber design system
 *
 * @example
 * // Basic usage with options prop
 * <Select
 *   placeholder="Select a status"
 *   options={[
 *     { value: 'active', label: 'Active' },
 *     { value: 'inactive', label: 'Inactive' },
 *   ]}
 *   onChange={(value) => console.log(value)}
 * />
 *
 * @example
 * // Searchable mode for long lists
 * <Select
 *   placeholder="Select a country"
 *   options={countries}
 *   searchable
 *   onChange={(value) => console.log(value)}
 * />
 *
 * @example
 * // Usage with children (option elements) - native mode only
 * <Select placeholder="Select a status" onChange={(value) => console.log(value)}>
 *   <option value="active">Active</option>
 *   <option value="inactive">Inactive</option>
 * </Select>
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(props, ref) {
    const {
      value,
      defaultValue,
      placeholder,
      name,
      id: providedId,
      disabled = false,
      invalid = false,
      required = false,
      size,
      options,
      children,
      className,
      inline = false,
      description,
      error,
      prefix,
      suffix,
      align = 'left',
      clearable = false,
      searchable = false,
      onChange,
      onNativeChange,
      onFocus,
      onBlur,
      ariaLabel,
      ariaDescribedBy,
      autoFocus = false,
    } = props;

    const generatedId = useId();
    const id = providedId || generatedId;
    const descriptionId = `${id}-description`;
    const errorId = `${id}-error`;
    const listboxId = `${id}-listbox`;
    const internalRef = useRef<HTMLSelectElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [internalValue, setInternalValue] = useState<string | number | undefined>(defaultValue);
    const [isFocused, setIsFocused] = useState(false);

    // Searchable mode state
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);

    // Use controlled value if provided, otherwise use internal state
    const currentValue = value !== undefined ? value : internalValue;
    const isInvalid = Boolean(error || invalid);

    // Get display label for current value
    const displayLabel = (() => {
      if (currentValue === undefined || currentValue === '') {
        return placeholder || '';
      }
      const selected = options?.find(opt => String(opt.value) === String(currentValue));
      return selected?.label || String(currentValue);
    })();

    // Filter options based on search query (searchable mode)
    const filteredOptions = searchable && searchQuery && options
      ? options.filter(option =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : (options || []);

    // === Native mode handlers ===

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value;

      // Parse numeric values if original options were numeric
      let parsedValue: string | number | undefined = newValue;
      if (newValue === '') {
        parsedValue = undefined;
      } else if (options?.some(opt => typeof opt.value === 'number')) {
        const numValue = Number(newValue);
        if (!isNaN(numValue)) {
          parsedValue = numValue;
        }
      }

      if (value === undefined) {
        setInternalValue(parsedValue);
      }

      onChange?.(parsedValue);
      onNativeChange?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (value === undefined) {
        setInternalValue(undefined);
      }

      onChange?.(undefined);
    };

    // === Searchable mode handlers ===

    const handleToggle = useCallback(() => {
      if (disabled) return;
      setIsOpen(prev => {
        if (!prev) {
          // Opening - focus search input
          setTimeout(() => searchRef.current?.focus(), 0);
        }
        return !prev;
      });
    }, [disabled]);

    const handleClose = useCallback(() => {
      setIsOpen(false);
      setSearchQuery('');
      setFocusedIndex(-1);
    }, []);

    const handleOptionSelect = useCallback((optionValue: string | number) => {
      // Parse numeric values if original options were numeric
      let parsedValue: string | number = optionValue;
      if (options?.some(opt => typeof opt.value === 'number') && typeof optionValue === 'string') {
        const numValue = Number(optionValue);
        if (!isNaN(numValue)) {
          parsedValue = numValue;
        }
      }

      if (value === undefined) {
        setInternalValue(parsedValue);
      }

      onChange?.(parsedValue);
      handleClose();
    }, [options, value, onChange, handleClose]);

    const handleSearchableKeyDown = useCallback((e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (!isOpen) {
            handleToggle();
          } else if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            const option = filteredOptions[focusedIndex];
            if (!option.disabled) {
              handleOptionSelect(option.value);
            }
          }
          break;
        case ' ':
          if (!isOpen) {
            e.preventDefault();
            handleToggle();
          }
          // Allow space in search input when open
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            handleToggle();
          } else {
            setFocusedIndex(prev => {
              // Skip disabled options
              let next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
              let attempts = 0;
              while (filteredOptions[next]?.disabled && attempts < filteredOptions.length) {
                next = next < filteredOptions.length - 1 ? next + 1 : 0;
                attempts++;
              }
              return next;
            });
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setFocusedIndex(prev => {
              let next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
              let attempts = 0;
              while (filteredOptions[next]?.disabled && attempts < filteredOptions.length) {
                next = next > 0 ? next - 1 : filteredOptions.length - 1;
                attempts++;
              }
              return next;
            });
          }
          break;
        case 'Home':
          if (isOpen) {
            e.preventDefault();
            setFocusedIndex(0);
          }
          break;
        case 'End':
          if (isOpen) {
            e.preventDefault();
            setFocusedIndex(filteredOptions.length - 1);
          }
          break;
      }
    }, [isOpen, focusedIndex, filteredOptions, handleToggle, handleOptionSelect, handleClose]);

    // Close dropdown when clicking outside (searchable mode)
    useEffect(() => {
      if (!searchable || !isOpen) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          handleClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchable, isOpen, handleClose]);

    // Reset focused index when search query changes
    useEffect(() => {
      setFocusedIndex(-1);
    }, [searchQuery]);

    // Scroll focused option into view
    useEffect(() => {
      if (focusedIndex >= 0 && listRef.current) {
        const focusedOption = listRef.current.children[focusedIndex] as HTMLElement;
        if (focusedOption) {
          focusedOption.scrollIntoView({ block: 'nearest' });
        }
      }
    }, [focusedIndex]);

    // Determine aria-describedby
    const getAriaDescribedBy = () => {
      const ids: string[] = [];
      if (ariaDescribedBy) ids.push(ariaDescribedBy);
      if (description) ids.push(descriptionId);
      if (error) ids.push(errorId);
      return ids.length > 0 ? ids.join(' ') : undefined;
    };

    // === Shared styles ===

    const wrapperStyles = cn(
      'relative flex flex-col',
      inline && 'inline-flex',
      className,
    );

    const sizeClasses = size === 'small' ? 'h-8 px-2.5 text-sm' : size === 'large' ? 'h-12 px-4 text-base' : 'h-10 px-3 text-sm';

    // === Searchable mode render ===

    if (searchable) {
      const triggerStyles = cn(
        'w-full bg-transparent text-[--color-text] cursor-pointer',
        'border border-[--color-border] rounded-lg',
        'transition-all duration-200',
        'outline-none text-left',
        'flex items-center gap-2',
        'focus:border-[--color-interactive] focus:ring-2 focus:ring-[--color-interactive--subtle]',
        isInvalid && 'border-[--color-critical] focus:border-[--color-critical] focus:ring-[--color-critical--surface]',
        disabled && 'opacity-50 cursor-not-allowed bg-[--color-surface--background]',
        isOpen && 'border-[--color-interactive] ring-2 ring-[--color-interactive--subtle]',
        sizeClasses,
        prefix && 'pl-9',
      );

      const dropdownStyles = cn(
        'absolute z-50 mt-1 w-full bg-[--color-surface] border border-[--color-border] rounded-lg shadow-lg',
        'overflow-hidden',
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none',
        'transition-opacity duration-150',
      );

      return (
        <div className={wrapperStyles}>
          <div ref={containerRef} className="relative">
            {/* Hidden input for form submission */}
            {name && (
              <input type="hidden" name={name} value={currentValue ?? ''} />
            )}

            {/* Prefix */}
            {prefix && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-text--secondary] pointer-events-none z-10">
                {prefix}
              </span>
            )}

            {/* Trigger button */}
            <button
              type="button"
              id={id}
              disabled={disabled}
              aria-label={ariaLabel}
              aria-describedby={getAriaDescribedBy()}
              aria-invalid={isInvalid ? true : undefined}
              aria-required={required}
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-controls={listboxId}
              autoFocus={autoFocus}
              onClick={handleToggle}
              onKeyDown={handleSearchableKeyDown}
              className={triggerStyles}
            >
              <span className={cn(
                'flex-1 truncate',
                align === 'center' && 'text-center',
                align === 'right' && 'text-right',
                (!currentValue && currentValue !== 0) && 'text-[--color-text--secondary]',
              )}>
                {displayLabel}
              </span>

              <div className="flex items-center gap-1 shrink-0">
                {/* Clear button */}
                {clearable && currentValue !== undefined && currentValue !== '' && !disabled && (
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={handleClear}
                    className="p-0.5 text-[--color-text--secondary] hover:text-[--color-text] transition-colors"
                    aria-label="Clear selection"
                  >
                    <Icon name="cross" size="small" />
                  </span>
                )}

                {/* Suffix */}
                {suffix && (
                  <span className="text-[--color-text--secondary]">{suffix}</span>
                )}

                {/* Chevron */}
                <Icon
                  name={isOpen ? 'arrowUp' : 'arrowDown'}
                  size="small"
                  className="text-[--color-text--secondary]"
                />
              </div>
            </button>

            {/* Dropdown */}
            <div
              id={listboxId}
              className={dropdownStyles}
            >
              {/* Search input */}
              <div className="p-2 border-b border-[--color-border]">
                <div className="relative">
                  <Icon
                    name="search"
                    size="small"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-text--secondary]"
                  />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchableKeyDown}
                    className={cn(
                      'w-full pl-9 pr-3 py-1.5 text-sm bg-transparent border border-[--color-border] rounded',
                      'outline-none focus:border-[--color-interactive]',
                    )}
                    onClick={(e) => e.stopPropagation()}
                    aria-autocomplete="list"
                    aria-controls={`${listboxId}-options`}
                  />
                </div>
              </div>

              {/* Options list */}
              <div
                ref={listRef}
                id={`${listboxId}-options`}
                role="listbox"
                aria-label={ariaLabel || placeholder}
                className="max-h-60 overflow-auto py-1"
              >
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-[--color-text--secondary]">
                    {searchQuery ? `No options match "${searchQuery}"` : 'No options available'}
                  </div>
                ) : (
                  filteredOptions.map((option, index) => {
                    const isSelected = String(currentValue) === String(option.value);
                    const isFocusedOption = index === focusedIndex;

                    return (
                      <div
                        key={option.value}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={option.disabled ? true : undefined}
                        onClick={() => !option.disabled && handleOptionSelect(option.value)}
                        onMouseEnter={() => setFocusedIndex(index)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer',
                          'transition-colors duration-100',
                          isFocusedOption && 'bg-[--color-surface--hover]',
                          isSelected && !isFocusedOption && 'bg-[--color-interactive--subtle]',
                          option.disabled && 'opacity-50 cursor-not-allowed',
                          !option.disabled && !isFocusedOption && 'hover:bg-[--color-surface--hover]',
                        )}
                      >
                        <span className="flex-1">{option.label}</span>
                        {isSelected && (
                          <Icon
                            name="checkmark"
                            size="small"
                            className="text-[--color-interactive] shrink-0"
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {description && !error && (
            <p
              id={descriptionId}
              className="mt-1 text-sm text-[--color-text--secondary]"
            >
              {description}
            </p>
          )}

          {/* Error message */}
          {error && (
            <p
              id={errorId}
              className="mt-1 text-sm text-[--color-critical]"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      );
    }

    // === Native mode render ===

    // Select container styles
    const containerStyles = cn(
      'relative flex items-center',
    );

    // Select input styles
    const selectStyles = cn(
      // Base styling
      'w-full bg-transparent text-[--color-text] appearance-none cursor-pointer',
      'border border-[--color-border] rounded-lg',
      'transition-all duration-200',
      'outline-none',
      // Focus state
      'focus:border-[--color-interactive] focus:ring-2 focus:ring-[--color-interactive--subtle]',
      // Invalid state
      isInvalid && 'border-[--color-critical] focus:border-[--color-critical] focus:ring-[--color-critical--surface]',
      // Disabled state
      disabled && 'opacity-50 cursor-not-allowed bg-[--color-surface--background]',
      // Size variants
      sizeClasses,
      // Padding for icons
      prefix && 'pl-9',
      'pr-8', // Always reserve space for chevron
      clearable && currentValue && 'pr-14', // Extra space for clear button
      // Text alignment
      align === 'center' && 'text-center',
      align === 'right' && 'text-right',
    );

    // Icon styles
    const iconStyles = 'absolute top-1/2 -translate-y-1/2 text-[--color-text--secondary] pointer-events-none';

    return (
      <div className={wrapperStyles}>
        <div className={containerStyles}>
          {/* Prefix */}
          {prefix && (
            <span className={cn(iconStyles, 'left-3')}>
              {typeof prefix === 'string' ? prefix : prefix}
            </span>
          )}

          {/* Select */}
          <select
            ref={ref || internalRef}
            id={id}
            name={name}
            value={currentValue ?? ''}
            disabled={disabled}
            required={required}
            autoFocus={autoFocus}
            aria-label={ariaLabel}
            aria-describedby={getAriaDescribedBy()}
            aria-invalid={isInvalid ? true : undefined}
            aria-required={required}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={selectStyles}
          >
            {/* Placeholder option */}
            {placeholder && (
              <option value="" disabled={required}>
                {placeholder}
              </option>
            )}

            {/* Options from prop */}
            {options?.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}

            {/* Children (option elements) */}
            {children}
          </select>

          {/* Clear button */}
          {clearable && currentValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-[--color-text--secondary] hover:text-[--color-text] transition-colors"
              aria-label="Clear selection"
            >
              <Icon name="cross" size="small" />
            </button>
          )}

          {/* Chevron icon */}
          <Icon
            name="arrowDown"
            size="small"
            className={cn(iconStyles, 'right-3')}
          />

          {/* Suffix */}
          {suffix && (
            <span className={cn('absolute top-1/2 -translate-y-1/2 text-[--color-text--secondary]',
              clearable && currentValue ? 'right-14' : 'right-8'
            )}>
              {typeof suffix === 'string' ? suffix : suffix}
            </span>
          )}
        </div>

        {/* Description */}
        {description && !error && (
          <p
            id={descriptionId}
            className="mt-1 text-sm text-[--color-text--secondary]"
          >
            {description}
          </p>
        )}

        {/* Error message */}
        {error && (
          <p
            id={errorId}
            className="mt-1 text-sm text-[--color-critical]"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
