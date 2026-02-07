/**
 * Enrichment Module
 * Runs consent-gated enrichment modules (profile, calendar, astro)
 */

export interface EnrichmentOptions {
  userId: string;
  threadId: string;
  ddsState?: any;
  userProfile?: any;
  consent?: Record<string, boolean>;
}

export interface EnrichmentResult {
  modulesRun: string[];
  payload: Record<string, any>;
  durations: Record<string, number>;
  timestamp: string;
}

/**
 * Run enrichment modules based on consent
 */
export async function runEnrichment(
  options: EnrichmentOptions | any,
  intent?: any
): Promise<EnrichmentResult> {
  // Handle both signatures: (options) or (ddsState, intent)
  let opts: EnrichmentOptions;
  
  if (options && typeof options === 'object' && 'userId' in options) {
    // New signature: { userId, threadId, ddsState, userProfile, consent }
    opts = options;
  } else {
    // Legacy signature: (ddsState, intent)
    opts = {
      userId: options?.user_id || options?.userId || 'unknown',
      threadId: options?.thread_id || options?.threadId || 'unknown',
      ddsState: options || {},
      userProfile: {},
      consent: options?.consent || {}
    };
  }

  const { userId, threadId, ddsState = {}, userProfile = {}, consent = {} } = opts;
  const modulesRun: string[] = [];
  const payload: Record<string, any> = {};
  const durations: Record<string, number> = {};
  const startTime = Date.now();

  // Profile enrichment (always available, no consent needed)
  if (userProfile && Object.keys(userProfile).length > 0) {
    const profileStart = Date.now();
    payload.profile = {
      name: userProfile.name || userProfile.full_name,
      email: userProfile.email,
      user_type: userProfile.user_type,
      preferences: userProfile.preferences || {}
    };
    modulesRun.push('profile');
    durations.profile = Date.now() - profileStart;
  }

  // Calendar enrichment (requires consent)
  if (consent.calendar === true) {
    try {
      const calendarStart = Date.now();
      // TODO: Implement actual calendar integration
      payload.calendar = {
        events: [],
        availability: {}
      };
      modulesRun.push('calendar');
      durations.calendar = Date.now() - calendarStart;
    } catch (error) {
      console.error('Calendar enrichment failed:', error);
    }
  }

  // Astro enrichment (requires consent)
  if (consent.astro === true) {
    try {
      const astroStart = Date.now();
      // TODO: Implement actual astro integration
      payload.astro = {
        sign: userProfile.astro_sign || null,
        chart: null
      };
      modulesRun.push('astro');
      durations.astro = Date.now() - astroStart;
    } catch (error) {
      console.error('Astro enrichment failed:', error);
    }
  }

  return {
    modulesRun,
    payload,
    durations,
    timestamp: new Date().toISOString()
  };
}




