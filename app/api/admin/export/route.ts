// app/api/admin/export/route.ts
// Export earnings and payouts to CSV

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { formatISO } from '@/lib/affiliate-utils';

async function checkAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  return user?.role === 'admin';
}

/**
 * GET /api/admin/export?type=earnings|payouts
 * Export data to CSV
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }
    
    const cookieStore = cookies();
    const { data: { user } } = await supabase.auth.getUser(
      cookieStore.get('sb-access-token')?.value || ''
    );
    
    if (!user || !(await checkAdmin(supabase, user.id))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'earnings' or 'payouts'
    const affiliateId = searchParams.get('affiliate_id');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    
    if (!type || !['earnings', 'payouts'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: earnings or payouts' },
        { status: 400 }
      );
    }
    
    if (type === 'earnings') {
      let query = supabase
        .from('affiliate_earnings')
        .select(`
          *,
          affiliates:affiliate_id (
            name,
            ref_code,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (affiliateId) query = query.eq('affiliate_id', affiliateId);
      if (fromDate) query = query.gte('created_at', fromDate);
      if (toDate) query = query.lte('created_at', toDate);
      
      const { data: earnings, error } = await query;
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch earnings', details: error.message },
          { status: 500 }
        );
      }
      
      // Generate CSV
      const headers = [
        'ID',
        'Affiliate Name',
        'Ref Code',
        'User Email',
        'Event Type',
        'Amount',
        'Currency',
        'Payout Status',
        'Order ID',
        'Created At (ISO)',
        'Is Fraudulent'
      ];
      
      const rows = (earnings || []).map((e: any) => [
        e.id,
        e.affiliates?.name || '',
        e.affiliates?.ref_code || '',
        e.users?.email || '',
        e.event_type,
        e.amount,
        e.currency,
        e.payout_status,
        e.order_id || '',
        formatISO(e.created_at),
        e.is_fraudulent ? 'Yes' : 'No'
      ]);
      
      const csv = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="earnings-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
      
    } else if (type === 'payouts') {
      let query = supabase
        .from('affiliate_payouts')
        .select(`
          *,
          affiliates:affiliate_id (
            name,
            ref_code,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (affiliateId) query = query.eq('affiliate_id', affiliateId);
      if (fromDate) query = query.gte('initiated_at', fromDate);
      if (toDate) query = query.lte('initiated_at', toDate);
      
      const { data: payouts, error } = await query;
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch payouts', details: error.message },
          { status: 500 }
        );
      }
      
      // Generate CSV
      const headers = [
        'ID',
        'Affiliate Name',
        'Ref Code',
        'Amount',
        'Currency',
        'Status',
        'Transaction ID',
        'Initiated At (ISO)',
        'Completed At (ISO)',
        'Notes'
      ];
      
      const rows = (payouts || []).map((p: any) => [
        p.id,
        p.affiliates?.name || '',
        p.affiliates?.ref_code || '',
        p.amount,
        p.currency,
        p.status,
        p.payout_tx_id || '',
        formatISO(p.initiated_at),
        p.completed_at ? formatISO(p.completed_at) : '',
        p.notes || ''
      ]);
      
      const csv = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="payouts-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid type' },
      { status: 400 }
    );
    
  } catch (error: any) {
    console.error('Error in GET /api/admin/export:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}



