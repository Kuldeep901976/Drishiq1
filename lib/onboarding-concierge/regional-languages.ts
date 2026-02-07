/**
 * Regional Languages Utility
 * Maps countries to their commonly spoken languages
 * Used to show relevant language options in onboarding chat
 */

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

// All supported languages with their metadata
// IMPORTANT: These are the ONLY 12 languages we support
// Any language detection outside this list should default to English
export const ALL_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', nativeName: 'हिंदी' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', nativeName: 'Português' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩', nativeName: 'বাংলা' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳', nativeName: 'தமிழ்' },
];

// Supported language codes (for validation)
export const SUPPORTED_LANGUAGE_CODES = ALL_LANGUAGES.map(lang => lang.code);

/** The 12 supported language codes; anything else must fall back to English. */
export const SUPPORTED_LANGUAGES: readonly string[] = SUPPORTED_LANGUAGE_CODES;

/**
 * Normalize to a supported language; unsupported values become 'en'.
 */
export function normalizeLanguage(lang: string | undefined | null): string {
  if (!lang) return 'en';
  const normalized = lang.toLowerCase().trim();
  return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : 'en';
}

/**
 * Validate if a language code is supported
 * Returns the language code if supported, otherwise returns 'en' (English)
 */
export function validateLanguageCode(langCode: string | undefined | null): string {
  return normalizeLanguage(langCode);
}

// Country to primary language mapping (for detection)
export const COUNTRY_LANGUAGE_MAP: Record<string, string> = {
  'IN': 'hi',  'ES': 'es',  'MX': 'es',  'AR': 'es',  'CO': 'es',  'CL': 'es',  'PE': 'es',
  'VE': 'es',  'EC': 'es',  'BO': 'es',  'PY': 'es',  'UY': 'es',  'CR': 'es',  'PA': 'es',
  'DO': 'es',  'CU': 'es',  'GT': 'es',  'HN': 'es',  'SV': 'es',  'NI': 'es',  'FR': 'fr',
  'BE': 'fr',  'CA': 'en',  'DE': 'de',  'AT': 'de',  'CH': 'de',  'CN': 'zh',  'TW': 'zh',
  'HK': 'zh',  'SG': 'zh',  'JP': 'ja',  'SA': 'ar',  'AE': 'ar',  'EG': 'ar',  'IQ': 'ar',
  'JO': 'ar',  'LB': 'ar',  'KW': 'ar',  'QA': 'ar',  'OM': 'ar',  'YE': 'ar',  'BD': 'bn',
  'LK': 'ta',  'RU': 'ru',  'BY': 'ru',  'KZ': 'ru',  'UA': 'ru',  'BR': 'pt',  'PT': 'pt',
  'AO': 'pt',  'MZ': 'pt',  'US': 'en',  'GB': 'en',  'AU': 'en',  'NZ': 'en',  'IE': 'en',
  'ZA': 'en',  'NG': 'en',  'KE': 'en',  'GH': 'en',  'PK': 'en',  'PH': 'en',  'MY': 'en',
};

/** Region/state/province → primary + optional secondary language. Country-level used as fallback. */
export type RegionLanguageEntry = { primary: string; secondary?: string };

/** REGION_LANGUAGE_MAP[country_code][region_code] → { primary, secondary? }. Use country-level map as fallback. */
export const REGION_LANGUAGE_MAP: Record<string, Record<string, RegionLanguageEntry>> = {
  CA: {
    ON: { primary: 'en', secondary: 'fr' }, QC: { primary: 'fr', secondary: 'en' }, NB: { primary: 'en', secondary: 'fr' },
    MB: { primary: 'en' }, AB: { primary: 'en' }, BC: { primary: 'en' }, SK: { primary: 'en' }, NS: { primary: 'en' },
  },
  US: {
    CA: { primary: 'en', secondary: 'es' }, TX: { primary: 'en', secondary: 'es' }, FL: { primary: 'en', secondary: 'es' }, NY: { primary: 'en' },
  },
  IN: {
    TN: { primary: 'ta', secondary: 'en' }, WB: { primary: 'bn', secondary: 'en' }, MH: { primary: 'hi', secondary: 'en' }, KA: { primary: 'en' },
    DL: { primary: 'hi', secondary: 'en' }, UP: { primary: 'hi', secondary: 'en' }, RJ: { primary: 'hi', secondary: 'en' }, GJ: { primary: 'hi', secondary: 'en' },
  },
  CH: {
    GE: { primary: 'de', secondary: 'fr' }, VD: { primary: 'fr', secondary: 'de' }, VS: { primary: 'fr' }, BE: { primary: 'de' }, ZH: { primary: 'de' },
  },
};

/**
 * Get primary (and optional secondary) language for a country/region/city.
 * City overrides (e.g. Toronto → fr) apply when provided; else region then country fallback.
 */
export function getRegionLanguages(
  countryCode: string,
  regionCode?: string | null,
  city?: string | null
): RegionLanguageEntry {
  const cc = countryCode?.toUpperCase();
  const rc = regionCode?.toUpperCase();
  const cityNorm = city?.trim().toLowerCase();

  if (cc === 'CA' && cityNorm === 'toronto') {
    return { primary: normalizeLanguage('fr'), secondary: normalizeLanguage('en') };
  }

  if (cc && rc && REGION_LANGUAGE_MAP[cc]?.[rc]) {
    const entry = REGION_LANGUAGE_MAP[cc][rc];
    return {
      primary: normalizeLanguage(entry.primary),
      secondary: entry.secondary ? normalizeLanguage(entry.secondary) : undefined,
    };
  }
  const primary = normalizeLanguage(COUNTRY_LANGUAGE_MAP[cc] ?? 'en');
  return { primary };
}

// City/Region to language mapping for India (more granular)
export const INDIA_CITY_LANGUAGE_MAP: Record<string, string> = {
  'Delhi': 'hi', 'New Delhi': 'hi', 'Mumbai': 'hi', 'Pune': 'hi', 'Nagpur': 'hi', 'Ahmedabad': 'hi', 'Surat': 'hi',
  'Jaipur': 'hi', 'Lucknow': 'hi', 'Kanpur': 'hi', 'Agra': 'hi', 'Varanasi': 'hi', 'Patna': 'hi', 'Chandigarh': 'hi',
  'Gurgaon': 'hi', 'Noida': 'hi', 'Faridabad': 'hi', 'Ghaziabad': 'hi', 'Indore': 'hi', 'Bhopal': 'hi', 'Jabalpur': 'hi',
  'Raipur': 'hi', 'Ranchi': 'hi', 'Chennai': 'ta', 'Madurai': 'ta', 'Coimbatore': 'ta', 'Tiruchirappalli': 'ta',
  'Salem': 'ta', 'Tirunelveli': 'ta', 'Kolkata': 'bn', 'Howrah': 'bn', 'Durgapur': 'bn', 'Asansol': 'bn',
  'Siliguri': 'bn', 'Bengaluru': 'en', 'Hyderabad': 'en', 'Kochi': 'en', 'Thiruvananthapuram': 'en',
};

/**
 * Get language for a specific city in India
 * Returns the city-specific language or default for India
 */
export function getLanguageForIndiaCity(city?: string): string {
  if (!city) return 'en';
  const normalizedCity = city.trim();
  return INDIA_CITY_LANGUAGE_MAP[normalizedCity] ?? 'en';
}

/**
 * Get all available languages (for manual selection)
 */
export function getAllAvailableLanguages(): LanguageOption[] {
  return ALL_LANGUAGES;
}

/**
 * Get language option by code
 */
export function getLanguageByCode(code: string): LanguageOption | undefined {
  return ALL_LANGUAGES.find(lang => lang.code === code);
}
