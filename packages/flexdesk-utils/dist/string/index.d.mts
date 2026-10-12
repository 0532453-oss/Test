/**
 * String utility functions
 */
/**
 * Capitalize the first letter of a string
 */
declare function capitalize(str: string): string;
/**
 * Convert string to title case
 */
declare function toTitleCase(str: string): string;
/**
 * Convert string to camelCase
 */
declare function toCamelCase(str: string): string;
/**
 * Convert string to snake_case
 */
declare function toSnakeCase(str: string): string;
/**
 * Convert string to kebab-case
 */
declare function toKebabCase(str: string): string;
/**
 * Truncate a string to a maximum length
 */
declare function truncate(str: string, maxLength: number, suffix?: string): string;
/**
 * Remove all whitespace from a string
 */
declare function removeWhitespace(str: string): string;
/**
 * Generate initials from a name
 */
declare function getInitials(name: string, maxLength?: number): string;
/**
 * Pluralize a word based on count
 */
declare function pluralize(word: string, count: number, plural?: string): string;
/**
 * Slugify a string for URLs
 */
declare function slugify(str: string): string;

export { capitalize, getInitials, pluralize, removeWhitespace, slugify, toCamelCase, toKebabCase, toSnakeCase, toTitleCase, truncate };
