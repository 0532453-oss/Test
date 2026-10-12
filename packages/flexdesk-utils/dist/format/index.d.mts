/**
 * Formatting utility functions
 */
interface CurrencyFormatOptions {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
}
/**
 * Format a number as currency
 */
declare function formatCurrency(amount: number, options?: CurrencyFormatOptions): string;
/**
 * Format a number with thousand separators
 */
declare function formatNumber(value: number, locale?: string): string;
/**
 * Format a percentage
 */
declare function formatPercent(value: number, decimals?: number, locale?: string): string;
/**
 * Format a phone number (US format)
 */
declare function formatPhoneNumber(phone: string): string;
/**
 * Format bytes to human readable string
 */
declare function formatBytes(bytes: number, decimals?: number): string;
/**
 * Format duration in minutes to human readable string
 */
declare function formatDuration(minutes: number): string;

export { type CurrencyFormatOptions, formatBytes, formatCurrency, formatDuration, formatNumber, formatPercent, formatPhoneNumber };
