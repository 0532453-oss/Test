/**
 * Mobile detection hook using Atlantis useBreakpoints
 *
 * This hook provides backward-compatible mobile detection using the
 * Atlantis useBreakpoints hook under the hood.
 *
 * The mobile breakpoint is 768px (mediumAndUp threshold), matching
 * the previous MOBILE_BREAKPOINT constant and Tailwind's md: breakpoint.
 */
import { useBreakpoints } from '@/components/atlantis/hooks';

/**
 * Hook to detect if the current viewport is considered "mobile"
 * (below the medium breakpoint of 768px).
 *
 * @returns true if viewport width is less than 768px, false otherwise
 *
 * @example
 * const isMobile = useIsMobile();
 *
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 * return <DesktopLayout />;
 */
export function useIsMobile(): boolean {
  const { mediumAndUp } = useBreakpoints();

  // Mobile is when we're NOT at medium breakpoint or above
  return !mediumAndUp;
}
