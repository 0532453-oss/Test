/**
 * Formatting helpers used across the app.
 *
 * Extracted from mockData so production screens don't bundle mock arrays.
 */

/** Format a number as "$X,XXX" with commas, no decimals. */
export function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Format a date string as "Jan 15" (short) or "Feb 10, 2026" (full). */
export function formatDate(
  date: Date | string,
  style: 'short' | 'full' = 'short'
): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  if (style === 'full') {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
