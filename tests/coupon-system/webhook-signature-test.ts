/**
 * Webhook Signature Verification Test
 * 
 * Tests that webhook signature verification works correctly
 * Run with: npm test or jest
 */

import { verifyWebhookSignature, extractWebhookSignature } from '@/lib/coupons/webhook-verification';
import { NextRequest } from 'next/server';

describe('Webhook Signature Verification', () => {
  const secret = 'test-secret-key-12345';
  const payload = JSON.stringify({ coupon_code: 'TEST2024', order_id: 'ORDER123' });

  test('should verify valid signature', () => {
    // Generate valid signature
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const validSignature = hmac.digest('hex');

    const result = verifyWebhookSignature({
      payload,
      signature: validSignature,
      secret
    });

    expect(result).toBe(true);
  });

  test('should reject invalid signature', () => {
    const invalidSignature = 'invalid-signature-12345';

    const result = verifyWebhookSignature({
      payload,
      signature: invalidSignature,
      secret
    });

    expect(result).toBe(false);
  });

  test('should reject missing signature', () => {
    const result = verifyWebhookSignature({
      payload,
      signature: '',
      secret
    });

    expect(result).toBe(false);
  });

  test('should handle Stripe-style signature format', () => {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const sig = hmac.digest('hex');
    const stripeSignature = `t=${Date.now()},v1=${sig}`;

    const result = verifyWebhookSignature({
      payload,
      signature: stripeSignature,
      secret
    });

    expect(result).toBe(true);
  });

  test('should extract signature from request headers', () => {
    const headers = new Headers();
    headers.set('x-payment-signature', 'test-signature');

    const mockRequest = {
      headers: headers
    } as unknown as NextRequest;

    const signature = extractWebhookSignature(mockRequest);
    expect(signature).toBe('test-signature');
  });

  test('should try multiple header formats', () => {
    const headers = new Headers();
    headers.set('x-cashfree-signature', 'cashfree-sig');

    const mockRequest = {
      headers: headers
    } as unknown as NextRequest;

    const signature = extractWebhookSignature(mockRequest);
    expect(signature).toBe('cashfree-sig');
  });
});

