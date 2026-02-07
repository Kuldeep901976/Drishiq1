// app/api/admin/ddsa/stages/[id]/execute/route.ts
// API endpoint to test individual stage execution

import { NextRequest, NextResponse } from 'next/server';
import { DDSAPipelineExecutor } from '@/lib/ddsa/pipeline-executor';
import { StageInput } from '@/lib/ddsa/stage-router';
import { loadAllStagesFromDB } from '@/lib/ddsa/stage-registry';

// POST /api/admin/ddsa/stages/[id]/execute
// Test execution of a single stage
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { testData } = body;

    // Get stage
    const stages = await loadAllStagesFromDB();
    const stage = stages.find((s: any) => s.id === params.id);

    if (!stage) {
      return NextResponse.json(
        { error: `Stage ${params.id} not found` },
        { status: 404 }
      );
    }

    // Prepare input
    const input: StageInput = {
      threadId: testData?.threadId || 'test-thread',
      userId: testData?.userId || 'test-user',
      message: testData?.message,
      ddsState: testData?.ddsState || {},
      userProfile: testData?.userProfile || {},
      userType: testData?.userType || 'generic',
      language: testData?.language || 'en',
      mode: testData?.mode || 'general'
    };

    // Execute just this stage (if registered)
    // For now, return stage info and simulate execution
    return NextResponse.json({
      stageId: params.id,
      stageName: stage.name,
      input: input,
      message: 'Stage execution test - check logs for actual execution',
      note: 'Full execution happens via pipeline executor in /api/chat'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to execute stage', details: error.message },
      { status: 500 }
    );
  }
}












