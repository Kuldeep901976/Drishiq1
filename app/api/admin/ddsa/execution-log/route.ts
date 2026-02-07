// app/api/admin/ddsa/execution-log/route.ts
// API endpoint to view DDSA stage execution logs

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/ddsa/execution-log
// Get execution logs for a thread or all recent logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('thread_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status'); // optional filter

    let query = supabase
      .from('ddsa_stage_execution_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (threadId) {
      query = query.eq('thread_id', threadId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch execution logs', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ logs: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}












