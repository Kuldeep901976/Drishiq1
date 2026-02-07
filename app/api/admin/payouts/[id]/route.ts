// app/api/admin/payouts/[id]/route.ts
// Update payout status

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
 * PATCH /api/admin/payouts/:id
 * Update payout status and transaction ID
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const payoutId = params.id;
    const body = await req.json();
    const { status, payout_tx_id, notes } = body;
    
    // Get current payout
    const { data: currentPayout } = await supabase
      .from('affiliate_payouts')
      .select('*')
      .eq('id', payoutId)
      .single();
    
    if (!currentPayout) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      );
    }
    
    // Prepare update
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }
    
    if (payout_tx_id) {
      updateData.payout_tx_id = payout_tx_id;
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    // Update payout
    const { data: updatedPayout, error: updateError } = await supabase
      .from('affiliate_payouts')
      .update(updateData)
      .eq('id', payoutId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating payout:', updateError);
      return NextResponse.json(
        { error: 'Failed to update payout', details: updateError.message },
        { status: 500 }
      );
    }
    
    // Log audit
    await supabase
      .from('affiliate_audit_log')
      .insert({
        payout_id: parseInt(payoutId),
        affiliate_id: currentPayout.affiliate_id,
        action: `payout_${status}`,
        entity_type: 'payout',
        entity_id: payoutId,
        admin_user_id: user.id,
        changes: {
          before: currentPayout,
          after: updatedPayout
        },
        ip_address: req.headers.get('x-forwarded-for') || '',
        user_agent: req.headers.get('user-agent') || ''
      });
    
    return NextResponse.json({
      success: true,
      data: updatedPayout
    });
    
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/payouts/:id:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}



