/**
 * Admin API: Reports and Analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(request);
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from'); // YYYY-MM-DD
    const to = searchParams.get('to'); // YYYY-MM-DD
    const groupBy = searchParams.get('group_by') || 'campaign'; // placement, campaign, creative, line_item
    const campaignId = searchParams.get('campaign_id');
    const placementId = searchParams.get('placement_id');
    const creativeId = searchParams.get('creative_id');

    // Build date range
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];

    // Get raw events
    let eventsQuery = supabase
      .from('ad_events')
      .select('*')
      .gte('event_timestamp', fromDate)
      .lte('event_timestamp', toDate);

    if (campaignId) {
      eventsQuery = eventsQuery.eq('campaign_id', campaignId);
    }
    if (placementId) {
      eventsQuery = eventsQuery.eq('placement_id', placementId);
    }
    if (creativeId) {
      eventsQuery = eventsQuery.eq('creative_id', creativeId);
    }

    const { data: events, error: eventsError } = await eventsQuery;

    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    // Aggregate by group_by
    const aggregates: Record<string, any> = {};

    for (const event of events || []) {
      let groupId: string | null = null;
      let groupName: string | null = null;

      switch (groupBy) {
        case 'placement':
          groupId = event.placement_id;
          break;
        case 'campaign':
          groupId = event.campaign_id;
          break;
        case 'creative':
          groupId = event.creative_id;
          break;
        case 'line_item':
          groupId = event.line_item_id;
          break;
      }

      if (!groupId) continue;

      if (!aggregates[groupId]) {
        aggregates[groupId] = {
          group_id: groupId,
          impressions: 0,
          clicks: 0,
          views: 0,
          conversions: 0,
          revenue: 0,
          spend: 0,
        };
      }

      const agg = aggregates[groupId];
      if (event.event_type === 'impression') agg.impressions++;
      if (event.event_type === 'click') agg.clicks++;
      if (event.event_type === 'view') agg.views++;
      if (event.event_type === 'convert') agg.conversions++;
    }

    // Calculate CTR and eCPM
    const results = Object.values(aggregates).map((agg: any) => {
      const ctr = agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0;
      const ecpm = agg.impressions > 0 ? (agg.revenue / agg.impressions) * 1000 : 0;

      return {
        ...agg,
        ctr: parseFloat(ctr.toFixed(4)),
        ecpm: parseFloat(ecpm.toFixed(4)),
      };
    });

    // Get daily breakdown
    const dailyBreakdown: Record<string, any> = {};
    for (const event of events || []) {
      const date = event.event_timestamp.split('T')[0];
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = {
          date,
          impressions: 0,
          clicks: 0,
          views: 0,
          conversions: 0,
        };
      }
      const day = dailyBreakdown[date];
      if (event.event_type === 'impression') day.impressions++;
      if (event.event_type === 'click') day.clicks++;
      if (event.event_type === 'view') day.views++;
      if (event.event_type === 'convert') day.conversions++;
    }

    return NextResponse.json({
      summary: {
        total_impressions: results.reduce((sum, r) => sum + r.impressions, 0),
        total_clicks: results.reduce((sum, r) => sum + r.clicks, 0),
        total_views: results.reduce((sum, r) => sum + r.views, 0),
        total_conversions: results.reduce((sum, r) => sum + r.conversions, 0),
        total_revenue: results.reduce((sum, r) => sum + r.revenue, 0),
        total_spend: results.reduce((sum, r) => sum + r.spend, 0),
      },
      aggregates: results,
      daily_breakdown: Object.values(dailyBreakdown).sort((a: any, b: any) => 
        a.date.localeCompare(b.date)
      ),
      date_range: {
        from: fromDate,
        to: toDate,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

