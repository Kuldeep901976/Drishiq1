/**
 * Internal Authentication
 * Validates DDSA_INTERNAL_SECRET for internal API endpoints
 */

import { NextRequest } from 'next/server';

export interface InternalAuthResult {
  valid: boolean;
  error?: string;
  agentId?: string;
}

/**
 * Validate internal authentication
 * Checks for DDSA_INTERNAL_SECRET in Authorization header (Bearer token format)
 * Also supports x-internal-key header for backward compatibility
 */
export function validateInternalAuth(request: NextRequest): InternalAuthResult {
  const internalSecret = process.env.DDSA_INTERNAL_SECRET;

  if (!internalSecret) {
    return {
      valid: false,
      error: 'DDSA_INTERNAL_SECRET not configured on server'
    };
  }

  // Try Authorization Bearer token first (preferred)
  const authHeader = request.headers.get('authorization');
  let providedSecret: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedSecret = authHeader.substring(7);
  } else {
    // Fallback to x-internal-key header
    providedSecret = request.headers.get('x-internal-key');
  }

  if (!providedSecret) {
    return {
      valid: false,
      error: 'Missing Authorization header or x-internal-key header'
    };
  }

  if (providedSecret !== internalSecret) {
    return {
      valid: false,
      error: 'Invalid internal secret'
    };
  }

  // Extract agent ID if provided
  const agentId = request.headers.get('x-agent-id') || undefined;

  return {
    valid: true,
    agentId
  };
}




