// app/api/profile/get-for-chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase';

// Create a client for auth (uses anon key to access cookies)
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Create service client for database queries
const supabase = createServiceClient();

export async function GET(request: NextRequest) {
  try {
    // Get userId from query params (passed from client)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let user: { id: string } | null = null;
    
    if (userId) {
      // Use provided userId (we trust it since we're using service client for queries)
      user = { id: userId };
    } else {
      // Try to get user from cookie-based session as fallback
      const { data: { user: cookieUser }, error: cookieError } = await supabaseAuth.auth.getUser();
      if (!cookieError && cookieUser) {
        user = cookieUser;
      }
    }
    
    if (!user || !user.id) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated - userId required or valid session'
      }, { status: 401 });
    }

    // Fetch profile from profiles table using user ID (primary) or email (fallback)
    // profiles.id references auth.users(id), so we should query by id first
    let profile = null;
    let profileError = null;
    
    // Try by user ID first (profiles.id = auth.users.id)
    const { data: profileById, error: errorById } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileById && !errorById) {
      profile = profileById;
    } else {
      // If ID lookup failed, try email lookup if available
      const userEmail = 'email' in user ? user.email : null;
      if (userEmail) {
        const { data: profileByEmail, error: errorByEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();
        
        profile = profileByEmail;
        profileError = errorByEmail;
      } else {
        profileError = errorById;
      }
    }

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({
        success: false,
        error: profileError.message
      }, { status: 500 });
    }

    // If no profile, try to get from users table as fallback
    if (!profile) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        return NextResponse.json({
          success: false,
          error: 'Profile not found'
        }, { status: 404 });
      }

      // Map users table fields to profile format
      return NextResponse.json({
        success: true,
        profile: {
          first_name: userData.first_name,
          last_name: userData.last_name || '',
          email: userData.email,
          phone: userData.phone,
          dob: userData.date_of_birth,
          date_of_birth: userData.date_of_birth,
          gender: userData.gender,
          city: userData.city,
          country: userData.country,
          astro_interest: userData.astro_opt_in ? 'interested' : 'not_interested',
          time_of_birth: userData.time_of_birth,
          place_of_birth: userData.place_of_birth,
          place_of_birth_latitude: userData.place_of_birth_latitude,
          place_of_birth_longitude: userData.place_of_birth_longitude,
          place_of_birth_timezone: userData.place_of_birth_timezone,
          place_of_birth_country: userData.place_of_birth_country,
          place_of_birth_city: userData.place_of_birth_city,
          place_of_birth_state: userData.place_of_birth_state,
          preferred_language: userData.preferred_language || 'en',
        }
      });
    }

    // Return profile data
    return NextResponse.json({
      success: true,
      profile: profile
    });
  } catch (error: any) {
    console.error('Error fetching profile for chat:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch profile'
    }, { status: 500 });
  }
}

