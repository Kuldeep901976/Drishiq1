// app/api/affiliate/attribute/route.ts
// Attribute conversions (signup/purchase) to affiliates

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { 
  parseAffiliateCookie, 
  isAffiliateCookieValid,
  calculateEarnings,
  checkSelfReferral
} from '@/lib/affiliate-utils';

/**
 * POST /api/affiliate/attribute
 * Attribute a conversion event (signup/purchase) to an affiliate
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, eventType, orderTotal = 0, orderId, metadata } = body;
    
    if (!userId || !eventType) {
      return NextResponse.json(
        { error: 'userId and eventType are required' },
        { status: 400 }
      );
    }
    
    if (!['signup', 'purchase', 'retention'].includes(eventType)) {
      return NextResponse.json(
        { error: 'Invalid eventType. Must be: signup, purchase, or retention' },
        { status: 400 }
      );
    }
    
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }
    
    // Get affiliate cookie from request
    const cookieHeader = req.headers.get('cookie') || '';
    const affiliateCookieName = 'affiliate_ref';
    const cookieMatch = cookieHeader.match(new RegExp(`${affiliateCookieName}=([^;]+)`));
    
    if (!cookieMatch) {
      return NextResponse.json({
        success: false,
        message: 'No affiliate cookie found'
      });
    }
    
    const cookieValue = decodeURIComponent(cookieMatch[1]);
    const affiliateCookie = parseAffiliateCookie(cookieValue);
    
    if (!affiliateCookie || !isAffiliateCookieValid(affiliateCookie)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired affiliate cookie'
      });
    }
    
    // Get affiliate details
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, ref_code, payout_type, payout_rate, email, status')
      .eq('id', affiliateCookie.affiliateId)
      .eq('status', 'active')
      .single();
    
    if (affiliateError || !affiliate) {
      return NextResponse.json({
        success: false,
        message: 'Affiliate not found or inactive'
      });
    }
    
    // Single query: user attribution + email for self-referral check (was 2 separate queries)
    const { data: userRow } = await supabase
      .from('users')
      .select('affiliated_by, email')
      .eq('id', userId)
      .single();
    
    if (userRow?.affiliated_by) {
      return NextResponse.json({
        success: true,
        message: 'User already attributed',
        affiliateId: userRow.affiliated_by
      });
    }
    
    const isSelfReferral = userRow?.email && checkSelfReferral(userRow.email, affiliate.email);
    
    // Calculate earnings
    const earningsAmount = calculateEarnings(
      orderTotal,
      affiliate.payout_type as 'percentage' | 'fixed',
      parseFloat(affiliate.payout_rate),
      eventType as 'signup' | 'purchase' | 'retention'
    );
    
    // Update user with affiliate attribution
    const { error: updateError } = await supabase
      .from('users')
      .update({
        affiliated_by: affiliate.id,
        affiliated_at: new Date().toISOString(),
        affiliate_ref_code: affiliate.ref_code
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error updating user attribution:', updateError);
      // Continue anyway - we'll still create the earnings record
    }
    
    // Create earnings record
    const { data: earning, error: earningError } = await supabase
      .from('affiliate_earnings')
      .insert({
        affiliate_id: affiliate.id,
        user_id: userId,
        event_type: eventType,
        amount: earningsAmount,
        currency: 'INR',
        order_id: orderId,
        metadata: {
          ...metadata,
          ref_code: affiliate.ref_code,
          is_self_referral: isSelfReferral
        },
        is_fraudulent: isSelfReferral,
        fraud_reason: isSelfReferral ? 'Self-referral detected' : null,
        payout_status: isSelfReferral ? 'cancelled' : 'pending'
      })
      .select()
      .single();
    
    if (earningError) {
      console.error('Error creating earnings record:', earningError);
      return NextResponse.json(
        { error: 'Failed to create earnings record', details: earningError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        affiliateId: affiliate.id,
        refCode: affiliate.ref_code,
        earnings: earning,
        isSelfReferral
      }
    });
    
  } catch (error: any) {
    console.error('Error in attribute API:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}



