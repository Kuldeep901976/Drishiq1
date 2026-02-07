// app/api/internal/ddsa/toggle-feature-flag/route.ts
// Internal API for coordinator to toggle feature flags
// POST /api/internal/ddsa/toggle-feature-flag

import { NextRequest, NextResponse } from 'next/server';
import audit from '@/lib/audit';

const COORDINATOR_ID = 'agent8';

// Allowed feature flags
const ALLOWED_FLAGS = [
  'ACTIONS_AUTO_INSERT',
  'TEST_DISABLE_RUNS',
  'DDSA_DEV_FALLBACK'
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flag, value, coordinatorId } = body;

    // Verify coordinator
    if (coordinatorId !== COORDINATOR_ID) {
      return NextResponse.json(
        { error: 'Unauthorized: Only coordinator can toggle feature flags' },
        { status: 403 }
      );
    }

    if (!flag || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: flag, value' },
        { status: 400 }
      );
    }

    if (!ALLOWED_FLAGS.includes(flag)) {
      return NextResponse.json(
        { error: `Flag not allowed: ${flag}. Allowed: ${ALLOWED_FLAGS.join(', ')}` },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Update environment variable
    // 2. Or update feature flag in database
    // 3. Or update configuration service
    
    // For now, just log the change
    const oldValue = process.env[flag];
    process.env[flag] = value.toString();

    // Audit log
    audit.log('COORDINATOR.FEATURE_FLAG_TOGGLED', {
      flag,
      oldValue,
      newValue: value,
      coordinatorId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      flag,
      oldValue,
      newValue: value,
      message: `Feature flag ${flag} updated to ${value}`
    });
  } catch (error: any) {
    audit.log('COORDINATOR.FEATURE_FLAG_TOGGLE_FAILED', {
      error: error.message,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

