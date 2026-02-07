// lib/credit-validity.ts
// Credit Validity Period Management
// Maps plan IDs to validity periods and provides utility functions

/**
 * Plan validity periods in hours
 * Based on the pricing page validity descriptions:
 * - Free Trial: 72 hours after activation
 * - First Light: 1 week (7 days = 168 hours) after activation
 * - Steady Lens: 1 month (30 days = 720 hours) after activation
 * - Enterprise: 1 month (30 days = 720 hours) after activation
 * - Gift plans: Same as their base plans
 * - Support plans: Need to be defined (using 2 weeks = 336 hours as default)
 */
export const PLAN_VALIDITY_HOURS: Record<string, number> = {
  // Main plans
  'free-trial': 72,
  'first-light': 168, // 7 days
  'steady-lens': 720, // 30 days
  'enterprise': 720, // 30 days
  
  // Gift plans (same as base plans)
  'gift-first-light': 168, // 1 week
  'gift-steady-lens': 720, // 1 month
  'gift-deeper-sense': 1440, // 2 months (60 days) - from pricing page
  
  // Support plans (from pricing page: 2 weeks, 1 month, 2 months)
  'support-gentle-nudge': 336, // 2 weeks
  'support-shift-forward': 720, // 1 month
  'support-deeper-space': 1440, // 2 months
  'support-heart': 0, // Flexible - no expiration
};

/**
 * Get validity period in hours for a plan
 */
export function getPlanValidityHours(planId: string): number {
  // Normalize plan ID (remove prefixes if needed)
  const normalizedPlanId = planId.toLowerCase().trim();
  
  // Direct match
  if (PLAN_VALIDITY_HOURS[normalizedPlanId] !== undefined) {
    return PLAN_VALIDITY_HOURS[normalizedPlanId];
  }
  
  // Try to match with prefix removal
  const planIdWithoutPrefix = normalizedPlanId
    .replace(/^(gift-|support-)/, '');
  
  if (PLAN_VALIDITY_HOURS[planIdWithoutPrefix] !== undefined) {
    return PLAN_VALIDITY_HOURS[planIdWithoutPrefix];
  }
  
  // Default: 1 month (720 hours) for unknown plans
  console.warn(`Unknown plan ID for validity: ${planId}, using default 720 hours (1 month)`);
  return 720;
}

/**
 * Calculate expiration date from purchase date and plan ID
 */
export function calculateExpirationDate(
  purchaseDate: Date,
  planId: string
): Date | null {
  const validityHours = getPlanValidityHours(planId);
  
  // If validity is 0, credits never expire (e.g., support-heart)
  if (validityHours === 0) {
    return null;
  }
  
  const expirationDate = new Date(purchaseDate);
  expirationDate.setHours(expirationDate.getHours() + validityHours);
  
  return expirationDate;
}

/**
 * Check if credits have expired based on expiration date
 */
export function areCreditsExpired(expirationDate: Date | null): boolean {
  if (expirationDate === null) {
    return false; // Never expires
  }
  
  return new Date() > expirationDate;
}

/**
 * Get time remaining until expiration in hours
 */
export function getTimeRemainingHours(expirationDate: Date | null): number | null {
  if (expirationDate === null) {
    return null; // Never expires
  }
  
  const now = new Date();
  const diffMs = expirationDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  return diffHours > 0 ? diffHours : 0;
}

/**
 * Format validity period for display
 */
export function formatValidityPeriod(hours: number): string {
  if (hours === 0) {
    return 'Never expires';
  }
  
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  }
  
  const months = Math.floor(days / 30);
  return `${months} month${months !== 1 ? 's' : ''}`;
}



