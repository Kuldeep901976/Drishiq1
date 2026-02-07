/**
 * API endpoint to get list of threads for selection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get threads with DDSA state
    const { data: threads, error } = await supabase
      .from('chat_threads')
      .select('id, user_id, created_at, dds_state')
      .not('dds_state', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch threads', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      threads: (threads || []).map(t => ({
        thread_id: t.id,
        user_id: t.user_id,
        created_at: t.created_at,
        has_dds_state: !!t.dds_state
      }))
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

