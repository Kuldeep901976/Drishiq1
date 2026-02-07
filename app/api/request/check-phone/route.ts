import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Normalize phone number (remove spaces, ensure format)
    const normalizedPhone = phone.trim().replace(/\s+/g, '');

    const supabase = createServiceClient();

    // Check if phone exists in requests table
    const { data: existingRequest, error: requestError } = await supabase
      .from('requests')
      .select('id, email, request_type, created_at')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (requestError && requestError.code !== 'PGRST116') {
      console.error('Error checking requests table:', requestError);
    }

    // Check if phone exists in users table
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email, phone_verified')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking users table:', userError);
    }

    // If phone exists in either table, return error
    if (existingRequest || existingUser) {
      return NextResponse.json({
        exists: true,
        message: 'This phone number is already registered. Please use a different phone number or contact support.',
        foundIn: existingRequest ? 'requests' : 'users',
        details: existingRequest 
          ? { requestType: existingRequest.request_type, createdAt: existingRequest.created_at }
          : { phoneVerified: existingUser?.phone_verified }
      }, { status: 409 }); // 409 Conflict
    }

    // Phone number is available
    return NextResponse.json({
      exists: false,
      message: 'Phone number is available'
    });

  } catch (error: any) {
    console.error('Error checking phone number:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

