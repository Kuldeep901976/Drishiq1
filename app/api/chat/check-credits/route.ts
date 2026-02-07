import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/**
 * GET /api/chat/check-credits
 * Check if user has available credits
 * Query params: userId
 */
export async function GET(req: NextRequest) {
  // Wrap in try-catch to ensure JSON responses, never HTML
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User ID is required' 
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    if (!supabase) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Database connection failed' 
        },
        { status: 503 }
      );
    }

    // Check for valid (non-expired) credits
    // First try the get_valid_credits function if available, otherwise fallback to balance check
    let available = 0;
    let expiredCredits = 0;
    let expiringSoon = 0;
    
    try {
      const { data: validCreditsData, error: validCreditsError } = await supabase
        .rpc('get_valid_credits', { p_user_id: userId });
      
      if (!validCreditsError && validCreditsData && validCreditsData.length > 0) {
        const result = validCreditsData[0];
        available = result.total_valid_credits ?? 0;
        expiredCredits = result.total_expired_credits ?? 0;
        expiringSoon = result.expiring_soon_count ?? 0;
        
        console.log(`✅ Credit check for user ${userId}:`, {
          validCredits: available,
          expiredCredits,
          expiringSoon
        });
      } else {
        // Fallback: Read from user_credits_balance table (auto-calculated balance)
        // credits_balance = total_credits - credits_used - credits_pending
        // When credits_pending decreases (refund/release), credits_balance increases automatically
        // This is the single source of truth for available credits for logged-in users
        const { data: balanceRow, error: balanceError } = await supabase
          .from('user_credits_balance')
          .select('credits_balance')
          .eq('user_id', userId)
          .maybeSingle();

        if (balanceError) {
          console.error('Error fetching credits from user_credits_balance:', balanceError);
          // Return 0 if error (user might not have a balance record yet)
          return NextResponse.json({
            success: true,
            data: {
              hasCredit: false,
              currentBalance: 0,
              message: 'No credits balance found. Please purchase credits to continue.'
            }
          });
        }

        available = balanceRow?.credits_balance ?? 0;
        
        // Check for expired credits in transactions table
        const { data: expiredData } = await supabase
          .from('transactions')
          .select('credits')
          .eq('user_id', userId)
          .eq('transaction_type', 'expired')
          .eq('status', 'completed');
        
        expiredCredits = expiredData?.reduce((sum, t) => sum + (t.credits || 0), 0) ?? 0;
        
        console.log(`✅ Credit check for user ${userId}: ${available} credits available from user_credits_balance table`);
      }
    } catch (error) {
      console.error('Error in credit check:', error);
      // Continue with fallback
    }

    // Additional check: Verify credits haven't expired by checking transactions
    // This ensures we're not counting expired credits
    const { data: activePurchases } = await supabase
      .from('transactions')
      .select('credits, expires_at')
      .eq('user_id', userId)
      .eq('transaction_type', 'purchase')
      .eq('status', 'completed')
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

    // Calculate valid credits from active purchases
    const validCreditsFromPurchases = activePurchases?.reduce((sum, t) => {
      // Only count if not expired
      if (!t.expires_at || new Date(t.expires_at) > new Date()) {
        return sum + (t.credits || 0);
      }
      return sum;
    }, 0) ?? 0;

    // Use the minimum of balance and valid purchases to ensure accuracy
    const finalAvailable = Math.min(available, validCreditsFromPurchases);

    return NextResponse.json({
      success: true,
      data: {
        hasCredit: finalAvailable >= 1,
        currentBalance: finalAvailable,
        expiredCredits,
        expiringSoon,
        message: finalAvailable >= 1
          ? `You have ${finalAvailable} valid credits available${expiringSoon > 0 ? ` (${expiringSoon} expiring soon)` : ''}`
          : expiredCredits > 0
          ? `Your credits have expired. Please purchase more to continue.`
          : 'Insufficient credits. Purchase more to continue.'
      }
    });
  } catch (error: any) {
    console.error('Error in check-credits API:', error);
    // Always return JSON, never HTML
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check credits',
        message: error?.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

