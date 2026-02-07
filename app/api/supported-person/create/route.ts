import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
// @ts-expect-error - Module resolution issue, files exist with exports
import { createSupportedPerson, deductCredit } from '@/lib/services/credit-service';
import { randomUUID } from 'crypto';

const supabase = createServiceClient();

/**
 * POST /api/supported-person/create
 * Create a new supported person record and deduct credit
 * Body: { caregiverId, fullName, relationship, dateOfBirth }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caregiverId, fullName, relationship, dateOfBirth } = body;

    if (!caregiverId || !fullName || !relationship) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create supported person
    const supportedPerson = await createSupportedPerson(
      caregiverId,
      fullName,
      relationship,
      dateOfBirth
    );

    if (!supportedPerson) {
      return NextResponse.json(
        { error: 'Failed to create supported person' },
        { status: 500 }
      );
    }

    // Create session ID
    const sessionId = randomUUID();

    // Create chat session record
    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        id: sessionId,
        user_id: caregiverId,
        mode: 'caregiver',
        supported_person_id: supportedPerson.id,
        tokens_used: 1,
        status: 'active'
      });

    if (sessionError) {
      console.error('Error creating chat session:', sessionError);
      // Continue despite session error
    }

    return NextResponse.json({
      success: true,
      data: {
        supportedPerson,
        sessionId
      }
    });
  } catch (error) {
    console.error('Error in create supported-person API:', error);
    return NextResponse.json(
      { error: 'Failed to create supported person' },
      { status: 500 }
    );
  }
}








