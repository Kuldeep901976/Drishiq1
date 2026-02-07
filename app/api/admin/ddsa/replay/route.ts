// app/api/admin/ddsa/replay/route.ts
/**
 * Thread Replay Engine
 * Replays pipeline execution from trace data without external calls
 * 
 * Supports both App Router (NextRequest/NextResponse) and can be adapted for Pages Router
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/app/api/middleware/admin-auth';
import { replayThread } from '@/lib/ddsa/replay-engine';
import { parseDebugFlags } from '@/lib/ddsa/debug-flags';
import type { ReplayOptions } from '@/lib/ddsa/replay-types';

/**
 * GET: Replay a thread
 */

/**
 * GET: Replay a thread
 */
async function getReplay(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const traceId = searchParams.get('traceId');
  const threadId = searchParams.get('threadId');
  const mode = (searchParams.get('mode') || 'full') as ReplayOptions['mode'];
  const skipExternal = searchParams.get('skipExternal') === 'true';

  if (!traceId && !threadId) {
    return NextResponse.json(
      { error: 'traceId or threadId is required' },
      { status: 400 }
    );
  }

  // If threadId provided, find latest traceId
  let actualTraceId = traceId;
  if (!actualTraceId && threadId) {
    const supabase = createServiceClient();
    const { data: latestTrace } = await supabase
      .from('audit_logs')
      .select('data')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latestTrace?.data && typeof latestTrace.data === 'object' && 'traceId' in latestTrace.data) {
      actualTraceId = (latestTrace.data as any).traceId;
    } else {
      return NextResponse.json(
        { error: `No trace found for threadId: ${threadId}` },
        { status: 404 }
      );
    }
  }

  if (!actualTraceId) {
    return NextResponse.json(
      { error: 'Could not determine traceId' },
      { status: 400 }
    );
  }

  const debugFlags = parseDebugFlags(request);
  
  try {
    const result = await replayThread(actualTraceId, {
      mode,
      skipExternalCalls: skipExternal,
      debugFlags
    });

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error('Replay route error', err);
    return NextResponse.json(
      { error: err.message || 'internal error' },
      { status: 500 }
    );
  }
}

/**
 * POST: Replay with custom options
 */
async function postReplay(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { traceId, mode = 'full', skipExternalCalls = false } = body;

  if (!traceId || typeof traceId !== 'string') {
    return NextResponse.json(
      { error: 'traceId required' },
      { status: 400 }
    );
  }

  try {
    const options: ReplayOptions = {
      mode: String(mode) as any,
      skipExternalCalls: String(skipExternalCalls) === 'true',
      requestingUser: (request as any).adminUser || null
    };

    const result = await replayThread(traceId, options);
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error('Replay route error', err);
    return NextResponse.json(
      { error: err.message || 'internal error' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(getReplay);
export const POST = withAdminAuth(postReplay);

