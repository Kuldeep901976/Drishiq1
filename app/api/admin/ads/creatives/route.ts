/**
 * Admin API: Creatives CRUD
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
    const campaignId = searchParams.get('campaign_id');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let query = supabase
      .from('creatives')
      .select(`
        *,
        campaign:campaigns(id, name, status)
      `)
      .order('created_at', { ascending: false });

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ creatives: data || [] });
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
      campaign_id,
      name,
      type,
      width,
      height,
      size,
      mime_type,
      file_url,
      click_url_template,
      third_party_tag,
      duration_seconds,
      status = 'draft',
      preview_image_url,
      visible_on_mobile = true,
      visible_on_desktop = true,
      metadata,
    } = body;

    // Get current user for audit
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('creatives')
      .insert({
        campaign_id,
        name,
        type,
        width,
        height,
        size,
        mime_type,
        file_url,
        click_url_template,
        third_party_tag,
        duration_seconds,
        status,
        preview_image_url,
        visible_on_mobile,
        visible_on_desktop,
        metadata,
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
      entity_type: 'creative',
      entity_id: data.id,
      changes: body,
    });

    return NextResponse.json({ creative: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

