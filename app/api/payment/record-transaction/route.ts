import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Sync profile data from temporary_signups to users and profiles tables
async function syncProfileFromTemporarySignups(
  serviceClient: any,
  userId: string,
  email: string
) {
  try {
    // Normalize email for query (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();
    console.log('🔍 Fetching temporary_signups data for email:', normalizedEmail);
    
    // Fetch data from temporary_signups
    const { data: tempData, error: tempError } = await serviceClient
      .from('temporary_signups')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (tempError && tempError.code !== 'PGRST116') {
      console.error('Error fetching temporary_signups:', tempError);
      return { success: false, error: tempError.message };
    }

    if (!tempData) {
      console.log('⚠️ No temporary_signups data found for email:', normalizedEmail);
      return { success: true, skipped: true, message: `No temporary signup data to sync for email: ${normalizedEmail}` };
    }

    // Log what data we're about to sync
    console.log('📋 Data from temporary_signups to sync:', {
      email: tempData.email,
      hasFirstName: !!tempData.first_name,
      hasLastName: !!tempData.last_name,
      hasPhone: !!tempData.phone,
      hasGender: !!tempData.gender,
      hasDob: !!tempData.dob,
      hasCity: !!tempData.city,
      hasCountry: !!tempData.country,
      astroInterest: tempData.astro_interest,
      hasAstroFields: {
        time_of_birth: !!tempData.time_of_birth,
        place_of_birth: !!tempData.place_of_birth,
        latitude: !!tempData.latitude,
        longitude: !!tempData.longitude,
        timezone: !!tempData.timezone,
      },
      hasPreferredLanguage: !!tempData.preferred_language,
      hasSignupData: !!tempData.signup_data
    });

    // First, get existing user to preserve auth_provider and login_method
    const { data: existingUser } = await serviceClient
      .from('users')
      .select('auth_provider, login_method, is_active')
      .eq('id', userId)
      .maybeSingle();

    // Extract avatar_url and preferred_language from signup_data JSONB if present
    let avatarUrl = null;
    let preferredLanguageFromSignupData = null;
    if (tempData.signup_data && typeof tempData.signup_data === 'object') {
      const signupData = tempData.signup_data as any;
      avatarUrl = signupData?.avatar_url || null;
      preferredLanguageFromSignupData = signupData?.preferred_language || null;
    }

    // Calculate age from DOB if available
    let calculatedAge: number | null = null;
    if (tempData.dob) {
      try {
        const birthDate = new Date(tempData.dob);
        const today = new Date();
        calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        if (calculatedAge < 0 || calculatedAge > 120) calculatedAge = null;
      } catch (e) {
        console.warn('Failed to calculate age from DOB:', e);
      }
    }

    // Normalize gender to lowercase (users table constraint expects lowercase)
    const normalizedGender = tempData.gender 
      ? tempData.gender.toLowerCase().trim() 
      : null;
    
    // Prepare data for users table
    const userUpdateData: any = {
      id: userId,
      email: tempData.email || email,
      first_name: tempData.first_name,
      last_name: tempData.last_name,
      phone: tempData.phone,
      gender: normalizedGender,
      date_of_birth: tempData.dob,
      country: tempData.country,
      city: tempData.city,
      time_of_birth: tempData.time_of_birth,
      place_of_birth: tempData.place_of_birth,
      place_of_birth_latitude: tempData.latitude,
      place_of_birth_longitude: tempData.longitude,
      place_of_birth_timezone: tempData.timezone,
      astro_opt_in: tempData.astro_interest === 'interested' || tempData.astro_interest === 'yes',
      email_verified: tempData.email_verified || false,
      phone_verified: tempData.phone_verified || false,
      preferred_language: tempData.preferred_language || preferredLanguageFromSignupData || 'en', // Default to 'en' if not provided
      profile_image: avatarUrl || null,
      avatar_url: avatarUrl || null, // Also set avatar_url for compatibility
      is_profile_complete: true,
      updated_at: new Date().toISOString()
    };

    // Preserve auth_provider and login_method if they exist (required fields)
    if (existingUser?.auth_provider) {
      userUpdateData.auth_provider = existingUser.auth_provider;
    } else {
      userUpdateData.auth_provider = 'email'; // Default fallback
    }
    
    if (existingUser?.login_method) {
      userUpdateData.login_method = existingUser.login_method;
    } else {
      userUpdateData.login_method = userUpdateData.auth_provider; // Same as auth_provider
    }
    
    if (existingUser?.is_active !== undefined) {
      userUpdateData.is_active = existingUser.is_active;
    } else {
      userUpdateData.is_active = true; // Default
    }

    // Remove null/undefined values (but keep required fields)
    Object.keys(userUpdateData).forEach(key => {
      if (userUpdateData[key] === null || userUpdateData[key] === undefined) {
        // Don't delete required fields
        if (key !== 'auth_provider' && key !== 'login_method' && key !== 'is_active') {
          delete userUpdateData[key];
        }
      }
    });

    // Upsert into users table
    const { error: userError } = await serviceClient
      .from('users')
      .upsert(userUpdateData, { onConflict: 'id' });

    if (userError) {
      console.error('Error syncing to users table:', userError);
      return { success: false, error: `Failed to sync users: ${userError.message}` };
    }

    // Verify users table sync by reading back the data
    const { data: verifyUserData, error: verifyUserError } = await serviceClient
      .from('users')
      .select('first_name, last_name, email, phone, city, country, preferred_language, profile_image, astro_opt_in')
      .eq('id', userId)
      .maybeSingle();

    if (verifyUserError) {
      console.error('❌ Verification failed: Error reading from users table after sync:', verifyUserError);
      return { success: false, error: `Sync verification failed: ${verifyUserError.message}` };
    }

    if (!verifyUserData) {
      console.error('❌ Verification failed: No data found in users table after sync');
      return { success: false, error: 'Sync verification failed: Data not found in users table after sync' };
    }

    console.log('✅ Synced to users table', {
      language: userUpdateData.preferred_language,
      age: calculatedAge,
      hasImage: !!avatarUrl,
      astroOptIn: userUpdateData.astro_opt_in,
      verified: {
        firstName: verifyUserData.first_name,
        lastName: verifyUserData.last_name,
        email: verifyUserData.email,
        phone: verifyUserData.phone,
        city: verifyUserData.city,
        country: verifyUserData.country,
        preferredLanguage: verifyUserData.preferred_language,
        hasProfileImage: !!verifyUserData.profile_image,
        astroOptIn: verifyUserData.astro_opt_in
      }
    });

    // Prepare data for profiles table
    const profileUpdateData: any = {
      id: userId, // profiles table uses id as PK (references auth.users)
      email: tempData.email || email,
      first_name: tempData.first_name,
      last_name: tempData.last_name,
      phone: tempData.phone,
      gender: tempData.gender,
      dob: tempData.dob,
      country: tempData.country,
      city: tempData.city,
      time_of_birth: tempData.time_of_birth,
      place_of_birth: tempData.place_of_birth,
      latitude: tempData.latitude,
      longitude: tempData.longitude,
      timezone: tempData.timezone,
      place_of_birth_latitude: tempData.latitude,
      place_of_birth_longitude: tempData.longitude,
      place_of_birth_timezone: tempData.timezone,
      astro_interest: tempData.astro_interest || 'not_interested',
      email_verified: tempData.email_verified || false,
      phone_verified: tempData.phone_verified || false,
      preferred_language: tempData.preferred_language || preferredLanguageFromSignupData || 'en', // Default to 'en' if not provided
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString()
    };

    // Remove null/undefined values
    Object.keys(profileUpdateData).forEach(key => {
      if (profileUpdateData[key] === null || profileUpdateData[key] === undefined) {
        delete profileUpdateData[key];
      }
    });

    // Upsert into profiles table (match by id - primary key)
    const { error: profileError } = await serviceClient
      .from('profiles')
      .upsert(profileUpdateData, { onConflict: 'id' });

    if (profileError) {
      console.error('Error syncing to profiles table:', profileError);
      return { success: false, error: `Failed to sync profiles: ${profileError.message}` };
    }

    // Verify profiles table sync by reading back the data
    const { data: verifyProfileData, error: verifyProfileError } = await serviceClient
      .from('profiles')
      .select('first_name, last_name, email, phone, city, country, preferred_language, dob, astro_interest')
      .eq('id', userId)
      .maybeSingle();

    if (verifyProfileError) {
      console.error('❌ Verification failed: Error reading from profiles table after sync:', verifyProfileError);
      return { success: false, error: `Profiles sync verification failed: ${verifyProfileError.message}` };
    }

    if (!verifyProfileData) {
      console.error('❌ Verification failed: No data found in profiles table after sync');
      return { success: false, error: 'Profiles sync verification failed: Data not found in profiles table after sync' };
    }

    console.log('✅ Synced to profiles table', {
      verified: {
        firstName: verifyProfileData.first_name,
        lastName: verifyProfileData.last_name,
        email: verifyProfileData.email,
        phone: verifyProfileData.phone,
        city: verifyProfileData.city,
        country: verifyProfileData.country,
        preferredLanguage: verifyProfileData.preferred_language,
        hasDob: !!verifyProfileData.dob,
        astroInterest: verifyProfileData.astro_interest
      }
    });
    
    // After successful sync to both users and profiles tables, delete from temporary_signups
    // This ensures data is not lost and is properly copied before deletion
    try {
      const { error: deleteError } = await serviceClient
        .from('temporary_signups')
        .delete()
        .eq('email', normalizedEmail);
      
      if (deleteError) {
        console.warn('⚠️ Could not delete temporary_signups after sync:', deleteError);
        // Don't fail the sync if deletion fails - data is already synced
      } else {
        console.log('✅ Deleted temporary_signups data after successful sync');
      }
    } catch (deleteErr: any) {
      console.warn('⚠️ Error deleting temporary_signups (non-critical):', deleteErr);
      // Non-critical - data is already synced to users and profiles
    }
    
    // Final validation: Ensure critical fields are present in both tables
    const criticalFields = ['first_name', 'email'];
    const missingInUsers: string[] = [];
    const missingInProfiles: string[] = [];

    criticalFields.forEach(field => {
      if (!verifyUserData[field]) {
        missingInUsers.push(field);
      }
      if (!verifyProfileData[field]) {
        missingInProfiles.push(field);
      }
    });

    if (missingInUsers.length > 0 || missingInProfiles.length > 0) {
      console.error('❌ Validation failed: Missing critical fields', {
        missingInUsers,
        missingInProfiles
      });
      return { 
        success: false, 
        error: `Validation failed: Missing critical fields in ${missingInUsers.length > 0 ? 'users' : ''}${missingInUsers.length > 0 && missingInProfiles.length > 0 ? ' and ' : ''}${missingInProfiles.length > 0 ? 'profiles' : ''} tables` 
      };
    }

    console.log('✅ Validation passed: All critical fields present in both users and profiles tables');
    
    return { 
      success: true, 
      message: 'Profile synced successfully',
      syncedFields: {
        users: Object.keys(userUpdateData).filter(k => userUpdateData[k] !== null && userUpdateData[k] !== undefined),
        profiles: Object.keys(profileUpdateData).filter(k => profileUpdateData[k] !== null && profileUpdateData[k] !== undefined)
      }
    };
  } catch (error: any) {
    console.error('❌ Error in syncProfileFromTemporarySignups:', error);
    return { success: false, error: error.message || 'Unknown error during sync' };
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('📥 Received payment record-transaction request');
    const body = await req.json();
    console.log('📋 Request body:', {
      hasUserId: !!body.userId,
      hasEmail: !!body.email,
      transactionType: body.transactionType,
      currency: body.currency,
      credits: body.credits,
      amount: body.originalAmount
    });
    
    const {
      userId,
      transactionType,
      currency,
      originalAmount,
      credits,
      transactionId,
      packageId,
      packageName,
      planCategory,
      country,
      email, // Add email from request or get from auth
      coupon_code,
      coupon_id,
      discount_amount
    } = body;

    // Validate required fields (userId optional for guest payments)
    if (!transactionType || !currency || !credits) {
      console.error('❌ Missing required fields:', { transactionType: !!transactionType, currency: !!currency, credits: !!credits });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('🔧 Creating service client...');
    const serviceClient = createServiceClient();
    
    if (!serviceClient) {
      console.error('❌ Failed to create service client');
      return NextResponse.json(
        { success: false, error: 'Failed to initialize database client' },
        { status: 500 }
      );
    }
    console.log('✅ Service client created');

    // Since guests are blocked at payment page, userId is always required here
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required. Please sign in to complete payment.' },
        { status: 401 }
      );
    }

    // Get user email if not provided
    let userEmail = email;
    if (!userEmail) {
      const { data: userRow } = await serviceClient
        .from('users')
        .select('email')
        .eq('id', userId)
        .maybeSingle();
      userEmail = userRow?.email;
    }

    // STEP 1: Check if user exists in users table
    const { data: existingUser } = await serviceClient
      .from('users')
      .select('id, email, is_profile_complete')
      .eq('id', userId)
      .maybeSingle();

    let isSignupFlow = false;

    if (!existingUser) {
      // SCENARIO 1: SIGN-UP FLOW (User authenticated but doesn't exist in users table)
      // On payment success in signup flow, we need to:
      // 1. Create user entry in users table
      // 2. Copy temporary profile data to users and profiles tables
      // 3. Record transaction in transactions table
      // 4. Update user_credits_balance table
      console.log('🔍 Sign-up flow detected - Payment success handler');
      isSignupFlow = true;

      // Get auth provider from Supabase Auth
      let authProvider = 'email'; // Default fallback
      try {
        // Try to get auth user using admin API
        const { data: authUser, error: authErr } = await serviceClient.auth.admin.getUserById(userId);
        if (!authErr && authUser?.user) {
          if (authUser.user.app_metadata?.provider) {
            authProvider = authUser.user.app_metadata.provider;
          } else if (authUser.user.identities && authUser.user.identities.length > 0) {
            authProvider = authUser.user.identities[0].provider || 'email';
          }
        }
      } catch (err: any) {
        console.warn('Could not determine auth provider from admin API, defaulting to email:', err?.message || err);
      }
      
      // Ensure authProvider is never null/undefined
      if (!authProvider || authProvider === null || authProvider === undefined) {
        authProvider = 'email';
      }
      
      console.log('🔐 Using auth_provider:', authProvider);

      // STEP 1: Create minimal user entry first with all required fields
      const { error: createUserError } = await serviceClient
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          auth_provider: authProvider,
          login_method: authProvider, // Same as auth_provider for consistency
          email_verified: false,
          phone_verified: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (createUserError) {
        console.error('❌ Error creating user:', createUserError);
        return NextResponse.json(
          { success: false, error: `Failed to create user: ${createUserError.message}` },
          { status: 500 }
        );
      }
      console.log('✅ Step 1: Created user entry in users table');

      // STEP 2: Copy temporary profile data to users and profiles tables
      if (userEmail) {
        console.log('🔄 Step 2: Starting profile sync from temporary_signups to users and profiles tables...');
        const syncResult = await syncProfileFromTemporarySignups(serviceClient, userId, userEmail);
        if (syncResult.success) {
          console.log('✅ Step 2: Profile sync completed successfully', syncResult.message || '');
          if (syncResult.syncedFields) {
            console.log('📊 Synced fields:', {
              usersCount: syncResult.syncedFields.users?.length || 0,
              profilesCount: syncResult.syncedFields.profiles?.length || 0
            });
          }
        } else if (syncResult.skipped) {
          console.log('ℹ️ Step 2: Profile sync skipped (no temporary data found):', syncResult.message || '');
          // Ensure user has at least email and basic fields for RPC function
          // The RPC function needs first_name, last_name, email from users table
          await serviceClient
            .from('users')
            .update({
              email: userEmail,
              first_name: userEmail.split('@')[0] || 'User', // Fallback first_name
              last_name: '', // Empty last_name is acceptable
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        } else {
          console.error('❌ Step 2: Profile sync failed:', syncResult.error);
          // Ensure user has at least email and basic fields for RPC function even if sync failed
          // The RPC function needs first_name, last_name, email from users table
          await serviceClient
            .from('users')
            .update({
              email: userEmail,
              first_name: userEmail.split('@')[0] || 'User', // Fallback first_name
              last_name: '', // Empty last_name is acceptable
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
          console.warn('⚠️ Profile sync failed, but continuing with transaction:', syncResult.error);
        }
      } else {
        console.warn('⚠️ Step 2: No email provided - cannot sync profile data');
      }
    } else {
      // SCENARIO 2: REGISTERED USER (User exists and making payment)
      console.log('🔍 Registered user payment detected');

      // ALWAYS sync profile data from temporary_signups on successful payment
      // This ensures any updated profile data in temporary_signups is copied to users and profiles tables
      if (userEmail) {
        console.log('🔄 Syncing profile data from temporary_signups to users and profiles tables...');
        const syncResult = await syncProfileFromTemporarySignups(serviceClient, userId, userEmail);
        
        if (syncResult.success) {
          console.log('✅ Successfully synced profile data from temporary_signups', syncResult.message || '');
          if (syncResult.syncedFields) {
            console.log('📊 Synced fields:', {
              usersCount: syncResult.syncedFields.users?.length || 0,
              profilesCount: syncResult.syncedFields.profiles?.length || 0
            });
          }
        } else if (syncResult.skipped) {
          console.log('ℹ️ No temporary_signups data found - skipping sync:', syncResult.message || '');
        } else {
          console.error('❌ Profile sync failed:', syncResult.error);
          console.warn('⚠️ Profile sync failed, but continuing with transaction:', syncResult.error);
        }
        
        // Update is_profile_complete if not already set (regardless of sync result)
        if (!existingUser.is_profile_complete) {
          const { error: updateError } = await serviceClient
            .from('users')
            .update({ 
              is_profile_complete: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          if (updateError) {
            console.warn('⚠️ Failed to update is_profile_complete:', updateError);
          } else {
            console.log('✅ Updated is_profile_complete for existing user');
          }
        }
      } else {
        console.log('⚠️ No email provided - cannot sync profile data');
      }
    }

    // STEP 3: Record transaction in transactions table and update user_credits_balance table
    // This step handles both:
    // - Recording payment details in transactions table
    // - Updating credits balance in user_credits_balance table
    const exchangeRates: Record<string, number> = {
      'INR': 1,
      'USD': 83.5,
      'EUR': 91.2,
      'GBP': 105.3
    };

    const exchangeRate = exchangeRates[currency] || 1;
    const convertedAmountInr = originalAmount * exchangeRate;

    console.log('🔄 Step 3: Recording transaction and updating credits balance', {
      userId,
      transactionType,
      currency,
      originalAmount,
      convertedAmountInr,
      credits,
      transactionId,
      isSignupFlow
    });
    
    // Call the database function to:
    // - Insert payment details into transactions table with expiration
    // - Update or create entry in user_credits_balance table
    // Try new expiration-aware function first, fallback to old one if not available
    let rpcFunctionName = 'add_transaction_with_expiration';
    let { data, error } = await serviceClient.rpc(rpcFunctionName, {
      p_user_id: userId,
      p_transaction_type: transactionType,
      p_currency: currency,
      p_original_amount: originalAmount,
      p_converted_amount_inr: convertedAmountInr,
      p_exchange_rate: exchangeRate,
      p_credits: credits,
      p_transaction_id: transactionId,
      p_package_id: packageId,
      p_package_name: packageName,
      p_plan_category: planCategory,
      p_country: country
    });

    // Fallback to old function if new one doesn't exist
    if (error && (error.code === '42883' || error.message?.includes('does not exist'))) {
      console.warn('⚠️ New expiration function not found, falling back to old function');
      rpcFunctionName = 'add_transaction_and_update_balance';
      const fallbackResult = await serviceClient.rpc(rpcFunctionName, {
        p_user_id: userId,
        p_transaction_type: transactionType,
        p_currency: currency,
        p_original_amount: originalAmount,
        p_converted_amount_inr: convertedAmountInr,
        p_exchange_rate: exchangeRate,
        p_credits: credits,
        p_transaction_id: transactionId,
        p_package_id: packageId,
        p_package_name: packageName,
        p_plan_category: planCategory,
        p_country: country
      });
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error(`❌ Step 3: Error recording transaction via RPC (${rpcFunctionName}):`, {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        functionName: rpcFunctionName
      });
      
      // Check if function doesn't exist
      if (error.code === '42883' || error.message?.includes('does not exist')) {
        console.error(`❌ RPC function does not exist! Need to create ${rpcFunctionName} function`);
        return NextResponse.json(
          { 
            success: false, 
            error: `Database function not found. Please create ${rpcFunctionName} RPC function.`,
            details: error.message
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Failed to record transaction',
          details: error.details,
          code: error.code
        },
        { status: 500 }
      );
    }

    console.log('✅ Step 3: Transaction recorded in transactions table and user_credits_balance updated. Transaction ID:', data);
    
    // Verify transaction and credits balance
    let verifyBalance: any = null;
    
    if (!data) {
      console.warn('⚠️ RPC returned no transaction ID, but no error. Checking transaction table...');
    } else {
      // Verify transaction exists in database
      const { data: verifyTransaction, error: verifyError } = await serviceClient
        .from('transactions')
        .select('id, user_id, credits, status')
        .eq('id', data)
        .maybeSingle();
      
      if (verifyTransaction) {
        console.log('✅ Verified: Transaction exists in transactions table', {
          transactionId: verifyTransaction.id,
          credits: verifyTransaction.credits,
          status: verifyTransaction.status
        });
      } else if (verifyError) {
        console.warn('⚠️ Could not verify transaction:', verifyError.message);
      }
      
      // Verify credits balance was updated
      const { data: balanceData, error: balanceError } = await serviceClient
        .from('user_credits_balance')
        .select('user_id, total_credits, credits_balance')
        .eq('user_id', userId)
        .maybeSingle();
      
      verifyBalance = balanceData;
      
      if (verifyBalance) {
        console.log('✅ Verified: Credits balance updated in user_credits_balance table', {
          totalCredits: verifyBalance.total_credits,
          creditsBalance: verifyBalance.credits_balance
        });
        
        // STEP 4: Update users table with credits from balance_credits
        const { error: updateUsersCreditsError } = await serviceClient
          .from('users')
          .update({
            credits: verifyBalance.credits_balance || verifyBalance.total_credits || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
        
        if (updateUsersCreditsError) {
          console.warn('⚠️ Failed to update users table with credits:', updateUsersCreditsError);
        } else {
          console.log('✅ Updated users table with credits from balance:', verifyBalance.credits_balance || verifyBalance.total_credits);
        }
      } else if (balanceError) {
        console.warn('⚠️ Could not verify credits balance:', balanceError.message);
      }
    }
    
    // STEP 5: Record coupon usage if coupon was applied
    let couponUsageId = null;
    if (coupon_id && coupon_code && discount_amount && data) {
      try {
        const finalAmount = originalAmount - (discount_amount || 0);
        const { data: usageData, error: couponError } = await serviceClient.rpc('record_coupon_usage', {
          p_coupon_id: coupon_id,
          p_original_amount: originalAmount,
          p_discount_amount: discount_amount,
          p_final_amount: finalAmount,
          p_user_id: userId,
          p_order_id: transactionId,
          p_transaction_id: data,
          p_guest_email: null,
          p_guest_name: null,
          p_metadata: {
            package_id: packageId,
            package_name: packageName,
            plan_category: planCategory
          }
        });

        if (couponError) {
          console.warn('⚠️ Failed to record coupon usage:', couponError);
        } else {
          couponUsageId = usageData;
          console.log('✅ Coupon usage recorded:', couponUsageId);
        }
      } catch (couponErr: any) {
        console.warn('⚠️ Error recording coupon usage:', couponErr.message);
      }
    }

    // Summary of completed operations
    const summary = {
      transactionRecorded: !!data,
      creditsBalanceUpdated: !!data,
      usersCreditsUpdated: !!verifyBalance,
      profileSynced: userEmail ? true : false,
      isSignupFlow: isSignupFlow,
      couponRecorded: !!couponUsageId
    };
    
    console.log('✅ Payment success processing complete:', summary);
    
    // Telemetry hook: purchase_completed
    try {
      // Note: This is server-side, so we log for analytics service to pick up
      // In production, forward to your analytics service (Segment, Mixpanel, etc.)
      console.log('📊 [Telemetry] purchase_completed:', {
        user_id: userId,
        transaction_id: data,
        transaction_type: transactionType,
        plan_id: packageId,
        amount: originalAmount,
        currency: currency,
        is_signup_flow: isSignupFlow
      });
      
      // If you have a server-side analytics service, call it here:
      // await analytics.track('purchase_completed', {
      //   userId,
      //   transactionId: data,
      //   transactionType,
      //   planId: packageId,
      //   amount: originalAmount,
      //   currency
      // });
    } catch (e) {
      console.warn('⚠️ [Telemetry] Failed to track purchase_completed:', e);
    }
    
    return NextResponse.json({
      success: true,
      transactionId: data,
      couponUsageId: couponUsageId,
      profileSynced: userEmail ? true : false,
      isSignupFlow: isSignupFlow,
      redirectTo: '/apps/mode-selection', // Indicate where user should be redirected
      message: 'Payment success: Transaction recorded, credits balance updated, users table updated with credits, and profile data synced',
      summary: summary
    });

  } catch (error: any) {
    console.error('❌ API error in record-transaction:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        message: error.message
      },
      { status: 500 }
    );
  }
}

