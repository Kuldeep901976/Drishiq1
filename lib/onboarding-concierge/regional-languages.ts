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
  'IN': 'hi',  // India → Hindi
  'ES': 'es',  // Spain → Spanish
  'MX': 'es',  // Mexico → Spanish
  'AR': 'es',  // Argentina → Spanish
  'CO': 'es',  // Colombia → Spanish
  'CL': 'es',  // Chile → Spanish
  'PE': 'es',  // Peru → Spanish
  'VE': 'es',  // Venezuela → Spanish
  'EC': 'es',  // Ecuador → Spanish
  'BO': 'es',  // Bolivia → Spanish
  'PY': 'es',  // Paraguay → Spanish
  'UY': 'es',  // Uruguay → Spanish
  'CR': 'es',  // Costa Rica → Spanish
  'PA': 'es',  // Panama → Spanish
  'DO': 'es',  // Dominican Republic → Spanish
  'CU': 'es',  // Cuba → Spanish
  'GT': 'es',  // Guatemala → Spanish
  'HN': 'es',  // Honduras → Spanish
  'SV': 'es',  // El Salvador → Spanish
  'NI': 'es',  // Nicaragua → Spanish
  'FR': 'fr',  // France → French
  'BE': 'fr',  // Belgium → French
  'CH': 'fr',  // Switzerland (French regions) → French
  'CA': 'en',  // Canada → English (though French is also common)
  'DE': 'de',  // Germany → German
  'AT': 'de',  // Austria → German
  'CH': 'de',  // Switzerland (German regions) → German
  'CN': 'zh',  // China → Chinese
  'TW': 'zh',  // Taiwan → Chinese
  'HK': 'zh',  // Hong Kong → Chinese
  'SG': 'zh',  // Singapore → Chinese
  'JP': 'ja',  // Japan → Japanese
  'SA': 'ar',  // Saudi Arabia → Arabic
  'AE': 'ar',  // UAE → Arabic
  'EG': 'ar',  // Egypt → Arabic
  'IQ': 'ar',  // Iraq → Arabic
  'JO': 'ar',  // Jordan → Arabic
  'LB': 'ar',  // Lebanon → Arabic
  'KW': 'ar',  // Kuwait → Arabic
  'QA': 'ar',  // Qatar → Arabic
  'OM': 'ar',  // Oman → Arabic
  'YE': 'ar',  // Yemen → Arabic
  'BD': 'bn',  // Bangladesh → Bengali
  'LK': 'ta',  // Sri Lanka → Tamil
  'RU': 'ru',  // Russia → Russian
  'BY': 'ru',  // Belarus → Russian
  'KZ': 'ru',  // Kazakhstan → Russian
  'UA': 'ru',  // Ukraine → Russian (though Ukrainian is also common)
  'BR': 'pt',  // Brazil → Portuguese
  'PT': 'pt',  // Portugal → Portuguese
  'AO': 'pt',  // Angola → Portuguese
  'MZ': 'pt',  // Mozambique → Portuguese
  // English-speaking countries
  'US': 'en',
  'GB': 'en',
  'AU': 'en',
  'NZ': 'en',
  'IE': 'en',
  'ZA': 'en',
  'NG': 'en',
  'KE': 'en',
  'GH': 'en',
  'PK': 'en',
  'PH': 'en',
  'MY': 'en',
  'SG': 'en',  // Singapore (also English)
};

/** Region/state/province → primary + optional secondary language. Country-level used as fallback. */
export type RegionLanguageEntry = { primary: string; secondary?: string };

/** REGION_LANGUAGE_MAP[country_code][region_code] → { primary, secondary? }. Use country-level map as fallback. */
export const REGION_LANGUAGE_MAP: Record<string, Record<string, RegionLanguageEntry>> = {
  CA: {
    ON: { primary: 'en', secondary: 'fr' },
    QC: { primary: 'fr', secondary: 'en' },
    NB: { primary: 'en', secondary: 'fr' },
    MB: { primary: 'en' },
    AB: { primary: 'en' },
    BC: { primary: 'en' },
    SK: { primary: 'en' },
    NS: { primary: 'en' },
  },
  US: {
    CA: { primary: 'en', secondary: 'es' },
    TX: { primary: 'en', secondary: 'es' },
    FL: { primary: 'en', secondary: 'es' },
    NY: { primary: 'en' },
  },
  IN: {
    TN: { primary: 'ta', secondary: 'en' },
    WB: { primary: 'bn', secondary: 'en' },
    MH: { primary: 'hi', secondary: 'en' },
    KA: { primary: 'en' },
    DL: { primary: 'hi', secondary: 'en' },
    UP: { primary: 'hi', secondary: 'en' },
    RJ: { primary: 'hi', secondary: 'en' },
    GJ: { primary: 'hi', secondary: 'en' },
  },
  CH: {
    GE: { primary: 'de', secondary: 'fr' },
    VD: { primary: 'fr', secondary: 'de' },
    VS: { primary: 'fr' },
    BE: { primary: 'de' },
    ZH: { primary: 'de' },
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

  // Toronto (CA) → French primary, English secondary
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
// Northern belt cities → Hindi, Chennai → Tamil, West Bengal → Bengali, rest → English
export const INDIA_CITY_LANGUAGE_MAP: Record<string, string> = {
  // Northern belt (Hindi-speaking regions)
  'Delhi': 'hi',
  'New Delhi': 'hi',
  'Mumbai': 'hi',  // Maharashtra - Hindi is widely spoken
  'Pune': 'hi',
  'Nagpur': 'hi',
  'Ahmedabad': 'hi',  // Gujarat - Hindi is common
  'Surat': 'hi',
  'Jaipur': 'hi',  // Rajasthan - Hindi
  'Lucknow': 'hi',  // Uttar Pradesh - Hindi
  'Kanpur': 'hi',
  'Agra': 'hi',
  'Varanasi': 'hi',
  'Patna': 'hi',  // Bihar - Hindi
  'Chandigarh': 'hi',  // Punjab/Haryana - Hindi
  'Gurgaon': 'hi',
  'Noida': 'hi',
  'Faridabad': 'hi',
  'Ghaziabad': 'hi',
  'Indore': 'hi',  // Madhya Pradesh - Hindi
  'Bhopal': 'hi',
  'Jabalpur': 'hi',
  'Raipur': 'hi',  // Chhattisgarh - Hindi
  'Ranchi': 'hi',  // Jharkhand - Hindi
  'Dehradun': 'hi',  // Uttarakhand - Hindi
  'Srinagar': 'hi',  // Jammu & Kashmir - Hindi
  'Jammu': 'hi',
  
  // Tamil Nadu (Tamil)
  'Chennai': 'ta',
  'Madurai': 'ta',
  'Coimbatore': 'ta',
  'Tiruchirappalli': 'ta',
  'Salem': 'ta',
  'Tirunelveli': 'ta',
  'Erode': 'ta',
  'Vellore': 'ta',
  'Thanjavur': 'ta',
  'Dindigul': 'ta',
  
  // West Bengal (Bengali)
  'Kolkata': 'bn',
  'Howrah': 'bn',
  'Durgapur': 'bn',
  'Asansol': 'bn',
  'Siliguri': 'bn',
  'Bardhaman': 'bn',
  'Malda': 'bn',
  'Kharagpur': 'bn',
  'Haldia': 'bn',
  'Jalpaiguri': 'bn',
  'Darjeeling': 'bn',
  
  // Rest of India defaults to English (or can be overridden)
  // Kerala, Karnataka, Andhra Pradesh, Telangana, etc. → English
};

// Regional language groups - countries that commonly use multiple languages
// IMPORTANT: First language in the array is the PRIMARY language for that country
export const REGIONAL_LANGUAGE_GROUPS: Record<string, string[]> = {
  // South Asia
  'IN': ['hi', 'en', 'ta', 'bn'],  // India: Hindi (PRIMARY for north), English (default), Tamil, Bengali
  'BD': ['bn', 'en'],  // Bangladesh: Bengali, English
  'PK': ['en', 'ar'],  // Pakistan: English, Urdu (mapped to ar for Arabic script)
  'LK': ['ta', 'en'],  // Sri Lanka: Tamil, English
  'NP': ['hi', 'en'],  // Nepal: Hindi, English
  
  // Middle East
  'SA': ['ar', 'en'],  // Saudi Arabia: Arabic, English
  'AE': ['ar', 'en'],  // UAE: Arabic, English
  'EG': ['ar', 'en'],  // Egypt: Arabic, English
  
  // Europe
  'CH': ['de', 'fr', 'en'],  // Switzerland: German, French, English
  'BE': ['fr', 'de', 'en'],  // Belgium: French, German, English
  'NL': ['en', 'de'],  // Netherlands: English, German
  
  // Americas
  'US': ['en', 'es'],  // USA: English, Spanish
  'CA': ['en', 'fr'],  // Canada: English, French
  'MX': ['es', 'en'],  // Mexico: Spanish, English
  'BR': ['pt', 'en'],  // Brazil: Portuguese, English
  
  // East Asia
  'CN': ['zh', 'en'],  // China: Chinese, English
  'JP': ['ja', 'en'],  // Japan: Japanese, English
  'KR': ['en', 'zh'],  // South Korea: English, Chinese
  'SG': ['en', 'zh', 'ta'],  // Singapore: English, Chinese, Tamil
  
  // Africa
  'ZA': ['en', 'ar'],  // South Africa: English, Afrikaans (mapped to ar)
  'NG': ['en', 'ar'],  // Nigeria: English, Arabic (Hausa script)
  'KE': ['en', 'ar'],  // Kenya: English, Arabic (Swahili script)
};

/**
 * Get regional languages for a country (and optionally city for India)
 * Returns languages commonly spoken in that region, with primary language first
 */
export function getRegionalLanguages(countryCode: string, city?: string): LanguageOption[] {
  const upperCountry = countryCode.toUpperCase();
  const normalizedCity = city ? city.trim() : undefined;
  
  // Special handling for India - use city-based language detection
  if (upperCountry === 'IN' && normalizedCity) {
    // Check city-specific language mapping
    const cityLang = INDIA_CITY_LANGUAGE_MAP[normalizedCity];
    if (cityLang) {
      // Return city-specific language first, then regional languages
      const cityLangOption = ALL_LANGUAGES.find(lang => lang.code === cityLang);
      const regionalLangs = REGIONAL_LANGUAGE_GROUPS['IN'] || ['hi', 'en', 'ta', 'bn'];
      
      const languages: LanguageOption[] = [];
      
      // Add city-specific language first
      if (cityLangOption) {
        languages.push(cityLangOption);
      }
      
      // Add other regional languages (excluding the city language)
      regionalLangs
        .filter(code => code !== cityLang)
        .map(code => ALL_LANGUAGES.find(lang => lang.code === code))
        .filter((lang): lang is LanguageOption => lang !== undefined)
        .forEach(lang => {
          if (!languages.find(l => l.code === lang.code)) {
            languages.push(lang);
          }
        });
      
      return languages.length > 0 ? languages : [ALL_LANGUAGES[0]];
    }
    // If city not found in map, fall through to default India handling
  }
  
  // Check if country has a specific regional group
  if (REGIONAL_LANGUAGE_GROUPS[upperCountry]) {
    const langCodes = REGIONAL_LANGUAGE_GROUPS[upperCountry];
    return langCodes
      .map(code => ALL_LANGUAGES.find(lang => lang.code === code))
      .filter((lang): lang is LanguageOption => lang !== undefined);
  }
  
  // Fallback to primary language + English
  const primaryLang = COUNTRY_LANGUAGE_MAP[upperCountry] || 'en';
  const languages: LanguageOption[] = [];
  
  // Add primary language
  const primary = ALL_LANGUAGES.find(lang => lang.code === primaryLang);
  if (primary) {
    languages.push(primary);
  }
  
  // Add English if not already primary
  if (primaryLang !== 'en') {
    const english = ALL_LANGUAGES.find(lang => lang.code === 'en');
    if (english) {
      languages.push(english);
    }
  }
  
  // If no languages found, default to English
  return languages.length > 0 ? languages : [ALL_LANGUAGES[0]];
}

/**
 * Get language for a specific city in India
 * Returns the city-specific language or default for India
 */
export function getLanguageForIndiaCity(city?: string): string {
  if (!city) return 'en'; // Default to English if no city
  
  const normalizedCity = city.trim();
  return INDIA_CITY_LANGUAGE_MAP[normalizedCity] || 'en'; // Default to English for unmapped cities
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

