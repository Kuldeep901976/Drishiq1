// app/api/cron/expire-credits/route.ts
// Scheduled job to expire credits based on validity periods
// This endpoint should be called daily via a cron job or scheduled task

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/**
 * GET /api/cron/expire-credits
 * 
 * This endpoint expires credits that have passed their validity period.
 * Should be called daily via:
 * - Vercel Cron Jobs
 * - Supabase Edge Functions with pg_cron
 * - External cron service (cron-job.org, etc.)
 * 
 * Security: Should be protected with a secret token or only accessible from cron services
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    // Optional: Verify request is from authorized source
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow if no secret is set (for development) or if secret matches
      if (cronSecret) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('🔄 Starting credit expiration job...');

    // Call the expire_credits database function
    const { data, error } = await supabase.rpc('expire_credits');

    if (error) {
      console.error('❌ Error expiring credits:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error.details,
          hint: error.hint
        },
        { status: 500 }
      );
    }

    const result = data?.[0] || { expired_count: 0, expired_credits: 0, affected_users: 0 };

    console.log('✅ Credit expiration job completed:', {
      expiredTransactions: result.expired_count,
      expiredCredits: result.expired_credits,
      affectedUsers: result.affected_users
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        expiredTransactions: result.expired_count,
        expiredCredits: result.expired_credits,
        affectedUsers: result.affected_users
      }
    });

  } catch (error: any) {
    console.error('❌ Unexpected error in credit expiration job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/expire-credits
 * Alternative endpoint for POST requests (some cron services prefer POST)
 */
export async function POST(req: NextRequest) {
  return GET(req);
}



