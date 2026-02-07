import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/chat?action=stats|sessions|activity|providers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    // Get authenticated user
    const authResponse = await supabase.auth.getUser();
    if (!authResponse.data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate admin access
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type, is_active')
      .eq('id', authResponse.data.user.id)
      .single();

    if (userError || userData?.user_type !== 'admin' || !userData?.is_active) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    switch (action) {
      case 'stats':
        return await getChatStats();
      case 'sessions':
        return await getRecentSessions();
      case 'activity':
        return await getRecentActivity();
      case 'providers':
        return await getProviderStats();
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Admin chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/chat (for session actions)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, session_id } = body;

    // Get authenticated user
    const authResponse = await supabase.auth.getUser();
    if (!authResponse.data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate admin access
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type, is_active')
      .eq('id', authResponse.data.user.id)
      .single();

    if (userError || userData?.user_type !== 'admin' || !userData?.is_active) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    switch (action) {
      case 'pause':
        return await pauseSession(session_id, authResponse.data.user.id);
      case 'terminate':
        return await terminateSession(session_id, authResponse.data.user.id);
      case 'view':
        return await getSessionDetails(session_id);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Admin chat POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getChatStats() {
  try {
    // Get session statistics from chat_sessions table
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('status, created_at, tokens_used, cost_usd, metadata');

    if (sessionsError && sessionsError.code !== 'PGRST116') {
      throw sessionsError;
    }

    const sessions = sessionsData || [];
    
    // Calculate stats
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const totalMessages = sessions.reduce((sum, s) => sum + (s.tokens_used || 0), 0);
    
    // Calculate average session duration
    const sessionsWithDuration = sessions.filter(s => s.metadata?.duration);
    const avgDuration = sessionsWithDuration.length > 0 
      ? sessionsWithDuration.reduce((sum, s) => sum + (s.metadata.duration || 0), 0) / sessionsWithDuration.length
      : 0;

    // Get stage usage (if metadata contains stage info)
    const stageUsage: { [key: string]: number } = {};
    sessions.forEach(session => {
      if (session.metadata?.stage) {
        stageUsage[session.metadata.stage] = (stageUsage[session.metadata.stage] || 0) + 1;
      }
    });

    const mostUsedStages = Object.entries(stageUsage)
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        total_sessions: totalSessions,
        active_sessions: activeSessions,
        completed_sessions: completedSessions,
        total_messages: totalMessages,
        avg_session_duration: Math.round(avgDuration),
        most_used_stages: mostUsedStages
      }
    });

  } catch (error) {
    console.error('Error fetching chat stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

async function getRecentSessions() {
  try {
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select(`
        id,
        user_id,
        tokens_used,
        status,
        created_at,
        updated_at,
        completed_at,
        metadata,
        users!inner (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Transform data to match expected format
    const formattedSessions = (sessions || []).map((s: any) => ({
      id: s.id,
      user_id: s.user_id,
      thread_id: s.metadata?.thread_id || s.id.slice(0, 8),
      session_type: s.metadata?.session_type || 'chat',
      stage: s.metadata?.stage || 'UNKNOWN',
      domain_of_life: s.metadata?.domain_of_life || 'general',
      language: s.metadata?.language || 'en',
      status: s.status,
      message_count: s.tokens_used || 0,
      duration_minutes: s.metadata?.duration || 0,
      created_at: s.created_at,
      updated_at: s.updated_at,
      last_message_at: s.updated_at,
      users: (s.users as any) ? {
        name: (s.users as any).name || 'Unknown',
        email: (s.users as any).email || 'No email'
      } : null
    }));

    return NextResponse.json({
      success: true,
      data: formattedSessions
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

async function getRecentActivity() {
  try {
    // Get audit trail for chat activities
    const { data: auditData, error: auditError } = await supabase
      .from('token_usage_audit')
      .select(`
        id,
        user_id,
        purpose,
        session_id,
        created_at,
        metadata,
        users (
          name,
          email
        )
      `)
      .eq('source', 'user_action')
      .like('purpose', '%chat%')
      .order('created_at', { ascending: false })
      .limit(20);

    if (auditError && auditError.code !== 'PGRST116') {
      // If audit table doesn't exist yet, return empty activity
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Transform audit data to activity format
    const formattedActivity = (auditData || []).map((audit: any) => {
      const purpose = audit.purpose || 'unknown_action';
      let action = 'unknown_action';
      let details = 'Unknown activity';

      if (purpose.includes('session_start')) {
        action = 'session_started';
        details = `${(audit.users as any)?.name || 'User'} started a new chat session`;
      } else if (purpose.includes('stage_change')) {
        action = 'stage_changed';
        details = `${(audit.users as any)?.name || 'User'} advanced to next stage`;
      } else if (purpose.includes('message')) {
        action = 'session_completed';
        details = `${(audit.users as any)?.name || 'User'} sent a message`;
      } else if (purpose.includes('chat')) {
        action = 'session_started';
        details = `${(audit.users as any)?.name || 'User'} used chat functionality`;
      }

      return {
        id: audit.id,
        user_name: (audit.users as any)?.name || 'Unknown',
        action: action,
        session_id: audit.session_id || audit.id.slice(0, 8),
        timestamp: audit.created_at,
        details: details
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedActivity
    });

  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}

async function getProviderStats() {
  try {
    // Mock provider stats since the actual chat module might use different providers
    // In a real implementation, this would query the chat module's provider statistics
    const providers = [
      {
        provider: 'OpenAI',
        usage_count: 1250,
        avg_response_time: 2.3,
        success_rate: 98.5
      },
      {
        provider: 'Anthropic',
        usage_count: 780,
        avg_response_time: 3.1,
        success_rate: 97.2
      },
      {
        provider: 'Grok',
        usage_count: 245,
        avg_response_time: 1.8,
        success_rate: 99.1
      }
    ];

    return NextResponse.json({
      success: true,
      data: providers
    });

  } catch (error) {
    console.error('Error fetching provider stats:', error);
    return NextResponse.json({ error: 'Failed to fetch provider stats' }, { status: 500 });
  }
}

async function pauseSession(sessionId: string, adminId: string) {
  try {
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Update session status to paused
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({ 
        status: 'paused',
        updated_at: new Date().toISOString(),
        metadata: {
          paused_by_admin: adminId,
          paused_at: new Date().toISOString()
        }
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the admin action
    await supabase
      .from('access_control_logs')
      .insert({
        user_id: data?.user_id,
        performed_by: adminId,
        action: 'chat_session_paused',
        reason: 'Admin intervention'
      });

    return NextResponse.json({
      success: true,
      message: 'Session paused successfully'
    });

  } catch (error) {
    console.error('Error pausing session:', error);
    return NextResponse.json({ error: 'Failed to pause session' }, { status: 500 });
  }
}

async function terminateSession(sessionId: string, adminId: string) {
  try {
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Update session status to completed/terminated
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          terminated_by_admin: adminId,
          terminated_at: new Date().toISOString(),
          termination_reason: 'Admin intervention'
        }
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the admin action
    await supabase
      .from('access_control_logs')
      .insert({
        user_id: data?.user_id,
        performed_by: adminId,
        action: 'chat_session_terminated',
        reason: 'Admin intervention'
      });

    return NextResponse.json({
      success: true,
      message: 'Session terminated successfully'
    });

  } catch (error) {
    console.error('Error terminating session:', error);
    return NextResponse.json({ error: 'Failed to terminate session' }, { status: 500 });
  }
}

async function getSessionDetails(sessionId: string) {
  try {
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get detailed session information
    const { data: session, error } = await supabase
      .from('chat_sessions')
      .select(`
        id,
        user_id,
        tokens_used,
        status,
        created_at,
        updated_at,
        completed_at,
        cost_usd,
        metadata,
        users!inner (
          id,
          name,
          email
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('Error fetching session details:', error);
    return NextResponse.json({ error: 'Failed to fetch session details' }, { status: 500 });
  }
}
