import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { withAuth } from '@/lib/auth-middleware';
import { generateUniqueCouponCode, normalizeCouponCode } from '@/lib/coupons/coupon-code-generator';

/**
 * GET /api/admin/coupons
 * List all coupons with optional filters
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status');
      const campaign = searchParams.get('campaign');
      const search = searchParams.get('search');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = (page - 1) * limit;

      const supabase = createServiceClient();

      // Build query
      let query = supabase
        .from('coupons')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }
      if (campaign) {
        query = query.eq('campaign_tag', campaign);
      }
      if (search) {
        query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching coupons:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        coupons: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      });
    } catch (error: any) {
      console.error('Error in GET /api/admin/coupons:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }, {
    requireAdmin: true,
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
      keyPrefix: 'admin:coupons:list'
    }
  });
}

/**
 * POST /api/admin/coupons
 * Create a new coupon
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const {
        code,
        description,
        discount_type,
        discount_value,
        minimum_order_amount,
        maximum_discount_amount,
        global_usage_limit,
        per_user_usage_limit = 1,
        valid_from,
        valid_until,
        status = 'active',
        campaign_tag,
        visibility = 'public',
        rules = {},
        metadata = {},
        auto_generate_code = false,
        code_options = {}
      } = body;

      // Validate required fields
      if (!discount_type || !discount_value || !valid_from || !valid_until) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Validate discount type
      if (!['percentage', 'fixed_amount'].includes(discount_type)) {
        return NextResponse.json(
          { success: false, error: 'Invalid discount_type. Must be "percentage" or "fixed_amount"' },
          { status: 400 }
        );
      }

      // Validate percentage discount
      if (discount_type === 'percentage' && (discount_value < 0 || discount_value > 100)) {
        return NextResponse.json(
          { success: false, error: 'Percentage discount must be between 0 and 100' },
          { status: 400 }
        );
      }

      // Validate dates
      const validFromDate = new Date(valid_from);
      const validUntilDate = new Date(valid_until);
      if (validUntilDate <= validFromDate) {
        return NextResponse.json(
          { success: false, error: 'valid_until must be after valid_from' },
          { status: 400 }
        );
      }

      // Generate or validate coupon code
      let finalCode: string;
      if (auto_generate_code) {
        finalCode = await generateUniqueCouponCode(code_options);
      } else {
        if (!code) {
          return NextResponse.json(
            { success: false, error: 'Coupon code is required or set auto_generate_code to true' },
            { status: 400 }
          );
        }
        finalCode = normalizeCouponCode(code);

        // Check if code already exists
        const supabase = createServiceClient();
        const { data: existing } = await supabase
          .from('coupons')
          .select('id')
          .eq('code', finalCode)
          .maybeSingle();

        if (existing) {
          return NextResponse.json(
            { success: false, error: 'Coupon code already exists' },
            { status: 409 }
          );
        }
      }

      // Insert coupon
      const supabase = createServiceClient();
      const { data: newCoupon, error } = await supabase
        .from('coupons')
        .insert({
          code: finalCode,
          description,
          discount_type,
          discount_value: parseFloat(discount_value),
          minimum_order_amount: minimum_order_amount ? parseFloat(minimum_order_amount) : null,
          maximum_discount_amount: maximum_discount_amount ? parseFloat(maximum_discount_amount) : null,
          global_usage_limit: global_usage_limit ? parseInt(global_usage_limit) : null,
          per_user_usage_limit: parseInt(per_user_usage_limit),
          valid_from: validFromDate.toISOString(),
          valid_until: validUntilDate.toISOString(),
          status,
          campaign_tag: campaign_tag || null,
          visibility,
          rules,
          metadata,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating coupon:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        coupon: newCoupon
      }, { status: 201 });
    } catch (error: any) {
      console.error('Error in POST /api/admin/coupons:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }, {
    requireAdmin: true,
    rateLimit: {
      maxRequests: 20,
      windowMs: 60000,
      keyPrefix: 'admin:coupons:create'
    }
  });
}

