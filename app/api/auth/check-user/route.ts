import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/**
 * API Route to check if user exists by email
 * Uses service role to bypass RLS recursion issues
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('id, user_role, user_category, user_type, role, company_id')
      .eq('email', email)
      .maybeSingle();

    if (selectError) {
      console.error('Database error checking user:', selectError);
      return NextResponse.json(
        { error: 'Database error', details: selectError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: !!existingUser,
      user: existingUser
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

