/**
 * InputTime - Local implementation matching @jobber/components InputTime API
 *
 * This provides the same interface as the Atlantis component library's InputTime,
 * allowing future migration to the actual library when fully integrated.
 *
 * @see https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-inputtime--docs
 */
import React, { forwardRef, useState, useId } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

export type InputTimeSize = 'small' | 'large';

export interface InputTimeProps {
  /**
   * Input value in HH:MM format (24-hour)
   */
  readonly value?: string;

  /**
   * Default value for uncontrolled usage
   */
  readonly defaultValue?: string;

  /**
   * Placeholder text
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
  readonly size?: InputTimeSize;

  /**
   * Minimum time in HH:MM format
   */
  readonly minTime?: string;

  /**
   * Maximum time in HH:MM format
   */
  readonly maxTime?: string;

  /**
   * Step in seconds (default: 60 for 1 minute intervals)
   */
  readonly step?: number;

  /**
   * Custom class name
   */
  readonly className?: string;

  /**
   * Input class name (applied to the actual input element)
   */
  readonly inputClassName?: string;

  /**
   * Change handler - receives time string in HH:MM format
   */
  readonly onChange?: (value: string) => void;

  /**
   * Native change handler
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

/**
 * InputTime component following Atlantis/Jobber design system
 *
 * Uses the native HTML time input with custom styling to match Atlantis design.
 * Provides time picker functionality through the browser's native time picker.
 *
 * @example
 * // Basic usage
 * <InputTime
 *   value={timeValue}
 *   onChange={(value) => setTimeValue(value)}
 * />
 *
 * @example
 * // With min/max constraints
 * <InputTime
 *   value={timeValue}
 *   onChange={(value) => setTimeValue(value)}
 *   minTime="09:00"
 *   maxTime="17:00"
 * />
 *
 * @example
 * // With 15-minute step intervals
 * <InputTime
 *   value={timeValue}
 *   onChange={(value) => setTimeValue(value)}
 *   step={900}
 * />
 */
export const InputTime = forwardRef<HTMLInputElement, InputTimeProps>(
  function InputTime(props, ref) {
    const {
      value,
      defaultValue,
      placeholder,
      name,
      id: providedId,
      disabled = false,
      readonly = false,
      required = false,
      invalid = false,
      size,
      minTime,
      maxTime,
      step,
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
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const [isFocused, setIsFocused] = useState(false);

    // Use controlled value if provided, otherwise use internal state
    const currentValue = value !== undefined ? value : internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      if (value === undefined) {
        setInternalValue(newValue);
      }

      onChange?.(newValue);
      onNativeChange?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    // Base input styles matching InputText and InputDate
    const baseInputStyles = cn(
      // Base styling
      'w-full bg-transparent text-[--color-text] placeholder:text-[--color-text--secondary]',
      'border border-[--color-border] rounded-lg',
      'transition-all duration-200',
      'outline-none',
      // Focus state
      'focus:border-[--color-interactive] focus:ring-2 focus:ring-[--color-interactive--subtle]',
      // Invalid state
      invalid && 'border-[--color-critical] focus:border-[--color-critical] focus:ring-[--color-critical--surface]',
      // Disabled state
      disabled && 'opacity-50 cursor-not-allowed bg-[--color-surface--background]',
      // Readonly state
      readonly && 'bg-[--color-surface--background]',
      // Size variants
      size === 'small' ? 'h-8 px-2.5 text-sm' : size === 'large' ? 'h-12 px-4 text-base' : 'h-10 px-3 text-sm',
      // Right padding for clock icon
      'pr-10',
      // Time picker styling - ensure the native picker icon is styled properly
      '[color-scheme:light] dark:[color-scheme:dark]',
      // Hide the native clock picker indicator (we'll use our own)
      '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3',
      '[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0',
      '[&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5',
    );

    // Wrapper styles
    const wrapperStyles = cn(
      'relative flex items-center',
      className,
    );

    // Icon styles
    const iconStyles = cn(
      'absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text--secondary] pointer-events-none',
    );

    return (
      <div className={wrapperStyles}>
        <input
          ref={ref}
          type="time"
          id={id}
          name={name}
          value={currentValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readonly}
          required={required}
          min={minTime}
          max={maxTime}
          step={step}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-invalid={invalid}
          aria-required={required}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(baseInputStyles, inputClassName)}
        />
        <Icon
          name="timer"
          size="small"
          className={iconStyles}
        />
      </div>
    );
  }
);

InputTime.displayName = 'InputTime';

/**
 * Format a time string to 12-hour format with AM/PM
 *
 * @param time Time string in HH:MM format (24-hour)
 * @returns Formatted time string like "9:00 AM" or "5:30 PM"
 */
export function formatTime12Hour(time: string): string {
  if (!time) return '';

  const [hoursStr, minutesStr] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || '00';

  if (isNaN(hours)) return '';

  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${period}`;
}

/**
 * Parse a 12-hour time string to 24-hour format
 *
 * @param time Time string like "9:00 AM" or "5:30 PM"
 * @returns Time string in HH:MM format (24-hour)
 */
export function parseTime12Hour(time: string): string {
  if (!time) return '';

  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '';

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Validate a time string in HH:MM format
 *
 * @param time Time string to validate
 * @returns Whether the time is valid
 */
export function validateTime(time: string): boolean {
  if (!time) return false;

  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export default InputTime;
