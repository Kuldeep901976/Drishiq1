/**
 * Read visitor context from DB for greeter flow.
 *
 * IMPORTANT DESIGN:
 * - DB geo is NOT trusted for language (it can be stale)
 * - Language is derived from geo_language_rules via CURRENT geo written by /visitor/ensure
 * - DB is only fallback if geo match fails
 *
 * RELIABILITY: All Supabase calls are wrapped with withTimeout(5s). This function
 * always resolves (never hangs); on timeout or error it returns partial/empty context.
 */

import { createServiceClient } from '@/lib/supabase';
import { normalizeLanguage, getRegionLanguages } from '../onboarding-concierge/regional-languages';
import { withTimeout } from '@/lib/utils/withTimeout';

const SUPABASE_QUERY_TIMEOUT_MS = 5000;

export interface VisitorContext {
  city: string | null;
  country: string | null;
  /** 2-letter ISO country code for pricing/geo (e.g. IN, US). */
  country_code: string | null;
  region_code: string | null;
  timezone: string | null;
  language: string;
  geoSuggestedLanguage: string | null;
  visit_count: number;
  last_seen_at: string | null;
}

const EMPTY_CONTEXT: VisitorContext = {
  city: null,
  country: null,
  country_code: null,
  region_code: null,
  timezone: null,
  language: 'en',
  geoSuggestedLanguage: 'en',
  visit_count: 1,
  last_seen_at: null,
};

type VisitorRow = {
  city?: string | null;
  country?: string | null;
  country_code?: string | null;
  region_code?: string | null;
  timezone?: string | null;
  language?: string | null;
  secondary_language?: string | null;
  visit_count?: number | null;
  last_seen_at?: string | null;
};

export async function getVisitorContext(visitorId: string): Promise<VisitorContext> {
  if (!visitorId || visitorId === 'anon') {
    return EMPTY_CONTEXT;
  }

  const supabase = createServiceClient();

  let row: VisitorRow | null = null;

  try {
    // Visitors lookup: by visitor_id then by id (sequential; second only if first misses)
    const byVisitorId = await withTimeout(
      supabase
        .from('visitors')
        .select('city, country, country_code, region_code, timezone, language, secondary_language, visit_count, last_seen_at')
        .eq('visitor_id', visitorId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      SUPABASE_QUERY_TIMEOUT_MS,
      'supabase visitors by visitor_id'
    );
    if (!byVisitorId.error && byVisitorId.data) {
      row = byVisitorId.data as VisitorRow;
    }
    if (!row) {
      const byId = await withTimeout(
        supabase
          .from('visitors')
          .select('city, country, country_code, region_code, timezone, language, secondary_language, visit_count, last_seen_at')
          .eq('id', visitorId)
          .maybeSingle(),
        SUPABASE_QUERY_TIMEOUT_MS,
        'supabase visitors by id'
      );
      if (!byId.error && byId.data) row = byId.data as VisitorRow;
    }
  } catch (err) {
    console.error('[getVisitorContext] visitors lookup failed:', err);
    return EMPTY_CONTEXT;
  }

  if (!row) {
    return EMPTY_CONTEXT;
  }

  const countryCode = row.country_code?.toUpperCase() || null;
  const regionCode = row.region_code?.toUpperCase() || null;
  const storedPrimary = row.language?.trim() || null;

  let geoPrimary: string | null = null;
  let geoSecondary: string | null = null;

  if (countryCode) {
    try {
      // Parallelize geo_language_rules lookups (region match + country default)
      const regionPromise = regionCode
        ? supabase
            .from('geo_language_rules')
            .select('language_code')
            .eq('country_code', countryCode)
            .eq('region_code', regionCode)
            .limit(1)
        : Promise.resolve({ data: [] as { language_code: string }[] });
      const countryDefaultPromise = supabase
        .from('geo_language_rules')
        .select('language_code')
        .eq('country_code', countryCode)
        .is('region_code', null)
        .limit(1);

      const [regionResult, countryDefaultResult] = await Promise.all([
        withTimeout(regionPromise, SUPABASE_QUERY_TIMEOUT_MS, 'supabase geo_language_rules region').catch(() => ({ data: [] as { language_code: string }[] })),
        withTimeout(countryDefaultPromise, SUPABASE_QUERY_TIMEOUT_MS, 'supabase geo_language_rules country'),
      ]);

      const regionMatch = regionResult?.data;
      if (regionMatch?.length) {
        geoPrimary = regionMatch[0].language_code;
      }
      if (!geoPrimary && regionCode) {
        const { primary, secondary } = getRegionLanguages(countryCode, regionCode);
        geoPrimary = primary;
        geoSecondary = secondary ?? null;
      }
      if (!geoPrimary && countryDefaultResult?.data?.length) {
        geoPrimary = countryDefaultResult.data[0].language_code;
      }
    } catch (geoErr) {
      console.warn('[getVisitorContext] geo_language_rules lookup failed:', geoErr);
      // continue with storedPrimary / 'en'
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

  let language = 'en';
  let geoSuggestedLanguage: string | null = 'en';

  const storedSecondary = row.secondary_language?.trim() || null;
  if (storedPrimary) {
    const primary = normalizeLanguage(storedPrimary);
    language = primary;
    geoSuggestedLanguage = storedSecondary
      ? normalizeLanguage(storedSecondary)
      : geoPrimary
        ? normalizeLanguage(geoPrimary)
        : primary !== 'en'
          ? primary
          : 'en';
  } else if (geoPrimary) {
    const primary = normalizeLanguage(geoPrimary);
    const secondary = geoSecondary
      ? normalizeLanguage(geoSecondary)
      : null;
    language = primary;
    if (secondary && secondary !== primary) {
      geoSuggestedLanguage = secondary;
    } else {
      geoSuggestedLanguage = primary !== 'en' ? primary : 'en';
    }
  }

  return {
    city: row.city ?? null,
    country: row.country ?? null,
    country_code: countryCode ?? null,
    region_code: row.region_code?.trim() ?? null,
    timezone: row.timezone ?? null,
    language,
    geoSuggestedLanguage,
    visit_count: typeof row.visit_count === 'number' ? row.visit_count : 1,
    last_seen_at: row.last_seen_at ?? null,
  };
}
