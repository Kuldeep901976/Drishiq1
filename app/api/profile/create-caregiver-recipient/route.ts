// app/api/profile/create-caregiver-recipient/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    const data = await request.json();
    
    // Get user's email and phone for copying
    const { data: userData } = await supabase
      .from('users')
      .select('email, phone')
      .eq('id', user.id)
      .single();

    // Create profile entry in profiles table for the caregiver recipient
    const profilePayload: any = {
      email: userData?.email || user.email,
      phone: userData?.phone || '',
      first_name: data.firstName,
      relationship: data.relationship,
      dob: data.dob,
      gender: data.gender || null,
      astro_interest: data.withAstro ? 'interested' : 'not_interested',
      caregiver_user_id: user.id, // Link to caregiver
    };

    // Add astro fields ONLY if interested
    if (data.withAstro && data.tob && data.pob && data.latitude && data.longitude && data.timezone) {
      profilePayload.time_of_birth = data.tob;
      profilePayload.place_of_birth = data.pob;
      profilePayload.place_of_birth_latitude = data.latitude;
      profilePayload.place_of_birth_longitude = data.longitude;
      profilePayload.place_of_birth_timezone = data.timezone;
      
      // Add place of birth location fields if available
      if (data.place_of_birth_country) profilePayload.place_of_birth_country = data.place_of_birth_country;
      if (data.place_of_birth_state) profilePayload.place_of_birth_state = data.place_of_birth_state;
      if (data.place_of_birth_city) profilePayload.place_of_birth_city = data.place_of_birth_city;
    }

    // Insert into profiles table
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(profilePayload)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating caregiver recipient profile:', insertError);
      return NextResponse.json({
        success: false,
        error: insertError.message
      }, { status: 500 });
    }

    // Update users table with astro_opt_in flag based on interest
    // This tracks the caregiver's preference for this recipient
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ 
        astro_opt_in: data.withAstro || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateUserError) {
      console.warn('⚠️ Failed to update users table astro_opt_in:', updateUserError);
      // Don't fail the request - profile was created successfully
    }

    return NextResponse.json({
      success: true,
      data: newProfile
    });
  } catch (error: any) {
    console.error('Error creating caregiver recipient profile:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create profile'
    }, { status: 500 });
  }
}

