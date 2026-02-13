/**
 * Main Chat Astro — run Astro compute from problem_statement + birth_details.
 * Uses runAstroCompute (astro-client) and structureIntentForMainChatAstro (Main Chat–only intent prompt).
 * Resolves place via resolveBirthPlaceGeo. No onboarding, temp_user, or visitor logic.
 */

import { runAstroCompute } from '@/lib/astro/astro-client';
import { resolveBirthPlaceGeo } from '@/lib/onboarding-concierge/destiny-lens';
import { structureIntentForMainChatAstro } from './astro-prompts';
import type { AstroResult } from './types';
import type { BirthDetailsInput, ResolvedAstroInput } from './types';

/**
 * Resolve birth_details into coordinates + timezone.
 * If place is given, uses origin to call geocode API. If lat/long/timezone are given, returns them.
 */
export async function resolveBirthDetails(
  birthDetails: BirthDetailsInput,
  origin: string
): Promise<ResolvedAstroInput | null> {
  const { dob_date, dob_time, place, latitude, longitude, timezone } = birthDetails;

  if (latitude != null && longitude != null && timezone?.trim()) {
    return {
      dob_date,
      dob_time,
      latitude: Number(latitude),
      longitude: Number(longitude),
      timezone: timezone.trim(),
    };
  }

  if (place?.city && place?.country) {
    const geo = await resolveBirthPlaceGeo(
      place.city,
      place.state ?? '',
      place.country,
      origin
    );
    if (!geo) return null;
    return {
      dob_date,
      dob_time,
      latitude: geo.latitude,
      longitude: geo.longitude,
      timezone: geo.timezone,
    };
  }

  return null;
}

/**
 * Run the Astro pipeline: problem_statement → problem_context → runAstroCompute → astro_result.
 * Uses Main Chat–only intent structuring (not Greeter/Destiny Lens). Caller must have resolved birth_details.
 */
export async function runAstroForMainChat(params: {
  problem_statement: string;
  resolved: ResolvedAstroInput;
}): Promise<AstroResult | null> {
  const { problem_statement, resolved } = params;
  const problem_context = await structureIntentForMainChatAstro(problem_statement);

  const result = await runAstroCompute({
    dob_date: resolved.dob_date,
    dob_time: resolved.dob_time,
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    timezone: resolved.timezone,
    problem_context: problem_context || problem_statement,
    uda_summary: problem_statement,
  });

  if (!result.success || !result.data) return null;
  return {
    gain_signal: result.data.gain_signal,
    risk_signal: result.data.risk_signal,
    phase_signal: result.data.phase_signal,
    confidence: result.data.confidence,
  };
}
