import { NextRequest, NextResponse } from 'next/server';
import { getGeoContext } from '@/lib/geo/geoProvider';

function getClientIP(request: NextRequest): string {
  const fromHeader = request.headers.get('x-client-ip');
  if (fromHeader) return fromHeader.trim();
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const geo = await getGeoContext(ip);

    return NextResponse.json({
      country: geo.country ?? undefined,
      city: geo.city ?? undefined,
      country_code: geo.country_code ?? undefined,
      region_code: geo.region_code ?? undefined,
      timezone: geo.timezone ?? undefined,
    });
  } catch (error) {
    console.error('Location detection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
