/**
 * Ad Utilities
 * Helper functions for ad management
 */

/**
 * Generate tracking token for ad events
 */
export function generateTrackingToken(lineItemId: string, creativeId: string, anonId: string): string {
  const payload = {
    li: lineItemId,
    cr: creativeId,
    an: anonId,
    ts: Date.now(),
  };
  return btoa(JSON.stringify(payload));
}

/**
 * Parse tracking token
 */
export function parseTrackingToken(token: string): {
  lineItemId: string;
  creativeId: string;
  anonId: string;
  timestamp: number;
} | null {
  try {
    const payload = JSON.parse(atob(token));
    return {
      lineItemId: payload.li,
      creativeId: payload.cr,
      anonId: payload.an,
      timestamp: payload.ts,
    };
  } catch {
    return null;
  }
}

/**
 * Sanitize HTML for ad creatives
 */
export function sanitizeAdHtml(html: string): string {
  // Basic sanitization - in production, use a proper HTML sanitizer like DOMPurify
  // This is a simplified version
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Validate creative dimensions
 */
export function validateCreativeDimensions(
  width: number,
  height: number,
  allowedSizes?: Array<{ width: number; height: number }>
): boolean {
  if (!allowedSizes || allowedSizes.length === 0) {
    return true; // No restrictions
  }

  return allowedSizes.some(
    (size) => size.width === width && size.height === height
  );
}

/**
 * Format ad size string
 */
export function formatAdSize(width: number, height: number): string {
  return `${width}x${height}`;
}

/**
 * Parse ad size string
 */
export function parseAdSize(size: string): { width: number; height: number } | null {
  const parts = size.split('x');
  if (parts.length !== 2) return null;

  const width = parseInt(parts[0], 10);
  const height = parseInt(parts[1], 10);

  if (isNaN(width) || isNaN(height)) return null;

  return { width, height };
}

/**
 * Calculate CTR (Click-Through Rate)
 */
export function calculateCTR(impressions: number, clicks: number): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
}

/**
 * Calculate eCPM (Effective Cost Per Mille)
 */
export function calculateECPM(revenue: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (revenue / impressions) * 1000;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

