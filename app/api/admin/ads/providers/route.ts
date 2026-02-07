/**
 * Admin API: Providers CRUD
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

    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const type = searchParams.get('type');

    let query = supabase
      .from('ad_providers')
      .select('*')
      .order('priority', { ascending: true })
      .order('name', { ascending: true });

    if (active !== null) {
      query = query.eq('active', active === 'true');
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ providers: data || [] });
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

    const supabase = createClient();
    const body = await request.json();
    const {
      name,
      type,
      config,
      active = true,
      priority = 0,
    } = body;

    const { data, error } = await supabase
      .from('ad_providers')
      .insert({
        name,
        type,
        config,
        active,
        priority,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('ad_audit_logs').insert({
      user_id: user?.id,
      action: 'create',
      entity_type: 'provider',
      entity_id: data.id,
      changes: body,
    });

    return NextResponse.json({ provider: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

