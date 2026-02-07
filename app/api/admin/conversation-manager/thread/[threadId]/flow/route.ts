/**
 * API endpoint to get stage execution flow for a specific thread
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStageExecutionFlow } from '@/lib/conversation-manager-admin-integration';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> | { threadId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const threadId = resolvedParams.threadId;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    const flow = await getStageExecutionFlow(threadId);

    return NextResponse.json(flow);
  } catch (error: any) {
    console.error('Error getting thread flow:', error);
    return NextResponse.json(
      { error: 'Failed to get flow', details: error.message },
      { status: 500 }
    );
  }
}

