import { createContext, useCallback, useContext, useId, useState, forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Atlantis RadioGroup Component
 * Matches @jobber/components RadioGroup API for FlexDesk migration
 *
 * @see https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-radiogroup--docs
 *
 * Usage:
 * ```tsx
 * <RadioGroup
 *   name="priority"
 *   value={selectedValue}
 *   onChange={setSelectedValue}
 *   direction="horizontal"
 * >
 *   <RadioOption value="high">High</RadioOption>
 *   <RadioOption value="medium">Medium</RadioOption>
 *   <RadioOption value="low">Low</RadioOption>
 * </RadioGroup>
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type RadioGroupDirection = 'vertical' | 'horizontal';

export interface RadioGroupProps {
  /**
   * The name attribute for all radio inputs in the group
   */
  name?: string;

  /**
   * Currently selected value
   */
  value?: string;

  /**
   * Default value (for uncontrolled usage)
   */
  defaultValue?: string;

  /**
   * Callback when selection changes
   */
  onChange?: (value: string) => void;

  /**
   * Direction of the radio options layout
   * @default 'vertical'
   */
  direction?: RadioGroupDirection;

  /**
   * Whether the entire group is disabled
   */
  disabled?: boolean;

  /**
   * Whether the field is invalid/has an error
   */
  invalid?: boolean;

  /**
   * Child RadioOption components
   */
  children: React.ReactNode;

  /**
   * Additional class names
   */
  className?: string;

  /**
   * ARIA label for the radio group
   */
  ariaLabel?: string;

  /**
   * ARIA labelledby for the radio group
   */
  ariaLabelledBy?: string;
}

export interface RadioOptionProps {
  /**
   * The value of this option
   */
  value: string;

  /**
   * Label content for the option (can be string or ReactNode)
   */
  children?: React.ReactNode;

  /**
   * Alternative to children, text label for the option
   */
  label?: React.ReactNode;

  /**
   * Description text below the label
   */
  description?: React.ReactNode;

  /**
   * Whether this specific option is disabled
   */
  disabled?: boolean;

  /**
   * Additional class names
   */
  className?: string;
}

// ============================================================================
// Context
// ============================================================================

interface RadioGroupContextValue {
  name: string;
  value?: string;
  onChange: (value: string) => void;
  disabled: boolean;
  invalid: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

const useRadioGroupContext = () => {
  const context = useContext(RadioGroupContext);
  if (!context) {
    throw new Error('RadioOption must be used within a RadioGroup');
  }
  return context;
};

// ============================================================================
// RadioGroup Component
// ============================================================================

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      name,
      value,
      defaultValue,
      onChange,
      direction = 'vertical',
      disabled = false,
      invalid = false,
      children,
      className,
      ariaLabel,
      ariaLabelledBy,
    },
    ref
  ) => {
    const generatedId = useId();
    const groupName = name || `radio-group-${generatedId}`;
    const [internalValue, setInternalValue] = useState(defaultValue);

    // Handle controlled and uncontrolled modes
    const handleChange = useCallback(
      (newValue: string) => {
        if (value === undefined) {
          setInternalValue(newValue);
        }
        onChange?.(newValue);
      },
      [value, onChange]
    );

    const currentValue = value !== undefined ? value : internalValue;

    const containerStyles = cn(
      'flex gap-3',
      direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
      disabled && 'opacity-50',
      className
    );

    const contextValue: RadioGroupContextValue = {
      name: groupName,
      value: currentValue,
      onChange: handleChange,
      disabled,
      invalid,
    };

    return (
      <RadioGroupContext.Provider value={contextValue}>
        <div
          ref={ref}
          role="radiogroup"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-invalid={invalid}
          className={containerStyles}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

// ============================================================================
// RadioOption Component
// ============================================================================

export const RadioOption = forwardRef<HTMLInputElement, RadioOptionProps>(
  ({ value, children, label, description, disabled: optionDisabled = false, className }, ref) => {
    const { name, value: selectedValue, onChange, disabled: groupDisabled, invalid } = useRadioGroupContext();

    const id = useId();
    const isChecked = selectedValue === value;
    const isDisabled = groupDisabled || optionDisabled;

    const handleChange = useCallback(() => {
      if (!isDisabled) {
        onChange(value);
      }
    }, [isDisabled, onChange, value]);

    // Handle keyboard interaction for the visual radio
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLLabelElement>) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          handleChange();
        }
      },
      [handleChange]
    );

    // Container styles
    const containerStyles = cn(
      'flex items-start gap-2',
      isDisabled && 'opacity-50 cursor-not-allowed',
      className
    );

    // Radio circle styles
    const circleStyles = cn(
      // Base styles
      'flex items-center justify-center',
      'w-4 h-4 rounded-full border-2 transition-all duration-150',
      'shrink-0 mt-0.5',

      // States
      isChecked
        ? // Checked state
          invalid
          ? 'border-[var(--color-critical)] bg-transparent'
          : 'border-[var(--color-interactive)] bg-transparent'
        : // Unchecked state
          invalid
          ? 'border-[var(--color-critical)] bg-transparent'
          : 'border-[var(--color-border)] bg-transparent hover:border-[var(--color-interactive)]',

      isDisabled && 'cursor-not-allowed'
    );

    // Inner dot styles (shown when checked)
    const dotStyles = cn(
      'w-2 h-2 rounded-full transition-all duration-150',
      isChecked ? 'scale-100' : 'scale-0',
      invalid ? 'bg-[var(--color-critical)]' : 'bg-[var(--color-interactive)]'
    );

    // Label styles
    const labelStyles = cn('text-sm cursor-pointer select-none', isDisabled && 'cursor-not-allowed');

    // Description styles
    const descriptionStyles = cn('text-xs text-[var(--color-text--secondary)] mt-0.5');

    const labelContent = children || label;

    return (
      <div className={containerStyles}>
        {/* Hidden native radio for form submission and accessibility */}
        <input
          ref={ref}
          type="radio"
          id={id}
          name={name}
          value={value}
          checked={isChecked}
          onChange={handleChange}
          disabled={isDisabled}
          aria-invalid={invalid}
          className="sr-only"
        />

        {/* Visual radio */}
        <label
          htmlFor={id}
          className={cn('flex items-start gap-2 cursor-pointer', isDisabled && 'cursor-not-allowed')}
          onKeyDown={handleKeyDown}
        >
          <span className={circleStyles}>
            <span className={dotStyles} />
          </span>

          {(labelContent || description) && (
            <span className="flex flex-col">
              {labelContent && <span className={labelStyles}>{labelContent}</span>}
              {description && <span className={descriptionStyles}>{description}</span>}
            </span>
          )}
        </label>
      </div>
    );
  }
);

RadioOption.displayName = 'RadioOption';
