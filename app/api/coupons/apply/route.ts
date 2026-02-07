import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { normalizeCouponCode } from '@/lib/coupons/coupon-code-generator';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { verifyWebhookSignature, extractWebhookSignature, getWebhookSecret } from '@/lib/coupons/webhook-verification';
import { logCouponMetric } from '@/lib/coupons/metrics';
import { randomUUID } from 'crypto';

/**
 * POST /api/coupons/apply
 * Apply a coupon to an order (records usage)
 * This should be called after payment success to record the coupon usage
 */
export async function POST(request: NextRequest) {
  return withRateLimit(
    request,
    {
      maxRequests: 20, // 20 applications per window
      windowMs: 60000,
      keyPrefix: 'coupon:apply'
    },
    async (req) => {
      try {
        // Generate correlation ID for tracing
        const correlationId = req.headers.get('x-correlation-id') || randomUUID();
        
        // Get raw body for signature verification
        const rawBody = await req.text();
        const body = JSON.parse(rawBody);
        
        const {
          coupon_code,
          user_id,
          order_id,
          transaction_id,
          original_amount,
          discount_amount,
          final_amount,
          guest_email,
          guest_name,
          metadata = {}
        } = body;

        // WEBHOOK SIGNATURE VERIFICATION (if secret is configured)
        const webhookSecret = getWebhookSecret();
        if (webhookSecret) {
          const signature = extractWebhookSignature(req);
          if (!signature) {
            // Log metric
            await logCouponMetric('apply', null, null, 'failure', 'missing_signature', correlationId, user_id, req);
            
            return NextResponse.json(
              { success: false, error: 'Missing webhook signature' },
              { status: 401 }
            );
          }

          if (!verifyWebhookSignature({
            payload: rawBody,
            signature,
            secret: webhookSecret
          })) {
            // Log metric
            await logCouponMetric('apply', null, null, 'failure', 'invalid_signature', correlationId, user_id, req);
            
            return NextResponse.json(
              { success: false, error: 'Invalid webhook signature' },
              { status: 401 }
            );
          }
        }

        // Validate required fields
        if (!coupon_code || !original_amount || !discount_amount || !final_amount) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields' },
            { status: 400 }
          );
        }

        const normalizedCode = normalizeCouponCode(coupon_code);
        const supabase = createServiceClient();

        // Get coupon ID
        const { data: coupon, error: couponError } = await supabase
          .from('coupons')
          .select('id, code')
          .eq('code', normalizedCode)
          .eq('status', 'active')
          .single();

        if (couponError || !coupon) {
          return NextResponse.json(
            { success: false, error: 'Invalid or inactive coupon' },
            { status: 404 }
          );
        }

        // Record coupon usage (function handles race conditions and idempotency)
        const startTime = Date.now();
        const { data: usageId, error: usageError } = await supabase.rpc('record_coupon_usage', {
          p_coupon_id: coupon.id,
          p_original_amount: parseFloat(original_amount),
          p_discount_amount: parseFloat(discount_amount),
          p_final_amount: parseFloat(final_amount),
          p_user_id: user_id || null,
          p_order_id: order_id || null,
          p_transaction_id: transaction_id || null,
          p_guest_email: guest_email || null,
          p_guest_name: guest_name || null,
          p_metadata: {
            ...metadata,
            correlation_id: correlationId
          }
        });
        const responseTime = Date.now() - startTime;

        if (usageError) {
          console.error('Error recording coupon usage:', usageError);
          
          // Log error metric
          await logCouponMetric(
            'apply',
            coupon.id,
            coupon.code,
            'failure',
            usageError.message.includes('limit') ? 'limit_reached' : 'db_error',
            correlationId,
            user_id,
            req,
            responseTime
          );
          
          // Check if it's a limit error
          if (usageError.message.includes('limit reached')) {
            return NextResponse.json(
              { success: false, error: usageError.message },
              { status: 409 }
            );
          }

          return NextResponse.json(
            { success: false, error: 'Failed to record coupon usage' },
            { status: 500 }
          );
        }

        // Log success metric
        await logCouponMetric(
          'apply',
          coupon.id,
          coupon.code,
          'success',
          null,
          correlationId,
          user_id,
          req,
          responseTime
        );

        return NextResponse.json({
          success: true,
          usage_id: usageId,
          correlation_id: correlationId,
          message: 'Coupon applied successfully'
        }, {
          headers: {
            'X-Correlation-ID': correlationId
          }
        });
      } catch (error: any) {
        console.error('Error in POST /api/coupons/apply:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Internal server error' },
          { status: 500 }
        );
      }
    }
  );
}

