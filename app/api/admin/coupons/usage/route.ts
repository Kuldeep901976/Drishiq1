import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { withAuth } from '@/lib/auth-middleware';

/**
 * GET /api/admin/coupons/usage
 * Get coupon usage records with filters
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const coupon_id = searchParams.get('coupon_id');
      const user_id = searchParams.get('user_id');
      const start_date = searchParams.get('start_date');
      const end_date = searchParams.get('end_date');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = (page - 1) * limit;

      const supabase = createServiceClient();

      // Build query
      let query = supabase
        .from('coupon_usage')
        .select(`
          *,
          coupons:coupon_id (
            id,
            code,
            description,
            discount_type,
            discount_value
          ),
          users:user_id (
            id,
            email,
            first_name,
            last_name
          )
        `, { count: 'exact' })
        .order('used_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (coupon_id) {
        query = query.eq('coupon_id', coupon_id);
      }
      if (user_id) {
        query = query.eq('user_id', user_id);
      }
      if (start_date) {
        query = query.gte('used_at', start_date);
      }
      if (end_date) {
        query = query.lte('used_at', end_date);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching coupon usage:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        usage: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      });
    } catch (error: any) {
      console.error('Error in GET /api/admin/coupons/usage:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }, {
    requireAdmin: true
  });
}

/**
 * GET /api/admin/coupons/usage/stats
 * Get coupon usage statistics
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const { coupon_id, start_date, end_date } = body;

      const supabase = createServiceClient();

      const { data: stats, error } = await supabase.rpc('get_coupon_usage_stats', {
        p_coupon_id: coupon_id || null,
        p_start_date: start_date || null,
        p_end_date: end_date || null
      });

      if (error) {
        console.error('Error fetching coupon stats:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        stats: stats || []
      });
    } catch (error: any) {
      console.error('Error in POST /api/admin/coupons/usage/stats:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }, {
    requireAdmin: true
  });
}

