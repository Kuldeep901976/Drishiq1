/**
 * Enriched Plan Utilities
 * Functions for generating and converting enriched plans to ACTION_PACKET format
 */

export interface EnrichedPlan {
  problem: {
    summary: string;
    domain_of_life?: string;
    severity?: number;
    prob_id?: string | null;
    description?: string;
  };
  actions: Array<{
    event_name: string;
    start_date?: string | null;
    end_date?: string | null;
    duration_days?: number | null;
    metric?: any;
    status?: string;
    owner?: string | null;
    metadata?: Record<string, any>;
  }>;
  score?: number;
  metadata?: Record<string, any>;
}

export interface ActionPacket {
  problem: {
    summary: string;
    domain_of_life?: string;
    severity?: number;
    prob_id?: string | null;
    description?: string;
  };
  actions: Array<{
    event_name: string;
    start_date?: string | null;
    end_date?: string | null;
    duration_days?: number | null;
    metric?: any;
    status?: string;
    owner?: string | null;
    metadata?: Record<string, any>;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Generate enriched plan
 * Supports both signatures:
 * - generateEnrichedPlan(intent, enrichment, userProfile) - legacy
 * - generateEnrichedPlan({ ddsState, intent, userProfile }) - new
 */
export async function generateEnrichedPlan(
  intentOrArgs: any,
  enrichment?: any,
  userProfile?: any
): Promise<EnrichedPlan> {
  // Handle both signatures
  let intent: any;
  let ddsState: any = {};
  let enrichmentData: any = {};
  let userProfileData: any = {};

  if (arguments.length === 1 && typeof intentOrArgs === 'object' && intentOrArgs !== null) {
    // New signature: { ddsState, intent, userProfile }
    ddsState = intentOrArgs.ddsState || {};
    intent = intentOrArgs.intent || ddsState.intent;
    userProfileData = intentOrArgs.userProfile || {};
    enrichmentData = ddsState.enrichment || {};
  } else {
    // Legacy signature: (intent, enrichment, userProfile)
    intent = intentOrArgs;
    enrichmentData = enrichment || {};
    userProfileData = userProfile || {};
  }

  // TODO: Implement actual plan generation logic
  // For now, return a minimal plan structure
  // This should be replaced with your actual plan generation implementation
  const plan: EnrichedPlan = {
    problem: {
      summary: intent?.label 
        ? `Problem related to ${intent.label}`
        : ddsState.core_problem?.summary || 'User problem',
      domain_of_life: intent?.domain || ddsState.core_problem?.domain_of_life,
      severity: ddsState.core_problem?.severity || 5
    },
    actions: ddsState.options?.map((opt: any, idx: number) => ({
      event_name: opt.title || opt.event_name || `Action ${idx + 1}`,
      start_date: opt.start_date || null,
      duration_days: opt.duration_days || null,
      metric: opt.metric || null,
      status: 'pending',
      owner: 'user',
      metadata: opt.metadata || {}
    })) || [],
    score: 75, // Default score
    metadata: {
      intent: intent?.label,
      enrichmentModules: enrichmentData.modulesRun || []
    }
  };

  return plan;
}

/**
 * Add disclaimers to plan
 * Supports both signatures:
 * - addDisclaimersToPlan(plan) - new
 * - addDisclaimersToPlan(plan, hasAstroData) - legacy
 */
export function addDisclaimersToPlan(
  plan: EnrichedPlan,
  hasAstroData?: boolean
): EnrichedPlan {
  if (!plan) {
    throw new Error('plan is required');
  }

  // Add disclaimers if astro data was used
  if (hasAstroData) {
    const disclaimer = '\n\n*Note: This plan incorporates astrological insights. Results may vary based on individual circumstances.*';
    if (plan.problem) {
      plan.problem.description = (plan.problem.description || '') + disclaimer;
    }
  }

  return plan;
}

/**
 * Convert enriched plan to ACTION_PACKET format
 * @param enrichedPlan The enriched plan object
 * @param problemSummary Optional problem summary override
 * @returns ACTION_PACKET in the expected format
 */
export function enrichedPlanToActionPacket(
  enrichedPlan: EnrichedPlan,
  problemSummary?: string
): ActionPacket {
  if (!enrichedPlan) {
    throw new Error('enrichedPlan is required');
  }

  // Build ACTION_PACKET from enriched plan
  const actionPacket: ActionPacket = {
    problem: {
      summary: problemSummary || enrichedPlan.problem?.summary || 'User problem',
      domain_of_life: enrichedPlan.problem?.domain_of_life,
      severity: enrichedPlan.problem?.severity,
      prob_id: enrichedPlan.problem?.prob_id || null,
      description: enrichedPlan.problem?.description
    },
    actions: (enrichedPlan.actions || []).map(action => ({
      event_name: action.event_name || 'Unnamed action',
      start_date: action.start_date || null,
      end_date: action.end_date || null,
      duration_days: action.duration_days || null,
      metric: action.metric || null,
      status: action.status || 'pending',
      owner: action.owner || null,
      metadata: action.metadata || {}
    })),
    metadata: enrichedPlan.metadata || {}
  };

  return actionPacket;
}

