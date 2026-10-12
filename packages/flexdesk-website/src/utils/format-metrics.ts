/**
 * Format Metrics Utilities
 * 
 * Provides human-readable formatting for various metrics
 * (GitHub stars, counts, numbers, etc.)
 */

/**
 * Formats a number of stars/counts into a human-readable string
 * 
 * Examples:
 * - 1234 → "1.2k"
 * - 500 → "500"
 * - 1500 → "1.5k"
 * - 12345 → "12.3k"
 * - 1000000 → "1.0M"
 * 
 * @param count - The number to format
 * @returns Formatted string
 */
export function formatMetricCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  }

  if (count < 1000000) {
    // Format as thousands (k)
    const thousands = Math.round(count / 100) / 10;
    // Remove trailing zero if it's a whole number
    const formatted = thousands % 1 === 0 
      ? thousands.toFixed(0) 
      : thousands.toFixed(1);
    return `${formatted}k`;
  }

  // Format as millions (M)
  const millions = Math.round(count / 100000) / 10;
  const formatted = millions % 1 === 0 
    ? millions.toFixed(0) 
    : millions.toFixed(1);
  return `${formatted}M`;
}

/**
 * Formats GitHub stars specifically
 * 
 * @param stars - Number of GitHub stars
 * @returns Formatted string with "stars" suffix context
 */
export function formatGitHubStars(stars: number): string {
  return formatMetricCount(stars);
}

/**
 * Formats a number with locale-specific formatting
 * 
 * @param count - The number to format
 * @param locale - Locale string (default: "en-US")
 * @returns Locale-formatted string (e.g., "1,234" in en-US)
 */
export function formatMetricCountLocale(
  count: number,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale).format(count);
}

/**
 * Formats a number with unit abbreviation
 * 
 * @param count - The number to format
 * @param unit - Unit name (e.g., "stars", "forks", "contributors")
 * @returns Formatted string with unit
 * 
 * @example
 * formatMetricWithUnit(1234, "stars") // "1.2k stars"
 * formatMetricWithUnit(42, "forks") // "42 forks"
 */
export function formatMetricWithUnit(count: number, unit: string): string {
  const formatted = formatMetricCount(count);
  return `${formatted} ${unit}`;
}

/**
 * Formats a percentage change
 * 
 * @param current - Current value
 * @param previous - Previous value
 * @returns Formatted percentage change (e.g., "+12.5%" or "-5.2%")
 */
export function formatMetricChange(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? '+100%' : '0%';
  }

  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  const formatted = Math.abs(change).toFixed(1);
  
  return `${sign}${formatted}%`;
}
