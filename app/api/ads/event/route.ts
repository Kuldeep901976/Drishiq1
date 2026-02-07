/**
 * Runtime API: Ad Event Tracking
 * Records impressions, clicks, views, conversions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordFrequencyCapImpression } from '@/lib/ads/frequency-cap';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      event_type,
      creative_id,
      line_item_id,
      campaign_id,
      placement_id,
      user_id,
      anon_id,
      session_id,
      metadata,
    } = body;

    if (!event_type || !anon_id) {
      return NextResponse.json(
        { error: 'event_type and anon_id required' },
        { status: 400 }
      );
    }

    if (!['impression', 'click', 'view', 'convert'].includes(event_type)) {
      return NextResponse.json(
        { error: 'Invalid event_type' },
        { status: 400 }
      );
    }

    const supabase = createClient(request);

    // Get request metadata
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               null;
    const userAgent = request.headers.get('user-agent') || null;
    const referrer = request.headers.get('referer') || null;

    // Extract geo from IP (simplified - would use geo service in production)
    const geo_country = metadata?.country || null;
    const geo_region = metadata?.region || null;
    const geo_city = metadata?.city || null;
    const device_type = metadata?.device_type || null;

    // Insert event
    const { data, error } = await supabase
      .from('ad_events')
      .insert({
        event_type,
        creative_id: creative_id || null,
        line_item_id: line_item_id || null,
        campaign_id: campaign_id || null,
        placement_id: placement_id || null,
        user_id: user_id || null,
        anon_id,
        session_id: session_id || null,
        ip: ip ? ip.split(',')[0].trim() : null, // Get first IP if multiple
        user_agent: userAgent,
        device_type,
        geo_country,
        geo_region,
        geo_city,
        referrer,
        page_url: metadata?.page_url || null,
        query_params: metadata?.query_params || null,
        extra_json: metadata || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Record frequency cap impression if it's an impression event
    if (event_type === 'impression' && line_item_id) {
      await recordFrequencyCapImpression(supabase, line_item_id, anon_id, user_id);
    }

    // Return success (async - don't wait for aggregation)
    return NextResponse.json({ success: true, event_id: data.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

