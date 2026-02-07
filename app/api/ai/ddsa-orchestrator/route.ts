/**
 * DDSA Orchestrator API Endpoint
 * 
 * Endpoint for agent-enabled pipeline execution
 * POST /api/ai/ddsa-orchestrator
 */

import { NextRequest, NextResponse } from 'next/server';
import { DDSAPipelineExecutor } from '@/lib/ddsa/pipeline-executor';
import { StageInput } from '@/lib/ddsa/stage-router';
import { loadDdsState, saveDdsState } from '@/lib/dds-state';
import { resolveTenantId, setTenantRLS } from '@/app/api/middleware/tenant';
import { orchestratePropagation } from '@/lib/agent/propagation-orchestrator';
import { discoverStakeholders } from '@/lib/agent/tools';

export interface OrchestratorRequest {
  session_id: string;
  thread_id: string;
  issue_summary: string;
  initial_context?: {
    user_profile?: any;
    dds_state?: any;
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Resolve tenant ID
    const tenantId = resolveTenantId(request);
    if (tenantId) {
      await setTenantRLS(tenantId);
    }
    
    const body: OrchestratorRequest = await request.json();
    const {
      session_id,
      thread_id,
      issue_summary,
      initial_context = {}
    } = body;
    
    // Validate required fields
    if (!session_id || !thread_id || !issue_summary) {
      return NextResponse.json(
        { error: 'session_id, thread_id, and issue_summary are required' },
        { status: 400 }
      );
    }
    
    // Load or initialize DDS state
    let ddsState = await loadDdsState(thread_id) || initial_context.dds_state || {};
    
    // Discover stakeholders
    const stakeholders = await discoverStakeholders(issue_summary, thread_id);
    
    // Run propagation for each new stakeholder
    const propagationReports: any[] = [];
    const existingStakeholders = ddsState.stakeholders?.stakeholders || [];
    
    for (const stakeholder of stakeholders) {
      // Check if stakeholder already exists
      const exists = existingStakeholders.some(
        (s: any) => s.name === stakeholder.name
      );
      
      if (!exists) {
        const propagationResult = await orchestratePropagation({
          newStakeholder: stakeholder,
          sessionId: session_id,
          threadId: thread_id
        });
        
        if (propagationResult.success) {
          propagationReports.push(propagationResult.propagationReport);
        }
      }
    }
    
    // Update state with stakeholders
    ddsState.stakeholders = {
      discovered: true,
      stakeholders: [...existingStakeholders, ...stakeholders],
      propagationReports
    };
    
    // Execute pipeline with agent-enabled stages
    const executor = new DDSAPipelineExecutor();
    const input: StageInput = {
      threadId: thread_id,
      userId: initial_context.user_profile?.user_id || 'unknown',
      message: issue_summary,
      ddsState,
      userProfile: initial_context.user_profile || {},
      userType: initial_context.user_profile?.user_type || 'generic',
      language: 'en',
      mode: 'general',
      tenantId
    };
    
    const pipelineResult = await executor.executePipeline(input);
    
    // Save updated state
    if (pipelineResult.finalState) {
      await saveDdsState(thread_id, pipelineResult.finalState, tenantId);
    }
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      ok: true,
      session_id,
      thread_id,
      stages_executed: pipelineResult.executedStages,
      stakeholders: ddsState.stakeholders.stakeholders,
      propagation_reports: propagationReports,
      final_state: pipelineResult.finalState,
      response_time_ms: responseTime
    });
    
  } catch (error: any) {
    // Sanitize error
    const errorMessage = error.message || 'Internal server error';
    const sanitizedError = errorMessage
      .replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED]')
      .replace(/key-[a-zA-Z0-9]{20,}/g, '[REDACTED]');
    
    console.error('❌ Error in /api/ai/ddsa-orchestrator:', sanitizedError);
    
    return NextResponse.json(
      {
        ok: false,
        error: sanitizedError,
        details: process.env.NODE_ENV === 'development' 
          ? error.stack?.replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED]') 
          : undefined
      },
      { status: 500 }
    );
  }
}

