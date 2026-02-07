/**
 * Unified Language Detection System
 * Works for: Onboarding Chat, Web Pages (App), Main Chat
 * Priority: Cookie > LLM Detection > Navigator.language > Default (English)
 */

import { SUPPORTED_LANGUAGE_CODES, validateLanguageCode } from '@/lib/onboarding-concierge/regional-languages';

const COOKIE_NAME = 'drishiq_lang';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year (31536000 seconds)

/**
 * Get language from cookie (client-side). Uses drishiq_lang (single source of truth).
 */
export function getLanguageFromCookie(): string | null {
  if (typeof window === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const cookie = cookies.find(c => c.trim().startsWith(`${COOKIE_NAME}=`));
  if (cookie) {
    const value = cookie.split('=')[1]?.trim();
    return validateLanguageCode(value);
  }
  return null;
}

/**
 * Set language in cookie (client-side). Writes drishiq_lang only.
 */
export function setLanguageCookie(language: string): void {
  if (typeof window === 'undefined') return;
  
  const validatedLang = validateLanguageCode(language);
  document.cookie = `${COOKIE_NAME}=${validatedLang}; path=/; max-age=${COOKIE_MAX_AGE}`;
}

/**
 * Detect language using LLM based on location
 * Simple prompt: "Which language is most spoken in this location?"
 */
export async function detectLanguageWithLLM(country: string, city?: string): Promise<string> {
  try {
    const response = await fetch(`/api/detect-language?country=${country}${city ? `&city=${encodeURIComponent(city)}` : ''}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();
      return validateLanguageCode(data.language);
    }
  } catch (error) {
    console.warn('⚠️ [Language Detection] LLM detection failed:', error);
  }
  
  return 'en'; // Default to English
}

/**
 * Track language detection event for analytics
 */
function trackLanguageDetection(source: 'cookie' | 'ip' | 'llm' | 'navigator' | 'default', language: string, metadata?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  
  try {
    // Track via Google Analytics if available
    if (window.gtag) {
      window.gtag('event', 'language_detected', {
        event_category: 'language_detection',
        event_label: source,
        value: 1,
        custom_parameters: {
          lang_detect_source: source,
          detected_language: language,
          ...metadata
        }
      });
    }
    
    // Also log for internal analytics
    console.log(`📊 [Analytics] lang_detect_source=${source}, language=${language}`, metadata || '');
  } catch (e) {
    // Non-fatal: analytics tracking should not break language detection
    console.warn('⚠️ [Language Detection] Analytics tracking failed:', e);
  }
}

/**
 * Get language with priority: Cookie > LLM Detection > Navigator.language > Default
 * For guest users (no cookie), detects via LLM based on location
 */
export async function getLanguageForGuest(country?: string, city?: string): Promise<string> {
  // 1. Check cookie first (highest priority)
  const cookieLang = getLanguageFromCookie();
  if (cookieLang) {
    trackLanguageDetection('cookie', cookieLang);
    return cookieLang;
  }

  // 2. If no cookie and location provided, use LLM detection
  if (country) {
    const llmLang = await detectLanguageWithLLM(country, city);
    if (llmLang && llmLang !== 'en') {
      trackLanguageDetection('llm', llmLang, { country, city });
      return llmLang;
    }
    // If LLM detection fails or returns 'en', continue to fallback
  }

  // 3. Fallback to navigator.language (browser locale)
  if (typeof window !== 'undefined' && navigator?.language) {
    try {
      const browserLang = navigator.language.split('-')[0].toLowerCase(); // e.g. "en", "hi"
      const validated = validateLanguageCode(browserLang);
      // Only use browser language if it's supported and not just default 'en'
      if (validated && SUPPORTED_LANGUAGE_CODES.includes(validated)) {
        console.log('🌐 [Language Detection] Using browser language:', validated, 'from navigator.language:', navigator.language);
        trackLanguageDetection('navigator', validated, { navigator_language: navigator.language });
        return validated;
      }
    } catch (e) {
      // Safe-guard: ignore and continue to final fallback
      console.warn('⚠️ [Language Detection] navigator.language fallback failed:', e);
    }
  }

  // 4. Default to English
  trackLanguageDetection('default', 'en', { reason: 'no_detection_method_available' });
  return 'en';
}

/**
 * Set language for all three: Onboarding Chat, Web Pages, Main Chat
 * Also sets cookie for persistence
 */
export function setLanguageForAll(language: string): void {
  const validatedLang = validateLanguageCode(language);
  
  // Set cookie (persists across sessions)
  setLanguageCookie(validatedLang);
  
  // Set in localStorage (for LanguageProvider)
  if (typeof window !== 'undefined') {
    localStorage.setItem('i18nextLng', validatedLang);
    
    // Trigger storage event to sync across tabs
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'i18nextLng',
      newValue: validatedLang,
      storageArea: localStorage
    }));
  }
}

