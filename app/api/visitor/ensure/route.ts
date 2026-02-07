import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantId } from '@/app/api/middleware/tenant';
import { getGeoContext } from '@/lib/geo/geoProvider';
import { getRegionLanguages, normalizeLanguage } from '../../../../lib/onboarding-concierge/regional-languages';
import { ensureVisitor } from '@/lib/visitor/ensureVisitor';
import { createServiceClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const visitorId = request.headers.get('x-visitor-id');
    const deviceId = request.headers.get('x-device-id');

    if (process.env.NODE_ENV === 'development') {
      console.log('[visitor/ensure] called', { visitorId: visitorId?.slice(0, 8), hasDeviceId: !!deviceId });
    }

    const clientIp =
      request.headers.get('x-client-ip') ??
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    const headerCity = request.headers.get('x-geo-city')?.trim() || null;
    const headerCountry = request.headers.get('x-geo-country')?.trim() || null;
    const headerCountryCode = request.headers.get('x-geo-country-code')?.trim()?.toUpperCase() || null;
    const headerRegionCode = request.headers.get('x-geo-region-code')?.trim()?.toUpperCase() || null;

    if (!visitorId || !deviceId) {
      return NextResponse.json(
        { ok: false, error: 'x-visitor-id and x-device-id required' },
        { status: 400 }
      );
    }

    let country: string | null = null;
    let countryCode: string | null = null;
    let regionCode: string | null = null;
    let city: string | null = null;
    let timezone: string | null = null;
    let language: string | null = null;

    // Prefer geo from frontend (detect-location → onboarding-concierge headers); only use IP lookup when missing
    const hasHeaderGeo = headerCountryCode || (headerCountry && headerCity);
    if (hasHeaderGeo) {
      if (headerCountry) country = headerCountry;
      if (headerCountryCode) countryCode = headerCountryCode;
      if (headerRegionCode) regionCode = headerRegionCode;
      if (headerCity) city = headerCity;
      const { primary } = getRegionLanguages(
        countryCode ?? '',
        regionCode ?? null
      );
      language = normalizeLanguage(primary);
    } else if (!countryCode || !regionCode) {
      const geo = await getGeoContext(clientIp);
      country = geo?.country ?? country;
      countryCode = geo?.country_code ?? countryCode;
      regionCode = geo?.region_code ?? regionCode;
      city = geo?.city ?? city;
      timezone = geo?.timezone ?? timezone;
      const { primary } = getRegionLanguages(
        countryCode ?? '',
        regionCode ?? null
      );
      language = normalizeLanguage(primary);
    }

    const tenantId = resolveTenantId(request);

    await ensureVisitor({
      visitorId,
      deviceId,
      ip: clientIp,
      tenantId: tenantId ?? null,
      country,
      countryCode,
      regionCode,
      city,
      timezone,
      language,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[visitor/ensure] success', { visitorId: visitorId?.slice(0, 8), countryCode, regionCode, language });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const details = err && typeof err === 'object' && 'code' in err ? (err as { code?: string }).code : undefined;
    console.error('[visitor/ensure] error', { message, details, err });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
