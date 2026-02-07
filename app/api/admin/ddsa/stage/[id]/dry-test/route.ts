// app/api/admin/ddsa/stage/[id]/dry-test/route.ts
// Admin proxy endpoint for running dry tests on stages
// Proxies to internal API with proper authentication

import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/ddsa/stage/[id]/dry-test
// Proxy to internal API for dry test execution
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const stageId = resolvedParams.id;
    
    if (!stageId) {
      return NextResponse.json(
        { error: 'Stage ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const internalSecret = process.env.DDSA_INTERNAL_SECRET;

    if (!internalSecret) {
      return NextResponse.json(
        { error: 'Internal API secret not configured' },
        { status: 500 }
      );
    }

    // Forward request to internal API with authentication
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const internalUrl = `${baseUrl}/api/internal/ddsa/stage/${stageId}/progress`;

    const response = await fetch(internalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${internalSecret}`,
        'x-internal-key': internalSecret,
        'x-agent-id': body.agent_id || 'admin-ui'
      },
      body: JSON.stringify({
        ...body,
        dryRun: true
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Internal API error', details: data.details },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}











