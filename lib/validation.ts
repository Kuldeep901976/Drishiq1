/**
 * Shared validation helpers for forms (request, profile, supporter, etc.)
 * Use these instead of duplicating regex/checks across pages.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_REGEX = /^[0-9]{6,15}$/;

export function isValidEmail(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0 && EMAIL_REGEX.test(value.trim());
}

export function isValidPhoneDigits(value: string): boolean {
  const digits = value.replace(/\s+/g, '').replace(/^\+/, '');
  return PHONE_DIGITS_REGEX.test(digits);
}

export function isRequired(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateEmail(value: string): { valid: boolean; message?: string } {
  if (!isRequired(value)) return { valid: false, message: 'Email is required' };
  if (!isValidEmail(value)) return { valid: false, message: 'Please enter a valid email' };
  return { valid: true };
}

export function validatePhone(value: string): { valid: boolean; message?: string } {
  if (!isRequired(value)) return { valid: false, message: 'Phone is required' };
  if (!isValidPhoneDigits(value)) return { valid: false, message: 'Please enter a valid phone number (6–15 digits)' };
  return { valid: true };
}
