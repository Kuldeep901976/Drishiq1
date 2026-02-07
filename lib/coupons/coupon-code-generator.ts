/**
 * Coupon Code Generator
 * 
 * Generates unique, hard-to-guess alphanumeric coupon codes
 * with optional prefix/suffix patterns for campaigns
 */

import { createServiceClient } from '@/lib/supabase';

export interface CouponCodeOptions {
  prefix?: string;
  suffix?: string;
  length?: number; // Length of random part (default: 8)
  excludeChars?: string; // Characters to exclude (e.g., "0O1Il" to avoid confusion)
}

const DEFAULT_LENGTH = 8;
const DEFAULT_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes 0, O, 1, I to avoid confusion

/**
 * Generate a random coupon code
 */
export function generateCouponCode(options: CouponCodeOptions = {}): string {
  const {
    prefix = '',
    suffix = '',
    length = DEFAULT_LENGTH,
    excludeChars = '0O1Il'
  } = options;

  // Build charset excluding specified characters
  let charset = DEFAULT_CHARSET;
  if (excludeChars) {
    charset = DEFAULT_CHARSET.split('')
      .filter(char => !excludeChars.includes(char))
      .join('');
  }

  // Generate random part
  const randomPart = Array.from({ length }, () => {
    const randomIndex = Math.floor(Math.random() * charset.length);
    return charset[randomIndex];
  }).join('');

  // Combine prefix + random + suffix
  const code = `${prefix}${randomPart}${suffix}`.toUpperCase();

  return code;
}

/**
 * Generate a unique coupon code that doesn't exist in the database
 * 
 * @param options - Coupon code generation options
 * @param maxAttempts - Maximum attempts to find a unique code (default: 10)
 * @returns Promise<string> - Unique coupon code
 */
export async function generateUniqueCouponCode(
  options: CouponCodeOptions = {},
  maxAttempts: number = 10
): Promise<string> {
  const supabase = createServiceClient();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateCouponCode(options);

    // Check if code already exists
    const { data, error } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', code)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (which is what we want)
      throw new Error(`Database error checking coupon code: ${error.message}`);
    }

    // If no data found, code is unique
    if (!data) {
      return code;
    }

    // Code exists, try again
    console.warn(`Coupon code ${code} already exists, generating new one...`);
  }

  throw new Error(
    `Failed to generate unique coupon code after ${maxAttempts} attempts. ` +
    `Try increasing the code length or changing the prefix/suffix.`
  );
}

/**
 * Validate coupon code format
 * 
 * @param code - Coupon code to validate
 * @returns boolean - True if format is valid
 */
export function validateCouponCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }

  // Remove whitespace and convert to uppercase
  const normalizedCode = code.trim().toUpperCase();

  // Check length (between 4 and 50 characters)
  if (normalizedCode.length < 4 || normalizedCode.length > 50) {
    return false;
  }

  // Check for valid alphanumeric characters (and hyphens/underscores for readability)
  const validPattern = /^[A-Z0-9_-]+$/;
  if (!validPattern.test(normalizedCode)) {
    return false;
  }

  return true;
}

/**
 * Normalize coupon code (uppercase, trim)
 */
export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

