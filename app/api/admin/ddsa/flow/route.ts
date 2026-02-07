// app/api/admin/ddsa/flow/route.ts
// API endpoint for DDSA flow visualization with progress tracking

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/ddsa/flow
// Returns all stages with their progress status (claimed/approved/done)
export async function GET(request: NextRequest) {
  try {
    // Get all stages ordered by position
    const { data: stages, error: stagesError } = await supabase
      .from('ddsa_stage_config')
      .select('*')
      .order('position', { ascending: true });

    if (stagesError) {
      return NextResponse.json(
        { error: 'Failed to fetch stages', details: stagesError.message },
        { status: 500 }
      );
    }

    // Get workboard claims for each stage (claimed/approved/done status)
    const stageIds = stages?.map(s => s.stage_id) || [];
    let claims: any[] = [];
    
    if (stageIds.length > 0) {
      const { data: claimsData } = await supabase
        .from('ddsa_workboard_claims')
        .select('stage_name, agent_id, branch_name, status, claim_status, claimed_at, released_at, metadata, updated_at')
        .in('stage_name', stageIds)
        .order('claimed_at', { ascending: false }); // Get most recent claim per stage
      claims = claimsData || [];
    }

    // Create claims map (one claim per stage - most recent)
    const claimsMap = new Map<string, any>();
    for (const claim of claims) {
      if (!claimsMap.has(claim.stage_name)) {
        // Map claim status to UI progress status
        let progressStatus: 'pending' | 'claimed' | 'approved' | 'done' = 'pending';
        if (claim.status === 'completed') {
          progressStatus = 'done';
        } else if (claim.claim_status === 'approved') {
          progressStatus = 'approved';
        } else if (claim.status === 'active') {
          progressStatus = 'claimed';
        }

        claimsMap.set(claim.stage_name, {
          status: progressStatus,
          claimed_by: claim.agent_id,
          claimed_at: claim.claimed_at,
          approved_at: claim.metadata?.approved_at || (claim.claim_status === 'approved' ? claim.updated_at : null),
          completed_at: claim.status === 'completed' ? claim.released_at : null,
          claim_status: claim.claim_status || 'pending',
          branch_name: claim.branch_name,
          released_at: claim.released_at
        });
      }
    }

    // Get progress counts from ddsa_stage_progress table
    const { data: progressCounts, error: progressError } = await supabase
      .from('ddsa_stage_progress')
      .select('stage_id, status')
      .in('stage_id', stageIds);

    // Aggregate progress counts by stage_id and status
    const progressMap = new Map<string, { [status: string]: number }>();
    
    if (progressCounts) {
      for (const progress of progressCounts) {
        if (!progressMap.has(progress.stage_id)) {
          progressMap.set(progress.stage_id, {});
        }
        const counts = progressMap.get(progress.stage_id)!;
        counts[progress.status] = (counts[progress.status] || 0) + 1;
      }
    }

    // Get last audit timestamp per stage from ddsa_audit_logs
    // Look for events like STAGE_PROGRESS.* with payload containing stage_id
    const { data: auditLogs } = await supabase
      .from('ddsa_audit_logs')
      .select('event_name, payload, created_at')
      .like('event_name', 'STAGE_PROGRESS%')
      .order('created_at', { ascending: false })
      .limit(1000); // Get recent audit logs

    // Map stage_id to most recent audit timestamp
    const auditTimestampMap = new Map<string, string>();
    
    if (auditLogs) {
      for (const log of auditLogs) {
        const payload = log.payload as any;
        const stageId = payload?.stage_id || payload?.stage;
        
        if (stageId && stageIds.includes(stageId) && !auditTimestampMap.has(stageId)) {
          auditTimestampMap.set(stageId, log.created_at);
        }
      }
    }

    // Combine stages with claim/progress information, progress counts, and audit timestamps
    const stagesWithProgress = stages?.map(stage => {
      const claim = claimsMap.get(stage.stage_id);
      const progressCount = progressMap.get(stage.stage_id) || {};
      const totalProgressCount = Object.values(progressCount).reduce((sum, count) => sum + count, 0);
      const lastAuditTimestamp = auditTimestampMap.get(stage.stage_id) || null;
      
      return {
        ...stage,
        progress: claim || {
          status: 'pending' as const,
          claimed_by: null,
          claimed_at: null,
          approved_at: null,
          completed_at: null,
          claim_status: 'pending',
          branch_name: null,
          released_at: null
        },
        progressCounts: {
          pending: progressCount.pending || 0,
          running: progressCount.running || 0,
          completed: progressCount.completed || 0,
          done: progressCount.done || 0,
          failed: progressCount.failed || 0,
          skipped: progressCount.skipped || 0,
          timeout: progressCount.timeout || 0,
          paused: progressCount.paused || 0,
          total: totalProgressCount
        },
        lastAuditTimestamp
      };
    }) || [];

    return NextResponse.json({
      stages: stagesWithProgress,
      total: stagesWithProgress.length,
      active: stagesWithProgress.filter(s => s.is_active).length
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
