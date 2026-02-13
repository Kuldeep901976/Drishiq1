/**
 * Main Chat Astro — types only.
 * No onboarding, identity, or visitor logic.
 */

/** Astro compute result from runAstroCompute (same shape as astro-client). */
export interface AstroResult {
  gain_signal: string;
  risk_signal: string;
  phase_signal: string;
  confidence: number;
}

/**
 * Birth details for Astro compute.
 * Either place (city/state/country) — resolved via geocode when origin is provided —
 * or pre-resolved latitude, longitude, timezone.
 */
export interface BirthDetailsInput {
  dob_date: string; // YYYY-MM-DD
  dob_time: string; // HH:MM or HH:MM:SS
  /** Option A: place of birth (requires origin for geocode when using this). */
  place?: {
    city: string;
    state?: string;
    country: string;
  };
  /** Option B: already resolved coordinates and timezone. */
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

/** Resolved geo + DOB ready for runAstroCompute. */
export interface ResolvedAstroInput {
  dob_date: string;
  dob_time: string;
  latitude: number;
  longitude: number;
  timezone: string;
}
