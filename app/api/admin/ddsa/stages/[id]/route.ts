// app/api/admin/ddsa/stages/[id]/route.ts
// API endpoint for individual stage operations (GET, PUT, DELETE)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/ddsa/stages/[id]
// Get single stage by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('ddsa_stage_config')
      .select('*')
      .eq('stage_id', params.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Stage not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ stage: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/ddsa/stages/[id]
// Update stage configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const updates: any = {};
    if (body.stage_name !== undefined) updates.stage_name = body.stage_name;
    if (body.stage_type !== undefined) updates.stage_type = body.stage_type;
    if (body.position !== undefined) updates.position = body.position;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.is_required !== undefined) updates.is_required = body.is_required;
    if (body.code_files !== undefined) updates.code_files = body.code_files;
    if (body.library_path !== undefined) updates.library_path = body.library_path;
    if (body.config !== undefined) updates.config = body.config;
    if (body.dependencies !== undefined) updates.dependencies = body.dependencies;
    if (body.description !== undefined) updates.description = body.description;
    if (body.icon !== undefined) updates.icon = body.icon;
    if (body.color !== undefined) updates.color = body.color;
    
    // Handle instruction_set_id in metadata
    if (body.instruction_set_id !== undefined) {
      // Get current metadata or create new
      const { data: currentStage } = await supabase
        .from('ddsa_stage_config')
        .select('metadata')
        .eq('stage_id', params.id)
        .single();
      
      const metadata = (currentStage?.metadata as Record<string, any>) || {};
      metadata.instruction_set_id = body.instruction_set_id;
      updates.metadata = metadata;
    }
    
    // Merge metadata if provided
    if (body.metadata !== undefined) {
      const { data: currentStage } = await supabase
        .from('ddsa_stage_config')
        .select('metadata')
        .eq('stage_id', params.id)
        .single();
      
      const existingMetadata = (currentStage?.metadata as Record<string, any>) || {};
      const mergedMetadata = { ...existingMetadata, ...body.metadata };
      updates.metadata = mergedMetadata;
    }

    const { error } = await supabase
      .from('ddsa_stage_config')
      .update(updates)
      .eq('stage_id', params.id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update stage', details: error.message },
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

// DELETE /api/admin/ddsa/stages/[id]
// Delete stage (soft delete by setting is_active = false, or hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    if (hardDelete) {
      // Hard delete
      const { error } = await supabase
        .from('ddsa_stage_config')
        .delete()
        .eq('stage_id', params.id);
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to delete stage', details: error.message },
          { status: 400 }
        );
      }
    } else {
      // Soft delete (disable)
      const { error } = await supabase
        .from('ddsa_stage_config')
        .update({ is_active: false })
        .eq('stage_id', params.id);
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to disable stage', details: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}















