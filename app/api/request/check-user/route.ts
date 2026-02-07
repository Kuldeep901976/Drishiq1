import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Check if email or phone already exists in users table
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone } = body;

    if ((!email && !phone) || (typeof email !== 'string' && typeof phone !== 'string')) {
      return NextResponse.json(
        { error: 'Email or phone number is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const results: any = {
      emailExists: false,
      phoneExists: false,
      user: null
    };

    // Check email if provided
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const { data: emailUser } = await supabase
        .from('users')
        .select('id, email, phone, phone_verified, email_verified')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (emailUser) {
        results.emailExists = true;
        results.user = emailUser;
      }
    }

    // Check phone if provided
    if (phone) {
      const normalizedPhone = phone.trim().replace(/\s+/g, '');
      const { data: phoneUser } = await supabase
        .from('users')
        .select('id, email, phone, phone_verified, email_verified')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (phoneUser) {
        results.phoneExists = true;
        if (!results.user) {
          results.user = phoneUser;
        }
      }
    }

    // If either exists, return conflict
    if (results.emailExists || results.phoneExists) {
      let message = '';
      if (results.emailExists && results.phoneExists) {
        message = 'This email and phone number are already registered. Please sign in or use different credentials.';
      } else if (results.emailExists) {
        message = 'This email is already registered. Please sign in or use a different email address.';
      } else {
        message = 'This phone number is already registered. Please sign in or use a different phone number.';
      }

      return NextResponse.json({
        exists: true,
        ...results,
        message,
        signInUrl: '/signin'
      }, { status: 409 }); // 409 Conflict
    }

    // Both are available
    return NextResponse.json({
      exists: false,
      message: 'Email and phone number are available'
    });

  } catch (error: any) {
    console.error('Error checking user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}







