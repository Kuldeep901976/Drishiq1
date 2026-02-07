import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client for phone verification
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, action, code } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = phone.trim().replace(/\s+/g, '');
    
    // Ensure phone has country code
    const phoneWithCode = normalizedPhone.startsWith('+') 
      ? normalizedPhone 
      : `+${normalizedPhone}`;

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'send') {
      // First check if phone already exists in requests or users table
      try {
        // Check requests table
        const { data: existingRequest } = await supabase
          .from('requests')
          .select('id')
          .eq('phone', normalizedPhone)
          .maybeSingle();

        // Check users table
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('phone', normalizedPhone)
          .maybeSingle();

        // If phone exists, reject the request
        if (existingRequest || existingUser) {
          return NextResponse.json({
            error: 'This phone number is already registered. Please use a different phone number or contact support.',
            exists: true
          }, { status: 409 }); // 409 Conflict
        }

        // Phone doesn't exist, proceed with OTP
        // Note: Supabase phone auth requires SMS provider to be configured
        // If not configured, this will fail with a clear error message
        const { data, error } = await supabase.auth.signInWithOtp({
          phone: phoneWithCode,
          options: {
            channel: 'sms',
            // Don't create a user, just verify the phone
            shouldCreateUser: false
          }
        });

        if (error) {
          console.error('Supabase signInWithOtp error:', {
            message: error.message,
            status: error.status,
            name: error.name
          });
          throw error;
        }

        return NextResponse.json({
          success: true,
          message: 'OTP sent successfully to your phone',
        });

      } catch (error: any) {
        console.error('Supabase OTP send error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        let errorMessage = 'Failed to send OTP';
        if (error?.message) {
          // Include the actual error message for debugging
          errorMessage = error.message;
          
          // Provide user-friendly messages for common errors
          if (error.message.includes('invalid') || error.message.includes('format')) {
            errorMessage = 'Invalid phone number format. Please check your phone number.';
          } else if (error.message.includes('quota') || error.message.includes('rate') || error.message.includes('limit')) {
            errorMessage = 'Too many requests. Please try again later.';
          } else if (error.message.includes('disabled') || error.message.includes('not enabled')) {
            errorMessage = 'Phone authentication is not enabled. Please contact support.';
          } else if (error.message.includes('provider') || error.message.includes('SMS')) {
            errorMessage = 'SMS service is not configured. Please contact support.';
          }
        }

        return NextResponse.json(
          { 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          },
          { status: 400 }
        );
      }
    }

    if (action === 'verify') {
      // Verify OTP
      if (!code || typeof code !== 'string') {
        return NextResponse.json(
          { error: 'Verification code is required' },
          { status: 400 }
        );
      }

      try {
        // Verify OTP with Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          phone: phoneWithCode,
          token: code,
          type: 'sms'
        });

        if (error) {
          throw error;
        }

        return NextResponse.json({
          success: true,
          verified: true,
          message: 'Phone number verified successfully'
        });

      } catch (error: any) {
        console.error('Supabase OTP verify error:', error);
        
        let errorMessage = 'Invalid verification code';
        if (error?.message?.includes('expired')) {
          errorMessage = 'Code expired. Please request a new code.';
        } else if (error?.message?.includes('invalid')) {
          errorMessage = 'Invalid code. Please try again.';
        }

        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "send" or "verify"' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error in phone verification API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

