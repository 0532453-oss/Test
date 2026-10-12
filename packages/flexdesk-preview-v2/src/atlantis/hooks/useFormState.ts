/**
 * useFormState Hook
 *
 * Atlantis-style form state hook matching @jobber/hooks useFormState API.
 * Provides convenient state management for form dirty/valid tracking and
 * integration with unsaved changes warnings.
 *
 * @see https://atlantis.getjobber.com/?path=/docs/hooks-useformstate--docs
 */

import { useState, useCallback, useMemo } from 'react';
import type { AtlantisFormState } from '../Form';

/**
 * Return type for useFormState hook
 */
export interface UseFormStateReturn {
  /** Current form state */
  formState: AtlantisFormState;
  /** Update form state (typically called from form's onStateChange) */
  setFormState: (state: AtlantisFormState) => void;
  /** Whether the form has unsaved changes (alias for formState.isDirty) */
  hasUnsavedChanges: boolean;
  /** Whether the form can be submitted (valid and not currently submitting) */
  canSubmit: boolean;
  /** Reset form state to initial values */
  resetFormState: () => void;
}

/**
 * Initial form state value
 */
const initialFormState: AtlantisFormState = {
  isDirty: false,
  isSubmitting: false,
  isValid: true,
  isTouched: false,
};

/**
 * Hook for managing form state tracking with convenient utility methods.
 *
 * This hook provides a standardized way to track form state changes from
 * AtlantisSimpleForm's onStateChange callback, making it easy to implement
 * unsaved changes warnings and form submission logic.
 *
 * @param initialState - Optional initial form state (default: clean/valid state)
 * @returns An object containing the form state and utility methods
 *
 * @example
 * // Basic usage with AtlantisSimpleForm
 * const { formState, setFormState, hasUnsavedChanges } = useFormState();
 *
 * // Show warning when navigating away with unsaved changes
 * useEffect(() => {
 *   if (hasUnsavedChanges) {
 *     window.onbeforeunload = () => "You have unsaved changes";
 *   }
 *   return () => { window.onbeforeunload = null; };
 * }, [hasUnsavedChanges]);
 *
 * return (
 *   <AtlantisSimpleForm onStateChange={setFormState}>
 *     <TextInput source="name" />
 *   </AtlantisSimpleForm>
 * );
 *
 * @example
 * // Using canSubmit for conditional button state
 * const { setFormState, canSubmit } = useFormState();
 *
 * return (
 *   <AtlantisSimpleForm onStateChange={setFormState}>
 *     <TextInput source="name" />
 *     <button disabled={!canSubmit}>Submit</button>
 *   </AtlantisSimpleForm>
 * );
 *
 * @example
 * // Confirming navigation with unsaved changes
 * const { setFormState, hasUnsavedChanges, resetFormState } = useFormState();
 * const navigate = useNavigate();
 *
 * const handleCancel = () => {
 *   if (hasUnsavedChanges) {
 *     if (confirm("Discard unsaved changes?")) {
 *       resetFormState();
 *       navigate(-1);
 *     }
 *   } else {
 *     navigate(-1);
 *   }
 * };
 */
export function useFormState(initialState?: Partial<AtlantisFormState>): UseFormStateReturn {
  const [formState, setFormStateInternal] = useState<AtlantisFormState>({
    ...initialFormState,
    ...initialState,
  });

  const setFormState = useCallback((state: AtlantisFormState) => {
    setFormStateInternal(state);
  }, []);

  const resetFormState = useCallback(() => {
    setFormStateInternal(initialFormState);
  }, []);

  // Computed properties
  const hasUnsavedChanges = formState.isDirty;
  const canSubmit = formState.isValid && !formState.isSubmitting;

  // Memoize the return object to maintain referential equality
  return useMemo(
    () => ({
      formState,
      setFormState,
      hasUnsavedChanges,
      canSubmit,
      resetFormState,
    }),
    [formState, setFormState, hasUnsavedChanges, canSubmit, resetFormState]
  );
}

export default useFormState;
