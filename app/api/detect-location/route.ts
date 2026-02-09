import { NextRequest, NextResponse } from 'next/server';
import { getGeoContext } from '@/lib/geo/geoProvider';

const GEO_TIMEOUT_MS = 6000;

function getClientIP(request: NextRequest): string {
  const fromHeader = request.headers.get('x-client-ip');
  if (fromHeader) return fromHeader.trim();
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}

function emptyGeoResponse() {
  return NextResponse.json({
    country: undefined,
    city: undefined,
    country_code: undefined,
    region_code: undefined,
    timezone: undefined,
    potentialVpn: false,
  });
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const geo = await Promise.race([
      getGeoContext(ip),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Geo lookup timeout')), GEO_TIMEOUT_MS)
      ),
    ]);

    return NextResponse.json({
      country: geo.country ?? undefined,
      city: geo.city ?? undefined,
      country_code: geo.country_code ?? undefined,
      region_code: geo.region_code ?? undefined,
      timezone: geo.timezone ?? undefined,
      potentialVpn: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'Geo lookup timeout') {
      console.warn('[detect-location] Geo lookup timed out, returning empty geo');
    } else {
      console.error('Location detection error:', error);
    }
    return emptyGeoResponse();
  }
}
