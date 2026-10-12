/**
 * useBreakpoints Hook
 *
 * Atlantis-style breakpoint detection hook matching @jobber/hooks useBreakpoints API.
 * Provides reactive breakpoint state based on CSS media queries.
 *
 * @see https://atlantis.getjobber.com/?path=/docs/hooks-usebreakpoints--docs
 */

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Atlantis breakpoint sizes (in pixels)
 * These match the Tailwind breakpoints commonly used in the codebase:
 * - sm: 490px (small mobile devices)
 * - md: 768px (tablets)
 * - lg: 1080px (desktop)
 * - xl: 1440px (large desktop)
 */
export const BREAKPOINT_SIZES = {
  sm: 490,
  md: 768,
  lg: 1080,
  xl: 1440,
} as const;

type MediaQuery = `(${string}:${string})`;

/**
 * Media query store for useSyncExternalStore
 * Provides subscription and snapshot functions for media query changes
 */
const mediaQueryStore = {
  subscribe(onChange: () => void, query: MediaQuery) {
    const matchMedia = window.matchMedia(query);
    matchMedia.addEventListener('change', onChange);

    return () => {
      matchMedia.removeEventListener('change', onChange);
    };
  },
  getSnapshot(query: MediaQuery) {
    return () => window.matchMedia(query).matches;
  },
};

/**
 * Low-level hook for subscribing to a single media query.
 * Used internally by useBreakpoints.
 *
 * @param query - CSS media query string
 * @returns Whether the media query currently matches
 */
function useMediaQuery(query: MediaQuery): boolean {
  const subscribeMediaQuery = useCallback(
    (onChange: () => void) => mediaQueryStore.subscribe(onChange, query),
    [query]
  );

  const matches = useSyncExternalStore(
    subscribeMediaQuery,
    mediaQueryStore.getSnapshot(query),
    () => true // Server-side default
  );

  return matches;
}

/**
 * Breakpoint return type for useBreakpoints hook
 */
export interface UseBreakpointsReturn {
  /** True when viewport is >= 490px */
  smallAndUp: boolean;
  /** True when viewport is >= 768px */
  mediumAndUp: boolean;
  /** True when viewport is >= 1080px */
  largeAndUp: boolean;
  /** True when viewport is >= 1440px */
  extraLargeAndUp: boolean;
  /** True when viewport is < 490px */
  extraSmallOnly: boolean;
  /** True when viewport is >= 490px and < 768px */
  smallOnly: boolean;
  /** True when viewport is >= 768px and < 1080px */
  mediumOnly: boolean;
  /** True when viewport is >= 1080px and < 1440px */
  largeOnly: boolean;
}

/**
 * Hook for responsive breakpoint detection.
 * Provides reactive boolean values for each breakpoint range.
 *
 * @returns Object with boolean values for each breakpoint state
 *
 * @example
 * // Basic usage
 * const { smallAndUp, mediumAndUp, extraSmallOnly } = useBreakpoints();
 *
 * // Conditional rendering based on breakpoint
 * return (
 *   <div>
 *     {mediumAndUp ? <DesktopNav /> : <MobileNav />}
 *   </div>
 * );
 *
 * @example
 * // Responsive component switching
 * const { extraSmallOnly, smallOnly, mediumAndUp } = useBreakpoints();
 *
 * if (extraSmallOnly) {
 *   return <CompactView />;
 * } else if (smallOnly) {
 *   return <MobileView />;
 * } else {
 *   return <DesktopView />;
 * }
 */
export function useBreakpoints(): UseBreakpointsReturn {
  const { sm, md, lg, xl } = BREAKPOINT_SIZES;

  const extraSmallOnly = useMediaQuery(`(max-width: ${sm - 1}px)`);
  const smallAndUp = useMediaQuery(`(min-width: ${sm}px)`);
  const mediumAndUp = useMediaQuery(`(min-width: ${md}px)`);
  const largeAndUp = useMediaQuery(`(min-width: ${lg}px)`);
  const extraLargeAndUp = useMediaQuery(`(min-width: ${xl}px)`);

  return {
    smallAndUp,
    mediumAndUp,
    largeAndUp,
    extraLargeAndUp,
    extraSmallOnly,
    smallOnly: smallAndUp && !mediumAndUp,
    mediumOnly: mediumAndUp && !largeAndUp,
    largeOnly: largeAndUp && !extraLargeAndUp,
  };
}

export type { MediaQuery };
