/**
 * Conversation Sessions Statistics API
 * 
 * GET /api/conversations/sessions/stats - Get session statistics for user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConversationSessionManager } from '@/lib/conversation-session-manager';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId');
    
    if (!userId || userId === 'anon') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    const sessionManager = getConversationSessionManager();
    const stats = await sessionManager.getSessionStats(userId);

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Error getting session statistics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get statistics' },
      { status: 500 }
    );
  }
}

