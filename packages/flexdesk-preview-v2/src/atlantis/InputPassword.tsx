/**
 * InputPassword - Local implementation matching @jobber/components InputPassword API
 *
 * This provides the same interface as the Atlantis component library's InputPassword,
 * allowing future migration to the actual library when fully integrated.
 *
 * InputPassword is a specialized password input with optional visibility toggle.
 *
 * @see https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-inputpassword--docs
 */
import React, { forwardRef, useState, useId, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

export type InputPasswordSize = 'small' | 'large';

export interface InputPasswordProps {
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
   * @default "Password"
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
  readonly size?: InputPasswordSize;

  /**
   * Whether to show the visibility toggle button
   * @default false
   */
  readonly hasVisibility?: boolean;

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
   * @default "current-password"
   */
  readonly autocomplete?: 'current-password' | 'new-password' | 'off';

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
 * InputPassword component following Atlantis/Jobber design system
 *
 * Provides a specialized password input with:
 * - Optional visibility toggle to show/hide password
 * - Secure input type for password masking
 * - Autocomplete support for password managers
 *
 * @example
 * // Basic usage
 * <InputPassword
 *   placeholder="Enter your password"
 *   onChange={(value) => console.log(value)}
 * />
 *
 * @example
 * // With visibility toggle
 * <InputPassword
 *   value={password}
 *   onChange={setPassword}
 *   hasVisibility
 * />
 */
export const InputPassword = forwardRef<HTMLInputElement, InputPasswordProps>(
  function InputPassword(props, ref) {
    const {
      value,
      defaultValue,
      placeholder = 'Password',
      name,
      id: providedId,
      disabled = false,
      readonly = false,
      required = false,
      invalid = false,
      size,
      hasVisibility = false,
      className,
      inputClassName,
      autoFocus = false,
      autocomplete = 'current-password',
      onChange,
      onNativeChange,
      onFocus,
      onBlur,
      onKeyDown,
      ariaLabel,
      ariaDescribedBy,
    } = props;

    const generatedId = useId();
    const id = providedId || generatedId;
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // Use controlled value if provided, otherwise use internal state
    const currentValue = value !== undefined ? value : internalValue;

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      if (value === undefined) {
        setInternalValue(newValue);
      }

      onChange?.(newValue);
      onNativeChange?.(e);
    }, [value, onChange, onNativeChange]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    }, [onFocus]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    }, [onBlur]);

    const toggleVisibility = useCallback(() => {
      setIsPasswordVisible((prev) => !prev);
    }, []);

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
      invalid && 'border-[var(--color-critical)] focus:border-[var(--color-critical)] focus:ring-[var(--color-critical--surface)]',
      // Disabled state
      disabled && 'opacity-50 cursor-not-allowed bg-[var(--color-surface--background)]',
      // Readonly state
      readonly && 'bg-[var(--color-surface--background)]',
      // Size variants
      size === 'small' ? 'h-8 pl-2.5 pr-2.5 text-sm' : size === 'large' ? 'h-12 pl-4 pr-4 text-base' : 'h-10 pl-3 pr-3 text-sm',
      // Right padding for visibility toggle
      hasVisibility && 'pr-10',
    );

    // Wrapper styles
    const wrapperStyles = cn(
      'relative flex items-center',
      className,
    );

    // Visibility toggle button styles
    const toggleButtonStyles = cn(
      'absolute right-2 top-1/2 -translate-y-1/2',
      'flex items-center justify-center',
      'h-6 w-6 rounded',
      'text-[var(--color-text--secondary)] hover:text-[var(--color-text)]',
      'cursor-pointer',
      'transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]',
      disabled && 'opacity-50 cursor-not-allowed',
    );

    return (
      <div className={wrapperStyles}>
        {/* Password input */}
        <input
          ref={ref}
          type={isPasswordVisible ? 'text' : 'password'}
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
          aria-invalid={invalid}
          aria-required={required}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={onKeyDown}
          className={cn(baseInputStyles, inputClassName)}
        />

        {/* Visibility toggle button */}
        {hasVisibility && (
          <button
            type="button"
            onClick={toggleVisibility}
            disabled={disabled}
            className={toggleButtonStyles}
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
          >
            <Icon
              name={isPasswordVisible ? 'eyeCrossed' : 'eye'}
              size="small"
            />
          </button>
        )}
      </div>
    );
  }
);

InputPassword.displayName = 'InputPassword';

export default InputPassword;
