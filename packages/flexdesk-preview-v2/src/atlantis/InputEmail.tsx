/**
 * InputEmail - Local implementation matching @jobber/components InputEmail API
 *
 * This provides the same interface as the Atlantis component library's InputEmail,
 * allowing future migration to the actual library when fully integrated.
 *
 * InputEmail is a specialized email input with built-in email validation.
 *
 * @see https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-inputemail--docs
 */
import React, { forwardRef, useState, useId, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

/**
 * Email validation regex pattern
 * Matches standard email format: local@domain.tld
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InputEmailSize = 'small' | 'large';

export interface InputEmailProps {
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
   * @default "name@example.com"
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
  readonly size?: InputEmailSize;

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
   * @default "email"
   */
  readonly autocomplete?: string;

  /**
   * Change handler - receives the new value
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
 * Validates an email address
 * @param email - The email string to validate
 * @returns true if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email || email.trim() === '') {
    return true; // Empty is valid (use required prop for required validation)
  }
  return EMAIL_REGEX.test(email.trim());
}

/**
 * InputEmail component following Atlantis/Jobber design system
 *
 * Provides a specialized email input with:
 * - Built-in email format validation
 * - Email icon prefix
 * - Proper input type for mobile keyboards
 * - Autocomplete support
 *
 * @example
 * // Basic usage
 * <InputEmail
 *   placeholder="Enter your email"
 *   onChange={(value) => console.log(value)}
 * />
 *
 * @example
 * // With validation callback
 * <InputEmail
 *   value={email}
 *   onChange={setEmail}
 *   onValidation={(isValid) => setEmailError(!isValid)}
 * />
 */
export const InputEmail = forwardRef<HTMLInputElement, InputEmailProps>(
  function InputEmail(props, ref) {
    const {
      value,
      defaultValue,
      placeholder = 'name@example.com',
      name,
      id: providedId,
      disabled = false,
      readonly = false,
      required = false,
      invalid = false,
      size,
      className,
      inputClassName,
      autoFocus = false,
      autocomplete = 'email',
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
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const [isFocused, setIsFocused] = useState(false);
    const [hasValidationError, setHasValidationError] = useState(false);

    // Use controlled value if provided, otherwise use internal state
    const currentValue = value !== undefined ? value : internalValue;

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      if (value === undefined) {
        setInternalValue(newValue);
      }

      // Clear validation error when user starts typing
      if (hasValidationError) {
        setHasValidationError(false);
      }

      onChange?.(newValue);
      onNativeChange?.(e);
    }, [value, hasValidationError, onChange, onNativeChange]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    }, [onFocus]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      // Validate on blur
      const isValid = validateEmail(e.target.value);
      setHasValidationError(!isValid && e.target.value.length > 0);
      onValidation?.(isValid);

      onBlur?.(e);
    }, [onBlur, onValidation]);

    // Determine if input should show invalid state
    const isInvalid = invalid || hasValidationError;

    // Base input styles
    const baseInputStyles = cn(
      // Base styling
      'w-full bg-transparent text-[var(--color-text)] placeholder:text-[var(--color-text--secondary)]',
      'border border-[var(--color-border)] rounded-lg',
      'transition-all duration-200',
      'outline-none',
      // Focus state
      'focus:border-[var(--color-interactive)] focus:ring-2 focus:ring-[var(--color-interactive--subtle)]',
      // Invalid state
      isInvalid && 'border-[var(--color-critical)] focus:border-[var(--color-critical)] focus:ring-[var(--color-critical--surface)]',
      // Disabled state
      disabled && 'opacity-50 cursor-not-allowed bg-[var(--color-surface--background)]',
      // Readonly state
      readonly && 'bg-[var(--color-surface--background)]',
      // Size variants
      size === 'small' ? 'h-8 pl-2.5 pr-2.5 text-sm' : size === 'large' ? 'h-12 pl-4 pr-4 text-base' : 'h-10 pl-3 pr-3 text-sm',
      // Prefix padding for email icon
      'pl-9',
    );

    // Wrapper styles
    const wrapperStyles = cn(
      'relative flex items-center',
      className,
    );

    // Icon styles
    const iconStyles = 'absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text--secondary)] pointer-events-none';

    return (
      <div className={wrapperStyles}>
        {/* Email icon prefix */}
        <Icon
          name="email"
          size="small"
          className={iconStyles}
        />

        {/* Email input */}
        <input
          ref={ref}
          type="email"
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

InputEmail.displayName = 'InputEmail';

export default InputEmail;
