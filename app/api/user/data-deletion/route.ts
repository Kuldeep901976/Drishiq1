// app/api/user/data-deletion/route.ts
// GDPR: Right to deletion endpoint

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const userId = req.headers.get('x-user-id') || (await req.json()).userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Verify deletion request (in production, require additional auth)
    const confirmation = req.headers.get('x-deletion-confirmed');
    if (confirmation !== 'true') {
      return NextResponse.json(
        { error: 'Deletion confirmation required. Set X-Deletion-Confirmed: true' },
        { status: 400 }
      );
    }

    // Audit log before deletion
    try {
      await supabase.from('data_deletion_audit').insert({
        user_id: userId,
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        scope: 'full_account_deletion'
      });
    } catch (e) {
      // Audit table may not exist - log but continue
      console.warn('⚠️ data_deletion_audit table may not exist');
    }

    // Delete in order (respect foreign key constraints)
    const deletionResults: any = {};

    // 1. Actions (child of problems)
    const { data: problems } = await supabase
      .from('problems')
      .select('id')
      .eq('user_id', userId);
    
    if (problems && problems.length > 0) {
      const problemIds = problems.map(p => p.id);
      const { error: actionsErr } = await supabase
        .from('actions')
        .delete()
        .in('problem_id', problemIds);
      deletionResults.actions = actionsErr ? 'failed' : 'deleted';
    }

    // 2. Problems
    const { error: problemsErr } = await supabase
      .from('problems')
      .delete()
      .eq('user_id', userId);
    deletionResults.problems = problemsErr ? 'failed' : 'deleted';

    // 3. Messages (child of threads)
    const { data: threads } = await supabase
      .from('chat_threads')
      .select('id')
      .eq('user_id', userId);
    
    if (threads && threads.length > 0) {
      const threadIds = threads.map(t => t.id);
      const { error: messagesErr } = await supabase
        .from('chat_messages')
        .delete()
        .in('thread_id', threadIds);
      deletionResults.messages = messagesErr ? 'failed' : 'deleted';
    }

    // 4. Threads
    const { error: threadsErr } = await supabase
      .from('chat_threads')
      .delete()
      .eq('user_id', userId);
    deletionResults.threads = threadsErr ? 'failed' : 'deleted';

    // 5. Feedback
    const { error: feedbackErr } = await supabase
      .from('feedback')
      .delete()
      .eq('user_id', userId);
    deletionResults.feedback = feedbackErr ? 'failed' : 'deleted';

    // 6. User profile from profiles table (last, may have other dependencies)
    const { error: profileErr } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    deletionResults.profile = profileErr ? 'failed' : 'deleted';

    // Check for failures
    const failures = Object.entries(deletionResults)
      .filter(([_, status]) => status === 'failed')
      .map(([table, _]) => table);

    if (failures.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Partial deletion - some tables failed',
        deletionResults,
        failures
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User data deleted successfully',
      deletionResults,
      deletedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Data deletion error:', err);
    return NextResponse.json(
      { error: 'Failed to delete data', details: err.message },
      { status: 500 }
    );
  }
}






