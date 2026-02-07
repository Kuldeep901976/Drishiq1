// lib/affiliate-utils.ts
// Utility functions for affiliate system

import { cookies } from 'next/headers';

export interface AffiliateCookie {
  refCode: string;
  affiliateId: string;
  timestamp: number;
  expiresAt: number;
}

/**
 * Get affiliate cookie name
 */
export function getAffiliateCookieName(): string {
  return 'affiliate_ref';
}

/**
 * Parse affiliate cookie value
 */
export function parseAffiliateCookie(cookieValue: string): AffiliateCookie | null {
  try {
    return JSON.parse(cookieValue) as AffiliateCookie;
  } catch {
    return null;
  }
}

/**
 * Create affiliate cookie value
 */
export function createAffiliateCookie(
  refCode: string,
  affiliateId: string,
  durationDays: number = 30
): AffiliateCookie {
  const now = Date.now();
  const expiresAt = now + (durationDays * 24 * 60 * 60 * 1000);
  
  return {
    refCode,
    affiliateId,
    timestamp: now,
    expiresAt
  };
}

/**
 * Check if affiliate cookie is valid (not expired)
 */
export function isAffiliateCookieValid(cookie: AffiliateCookie): boolean {
  return Date.now() < cookie.expiresAt;
}

/**
 * Get device fingerprint from request headers
 * Simple implementation - can be enhanced with more sophisticated fingerprinting
 */
export function getDeviceFingerprint(headers: Headers): string {
  const userAgent = headers.get('user-agent') || '';
  const acceptLanguage = headers.get('accept-language') || '';
  const acceptEncoding = headers.get('accept-encoding') || '';
  
  // Simple fingerprint - in production, use a library like fingerprintjs
  const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  
  // Hash it (simple implementation)
  return Buffer.from(fingerprint).toString('base64').substring(0, 32);
}

/**
 * Extract UTM parameters from URL
 */
export function extractUTMParams(url: URL): {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  [key: string]: string | undefined;
} {
  const params: Record<string, string> = {};
  
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
    const value = url.searchParams.get(key);
    if (value) {
      params[key] = value;
    }
  });
  
  return params;
}

/**
 * Calculate earnings based on affiliate payout type and rate
 */
export function calculateEarnings(
  orderTotal: number,
  payoutType: 'percentage' | 'fixed',
  payoutRate: number,
  eventType: 'signup' | 'purchase' | 'retention' | 'refund' = 'purchase'
): number {
  let amount: number;
  
  if (payoutType === 'percentage') {
    amount = orderTotal * (payoutRate / 100);
    
    // Adjust for event type (signups might have different rate)
    if (eventType === 'signup') {
      amount = amount * 0.5; // Example: 50% of purchase rate for signups
    }
  } else {
    amount = payoutRate; // Fixed amount
  }
  
  return Math.round(amount * 100) / 100; // Round to 2 decimal places
}

/**
 * Check if email domain matches (for self-referral detection)
 */
export function checkSelfReferral(userEmail: string, affiliateEmail: string | null): boolean {
  if (!affiliateEmail) return false;
  
  const userDomain = userEmail.split('@')[1]?.toLowerCase();
  const affiliateDomain = affiliateEmail.split('@')[1]?.toLowerCase();
  
  return userDomain === affiliateDomain;
}

/**
 * Format date for display in dashboard
 */
export function formatDateTime(date: Date | string, timezone: string = 'UTC'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Format date as ISO string for CSV export
 */
export function formatISO(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}



