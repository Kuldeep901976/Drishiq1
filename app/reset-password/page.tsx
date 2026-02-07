'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Prevent static generation - this page must be rendered dynamically
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

function ResetPasswordContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to unified password reset with user mode
    if (typeof window === 'undefined') return;
    
    try {
      // Safely handle searchParams - might be null during SSR/prerender
      const searchParamsString = searchParams ? (searchParams.toString() || '') : '';
      const params = new URLSearchParams(searchParamsString);
      params.set('mode', 'user');
      const redirectUrl = `/unified-password-reset?${params.toString()}`;
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Error redirecting:', error);
      // Fallback redirect
      window.location.href = '/unified-password-reset?mode=user';
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to password reset...</p>
      </div>
    </div>
  );
}

export default function UserResetPasswordPage() {
  // Return null during SSR to prevent any undefined access
  if (typeof window === 'undefined') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}








