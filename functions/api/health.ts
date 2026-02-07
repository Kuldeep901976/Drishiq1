/**
 * Health Check Endpoint
 * Verifies that Cloudflare environment variables are properly configured
 * GET /api/health
 */

import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../types/env';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { env } = ctx;

  // Check that required env vars exist at edge
  const checks = {
    supabaseUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    r2BucketBinding: !!env.DRISHIQ_UPLOADS,
    r2PublicBaseUrl: !!env.R2_PUBLIC_BASE_URL,
    openaiKey: !!env.OPENAI_API_KEY,
    supabaseServiceKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const allOk = Object.values(checks).every(Boolean);

  return new Response(
    JSON.stringify({
      ok: allOk,
      checks,
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV || 'unknown',
    }),
    {
      status: allOk ? 200 : 503,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

