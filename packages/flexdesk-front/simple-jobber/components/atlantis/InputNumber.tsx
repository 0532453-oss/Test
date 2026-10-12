/**
 * InputNumber - Local implementation matching @jobber/components InputNumber API
 *
 * This provides the same interface as the Atlantis component library's InputNumber,
 * allowing future migration to the actual library when fully integrated.
 *
 * @see https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-inputnumber--docs
 */
import React, { forwardRef, useState, useId, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Icon, type IconNames } from './Icon';

export type InputNumberSize = 'small' | 'large';

export interface InputNumberProps {
  /**
   * Input value
   */
  readonly value?: number;

  /**
   * Default value for uncontrolled usage
   */
  readonly defaultValue?: number;

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
  readonly size?: InputNumberSize;

  /**
   * Minimum value
   */
  readonly min?: number;

  /**
   * Maximum value
   */
  readonly max?: number;

  /**
   * Step increment
   * @default 1
   */
  readonly step?: number;

  /**
   * Icon to display on the left
   */
  readonly prefix?: IconNames;

  /**
   * Text prefix (e.g., currency symbol)
   */
  readonly prefixText?: string;

  /**
   * Icon to display on the right
   */
  readonly suffix?: IconNames;

  /**
   * Text suffix (e.g., unit)
   */
  readonly suffixText?: string;

  /**
   * Whether to focus on mount
   * @default false
   */
  readonly autoFocus?: boolean;

  /**
   * Custom class name for the wrapper
   */
  readonly className?: string;

  /**
   * Input class name (applied to the actual input element)
   */
  readonly inputClassName?: string;

  /**
   * Align text in the input
   * @default "left"
   */
  readonly align?: 'left' | 'center' | 'right';

  /**
   * Change handler - returns the parsed number value (or undefined for empty/invalid)
   */
  readonly onChange?: (value: number | undefined) => void;

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
   * Validation callback
   */
  readonly onValidation?: (isValid: boolean) => void;

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
 * Parse a string value to a number
 */
const parseValue = (value: string): number | undefined => {
  if (value === '' || value === '-' || value === '.') {
    return undefined;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? undefined : parsed;
};

/**
 * Format a number for display
 */
const formatValue = (value: number | undefined): string => {
  if (value === undefined || value === null) {
    return '';
  }
  return value.toString();
};

/**
 * InputNumber component following Atlantis/Jobber design system
 *
 * @example
 * // Basic usage
 * <InputNumber
 *   placeholder="Enter quantity"
 *   onChange={(value) => console.log(value)}
 * />
 *
 * @example
 * // With currency prefix
 * <InputNumber
 *   prefixText="$"
 *   placeholder="0.00"
 *   step={0.01}
 *   min={0}
 *   align="right"
 * />
 *
 * @example
 * // With constraints
 * <InputNumber
 *   min={0}
 *   max={100}
 *   step={5}
 *   onChange={(value) => setQuantity(value)}
 * />
 */
export const InputNumber = forwardRef<HTMLInputElement, InputNumberProps>(
  function InputNumber(props, ref) {
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
      step = 1,
      prefix,
      prefixText,
      suffix,
      suffixText,
      autoFocus = false,
      className,
      inputClassName,
      align = 'left',
      onChange,
      onFocus,
      onBlur,
      onKeyDown,
      onValidation,
      ariaLabel,
      ariaDescribedBy,
    } = props;

    const generatedId = useId();
    const id = providedId || generatedId;

    // Track local string value for typing intermediate states
    const [localValue, setLocalValue] = useState<string>(() =>
      formatValue(value !== undefined ? value : defaultValue)
    );
    const [isFocused, setIsFocused] = useState(false);
    const hasFocus = useRef(false);

    // Sync local value with controlled value when not focused
    useEffect(() => {
      if (!hasFocus.current && value !== undefined) {
        setLocalValue(formatValue(value));
      }
    }, [value]);

    const validateValue = (numValue: number | undefined): boolean => {
      if (numValue === undefined) return true; // Empty is valid by default
      if (min !== undefined && numValue < min) return false;
      if (max !== undefined && numValue > max) return false;
      return true;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;

      // Allow empty, negative sign, decimal point, and valid numbers
      if (rawValue === '' || rawValue === '-' || rawValue === '.' || rawValue === '-.') {
        setLocalValue(rawValue);
        onChange?.(undefined);
        onValidation?.(true);
        return;
      }

      // Validate it's a valid number format
      if (!/^-?\d*\.?\d*$/.test(rawValue)) {
        return; // Reject invalid characters
      }

      setLocalValue(rawValue);

      const numValue = parseValue(rawValue);
      onChange?.(numValue);
      onValidation?.(validateValue(numValue));
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      hasFocus.current = true;
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      hasFocus.current = false;
      setIsFocused(false);

      // Clean up the displayed value on blur
      const numValue = parseValue(localValue);
      if (numValue !== undefined) {
        // Apply min/max constraints on blur
        let constrainedValue = numValue;
        if (min !== undefined && constrainedValue < min) {
          constrainedValue = min;
        }
        if (max !== undefined && constrainedValue > max) {
          constrainedValue = max;
        }

        if (constrainedValue !== numValue) {
          setLocalValue(formatValue(constrainedValue));
          onChange?.(constrainedValue);
        } else {
          setLocalValue(formatValue(numValue));
        }
        onValidation?.(validateValue(constrainedValue));
      } else {
        setLocalValue('');
      }

      onBlur?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Handle up/down arrow keys for increment/decrement
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentValue = parseValue(localValue) || 0;
        const delta = e.key === 'ArrowUp' ? step : -step;
        let newValue = currentValue + delta;

        // Apply constraints
        if (min !== undefined && newValue < min) {
          newValue = min;
        }
        if (max !== undefined && newValue > max) {
          newValue = max;
        }

        setLocalValue(formatValue(newValue));
        onChange?.(newValue);
        onValidation?.(validateValue(newValue));
      }

      onKeyDown?.(e);
    };

    // Calculate if value is invalid for styling
    const numValue = parseValue(localValue);
    const isInvalid = invalid || !validateValue(numValue);

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
      // Alignment
      align === 'center' && 'text-center',
      align === 'right' && 'text-right',
      // Prefix/suffix padding adjustments
      (prefix || prefixText) && 'pl-9',
      (suffix || suffixText) && 'pr-9',
      // Tabular numbers for consistent width
      'tabular-nums',
    );

    // Wrapper styles
    const wrapperStyles = cn(
      'relative flex items-center',
      className,
    );

    // Icon/text styles
    const prefixStyles = 'absolute left-3 top-1/2 -translate-y-1/2 text-[--color-text--secondary] pointer-events-none';
    const suffixStyles = 'absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text--secondary] pointer-events-none';

    return (
      <div className={wrapperStyles}>
        {/* Prefix icon or text */}
        {prefix && (
          <Icon
            name={prefix}
            size="small"
            className={prefixStyles}
          />
        )}
        {prefixText && !prefix && (
          <span className={cn(prefixStyles, 'text-sm')}>{prefixText}</span>
        )}

        {/* Input */}
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          id={id}
          name={name}
          value={localValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readonly}
          required={required}
          autoFocus={autoFocus}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-invalid={isInvalid}
          aria-required={required}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={numValue}
          className={cn(baseInputStyles, inputClassName)}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />

        {/* Suffix icon or text */}
        {suffix && (
          <Icon
            name={suffix}
            size="small"
            className={suffixStyles}
          />
        )}
        {suffixText && !suffix && (
          <span className={cn(suffixStyles, 'text-sm')}>{suffixText}</span>
        )}
      </div>
    );
  }
);

InputNumber.displayName = 'InputNumber';

export default InputNumber;
