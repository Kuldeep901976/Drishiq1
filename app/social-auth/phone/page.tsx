'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SocialAuthPhoneCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socialEmail, setSocialEmail] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔐 Social Auth Phone Callback - Starting...');

        // Poll for session with retries
        let session = null;
        let attempts = 0;
        const maxAttempts = 25; // 25 × 500ms = 12.5 seconds

        while (!session && attempts < maxAttempts) {
          attempts++;
          console.log(`📍 Session poll attempt ${attempts}/${maxAttempts}`);

          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            console.error('❌ Session error:', sessionError);
            throw new Error(sessionError.message);
          }

          if (currentSession?.user) {
            console.log('✅ Session found:', currentSession.user.email);
            session = currentSession;
            break;
          }

          // Wait before next attempt
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        if (!session?.user) {
          console.error('❌ No session found after polling');
          throw new Error('Social authentication failed - no session found');
        }

        const user = session.user;
        const email = user.email;

        console.log('📧 User email:', email);

        if (!email) {
          throw new Error('Email not provided by social provider');
        }

        setSocialEmail(email);

        // Check if user already exists
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('id, phone_verified, phone')
          .eq('email', email)
          .single();

        console.log('User check:', {
          exists: !!existingUser && !userError,
          phoneVerified: existingUser?.phone_verified,
          error: userError?.code
        });

        if (existingUser && !userError) {
          // User exists
          if (existingUser.phone_verified) {
            // User already verified, redirect to dashboard
            console.log('✅ User already verified, redirecting to dashboard');
            router.push('/user/dashboard');
            return;
          } else {
            // User exists but phone not verified
            console.log('⏳ Phone not verified, redirecting to phone step');
            router.push(`/social-auth?email=${encodeURIComponent(email)}&step=phone`);
            return;
          }
        } else if (userError?.code !== 'PGRST116') {
          // Error other than "not found"
          throw new Error('Error checking user profile: ' + userError?.message);
        } else {
          // New user - create profile
          console.log('📝 Creating new user profile');

          const firstName = user.user_metadata?.full_name?.split(' ')[0] || '';
          const lastName = user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';

          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: email,
              first_name: firstName,
              last_name: lastName,
              user_type: 'user',
              email_verified: !!user.email_confirmed_at,
              phone_verified: false,
              is_profile_complete: false,
              is_active: true,
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('Error creating user profile:', insertError);
            throw new Error('Failed to create user profile: ' + insertError.message);
          }

          console.log('✅ New user created');
          router.push(`/social-auth?email=${encodeURIComponent(email)}&step=phone`);
        }

      } catch (error: any) {
        console.error('❌ Social auth error:', error);
        setError(error.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Completing social authentication...</p>
          <p className="text-xs text-gray-500 mt-2">This may take a few moments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-gray-900 mb-4">Authentication Failed</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/social-auth')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to phone verification...</p>
      </div>
    </div>
  );
}