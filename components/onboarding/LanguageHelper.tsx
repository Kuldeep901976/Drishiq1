'use client';

import React from 'react';

const LANGUAGE_HELPER_MESSAGE: Record<string, string> = {
  en: 'Click the menu above to change language',
  hi: 'भाषा बदलने के लिए ऊपर मेनू पर क्लिक करें',
  es: 'Haz clic en el menú de arriba para cambiar el idioma',
  fr: 'Cliquez sur le menu ci-dessus pour changer la langue',
  de: 'Klicken Sie oben auf das Menü, um die Sprache zu ändern',
  pt: 'Clique no menu acima para alterar o idioma',
  ar: 'انقر على القائمة أعلاه لتغيير اللغة',
  zh: '点击上方菜单更改语言',
  ja: '上のメニューをクリックして言語を変更',
  ru: 'Нажмите на меню выше, чтобы изменить язык',
  bn: 'ভাষা পরিবর্তন করতে উপরের মেনুতে ক্লিক করুন',
  ta: 'மொழியை மாற்ற மேலுள்ள மெனுவைக் கிளிக் செய்யவும்',
};

export interface LanguageHelperProps {
  language: string;
}

export function LanguageHelper({ language }: LanguageHelperProps) {
  const code = language.toLowerCase().slice(0, 2);
  const text = LANGUAGE_HELPER_MESSAGE[code] ?? LANGUAGE_HELPER_MESSAGE.en;

  return (
    <p
      className="text-xs text-[#0B4422] font-medium animate-in fade-in duration-300"
      role="status"
      aria-live="polite"
    >
      {text}
    </p>
  );
}
