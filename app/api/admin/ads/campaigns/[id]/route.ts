/**
 * Admin API: Campaign Update/Delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(request);
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        advertiser:advertisers(*),
        creatives:creatives(*),
        line_items:line_items(
          *,
          placement:placements(*),
          creative:creatives(*)
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ campaign: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(request);
    const body = await request.json();
    const { data: { user } } = await supabase.auth.getUser();

    // Get current state for audit
    const { data: current } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', params.id)
      .single();

    const { data, error } = await supabase
      .from('campaigns')
      .update({
        ...body,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log audit
    await supabase.from('ad_audit_logs').insert({
      user_id: user?.id,
      action: 'update',
      entity_type: 'campaign',
      entity_id: params.id,
      changes: { before: current, after: body },
    });

    return NextResponse.json({ campaign: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    // Get current state for audit
    const { data: current } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', params.id)
      .single();

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log audit
    await supabase.from('ad_audit_logs').insert({
      user_id: user?.id,
      action: 'delete',
      entity_type: 'campaign',
      entity_id: params.id,
      changes: { before: current },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

