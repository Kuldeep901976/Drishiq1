// app/api/admin/health/route.ts
/**
 * Health Check Endpoint
 * Returns system health status
 */

import { NextRequest, NextResponse } from 'next/server';
import { healthCheck, validatePipelineGraph } from '@/lib/ddsa/validators';
import { withAdminAuth } from '@/app/api/middleware/admin-auth';

async function healthHandler(request: NextRequest) {
  try {
    const health = await healthCheck();
    const graphValidation = validatePipelineGraph();

    const status = health.valid && graphValidation.valid ? 'healthy' : 'degraded';

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      checks: {
        pipelineGraph: graphValidation,
        overall: health
      }
    }, {
      status: status === 'healthy' ? 200 : 503
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 503
    });
  }
}

export const GET = withAdminAuth(healthHandler);

