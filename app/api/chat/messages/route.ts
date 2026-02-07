/**
 * GET /api/chat/messages?threadId=...
 * Returns message history for a thread (for UI to load on init).
 * Uses PersistentThreadManager.getMessages(threadId).
 */

import { NextRequest, NextResponse } from 'next/server';
import { PersistentThreadManager } from '@/packages/core/persistent-thread-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

    if (!threadId || threadId.trim() === '') {
      return NextResponse.json(
        { error: 'threadId is required' },
        { status: 400 }
      );
    }

    const threadManager = new PersistentThreadManager();
    const messages = await threadManager.getMessages(threadId, limit);

    return NextResponse.json({
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
  } catch (error) {
    console.error('GET /api/chat/messages error:', error);
    return NextResponse.json(
      { error: 'Failed to load messages' },
      { status: 500 }
    );
  }
}
