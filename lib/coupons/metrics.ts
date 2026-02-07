/**
 * Coupon Metrics Logging
 * 
 * Logs metrics for monitoring and alerting
 */

import { createServiceClient } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export interface CouponMetric {
  metric_type: 'validation' | 'apply' | 'error' | 'limit_exhausted';
  coupon_id?: string | null;
  coupon_code?: string | null;
  status: 'success' | 'failure' | 'error';
  error_type?: string | null;
  correlation_id?: string | null;
  user_id?: string | null;
  ip_address?: string | null;
  response_time_ms?: number | null;
  metadata?: Record<string, any>;
}

/**
 * Log a coupon metric to the database
 */
export async function logCouponMetric(
  metric_type: CouponMetric['metric_type'],
  coupon_id: string | null | undefined,
  coupon_code: string | null | undefined,
  status: CouponMetric['status'],
  error_type: string | null | undefined,
  correlation_id: string | null | undefined,
  user_id: string | null | undefined,
  request: NextRequest,
  response_time_ms?: number | null
): Promise<void> {
  try {
    const supabase = createServiceClient();
    
    // Get IP address
    const ip_address = 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Insert metric (fire and forget - don't block request)
    void (async () => {
      try {
        await supabase.from('coupon_metrics').insert({
          metric_type,
          coupon_id: coupon_id || null,
          coupon_code: coupon_code || null,
          status,
          error_type: error_type || null,
          correlation_id: correlation_id || null,
          user_id: user_id || null,
          ip_address,
          response_time_ms: response_time_ms || null,
          metadata: {}
        });
      } catch (error: unknown) {
        console.error('Failed to log coupon metric:', error);
      }
    })();
  } catch (error) {
    // Silently fail - metrics should not break the request
    console.error('Error logging coupon metric:', error);
  }
}

/**
 * Get metrics for monitoring
 */
export async function getCouponMetrics(
  startDate?: Date,
  endDate?: Date,
  metric_type?: CouponMetric['metric_type']
) {
  const supabase = createServiceClient();
  
  let query = supabase
    .from('coupon_metrics')
    .select('*')
    .order('created_at', { ascending: false });

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }
  if (metric_type) {
    query = query.eq('metric_type', metric_type);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get coupon metrics: ${error.message}`);
  }

  return data;
}

