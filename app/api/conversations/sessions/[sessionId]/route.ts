/**
 * Individual Conversation Session API
 * 
 * GET /api/conversations/sessions/[sessionId] - Get session details
 * PATCH /api/conversations/sessions/[sessionId] - Update session
 * DELETE /api/conversations/sessions/[sessionId] - Archive session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConversationSessionManager } from '@/lib/conversation-session-manager';

// GET /api/conversations/sessions/[sessionId]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> | { sessionId: string } }
) {
  try {
    const { sessionId } = await Promise.resolve(params);
    const userId = req.headers.get('x-user-id');
    
    if (!userId || userId === 'anon') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    const sessionManager = getConversationSessionManager();
    const session = await sessionManager.getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify session belongs to user
    if (session.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      session
    });
  } catch (error: any) {
    console.error('Error getting conversation session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get session' },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/sessions/[sessionId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> | { sessionId: string } }
) {
  try {
    const { sessionId } = await Promise.resolve(params);
    const userId = req.headers.get('x-user-id');
    
    if (!userId || userId === 'anon') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    const sessionManager = getConversationSessionManager();
    const existingSession = await sessionManager.getSession(sessionId);

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify session belongs to user
    if (existingSession.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updatedSession = await sessionManager.updateSession(sessionId, body);

    return NextResponse.json({
      success: true,
      session: updatedSession
    });
  } catch (error: any) {
    console.error('Error updating conversation session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update session' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/sessions/[sessionId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> | { sessionId: string } }
) {
  try {
    const { sessionId } = await Promise.resolve(params);
    const userId = req.headers.get('x-user-id');
    
    if (!userId || userId === 'anon') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    const sessionManager = getConversationSessionManager();
    const existingSession = await sessionManager.getSession(sessionId);

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify session belongs to user
    if (existingSession.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await sessionManager.archiveSession(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Session archived successfully'
    });
  } catch (error: any) {
    console.error('Error archiving conversation session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to archive session' },
      { status: 500 }
    );
  }
}

