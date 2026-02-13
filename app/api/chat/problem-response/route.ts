/**
 * DEV TOOL ONLY.
 * Used for internal Astro testing.
 * Not part of production Greeter flow.
 *
 * - mode=bounded: Greeter-style path (intentStructuringForAstro → runAstroCompute → generateDestinyLensInsightBlocks).
 * - mode=main_chat: Main Chat Astro module (generateAstroAdviceForProblem).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  resolveBirthPlaceGeo,
  intentStructuringForAstro,
  generateDestinyLensInsightBlocks,
  type AstroResultMeta,
} from '@/lib/onboarding-concierge/destiny-lens';
import { runAstroCompute } from '@/lib/astro/astro-client';
import { normalizeLanguage } from '@/lib/onboarding-concierge/regional-languages';
import { generateAstroAdviceForProblem } from '@/lib/main-chat-astro';

export type ProblemResponseMode = 'bounded' | 'main_chat';

export interface ProblemResponseRequestBody {
  problem_statement: string;
  dob_date: string;
  dob_time: string;
  place_of_birth: string; // City, State, Country
  mode: ProblemResponseMode;
  language?: string;
  /** Optional: if provided with latitude/longitude, skip server-side geocode and use these for Astro. */
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface ProblemResponseSuccessBody {
  success: true;
  mode: ProblemResponseMode;
  interpretation: string;
  signals: {
    gain_signal: string;
    risk_signal: string;
    phase_signal: string;
    confidence: number;
  };
}

function parsePlaceOfBirth(place_of_birth: string): { city: string; state: string; country: string } {
  const parts = place_of_birth.split(',').map((p) => p.trim()).filter(Boolean);
  return {
    city: parts[0] ?? '',
    state: parts[1] ?? '',
    country: parts[2] ?? '',
  };
}

/**
 * POST /api/chat/problem-response
 * Dev-only. Same Astro layer as production: Phase 1 (intentStructuringForAstro) → runAstroCompute → Phase 2 (generateDestinyLensInsightBlocks).
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<ProblemResponseSuccessBody | { success: false; error: string }>> {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<ProblemResponseRequestBody>;
    const problem_statement = typeof body.problem_statement === 'string' ? body.problem_statement.trim() : '';
    const dob_date = typeof body.dob_date === 'string' ? body.dob_date.trim() : '';
    const dob_time = typeof body.dob_time === 'string' ? body.dob_time.trim() : '';
    const place_of_birth = typeof body.place_of_birth === 'string' ? body.place_of_birth.trim() : '';
    const mode: ProblemResponseMode =
      body.mode === 'bounded' || body.mode === 'main_chat' ? body.mode : 'bounded';
    const language = normalizeLanguage(body.language ?? 'en');
    const providedLat = body.latitude != null ? Number(body.latitude) : null;
    const providedLon = body.longitude != null ? Number(body.longitude) : null;
    const providedTz = typeof body.timezone === 'string' ? body.timezone.trim() : '';

    if (!problem_statement) {
      return NextResponse.json({ success: false, error: 'problem_statement is required' }, { status: 400 });
    }
    if (!dob_date || !dob_time) {
      return NextResponse.json(
        { success: false, error: 'dob_date and dob_time are required' },
        { status: 400 }
      );
    }

    let latitude: number;
    let longitude: number;
    let timezone: string;

    const hasProvidedGeo =
      providedLat != null &&
      providedLon != null &&
      !Number.isNaN(providedLat) &&
      !Number.isNaN(providedLon) &&
      providedTz.length > 0;

    if (hasProvidedGeo) {
      latitude = providedLat as number;
      longitude = providedLon as number;
      timezone = providedTz;
    } else {
      if (!place_of_birth) {
        return NextResponse.json(
          { success: false, error: 'place_of_birth is required when latitude/longitude/timezone are not provided' },
          { status: 400 }
        );
      }
      const { city, state, country } = parsePlaceOfBirth(place_of_birth);
      if (!city || !country) {
        return NextResponse.json(
          { success: false, error: 'place_of_birth must include at least City and Country (e.g. Delhi, Delhi, India)' },
          { status: 400 }
        );
      }
      const origin = new URL(req.url).origin;
      const geo = await resolveBirthPlaceGeo(city, state, country, origin);
      if (!geo) {
        return NextResponse.json(
          { success: false, error: 'Could not resolve place of birth to coordinates and timezone. Use Resolve on the test page or provide latitude, longitude, timezone.' },
          { status: 400 }
        );
      }
      latitude = geo.latitude;
      longitude = geo.longitude;
      timezone = geo.timezone;
    }

    const origin = new URL(req.url).origin;

    // Main Chat Astro path: uses lib/main-chat-astro (advisory, no Destiny Lens framing).
    if (mode === 'main_chat') {
      const birth_details =
        hasProvidedGeo
          ? {
              dob_date,
              dob_time,
              latitude: latitude as number,
              longitude: longitude as number,
              timezone,
            }
          : {
              dob_date,
              dob_time,
              place: parsePlaceOfBirth(place_of_birth),
            };

      const result = await generateAstroAdviceForProblem({
        problem_statement,
        birth_details,
        language,
        origin,
      });

      if (!result) {
        return NextResponse.json(
          { success: false, error: 'Astro pipeline failed (resolve or compute)' },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        mode: 'main_chat',
        interpretation: result.interpretation,
        signals: {
          gain_signal: result.signals.gain_signal,
          risk_signal: result.signals.risk_signal,
          phase_signal: result.signals.phase_signal,
          confidence: result.signals.confidence,
        },
      });
    }

    // Bounded (Greeter-style) path: intentStructuring → runAstroCompute → generateDestinyLensInsightBlocks.
    const problem_context = await intentStructuringForAstro(problem_statement);

    const astroCall = await runAstroCompute({
      dob_date,
      dob_time,
      latitude,
      longitude,
      timezone,
      problem_context,
      uda_summary: problem_statement,
    });

    if (!astroCall.success) {
      return NextResponse.json(
        { success: false, error: astroCall.error ?? 'Astro compute failed' },
        { status: 502 }
      );
    }
    if (!astroCall.data) {
      return NextResponse.json(
        { success: false, error: 'Astro compute returned no data' },
        { status: 502 }
      );
    }

    const astroResult: AstroResultMeta = {
      gain_signal: astroCall.data.gain_signal,
      risk_signal: astroCall.data.risk_signal,
      phase_signal: astroCall.data.phase_signal,
      confidence: astroCall.data.confidence,
    };

    const interpretation = await generateDestinyLensInsightBlocks(
      astroResult,
      problem_context.trim() ? problem_context : problem_statement,
      language
    );

    return NextResponse.json({
      success: true,
      mode: 'bounded',
      interpretation,
      signals: {
        gain_signal: astroCall.data.gain_signal,
        risk_signal: astroCall.data.risk_signal,
        phase_signal: astroCall.data.phase_signal,
        confidence: astroCall.data.confidence,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? 'Unknown error');
    console.error('[problem-response] dev tool error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
