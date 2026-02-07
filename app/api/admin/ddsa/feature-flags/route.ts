// app/api/admin/ddsa/feature-flags/route.ts
// API endpoint for feature flags management (Admin UI)

import { NextRequest, NextResponse } from 'next/server';
import { getFeatureFlags, updateFeatureFlags } from '@/lib/ddsa/feature-flags';

// GET /api/admin/ddsa/feature-flags
// Get current feature flags
export async function GET(request: NextRequest) {
  try {
    const flags = await getFeatureFlags();
    return NextResponse.json({ flags });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to load feature flags', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/ddsa/feature-flags
// Update feature flags
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updates = body.flags || body;
    
    const success = await updateFeatureFlags(updates);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update feature flags' },
        { status: 500 }
      );
    }
    
    // Return updated flags
    const flags = await getFeatureFlags();
    return NextResponse.json({ success: true, flags });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}












