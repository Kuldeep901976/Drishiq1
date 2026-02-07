/**
 * Admin API: Campaigns CRUD
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
    const status = searchParams.get('status');
    const advertiserId = searchParams.get('advertiser_id');

    let query = supabase
      .from('campaigns')
      .select(`
        *,
        advertiser:advertisers(*),
        creatives:creatives(id, name, type, status),
        line_items:line_items(id, placement_id, status)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (advertiserId) {
      query = query.eq('advertiser_id', advertiserId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ campaigns: data || [] });
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
      advertiser_id,
      name,
      start_datetime,
      end_datetime,
      budget_total,
      budget_daily,
      status = 'draft',
      pacing_strategy = 'even',
      rotation_strategy = 'weighted_random',
    } = body;

    // Get current user for audit
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        advertiser_id,
        name,
        start_datetime,
        end_datetime,
        budget_total,
        budget_daily,
        status,
        pacing_strategy,
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
      entity_type: 'campaign',
      entity_id: data.id,
      changes: body,
    });

    return NextResponse.json({ campaign: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

