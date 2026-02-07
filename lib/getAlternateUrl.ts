import { getPageMetadata } from './seo.config';

const BASE = "https://www.drishiq.com";

/**
 * Get canonical URL for a page key and optional locale
 * @param key - Page key from seo.config.ts
 * @param locale - Optional locale code (e.g., 'hi', 'es', 'ta')
 * @returns Canonical URL string
 */
export function getCanonicalFor(key: string, locale?: string): string {
  const meta = getPageMetadata(key);
  
  // If locale is provided and exists in locales, return that canonical
  if (locale && meta.locales && meta.locales[locale]?.canonical) {
    return meta.locales[locale].canonical!;
  }
  
  // Otherwise return the default canonical or fallback to BASE
  return meta.canonical || BASE;
}

/**
 * Get alternates mapping for all available locales for a page key
 * @param key - Page key from seo.config.ts
 * @returns Record of locale codes to canonical URLs
 */
export function getAlternatesFor(key: string): Record<string, string> {
  const meta = getPageMetadata(key);
  const alternates: Record<string, string> = {};
  
  // Add default canonical as 'en' (English)
  if (meta.canonical) {
    alternates['en'] = meta.canonical;
  }
  
  // Add all locale-specific canonicals
  if (meta.locales) {
    Object.entries(meta.locales).forEach(([locale, localeMeta]) => {
      if (localeMeta.canonical) {
        alternates[locale] = localeMeta.canonical;
      }
    });
  }
  
  return alternates;
}






