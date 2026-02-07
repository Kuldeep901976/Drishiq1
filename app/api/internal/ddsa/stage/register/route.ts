// app/api/internal/ddsa/stage/register/route.ts
// POST /internal/ddsa/stage/register - Register a new stage

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateInternalAuth } from '@/lib/internal-auth';
import audit from '@/lib/audit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function registerStage(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      stage_id,
      stage_name,
      stage_type = 'processing',
      position = 0,
      is_active = false,
      is_required = false,
      code_files = [],
      entry_point,
      library_path,
      config = {},
      dependencies = [],
      description,
      icon = '📋',
      color = '#4CAF50'
    } = body;

    if (!stage_id || !stage_name) {
      audit.log('STAGE_REGISTER.INVALID_INPUT', { body });
      return NextResponse.json(
        { error: 'Missing required fields: stage_id, stage_name' },
        { status: 400 }
      );
    }

    // Check if stage already exists
    const { data: existing } = await supabase
      .from('ddsa_stage_config')
      .select('stage_id')
      .eq('stage_id', stage_id)
      .maybeSingle();

    if (existing) {
      audit.log('STAGE_REGISTER.ALREADY_EXISTS', { stage_id });
      return NextResponse.json(
        { 
          error: 'Stage already exists',
          stage_id,
          message: 'Use PATCH /internal/ddsa/stage/:id to update existing stage'
        },
        { status: 409 }
      );
    }

    // Insert stage (idempotent with ON CONFLICT)
    const { data: newStage, error: insertError } = await supabase
      .from('ddsa_stage_config')
      .insert({
        stage_id,
        stage_name,
        stage_type,
        position,
        is_active,
        is_required,
        code_files,
        entry_point,
        library_path,
        config,
        dependencies,
        description,
        icon,
        color
      })
      .select()
      .single();

    if (insertError) {
      audit.log('STAGE_REGISTER.INSERT_FAILED', { 
        stage_id, 
        error: insertError.message 
      });
      return NextResponse.json(
        { error: 'Failed to register stage', details: insertError.message },
        { status: 400 }
      );
    }

    // Insert dependencies if provided
    if (dependencies && Array.isArray(dependencies) && dependencies.length > 0) {
      const depsToInsert = dependencies.map((dep: string | { stage_id: string; type?: string }) => {
        const depId = typeof dep === 'string' ? dep : dep.stage_id;
        const depType = typeof dep === 'object' ? (dep.type || 'required') : 'required';
        return {
          stage_id,
          depends_on_stage_id: depId,
          dependency_type: depType
        };
      });

      const { error: depsError } = await supabase
        .from('ddsa_stage_dependencies')
        .upsert(depsToInsert, { 
          onConflict: 'stage_id,depends_on_stage_id',
          ignoreDuplicates: false 
        });

      if (depsError) {
        audit.log('STAGE_REGISTER.DEPS_FAILED', { 
          stage_id, 
          error: depsError.message 
        });
        // Don't fail the request, just log
      }
    }

    audit.log('STAGE_REGISTER.SUCCESS', { 
      stage_id,
      stage_name,
      agent: request.headers.get('x-agent-id') || 'unknown'
    });

    return NextResponse.json({ 
      success: true,
      stage: newStage,
      message: `Stage '${stage_id}' registered successfully`
    });
  } catch (error: any) {
    audit.log('STAGE_REGISTER.ERROR', { error: error.message });
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = validateInternalAuth(request);
  
  if (!auth.valid) {
    return NextResponse.json(
      { error: 'Unauthorized', details: auth.error },
      { status: 401 }
    );
  }

  return registerStage(request);
}

