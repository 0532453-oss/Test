/**
 * Atlantis Hooks - Re-exports from simple-jobber implementations
 *
 * These hooks provide the same interface as the @jobber/hooks library,
 * allowing future migration to the actual library when fully integrated.
 */

export {
  useDebounce,
  useDebouncedCallback,
} from '../../../../../flexdesk-front/simple-jobber/components/atlantis/hooks/useDebounce';

export {
  useBreakpoints,
  BREAKPOINT_SIZES,
  type UseBreakpointsReturn,
} from '../../../../../flexdesk-front/simple-jobber/components/atlantis/hooks/useBreakpoints';

export {
  useBool,
  type UseBoolReturn,
} from '../../../../../flexdesk-front/simple-jobber/components/atlantis/hooks/useBool';
