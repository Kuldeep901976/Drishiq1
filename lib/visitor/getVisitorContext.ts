/**
 * Read visitor context from DB for greeter flow.
 * Used by onboarding-concierge GET so the LLM has city, country, timezone, language, visit_count, last_seen_at.
 */

import { createServiceClient } from '@/lib/supabase';
import { normalizeLanguage } from '@/lib/onboarding-concierge/regional-languages';

export interface VisitorContext {
  city: string | null;
  country: string | null;
  timezone: string | null;
  language: string;
  /** Optional secondary language for region (for hint: chat language vs geoSuggestedLanguage). */
  geoSuggestedLanguage: string | null;
  visit_count: number;
  last_seen_at: string | null;
}

/**
 * Get visitor context by visitor_id.
 * Language priority (GEO PART ONLY HERE):
 *   DB lookup:
 *      1) country + state match
 *      2) country default
 *   3) Stored DB language
 *   4) 'en'
 */
export async function getVisitorContext(visitorId: string): Promise<VisitorContext> {
  const empty: VisitorContext = {
    city: null,
    country: null,
    timezone: null,
    language: 'en',
    geoSuggestedLanguage: 'en',
    visit_count: 1,
    last_seen_at: null,
  };

  if (!visitorId || visitorId === 'anon') {
    return empty;
  }

  const supabase = createServiceClient();
  const { data: row, error } = await supabase
    .from('visitors')
    .select(
      'city, country, country_code, region_code, timezone, language, secondary_language, visit_count, last_seen_at'
    )
    .eq('id', visitorId)
    .maybeSingle();

  if (error || !row) {
    return empty;
  }

  const countryCode = (row as { country_code?: string }).country_code?.toUpperCase() || null;
  const regionName = (row as { region_code?: string }).region_code ?? null;

  const storedPrimary = row.language && String(row.language).trim();
  const storedSecondary =
    (row as { secondary_language?: string }).secondary_language?.trim() || null;

  let language = 'en';
  let geoSuggestedLanguage: string | null = 'en';

  // --------------------------------
  // GEO LANGUAGE FROM DB TABLE
  // country + state → else country default
  // --------------------------------
  if (countryCode) {
    try {
      const { data: geoRows } = await supabase
        .from('geo_language_rules')
        .select('language_code, region_name')
        .eq('country_code', countryCode)
        .or(`region_name.eq.${regionName},region_name.is.null`)
        .order('region_name', { ascending: false })
        .limit(1);

      const geoLang = geoRows?.[0]?.language_code;

      if (geoLang) {
        language = normalizeLanguage(geoLang);

        // Hint logic base:
        // If geo provided language is not English → suggest English
        // If geo language is English → no secondary suggestion needed
        geoSuggestedLanguage = language === 'en' ? 'en' : 'en';
      }
    } catch {
      // ignore and continue to fallbacks
    }
  }

  // --------------------------------
  // STORED LANGUAGE FALLBACK
  // --------------------------------
  if (!language || language === 'en') {
    if (storedPrimary) {
      language = normalizeLanguage(storedPrimary);
      geoSuggestedLanguage = normalizeLanguage(storedSecondary || 'en');
    }
  }

  return {
    city: row.city ?? null,
    country: row.country ?? null,
    timezone: row.timezone ?? null,
    language: language || 'en',
    geoSuggestedLanguage: geoSuggestedLanguage || 'en',
    visit_count: typeof row.visit_count === 'number' ? row.visit_count : 1,
    last_seen_at: row.last_seen_at ?? null,
  };
}
  