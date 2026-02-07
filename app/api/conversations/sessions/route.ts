/**
 * Conversation Sessions API
 * 
 * GET /api/conversations/sessions - List user's conversation sessions
 * POST /api/conversations/sessions - Create a new session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConversationSessionManager } from '@/lib/conversation-session-manager';

// GET /api/conversations/sessions
// List all conversation sessions for the current user
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
    
    // Get query parameters
    const status = req.nextUrl.searchParams.get('status') as any;
    const category = req.nextUrl.searchParams.get('category');
    const tags = req.nextUrl.searchParams.get('tags')?.split(',');
    const search = req.nextUrl.searchParams.get('search');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');
    const orderBy = req.nextUrl.searchParams.get('orderBy') as any || 'last_activity_at';
    const order = req.nextUrl.searchParams.get('order') as 'asc' | 'desc' || 'desc';

    let result;
    
    if (search) {
      // Text search
      result = await sessionManager.searchSessions(userId, search, { limit, offset });
    } else {
      // Filtered list
      result = await sessionManager.listSessions(userId, {
        status,
        category,
        tags,
        limit,
        offset,
        orderBy,
        order
      });
    }

    return NextResponse.json({
      success: true,
      sessions: result.sessions,
      total: result.total,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('Error listing conversation sessions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list sessions' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/sessions
// Create a new conversation session
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    
    if (!userId || userId === 'anon') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { threadId, sessionTitle, sessionType, tags, category, priority, metadata, isCurrentSession } = body;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    const sessionManager = getConversationSessionManager();
    const session = await sessionManager.createSession({
      userId,
      threadId,
      sessionTitle,
      sessionType,
      tags,
      category,
      priority,
      metadata,
      isCurrentSession: isCurrentSession !== undefined ? isCurrentSession : false
    });

    return NextResponse.json({
      success: true,
      session
    });
  } catch (error: any) {
    console.error('Error creating conversation session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create session' },
      { status: 500 }
    );
  }
}

