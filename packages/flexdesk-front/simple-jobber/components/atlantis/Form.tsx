/**
 * Form - Local implementation matching @jobber/components Form API
 *
 * This provides the same interface as the Atlantis component library's Form,
 * allowing future migration to the actual library when fully integrated.
 *
 * Form provides consistent form handling with submission, validation, and state tracking.
 *
 * @see https://atlantis.getjobber.com/?path=/docs/components-forms-and-inputs-form--docs
 */
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Form state interface matching Atlantis Form API
 * This is the full internal state with field-level tracking
 */
export interface FormState {
  /**
   * Whether the form has been modified from initial values
   */
  isDirty: boolean;

  /**
   * Whether the form is currently being submitted
   */
  isSubmitting: boolean;

  /**
   * Whether all form fields are valid
   */
  isValid: boolean;

  /**
   * Map of field errors by field name
   */
  errors: Record<string, string | undefined>;

  /**
   * Map of touched fields by field name
   */
  touched: Record<string, boolean>;

  /**
   * Current form values
   */
  values: Record<string, unknown>;
}

/**
 * Simplified form state for onStateChange callbacks
 * This is the state passed to parent components via onStateChange prop
 * Used for tracking unsaved changes and form progress
 *
 * @see https://atlantis.getjobber.com/components/Form
 */
export interface AtlantisFormState {
  /**
   * Whether the form has been modified from initial values
   */
  isDirty: boolean;

  /**
   * Whether the form is currently being submitted
   */
  isSubmitting: boolean;

  /**
   * Whether all form fields are valid
   */
  isValid: boolean;

  /**
   * Whether the form has been touched (any field focused)
   */
  isTouched: boolean;
}

/**
 * Form context value for child components
 */
interface FormContextValue {
  /**
   * Current form state
   */
  state: FormState;

  /**
   * Set a field value
   */
  setFieldValue: (name: string, value: unknown) => void;

  /**
   * Set a field error
   */
  setFieldError: (name: string, error: string | undefined) => void;

  /**
   * Set a field as touched
   */
  setFieldTouched: (name: string, touched: boolean) => void;

  /**
   * Reset form to initial values
   */
  reset: () => void;

  /**
   * Submit the form
   */
  submit: () => void;
}

const FormContext = createContext<FormContextValue | null>(null);

/**
 * Hook to access form context
 * @throws Error if used outside of Form component
 */
export function useAtlantisForm(): FormContextValue {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useAtlantisForm must be used within an Atlantis Form component');
  }
  return context;
}

export interface FormProps {
  /**
   * Form children (fields and content)
   */
  readonly children: React.ReactNode;

  /**
   * Initial form values
   */
  readonly initialValues?: Record<string, unknown>;

  /**
   * Called when form is submitted with valid data
   */
  readonly onSubmit?: (values: Record<string, unknown>) => void | Promise<void>;

  /**
   * Called when form state changes (dirty, valid, etc.)
   * Useful for tracking unsaved changes
   */
  readonly onStateChange?: (state: FormState) => void;

  /**
   * Additional class names
   */
  readonly className?: string;

  /**
   * Disables the form
   */
  readonly disabled?: boolean;

  /**
   * Validation mode
   * - 'onSubmit': Validate only on submit
   * - 'onChange': Validate on every change
   * - 'onBlur': Validate on field blur
   * @default 'onSubmit'
   */
  readonly validationMode?: 'onSubmit' | 'onChange' | 'onBlur';
}

/**
 * Form component following Atlantis/Jobber design system
 *
 * Provides form state management, submission handling, and validation.
 * Can be used with FormField and input components for consistent form UX.
 *
 * @example
 * ```tsx
 * <Form
 *   initialValues={{ name: '', email: '' }}
 *   onSubmit={(values) => console.log(values)}
 *   onStateChange={(state) => setHasUnsavedChanges(state.isDirty)}
 * >
 *   <FormField label="Name" required>
 *     <InputText name="name" placeholder="Enter name" />
 *   </FormField>
 *   <FormField label="Email">
 *     <InputEmail name="email" placeholder="Enter email" />
 *   </FormField>
 *   <Button type="submit">Submit</Button>
 * </Form>
 * ```
 */
export function Form({
  children,
  initialValues = {},
  onSubmit,
  onStateChange,
  className,
  disabled = false,
  validationMode = 'onSubmit',
}: FormProps) {
  // Track initial values for dirty checking
  const initialValuesRef = useRef(initialValues);

  // Form state
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived state
  const isDirty = useMemo(() => {
    const initial = initialValuesRef.current;
    return Object.keys(values).some(key => values[key] !== initial[key]) ||
           Object.keys(initial).some(key => values[key] !== initial[key]);
  }, [values]);

  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error);
  }, [errors]);

  // Create state object
  const state = useMemo<FormState>(() => ({
    isDirty,
    isSubmitting,
    isValid,
    errors,
    touched,
    values,
  }), [isDirty, isSubmitting, isValid, errors, touched, values]);

  // Call onStateChange when state changes
  const prevStateRef = useRef(state);
  React.useEffect(() => {
    if (onStateChange && prevStateRef.current !== state) {
      onStateChange(state);
      prevStateRef.current = state;
    }
  }, [state, onStateChange]);

  // Set field value
  const setFieldValue = useCallback((name: string, value: unknown) => {
    setValues(prev => ({ ...prev, [name]: value }));

    // Clear error when value changes (if validating onChange)
    if (validationMode === 'onChange') {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [validationMode]);

  // Set field error
  const setFieldError = useCallback((name: string, error: string | undefined) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  // Set field touched
  const setFieldTouched = useCallback((name: string, isTouched: boolean) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
  }, []);

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValuesRef.current);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, []);

  // Submit form
  const submit = useCallback(async () => {
    if (disabled || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(values);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [disabled, isSubmitting, onSubmit, values]);

  // Handle native form submission
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  }, [submit]);

  // Context value
  const contextValue = useMemo<FormContextValue>(() => ({
    state,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    reset,
    submit,
  }), [state, setFieldValue, setFieldError, setFieldTouched, reset, submit]);

  return (
    <FormContext.Provider value={contextValue}>
      <form
        onSubmit={handleSubmit}
        className={cn('flex flex-col gap-4', className)}
        aria-disabled={disabled}
      >
        <fieldset disabled={disabled} className="flex flex-col gap-4">
          {children}
        </fieldset>
      </form>
    </FormContext.Provider>
  );
}

Form.displayName = 'Form';

export default Form;
