import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { normalizeCouponCode, validateCouponCodeFormat } from '@/lib/coupons/coupon-code-generator';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { logCouponMetric } from '@/lib/coupons/metrics';
import { randomUUID } from 'crypto';

/**
 * POST /api/coupons/validate
 * Validate a coupon code (public endpoint with rate limiting)
 */
export async function POST(request: NextRequest) {
  return withRateLimit(
    request,
    {
      maxRequests: 10, // 10 validation attempts per window
      windowMs: 60000, // 1 minute
      keyPrefix: 'coupon:validate'
    },
    async (req) => {
      try {
        // Generate correlation ID for tracing
        const correlationId = req.headers.get('x-correlation-id') || randomUUID();
        const startTime = Date.now();
        
        const body = await req.json();
        const { code, user_id, order_amount } = body;

        // Validate input
        if (!code || typeof code !== 'string') {
          return NextResponse.json(
            { success: false, error: 'Coupon code is required' },
            { status: 400 }
          );
        }

        // Validate format
        if (!validateCouponCodeFormat(code)) {
          return NextResponse.json(
            { success: false, error: 'Invalid coupon code format' },
            { status: 400 }
          );
        }

        const normalizedCode = normalizeCouponCode(code);
        const supabase = createServiceClient();

        // Get client IP for rate limiting tracking
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                        req.headers.get('x-real-ip') ||
                        'unknown';

        // Validate coupon using database function
        const { data: validationResult, error } = await supabase.rpc('validate_coupon', {
          p_coupon_code: normalizedCode,
          p_user_id: user_id || null,
          p_order_amount: order_amount ? parseFloat(order_amount) : null
        });

        if (error) {
          console.error('Error validating coupon:', error);
          return NextResponse.json(
            { success: false, error: 'Failed to validate coupon' },
            { status: 500 }
          );
        }

        const result = validationResult?.[0];

        if (!result) {
          return NextResponse.json(
            { success: false, error: 'Invalid coupon code' },
            { status: 404 }
          );
        }

        const responseTime = Date.now() - startTime;

        // Log validation attempt (for rate limiting and analytics)
        await supabase.from('coupon_validation_attempts').insert({
          ip_address: clientIp,
          user_id: user_id || null,
          coupon_code: normalizedCode,
          is_valid: result.is_valid,
          validation_result: result.validation_message,
          metadata: { correlation_id: correlationId }
        });

        // Log metric
        await logCouponMetric(
          'validation',
          result.coupon_id || null,
          normalizedCode,
          result.is_valid ? 'success' : 'failure',
          result.is_valid ? null : result.validation_message || 'invalid',
          correlationId,
          user_id || null,
          req,
          responseTime
        );

        if (!result.is_valid) {
          return NextResponse.json({
            success: false,
            error: result.validation_message || 'Coupon is not valid',
            coupon_id: result.coupon_id,
            correlation_id: correlationId
          }, { 
            status: 400,
            headers: {
              'X-Correlation-ID': correlationId
            }
          });
        }

        // Return validation result
        return NextResponse.json({
          success: true,
          valid: true,
          coupon: {
            id: result.coupon_id,
            code: normalizedCode,
            discount_type: result.discount_type,
            discount_value: parseFloat(result.discount_value),
            minimum_order_amount: result.minimum_order_amount ? parseFloat(result.minimum_order_amount) : null,
            maximum_discount_amount: result.maximum_discount_amount ? parseFloat(result.maximum_discount_amount) : null,
            calculated_discount: result.calculated_discount ? parseFloat(result.calculated_discount) : null,
            final_amount: result.final_amount ? parseFloat(result.final_amount) : null
          },
          message: result.validation_message,
          correlation_id: correlationId
        }, {
          headers: {
            'X-Correlation-ID': correlationId
          }
        });
      } catch (error: any) {
        console.error('Error in POST /api/coupons/validate:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Internal server error' },
          { status: 500 }
        );
      }
    }
  );
}

