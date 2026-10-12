/**
 * InputText - Local implementation matching @jobber/components InputText API
 *
 * This provides the same interface as the Atlantis component library's InputText,
 * allowing future migration to the actual library when fully integrated.
 *
 * @see https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-inputtext--docs
 */
import React, { forwardRef, useState, useId } from 'react';
import { cn } from '@/lib/utils';
import { Icon, type IconNames } from './Icon';

export type InputTextSize = 'small' | 'large';

export interface InputTextProps {
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
   * Multiline input (textarea)
   * @default false
   */
  readonly multiline?: boolean;

  /**
   * Number of rows for multiline input
   * @default 3
   */
  readonly rows?: number;

  /**
   * Size variant
   */
  readonly size?: InputTextSize;

  /**
   * Maximum character count
   */
  readonly maxLength?: number;

  /**
   * Minimum length validation
   */
  readonly minLength?: number;

  /**
   * Icon to display on the left
   */
  readonly prefix?: IconNames;

  /**
   * Icon to display on the right
   */
  readonly suffix?: IconNames;

  /**
   * Whether to show character count
   * @default false
   */
  readonly showCharacterCount?: boolean;

  /**
   * Autocomplete attribute
   */
  readonly autocomplete?: string;

  /**
   * Whether to focus on mount
   * @default false
   */
  readonly autoFocus?: boolean;

  /**
   * Custom class name
   */
  readonly className?: string;

  /**
   * Input class name (applied to the actual input element)
   */
  readonly inputClassName?: string;

  /**
   * Change handler
   */
  readonly onChange?: (value: string) => void;

  /**
   * Native change handler
   */
  readonly onNativeChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

  /**
   * Focus handler
   */
  readonly onFocus?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

  /**
   * Blur handler
   */
  readonly onBlur?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

  /**
   * Key down handler
   */
  readonly onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

  /**
   * Key up handler
   */
  readonly onKeyUp?: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

  /**
   * Input type (for single-line input)
   * @default "text"
   */
  readonly type?: 'text' | 'email' | 'tel' | 'url' | 'search';

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
 * InputText component following Atlantis/Jobber design system
 *
 * @example
 * // Basic usage
 * <InputText
 *   placeholder="Enter your name"
 *   onChange={(value) => console.log(value)}
 * />
 *
 * @example
 * // With prefix icon
 * <InputText
 *   placeholder="Search..."
 *   prefix="search"
 * />
 *
 * @example
 * // Multiline (textarea)
 * <InputText
 *   multiline
 *   rows={4}
 *   placeholder="Enter description..."
 * />
 */
export const InputText = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputTextProps>(
  function InputText(props, ref) {
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
      multiline = false,
      rows = 3,
      size,
      maxLength,
      minLength,
      prefix,
      suffix,
      showCharacterCount = false,
      autocomplete,
      autoFocus = false,
      className,
      inputClassName,
      onChange,
      onNativeChange,
      onFocus,
      onBlur,
      onKeyDown,
      onKeyUp,
      type = 'text',
      ariaLabel,
      ariaDescribedBy,
    } = props;

    const generatedId = useId();
    const id = providedId || generatedId;
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const [isFocused, setIsFocused] = useState(false);

    // Use controlled value if provided, otherwise use internal state
    const currentValue = value !== undefined ? value : internalValue;
    const characterCount = currentValue.length;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;

      if (value === undefined) {
        setInternalValue(newValue);
      }

      onChange?.(newValue);
      onNativeChange?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

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
      // Prefix/suffix padding adjustments
      prefix && 'pl-9',
      suffix && 'pr-9',
    );

    // Wrapper styles
    const wrapperStyles = cn(
      'relative flex items-center',
      className,
    );

    // Icon styles
    const iconStyles = 'absolute top-1/2 -translate-y-1/2 text-[var(--color-text--secondary)] pointer-events-none';

    const sharedProps = {
      id,
      name,
      value: currentValue,
      placeholder,
      disabled,
      readOnly: readonly,
      required,
      maxLength,
      minLength,
      autoComplete: autocomplete,
      autoFocus,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': invalid,
      'aria-required': required,
      onChange: handleChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onKeyDown,
      onKeyUp,
    };

    return (
      <div className={wrapperStyles}>
        {/* Prefix icon */}
        {prefix && (
          <Icon
            name={prefix}
            size="small"
            className={cn(iconStyles, 'left-3')}
          />
        )}

        {/* Input or Textarea */}
        {multiline ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            rows={rows}
            className={cn(baseInputStyles, 'resize-none py-2', inputClassName)}
            {...sharedProps}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            type={type}
            className={cn(baseInputStyles, inputClassName)}
            {...sharedProps}
          />
        )}

        {/* Suffix icon */}
        {suffix && (
          <Icon
            name={suffix}
            size="small"
            className={cn(iconStyles, 'right-3')}
          />
        )}

        {/* Character count */}
        {showCharacterCount && maxLength && (
          <span className="absolute right-3 bottom-1 text-xs text-[var(--color-text--secondary)]">
            {characterCount}/{maxLength}
          </span>
        )}
      </div>
    );
  }
);

InputText.displayName = 'InputText';

export default InputText;
