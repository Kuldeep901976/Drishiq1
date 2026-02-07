// app/api/admin/ddsa/thread/[id]/state/route.ts
// API endpoint to get DDS state for a thread

import { NextRequest, NextResponse } from 'next/server';
import { loadDdsState } from '@/lib/dds-state';

// GET /api/admin/ddsa/thread/[id]/state
// Get current DDS state for a thread
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    const ddsState = await loadDdsState(threadId);

    if (!ddsState) {
      return NextResponse.json(
        { error: 'State not found for this thread' },
        { status: 404 }
      );
    }

    return NextResponse.json({ state: ddsState });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}












