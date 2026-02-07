/**
 * Server-only: save onboarding conversation.
 * Conversation is stored in chat_messages; this route is a no-op for compatibility.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { threadId } = body;

    if (!threadId) {
      return NextResponse.json(
        { ok: false, error: 'threadId is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to save conversation' },
      { status: 500 }
    );
  }
}
