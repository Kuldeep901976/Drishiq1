import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// GET /api/chat/pending-session?userId=...
// Read-only: returns whether a non-expired pending session exists and its identifiers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Find the most recent pending deduction that is not expired
    const { data, error } = await supabase
      .from('pending_credit_deductions')
      .select('id, session_id, thread_id, deduction_status, auto_release_at')
      .eq('user_id', userId)
      .eq('deduction_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching pending session:', error);
      return NextResponse.json({ hasPending: false });
    }

    const pending = (data && data.length > 0) ? data[0] : null;

    // Treat as active only if not expired (auto_release_at is null or > now)
    const now = new Date();
    const notExpired = pending && (!pending.auto_release_at || new Date(pending.auto_release_at) > now);

    if (!pending || !notExpired) {
      return NextResponse.json({ hasPending: false });
    }

    return NextResponse.json({
      hasPending: true,
      sessionId: pending.session_id || null,
      threadId: pending.thread_id || null
    });
  } catch (e) {
    console.error('pending-session API error:', e);
    return NextResponse.json({ hasPending: false });
  }
}
















