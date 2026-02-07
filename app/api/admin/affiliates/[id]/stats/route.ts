// app/api/admin/affiliates/[id]/stats/route.ts
// Get affiliate statistics

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { withAuth } from '@/lib/auth-middleware';

/**
 * GET /api/admin/affiliates/:id/stats
 * Get detailed statistics for an affiliate
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (request, user) => {
    try {
      const supabase = createServiceClient();
      if (!supabase) {
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 503 }
        );
      }
    
      const affiliateId = params.id;
      const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    
    // Get affiliate details
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('id', affiliateId)
      .single();
    
    if (affiliateError || !affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }
    
    // Get stats using database function
    const { data: stats, error: statsError } = await supabase.rpc('get_affiliate_stats', {
      p_affiliate_id: affiliateId,
      p_from_date: fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      p_to_date: toDate || new Date().toISOString()
    });
    
    if (statsError) {
      console.error('Error fetching stats:', statsError);
    }
    
    // Get clicks timeline
    const { data: clicks, error: clicksError } = await supabase
      .from('affiliate_clicks')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false })
      .limit(100);
    
    // Get earnings timeline
    const { data: earnings, error: earningsError } = await supabase
      .from('affiliate_earnings')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false })
      .limit(100);
    
    // Get payouts
    const { data: payouts, error: payoutsError } = await supabase
      .from('affiliate_payouts')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false });
    
      return NextResponse.json({
        success: true,
        data: {
          affiliate,
          stats: stats?.[0] || {},
          clicks: clicks || [],
          earnings: earnings || [],
          payouts: payouts || []
        }
      });
      
    } catch (error: any) {
      console.error('Error in GET /api/admin/affiliates/:id/stats:', error);
      return NextResponse.json(
        { error: 'Internal server error', message: error.message },
        { status: 500 }
      );
    }
  }, {
    requireAdmin: true
  });
}

