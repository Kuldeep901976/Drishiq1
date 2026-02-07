// app/api/internal/ddsa/stage/confirmation/progress/route.ts
// POST /api/internal/ddsa/stage/confirmation/progress
// Record confirmation stage progress (with dryRun support)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateInternalAuth } from '@/lib/internal-auth';
import audit from '@/lib/audit-db';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ConfirmationPayload {
  thread_id: string;
  status?: string;
  agent_id?: string;
  dryRun?: boolean;
  confirmed?: boolean;
  confirmation_data?: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  state_update?: Record<string, any>;
}

async function recordConfirmationProgress(request: NextRequest) {
  try {
    const body: ConfirmationPayload = await request.json();

    const {
      thread_id,
      status = 'running',
      agent_id,
      dryRun = false,
      confirmed,
      confirmation_data = {},
      started_at,
      completed_at,
      duration_ms,
      input_data = {},
      output_data = {},
      state_update = {}
    } = body;

    // Validate required fields
    if (!thread_id) {
      await audit.log('CONFIRMATION_PROGRESS.INVALID_INPUT', { 
        error: 'Missing thread_id',
        body 
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

    // Check if confirmation stage exists
    const { data: stage, error: stageError } = await supabase
      .from('ddsa_stage_config')
      .select('stage_id')
      .eq('stage_id', 'confirmation')
      .maybeSingle();

    if (stageError || !stage) {
      await audit.log('CONFIRMATION_PROGRESS.STAGE_NOT_FOUND', { stage_id: 'confirmation' });
      return NextResponse.json(
        { error: 'Confirmation stage not found' },
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
      await audit.log('CONFIRMATION_PROGRESS.DRY_RUN', {
        stage: 'confirmation',
        thread_id,
        status: normalizedStatus,
        agent_id,
        confirmed
      });

      return NextResponse.json({
        ok: true,
        dryRun: true,
        stage: 'confirmation',
        status: normalizedStatus,
        confirmed
      });
    }

    // Normal mode: UPSERT into ddsa_stage_progress
    const progressData: any = {
      thread_id,
      stage_id: 'confirmation',
      status: normalizedStatus,
      input_data: {
        ...input_data,
        confirmed,
        confirmation_data
      },
      output_data,
      state_update,
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
      await audit.log('CONFIRMATION_PROGRESS.INSERT_FAILED', { 
        stage_id: 'confirmation',
        thread_id,
        error: progressError.message 
      });
      return NextResponse.json(
        { error: 'Failed to record confirmation progress', details: progressError.message },
        { status: 500 }
      );
    }

    // Write audit event after successful upsert
    await audit.log('CONFIRMATION_PROGRESS.RECORDED', {
      stage: 'confirmation',
      thread_id,
      status: normalizedStatus,
      agent_id,
      confirmed
    });

    return NextResponse.json({
      ok: true,
      progress,
      stage: 'confirmation',
      status: normalizedStatus,
      confirmed
    });
  } catch (error: any) {
    await audit.log('CONFIRMATION_PROGRESS.ERROR', { 
      error: error.message,
      stack: error.stack 
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Authenticate internal callers
  const auth = validateInternalAuth(request);
  
  if (!auth.valid) {
    return NextResponse.json(
      { error: 'Unauthorized', details: auth.error },
      { status: 401 }
    );
  }

  return recordConfirmationProgress(request);
}









