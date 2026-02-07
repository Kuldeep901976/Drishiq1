// app/api/admin/earnings/route.ts
// Admin API for earnings ledger

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function checkAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  return user?.role === 'admin';
}

/**
 * GET /api/admin/earnings
 * Get earnings ledger with filters
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
    const affiliateId = searchParams.get('affiliate_id');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const payoutStatus = searchParams.get('payout_status');
    const eventType = searchParams.get('event_type');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    let query = supabase
      .from('affiliate_earnings')
      .select(`
        *,
        affiliates:affiliate_id (
          id,
          name,
          ref_code,
          email
        ),
        users:user_id (
          id,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (affiliateId) {
      query = query.eq('affiliate_id', affiliateId);
    }
    
    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }
    
    if (toDate) {
      query = query.lte('created_at', toDate);
    }
    
    if (payoutStatus) {
      query = query.eq('payout_status', payoutStatus);
    }
    
    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    
    const { data: earnings, error } = await query;
    
    if (error) {
      console.error('Error fetching earnings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch earnings', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: earnings || [],
      count: earnings?.length || 0
    });
    
  } catch (error: any) {
    console.error('Error in GET /api/admin/earnings:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}



