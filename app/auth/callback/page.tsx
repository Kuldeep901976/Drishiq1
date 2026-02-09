'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const processCallback = async () => {
      try {
        console.log('🔐 OAuth Callback - Starting...');

        // Poll for session
        let session = null;
        let attempts = 0;
        const maxAttempts = 20;

        while (!session && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;

          if (!isMounted) return;

          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

          console.log(`Session check (attempt ${attempts}/${maxAttempts}):`, { 
            hasSession: !!currentSession, 
            error: sessionError?.message 
          });

          if (sessionError) {
            throw new Error('Session error: ' + sessionError.message);
          }

          if (currentSession?.user) {
            session = currentSession;
            console.log('✅ Session found!');
            break;
          }
        }

        if (!session?.user) {
          console.log('❌ No session found after polling, listening for auth state change...');
          
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              console.log('🔄 Auth state changed:', event);
              
              if (!isMounted) return;

              if (event === 'SIGNED_IN' && newSession?.user) {
                console.log('✅ User signed in via state change');
                subscription?.unsubscribe();
                await handleAuthSuccess(newSession);
              } else if (newSession?.user) {
                subscription?.unsubscribe();
                await handleAuthSuccess(newSession);
              }
            }
          );

          const timeoutId = setTimeout(() => {
            if (isMounted) {
              subscription?.unsubscribe();
              console.error('❌ Auth timeout');
              setError('Authentication timeout - please try again');
              setLoading(false);
            }
          }, 15000);

          return () => {
            clearTimeout(timeoutId);
            subscription?.unsubscribe();
          };
        }

        await handleAuthSuccess(session);

      } catch (err: any) {
        console.error('❌ Callback error:', err);
        if (isMounted) {
          setError(err.message || 'Authentication failed');
          setLoading(false);
        }
      }
    };

    const handleAuthSuccess = async (session: any) => {
      try {
        if (!isMounted) return;
        
        const user = session.user;
        console.log('✅ Processing authenticated user:', user.email);

        // Get signup parameters
        const userCategory = typeof window !== 'undefined' 
          ? sessionStorage.getItem('signup_category') || 'regular'
          : 'regular';
        const userType = typeof window !== 'undefined' 
          ? sessionStorage.getItem('signup_user_type') || 'user'
          : 'user';
        const isSignup = searchParams.get('signup') === 'true';

        console.log('📋 Auth params:', { userType, userCategory, isSignup });

        // IMPORTANT: Check if user already exists in users table (completed account)
        const { data: existingUser, error: selectError } = await supabase
          .from('users')
          .select('id, user_role, user_category, is_profile_complete')
          .eq('email', user.email)
          .maybeSingle();

        console.log('🔍 User lookup result:', { 
          exists: !!existingUser, 
          error: selectError?.message 
        });

        // If user exists - this is a signin, not signup
        if (existingUser) {
          console.log('👤 Existing user found - authenticated');
          if (isMounted) {
            setLoading(false);
            const redirect = typeof window !== 'undefined' ? sessionStorage.getItem('post_signup_redirect') : null;
            if (redirect) {
              sessionStorage.removeItem('post_signup_redirect');
              router.push(redirect);
            } else {
              router.push('/profile');
            }
          }
          return;
        }

        // NEW USER - Redirect to profile page (or to payment if post_signup_redirect is set)
        // Profile page will save to temporary_signups; then redirect param sends user to payment
        console.log('📝 New user detected - skipping users table creation');
        const redirect = typeof window !== 'undefined' ? sessionStorage.getItem('post_signup_redirect') : null;
        if (redirect) {
          console.log('🚀 Redirecting to profile (then to payment after completion)');
          sessionStorage.setItem('post_signup_redirect', redirect); // keep for profile page
        } else {
          console.log('🚀 Redirecting to profile for completion');
        }
        if (isMounted) {
          setLoading(false);
          router.push('/profile');
        }

      } catch (err: any) {
        console.error('❌ Auth handler error:', err);
        if (isMounted) {
          setError(err.message || 'Error processing authentication');
          setLoading(false);
        }
      }
    };

    processCallback();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/signin'}
              className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium transition-colors"
            >
              Back to Sign In
            </button>
            <button
              onClick={() => window.location.href = '/signup'}
              className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium transition-colors"
            >
              Try Sign Up Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="text-center">
        <div className="mb-6">
          <svg className="mx-auto h-16 w-16 text-green-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Setting up your account</h1>
        <p className="text-gray-600 mb-2">Completing your authentication</p>
        <p className="text-sm text-gray-500">This may take a few moments...</p>
      </div>
    </div>
  );
}