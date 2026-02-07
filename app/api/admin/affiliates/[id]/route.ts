// app/api/admin/affiliates/[id]/route.ts
// Update and delete affiliate operations

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
 * PATCH /api/admin/affiliates/:id
 * Update an affiliate
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
    
    const affiliateId = params.id;
    const body = await req.json();
    
    // Get current affiliate data for audit
    const { data: currentAffiliate } = await supabase
      .from('affiliates')
      .select('*')
      .eq('id', affiliateId)
      .single();
    
    if (!currentAffiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {
      updated_by: user.id
    };
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.payout_rate !== undefined) updateData.payout_rate = parseFloat(body.payout_rate);
    if (body.payout_type !== undefined) updateData.payout_type = body.payout_type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.cookie_duration_days !== undefined) updateData.cookie_duration_days = body.cookie_duration_days;
    if (body.payment_method !== undefined) updateData.payment_method = body.payment_method;
    if (body.kyc_verified !== undefined) updateData.kyc_verified = body.kyc_verified;
    
    // Update affiliate
    const { data: updatedAffiliate, error: updateError } = await supabase
      .from('affiliates')
      .update(updateData)
      .eq('id', affiliateId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating affiliate:', updateError);
      return NextResponse.json(
        { error: 'Failed to update affiliate', details: updateError.message },
        { status: 500 }
      );
    }
    
    // Log audit
    await supabase
      .from('affiliate_audit_log')
      .insert({
        affiliate_id: affiliateId,
        action: 'update',
        entity_type: 'affiliate',
        entity_id: affiliateId,
        admin_user_id: user.id,
        changes: {
          before: currentAffiliate,
          after: updatedAffiliate
        },
        ip_address: req.headers.get('x-forwarded-for') || '',
        user_agent: req.headers.get('user-agent') || ''
      });
    
    return NextResponse.json({
      success: true,
      data: updatedAffiliate
    });
    
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/affiliates/:id:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/affiliates/:id
 * Delete (deactivate) an affiliate
 */
export async function DELETE(
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
    
    const affiliateId = params.id;
    
    // Soft delete: set status to inactive
    const { data: deletedAffiliate, error: deleteError } = await supabase
      .from('affiliates')
      .update({ 
        status: 'inactive',
        updated_by: user.id
      })
      .eq('id', affiliateId)
      .select()
      .single();
    
    if (deleteError) {
      console.error('Error deleting affiliate:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete affiliate', details: deleteError.message },
        { status: 500 }
      );
    }
    
    if (!deletedAffiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }
    
    // Log audit
    await supabase
      .from('affiliate_audit_log')
      .insert({
        affiliate_id: affiliateId,
        action: 'delete',
        entity_type: 'affiliate',
        entity_id: affiliateId,
        admin_user_id: user.id,
        changes: { deleted: deletedAffiliate },
        ip_address: req.headers.get('x-forwarded-for') || '',
        user_agent: req.headers.get('user-agent') || ''
      });
    
    return NextResponse.json({
      success: true,
      message: 'Affiliate deactivated successfully'
    });
    
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/affiliates/:id:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}



