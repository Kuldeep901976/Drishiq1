import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { withAuth } from '@/lib/auth-middleware';
import { normalizeCouponCode } from '@/lib/coupons/coupon-code-generator';

/**
 * GET /api/admin/coupons/[id]
 * Get a single coupon by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Coupon not found' },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      // Get usage statistics
      const { data: stats } = await supabase.rpc('get_coupon_usage_stats', {
        p_coupon_id: params.id
      });

      return NextResponse.json({
        success: true,
        coupon: data,
        stats: stats?.[0] || null
      });
    } catch (error: any) {
      console.error('Error in GET /api/admin/coupons/[id]:', error);
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
 * PUT /api/admin/coupons/[id]
 * Update a coupon
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        per_user_usage_limit,
        valid_from,
        valid_until,
        status,
        campaign_tag,
        visibility,
        rules,
        metadata
      } = body;

      const supabase = createServiceClient();

      // Check if coupon exists
      const { data: existing } = await supabase
        .from('coupons')
        .select('id, code')
        .eq('id', params.id)
        .single();

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Coupon not found' },
          { status: 404 }
        );
      }

      // Build update object
      const updateData: any = {};

      if (code !== undefined) {
        const normalizedCode = normalizeCouponCode(code);
        // Check if new code conflicts with existing coupon
        if (normalizedCode !== existing.code) {
          const { data: conflict } = await supabase
            .from('coupons')
            .select('id')
            .eq('code', normalizedCode)
            .neq('id', params.id)
            .maybeSingle();

          if (conflict) {
            return NextResponse.json(
              { success: false, error: 'Coupon code already exists' },
              { status: 409 }
            );
          }
          updateData.code = normalizedCode;
        }
      }

      if (description !== undefined) updateData.description = description;
      if (discount_type !== undefined) updateData.discount_type = discount_type;
      if (discount_value !== undefined) updateData.discount_value = parseFloat(discount_value);
      if (minimum_order_amount !== undefined) {
        updateData.minimum_order_amount = minimum_order_amount ? parseFloat(minimum_order_amount) : null;
      }
      if (maximum_discount_amount !== undefined) {
        updateData.maximum_discount_amount = maximum_discount_amount ? parseFloat(maximum_discount_amount) : null;
      }
      if (global_usage_limit !== undefined) {
        updateData.global_usage_limit = global_usage_limit ? parseInt(global_usage_limit) : null;
      }
      if (per_user_usage_limit !== undefined) {
        updateData.per_user_usage_limit = parseInt(per_user_usage_limit);
      }
      if (valid_from !== undefined) updateData.valid_from = new Date(valid_from).toISOString();
      if (valid_until !== undefined) updateData.valid_until = new Date(valid_until).toISOString();
      if (status !== undefined) updateData.status = status;
      if (campaign_tag !== undefined) updateData.campaign_tag = campaign_tag || null;
      if (visibility !== undefined) updateData.visibility = visibility;
      if (rules !== undefined) updateData.rules = rules;
      if (metadata !== undefined) updateData.metadata = metadata;

      // Validate dates if both are provided
      if (updateData.valid_from && updateData.valid_until) {
        const fromDate = new Date(updateData.valid_from);
        const untilDate = new Date(updateData.valid_until);
        if (untilDate <= fromDate) {
          return NextResponse.json(
            { success: false, error: 'valid_until must be after valid_from' },
            { status: 400 }
          );
        }
      }

      // Update coupon
      const { data: updated, error } = await supabase
        .from('coupons')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating coupon:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        coupon: updated
      });
    } catch (error: any) {
      console.error('Error in PUT /api/admin/coupons/[id]:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }, {
    requireAdmin: true,
    rateLimit: {
      maxRequests: 30,
      windowMs: 60000,
      keyPrefix: 'admin:coupons:update'
    }
  });
}

/**
 * DELETE /api/admin/coupons/[id]
 * Delete or archive a coupon
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const hardDelete = searchParams.get('hard') === 'true';

      const supabase = createServiceClient();

      if (hardDelete) {
        // Hard delete (only if no usage exists)
        const { data: usage } = await supabase
          .from('coupon_usage')
          .select('id')
          .eq('coupon_id', params.id)
          .limit(1)
          .maybeSingle();

        if (usage) {
          return NextResponse.json(
            { success: false, error: 'Cannot delete coupon with usage history. Archive it instead.' },
            { status: 400 }
          );
        }

        const { error } = await supabase
          .from('coupons')
          .delete()
          .eq('id', params.id);

        if (error) {
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
          );
        }
      } else {
        // Soft delete (archive)
        const { error } = await supabase
          .from('coupons')
          .update({ status: 'archived' })
          .eq('id', params.id);

        if (error) {
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: hardDelete ? 'Coupon deleted' : 'Coupon archived'
      });
    } catch (error: any) {
      console.error('Error in DELETE /api/admin/coupons/[id]:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }, {
    requireAdmin: true,
    rateLimit: {
      maxRequests: 10,
      windowMs: 60000,
      keyPrefix: 'admin:coupons:delete'
    }
  });
}

