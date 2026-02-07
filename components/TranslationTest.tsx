'use client';
import React from 'react';
import { useLanguage } from '@/lib/drishiq-i18n';

export default function TranslationTest() {
  const { language, t } = useLanguage();

  return (
    <div className="p-4 bg-gray-100 rounded-lg m-4">
      <h2 className="text-lg font-bold mb-4">Translation Test - Current Language: {language}</h2>
      
      <div className="space-y-2">
        <p><strong>Home Hero Title:</strong> {t('home.hero.title')}</p>
        <p><strong>Home Hero Subtitle:</strong> {t('home.hero.subtitle')}</p>
        <p><strong>Banner 0 Title:</strong> {t('banner.0.title')}</p>
        <p><strong>Banner 0 Text:</strong> {t('banner.0.text')}</p>
        <p><strong>Banner 0 CTA:</strong> {t('banner.0.cta')}</p>
        <p><strong>Common Loading:</strong> {t('common.loading')}</p>
        <p><strong>Common Error:</strong> {t('common.error')}</p>
      </div>
    </div>
  );
}
