import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    // Fetch from users table
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbError) {
      return NextResponse.json({
        success: false,
        error: dbError.message
      }, { status: 500 });
    }

    // Map users table to profile format
    const profile = {
      id: userData.id,
      firstName: userData.first_name || '',
      email: userData.email || '',
      socialLogin: userData.auth_provider && userData.auth_provider !== 'email',
      country: userData.country || '',
      city: userData.city || '',
      phone: userData.phone || '',
      dob: userData.date_of_birth || '',
      gender: userData.gender || '',
      avatarUrl: userData.avatar_url,
      astroOptIn: userData.astro_opt_in || false,
      timeOfBirth: userData.time_of_birth || '',
      placeOfBirth: userData.place_of_birth || '',
      freezeBirthData: userData.freeze_birth_data || false,
      consentProvided: userData.consent_provided || false,
      // Geographic data
      latitude: userData.place_of_birth_latitude,
      longitude: userData.place_of_birth_longitude,
      timezone: userData.place_of_birth_timezone,
      placeCountry: userData.place_of_birth_country,
    };
    
    return NextResponse.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch profile'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    const data = await request.json();
    
    // Update users table
    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: data.firstName,
        city: data.city,
        country: data.country,
        phone: data.phone,
        date_of_birth: data.dob,
        gender: data.gender,
        avatar_url: data.avatarUrl,
        astro_opt_in: data.astroOptIn,
        time_of_birth: data.timeOfBirth,
        place_of_birth: data.placeOfBirth,
        freeze_birth_data: data.freezeBirthData,
        consent_provided: data.consentProvided,
        // Geographic data
        place_of_birth_latitude: data.latitude,
        place_of_birth_longitude: data.longitude,
        place_of_birth_timezone: data.timezone,
        place_of_birth_country: data.placeCountry,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (updateError) {
      return NextResponse.json({
        success: false,
        errors: { submit: updateError.message }
      }, { status: 400 });
    }
    
    // Return updated profile
    const { data: updatedUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    const profile = {
      id: updatedUser.id,
      firstName: updatedUser.first_name,
      email: updatedUser.email,
      socialLogin: updatedUser.auth_provider && updatedUser.auth_provider !== 'email',
      country: updatedUser.country,
      city: updatedUser.city,
      phone: updatedUser.phone,
      dob: updatedUser.date_of_birth,
      gender: updatedUser.gender,
      avatarUrl: updatedUser.avatar_url,
      astroOptIn: updatedUser.astro_opt_in,
      timeOfBirth: updatedUser.time_of_birth,
      placeOfBirth: updatedUser.place_of_birth,
      freezeBirthData: updatedUser.freeze_birth_data,
      consentProvided: updatedUser.consent_provided,
      // Geographic data
      latitude: updatedUser.place_of_birth_latitude,
      longitude: updatedUser.place_of_birth_longitude,
      timezone: updatedUser.place_of_birth_timezone,
      placeCountry: updatedUser.place_of_birth_country,
    };
    
    return NextResponse.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json({
      success: false,
      errors: { submit: 'Could not save profile — try again or contact support.' }
    }, { status: 500 });
  }
}

