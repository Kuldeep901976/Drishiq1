'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Footer from '@/components/Footer';
import PhoneCaptureAuthFirebase from '@/components/auth/PhoneCaptureAuthFirebase';

export default function ProfileCompletionPage() {
  const router = useRouter();
  const [step, setStep] = useState<'loading' | 'name' | 'phone' | 'complete'>('loading');
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tempSignupData, setTempSignupData] = useState<any>(null);

  useEffect(() => {
    checkUserProfile();
  }, [router]);

  const checkUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/signin');
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);
      setEmail(currentUser.email || '');
      setEmailVerified(!!currentUser.email_confirmed_at);

      // Check temporary_signups first for incomplete signups
      let tempData = null;
      try {
        const { data } = await supabase
          .from('temporary_signups')
          .select('*')
          .eq('email', currentUser.email)
          .maybeSingle();

        if (data) {
          tempData = data;
          // Prefill name from temp signup
          if (data.first_name && data.last_name) {
            setName(`${data.first_name} ${data.last_name}`);
          }
        }
      } catch (err) {
        console.log('Temp signup query error:', err);
        // Continue anyway - user can still verify phone
      }

      // Check if profile exists and is completed in users table
      let userData = null;
      try {
        const { data } = await supabase
          .from('users')
          .select('first_name, last_name, phone, phone_verified, is_profile_complete')
          .eq('id', currentUser.id)
          .single();

        userData = data;
        if (userData?.is_profile_complete && userData?.phone_verified) {
          router.push('/apps/chat');
          return;
        }
      } catch (dbError) {
        console.log('Database query failed, proceeding with profile completion:', dbError.message);
      }

      // Merge data: prefer users table phone (most recent) over temporary_signups
      // This ensures if user updated phone on profile page, it shows the latest
      const mergedData = {
        ...tempData,
        phone: userData?.phone || tempData?.phone || '', // Use users table phone if available (most recent)
        first_name: userData?.first_name || tempData?.first_name,
        last_name: userData?.last_name || tempData?.last_name,
      };
      setTempSignupData(mergedData);

      // Prefill name from various sources
      const existingName = 
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        '';

      setName(existingName);

      // Always proceed to phone verification - don't redirect
      setStep('phone');
    } catch (err) {
      console.error('Error checking profile:', err);
      setError('Failed to load profile');
      setStep('name');
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Update user metadata with name
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: name.trim()
        }
      });

      if (authError) throw authError;

      // Update users table with name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          email_verified: emailVerified,
          updated_at: new Date().toISOString()
        });

      if (userError) throw userError;

      setStep('phone');
    } catch (err: any) {
      console.error('Error updating name:', err);
      setError(err.message || 'Failed to update name');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneVerified = async (phoneNumber: string) => {
    console.log('📱 Phone verified:', phoneNumber);
    
    if (!emailVerified) {
      setError('Email verification is required before completing profile. Please check your email and click the verification link.');
      return;
    }

    setIsSubmitting(true);

    try {
      const userType = typeof window !== 'undefined' 
        ? sessionStorage.getItem('signup_user_type') || 'user'
        : 'user';

      // Get all user data from users table to save to temporary_signups
      const { data: existingUserData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // Get name parts
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || existingUserData?.first_name || '';
      const lastName = nameParts.slice(1).join(' ') || existingUserData?.last_name || '';

      // STEP 1: Save ALL user details including UUID to temporary_signups table
      console.log('💾 Saving all user details to temporary_signups including UUID...');
      const saveTemporaryResponse = await fetch('/api/profile/save-temporary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          oauthId: user.id, // UUID from auth user
          firstName: firstName,
          lastName: lastName,
          phone: phoneNumber,
          phoneVerified: true,
          emailVerified: emailVerified,
          authProvider: user.app_metadata?.provider || 'email',
          userRole: userType,
          // Include any existing profile data from users table
          gender: existingUserData?.gender || null,
          dob: existingUserData?.date_of_birth || existingUserData?.dob || null,
          country: existingUserData?.country || null,
          city: existingUserData?.city || null,
          timeOfBirth: existingUserData?.time_of_birth || null,
          placeOfBirth: existingUserData?.place_of_birth || null,
          latitude: existingUserData?.place_of_birth_latitude || existingUserData?.latitude || null,
          longitude: existingUserData?.place_of_birth_longitude || existingUserData?.longitude || null,
          timezone: existingUserData?.place_of_birth_timezone || existingUserData?.timezone || null,
          astroOptIn: existingUserData?.astro_opt_in || false,
          preferredLanguage: existingUserData?.preferred_language || 'en',
          avatarUrl: existingUserData?.profile_image || existingUserData?.avatar_url || null,
        }),
      });

      if (!saveTemporaryResponse.ok) {
        const errorData = await saveTemporaryResponse.json();
        console.error('❌ Failed to save to temporary_signups:', errorData);
        throw new Error(errorData.error || 'Failed to save profile to temporary_signups');
      }

      const tempSaveResult = await saveTemporaryResponse.json();
      console.log('✅ Saved to temporary_signups:', tempSaveResult);

      // STEP 2: Update users table with phone verification status
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: email,
          phone: phoneNumber,
          phone_verified: true,
          email_verified: emailVerified,
          is_profile_complete: true,
          user_type: userType,
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString()
        });

      if (userError) throw userError;

      // STEP 3: Update auth user metadata
      await supabase.auth.updateUser({
        data: {
          phone: phoneNumber,
          phone_verified: true,
          email_verified: emailVerified,
          profile_completed: true
        }
      });

      console.log('✅ Profile completed successfully');
      console.log('✅ All user details including UUID saved to temporary_signups');
      console.log('ℹ️ temporary_signups data will be synced to users/profiles tables on successful payment');

      setStep('complete');
      
      setTimeout(() => {
        router.push('/app/priceplan#clarity-pass');
      }, 1500);
    } catch (err: any) {
      console.error('Error completing profile:', err);
      setError(err.message || 'Failed to complete profile');
      setIsSubmitting(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0B4422] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-[#0B4422] mb-2">Profile Complete!</h2>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#0B4422] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📱</span>
            </div>
            <h1 className="text-3xl font-bold text-[#0B4422] mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">Just a few more details to get started</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Step 1: Name Collection */}
            {step === 'name' && (
              <form onSubmit={handleNameSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                    />
                    {emailVerified && (
                      <span className="absolute right-3 top-3 text-green-600 text-sm flex items-center gap-1">
                        <span>✓</span> Verified
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4422]/20 focus:border-[#0B4422]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="w-full bg-[#0B4422] text-white py-3 px-4 rounded-lg hover:bg-[#0B4422]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                >
                  {isSubmitting ? 'Saving...' : 'Continue to Phone Verification'}
                </button>
              </form>
            )}

            {/* Step 2: Phone Verification */}
            {step === 'phone' && (
              <div>
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Name:</strong> {name}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Email:</strong> {email} 
                    {emailVerified ? (
                      <span className="text-green-600 ml-2">✓ Verified</span>
                    ) : (
                      <span className="text-red-600 ml-2">⚠️ Not Verified</span>
                    )}
                  </p>
                  {tempSignupData?.phone && (
                    <p className="text-sm text-blue-700 mt-2">
                      <strong>Phone:</strong> {tempSignupData.phone}
                    </p>
                  )}
                </div>

                {!emailVerified && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">⚠️ Email Verification Required</h4>
                    <p className="text-sm text-red-700 mb-3">
                      You must verify your email address before proceeding with phone verification.
                    </p>
                    <p className="text-sm text-red-700">
                      Please check your email inbox and click the verification link, then refresh this page.
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    📱 Verify Your Phone Number
                  </h3>
                  <p className="text-sm text-gray-600">
                    {emailVerified 
                      ? "We'll send you an OTP via SMS to verify your phone number."
                      : "Phone verification will be available after email verification."
                    }
                  </p>
                </div>

                {emailVerified ? (
                  <PhoneCaptureAuthFirebase
                    prefilledPhone={tempSignupData?.phone || ''}
                    onSuccess={(result: any) => {
                      console.log('Phone auth success:', result);
                      const phone = result?.phoneNumber || result?.phone || tempSignupData?.phone || '';
                      if (phone) {
                        handlePhoneVerified(phone);
                      }
                    }}
                    onCancel={() => {
                      router.push('/signin');
                    }}
                    onLinkNeeded={(info: any) => {
                      console.log('Link needed:', info);
                    }}
                  />
                ) : (
                  <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <p className="text-gray-500 mb-4">Phone verification is disabled until email is verified.</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Refresh Page After Email Verification
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Your information is secure and will only be used to personalize your DrishiQ experience.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}