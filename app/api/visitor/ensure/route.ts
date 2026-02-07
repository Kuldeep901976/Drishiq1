import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantId } from '@/app/api/middleware/tenant';
import { getGeoContext } from '@/lib/geo/geoProvider';
import { getRegionLanguages, normalizeLanguage } from '@/lib/onboarding-concierge/regional-languages';
import { ensureVisitor } from '@/lib/visitor/ensureVisitor';

/**
 * POST /api/visitor/ensure
 * Called by middleware when a new drishiq_visitor_id is created.
 * Captures IP → geo → timezone. On INSERT: store geo, visit_count=1, last_seen_at.
 * On UPDATE: update latest_ip, increment visit_count, last_seen_at.
 */

export async function POST(request: NextRequest) {
  try {
    const visitorId = request.headers.get('x-visitor-id');
    const deviceId = request.headers.get('x-device-id');

    const clientIp =
      request.headers.get('x-client-ip') ??
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    if (!visitorId || !deviceId) {
      return NextResponse.json(
        { ok: false, error: 'x-visitor-id and x-device-id required' },
        { status: 400 }
      );
    }

    const geo = await getGeoContext(clientIp);
    const { primary, secondary } = getRegionLanguages(
      geo?.country_code ?? '',
      geo?.region_code ?? null
    );

    const tenantId = resolveTenantId(request);
    await ensureVisitor({
      visitorId,
      deviceId,
      ip: clientIp,
      tenantId: tenantId ?? null,
      country: geo?.country ?? null,
      countryCode: geo?.country_code ?? null,
      regionCode: geo?.region_code ?? null,
      city: geo?.city ?? null,
      timezone: geo?.timezone ?? null,
      language: normalizeLanguage(primary),
      secondaryLanguage: secondary != null ? normalizeLanguage(secondary) : null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[visitor/ensure] error', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
