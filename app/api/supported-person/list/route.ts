import { NextRequest, NextResponse } from 'next/server';
// @ts-expect-error - Module resolution issue, files exist with exports
import { getSupportedPersons } from '@/lib/services/credit-service';

/**
 * GET /api/supported-person/list
 * Get list of supported persons for a caregiver
 * Query params: caregiverId
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const caregiverId = searchParams.get('caregiverId');

    if (!caregiverId) {
      return NextResponse.json(
        { error: 'Caregiver ID is required' },
        { status: 400 }
      );
    }

    const persons = await getSupportedPersons(caregiverId);

    return NextResponse.json({
      success: true,
      data: persons
    });
  } catch (error) {
    console.error('Error in list supported-persons API:', error);
    return NextResponse.json(
      { error: 'Failed to list supported persons' },
      { status: 500 }
    );
  }
}








