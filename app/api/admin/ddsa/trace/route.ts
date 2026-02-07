// app/api/admin/ddsa/trace/route.ts
// API endpoint to fetch DDSA private trace data (breadcrumbs, spans, provenance)

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DDSBreadcrumb, DDSDecisionSpan, DDSStatePrivate } from '@/lib/ddsa/private-trace';

// GET /api/admin/ddsa/trace?thread_id=xxx&action=breadcrumbs|spans|all|analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('thread_id');
    const action = searchParams.get('action') || 'all';
    
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

    if (!threadId) {
      return NextResponse.json({ error: 'thread_id is required' }, { status: 400 });
    }

    // Fetch conversation session
    const { data: session, error: sessionError } = await supabase
      .from('conversation_sessions')
      .select('metadata, id, user_id, session_title, created_at, last_activity_at')
      .eq('id', threadId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Extract private trace data from metadata
    const metadata = session.metadata || {};
    const ddsState = metadata.ddsa_state || metadata.dds_state || {};
    const privateData: DDSStatePrivate = ddsState.private || {
      breadcrumbs: [],
      decision_spans: [],
      provenance: { edges: [] }
    };

    switch (action) {
      case 'breadcrumbs':
        return NextResponse.json({
          thread_id: threadId,
          session_title: session.session_title,
          breadcrumbs: privateData.breadcrumbs || []
        });

      case 'spans':
        return NextResponse.json({
          thread_id: threadId,
          session_title: session.session_title,
          spans: privateData.decision_spans || []
        });

      case 'provenance':
        return NextResponse.json({
          thread_id: threadId,
          session_title: session.session_title,
          provenance: privateData.provenance || { edges: [] }
        });

      case 'analytics':
        return NextResponse.json({
          thread_id: threadId,
          session_title: session.session_title,
          analytics: computeAnalytics(privateData)
        });

      case 'all':
      default:
        return NextResponse.json({
          thread_id: threadId,
          session_title: session.session_title,
          created_at: session.created_at,
          last_activity_at: session.last_activity_at,
          breadcrumbs: privateData.breadcrumbs || [],
          spans: privateData.decision_spans || [],
          provenance: privateData.provenance || { edges: [] },
          analytics: computeAnalytics(privateData)
        });
    }

  } catch (error: any) {
    console.error('Admin DDSA trace API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Compute analytics from trace data
 */
function computeAnalytics(privateData: DDSStatePrivate) {
  const breadcrumbs = privateData.breadcrumbs || [];
  const spans = privateData.decision_spans || [];

  // Breadcrumb actions by stage
  const actionsByStage: Record<string, Record<string, number>> = {};
  breadcrumbs.forEach(b => {
    if (!actionsByStage[b.stage]) {
      actionsByStage[b.stage] = {};
    }
    actionsByStage[b.stage][b.action] = (actionsByStage[b.stage][b.action] || 0) + 1;
  });

  // Span durations by stage
  const spanDurations: Record<string, number[]> = {};
  spans.forEach(s => {
    if (s.duration_ms !== undefined) {
      if (!spanDurations[s.stage]) {
        spanDurations[s.stage] = [];
      }
      spanDurations[s.stage].push(s.duration_ms);
    }
  });

  // Average durations
  const avgDurations: Record<string, number> = {};
  Object.entries(spanDurations).forEach(([stage, durations]) => {
    avgDurations[stage] = durations.reduce((a, b) => a + b, 0) / durations.length;
  });

  // Outcomes by stage
  const outcomesByStage: Record<string, Record<string, number>> = {};
  spans.forEach(s => {
    if (s.outcome) {
      if (!outcomesByStage[s.stage]) {
        outcomesByStage[s.stage] = {};
      }
      outcomesByStage[s.stage][s.outcome] = (outcomesByStage[s.stage][s.outcome] || 0) + 1;
    }
  });

  // Confidence distribution
  const confidences = breadcrumbs
    .map(b => b.confidence)
    .filter((c): c is number => c !== undefined);
  const avgConfidence = confidences.length > 0
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : undefined;

  return {
    total_breadcrumbs: breadcrumbs.length,
    total_spans: spans.length,
    actions_by_stage: actionsByStage,
    avg_durations_ms: avgDurations,
    outcomes_by_stage: outcomesByStage,
    avg_confidence: avgConfidence,
    provenance_edges: privateData.provenance?.edges?.length || 0
  };
}

