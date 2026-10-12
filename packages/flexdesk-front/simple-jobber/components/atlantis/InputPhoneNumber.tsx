/**
 * InputPhoneNumber - Local implementation matching @jobber/components InputPhoneNumber API
 *
 * This provides the same interface as the Atlantis component library's InputPhoneNumber,
 * allowing future migration to the actual library when fully integrated.
 *
 * InputPhoneNumber is a specialized phone input with built-in formatting.
 *
 * @see https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-inputphonenumber--docs
 */
import React, { forwardRef, useState, useId, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

/**
 * Default phone pattern: (***) ***-****
 * Used for US/Canada phone numbers
 */
const DEFAULT_PHONE_PATTERN = '(***) ***-****';

/**
 * Phone validation regex for basic validation
 * Matches: (123) 456-7890, 123-456-7890, 1234567890, etc.
 */
const PHONE_REGEX = /^[\d\s\-()]+$/;

export type InputPhoneNumberSize = 'small' | 'large';

export interface InputPhoneNumberProps {
  /**
   * Input value
   */
  readonly value?: string;

  /**
   * Default value for uncontrolled usage
   */
  readonly defaultValue?: string;

  /**
   * Placeholder text
   * @default "(555) 555-5555"
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
   * Phone number format pattern
   * Use * as placeholder for digits
   * @default "(***) ***-****"
   */
  readonly pattern?: string;

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
  readonly size?: InputPhoneNumberSize;

  /**
   * Custom class name for the wrapper
   */
  readonly className?: string;

  /**
   * Custom class name for the input element
   */
  readonly inputClassName?: string;

  /**
   * Whether to focus on mount
   * @default false
   */
  readonly autoFocus?: boolean;

  /**
   * Autocomplete attribute
   * @default "tel"
   */
  readonly autocomplete?: string;

  /**
   * Change handler - receives the formatted value
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
   * Validation handler - called on blur to report validation status
   */
  readonly onValidation?: (isValid: boolean) => void;

  /**
   * Key down handler
   */
  readonly onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;

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
 * Formats a phone number according to the pattern
 * @param value - Raw phone number digits
 * @param pattern - Format pattern (use * for digits)
 * @returns Formatted phone number
 */
export function formatPhoneNumber(value: string, pattern: string = DEFAULT_PHONE_PATTERN): string {
  // Extract only digits from the input
  const digits = value.replace(/\D/g, '');

  if (!digits) return '';

  let result = '';
  let digitIndex = 0;

  for (let i = 0; i < pattern.length && digitIndex < digits.length; i++) {
    if (pattern[i] === '*') {
      result += digits[digitIndex];
      digitIndex++;
    } else {
      result += pattern[i];
    }
  }

  return result;
}

/**
 * Extracts raw digits from a formatted phone number
 * @param value - Formatted phone number
 * @returns Raw digits only
 */
export function extractPhoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Validates a phone number has minimum required digits
 * @param phone - The phone string to validate
 * @param minDigits - Minimum number of digits required (default 10)
 * @returns true if valid, false otherwise
 */
export function validatePhoneNumber(phone: string, minDigits: number = 10): boolean {
  if (!phone || phone.trim() === '') {
    return true; // Empty is valid (use required prop for required validation)
  }
  const digits = extractPhoneDigits(phone);
  return digits.length >= minDigits;
}

/**
 * InputPhoneNumber component following Atlantis/Jobber design system
 *
 * Provides a specialized phone input with:
 * - Automatic phone number formatting as you type
 * - Phone icon prefix
 * - Proper input type for mobile keyboards
 * - Autocomplete support
 *
 * @example
 * // Basic usage with default US pattern
 * <InputPhoneNumber
 *   placeholder="(555) 555-5555"
 *   onChange={(value) => console.log(value)}
 * />
 *
 * @example
 * // With custom pattern
 * <InputPhoneNumber
 *   pattern="***-***-****"
 *   onChange={setPhone}
 * />
 *
 * @example
 * // With validation callback
 * <InputPhoneNumber
 *   value={phone}
 *   onChange={setPhone}
 *   onValidation={(isValid) => setPhoneError(!isValid)}
 * />
 */
export const InputPhoneNumber = forwardRef<HTMLInputElement, InputPhoneNumberProps>(
  function InputPhoneNumber(props, ref) {
    const {
      value,
      defaultValue,
      placeholder = '(555) 555-5555',
      name,
      id: providedId,
      pattern = DEFAULT_PHONE_PATTERN,
      disabled = false,
      readonly = false,
      required = false,
      invalid = false,
      size,
      className,
      inputClassName,
      autoFocus = false,
      autocomplete = 'tel',
      onChange,
      onNativeChange,
      onFocus,
      onBlur,
      onValidation,
      onKeyDown,
      ariaLabel,
      ariaDescribedBy,
    } = props;

    const generatedId = useId();
    const id = providedId || generatedId;
    const [internalValue, setInternalValue] = useState(defaultValue ? formatPhoneNumber(defaultValue, pattern) : '');
    const [isFocused, setIsFocused] = useState(false);
    const [hasValidationError, setHasValidationError] = useState(false);

    // Use controlled value if provided, otherwise use internal state
    const currentValue = value !== undefined ? value : internalValue;

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;

      // Format the value according to the pattern
      const formattedValue = formatPhoneNumber(rawValue, pattern);

      if (value === undefined) {
        setInternalValue(formattedValue);
      }

      // Clear validation error when user starts typing
      if (hasValidationError) {
        setHasValidationError(false);
      }

      onChange?.(formattedValue);
      onNativeChange?.(e);
    }, [value, pattern, hasValidationError, onChange, onNativeChange]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    }, [onFocus]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      // Validate on blur
      const isValid = validatePhoneNumber(e.target.value);
      setHasValidationError(!isValid && extractPhoneDigits(e.target.value).length > 0);
      onValidation?.(isValid);

      onBlur?.(e);
    }, [onBlur, onValidation]);

    // Determine if input should show invalid state
    const isInvalid = invalid || hasValidationError;

    // Base input styles
    const baseInputStyles = cn(
      // Base styling
      'w-full bg-transparent text-[--color-text] placeholder:text-[--color-text--secondary]',
      'border border-[--color-border] rounded-lg',
      'transition-all duration-200',
      'outline-none',
      // Focus state
      'focus:border-[--color-interactive] focus:ring-2 focus:ring-[--color-interactive--subtle]',
      // Invalid state
      isInvalid && 'border-[--color-critical] focus:border-[--color-critical] focus:ring-[--color-critical--surface]',
      // Disabled state
      disabled && 'opacity-50 cursor-not-allowed bg-[--color-surface--background]',
      // Readonly state
      readonly && 'bg-[--color-surface--background]',
      // Size variants
      size === 'small' ? 'h-8 px-2.5 text-sm' : size === 'large' ? 'h-12 px-4 text-base' : 'h-10 px-3 text-sm',
      // Prefix padding for phone icon
      'pl-9',
    );

    // Wrapper styles
    const wrapperStyles = cn(
      'relative flex items-center',
      className,
    );

    // Icon styles
    const iconStyles = 'absolute left-3 top-1/2 -translate-y-1/2 text-[--color-text--secondary] pointer-events-none';

    return (
      <div className={wrapperStyles}>
        {/* Phone icon prefix */}
        <Icon
          name="phone"
          size="small"
          className={iconStyles}
        />

        {/* Phone input */}
        <input
          ref={ref}
          type="tel"
          id={id}
          name={name}
          value={currentValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readonly}
          required={required}
          autoComplete={autocomplete}
          autoFocus={autoFocus}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-invalid={isInvalid}
          aria-required={required}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={onKeyDown}
          className={cn(baseInputStyles, inputClassName)}
        />
      </div>
    );
  }
);

InputPhoneNumber.displayName = 'InputPhoneNumber';

export default InputPhoneNumber;
