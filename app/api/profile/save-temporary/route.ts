import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/**
 * POST /api/profile/save-temporary
 * Save profile data to temporary_signups table using service role (bypasses RLS)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received request to save temporary signup');
    const body = await request.json();
    console.log('📋 Request body received:', { 
      email: body.email,
      hasFirstName: !!body.firstName,
      hasLastName: !!body.lastName 
    });
    const {
      email,
      firstName,
      lastName,
      phone,
      gender,
      dob,
      country,
      city,
      timeOfBirth,
      placeOfBirth,
      latitude,
      longitude,
      timezone,
      astroOptIn,
      oauthId, // This is the UUID from auth user
      authProvider,
      emailVerified,
      phoneVerified,
      avatarUrl,
      preferredLanguage,
      consentProvided,
      freezeBirthData,
      userCategory,
      userRole
    } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('🔧 Creating service client...');
    const supabase = createServiceClient();
    
    if (!supabase) {
      throw new Error('Failed to create Supabase service client');
    }

    // Check if record exists
    console.log('🔍 Checking if record exists for email:', email);
    const { data: existingTemp, error: selectError } = await supabase
      .from('temporary_signups')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    
    console.log('🔍 Existing record check:', { 
      exists: !!existingTemp, 
      error: selectError?.message
    });

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking existing record:', selectError);
      return NextResponse.json(
        { error: 'Database error', details: selectError.message },
        { status: 500 }
      );
    }

    const signupData: any = {
      email: email.toLowerCase().trim(),
      first_name: firstName || null,
      last_name: lastName || null,
      phone: phone || null,
      gender: gender || null,
      dob: dob || null,
      country: country || null,
      city: city || null,
      time_of_birth: timeOfBirth || null,
      place_of_birth: placeOfBirth || null,
      latitude: latitude ? (typeof latitude === 'string' ? parseFloat(latitude) : latitude) : null,
      longitude: longitude ? (typeof longitude === 'string' ? parseFloat(longitude) : longitude) : null,
      timezone: timezone || null,
      // Set astro_interest to 'interested' if:
      // 1. astroOptIn is explicitly true, OR
      // 2. Any astro data is being captured (time_of_birth, place_of_birth, latitude, longitude, timezone)
      astro_interest: (astroOptIn || timeOfBirth || placeOfBirth || latitude || longitude || timezone) 
        ? 'interested' 
        : 'not_interested',
      oauth_id: oauthId || null, // UUID from auth user
      auth_provider: authProvider || 'email',
      // Set verification status explicitly:
      // - If verification is successful (true), set to true
      // - If verification is not successful or not provided, set to false
      // This ensures phone_verified is only true when verification actually succeeds
      email_verified: emailVerified === true ? true : false,
      phone_verified: phoneVerified === true ? true : false,
      preferred_language: preferredLanguage || 'en', // Default to 'en' if not provided
      signup_data: avatarUrl || consentProvided || freezeBirthData || oauthId ? {
        avatar_url: avatarUrl || null,
        consent_provided: consentProvided || false,
        freeze_birth_data: freezeBirthData || false,
        user_uuid: oauthId || null, // Store UUID in signup_data as well for easy access
      } : null,
      updated_at: new Date().toISOString()
    };

    // Add optional fields only if they exist in the table schema
    // Note: user_id might not exist in temporary_signups - don't add if column doesn't exist
    // We'll let the database error tell us if the column doesn't exist, then handle it gracefully
    
    // Add user_category and user_role if provided
    if (userCategory) signupData.user_category = userCategory;
    if (userRole) signupData.user_role = userRole;
    
    // Remove null/undefined values that might cause issues
    Object.keys(signupData).forEach(key => {
      if (signupData[key] === undefined) {
        delete signupData[key];
      }
    });

    // Log the data we're about to save (for debugging)
    console.log('📦 Prepared signup data:', {
      email: signupData.email,
      hasFirstName: !!signupData.first_name,
      hasLastName: !!signupData.last_name,
      hasOAuthId: !!signupData.oauth_id,
      hasUserCategory: !!signupData.user_category,
      hasUserRole: !!signupData.user_role,
      keys: Object.keys(signupData)
    });

    if (existingTemp) {
      // Update existing record
      console.log('♻️ Updating existing record...');
      const { data: updatedData, error: updateError } = await supabase
        .from('temporary_signups')
        .update(signupData)
        .eq('email', email.toLowerCase().trim())
        .select();

      if (updateError) {
        console.error('❌ Error updating temporary_signups:', updateError);
        console.error('❌ Update error details:', {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
          data: signupData
        });
        
        // Check if error is due to missing column
        if (updateError.code === '42703' || updateError.message?.includes('column') || updateError.message?.includes('field')) {
          console.error('⚠️ Possible column mismatch - check table schema');
        }
        
        return NextResponse.json(
          { 
            error: 'Failed to update profile', 
            details: updateError.message, 
            code: updateError.code,
            hint: updateError.hint 
          },
          { status: 500 }
        );
      }

      console.log('✅ Record updated successfully');
      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        action: 'updated',
        data: updatedData
      });
    } else {
      // Insert new record
      console.log('💾 Inserting new record...');
      const { data: insertedData, error: insertError } = await supabase
        .from('temporary_signups')
        .insert([signupData])
        .select();

      if (insertError) {
        console.error('❌ Error inserting temporary_signups:', insertError);
        console.error('❌ Insert error details:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          data: signupData
        });
        
        // Check if error is due to missing column or constraint violation
        if (insertError.code === '42703' || insertError.message?.includes('column') || insertError.message?.includes('field')) {
          console.error('⚠️ Column does not exist in temporary_signups table');
          console.error('⚠️ Attempted to insert:', Object.keys(signupData));
        }
        
        if (insertError.code === '23505') {
          console.error('⚠️ Unique constraint violation - record may already exist');
        }
        
        return NextResponse.json(
          { 
            error: 'Failed to save profile', 
            details: insertError.message, 
            code: insertError.code,
            hint: insertError.hint 
          },
          { status: 500 }
        );
      }

      console.log('✅ Record created successfully');
      return NextResponse.json({
        success: true,
        message: 'Profile saved successfully',
        action: 'created',
        data: insertedData
      });
    }
  } catch (error: any) {
    console.error('API error saving temporary signup:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
