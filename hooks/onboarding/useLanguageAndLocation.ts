'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/drishiq-i18n';
import { getAllAvailableLanguages, type LanguageOption } from '@/lib/onboarding-concierge/regional-languages';
import type { OnboardingSnapshot } from '@/lib/onboarding-concierge/types';

export interface UseLanguageAndLocationParams {
  setSnapshot?: (updater: (prev: OnboardingSnapshot) => OnboardingSnapshot) => void;
  isOpen: boolean;
}

export function useLanguageAndLocation({ setSnapshot, isOpen }: UseLanguageAndLocationParams) {
  const { language, setLanguage } = useLanguage(['common', 'chat']);
  const [detectedLocation, setDetectedLocation] = useState<{
    country?: string;
    city?: string;
  } | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<LanguageOption[]>(getAllAvailableLanguages());
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showVpnHint, setShowVpnHint] = useState(false);
  const [vpnDetectedLang, setVpnDetectedLang] = useState<string | null>(null);

  const languageDetectionInitializedRef = useRef(false);

  const getCurrentLanguage = (snapshot?: OnboardingSnapshot | null): string => {
    if (snapshot?.language) return snapshot.language;
    return language;
  };

  const detectLocationAndSetLanguages = async () => {
    if (isDetectingLocation) {
      console.log('⚠️ [Onboarding] Location detection already in progress, skipping');
      return;
    }

    setIsDetectingLocation(true);
    try {
      const response = await fetch('/api/detect-location', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        const countryCode = data.country;
        const city = data.city;
        const potentialVpn = data.potentialVpn;

        console.log('🌍 [Onboarding] Location detected:', { countryCode, city, potentialVpn });

        if (potentialVpn) {
          setShowVpnHint(true);
          setVpnDetectedLang(null);
        }

        setAvailableLanguages(getAllAvailableLanguages());
        setDetectedLocation({ country: countryCode, city });
      } else {
        setAvailableLanguages(getAllAvailableLanguages());
        setDetectedLocation(null);
      }
    } catch (error) {
      console.warn('⚠️ [Onboarding] Detection failed:', error);
      setAvailableLanguages(getAllAvailableLanguages());
      setDetectedLocation(null);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  useEffect(() => {
    if (isOpen && !languageDetectionInitializedRef.current) {
      languageDetectionInitializedRef.current = true;
      detectLocationAndSetLanguages();
    }
    if (!isOpen) {
      languageDetectionInitializedRef.current = false;
    }
  }, [isOpen]);

  return {
    language,
    setLanguage,
    availableLanguages,
    detectedLocation,
    showVpnHint,
    setShowVpnHint,
    vpnDetectedLang,
    isDetectingLocation,
    getCurrentLanguage,
    detectLocationAndSetLanguages,
    setAvailableLanguages,
    setDetectedLocation,
  };
}
