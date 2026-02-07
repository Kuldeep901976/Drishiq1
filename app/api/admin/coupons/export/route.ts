import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { withAuth } from '@/lib/auth-middleware';

/**
 * GET /api/admin/coupons/export
 * Export coupon usage data to CSV
 * Requires admin role
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // Check if user has export permission (admin only)
      const supabase = createServiceClient();
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions. Admin role required for exports.' },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(req.url);
      const coupon_id = searchParams.get('coupon_id');
      const start_date = searchParams.get('start_date');
      const end_date = searchParams.get('end_date');
      const format = searchParams.get('format') || 'csv';

      // Build query
      let query = supabase
        .from('coupon_usage')
        .select(`
          *,
          coupons:coupon_id (
            code,
            description
          ),
          users:user_id (
            email,
            first_name,
            last_name
          )
        `)
        .order('used_at', { ascending: false });

      // Apply filters
      if (coupon_id) {
        query = query.eq('coupon_id', coupon_id);
      }
      if (start_date) {
        query = query.gte('used_at', start_date);
      }
      if (end_date) {
        query = query.lte('used_at', end_date);
      }

      const { data: usageRecords, error } = await query;

      if (error) {
        console.error('Error fetching usage records:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      // Log export action for audit
      await supabase.from('coupon_metrics').insert({
        metric_type: 'export',
        status: 'success',
        user_id: user.id,
        metadata: {
          export_type: 'coupon_usage',
          record_count: usageRecords?.length || 0,
          filters: {
            coupon_id,
            start_date,
            end_date
          }
        }
      });

      // Generate CSV
      if (format === 'csv') {
        const headers = [
          'Date',
          'Coupon Code',
          'Coupon Description',
          'User Email',
          'User Name',
          'Order ID',
          'Transaction ID',
          'Original Amount',
          'Discount Amount',
          'Final Amount',
          'Refunded',
          'Refund Date',
          'Correlation ID'
        ];

        const rows = (usageRecords || []).map(record => [
          new Date(record.used_at).toISOString(),
          record.coupons?.code || '',
          record.coupons?.description || '',
          record.users?.email || record.guest_email || 'Guest',
          record.users ? `${record.users.first_name || ''} ${record.users.last_name || ''}`.trim() : record.guest_name || '',
          record.order_id || '',
          record.transaction_id || '',
          record.original_amount?.toFixed(2) || '0.00',
          record.discount_amount?.toFixed(2) || '0.00',
          record.final_amount?.toFixed(2) || '0.00',
          record.refunded_at ? 'Yes' : 'No',
          record.refunded_at ? new Date(record.refunded_at).toISOString() : '',
          record.correlation_id || ''
        ]);

        const csv = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="coupon-usage-export-${new Date().toISOString().split('T')[0]}.csv"`,
            'X-Exported-By': user.id,
            'X-Export-Date': new Date().toISOString(),
            'X-Record-Count': String(usageRecords?.length || 0)
          }
        });
      }

      // JSON format
      return NextResponse.json({
        success: true,
        data: usageRecords,
        exported_at: new Date().toISOString(),
        exported_by: user.id,
        record_count: usageRecords?.length || 0
      });
    } catch (error: any) {
      console.error('Error in GET /api/admin/coupons/export:', error);
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
      keyPrefix: 'admin:coupons:export'
    }
  });
}

