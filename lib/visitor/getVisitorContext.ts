/**
 * Read visitor context from DB for greeter flow.
 *
 * IMPORTANT DESIGN:
 * - DB geo is NOT trusted for language (it can be stale)
 * - Language is derived from geo_language_rules via CURRENT geo written by /visitor/ensure
 * - DB is only fallback if geo match fails
 */

import { createServiceClient } from '@/lib/supabase';
import { normalizeLanguage, getRegionLanguages } from '../onboarding-concierge/regional-languages';

export interface VisitorContext {
  city: string | null;
  country: string | null;
  timezone: string | null;
  language: string;
  geoSuggestedLanguage: string | null;
  visit_count: number;
  last_seen_at: string | null;
}

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

  type VisitorRow = {
    city?: string | null;
    country?: string | null;
    country_code?: string | null;
    region_code?: string | null;
    timezone?: string | null;
    language?: string | null;
    visit_count?: number | null;
    last_seen_at?: string | null;
  };

  // Try visitor_id schema (one row per visit): latest row for this visitor
  let row: VisitorRow | null = null;
  const byVisitorId = await supabase
    .from('visitors')
    .select('city, country, country_code, region_code, timezone, language, visit_count, last_seen_at')
    .eq('visitor_id', visitorId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!byVisitorId.error && byVisitorId.data) {
    row = byVisitorId.data as VisitorRow;
  }
  // Fallback: id = visitor cookie (one row per visitor)
  if (!row) {
    const byId = await supabase
      .from('visitors')
      .select('city, country, country_code, region_code, timezone, language, visit_count, last_seen_at')
      .eq('id', visitorId)
      .maybeSingle();
    if (!byId.error && byId.data) row = byId.data as VisitorRow;
  }

  if (!row) {
    return empty;
  }

  const countryCode = row.country_code?.toUpperCase() || null;
  const regionCode = row.region_code?.toUpperCase() || null;
  const storedPrimary = row.language?.trim() || null;

  let geoPrimary: string | null = null;
  let geoSecondary: string | null = null;

  // ------------------------------------------------
  // How geoLangFromDB and geoSuggestedLanguage are calculated:
  // 1. Read visitor row → country_code, region_code, language (storedPrimary).
  // 2. If country_code + region_code: lookup geo_language_rules; else in-code getRegionLanguages().
  // 3. If geoPrimary set → language = geoPrimary, geoSuggestedLanguage = secondary or primary.
  // 4. Else if storedPrimary → language = storedPrimary, geoSuggestedLanguage = primary or 'en'.
  // 5. Else → both stay 'en'.
  // So if visitor row has null country_code or region_code, we never get geo and stay 'en'.
  // ------------------------------------------------
  if (countryCode) {
    try {
      // 1️⃣ Exact country + region match from geo_language_rules (e.g. CA + QC → French)
      if (regionCode) {
        const { data: regionMatch } = await supabase
          .from('geo_language_rules')
          .select('language_code')
          .eq('country_code', countryCode)
          .eq('region_code', regionCode)
          .limit(1);

        if (regionMatch?.length) {
          geoPrimary = regionMatch[0].language_code;
        }

        // 2️⃣ No row for this region in geo_language_rules → infer from region_code via in-code rules
        if (!geoPrimary) {
          const { primary, secondary } = getRegionLanguages(countryCode, regionCode);
          geoPrimary = primary;
          geoSecondary = secondary ?? null;
        }
      }

      // 3️⃣ Fallback: region_code IS NULL in geo_language_rules = country language for that country
      if (!geoPrimary) {
        const { data: countryDefault } = await supabase
          .from('geo_language_rules')
          .select('language_code')
          .eq('country_code', countryCode)
          .is('region_code', null)
          .limit(1);

        if (countryDefault?.length) {
          geoPrimary = countryDefault[0].language_code;
        }
      }
    } catch {
      // ignore DB issues
    }
  }

  if (process.env.NODE_ENV === 'development' && (!geoPrimary && !storedPrimary || (countryCode && !geoPrimary))) {
    console.log('[getVisitorContext] geo debug:', {
      visitorId,
      countryCodeFromRow: countryCode,
      regionCodeFromRow: regionCode,
      storedPrimary,
      geoPrimary,
      reason: !countryCode ? 'no country_code in visitor row' : !regionCode ? 'no region_code in visitor row' : !geoPrimary ? 'no match in geo_language_rules or fallback' : null,
    });
  }

  // ------------------------------------------------
  // FINAL LANGUAGE RESOLUTION
  // ------------------------------------------------
  let language = 'en';
  let geoSuggestedLanguage: string | null = 'en';

  if (geoPrimary) {
    const primary = normalizeLanguage(geoPrimary);
    const secondary = geoSecondary
      ? normalizeLanguage(geoSecondary)
      : null;

    language = primary;

    // Hint logic:
    // If cookie/browser later overrides → this becomes hint
    if (secondary && secondary !== primary) {
      geoSuggestedLanguage = secondary;
    } else {
      geoSuggestedLanguage = primary !== 'en' ? primary : 'en';
    }
  }
  else if (storedPrimary) {
    const primary = normalizeLanguage(storedPrimary);
    language = primary;
    geoSuggestedLanguage = primary !== 'en' ? primary : 'en';
  }

  return {
    city: row.city ?? null,
    country: row.country ?? null,
    timezone: row.timezone ?? null,
    language,
    geoSuggestedLanguage,
    visit_count: typeof row.visit_count === 'number' ? row.visit_count : 1,
    last_seen_at: row.last_seen_at ?? null,
  };
}
