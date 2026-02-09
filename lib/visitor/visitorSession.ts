/**
 * First-touch session: write to visitor_sessions before copying to visitors.
 * Called by POST /api/visitor/ensure so we have one row per session (device + IP + geo + cookie summary).
 */

import { createServiceClient } from '@/lib/supabase';

export interface VisitorSessionParams {
  sessionId: string;
  deviceId: string;
  ip: string | null;
  country?: string | null;
  countryCode?: string | null;
  regionCode?: string | null;
  city?: string | null;
  timezone?: string | null;
  cookieLanguage?: string | null;
}

const hasValue = (v: string | null | undefined) => v != null && v !== '';

export async function writeVisitorSession(params: VisitorSessionParams): Promise<void> {
  const {
    sessionId,
    deviceId,
    ip,
    country,
    countryCode,
    regionCode,
    city,
    timezone,
    cookieLanguage,
  } = params;

  if (!sessionId || !deviceId) return;

  const supabase = createServiceClient();
  const row: Record<string, unknown> = {
    session_id: sessionId,
    device_id: deviceId,
    created_at: new Date().toISOString(),
  };
  if (hasValue(ip)) row.first_ip = ip;
  if (hasValue(country)) row.country = country;
  if (hasValue(countryCode)) row.country_code = countryCode;
  if (hasValue(regionCode)) row.region_code = regionCode;
  if (hasValue(city)) row.city = city;
  if (hasValue(timezone)) row.timezone = timezone;
  if (hasValue(cookieLanguage)) row.cookie_language = cookieLanguage;

  const { error } = await supabase.from('visitor_sessions').insert(row);
  if (error) {
    console.error('[writeVisitorSession] error', { message: error.message, code: error.code });
    throw error;
  }
}
