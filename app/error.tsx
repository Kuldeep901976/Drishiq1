'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // During build/prerender, return minimal valid content instead of null
  // This prevents Next.js from trying to generate static 500.html
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return (
      <div>
        <h1>Error</h1>
      </div>
    );
  }
  
  // Return minimal component during SSR (runtime, not build)
  if (typeof window === 'undefined') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Something went wrong!</h1>
          <p className="text-gray-600 mb-6">An error occurred. Please refresh the page.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Something went wrong!</h1>
        <p className="text-gray-600 mb-6">{error.message || 'An unexpected error occurred'}</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-[#0B4422] text-white rounded-lg hover:bg-[#083318] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

