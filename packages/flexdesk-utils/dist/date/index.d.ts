/**
 * Date utility functions
 */
/**
 * Check if a date is today
 */
declare function isToday(date: Date): boolean;
/**
 * Check if a date is in the past
 */
declare function isPast(date: Date): boolean;
/**
 * Check if a date is in the future
 */
declare function isFuture(date: Date): boolean;
/**
 * Get the start of a day (midnight)
 */
declare function startOfDay(date: Date): Date;
/**
 * Get the end of a day (23:59:59.999)
 */
declare function endOfDay(date: Date): Date;
/**
 * Add days to a date
 */
declare function addDays(date: Date, days: number): Date;
/**
 * Get difference in days between two dates
 */
declare function differenceInDays(dateA: Date, dateB: Date): number;
/**
 * Format a date to ISO date string (YYYY-MM-DD)
 */
declare function toISODateString(date: Date): string;
/**
 * Parse an ISO date string to Date
 */
declare function parseISODate(dateString: string): Date;

export { addDays, differenceInDays, endOfDay, isFuture, isPast, isToday, parseISODate, startOfDay, toISODateString };
