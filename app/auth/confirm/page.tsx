'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FlowController } from '@/lib/flow-controller';

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAuthConfirm = async () => {
      try {
        // Get query parameters from the URL
        const tokenHash = searchParams?.get('token_hash');
        const type = searchParams?.get('type');
        
        console.log('Auth confirm - Token hash:', tokenHash);
        console.log('Auth confirm - Type:', type);
        
        if (!tokenHash) {
          throw new Error('No token hash found');
        }

        // Exchange the token hash for a session
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any || 'email',
        });

        if (error) throw error;

        console.log('Auth confirm - Session verified successfully');

        // For first-time users (email signup), go to profile (root /profile has redirect-after-save for payment handoff)
        if (type === 'email' || type === 'signup') {
          const redirect = typeof window !== 'undefined' ? sessionStorage.getItem('post_signup_redirect') : null;
          if (redirect) {
            console.log('New user signup, redirecting to profile (then to payment)');
            router.push('/profile');
          } else {
            console.log('New user signup, redirecting to profile');
            router.push('/user/profile');
          }
        } else if (type === 'recovery') {
          // Password recovery, go to create-password
          console.log('Password recovery, redirecting to create-password');
          router.push('/user/create-password');
        } else {
          // Existing user, redirect based on FlowController
          const flowController = FlowController.getInstance();
          const nextRoute = flowController.getNextRoute();
          console.log('Existing user, redirecting to:', nextRoute);
          router.push(nextRoute);
        }

      } catch (err: any) {
        console.error('Auth confirm error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    handleAuthConfirm();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Authentication Error</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={() => router.push('/user/signin')}
            className="px-4 py-2 bg-[#0B4422] text-white rounded-lg hover:bg-[#083318]"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 h-12 border-b-2 border-[#0B4422] mx-auto mb-4"></div>
        <p className="text-gray-600">Confirming your email...</p>
      </div>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthConfirmContent />
    </Suspense>
  );
}
