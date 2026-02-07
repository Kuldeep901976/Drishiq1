/**
 * Admin API: Placements CRUD
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('is_active');

    let query = supabase
      .from('placements')
      .select('*')
      .order('priority_group', { ascending: true })
      .order('code', { ascending: true });

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ placements: data || [] });
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
      code,
      display_name,
      page_pattern,
      default_width,
      default_height,
      default_size,
      allowed_types,
      description,
      priority_group = 0,
      is_active = true,
    } = body;

    const { data, error } = await supabase
      .from('placements')
      .insert({
        code,
        display_name,
        page_pattern,
        default_width,
        default_height,
        default_size,
        allowed_types: allowed_types || ['banner', 'leaderboard', 'hero', 'square', 'small_inline', 'native', 'video', 'html'],
        description,
        priority_group,
        is_active,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log audit
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('ad_audit_logs').insert({
      user_id: user?.id,
      action: 'create',
      entity_type: 'placement',
      entity_id: data.id,
      changes: body,
    });

    return NextResponse.json({ placement: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

