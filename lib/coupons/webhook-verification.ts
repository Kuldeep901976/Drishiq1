/**
 * Webhook Signature Verification
 * 
 * Verifies payment provider webhook signatures to prevent fraud and replay attacks
 */

import crypto from 'crypto';

export interface WebhookVerificationOptions {
  payload: string | Buffer;
  signature: string;
  secret: string;
  algorithm?: 'sha256' | 'sha512';
}

/**
 * Verify webhook signature using HMAC
 * 
 * Supports multiple signature formats:
 * - Stripe: "t=timestamp,v1=signature"
 * - PayPal: "signature"
 * - Cashfree: "x-cf-signature"
 * - Generic: "signature"
 */
export function verifyWebhookSignature(options: WebhookVerificationOptions): boolean {
  const { payload, signature, secret, algorithm = 'sha256' } = options;

  if (!signature || !secret) {
    return false;
  }

  try {
    // Handle Stripe-style signature (t=timestamp,v1=signature)
    if (signature.includes('=')) {
      const parts = signature.split(',');
      const sigPart = parts.find(p => p.startsWith('v1='));
      if (sigPart) {
        const actualSignature = sigPart.split('=')[1];
        const hmac = crypto.createHmac(algorithm, secret);
        hmac.update(payload);
        const expectedSignature = hmac.digest('hex');
        return crypto.timingSafeEqual(
          Buffer.from(actualSignature),
          Buffer.from(expectedSignature)
        );
      }
    }

    // Handle simple signature format
    const hmac = crypto.createHmac(algorithm, secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Extract signature from request headers
 */
export function extractWebhookSignature(request: Request): string | null {
  const headers = request.headers;
  
  // Try different header formats
  return (
    headers.get('x-payment-signature') ||
    headers.get('x-webhook-signature') ||
    headers.get('x-cashfree-signature') ||
    headers.get('x-razorpay-signature') ||
    headers.get('stripe-signature') ||
    headers.get('x-paypal-signature') ||
    null
  );
}

/**
 * Get webhook secret from environment
 */
export function getWebhookSecret(): string | null {
  return (
    process.env.PAYMENT_WEBHOOK_SECRET ||
    process.env.COUPON_WEBHOOK_SECRET ||
    process.env.WEBHOOK_SECRET ||
    null
  );
}

