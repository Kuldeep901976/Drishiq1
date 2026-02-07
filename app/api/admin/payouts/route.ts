// app/api/admin/payouts/route.ts
// Admin API for payout management

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
 * POST /api/admin/payouts
 * Create a payout for an affiliate
 */
export async function POST(req: NextRequest) {
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
    
    const body = await req.json();
    const { affiliate_id, amount, currency = 'INR', payout_method, notes } = body;
    
    if (!affiliate_id || !amount) {
      return NextResponse.json(
        { error: 'affiliate_id and amount are required' },
        { status: 400 }
      );
    }
    
    // Verify affiliate exists and get payment method
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, payment_method, kyc_verified')
      .eq('id', affiliate_id)
      .single();
    
    if (affiliateError || !affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }
    
    // Check KYC for large payouts (threshold: 10000 INR)
    if (parseFloat(amount) >= 10000 && !affiliate.kyc_verified) {
      return NextResponse.json(
        { error: 'KYC verification required for payouts >= 10000 INR' },
        { status: 400 }
      );
    }
    
    // Create payout
    const { data: payout, error: payoutError } = await supabase
      .from('affiliate_payouts')
      .insert({
        affiliate_id,
        amount: parseFloat(amount),
        currency,
        payout_method: payout_method || affiliate.payment_method,
        status: 'initiated',
        initiated_by: user.id,
        notes
      })
      .select()
      .single();
    
    if (payoutError) {
      console.error('Error creating payout:', payoutError);
      return NextResponse.json(
        { error: 'Failed to create payout', details: payoutError.message },
        { status: 500 }
      );
    }
    
    // Update earnings to mark them as paid
    const { error: earningsUpdateError } = await supabase
      .from('affiliate_earnings')
      .update({
        payout_status: 'paid',
        payout_id: payout.id
      })
      .eq('affiliate_id', affiliate_id)
      .eq('payout_status', 'pending')
      .lte('amount', parseFloat(amount)); // Only mark earnings that fit in this payout
    
    if (earningsUpdateError) {
      console.error('Error updating earnings:', earningsUpdateError);
      // Don't fail the payout creation
    }
    
    // Log audit
    await supabase
      .from('affiliate_audit_log')
      .insert({
        payout_id: payout.id,
        affiliate_id,
        action: 'payout_initiated',
        entity_type: 'payout',
        entity_id: payout.id.toString(),
        admin_user_id: user.id,
        changes: { created: payout },
        ip_address: req.headers.get('x-forwarded-for') || '',
        user_agent: req.headers.get('user-agent') || ''
      });
    
    return NextResponse.json({
      success: true,
      data: payout
    });
    
  } catch (error: any) {
    console.error('Error in POST /api/admin/payouts:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/payouts
 * List all payouts with filters
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
    const status = searchParams.get('status');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    
    let query = supabase
      .from('affiliate_payouts')
      .select(`
        *,
        affiliates:affiliate_id (
          id,
          name,
          ref_code,
          email
        )
      `)
      .order('created_at', { ascending: false });
    
    if (affiliateId) {
      query = query.eq('affiliate_id', affiliateId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (fromDate) {
      query = query.gte('initiated_at', fromDate);
    }
    
    if (toDate) {
      query = query.lte('initiated_at', toDate);
    }
    
    const { data: payouts, error } = await query;
    
    if (error) {
      console.error('Error fetching payouts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payouts', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: payouts || []
    });
    
  } catch (error: any) {
    console.error('Error in GET /api/admin/payouts:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}



