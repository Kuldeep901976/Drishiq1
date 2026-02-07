/**
 * Runtime API: Get Placements
 * Returns list of active placements for client-side rendering
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(request);

    const { data, error } = await supabase
      .from('placements')
      .select('id, code, display_name, default_width, default_height, default_size, allowed_types')
      .eq('is_active', true)
      .order('priority_group', { ascending: true })
      .order('code', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add cache headers
    const response = NextResponse.json({ placements: data || [] });
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

