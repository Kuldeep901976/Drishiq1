/**
 * Runtime API: Ad Decision
 * Low-latency endpoint for selecting which ad to serve
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { makeAdDecision, type DecisionRequest } from '@/lib/ads/decision-engine';
import { checkFrequencyCap } from '@/lib/ads/frequency-cap';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get('placement');
    const user_id = searchParams.get('user_id') || undefined;
    const anon_id = searchParams.get('anon_id') || generateAnonId(request);
    const page = searchParams.get('page') || undefined;
    const device = searchParams.get('device') as 'mobile' | 'desktop' | 'tablet' | undefined;
    const country = searchParams.get('country') || undefined;
    const referrer = request.headers.get('referer') || undefined;

    if (!placement) {
      return NextResponse.json(
        { status: 'error', error: 'placement parameter required' },
        { status: 400 }
      );
    }

    if (!anon_id) {
      return NextResponse.json(
        { status: 'error', error: 'anon_id required' },
        { status: 400 }
      );
    }

    const supabase = createClient(request);

    // Build decision request
    const decisionRequest: DecisionRequest = {
      placement_code: placement,
      user_id,
      anon_id,
      page_path: page,
      device_type: device,
      country,
      referrer,
      user_agent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    };

    // Get line items for placement
    const getLineItems = async (placementCode: string) => {
      // First get placement ID
      const { data: placement } = await supabase
        .from('placements')
        .select('id')
        .eq('code', placementCode)
        .single();

      if (!placement) {
        return [];
      }

      const { data, error } = await supabase
        .from('line_items')
        .select(`
          id,
          creative_id,
          campaign_id,
          placement_id,
          priority,
          weight,
          targeting,
          start_at,
          end_at,
          rotation_strategy,
          status,
          creatives!inner(
            type,
            file_url,
            third_party_tag,
            click_url_template,
            width,
            height
          )
        `)
        .eq('placement_id', placement.id)
        .eq('status', 'active');

      if (error || !data) {
        return [];
      }

      return data.map((item: any) => ({
        id: item.id,
        creative_id: item.creative_id,
        campaign_id: item.campaign_id,
        placement_id: item.placement_id,
        priority: item.priority,
        weight: item.weight,
        targeting: item.targeting,
        start_at: item.start_at,
        end_at: item.end_at,
        rotation_strategy: item.rotation_strategy,
        status: item.status,
        creative_type: item.creatives?.type,
        creative_file_url: item.creatives?.file_url,
        creative_third_party_tag: item.creatives?.third_party_tag,
        creative_click_url: item.creatives?.click_url_template,
        creative_width: item.creatives?.width,
        creative_height: item.creatives?.height,
        start_at: item.start_at,
        end_at: item.end_at,
      }));
    };

    // Check frequency cap
    const checkFreqCap = async (lineItemId: string, anonId: string, userId?: string) => {
      return await checkFrequencyCap(supabase, lineItemId, anonId, userId);
    };

    // Get provider tag (if needed)
    const getProviderTag = async (placementCode: string) => {
      const { data: placement } = await supabase
        .from('placements')
        .select('id')
        .eq('code', placementCode)
        .single();

      if (!placement) return null;

      const { data: mappings } = await supabase
        .from('provider_mappings')
        .select('tag_template')
        .eq('placement_id', placement.id)
        .eq('is_active', true)
        .order('priority', { ascending: true })
        .limit(1)
        .single();

      return mappings?.tag_template || null;
    };

    // Make decision
    const decision = await makeAdDecision(
      decisionRequest,
      getLineItems,
      checkFreqCap,
      getProviderTag
    );

    // Add cache headers for performance
    const response = NextResponse.json(decision);
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');
    
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate anonymous ID from request (cookie or generate new)
 */
function generateAnonId(request: NextRequest): string {
  // Try to get from cookie
  const cookieAnonId = request.cookies.get('anon_id')?.value;
  if (cookieAnonId) {
    return cookieAnonId;
  }

  // Generate new anon ID (in production, use proper UUID)
  const newAnonId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  return newAnonId;
}

