import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, userType = 'user' } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Missing required fields: email, password' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return NextResponse.json({ 
        error: authError.message 
      }, { status: 401 });
    }

    if (!authData.user) {
      return NextResponse.json({ 
        error: 'Failed to authenticate user' 
      }, { status: 500 });
    }

    // Update last sign in timestamp
    await supabase
      .from('users')
      .update({
        last_sign_in: new Date().toISOString(),
        login_method: 'password',
        updated_at: new Date().toISOString()
      })
      .eq('id', authData.user.id);

    // Get user data from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, display_name, role, is_active, email_verified, phone_verified')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      return NextResponse.json({ 
        error: 'User profile not found' 
      }, { status: 404 });
    }

    if (!userData.is_active) {
      return NextResponse.json({ 
        error: 'Account is deactivated' 
      }, { status: 403 });
    }

    // Verify user type matches requested type (for admin routes)
    const actualUserType = userData.role || 'user';
    if (userType && actualUserType !== userType && userType !== 'user') {
      return NextResponse.json({ 
        error: `Access denied: This user type requires ${userType} privileges` 
      }, { status: 403 });
    }

    // Get user's current credit balance
    const { data: creditData } = await supabase
      .from('credits')
      .select('credit_tokens, tokens_used, status')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: userData.display_name || userData.first_name || '',
          first_name: userData.first_name,
          last_name: userData.last_name,
          user_type: userData.role || 'user',
          is_active: userData.is_active,
          email_verified: userData.email_verified || false,
          phone_verified: userData.phone_verified || false
        },
        session: authData.session,
        credits: creditData ? {
          available: (creditData.credit_tokens || 0) - (creditData.tokens_used || 0),
          total: creditData.credit_tokens || 0,
          used: creditData.tokens_used || 0,
          status: creditData.status
        } : null,
        message: 'Authentication successful'
      }
    });

  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
