/**
 * Astro Python microservice client.
 * Adapter layer: calls POST /astro/compute (used after UDA bounded exit).
 * No changes to intake, UDA, or OTP systems.
 */

import { fetchWithTimeout } from '../utils/fetchWithTimeout';

// ---------------------------------------------------------------------------
// ENV
// ---------------------------------------------------------------------------

const COMPUTE_TIMEOUT_MS = 5000;

// ---------------------------------------------------------------------------
// CONTRACTS (Node ↔ Python)
// ---------------------------------------------------------------------------

export type AstroComputeInput = {
  dob_date: string; // YYYY-MM-DD
  dob_time: string; // HH:MM or HH:MM:SS
  latitude: number;
  longitude: number;
  timezone: string;
  problem_context: string;
  uda_summary: string;
};

export type AstroComputeOutput = {
  gain_signal: string;
  risk_signal: string;
  phase_signal: string;
  confidence: number;
};

export type AstroComputeSuccess = {
  success: true;
  data: AstroComputeOutput;
};

export type AstroComputeError = {
  success: false;
  error: string;
};

export type AstroComputeResult = AstroComputeSuccess | AstroComputeError;

// ---------------------------------------------------------------------------
// URL
// ---------------------------------------------------------------------------

/**
 * Returns the base URL of the Astro Python service (from env or default).
 */
export function getAstroServiceUrl(): string {
  return process.env.ASTRO_SERVICE_URL ?? 'http://localhost:5001';
}

// ---------------------------------------------------------------------------
// COMPUTE
// ---------------------------------------------------------------------------

/**
 * Calls the Astro Python service: POST {ASTRO_SERVICE_URL}/astro/compute.
 * Timeout: 5 seconds. Returns parsed JSON on success or { success: false, error }.
 */
export async function runAstroCompute(
  input: AstroComputeInput
): Promise<AstroComputeResult> {
  const baseUrl = getAstroServiceUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/astro/compute`;

  try {
    const res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
      { timeoutMs: COMPUTE_TIMEOUT_MS, retries: 0 }
    );

    if (!res.ok) {
      const text = await res.text();
      const message =
        text && text.length < 500 ? text : `HTTP ${res.status}`;
      return { success: false, error: message };
    }

    const data = (await res.json()) as AstroComputeOutput;
    return { success: true, data };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : String(err ?? 'Unknown error');
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// TEST (temporary – no routes modified)
// ---------------------------------------------------------------------------

/**
 * Temporary test: GET {ASTRO_SERVICE_URL}/health.
 * Returns true if service responds with ok, false otherwise.
 */
export async function testAstroHealth(): Promise<boolean> {
  const baseUrl = getAstroServiceUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/health`;

  try {
    const res = await fetchWithTimeout(url, {}, {
      timeoutMs: 3000,
      retries: 0,
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { status?: string };
    return body?.status === 'ok';
  } catch {
    return false;
  }
}
