'use client';

import React from 'react';
import Image from 'next/image';
import type { LanguageOption } from '@/lib/onboarding-concierge/regional-languages';

const HINT_TEXT: Record<string, string> = {
  en: 'Click on the left menu to change language.',
  fr: 'Cliquez sur le menu de langue à gauche pour changer la langue.',
  es: 'Haz clic en el menú de idioma a la izquierda para cambiar el idioma.',
  zh: '点击左侧语言菜单可切换语言。',
  hi: 'भाषा बदलने के लिए बाएं भाषा मेनू पर क्लिक करें।',
  ta: 'மொழியை மாற்ற இடது மெனுவைக் கிளிக் செய்யவும்.',
  bn: 'ভাষা পরিবর্তন করতে বাম মেনুতে ক্লিক করুন।',
  ar: 'انقر على قائمة اللغة على اليسار لتغيير اللغة.',
  pt: 'Clique no menu de idioma à esquerda para mudar o idioma.',
  de: 'Klicken Sie links auf das Sprachmenü, um die Sprache zu ändern.',
  it: 'Fai clic sul menu della lingua a sinistra per cambiare lingua.',
  ru: 'Нажмите на меню языка слева, чтобы изменить язык.',
  ja: '左側の言語メニューをクリックして言語を変更してください。',
  ko: '왼쪽의 언어 메뉴를 클릭하여 언어를 변경하세요.',
};

export interface HeaderBarProps {
  isDetectingLocation: boolean;
  getCurrentLanguage: () => string;
  availableLanguages: LanguageOption[];
  getAllAvailableLanguages: () => LanguageOption[];
  onLanguageChange: (newLang: string) => void;
  onClose: () => void;
  languageHelperVisible?: boolean;
  languageHelperText?: string | null;
  languageHelperLanguage?: string;
  showLangHint?: boolean;
  snapshot?: {
    language?: string;
    geoLanguage?: string;
    geoSuggestedLanguage?: string;
    langSource?: string;
  };
}

const DROPDOWN_BASE_CLASS =
  'text-xs px-2 py-1.5 border border-[#0B4422] rounded-md focus:outline-none focus:ring-2 focus:ring-[#10B981] bg-white hover:bg-[#E6F3EC] transition-colors text-[#0B4422] font-medium';

const DROPDOWN_GLOW_CLASS =
  'ring-2 ring-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.4)]';

export function HeaderBar({
  isDetectingLocation,
  getCurrentLanguage,
  availableLanguages,
  getAllAvailableLanguages,
  onLanguageChange,
  onClose,
  languageHelperVisible = false,
  showLangHint = false,
  snapshot,
}: HeaderBarProps) {
  const dropdownHighlight = languageHelperVisible;

  const showHint = Boolean(showLangHint);

  // Use API hint language (geoSuggestedLanguage) so header message matches backend hint decision
  const hintLang = (snapshot?.geoSuggestedLanguage ?? 'en').toLowerCase().slice(0, 2);
  const hintText =
    HINT_TEXT[hintLang as keyof typeof HINT_TEXT] ?? HINT_TEXT.en;

  return (
    <div className="flex items-center justify-between p-4 border-b border-[#0B4422] bg-[#E6F3EC]">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center">
            <Image
              src="/assets/logo/Logo.png"
              alt="DrishiQ"
              width={120}
              height={50}
              className="h-10 w-auto"
              unoptimized
              priority
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isDetectingLocation ? (
            <div className="text-xs px-2 py-1.5 text-[#0B4422] font-medium">
              <span className="animate-pulse">Detecting...</span>
            </div>
          ) : (
            <>
              <select
                value={getCurrentLanguage()}
                onChange={(e) => onLanguageChange(e.target.value)}
                className={`${DROPDOWN_BASE_CLASS} ${
                  dropdownHighlight ? DROPDOWN_GLOW_CLASS : ''
                }`}
                title="Change language"
              >
                {availableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.nativeName}
                  </option>
                ))}

                {availableLanguages.length < getAllAvailableLanguages().length && (
                  <>
                    <option disabled>──────────</option>
                    {getAllAvailableLanguages()
                      .filter(
                        (lang) =>
                          !availableLanguages.find((al) => al.code === lang.code)
                      )
                      .map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.nativeName}
                        </option>
                      ))}
                  </>
                )}
              </select>

              {showHint && (
                <div className="ml-3 text-xs font-semibold text-[#0a5c36] animate-pulse whitespace-nowrap">
                  {hintText}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
