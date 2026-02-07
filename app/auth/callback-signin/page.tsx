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

          if (!isMounted) {
            throw new Error('Component unmounted');
          }

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
          console.log('⌛ No session found after polling, listening for auth state change...');
          
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              console.log('🔄 Auth state changed:', event);
              
              if (!isMounted) {
                subscription?.unsubscribe();
                return;
              }

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
              console.error('⌛ Auth timeout');
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
        if (err.message === 'Component unmounted') {
          // Expected, do nothing
          return;
        }
        if (isMounted) {
          setError(err.message || 'Authentication failed');
          setLoading(false);
        }
      }
    };

    const handleAuthSuccess = async (session: any) => {
      try {
        if (!isMounted) {
          console.log('Component unmounted, skipping auth handler');
          throw new Error('Component unmounted');
        }
        
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

        // Step 1: Check if user exists in users table by UUID
        let existingUser = null;
        let selectError = null;

        // Query by user ID (auth UUID)
        const { data: userById, error: errorById } = await supabase
          .from('users')
          .select('id, email, is_active')
          .eq('id', user.id)
          .maybeSingle();

        if (userById) {
          existingUser = userById;
          console.log('🔍 User found by ID:', user.id);
        } else if (errorById) {
          console.log('⚠️ Query by ID failed:', errorById.message);
          
          // Fallback to email query
          const { data: userByEmail, error: errorByEmail } = await supabase
            .from('users')
            .select('id, email, is_active')
            .eq('email', user.email)
            .maybeSingle();

          existingUser = userByEmail;
          selectError = errorByEmail;
          
          if (userByEmail) {
            console.log('🔍 User found by email:', user.email);
          }
        }

        console.log('🔍 User lookup result:', { 
          exists: !!existingUser, 
          isActive: existingUser?.is_active,
          error: selectError?.message,
          userId: user.id,
          userEmail: user.email
        });

        // Step 2: Validate user exists and is active
        if (!existingUser) {
          console.log('❌ User authenticated but not found in users table');
          console.log('📧 Auth user:', user.email, 'UUID:', user.id);
          throw new Error('USER_NOT_IN_DATABASE');
        }

        if (!existingUser.is_active) {
          console.log('❌ User account is inactive');
          throw new Error('USER_ACCOUNT_INACTIVE');
        }

        console.log('✅ User found and active:', existingUser.email);

        // Step 3: Check user credits in user_credits_balance table
        const { data: creditData, error: creditError } = await supabase
          .from('user_credits_balance')
          .select('credits_balance')
          .eq('user_id', existingUser.id)
          .maybeSingle();

        if (creditError) {
          console.error('⚠️ Error fetching credits:', creditError.message);
        }

        const credits = creditData?.credits_balance ?? 0;

        console.log('💳 Credit status:', { 
          userId: existingUser.id,
          email: existingUser.email,
          credits: credits,
          hasCredits: credits >= 1
        });

        if (!isMounted) {
          console.log('Component unmounted during credit check');
          throw new Error('Component unmounted');
        }

        // Step 4: Redirect based on credit balance
        setLoading(false);

        if (credits >= 1) {
          console.log('✅ User has credits (' + credits + ') → /apps/mode-selection');
          router.push('/apps/mode-selection');
        } else {
          console.log('💰 User has no credits (0) → /priceplan#main-plans');
          router.push('/priceplan#main-plans');
        }

      } catch (err: any) {
        console.error('❌ Auth handler error:', err);
        
        // Handle special cases
        if (err.message === 'USER_NOT_IN_DATABASE') {
          if (isMounted) {
            setError('Account not found. Please complete the signup process first.');
            setLoading(false);
            setTimeout(() => {
              router.push('/signup');
            }, 2500);
          }
        } else if (err.message === 'USER_ACCOUNT_INACTIVE') {
          if (isMounted) {
            setError('Your account has been deactivated. Please contact support.');
            setLoading(false);
          }
        } else if (err.message === 'REDIRECT_COMPLETE' || err.message === 'Component unmounted') {
          // Expected flow, do nothing
        } else {
          if (isMounted) {
            setError(err.message || 'Error processing authentication');
            setLoading(false);
          }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Validating your credentials</h1>
        <p className="text-gray-600 mb-2">Solving another puzzle of life today</p>
        <p className="text-sm text-gray-500">This may take a few moments...</p>
      </div>
    </div>
  );
}