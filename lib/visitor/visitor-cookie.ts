/**
 * Client-safe helper to read visitor id from cookie.
 * Used when saving language preference so next visit has visitors.language set.
 */

const VISITOR_ID_COOKIE = 'drishiq_visitor_id';

export function getVisitorIdFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + VISITOR_ID_COOKIE + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}
