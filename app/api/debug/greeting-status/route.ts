/**
 * Greeting Status Debug Endpoint
 * Check feature flag status and test template generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTenantConfig } from '@/lib/tenant/registry';
import { getNextStageMessage } from '@/lib/ddsa/getNextStageMessage';
import { getTenantContext } from '@/app/api/middleware/tenant';

export async function GET(req: NextRequest) {
  try {
    const tenantContext = await getTenantContext(req);
    const tenantId = tenantContext.tenantId;
    const tenant = await getTenantConfig(tenantId);

    // Test template generation with sample profile
    const testProfile = {
      name: 'Test User',
      first_name: 'Test',
      city: 'Delhi',
      timezone: 'Asia/Kolkata',
      role: 'solo founder',
    };

    const testState = {
      last_goal: 'get first 50 paying users',
      enrichment: {
        astro: {
          sun: 'Leo',
          moon: 'Pisces',
        },
      },
    };

    let greetingResult;
    let greetingError;
    try {
      greetingResult = await getNextStageMessage({
        tenantId,
        stage: 'greeting',
        state: testState,
        profile: testProfile,
        traceId: `debug_${Date.now()}`,
      });
    } catch (err: any) {
      greetingError = err.message;
    }

    return NextResponse.json({
      status: 'ok',
      tenant: {
        id: tenantId || 'none',
        name: tenant?.name,
        gating: tenant?.gating,
        useProfileGreeting: tenant?.gating?.useProfileGreeting,
        defaultConfig: {
          disableLegacyCfq: tenant?.gating?.disableLegacyCfq,
          useProfileGreeting: tenant?.gating?.useProfileGreeting,
        },
      },
      test: {
        profile: testProfile,
        state: testState,
        greetingResult: greetingResult
          ? {
              hasText: !!greetingResult.text,
              textLength: greetingResult.text?.length || 0,
              textSnippet: greetingResult.text?.slice(0, 100) || '',
              meta: greetingResult.meta,
            }
          : null,
        greetingError,
      },
      diagnostics: {
        featureFlagEnabled: !!tenant?.gating?.useProfileGreeting,
        templateGenerated: !!(greetingResult?.text),
        templateLength: greetingResult?.text?.length || 0,
        recommendation: !tenant?.gating?.useProfileGreeting
          ? 'Feature flag is disabled. Enable it in tenant_config table or change default in lib/tenant/registry.ts'
          : !greetingResult?.text
            ? 'Feature flag is enabled but template returned empty. Check template function.'
            : 'Everything looks good!',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

