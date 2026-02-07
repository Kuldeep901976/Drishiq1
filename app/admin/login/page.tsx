'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AdminLoginPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to unified login with admin type
    // Safely handle searchParams - might be null during SSR/prerender
    const searchParamsString = searchParams ? (searchParams.toString() || '') : '';
    const params = new URLSearchParams(searchParamsString);
    params.set('type', 'admin');
    const redirectUrl = `/signup?${params.toString()}`;
    window.location.href = redirectUrl;
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to admin login...</p>
      </div>
    </div>
  );
}
