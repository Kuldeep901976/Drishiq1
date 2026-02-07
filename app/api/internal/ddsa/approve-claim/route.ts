// app/api/internal/ddsa/approve-claim/route.ts
// Internal API for coordinator to approve workboard claims
// POST /api/internal/ddsa/approve-claim

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import audit from '@/lib/audit';

const COORDINATOR_ID = 'agent8';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { claimId, coordinatorId, autoMerge = false } = body;

    // Verify coordinator
    if (coordinatorId !== COORDINATOR_ID) {
      return NextResponse.json(
        { error: 'Unauthorized: Only coordinator can approve claims' },
        { status: 403 }
      );
    }

    if (!claimId) {
      return NextResponse.json(
        { error: 'Missing required field: claimId' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get claim
    const { data: claim, error: claimError } = await supabase
      .from('ddsa_workboard_claims')
      .select('*')
      .eq('claim_id', claimId)
      .single();

    if (claimError || !claim) {
      return NextResponse.json(
        { error: `Claim not found: ${claimId}` },
        { status: 404 }
      );
    }

    if (claim.status !== 'active') {
      return NextResponse.json(
        { error: `Claim is not active (status: ${claim.status})` },
        { status: 400 }
      );
    }

    // Check contract file exists (validation)
    // Note: In production, this would verify file exists via filesystem check
    // For API route, we'll validate the contract requirement and log it
    const expectedContractPath = `ddsa/contracts/${claim.stage_name.replace(/_/g, '-')}-contract.md`;
    
    // We'll rely on the script (workboard-approve.js) to do the actual file check
    // This API endpoint assumes contract verification happened before API call
    audit.log('COORDINATOR.CONTRACT_CHECK_REQUIRED', {
      claimId,
      stageName: claim.stage_name,
      expectedContractPath,
      timestamp: new Date().toISOString()
    });

    // Check if claim_status column exists, handle gracefully
    const updateData: any = {
      metadata: {
        ...(claim.metadata || {}),
        approved_by: coordinatorId,
        approved_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };

    // Add claim_status if column exists (checked by attempting update)
    // If column doesn't exist, we'll update metadata only and log a warning
    updateData.claim_status = 'approved';

    // Update claim status
    const { data: updatedClaim, error: updateError } = await supabase
      .from('ddsa_workboard_claims')
      .update(updateData)
      .eq('claim_id', claimId)
      .select()
      .single();

    if (updateError) {
      // If error is about missing column, provide helpful message
      if (updateError.message.includes('claim_status') || updateError.message.includes('column')) {
        audit.log('COORDINATOR.CLAIM_STATUS_COLUMN_MISSING', {
          claimId,
          error: updateError.message,
          timestamp: new Date().toISOString()
        });

        return NextResponse.json(
          { 
            error: 'claim_status column not found',
            details: 'Run database/add-claim-status-column.sql or database/setup-workboard-complete.sql',
            hint: 'The claim_status column needs to be added to ddsa_workboard_claims table'
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: `Failed to approve claim: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Audit log
    audit.log('COORDINATOR.CLAIM_APPROVED', {
      claimId,
      stageName: claim.stage_name,
      agentId: claim.agent_id,
      branchName: claim.branch_name,
      coordinatorId,
      autoMerge,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      claimId,
      status: 'approved',
      claim: updatedClaim,
      merged: false // Merge would be handled separately
    });
  } catch (error: any) {
    audit.log('COORDINATOR.CLAIM_APPROVAL_FAILED', {
      error: error.message,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

