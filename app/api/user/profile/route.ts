// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      // If no auth, return empty profile (for guest mode)
      return NextResponse.json({ 
        success: true, 
        user: null 
      });
    }
    
    // Get user profile from profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching profile:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      user: data || null
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch profile' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Not authenticated' 
      }, { status: 401 });
    }
    
    const profileData = await request.json();
    
    // Map frontend format to database format
    const mappedData = {
      p_user_id: user.id,
      p_first_name: profileData.firstName,
      p_last_name: profileData.lastName || '',
      p_language: profileData.language,
      p_gender: profileData.gender,
      p_city: profileData.city,
      p_country: profileData.country,
      p_date_of_birth: profileData.dateOfBirth,
      p_time_of_birth: profileData.timeOfBirth || null,
      p_place_of_birth: profileData.placeOfBirth || null,
      p_email: profileData.email || null,
      p_phone: profileData.phone || null,
      p_mode: profileData.mode || 'myself',
      p_declined_astro_advice: profileData.declinedAstroAdvice || false,
      p_concerns: profileData.concerns || [],
      p_health_issues: profileData.healthIssues || [],
      p_goals: profileData.goals || [],
      p_preferences: profileData.preferences || {},
      p_additional_data: profileData.additionalData || {}
    };

    // Call the upsert function
    const { data, error } = await supabase.rpc('upsert_chat_user_profile', mappedData);

    if (error) {
      console.error('Error saving profile:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    console.log('Profile saved successfully:', {
      userId: user.id,
      age: data.age,
      sunSign: data.sun_sign,
      hasDeclinedAstro: profileData.declinedAstroAdvice
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Profile saved successfully',
      user: data
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save profile' 
    }, { status: 500 });
  }
}

