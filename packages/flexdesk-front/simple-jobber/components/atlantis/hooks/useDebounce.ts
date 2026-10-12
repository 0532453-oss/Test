/**
 * useDebounce Hook
 *
 * Atlantis-style debounce hook matching @jobber/hooks useDebounce API.
 * Delays the update of a value until after a specified delay has passed
 * since the last time the value was changed.
 *
 * @see https://atlantis.getjobber.com/?path=/docs/hooks-usedebounce--docs
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Debounces a value, only updating after the specified delay.
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300)
 * @returns The debounced value
 *
 * @example
 * // Debounce search input value
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 *
 * useEffect(() => {
 *   // This will only run 300ms after the user stops typing
 *   fetchSearchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the debounce timer
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer on value or delay change
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Returns a debounced version of a callback function.
 *
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds (default: 300)
 * @returns A debounced version of the callback and a cancel function
 *
 * @example
 * // Debounce an API call
 * const [debouncedFetch, cancelFetch] = useDebouncedCallback(
 *   (searchTerm: string) => fetchResults(searchTerm),
 *   300
 * );
 *
 * // Call this on every input change
 * debouncedFetch(inputValue);
 *
 * // Optionally cancel pending calls
 * cancelFetch();
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number = 300
): [(...args: Parameters<T>) => void, () => void] {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cancel function
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  // Debounced function
  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      cancel();
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay, cancel]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return [debouncedCallback, cancel];
}

export type { };
