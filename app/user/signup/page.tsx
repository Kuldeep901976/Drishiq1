'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function UserSignupPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to main auth signup page
    // Safely handle searchParams - might be null during SSR/prerender
    const searchParamsString = searchParams ? (searchParams.toString() || '') : '';
    const params = new URLSearchParams(searchParamsString);
    const redirectUrl = `/auth/login?${params.toString()}`;
    window.location.href = redirectUrl;
  }, [searchParams]);

    return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to signup...</p>
        </div>
      </div>
    );
  }
