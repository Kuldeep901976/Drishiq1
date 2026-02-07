import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServiceClient } from '@/lib/supabase';
import { attributeSignup } from '@/lib/affiliate-integration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, userType = 'user' } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json({ 
        error: 'Missing required fields: email, password, name' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters long' 
      }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 409 });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          user_type: userType
        }
      }
    });

    if (authError) {
      return NextResponse.json({ 
        error: authError.message 
      }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ 
        error: 'Failed to create user account' 
      }, { status: 500 });
    }

    // Create user record in users table using service role to bypass RLS
    const serviceClient = createServiceClient();
    const { data: userData, error: userError} = await serviceClient
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        first_name: name,
        display_name: name,
        role: userType,
        is_active: true,
        auth_provider: 'email',
        login_method: 'password',
        email_verified: false,
        phone_verified: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user record:', userError);
      return NextResponse.json({ 
        error: 'Account created but failed to complete registration' 
      }, { status: 500 });
    }

    // Also create a minimal profile entry in profiles table for chat system
    // This ensures the profile exists even before user completes full profile
    const { error: profileError } = await serviceClient
      .from('profiles')
      .upsert({
        id: authData.user.id, // profiles.id references auth.users(id)
        email: authData.user.email!,
        first_name: name,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (profileError) {
      console.warn('⚠️ Failed to create profile entry (non-critical):', profileError);
      // Don't fail signup - profile can be created later when user completes profile
    } else {
      console.log('✅ Created profile entry for new user');
    }

    // Initialize default credits for new user using service role
    const { data: creditData, error: creditError } = await serviceClient
      .from('credits')
      .insert({
        user_id: authData.user.id,
        email: authData.user.email!,
        credit_tokens: userType === 'user' ? 5 : 10, // More credits for special users
        tokens_used: 0,
        amount_contributed: 0,
        payment_status: 'pending',
        support_level: userType === 'user' ? 'standard' : 'premium',
        status: 'pending_verification'
      });

    if (creditError) {
      console.error('Error initializing credits:', creditError);
    }

    // Attribute signup to affiliate if cookie exists
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      try {
        const attribution = await attributeSignup(
          authData.user.id,
          authData.user.email!,
          cookieHeader
        );
        
        if (attribution.success) {
          console.log('✅ User attributed to affiliate:', attribution.affiliateId);
        } else {
          console.log('ℹ️ No affiliate attribution:', attribution.error);
        }
      } catch (attributionError) {
        // Don't fail signup if attribution fails
        console.error('⚠️ Affiliate attribution error (non-critical):', attributionError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: name,
          user_type: userType
        },
        email_confirmation_sent: authData.user.email_confirmed_at ? false : true,
        message: 'Account created successfully'
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
