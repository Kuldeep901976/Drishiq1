// app/api/internal/ddsa/stage/[stage]/progress/route.ts
// POST /api/internal/ddsa/stage/[stage]/progress - Record stage progress

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateInternalAuth } from '@/lib/internal-auth';
import audit from '@/lib/audit-db';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ProgressPayload {
  thread_id: string;
  status?: string;
  agent_id?: string;
  dryRun?: boolean;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  state_update?: Record<string, any>;
  error_message?: string;
  error_stack?: string;
  action?: string; // 'runPipeline' to execute full pipeline
  skipStages?: string[]; // For runPipeline action
  force?: boolean; // For runPipeline action
}

async function recordProgress(
  request: NextRequest,
  { params }: { params: Promise<{ stage: string }> | { stage: string } }
) {
  try {
    // Handle Next.js 15 async params
    const resolvedParams = await Promise.resolve(params);
    const stageId = resolvedParams.stage;
    
    const body: ProgressPayload = await request.json();

    const {
      thread_id,
      status = 'running',
      agent_id,
      dryRun = false,
      started_at,
      completed_at,
      duration_ms,
      input_data = {},
      output_data = {},
      state_update = {},
      error_message,
      error_stack
    } = body;

    // Handle runPipeline action (stageId param is ignored for pipeline execution)
    if (body.action === 'runPipeline') {
      if (!body.thread_id && !thread_id) {
        return NextResponse.json(
          { error: 'Missing required field: thread_id' },
          { status: 400 }
        );
      }

      const { DDSAPipelineExecutor } = await import('@/lib/ddsa/pipeline-executor');
      const executor = new DDSAPipelineExecutor();
      
      try {
        const pipelineResult = await executor.executePipeline({
          thread_id: body.thread_id || thread_id,
          dryRun: body.dryRun ?? false,
          skipStages: body.skipStages,
          meta: {
            force: body.force ?? false
          }
        });

        return NextResponse.json({
          ok: true,
          action: 'runPipeline',
          result: pipelineResult
        });
      } catch (error: any) {
        await audit.log('INTERNAL_PROGRESS.PIPELINE_EXECUTION_FAILED', {
          thread_id: body.thread_id || thread_id,
          error: error.message
        });
        return NextResponse.json(
          { error: 'Pipeline execution failed', details: error.message },
          { status: 500 }
        );
      }
    }

    // Validate required fields
    if (!thread_id) {
      await audit.log('INTERNAL_PROGRESS.INVALID_INPUT', { 
        stage: stageId, 
        body,
        error: 'Missing thread_id'
      });
      return NextResponse.json(
        { error: 'Missing required field: thread_id' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'running', 'completed', 'done', 'failed', 'skipped', 'timeout'];
    const normalizedStatus = status === 'done' ? 'completed' : status;
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if stage exists
    const { data: stage, error: stageError } = await supabase
      .from('ddsa_stage_config')
      .select('stage_id')
      .eq('stage_id', stageId)
      .maybeSingle();

    if (stageError || !stage) {
      await audit.log('INTERNAL_PROGRESS.STAGE_NOT_FOUND', { stage_id: stageId });
      return NextResponse.json(
        { error: 'Stage not found', stage_id: stageId },
        { status: 404 }
      );
    }

    // Calculate duration if not provided but both timestamps are
    let calculatedDuration = duration_ms;
    if (!calculatedDuration && started_at && completed_at) {
      const start = new Date(started_at).getTime();
      const end = new Date(completed_at).getTime();
      calculatedDuration = end - start;
    }

    // Handle dry-run mode: write audit but skip ddsa_stage_progress
    if (dryRun) {
      await audit.log('INTERNAL_PROGRESS.DRY_RUN', {
        stage: stageId,
        thread_id,
        status: normalizedStatus,
        agent_id
      });

      return NextResponse.json({
        ok: true,
        dryRun: true,
        stage: stageId,
        status: normalizedStatus
      });
    }

    // Normal mode: UPSERT into ddsa_stage_progress, then write audit
    const progressData: any = {
      thread_id,
      stage_id: stageId,
      status: normalizedStatus,
      input_data,
      output_data,
      state_update,
      error_message,
      error_stack
    };

    if (agent_id) progressData.agent_id = agent_id;
    if (started_at) progressData.started_at = started_at;
    if (completed_at) progressData.completed_at = completed_at;
    if (calculatedDuration) progressData.duration_ms = calculatedDuration;
    if (request.headers.get('x-claim-id')) progressData.claim_id = request.headers.get('x-claim-id');

    // Idempotent upsert using ON CONFLICT on (thread_id, stage_id)
    const { data: progress, error: progressError } = await supabase
      .from('ddsa_stage_progress')
      .upsert(progressData, {
        onConflict: 'thread_id,stage_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (progressError) {
      await audit.log('INTERNAL_PROGRESS.INSERT_FAILED', { 
        stage_id: stageId,
        thread_id,
        error: progressError.message 
      });
      return NextResponse.json(
        { error: 'Failed to record progress', details: progressError.message },
        { status: 500 }
      );
    }

    // Write audit event after successful upsert
    await audit.log('INTERNAL_PROGRESS.RECORDED', {
      stage: stageId,
      thread_id,
      status: normalizedStatus,
      agent_id
    });

    return NextResponse.json({
      ok: true,
      progress,
      stage: stageId,
      status: normalizedStatus
    });
  } catch (error: any) {
    await audit.log('INTERNAL_PROGRESS.ERROR', { 
      error: error.message,
      stack: error.stack 
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stage: string }> | { stage: string } }
) {
  // Authenticate internal callers
  const auth = validateInternalAuth(request);
  
  if (!auth.valid) {
    return NextResponse.json(
      { error: 'Unauthorized', details: auth.error },
      { status: 401 }
    );
  }

  return recordProgress(request, { params });
}


