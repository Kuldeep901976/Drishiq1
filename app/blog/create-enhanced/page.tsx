'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function EnhancedBlogCreate() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to main blog create page
    // Safely handle searchParams - might be null during SSR/prerender
    const searchParamsString = searchParams ? (searchParams.toString() || '') : '';
    const params = new URLSearchParams(searchParamsString);
    const redirectUrl = `/blog/create?${params.toString()}`;
    window.location.href = redirectUrl;
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to blog creation...</p>
      </div>
    </div>
  );
}










