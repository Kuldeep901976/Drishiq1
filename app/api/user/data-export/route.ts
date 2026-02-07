// app/api/user/data-export/route.ts
// GDPR: Data export endpoint

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Export all user data (GDPR compliant)
    const exportData: any = {
      userId,
      exportedAt: new Date().toISOString(),
      data: {}
    };

    // User profile from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    exportData.data.profile = profile;

    // Chat threads
    const { data: threads } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', userId);
    exportData.data.threads = threads;

    // Chat messages
    if (threads && threads.length > 0) {
      const threadIds = threads.map(t => t.id);
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .in('thread_id', threadIds);
      exportData.data.messages = messages;
    }

    // Problems
    const { data: problems } = await supabase
      .from('problems')
      .select('*')
      .eq('user_id', userId);
    exportData.data.problems = problems;

    // Actions
    if (problems && problems.length > 0) {
      const problemIds = problems.map(p => p.id);
      const { data: actions } = await supabase
        .from('actions')
        .select('*')
        .in('problem_id', problemIds);
      exportData.data.actions = actions;
    }

    // Feedback
    const { data: feedback } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', userId);
    exportData.data.feedback = feedback;

    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="drishiq-data-export-${userId}-${Date.now()}.json"`
      }
    });
  } catch (err: any) {
    console.error('Data export error:', err);
    return NextResponse.json(
      { error: 'Failed to export data', details: err.message },
      { status: 500 }
    );
  }
}






