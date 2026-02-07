import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { validateLanguageCode } from '../../../lib/onboarding-concierge/regional-languages';

/**
 * PATCH /api/visitor
 * Update visitor preferences (e.g. language from onboarding).
 * Requires x-visitor-id header. Body: { language: string }.
 */
export async function PATCH(request: NextRequest) {
  try {
    const visitorId = request.headers.get('x-visitor-id');
    if (!visitorId || visitorId === 'anon') {
      return NextResponse.json(
        { ok: false, error: 'x-visitor-id required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawLang = body.language;
    if (typeof rawLang !== 'string' || !rawLang.trim()) {
      return NextResponse.json(
        { ok: false, error: 'language required' },
        { status: 400 }
      );
    }

    const language = validateLanguageCode(rawLang);
    const supabase = createServiceClient();

    // Try visitor_id schema: update latest row for this visitor
    const { data: latest, error: latestError } = await supabase
      .from('visitors')
      .select('id')
      .eq('visitor_id', visitorId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const rowId = !latestError && latest ? (latest as { id: string }).id : null;
    const updatePayload = { language, updated_at: new Date().toISOString() };

    if (rowId) {
      const { error } = await supabase.from('visitors').update(updatePayload).eq('id', rowId);
      if (!error) return NextResponse.json({ ok: true });
      console.warn('[visitor PATCH] update error:', error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Fallback: id = visitor cookie (one row per visitor)
    const { error } = await supabase
      .from('visitors')
      .update(updatePayload)
      .eq('id', visitorId);

    if (error) {
      console.warn('[visitor PATCH] update error:', error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn('[visitor PATCH] error:', err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
