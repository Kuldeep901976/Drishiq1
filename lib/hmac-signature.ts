/**
 * HMAC Signature
 * Generates and validates signed sub-thread IDs for ephemeral access
 */

import { createHmac, randomBytes } from 'crypto';

export interface SignedSubId {
  subId: string;
  signature: string;
  expiresAt: string;
  timestamp: string;
  nonce: string;
}

/**
 * Generate signed sub-thread ID
 * Creates an ephemeral signed identifier for frontend use
 */
export function generateSignedSubId(
  parentThreadId: string,
  subThreadId: string,
  ttlSeconds: number = 600 // Default 10 minutes
): SignedSubId {
  const secret = process.env.DDSA_INTERNAL_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default-secret';
  const timestamp = Date.now().toString();
  const nonce = randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  // Create payload
  const payload = {
    parent_thread_id: parentThreadId,
    sub_thread_id: subThreadId,
    timestamp,
    nonce,
    expires_at: expiresAt
  };

  // Generate signature
  const message = JSON.stringify(payload);
  const signature = createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  // Create signed sub-id (base64 encoded payload + signature)
  const signedPayload = Buffer.from(JSON.stringify({
    ...payload,
    signature
  })).toString('base64');

  return {
    subId: signedPayload,
    signature,
    expiresAt,
    timestamp,
    nonce
  };
}

/**
 * Validate signed sub-thread ID
 * Verifies signature and expiration
 */
export function validateSignedSubId(signedSubId: string): {
  valid: boolean;
  payload?: any;
  error?: string;
} {
  try {
    const secret = process.env.DDSA_INTERNAL_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default-secret';
    
    // Decode payload
    const decoded = Buffer.from(signedSubId, 'base64').toString('utf-8');
    const payload = JSON.parse(decoded);

    // Check expiration
    if (payload.expires_at) {
      const expiresAt = new Date(payload.expires_at);
      if (expiresAt < new Date()) {
        return {
          valid: false,
          error: 'Signed sub-id has expired'
        };
      }
    }

    // Verify signature
    const { signature, ...payloadWithoutSig } = payload;
    const message = JSON.stringify(payloadWithoutSig);
    const expectedSignature = createHmac('sha256', secret)
      .update(message)
      .digest('hex');

    if (signature !== expectedSignature) {
      return {
        valid: false,
        error: 'Invalid signature'
      };
    }

    return {
      valid: true,
      payload: payloadWithoutSig
    };
  } catch (error: any) {
    return {
      valid: false,
      error: `Validation error: ${error.message}`
    };
  }
}




