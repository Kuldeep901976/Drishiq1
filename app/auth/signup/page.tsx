'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * /auth/signup — Forward to main signup page with same query params.
 * Preserves redirect= (e.g. payment URL) and message= for post-signup flow.
 */
export default function AuthSignupPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const target = query ? `/signup?${query}` : '/signup';
    window.location.replace(target);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="text-center text-gray-600">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent mx-auto mb-3" />
        <p>Taking you to sign up...</p>
      </div>
    </div>
  );
}
