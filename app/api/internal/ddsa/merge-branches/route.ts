// app/api/internal/ddsa/merge-branches/route.ts
// Internal API for coordinator to merge branches in correct order
// POST /api/internal/ddsa/merge-branches

import { NextRequest, NextResponse } from 'next/server';
import audit from '@/lib/audit';

const COORDINATOR_ID = 'agent8';

// Correct merge order (must be followed)
const CORRECT_ORDER = [
  'feature/ddsa/cfq-bundled-intake',
  'feature/ddsa/stakeholders-history',
  'feature/ddsa/diagnostics',
  'feature/ddsa/core-options-feedback',
  'feature/ddsa/api-ui'
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { branches, targetBranch = 'main', coordinatorId } = body;

    // Verify coordinator
    if (coordinatorId !== COORDINATOR_ID) {
      return NextResponse.json(
        { error: 'Unauthorized: Only coordinator can merge branches' },
        { status: 403 }
      );
    }

    if (!branches || !Array.isArray(branches) || branches.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: branches (array)' },
        { status: 400 }
      );
    }

    // Validate merge order
    const branchesLower = branches.map((b: string) => b.toLowerCase());
    const correctOrderLower = CORRECT_ORDER.map(b => b.toLowerCase());
    
    let orderCorrect = true;
    for (let i = 0; i < branches.length; i++) {
      const branch = branchesLower[i];
      const expectedIndex = correctOrderLower.indexOf(branch);
      if (expectedIndex === -1 || expectedIndex !== i) {
        orderCorrect = false;
        break;
      }
    }

    if (!orderCorrect) {
      return NextResponse.json(
        { 
          error: 'Incorrect merge order',
          expected: CORRECT_ORDER,
          received: branches
        },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Run integration smoke test
    // 2. Execute git merge for each branch in order
    // 3. Resolve conflicts if any
    // 4. Update workboard claims to 'completed'

    const merged: string[] = [];
    const failed: string[] = [];

    for (const branch of branches) {
      try {
        // Simulate merge
        // In production: git merge ${branch}
        merged.push(branch);
        
        audit.log('COORDINATOR.BRANCH_MERGED', {
          branch,
          targetBranch,
          coordinatorId,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        failed.push(branch);
        
        audit.log('COORDINATOR.BRANCH_MERGE_FAILED', {
          branch,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return NextResponse.json({
      success: true,
      merged,
      failed,
      order: 'correct',
      targetBranch
    });
  } catch (error: any) {
    audit.log('COORDINATOR.MERGE_BRANCHES_FAILED', {
      error: error.message,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

