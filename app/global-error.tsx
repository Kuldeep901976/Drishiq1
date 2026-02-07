'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // During build/prerender, return null to prevent any build-time errors
  // Global error pages should never be statically generated
  if (typeof window === 'undefined' || process.env.NEXT_PHASE === 'phase-production-build') {
    return (
      <html suppressHydrationWarning>
        <body suppressHydrationWarning>
          <div>Error</div>
        </body>
      </html>
    );
  }
  
  // global-error.tsx must return html and body tags
  // But we need to prevent it from being prerendered
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
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
      </body>
    </html>
  );
}

