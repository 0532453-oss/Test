/**
 * Atlantis Hooks - Local implementations matching @jobber/hooks API
 *
 * These hooks provide the same interface as the Atlantis hooks library,
 * allowing future migration to the actual library when fully integrated.
 */

export { useDebounce, useDebouncedCallback } from './useDebounce';
export { useBreakpoints, BREAKPOINT_SIZES, type UseBreakpointsReturn } from './useBreakpoints';
export { useBool, type UseBoolReturn } from './useBool';
export { useFormState, type UseFormStateReturn } from './useFormState';
export { useSuccessNotification, type UseSuccessNotificationReturn } from './useSuccessNotification';
export { useLineItemColumnVisibility, type UseLineItemColumnVisibilityReturn } from './useLineItemColumnVisibility';

// Re-export AtlantisFormState from Form component for convenience
export type { AtlantisFormState } from '../Form';
