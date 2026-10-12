/**
 * MultiSelect - Local implementation matching @jobber/components MultiSelect API
 *
 * This provides the same interface as the Atlantis component library's MultiSelect,
 * allowing future migration to the actual library when fully integrated.
 *
 * @see https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-multiselect--docs
 */
import React, { forwardRef, useId, useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';
import type { SelectOption } from './Select';

export type MultiSelectSize = 'small' | 'large';

export interface MultiSelectProps {
  /**
   * Selected values (array of option values)
   */
  readonly value?: (string | number)[];

  /**
   * Default values for uncontrolled usage
   */
  readonly defaultValue?: (string | number)[];

  /**
   * Placeholder text when no values are selected
   */
  readonly placeholder?: string;

  /**
   * Name attribute for form submission
   */
  readonly name?: string;

  /**
   * ID attribute
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
  readonly size?: MultiSelectSize;

  /**
   * Options to display in the dropdown
   */
  readonly options: SelectOption[];

  /**
   * Custom class name
   */
  readonly className?: string;

  /**
   * Description text displayed below the input
   */
  readonly description?: string;

  /**
   * Error message to display
   */
  readonly error?: string;

  /**
   * Label text for display (e.g., "3 selected")
   */
  readonly getLabel?: (selectedCount: number) => string;

  /**
   * Maximum number of selections allowed
   */
  readonly maxSelections?: number;

  /**
   * Whether to show a search input in the dropdown
   * @default false
   */
  readonly searchable?: boolean;

  /**
   * Change handler - receives the new array of values
   */
  readonly onChange?: (values: (string | number)[]) => void;

  /**
   * Focus handler
   */
  readonly onFocus?: () => void;

  /**
   * Blur handler
   */
  readonly onBlur?: () => void;

  /**
   * Aria label for accessibility
   */
  readonly ariaLabel?: string;
}

/**
 * MultiSelect component following Atlantis/Jobber design system
 *
 * @example
 * // Basic usage
 * <MultiSelect
 *   placeholder="Select statuses"
 *   options={[
 *     { value: 'DRAFT', label: 'Draft' },
 *     { value: 'SENT', label: 'Sent' },
 *     { value: 'PAID', label: 'Paid' },
 *   ]}
 *   onChange={(values) => console.log(values)}
 * />
 *
 * @example
 * // With search and max selections
 * <MultiSelect
 *   placeholder="Select tags"
 *   options={tags}
 *   searchable
 *   maxSelections={5}
 *   onChange={(values) => setSelectedTags(values)}
 * />
 */
export const MultiSelect = forwardRef<HTMLDivElement, MultiSelectProps>(
  function MultiSelect(props, ref) {
    const {
      value,
      defaultValue = [],
      placeholder = 'Select...',
      name,
      id: providedId,
      disabled = false,
      invalid = false,
      required = false,
      size,
      options,
      className,
      description,
      error,
      getLabel,
      maxSelections,
      searchable = false,
      onChange,
      onFocus,
      onBlur,
      ariaLabel,
    } = props;

    const generatedId = useId();
    const id = providedId || generatedId;
    const descriptionId = `${id}-description`;
    const errorId = `${id}-error`;
    const listboxId = `${id}-listbox`;
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState<(string | number)[]>(defaultValue);
    const [searchQuery, setSearchQuery] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);

    // Use controlled value if provided, otherwise use internal state
    const currentValue = value !== undefined ? value : internalValue;
    const isInvalid = Boolean(error || invalid);

    // Filter options based on search query
    const filteredOptions = searchable && searchQuery
      ? options.filter(option =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;

    // Get display text
    const displayText = (() => {
      if (currentValue.length === 0) {
        return placeholder;
      }
      if (getLabel) {
        return getLabel(currentValue.length);
      }
      if (currentValue.length === 1) {
        const selectedOption = options.find(opt => opt.value === currentValue[0]);
        return selectedOption?.label || '1 selected';
      }
      return `${currentValue.length} selected`;
    })();

    const handleToggle = useCallback(() => {
      if (disabled) return;

      setIsOpen(prev => {
        if (!prev) {
          // Opening - focus search input if searchable
          setTimeout(() => searchRef.current?.focus(), 0);
          onFocus?.();
        }
        return !prev;
      });
    }, [disabled, onFocus]);

    const handleOptionToggle = useCallback((optionValue: string | number) => {
      const isSelected = currentValue.includes(optionValue);

      let newValue: (string | number)[];
      if (isSelected) {
        // Remove from selection
        newValue = currentValue.filter(v => v !== optionValue);
      } else {
        // Add to selection (respecting maxSelections)
        if (maxSelections && currentValue.length >= maxSelections) {
          return; // Don't allow more selections
        }
        newValue = [...currentValue, optionValue];
      }

      if (value === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    }, [currentValue, maxSelections, onChange, value]);

    const handleClearAll = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (value === undefined) {
        setInternalValue([]);
      }
      onChange?.([]);
    }, [onChange, value]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          if (!isOpen) {
            e.preventDefault();
            handleToggle();
          } else if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            e.preventDefault();
            handleOptionToggle(filteredOptions[focusedIndex].value);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearchQuery('');
          onBlur?.();
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            handleToggle();
          } else {
            setFocusedIndex(prev =>
              prev < filteredOptions.length - 1 ? prev + 1 : 0
            );
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setFocusedIndex(prev =>
              prev > 0 ? prev - 1 : filteredOptions.length - 1
            );
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
    }, [isOpen, focusedIndex, filteredOptions, handleToggle, handleOptionToggle, onBlur]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
          setSearchQuery('');
          onBlur?.();
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen, onBlur]);

    // Reset focused index when options change
    useEffect(() => {
      setFocusedIndex(-1);
    }, [searchQuery]);

    // Wrapper styles
    const wrapperStyles = cn('relative flex flex-col', className);

    // Trigger button styles
    const triggerStyles = cn(
      // Base styling
      'w-full bg-transparent text-[--color-text] cursor-pointer',
      'border border-[--color-border] rounded-lg',
      'transition-all duration-200',
      'outline-none text-left',
      'flex items-center justify-between gap-2',
      // Focus state
      'focus:border-[--color-interactive] focus:ring-2 focus:ring-[--color-interactive--subtle]',
      // Invalid state
      isInvalid && 'border-[--color-critical] focus:border-[--color-critical] focus:ring-[--color-critical--surface]',
      // Disabled state
      disabled && 'opacity-50 cursor-not-allowed bg-[--color-surface--background]',
      // Open state
      isOpen && 'border-[--color-interactive] ring-2 ring-[--color-interactive--subtle]',
      // Size variants
      size === 'small' ? 'h-8 px-2.5 text-sm' : size === 'large' ? 'h-12 px-4 text-base' : 'h-10 px-3 text-sm',
    );

    // Dropdown styles
    const dropdownStyles = cn(
      'absolute z-50 mt-1 w-full bg-[--color-surface] border border-[--color-border] rounded-lg shadow-lg',
      'max-h-60 overflow-auto',
      isOpen ? 'opacity-100 visible' : 'opacity-0 invisible',
      'transition-opacity duration-150',
    );

    // Option styles
    const getOptionStyles = (option: SelectOption, index: number) => {
      const isSelected = currentValue.includes(option.value);
      const isFocused = index === focusedIndex;
      const isDisabledOption = option.disabled || (maxSelections && currentValue.length >= maxSelections && !isSelected);

      return cn(
        'flex items-center gap-2 px-3 py-2 cursor-pointer',
        'transition-colors duration-100',
        isFocused && 'bg-[--color-surface--hover]',
        isSelected && 'bg-[--color-interactive--subtle]',
        isDisabledOption && 'opacity-50 cursor-not-allowed',
        !isDisabledOption && !isFocused && 'hover:bg-[--color-surface--hover]',
      );
    };

    // Checkbox styles
    const getCheckboxStyles = (isSelected: boolean) => cn(
      'flex items-center justify-center w-4 h-4 border rounded',
      'transition-colors duration-100',
      isSelected
        ? 'bg-[--color-interactive] border-[--color-interactive] text-white'
        : 'border-[--color-border]',
    );

    // Determine aria-describedby
    const getAriaDescribedBy = () => {
      const ids: string[] = [];
      if (description) ids.push(descriptionId);
      if (error) ids.push(errorId);
      return ids.length > 0 ? ids.join(' ') : undefined;
    };

    return (
      <div className={wrapperStyles} ref={ref || containerRef}>
        <div ref={containerRef} className="relative">
          {/* Hidden inputs for form submission */}
          {name && currentValue.map((v, i) => (
            <input key={i} type="hidden" name={name} value={v} />
          ))}

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
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            className={triggerStyles}
          >
            <span className={cn(
              'flex-1 truncate',
              currentValue.length === 0 && 'text-[--color-text--secondary]',
            )}>
              {displayText}
            </span>

            <div className="flex items-center gap-1">
              {/* Clear button */}
              {currentValue.length > 0 && !disabled && (
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={handleClearAll}
                  className="p-0.5 text-[--color-text--secondary] hover:text-[--color-text] transition-colors"
                  aria-label="Clear all selections"
                >
                  <Icon name="cross" size="small" />
                </span>
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
            role="listbox"
            aria-multiselectable="true"
            aria-label={ariaLabel || placeholder}
            className={dropdownStyles}
          >
            {/* Search input */}
            {searchable && isOpen && (
              <div className="p-2 border-b border-[--color-border]">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-full px-2 py-1.5 text-sm bg-transparent border border-[--color-border] rounded',
                    'outline-none focus:border-[--color-interactive]',
                  )}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Options list */}
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-[--color-text--secondary]">
                No options found
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = currentValue.includes(option.value);
                const isDisabledOption = option.disabled || (maxSelections && currentValue.length >= maxSelections && !isSelected);

                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabledOption ? true : undefined}
                    onClick={() => !isDisabledOption && handleOptionToggle(option.value)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={getOptionStyles(option, index)}
                  >
                    {/* Checkbox indicator */}
                    <span className={getCheckboxStyles(isSelected)}>
                      {isSelected && (
                        <Icon name="checkmark" size="small" />
                      )}
                    </span>

                    {/* Option label */}
                    <span className="flex-1 text-sm">{option.label}</span>
                  </div>
                );
              })
            )}
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
);

MultiSelect.displayName = 'MultiSelect';

export default MultiSelect;
