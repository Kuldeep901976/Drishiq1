'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  MagicLinkCompleteGateProps, 
  AuthSuccess, 
  AuthError 
} from './types';

export default function MagicLinkCompleteGate({
  children,
  onComplete,
  onError
}: MagicLinkCompleteGateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    const handleMagicLink = async () => {
      try {
        // Check if we're on a magic link callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        // Check for URL hash fragments (magic link tokens)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          // Parse the hash to extract tokens
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const type = params.get('type');

          if (accessToken && type === 'email') {
            // Set the session manually
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });

            if (sessionError) {
              throw sessionError;
            }

            if (sessionData.session && sessionData.user) {
              // Successfully authenticated
              // Map Supabase user to our User interface
              const mappedUser: any = {
                uid: sessionData.user.id,
                email: sessionData.user.email,
                emailVerified: sessionData.user.email_confirmed_at ? true : false,
                displayName: sessionData.user.user_metadata?.full_name || sessionData.user.user_metadata?.name,
                photoURL: sessionData.user.user_metadata?.avatar_url,
                metadata: sessionData.user.user_metadata,
                providerData: [],
                refreshToken: sessionData.session.refresh_token,
                tenantId: null,
                isAnonymous: false,
                providerId: 'supabase'
              };
              
              const result: AuthSuccess = {
                user: mappedUser,
                session: sessionData.session,
                provider: 'email'
              };

              // Clear the URL hash
              window.history.replaceState({}, document.title, window.location.pathname);
              
              // Call the success callback
              onComplete(result);
              
              // Redirect to dashboard or home
              router.push('/dashboard');
              return;
            }
          }
        }

        // Check if we already have a valid session
        if (data.session && data.session.user) {
          // Map Supabase user to our User interface
          const mappedUser: any = {
            uid: data.session.user.id,
            email: data.session.user.email,
            emailVerified: data.session.user.email_confirmed_at ? true : false,
            displayName: data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name,
            photoURL: data.session.user.user_metadata?.avatar_url,
            metadata: data.session.user.user_metadata,
            providerData: [],
            refreshToken: data.session.refresh_token,
            tenantId: null,
            isAnonymous: false,
            providerId: 'supabase'
          };
          
          const result: AuthSuccess = {
            user: mappedUser,
            session: data.session,
            provider: 'email'
          };
          onComplete(result);
          router.push('/dashboard');
          return;
        }

        // No magic link or session found, show children
        setIsProcessing(false);
        
      } catch (error: any) {
        console.error('Magic link processing error:', error);
        
        const authError: AuthError = {
          code: 'MAGIC_LINK_FAILED',
          message: error.message || 'Failed to process magic link',
          details: error
        };

        setError(authError);
        onError(authError);
        setIsProcessing(false);
      }
    };

    handleMagicLink();
  }, [router, onComplete, onError]);

  // Show loading state while processing
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Processing Magic Link
          </h2>
          <p className="text-sm text-gray-600">
            Please wait while we verify your authentication...
          </p>
        </div>
      </div>
    );
  }

  // Show error state if magic link failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Authentication Failed
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            {error.message}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/auth/signin')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Signing In Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show children if no magic link processing is needed
  return <>{children}</>;
}

// Higher-order component for wrapping pages that need magic link handling
export function withMagicLinkHandling<P extends object>(
  Component: React.ComponentType<P>
) {
  return function MagicLinkWrappedComponent(props: P) {
    return (
      <MagicLinkCompleteGate
        onComplete={(result) => {
          console.log('Magic link authentication successful:', result);
          // You can add global state updates here
        }}
        onError={(error) => {
          console.error('Magic link authentication failed:', error);
          // You can add global error handling here
        }}
      >
        <Component {...props} />
      </MagicLinkCompleteGate>
    );
  };
}
