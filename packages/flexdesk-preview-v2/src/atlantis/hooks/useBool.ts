/**
 * useBool Hook
 *
 * Atlantis-style boolean state hook matching @jobber/hooks useBool API.
 * Provides convenient methods for managing boolean state values.
 *
 * @see https://atlantis.getjobber.com/?path=/docs/hooks-usebool--docs
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * Return type for useBool hook
 */
export interface UseBoolReturn {
  /** Current boolean value */
  value: boolean;
  /** Set value to true */
  setTrue: () => void;
  /** Set value to false */
  setFalse: () => void;
  /** Toggle the value */
  toggle: () => void;
  /** Set value directly */
  setValue: (value: boolean) => void;
}

/**
 * Hook for managing boolean state with convenient utility methods.
 *
 * @param initialValue - The initial boolean value (default: false)
 * @returns An object containing the value and utility methods
 *
 * @example
 * // Basic modal open/close state
 * const modal = useBool(false);
 *
 * return (
 *   <>
 *     <button onClick={modal.setTrue}>Open Modal</button>
 *     <Modal open={modal.value} onRequestClose={modal.setFalse}>
 *       ...
 *     </Modal>
 *   </>
 * );
 *
 * @example
 * // Toggle visibility
 * const password = useBool(false);
 *
 * return (
 *   <input
 *     type={password.value ? "text" : "password"}
 *     suffix={
 *       <button onClick={password.toggle}>
 *         {password.value ? "Hide" : "Show"}
 *       </button>
 *     }
 *   />
 * );
 *
 * @example
 * // Drawer state with explicit control
 * const drawer = useBool(false);
 *
 * // Later, conditionally control
 * if (shouldClose) {
 *   drawer.setFalse();
 * } else if (shouldOpen) {
 *   drawer.setTrue();
 * }
 */
export function useBool(initialValue: boolean = false): UseBoolReturn {
  const [value, setValue] = useState<boolean>(initialValue);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  // Memoize the return object to maintain referential equality
  // when value hasn't changed
  return useMemo(
    () => ({
      value,
      setTrue,
      setFalse,
      toggle,
      setValue,
    }),
    [value, setTrue, setFalse, toggle]
  );
}

export default useBool;
