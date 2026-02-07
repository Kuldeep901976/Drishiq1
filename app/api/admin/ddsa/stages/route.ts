// app/api/admin/ddsa/stages/route.ts
// API endpoint for DDSA stage configuration CRUD operations

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/ddsa/stages
// Get all stages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = supabase
      .from('ddsa_stage_config')
      .select('*')
      .order('position', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch stages', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ stages: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/ddsa/stages
// Create new stage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract instruction_set_id if provided
    const { instruction_set_id, ...stageData } = body;
    
    // Prepare config and metadata
    const config = stageData.config || {};
    const metadata: Record<string, any> = {};
    
    // Store instruction_set_id in metadata (to avoid schema changes)
    if (instruction_set_id) {
      metadata.instruction_set_id = instruction_set_id;
    }
    
    // Merge existing metadata if present
    if (stageData.metadata) {
      Object.assign(metadata, stageData.metadata);
    }
    
    const { error } = await supabase
      .from('ddsa_stage_config')
      .insert({
        stage_id: stageData.stage_id,
        stage_name: stageData.stage_name,
        stage_type: stageData.stage_type,
        position: stageData.position ?? 0,
        is_active: stageData.is_active ?? true,
        is_required: stageData.is_required ?? false,
        code_files: stageData.code_files ?? [],
        entry_point: stageData.entry_point,
        library_path: stageData.library_path,
        config: config,
        dependencies: stageData.dependencies ?? [],
        description: stageData.description,
        icon: stageData.icon ?? '📋',
        color: stageData.color ?? '#4CAF50',
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create stage', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}















