/**
 * Plan Refinement Module
 * Handles user feedback on plans and refines them
 */

export interface PlanFeedback {
  type: 'accept' | 'reject' | 'refine';
  action?: 'accept' | 'refine' | 'reject';
  message?: string;
  changes?: string[];
}

export interface RefinementResult {
  plan: any;
  changes: string[];
  refinedPlan?: any;
  enrichedPlan?: any;
}

/**
 * Parse plan feedback from user message
 */
export function parsePlanFeedback(message: string): PlanFeedback | null {
  if (!message || typeof message !== 'string') {
    return null;
  }

  const lowerMessage = message.toLowerCase().trim();

  // Check for accept patterns
  if (
    lowerMessage.includes('yes') ||
    lowerMessage.includes('accept') ||
    lowerMessage.includes('sounds good') ||
    lowerMessage.includes('looks good') ||
    lowerMessage.includes('proceed') ||
    lowerMessage.includes('go ahead')
  ) {
    return {
      type: 'accept',
      action: 'accept',
      message: message
    };
  }

  // Check for reject patterns
  if (
    lowerMessage.includes('no') ||
    lowerMessage.includes('reject') ||
    lowerMessage.includes('not good') ||
    lowerMessage.includes("don't like") ||
    lowerMessage.includes('wrong')
  ) {
    return {
      type: 'reject',
      action: 'reject',
      message: message
    };
  }

  // Check for refine patterns
  if (
    lowerMessage.includes('change') ||
    lowerMessage.includes('modify') ||
    lowerMessage.includes('adjust') ||
    lowerMessage.includes('update') ||
    lowerMessage.includes('refine') ||
    lowerMessage.includes('instead') ||
    lowerMessage.includes('but')
  ) {
    return {
      type: 'refine',
      action: 'refine',
      message: message
    };
  }

  // Default to refine if message contains actionable content
  if (message.length > 10) {
    return {
      type: 'refine',
      action: 'refine',
      message: message
    };
  }

  return null;
}

/**
 * Refine enriched plan based on feedback
 */
export async function refineEnrichedPlan(
  plan: any,
  feedback: PlanFeedback,
  intent?: any,
  context?: { threadId?: string; userId?: string }
): Promise<RefinementResult> {
  if (!plan) {
    throw new Error('Plan is required for refinement');
  }

  if (feedback.type === 'accept') {
    // No changes needed
    return {
      plan,
      changes: [],
      refinedPlan: plan,
      enrichedPlan: plan
    };
  }

  if (feedback.type === 'reject') {
    // Return empty plan or minimal plan
    return {
      plan: {
        ...plan,
        actions: [],
        score: 0
      },
      changes: ['Plan rejected by user'],
      refinedPlan: {
        ...plan,
        actions: [],
        score: 0
      },
      enrichedPlan: {
        ...plan,
        actions: [],
        score: 0
      }
    };
  }

  // Refine plan based on feedback message
  const changes: string[] = [];
  const refinedPlan = { ...plan };

  // Extract change requests from feedback message
  if (feedback.message) {
    const lowerMessage = feedback.message.toLowerCase();

    // Check for specific action changes
    if (lowerMessage.includes('remove') || lowerMessage.includes('delete')) {
      // Remove actions mentioned
      const actionsToRemove = refinedPlan.actions?.filter((action: any, idx: number) => {
        const actionText = (action.event_name || action.title || '').toLowerCase();
        return !lowerMessage.includes(actionText);
      }) || [];
      refinedPlan.actions = actionsToRemove;
      changes.push('Removed actions based on feedback');
    }

    if (lowerMessage.includes('add') || lowerMessage.includes('include')) {
      // Add new action based on feedback
      const newAction = {
        event_name: feedback.message.substring(0, 100),
        status: 'pending',
        owner: 'user',
        metadata: { source: 'user_feedback' }
      };
      refinedPlan.actions = [...(refinedPlan.actions || []), newAction];
      changes.push('Added new action based on feedback');
    }

    // Update plan summary if mentioned
    if (lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
      changes.push('Updated problem summary based on feedback');
    }
  }

  // Ensure at least one change if refining
  if (changes.length === 0) {
    changes.push('Plan refined based on user feedback');
  }

  return {
    plan,
    changes,
    refinedPlan,
    enrichedPlan: refinedPlan
  };
}




