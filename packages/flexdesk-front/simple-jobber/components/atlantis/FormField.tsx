/**
 * FormField - Local implementation matching @jobber/components FormField API
 *
 * This provides the same interface as the Atlantis component library's FormField,
 * allowing future migration to the actual library when fully integrated.
 *
 * FormField wraps input components to provide labels, descriptions, and validation messages.
 *
 * @see https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-formfield--docs
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { Text } from './Text';
import { InputValidation } from './InputValidation';

/**
 * Validation rule type for FormField
 * A function that takes a value and returns an error message string if invalid,
 * or undefined if valid.
 */
export type ValidationRule<T = unknown> = (value: T) => string | undefined;

export interface FormFieldProps {
  /**
   * The label for the field
   */
  readonly label?: string;

  /**
   * Description/help text shown below the input
   */
  readonly description?: string;

  /**
   * Error message to display (overrides validation result)
   */
  readonly error?: string;

  /**
   * Whether the field is required
   * @default false
   */
  readonly required?: boolean;

  /**
   * The form input element(s)
   */
  readonly children: React.ReactNode;

  /**
   * Custom class name
   */
  readonly className?: string;

  /**
   * ID for the label's htmlFor attribute
   */
  readonly htmlFor?: string;

  /**
   * Field name for accessibility associations
   */
  readonly name?: string;

  /**
   * Validation rules to apply to the field.
   * Each rule is a function that returns an error message if invalid.
   * Multiple rules are evaluated in order; first error wins.
   *
   * @example
   * <FormField
   *   label="Email"
   *   validations={[
   *     (v) => !v ? "Email is required" : undefined,
   *     (v) => !v.includes("@") ? "Must be a valid email" : undefined,
   *   ]}
   * >
   *   <InputText />
   * </FormField>
   */
  readonly validations?: ValidationRule[];

  /**
   * Current value for running validations against.
   * Required if using the validations prop.
   */
  readonly value?: unknown;
}

/**
 * Run validation rules against a value
 * Returns the first error message found, or undefined if all validations pass
 */
function runValidations(
  value: unknown,
  validations: ValidationRule[] | undefined
): string | undefined {
  if (!validations || validations.length === 0) {
    return undefined;
  }

  for (const rule of validations) {
    const error = rule(value);
    if (error) {
      return error;
    }
  }

  return undefined;
}

/**
 * FormField component following Atlantis/Jobber design system
 *
 * @example
 * // With external error message
 * <FormField label="Email" required error={errors.email}>
 *   <InputText placeholder="Enter your email" />
 * </FormField>
 *
 * @example
 * // With validation rules
 * <FormField
 *   label="Email"
 *   required
 *   value={email}
 *   validations={[
 *     (v) => !v ? "Email is required" : undefined,
 *     (v) => !String(v).includes("@") ? "Must be a valid email" : undefined,
 *   ]}
 * >
 *   <InputText value={email} onChange={setEmail} />
 * </FormField>
 */
export function FormField({
  label,
  description,
  error,
  required = false,
  children,
  className,
  htmlFor,
  name,
  validations,
  value,
}: FormFieldProps) {
  // Compute validation error from rules if provided
  const validationError = runValidations(value, validations);

  // External error prop takes precedence over computed validation error
  const displayError = error || validationError;

  // Generate unique IDs for accessibility
  const fieldId = htmlFor || name;
  const descriptionId = fieldId ? `${fieldId}-description` : undefined;
  const errorId = fieldId ? `${fieldId}-error` : undefined;

  return (
    <div
      className={cn('flex flex-col gap-2', className)}
      role="group"
      aria-labelledby={fieldId ? `${fieldId}-label` : undefined}
    >
      {/* Label */}
      {label && (
        <label
          id={fieldId ? `${fieldId}-label` : undefined}
          htmlFor={htmlFor}
          className={cn(
            'flex items-center gap-1 text-sm font-medium',
            displayError ? 'text-[--color-critical]' : 'text-[--color-text]'
          )}
        >
          {label}
          {required && (
            <span className="text-[--color-critical]" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {/* Input children */}
      {children}

      {/* Description (hidden when error is shown) */}
      {description && !displayError && (
        <Text
          variation="subdued"
          size="small"
          element="span"
          {...{ id: descriptionId } as any}
        >
          {description}
        </Text>
      )}

      {/* Error message using InputValidation */}
      {displayError && (
        <div id={errorId}>
          <InputValidation message={displayError} />
        </div>
      )}
    </div>
  );
}

FormField.displayName = 'FormField';

export default FormField;
