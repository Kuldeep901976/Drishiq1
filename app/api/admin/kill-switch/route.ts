// app/api/admin/kill-switch/route.ts
/**
 * Kill Switch Endpoint
 * Admin-only endpoint to disable stages per tenant or globally
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTenantConfig } from '@/lib/tenant/registry';
import { withAdminAuth } from '@/app/api/middleware/admin-auth';

// In-memory kill switch (in production, use Redis or database)
const killSwitches = new Map<string, Set<string>>(); // tenantId -> Set<stageId>

/**
 * GET: Check kill switch status
 */
async function getKillSwitch(request: NextRequest) {
  // TODO: Add admin authentication
  const tenantId = request.nextUrl.searchParams.get('tenantId');
  const stageId = request.nextUrl.searchParams.get('stageId');

  if (tenantId && stageId) {
    const disabled = killSwitches.get(tenantId)?.has(stageId) || false;
    return NextResponse.json({ disabled, tenantId, stageId });
  }

  // Return all kill switches
  const allSwitches: Record<string, string[]> = {};
  killSwitches.forEach((stages, tenant) => {
    allSwitches[tenant] = Array.from(stages);
  });

  return NextResponse.json({ killSwitches: allSwitches });
}

/**
 * POST: Set kill switch
 */
async function postKillSwitch(request: NextRequest) {
  // TODO: Add admin authentication
  const body = await request.json();
  const { tenantId, stageId, disabled } = body;

  if (!stageId) {
    return NextResponse.json(
      { error: 'stageId is required' },
      { status: 400 }
    );
  }

  if (tenantId) {
    // Tenant-specific kill switch
    if (!killSwitches.has(tenantId)) {
      killSwitches.set(tenantId, new Set());
    }
    const stages = killSwitches.get(tenantId)!;
    if (disabled) {
      stages.add(stageId);
    } else {
      stages.delete(stageId);
    }
    return NextResponse.json({
      success: true,
      tenantId,
      stageId,
      disabled
    });
  } else {
    // Global kill switch
    const globalKey = 'global';
    if (!killSwitches.has(globalKey)) {
      killSwitches.set(globalKey, new Set());
    }
    const stages = killSwitches.get(globalKey)!;
    if (disabled) {
      stages.add(stageId);
    } else {
      stages.delete(stageId);
    }
    return NextResponse.json({
      success: true,
      stageId,
      disabled,
      scope: 'global'
    });
  }
}

export const GET = withAdminAuth(getKillSwitch);
export const POST = withAdminAuth(postKillSwitch);

/**
 * Check if stage is killed
 */
export function isStageKilled(tenantId: string | undefined, stageId: string): boolean {
  // Check global kill switch
  if (killSwitches.get('global')?.has(stageId)) {
    return true;
  }

  // Check tenant-specific kill switch
  if (tenantId && killSwitches.get(tenantId)?.has(stageId)) {
    return true;
  }

  return false;
}

