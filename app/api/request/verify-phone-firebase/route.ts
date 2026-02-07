import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Firebase phone verification API
// This will be called from client-side Firebase SDK
// For server-side, we just validate the phone format and check if user exists

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, action } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = phone.trim().replace(/\s+/g, '');
    const phoneWithCode = normalizedPhone.startsWith('+') 
      ? normalizedPhone 
      : `+${normalizedPhone}`;

    const supabase = createServiceClient();

    if (action === 'check') {
      // Check if phone exists in users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email, phone, phone_verified')
        .eq('phone', phoneWithCode)
        .maybeSingle();

      if (existingUser) {
        return NextResponse.json({
          exists: true,
          message: 'This phone number is already registered. Please sign in or use a different phone number.',
          user: existingUser,
          signInUrl: '/signin'
        }, { status: 409 });
      }

      // Check if phone exists in requests table (pending requests)
      const { data: existingRequest } = await supabase
        .from('requests')
        .select('id, email, request_type, status')
        .eq('phone', phoneWithCode)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingRequest) {
        return NextResponse.json({
          exists: true,
          message: 'You already have a pending request with this phone number. Please wait for review or contact support.',
          request: existingRequest
        }, { status: 409 });
      }

      return NextResponse.json({
        exists: false,
        message: 'Phone number is available for verification',
        phone: phoneWithCode
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "check"' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error in phone verification check:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}







