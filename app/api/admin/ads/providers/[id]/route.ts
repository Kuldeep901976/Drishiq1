/**
 * Admin API: Provider Update/Delete
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

    const supabase = createClient();
    const { data, error } = await supabase
      .from('ad_providers')
      .select(`
        *,
        mappings:provider_mappings(
          *,
          placement:placements(*)
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ provider: data });
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

    const supabase = createClient();
    const body = await request.json();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: current } = await supabase
      .from('ad_providers')
      .select('*')
      .eq('id', params.id)
      .single();

    const { data, error } = await supabase
      .from('ad_providers')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from('ad_audit_logs').insert({
      user_id: user?.id,
      action: 'update',
      entity_type: 'provider',
      entity_id: params.id,
      changes: { before: current, after: body },
    });

    return NextResponse.json({ provider: data });
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

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: current } = await supabase
      .from('ad_providers')
      .select('*')
      .eq('id', params.id)
      .single();

    const { error } = await supabase
      .from('ad_providers')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from('ad_audit_logs').insert({
      user_id: user?.id,
      action: 'delete',
      entity_type: 'provider',
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

