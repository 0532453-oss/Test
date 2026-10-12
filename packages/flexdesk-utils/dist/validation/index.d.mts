/**
 * Validation utility functions
 */
/**
 * Check if a value is a valid email
 */
declare function isValidEmail(email: string): boolean;
/**
 * Check if a value is a valid phone number (basic check)
 */
declare function isValidPhone(phone: string): boolean;
/**
 * Check if a value is a valid URL
 */
declare function isValidUrl(url: string): boolean;
/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
declare function isEmpty(value: unknown): boolean;
/**
 * Check if a value is a valid UUID
 */
declare function isValidUuid(uuid: string): boolean;
/**
 * Check if a value is a valid ZIP code (US format)
 */
declare function isValidZipCode(zip: string): boolean;
/**
 * Check if a string is within length bounds
 */
declare function isValidLength(value: string, min: number, max: number): boolean;
/**
 * Check if a number is within range
 */
declare function isInRange(value: number, min: number, max: number): boolean;

export { isEmpty, isInRange, isValidEmail, isValidLength, isValidPhone, isValidUrl, isValidUuid, isValidZipCode };
