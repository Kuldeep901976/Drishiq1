/**
 * Server-only: ensure a visitor row exists (insert or update).
 * TENANT = PERSON ON DEVICE: use temp_user.tenant_id when available; otherwise tenant_id remains null.
 */

import { createServiceClient } from '@/lib/supabase';

export interface EnsureVisitorParams {
  visitorId: string;
  deviceId: string;
  ip: string;
  /** From request (x-tenant-id) or temp_user.tenant_id when identity complete; otherwise null. */
  tenantId: string | null | undefined;
  country?: string | null;
  countryCode?: string | null;
  regionCode?: string | null;
  city?: string | null;
  timezone?: string | null;
  /** Primary language from region/country geo. */
  language?: string | null;
  /** Optional secondary language for region (for hint/suggestions). */
  secondaryLanguage?: string | null;
}

/**
 * Insert or update visitors row. Idempotent.
 * Throws on unexpected DB errors; callers may catch to avoid breaking the request.
 */
export async function ensureVisitor(params: EnsureVisitorParams): Promise<void> {
  const { visitorId, deviceId, ip, tenantId, country, countryCode, regionCode, city, timezone, language, secondaryLanguage } = params;

  if (!visitorId || !deviceId) {
    return; // no-op if identity missing
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // -------------------------------------------------------
  // Check if visitor already exists
  // -------------------------------------------------------
  let existing: { id: string; visit_count?: number } | null = null;
  const { data: existingWithCount, error: selectError } = await supabase
    .from('visitors')
    .select('id, visit_count')
    .eq('id', visitorId)
    .maybeSingle();
  if (selectError && selectError.message?.includes('column')) {
    const { data: existingId } = await supabase.from('visitors').select('id').eq('id', visitorId).maybeSingle();
    if (existingId) existing = { id: existingId.id };
  } else if (existingWithCount) {
    existing = existingWithCount as { id: string; visit_count?: number };
  }

  if (existing) {
    // UPDATE: full payload preferred; if table lacks context columns, retry with base-only
    const nextCount = existing.visit_count != null ? existing.visit_count + 1 : 2;
    const fullUpdate: Record<string, unknown> = {
      latest_ip: ip,
      visit_count: nextCount,
      last_seen_at: now,
      updated_at: now,
    };
    if (tenantId != null) fullUpdate.tenant_id = tenantId;
    let updateResult = await supabase.from('visitors').update(fullUpdate).eq('id', visitorId);

    if (updateResult.error) {
      const isMissingColumn =
        updateResult.error.message?.includes('column') && updateResult.error.message?.includes('does not exist');
      if (isMissingColumn) {
        const fallback: Record<string, unknown> = { latest_ip: ip, updated_at: now };
        if (tenantId != null) fallback.tenant_id = tenantId;
        await supabase.from('visitors').update(fallback).eq('id', visitorId);
      } else {
        console.error('[ensureVisitor] update error', updateResult.error.message, updateResult.error);
        throw updateResult.error;
      }
    }
    return;
  }

  // -------------------------------------------------------
  // INSERT: base payload + optional context columns
  // -------------------------------------------------------
  const basePayload: Record<string, unknown> = {
    id: visitorId,
    device_id: deviceId,
    first_ip: ip,
    latest_ip: ip,
    created_at: now,
    updated_at: now,
  };
  if (tenantId != null) basePayload.tenant_id = tenantId;
  const visitorPayload: Record<string, unknown> = {
    ...basePayload,
    visit_count: 1,
    last_seen_at: now,
  };
  if (country != null) visitorPayload.country = country;
  if (countryCode != null) visitorPayload.country_code = countryCode;
  if (regionCode != null) visitorPayload.region_code = regionCode;
  if (city != null) visitorPayload.city = city;
  if (timezone != null) visitorPayload.timezone = timezone;
  if (language != null) visitorPayload.language = language;
  if (secondaryLanguage != null) visitorPayload.secondary_language = secondaryLanguage;

  let result = await supabase.from('visitors').insert(visitorPayload);

  if (result.error) {
    const isMissingColumn =
      result.error.message?.includes('column') && result.error.message?.includes('does not exist');
    if (isMissingColumn) {
      result = await supabase.from('visitors').insert(basePayload);
    }
    if (result.error) {
      if (result.error.code === '23505') {
        const conflictUpdate: Record<string, unknown> = { latest_ip: ip, updated_at: now };
        if (tenantId != null) conflictUpdate.tenant_id = tenantId;
        await supabase.from('visitors').update(conflictUpdate).eq('id', visitorId);
        return;
      }
      console.error('[ensureVisitor] insert error', result.error.message, result.error);
      throw result.error;
    }
  }
}
