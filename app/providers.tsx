'use client';
import { LanguageProvider, useLanguage } from '@/lib/drishiq-i18n';

interface LanguageLoadingOverlayProps {
  isVisible: boolean;
  targetLanguage?: string;
}

function LanguageLoadingOverlay({ 
  isVisible, 
  targetLanguage 
}: LanguageLoadingOverlayProps) {
  if (!isVisible) return null;

  const languageNames: Record<string, string> = {
    en: 'English',
    hi: 'हिंदी',
    bn: 'বাংলা',
    ta: 'தமிழ்',
    ru: 'Русский',
    ar: 'العربية',
    es: 'Español',
    de: 'Deutsch',
    pt: 'Português',
    zh: '中文',
    ja: '日本語',
    fr: 'Français',
  };

  const displayName = targetLanguage ? languageNames[targetLanguage] || targetLanguage.toUpperCase() : '';

  return (
    <div className="language-loading-overlay">
      <div className="language-loading-overlay-content">
        <div className="language-loading-spinner" />
        <div className="language-loading-text">
          <div className="language-loading-title">
            Loading Language...
          </div>
          {displayName && (
            <div className="language-loading-subtitle">
              Switching to {displayName}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LanguageLoadingWrapper({ children }: { children: React.ReactNode }) {
  const { isChangingLanguage, targetLanguage } = useLanguage();
  
  return (
    <>
      <LanguageLoadingOverlay 
        isVisible={isChangingLanguage} 
        targetLanguage={targetLanguage || undefined}
      />
      {children}
    </>
  );
}

export function Providers({ 
  children, 
  initialLang 
}: { 
  children: React.ReactNode;
  initialLang?: string;
}) {
  return (
    <LanguageProvider initialLang={initialLang}>
      <LanguageLoadingWrapper>
        {children}
      </LanguageLoadingWrapper>
    </LanguageProvider>
  );
}