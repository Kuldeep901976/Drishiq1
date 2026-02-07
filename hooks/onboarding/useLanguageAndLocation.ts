'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/drishiq-i18n';
import { getAllAvailableLanguages, type LanguageOption } from '../../lib/onboarding-concierge/regional-languages';
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
    country_code?: string;
    region_code?: string;
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
    if (isDetectingLocation) return;

    setIsDetectingLocation(true);

    try {
      // ------------------------------------------------
      // 🔴 MANUAL GEO OVERRIDE FOR TESTING
      // Set in browser console:
      // localStorage.setItem('geo_override', JSON.stringify({ country:'Canada', city:'Toronto' }))
      // localStorage.removeItem('geo_override') to reset
      // ------------------------------------------------
      if (typeof window !== 'undefined') {
        const overrideRaw = localStorage.getItem('geo_override');
        if (overrideRaw) {
          try {
            const override = JSON.parse(overrideRaw);
            if (override?.country || override?.city) {
              console.log('🧪 [Onboarding] Using GEO override:', override);
              setDetectedLocation({
                country: override.country,
                city: override.city,
              });
              setAvailableLanguages(getAllAvailableLanguages());
              setIsDetectingLocation(false);
              return;
            }
          } catch {}
        }
      }

      const response = await fetch('/api/detect-location', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        const country = data.country;
        const city = data.city;
        const country_code = data.country_code;
        const region_code = data.region_code;
        const potentialVpn = data.potentialVpn;

        console.log('🌍 [Onboarding] Location detected:', { country, city, country_code, region_code, potentialVpn });

        if (potentialVpn) {
          setShowVpnHint(true);
          setVpnDetectedLang(null);
        }

        setAvailableLanguages(getAllAvailableLanguages());
        setDetectedLocation({ country, city, country_code, region_code });
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
  