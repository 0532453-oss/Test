/**
 * InputDate - Local implementation matching @jobber/components InputDate API
 *
 * Integrates with DatePicker for calendar selection, supports manual date entry
 * with validation, and shows an appropriate date format placeholder.
 *
 * Uses the converted InputDateIcon as a design reference for the input appearance.
 *
 * @see https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-inputdate--docs
 */
import React, { forwardRef, useState, useRef, useCallback, useEffect, useId } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';
import { DatePicker } from './DatePicker';

export type InputDateSize = 'small' | 'large';

export interface InputDateProps {
  /**
   * Input value in YYYY-MM-DD format
   */
  readonly value?: string;

  /**
   * Default value for uncontrolled usage
   */
  readonly defaultValue?: string;

  /**
   * Placeholder text
   * @default "MM/DD/YYYY"
   */
  readonly placeholder?: string;

  /**
   * Input name attribute
   */
  readonly name?: string;

  /**
   * Input id attribute
   */
  readonly id?: string;

  /**
   * Whether the input is disabled
   * @default false
   */
  readonly disabled?: boolean;

  /**
   * Whether the input is readonly
   * @default false
   */
  readonly readonly?: boolean;

  /**
   * Whether the input is required
   * @default false
   */
  readonly required?: boolean;

  /**
   * Whether the input is in an invalid state
   * @default false
   */
  readonly invalid?: boolean;

  /**
   * Size variant
   */
  readonly size?: InputDateSize;

  /**
   * Minimum date in YYYY-MM-DD format
   */
  readonly minDate?: string;

  /**
   * Maximum date in YYYY-MM-DD format
   */
  readonly maxDate?: string;

  /**
   * Custom class name
   */
  readonly className?: string;

  /**
   * Input class name (applied to the actual input element)
   */
  readonly inputClassName?: string;

  /**
   * Change handler - receives YYYY-MM-DD string
   */
  readonly onChange?: (value: string) => void;

  /**
   * Native change handler - for react-admin compatibility
   */
  readonly onNativeChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;

  /**
   * Focus handler
   */
  readonly onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;

  /**
   * Blur handler
   */
  readonly onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;

  /**
   * Aria label for accessibility
   */
  readonly ariaLabel?: string;

  /**
   * Aria describedby for accessibility
   */
  readonly ariaDescribedBy?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DISPLAY_FORMAT_REGEX = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const DEFAULT_PLACEHOLDER = 'MM/DD/YYYY';

/**
 * Convert YYYY-MM-DD to display format MM/DD/YYYY
 */
function toDisplayFormat(isoDate: string): string {
  if (!isoDate || !DATE_REGEX.test(isoDate)) return '';
  const [year, month, day] = isoDate.split('-');
  return `${month}/${day}/${year}`;
}

/**
 * Convert display format MM/DD/YYYY to YYYY-MM-DD
 */
function toISOFormat(displayDate: string): string | null {
  const match = displayDate.match(DISPLAY_FORMAT_REGEX);
  if (!match) return null;
  const [, month, day, year] = match;
  const mm = month.padStart(2, '0');
  const dd = day.padStart(2, '0');
  // Validate the date is real
  const date = new Date(Number(year), Number(mm) - 1, Number(dd));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(mm) - 1 ||
    date.getDate() !== Number(dd)
  ) {
    return null;
  }
  return `${year}-${mm}-${dd}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date object (local timezone)
 */
function parseISODate(value: string): Date | undefined {
  if (!value || !DATE_REGEX.test(value)) return undefined;
  const date = new Date(value + 'T00:00:00');
  return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Format a Date object to YYYY-MM-DD string
 */
function formatDateToISO(date: Date): string {
  const yyyy = date.getFullYear().toString();
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ── Component ────────────────────────────────────────────────────────

/**
 * InputDate component following Atlantis/Jobber design system.
 *
 * Provides a text input with manual date entry support and an integrated
 * DatePicker calendar that opens when clicking the calendar icon. The input
 * accepts dates in MM/DD/YYYY format and converts to/from YYYY-MM-DD internally.
 *
 * @example
 * // Basic usage
 * <InputDate
 *   value={dateValue}
 *   onChange={(value) => setDateValue(value)}
 * />
 *
 * @example
 * // With min/max constraints
 * <InputDate
 *   value={dateValue}
 *   onChange={(value) => setDateValue(value)}
 *   minDate="2024-01-01"
 *   maxDate="2024-12-31"
 * />
 */
export const InputDate = forwardRef<HTMLInputElement, InputDateProps>(
  function InputDate(props, ref) {
    const {
      value,
      defaultValue,
      placeholder = DEFAULT_PLACEHOLDER,
      name,
      id: providedId,
      disabled = false,
      readonly = false,
      required = false,
      invalid = false,
      size,
      minDate,
      maxDate,
      className,
      inputClassName,
      onChange,
      onNativeChange,
      onFocus,
      onBlur,
      ariaLabel,
      ariaDescribedBy,
    } = props;

    const generatedId = useId();
    const id = providedId || generatedId;

    // Internal state for uncontrolled mode (stores YYYY-MM-DD)
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    // Display text shown in the text input (MM/DD/YYYY or partial entry)
    const currentISOValue = value !== undefined ? value : internalValue;
    const [displayText, setDisplayText] = useState(() => toDisplayFormat(currentISOValue));
    const [isFocused, setIsFocused] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [validationError, setValidationError] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const hiddenInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLInputElement>(null);
    const validationTimerRef = useRef<ReturnType<typeof setTimeout>>();

    // Merge refs for the hidden native date input
    const setHiddenRef = useCallback(
      (node: HTMLInputElement | null) => {
        (hiddenInputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [ref],
    );

    // Cleanup validation timer on unmount
    useEffect(() => {
      return () => {
        if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
      };
    }, []);

    // Sync display text when value changes externally
    useEffect(() => {
      if (!isFocused) {
        setDisplayText(toDisplayFormat(currentISOValue));
      }
    }, [currentISOValue, isFocused]);

    // Close calendar on outside click
    useEffect(() => {
      if (!calendarOpen) return;
      function handleClickOutside(e: MouseEvent) {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
          setCalendarOpen(false);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [calendarOpen]);

    // Close calendar on Escape
    useEffect(() => {
      if (!calendarOpen) return;
      function handleEsc(e: KeyboardEvent) {
        if (e.key === 'Escape') {
          setCalendarOpen(false);
          textInputRef.current?.focus();
        }
      }
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }, [calendarOpen]);

    // Fire the native change handler by dispatching on the hidden input
    const fireNativeChange = useCallback(
      (newValue: string) => {
        if (hiddenInputRef.current && onNativeChange) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value',
          )?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(hiddenInputRef.current, newValue);
          }
          const event = new Event('input', { bubbles: true });
          hiddenInputRef.current.dispatchEvent(event);
          // Create a synthetic React change event
          const syntheticEvent = {
            target: hiddenInputRef.current,
            currentTarget: hiddenInputRef.current,
            nativeEvent: event,
            type: 'change',
            bubbles: true,
            cancelable: false,
            defaultPrevented: false,
            eventPhase: 0,
            isTrusted: false,
            preventDefault: () => {},
            isDefaultPrevented: () => false,
            stopPropagation: () => {},
            isPropagationStopped: () => false,
            persist: () => {},
            timeStamp: Date.now(),
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          onNativeChange(syntheticEvent);
        }
      },
      [onNativeChange],
    );

    const updateValue = useCallback(
      (isoValue: string) => {
        if (value === undefined) {
          setInternalValue(isoValue);
        }
        onChange?.(isoValue);
        fireNativeChange(isoValue);
      },
      [value, onChange, fireNativeChange],
    );

    // Handle manual text entry
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setDisplayText(text);
      setValidationError(false);

      // Try to parse as we type - only update form value when fully valid
      const isoValue = toISOFormat(text);
      if (isoValue) {
        updateValue(isoValue);
      }
    };

    // Validate on blur
    const handleTextBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      const text = displayText.trim();
      if (text === '') {
        // Empty is valid (unless required, but that's handled by form validation)
        setValidationError(false);
        updateValue('');
        setDisplayText('');
      } else {
        const isoValue = toISOFormat(text);
        if (isoValue) {
          setValidationError(false);
          updateValue(isoValue);
          setDisplayText(toDisplayFormat(isoValue));
        } else {
          // Invalid date - show error state, revert to last valid value
          setValidationError(true);
          setDisplayText(toDisplayFormat(currentISOValue));
          // Revert after a short delay for visual feedback
          if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
          validationTimerRef.current = setTimeout(() => setValidationError(false), 1500);
        }
      }

      onBlur?.(e);
    };

    const handleTextFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    // Handle calendar icon click
    const handleCalendarClick = () => {
      if (disabled || readonly) return;
      setCalendarOpen(prev => !prev);
    };

    // Handle date selection from DatePicker
    const handleDatePickerChange = (date: Date) => {
      const isoValue = formatDateToISO(date);
      setDisplayText(toDisplayFormat(isoValue));
      updateValue(isoValue);
      setCalendarOpen(false);
      setValidationError(false);
      textInputRef.current?.focus();
    };

    const selectedDate = parseISODate(currentISOValue);
    const minDateObj = minDate ? parseISODate(minDate) : undefined;
    const maxDateObj = maxDate ? parseISODate(maxDate) : undefined;

    const hasError = invalid || validationError;

    // Base input styles matching react-admin TextInput
    const baseInputStyles = cn(
      'w-full bg-transparent text-foreground placeholder:text-muted-foreground',
      'border border-input rounded-md',
      'shadow-xs transition-[color,box-shadow]',
      'outline-none',
      'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
      hasError && 'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
      disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
      readonly && 'bg-muted',
      size === 'small' ? 'h-8 pl-2.5 pr-2.5 text-sm' : size === 'large' ? 'h-12 pl-4 pr-4 text-base' : 'h-10 pl-3 pr-3 text-sm',
      'pr-10',
    );

    const wrapperStyles = cn('relative', className);

    const iconStyles = cn(
      'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground',
      'transition-colors',
      !disabled && !readonly && 'cursor-pointer hover:text-foreground',
      disabled && 'opacity-50',
    );

    return (
      <div ref={wrapperRef} className={wrapperStyles}>
        {/* Visible text input for manual date entry */}
        <div className="relative flex items-center">
          <input
            ref={textInputRef}
            type="text"
            id={id}
            value={displayText}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readonly}
            required={required}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            aria-invalid={hasError}
            aria-required={required}
            aria-haspopup="dialog"
            aria-expanded={calendarOpen}
            onChange={handleTextChange}
            onFocus={handleTextFocus}
            onBlur={handleTextBlur}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' && !calendarOpen) {
                e.preventDefault();
                setCalendarOpen(true);
              }
            }}
            className={cn(baseInputStyles, inputClassName)}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={handleCalendarClick}
            disabled={disabled}
            tabIndex={-1}
            aria-label="Show calendar"
            className={iconStyles}
          >
            <Icon name="calendar" size="small" />
          </button>
        </div>

        {/* Visually hidden native date input for form compatibility (ref, valueAsDate, etc.) */}
        <input
          ref={setHiddenRef}
          type="date"
          name={name}
          value={currentISOValue}
          min={minDate}
          max={maxDate}
          tabIndex={-1}
          aria-hidden="true"
          onChange={() => {}}
          className="sr-only"
        />

        {/* DatePicker calendar dropdown */}
        {calendarOpen && (
          <div
            className="absolute z-50 mt-1 left-0"
            style={{ minWidth: 280 }}
          >
            <DatePicker
              selected={selectedDate}
              onChange={handleDatePickerChange}
              minDate={minDateObj}
              maxDate={maxDateObj}
              inline
            />
          </div>
        )}
      </div>
    );
  },
);

InputDate.displayName = 'InputDate';

export default InputDate;
