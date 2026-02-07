'use client';

import React, { Suspense, memo } from 'react';
import { LanguageProvider } from '@/lib/drishiq-i18n';

interface TranslationProviderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  initialLang?: string;
  defaultNamespaces?: string[];
}

const TranslationProvider = memo(function TranslationProvider({
  children,
  fallback = null,
  initialLang,
  defaultNamespaces = ['common'],
}: TranslationProviderProps) {
  return (
    <LanguageProvider initialLang={initialLang} defaultNamespaces={defaultNamespaces}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </LanguageProvider>
  );
});

TranslationProvider.displayName = 'TranslationProvider';

export default TranslationProvider;
