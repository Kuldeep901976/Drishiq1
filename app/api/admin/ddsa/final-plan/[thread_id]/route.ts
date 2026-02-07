// app/api/admin/ddsa/final-plan/[thread_id]/route.ts
// GET /api/admin/ddsa/final-plan/[thread_id]
// Get final plan for a thread

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ thread_id: string }> | { thread_id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const threadId = resolvedParams.thread_id;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    const { data: finalPlan, error: planError } = await supabase
      .from('ddsa_final_plan')
      .select('*')
      .eq('thread_id', threadId)
      .maybeSingle();

    if (planError && planError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to fetch final plan', details: planError.message },
        { status: 500 }
      );
    }

    if (!finalPlan) {
      return NextResponse.json(
        { error: 'Final plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ plan: finalPlan });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}









