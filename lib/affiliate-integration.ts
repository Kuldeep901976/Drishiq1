// lib/affiliate-integration.ts
// Helper functions for integrating affiliate attribution into signup/payment flows

import { createServiceClient } from './supabase';
import { 
  parseAffiliateCookie, 
  isAffiliateCookieValid,
  calculateEarnings,
  checkSelfReferral
} from './affiliate-utils';

/**
 * Get affiliate from cookie (for use in signup/payment handlers)
 */
export function getAffiliateFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  const affiliateCookieName = 'affiliate_ref';
  const cookieMatch = cookieHeader.match(new RegExp(`${affiliateCookieName}=([^;]+)`));
  
  if (!cookieMatch) return null;
  
  try {
    const cookieValue = decodeURIComponent(cookieMatch[1]);
    const affiliateCookie = parseAffiliateCookie(cookieValue);
    
    if (affiliateCookie && isAffiliateCookieValid(affiliateCookie)) {
      return affiliateCookie.refCode;
    }
  } catch (error) {
    console.error('Error parsing affiliate cookie:', error);
  }
  
  return null;
}

/**
 * Attribute signup to affiliate
 * Call this after user creation in your signup handler
 */
export async function attributeSignup(
  userId: string,
  userEmail: string,
  cookieHeader: string | null
): Promise<{ success: boolean; affiliateId?: string; earningsId?: number; error?: string }> {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return { success: false, error: 'Database connection failed' };
    }
    
    // Get affiliate from cookie
    const refCode = getAffiliateFromCookie(cookieHeader);
    if (!refCode) {
      return { success: false, error: 'No affiliate cookie found' };
    }
    
    // Get affiliate details
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, ref_code, payout_type, payout_rate, email, status')
      .eq('ref_code', refCode)
      .eq('status', 'active')
      .single();
    
    if (affiliateError || !affiliate) {
      return { success: false, error: 'Affiliate not found or inactive' };
    }
    
    // Check if user is already attributed
    const { data: existingUser } = await supabase
      .from('users')
      .select('affiliated_by')
      .eq('id', userId)
      .single();
    
    if (existingUser?.affiliated_by) {
      // User already attributed
      return { 
        success: true, 
        affiliateId: existingUser.affiliated_by,
        error: 'User already attributed'
      };
    }
    
    // Check for self-referral fraud
    const isSelfReferral = checkSelfReferral(userEmail, affiliate.email);
    
    // Calculate earnings for signup
    const earningsAmount = calculateEarnings(
      0, // Signup has no order total
      affiliate.payout_type as 'percentage' | 'fixed',
      parseFloat(affiliate.payout_rate),
      'signup'
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
        event_type: 'signup',
        amount: earningsAmount,
        currency: 'INR',
        metadata: {
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
      return { 
        success: false, 
        error: 'Failed to create earnings record',
        affiliateId: affiliate.id
      };
    }
    
    return {
      success: true,
      affiliateId: affiliate.id,
      earningsId: earning.id
    };
    
  } catch (error: any) {
    console.error('Error in attributeSignup:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Attribute purchase to affiliate
 * Call this in your payment webhook handler
 */
export async function attributePurchase(
  userId: string,
  orderId: string,
  orderTotal: number,
  currency: string = 'INR',
  metadata?: Record<string, any>
): Promise<{ success: boolean; affiliateId?: string; earningsId?: number; error?: string }> {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return { success: false, error: 'Database connection failed' };
    }
    
    // Get user's affiliate attribution
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, affiliated_by, affiliate_ref_code')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      return { success: false, error: 'User not found' };
    }
    
    if (!user.affiliated_by) {
      // No affiliate attribution
      return { success: false, error: 'User has no affiliate attribution' };
    }
    
    // Check if earnings already created for this order (idempotency)
    const { data: existingEarning } = await supabase
      .from('affiliate_earnings')
      .select('id')
      .eq('order_id', orderId)
      .eq('event_type', 'purchase')
      .single();
    
    if (existingEarning) {
      return {
        success: true,
        affiliateId: user.affiliated_by,
        earningsId: existingEarning.id,
        error: 'Earnings already recorded for this order'
      };
    }
    
    // Get affiliate details
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, ref_code, payout_type, payout_rate, status')
      .eq('id', user.affiliated_by)
      .eq('status', 'active')
      .single();
    
    if (affiliateError || !affiliate) {
      return { success: false, error: 'Affiliate not found or inactive' };
    }
    
    // Calculate earnings
    const earningsAmount = calculateEarnings(
      orderTotal,
      affiliate.payout_type as 'percentage' | 'fixed',
      parseFloat(affiliate.payout_rate),
      'purchase'
    );
    
    // Create earnings record
    const { data: earning, error: earningError } = await supabase
      .from('affiliate_earnings')
      .insert({
        affiliate_id: affiliate.id,
        user_id: userId,
        event_type: 'purchase',
        amount: earningsAmount,
        currency,
        order_id: orderId,
        metadata: {
          ...metadata,
          ref_code: affiliate.ref_code,
          original_amount: orderTotal
        },
        payout_status: 'pending'
      })
      .select()
      .single();
    
    if (earningError) {
      console.error('Error creating earnings record:', earningError);
      return { 
        success: false, 
        error: 'Failed to create earnings record',
        affiliateId: affiliate.id
      };
    }
    
    return {
      success: true,
      affiliateId: affiliate.id,
      earningsId: earning.id
    };
    
  } catch (error: any) {
    console.error('Error in attributePurchase:', error);
    return { success: false, error: error.message };
  }
}



