/**
 * Admin API: Line Items CRUD
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/admin-auth';
import { validateTargetingRule } from '@/lib/ads/targeting-evaluator';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(request);
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign_id');
    const placementId = searchParams.get('placement_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('line_items')
      .select(`
        *,
        creative:creatives(*),
        placement:placements(*),
        campaign:campaigns(*)
      `)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }
    if (placementId) {
      query = query.eq('placement_id', placementId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ line_items: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(request);
    const body = await request.json();
    const {
      creative_id,
      placement_id,
      campaign_id,
      start_at,
      end_at,
      priority = 0,
      weight = 1,
      freq_cap_count,
      freq_cap_window_seconds,
      max_impressions_total,
      max_clicks_total,
      max_impressions_daily,
      targeting,
      pricing_model = 'CPM',
      price_value,
      status = 'draft',
      rotation_strategy,
    } = body;

    // Validate targeting rule if provided
    if (targeting) {
      const validation = validateTargetingRule(targeting);
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Invalid targeting rule: ${validation.error}` },
          { status: 400 }
        );
      }
    }

    // Get current user for audit
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('line_items')
      .insert({
        creative_id,
        placement_id,
        campaign_id,
        start_at,
        end_at,
        priority,
        weight,
        freq_cap_count,
        freq_cap_window_seconds,
        max_impressions_total,
        max_clicks_total,
        max_impressions_daily,
        targeting: targeting || null,
        pricing_model,
        price_value,
        status,
        rotation_strategy,
        created_by: user?.id,
        updated_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log audit
    await supabase.from('ad_audit_logs').insert({
      user_id: user?.id,
      action: 'create',
      entity_type: 'line_item',
      entity_id: data.id,
      changes: body,
    });

    return NextResponse.json({ line_item: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

