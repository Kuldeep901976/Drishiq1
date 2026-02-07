'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SessionsPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to unified sessions with user mode
    // Safely handle searchParams - might be null during SSR/prerender
    const searchParamsString = searchParams ? (searchParams.toString() || '') : '';
    const params = new URLSearchParams(searchParamsString);
    params.set('mode', 'user');
    const redirectUrl = `/unified-sessions?${params.toString()}`;
    window.location.href = redirectUrl;
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to sessions...</p>
      </div>
    </div>
  );
} 
