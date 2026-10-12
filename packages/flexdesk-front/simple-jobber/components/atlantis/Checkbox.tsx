import { useCallback, useId, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

/**
 * Atlantis Checkbox Component
 * Matches @jobber/components Checkbox API for FlexDesk migration
 *
 * @see https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-checkbox--docs
 */

export interface CheckboxProps {
  /**
   * Whether the checkbox is checked
   */
  checked?: boolean;

  /**
   * Callback when checked state changes
   */
  onChange?: (checked: boolean) => void;

  /**
   * Whether the checkbox is disabled
   */
  disabled?: boolean;

  /**
   * Whether the checkbox is in an indeterminate state (for select-all scenarios)
   */
  indeterminate?: boolean;

  /**
   * Label text to display next to the checkbox
   */
  label?: React.ReactNode;

  /**
   * Description text below the label
   */
  description?: React.ReactNode;

  /**
   * Name attribute for form submission
   */
  name?: string;

  /**
   * Value attribute for form submission
   */
  value?: string;

  /**
   * Whether the field is invalid/has an error
   */
  invalid?: boolean;

  /**
   * ID for the checkbox input
   */
  id?: string;

  /**
   * Additional class names
   */
  className?: string;

  /**
   * ARIA label for accessibility when no visible label is provided
   */
  ariaLabel?: string;

  /**
   * Callback when checkbox is blurred
   */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;

  /**
   * Callback when checkbox is focused
   */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked = false,
      onChange,
      disabled = false,
      indeterminate = false,
      label,
      description,
      name,
      value,
      invalid = false,
      id,
      className,
      ariaLabel,
      onBlur,
      onFocus,
    },
    ref
  ) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;

    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(event.target.checked);
      },
      [onChange]
    );

    // Handle keyboard interaction for the visual checkbox
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLLabelElement>) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          if (!disabled) {
            onChange?.(!checked);
          }
        }
      },
      [checked, disabled, onChange]
    );

    // Container styles
    const containerStyles = cn(
      'flex items-start gap-2',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    );

    // Checkbox box styles
    const boxStyles = cn(
      // Base styles
      'flex items-center justify-center',
      'w-4 h-4 rounded border transition-all duration-150',
      'shrink-0 mt-0.5',

      // States
      checked || indeterminate
        ? // Checked/indeterminate state
          invalid
          ? 'bg-[--color-critical] border-[--color-critical]'
          : 'bg-[--color-interactive] border-[--color-interactive]'
        : // Unchecked state
          invalid
          ? 'border-[--color-critical] bg-transparent'
          : 'border-[--color-border] bg-transparent hover:border-[--color-interactive]',

      // Focus ring styles handled by input focus-visible
      disabled && 'cursor-not-allowed'
    );

    // Label styles
    const labelStyles = cn(
      'text-sm cursor-pointer select-none',
      disabled && 'cursor-not-allowed'
    );

    // Description styles
    const descriptionStyles = cn('text-xs text-[--color-text--secondary] mt-0.5');

    return (
      <div className={containerStyles}>
        {/* Hidden native checkbox for form submission and accessibility */}
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          name={name}
          value={value}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
          aria-invalid={invalid}
          className="sr-only"
          onBlur={onBlur}
          onFocus={onFocus}
        />

        {/* Visual checkbox */}
        <label
          htmlFor={checkboxId}
          className={cn('flex items-start gap-2 cursor-pointer', disabled && 'cursor-not-allowed')}
          onKeyDown={handleKeyDown}
        >
          <span className={boxStyles}>
            {checked && !indeterminate && (
              <Icon name="checkmark" size="small" className="text-white" />
            )}
            {indeterminate && (
              <Icon name="minus" size="small" className="text-white" />
            )}
          </span>

          {(label || description) && (
            <span className="flex flex-col">
              {label && <span className={labelStyles}>{label}</span>}
              {description && <span className={descriptionStyles}>{description}</span>}
            </span>
          )}
        </label>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
