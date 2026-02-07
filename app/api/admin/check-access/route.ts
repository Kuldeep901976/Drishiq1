import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ isAdmin: false, error: 'No authorization header' }, { status: 401 });
    }

    // Extract the token from the header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token with Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ isAdmin: false, error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin in the database
    const { data: userRecord, error: dbError } = await supabase
      .from('users')
      .select('id, user_type, role, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (dbError) {
      console.error('Database error checking admin access:', dbError);
      return NextResponse.json({ isAdmin: false, error: 'Database error' }, { status: 500 });
    }

    // ONLY SUPER ADMIN is allowed
    // Check if user is super_admin (not regular admin)
    const isSuperAdmin = userRecord && 
                        userRecord.is_active && 
                        userRecord.role === 'super_admin';

    console.log('Super admin check result:', { 
      userId: user.id, 
      userRecord, 
      isSuperAdmin 
    });

    return NextResponse.json({ 
      isAdmin: isSuperAdmin, // Only super admin
      userRole: userRecord?.role || 'user',
      userType: userRecord?.user_type || 'regular'
    });

  } catch (error) {
    console.error('Admin access check error:', error);
    return NextResponse.json({ 
      isAdmin: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
