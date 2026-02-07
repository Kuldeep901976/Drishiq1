// app/api/admin/ddsa/stages/reorder/route.ts
// API endpoint for reordering stages (drag-drop)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/admin/ddsa/stages/reorder
// Reorder stages based on new positions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stages } = body; // [{ stageId: string, position: number }]

    if (!Array.isArray(stages)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected array of stages.' },
        { status: 400 }
      );
    }

    // Update positions in a transaction-like manner
    const updates = stages.map(({ stageId, position }) =>
      supabase
        .from('ddsa_stage_config')
        .update({ position })
        .eq('stage_id', stageId)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error);

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Failed to update some stages', details: errors },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, updated: stages.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}












