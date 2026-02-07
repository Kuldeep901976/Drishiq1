'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function UserCreatePasswordPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to main auth create-password page
    // Safely handle searchParams - might be null during SSR/prerender
    const searchParamsString = searchParams ? (searchParams.toString() || '') : '';
    const params = new URLSearchParams(searchParamsString);
    const redirectUrl = `/auth/create-password?${params.toString()}`;
    window.location.href = redirectUrl;
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to password creation...</p>
      </div>
    </div>
  );
}
