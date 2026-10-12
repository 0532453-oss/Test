/**
 * Demo mode detector utility
 * Returns true if the app should run in demo mode (using mock API)
 */

const DEMO_MODE_KEY = 'flexdesk_demo';

/**
 * Checks if the app should run in demo mode.
 * Returns true if:
 * - localStorage has 'flexdesk_demo' set to 'true', OR
 * - No API URL is configured (VITE_API_URL not set)
 */
export function isDemoMode(): boolean {
  if (typeof window !== 'undefined' && localStorage.getItem(DEMO_MODE_KEY) === 'true') {
    return true;
  }

  // If no API URL is configured, fall back to demo mode
  if (!import.meta.env.VITE_API_URL) {
    return true;
  }

  return false;
}

/**
 * Enable demo mode by setting localStorage flag
 */
export function enableDemoMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_MODE_KEY, 'true');
  }
}

/**
 * Disable demo mode by removing localStorage flag
 */
export function disableDemoMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEMO_MODE_KEY);
  }
}
