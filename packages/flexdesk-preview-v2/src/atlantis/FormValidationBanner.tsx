/**
 * FormValidationBanner - Displays form validation errors using Banner component
 *
 * Must be used inside a react-hook-form context (e.g., inside AtlantisSimpleForm).
 * Automatically reads form errors from the context and displays them in an
 * error-styled Banner at the top of the form after submission attempt.
 *
 * The banner only appears after the form has been submitted with errors
 * (isSubmitted && hasErrors). It auto-dismisses when all errors are resolved.
 */
import * as React from 'react';
import { useFormState as useRHFFormState } from 'react-hook-form';
import { Banner } from './Banner';
import { Text } from './Text';

export interface FormValidationBannerProps {
  /**
   * Custom error message to display. If not provided, a generic message
   * with field-level error details is shown.
   */
  message?: string;

  /**
   * Whether the banner can be dismissed by the user.
   * When dismissed, it will reappear on the next submission attempt.
   * @default true
   */
  dismissible?: boolean;

  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * Maps react-hook-form field names to human-readable labels.
 * Falls back to the field name with basic formatting if not mapped.
 */
function formatFieldName(fieldName: string): string {
  // Common react-admin field name mappings
  const labelMap: Record<string, string> = {
    title: 'Title',
    name: 'Name',
    clientId: 'Client',
    customerId: 'Customer',
    total: 'Total',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    description: 'Description',
    status: 'Status',
    priority: 'Priority',
    startDate: 'Start date',
    endDate: 'End date',
    scheduledDate: 'Scheduled date',
    dueDate: 'Due date',
    jobNumber: 'Job number',
  };

  if (labelMap[fieldName]) return labelMap[fieldName];

  // Convert camelCase to Title Case with spaces
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/**
 * Extracts a flat list of field names with errors from react-hook-form's
 * nested error object.
 */
function getErrorFieldNames(errors: Record<string, unknown>): string[] {
  const fields: string[] = [];
  for (const key of Object.keys(errors)) {
    if (errors[key] && typeof errors[key] === 'object' && 'message' in (errors[key] as object)) {
      fields.push(key);
    } else if (errors[key] && typeof errors[key] === 'object') {
      // Handle nested field errors (e.g. address.street)
      const nested = getErrorFieldNames(errors[key] as Record<string, unknown>);
      fields.push(...nested.map((n) => `${key}.${n}`));
    }
  }
  return fields;
}

/**
 * FormValidationBanner component that reads form errors from react-hook-form
 * context and displays them in a Banner.
 *
 * @example
 * ```tsx
 * <AtlantisSimpleForm>
 *   <FormValidationBanner />
 *   <TextInput source="title" validate={required()} />
 *   <TextInput source="name" validate={required()} />
 * </AtlantisSimpleForm>
 * ```
 */
export function FormValidationBanner({
  message,
  dismissible = true,
  className,
}: FormValidationBannerProps) {
  const { errors, isSubmitted, submitCount } = useRHFFormState();
  const [dismissed, setDismissed] = React.useState(false);
  const prevSubmitCountRef = React.useRef(submitCount);

  // Reset dismissed state when a new submission attempt occurs
  React.useEffect(() => {
    if (submitCount > prevSubmitCountRef.current) {
      setDismissed(false);
      prevSubmitCountRef.current = submitCount;
    }
  }, [submitCount]);

  const errorFields = getErrorFieldNames(errors as Record<string, unknown>);
  const hasErrors = errorFields.length > 0;

  // Only show after form has been submitted and has errors, and not dismissed
  if (!isSubmitted || !hasErrors || dismissed) {
    return null;
  }

  const errorMessage = message || (
    errorFields.length === 1
      ? `The ${formatFieldName(errorFields[0])} field is required.`
      : `The following fields have errors: ${errorFields.map(formatFieldName).join(', ')}.`
  );

  return (
    <Banner
      type="error"
      title="Please fix the errors below"
      dismissible={dismissible}
      onDismiss={() => setDismissed(true)}
      className={className}
    >
      <Text element="span" size="small">{errorMessage}</Text>
    </Banner>
  );
}

export default FormValidationBanner;
