/**
 * InputValidation - Local implementation matching @jobber/components InputValidation API
 *
 * This provides the same interface as the Atlantis component library's InputValidation,
 * allowing future migration to the actual library when fully integrated.
 *
 * InputValidation displays validation error messages with consistent styling.
 * Uses an alert icon and error text variation for clear visual feedback.
 *
 * @see https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-inputvalidation--docs
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { Text } from './Text';
import { Icon } from './Icon';

export interface InputValidationProps {
  /**
   * Validation message to be displayed
   */
  readonly message: string;

  /**
   * Whether the validation message should be visible
   * @default true
   */
  readonly visible?: boolean;

  /**
   * Custom class name for the container
   */
  readonly className?: string;
}

/**
 * InputValidation component following Atlantis/Jobber design system
 *
 * Displays validation error messages with an alert icon and animated entrance.
 * Should be used within FormField or alongside input components to show
 * validation feedback.
 *
 * @example
 * // Simple error message
 * <InputValidation message="Email is required" />
 *
 * @example
 * // Conditional visibility
 * <InputValidation
 *   message="Please enter a valid email"
 *   visible={!!errors.email}
 * />
 *
 * @example
 * // With FormField
 * <FormField label="Email" error={errors.email?.message}>
 *   <InputEmail value={email} onChange={setEmail} invalid={!!errors.email} />
 * </FormField>
 */
export function InputValidation({
  message,
  visible = true,
  className,
}: InputValidationProps) {
  if (!visible || !message) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-start gap-2',
        'animate-in fade-in slide-in-from-top-1 duration-200',
        className
      )}
      aria-live="assertive"
      role="alert"
    >
      <Icon
        name="warning"
        size="small"
        className="text-[var(--color-critical)] mt-0.5 flex-shrink-0"
      />
      <Text size="small" variation="error">
        {message}
      </Text>
    </div>
  );
}

InputValidation.displayName = 'InputValidation';

export default InputValidation;
