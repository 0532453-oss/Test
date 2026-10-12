/**
 * InputDateTime - Local implementation matching @jobber/components InputDateTime API
 *
 * This provides the same interface as the Atlantis component library's InputDateTime,
 * allowing future migration to the actual library when fully integrated.
 *
 * This is a combined date-time picker that handles datetime-local input type.
 */
import React, { forwardRef, useState, useId } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

export type InputDateTimeSize = 'small' | 'large';

export interface InputDateTimeProps {
  /**
   * Input value in YYYY-MM-DDTHH:MM format
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
  readonly size?: InputDateTimeSize;

  /**
   * Minimum datetime in YYYY-MM-DDTHH:MM format
   */
  readonly min?: string;

  /**
   * Maximum datetime in YYYY-MM-DDTHH:MM format
   */
  readonly max?: string;

  /**
   * Custom class name
   */
  readonly className?: string;

  /**
   * Input class name (applied to the actual input element)
   */
  readonly inputClassName?: string;

  /**
   * Change handler - receives datetime string in YYYY-MM-DDTHH:MM format
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
 * InputDateTime component following Atlantis/Jobber design system
 *
 * Uses the native HTML datetime-local input with custom styling to match Atlantis design.
 * Provides date and time picker functionality through the browser's native datetime-local picker.
 *
 * @example
 * // Basic usage
 * <InputDateTime
 *   value={dateTimeValue}
 *   onChange={(value) => setDateTimeValue(value)}
 * />
 *
 * @example
 * // With min/max constraints
 * <InputDateTime
 *   value={dateTimeValue}
 *   onChange={(value) => setDateTimeValue(value)}
 *   min="2024-01-01T09:00"
 *   max="2024-12-31T17:00"
 * />
 */
export const InputDateTime = forwardRef<HTMLInputElement, InputDateTimeProps>(
  function InputDateTime(props, ref) {
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
      min,
      max,
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

    // Base input styles matching other Atlantis inputs
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
      // Right padding for icon
      'pr-10',
      // DateTime picker styling
      '[color-scheme:light] dark:[color-scheme:dark]',
      // Style the native calendar/clock picker indicator
      '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
      '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3',
      '[&::-webkit-calendar-picker-indicator]:opacity-0',
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
          type="datetime-local"
          id={id}
          name={name}
          value={currentValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readonly}
          required={required}
          min={min}
          max={max}
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
          name="calendar"
          size="small"
          className={iconStyles}
        />
      </div>
    );
  }
);

InputDateTime.displayName = 'InputDateTime';

export default InputDateTime;
