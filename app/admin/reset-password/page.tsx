'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AdminResetPasswordPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to unified password reset with admin mode
    // Safely handle searchParams - might be null during SSR/prerender
    const searchParamsString = searchParams ? (searchParams.toString() || '') : '';
    const params = new URLSearchParams(searchParamsString);
    params.set('mode', 'admin');
    const redirectUrl = `/unified-password-reset?${params.toString()}`;
    window.location.href = redirectUrl;
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to admin password reset...</p>
      </div>
    </div>
  );
}








