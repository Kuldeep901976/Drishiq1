'use client';

import { memo } from 'react';
import TranslationProvider from './TranslationProvider';

const LoadingSpinner = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422] mx-auto mb-4"></div>
      <p className="text-[#0B4422]">Loading DrishiQ...</p>
    </div>
  </div>
);

const ClientProviders = memo(({ children }: { children: React.ReactNode }) => {
  return (
    <TranslationProvider fallback={<LoadingSpinner />}>
      {children}
    </TranslationProvider>
  );
});

ClientProviders.displayName = 'ClientProviders';

export default ClientProviders; 
