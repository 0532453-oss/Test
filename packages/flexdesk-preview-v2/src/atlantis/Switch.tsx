import React, { useState, forwardRef } from 'react';

/**
 * Atlantis Switch Component
 *
 * A toggle switch for binary on/off states. Use Switch when the user is
 * toggling a setting or feature on/off, rather than selecting from options.
 *
 * @see https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-switch--docs
 *
 * @example
 * // Basic toggle
 * <Switch value={isEnabled} onChange={setIsEnabled} ariaLabel="Enable feature" />
 *
 * // With external label
 * <label htmlFor="my-switch">Enable notifications</label>
 * <Switch name="my-switch" value={notifications} onChange={setNotifications} />
 *
 * // Disabled state
 * <Switch value={true} disabled ariaLabel="Premium feature (upgrade required)" />
 */

export interface SwitchProps {
  /**
   * The current value (checked state) of the switch.
   * If not provided, the switch will manage its own internal state.
   */
  value?: boolean;

  /**
   * Adds a name for the hidden input and an ID so a label can be used to
   * describe the switch instead of an aria-label. This prevents screen readers
   * from reading the label twice.
   */
  name?: string;

  /**
   * Accessible label for the switch when not using an external label element.
   * Required if `name` is not provided.
   */
  ariaLabel?: string;

  /**
   * Whether the switch is disabled.
   */
  disabled?: boolean;

  /**
   * Callback fired when the switch value changes.
   */
  onChange?: (newValue: boolean) => void;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  function Switch(
    { value: providedValue, ariaLabel, name, disabled, onChange },
    ref
  ) {
    const [statefulValue, setValue] = useState(false);
    const value = providedValue !== undefined ? providedValue : statefulValue;

    const toggleSwitch = () => {
      if (disabled) {
        return;
      }

      const newValue = !value;
      onChange?.(newValue);

      if (providedValue === undefined) {
        setValue(newValue);
      }
    };

    return (
      <>
        <button
          ref={ref}
          id={name}
          type="button"
          role="switch"
          aria-checked={value}
          aria-label={ariaLabel}
          className={`
            relative inline-flex h-5 w-9 shrink-0 items-center rounded-full
            transition-colors duration-200 ease-in-out
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            focus-visible:ring-[var(--color-interactive)]
            ${value
              ? 'bg-[var(--color-interactive)]'
              : 'bg-[var(--color-border)]'
            }
            ${disabled
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer'
            }
          `}
          onClick={toggleSwitch}
          disabled={disabled}
        >
          {/* Toggle pip/thumb */}
          <span
            className={`
              pointer-events-none block h-4 w-4 rounded-full bg-white shadow-md
              transform transition-transform duration-200 ease-in-out
              ${value ? 'translate-x-4' : 'translate-x-0.5'}
            `}
          />
        </button>
        {/* Hidden input for form submission */}
        <input name={name} type="hidden" value={String(value)} />
      </>
    );
  }
);

export default Switch;
