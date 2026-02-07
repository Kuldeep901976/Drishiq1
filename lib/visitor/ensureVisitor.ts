/**
 * Server-only: ensure a visitor row exists.
 *
 * If the table has visitor_id: one new row per visit (INSERT only), visit_count = 1,2,3… per user.
 * If the table has no visitor_id (id = cookie): one row per visitor, update or insert by id, visit_count increments on update.
 */

import { createServiceClient } from '@/lib/supabase';
import { randomUUID } from 'crypto';

export interface EnsureVisitorParams {
  visitorId: string;
  deviceId: string;
  ip: string;
  tenantId: string | null | undefined;

  country?: string | null;
  countryCode?: string | null;
  regionName?: string | null;
  regionCode?: string | null;
  city?: string | null;
  timezone?: string | null;

  language?: string | null;
}

const hasValue = (v: string | null | undefined) =>
  v != null && v !== '';

export async function ensureVisitor(params: EnsureVisitorParams): Promise<void> {
  const {
    visitorId,
    deviceId,
    ip,
    country,
    countryCode,
    regionCode,
    city,
    timezone,
    language,
  } = params;

  if (!visitorId || !deviceId) return;

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // ---- Try new schema: count by visitor_id (one row per visit) ----
  const { count, error: countError } = await supabase
    .from('visitors')
    .select('id', { count: 'exact', head: true })
    .eq('visitor_id', visitorId);

  if (!countError) {
    const nextVisitCount = (count ?? 0) + 1;
    const row: Record<string, unknown> = {
      id: randomUUID(),
      visitor_id: visitorId,
      device_id: deviceId,
      first_ip: ip,
      visit_count: nextVisitCount,
      created_at: now,
      last_seen_at: now,
    };
    if (hasValue(country)) row.country = country;
    if (hasValue(countryCode)) row.country_code = countryCode;
    if (hasValue(regionCode)) row.region_code = regionCode;
    if (hasValue(city)) row.city = city;
    if (hasValue(timezone)) row.timezone = timezone;
    if (hasValue(language)) row.language = language;

    const { error } = await supabase.from('visitors').insert(row);
    if (!error) return;
    console.error('[ensureVisitor] insert (visitor_id schema) error', { message: error.message, code: error.code });
    throw error;
  }

  // ---- Fallback: old schema (id = visitor cookie, one row per visitor) ----
  const { data: existing } = await supabase
    .from('visitors')
    .select('id, visit_count')
    .eq('id', visitorId)
    .maybeSingle();

  if (existing) {
    const nextCount = existing.visit_count != null ? existing.visit_count + 1 : 2;
    const updatePayload: Record<string, unknown> = {
      visit_count: nextCount,
      last_seen_at: now,
    };
    if (hasValue(country)) updatePayload.country = country;
    if (hasValue(countryCode)) updatePayload.country_code = countryCode;
    if (hasValue(regionCode)) updatePayload.region_code = regionCode;
    if (hasValue(city)) updatePayload.city = city;
    if (hasValue(timezone)) updatePayload.timezone = timezone;
    if (hasValue(language)) updatePayload.language = language;

    const { error } = await supabase.from('visitors').update(updatePayload).eq('id', visitorId);
    if (error) {
      console.error('[ensureVisitor] update error', { message: error.message, code: error.code });
      throw error;
    }
    return;
  }

  const visitorPayload: Record<string, unknown> = {
    id: visitorId,
    device_id: deviceId,
    first_ip: ip,
    visit_count: 1,
    created_at: now,
    last_seen_at: now,
  };
  if (hasValue(country)) visitorPayload.country = country;
  if (hasValue(countryCode)) visitorPayload.country_code = countryCode;
  if (hasValue(regionCode)) visitorPayload.region_code = regionCode;
  if (hasValue(city)) visitorPayload.city = city;
  if (hasValue(timezone)) visitorPayload.timezone = timezone;
  if (hasValue(language)) visitorPayload.language = language;

  const { error } = await supabase.from('visitors').insert(visitorPayload);
  if (error) {
    console.error('[ensureVisitor] insert (id schema) error', { message: error.message, code: error.code });
    throw error;
  }
}
