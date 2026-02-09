/**
 * Local Omnivyra bounded engine integration.
 * Calls the omnivyra-main package in-process (no HTTP). Used by onboarding when
 * flow_state === "verified_ready_for_omnivyra". Do not remove HTTP client;
 * this is a parallel path for onboarding only.
 */

import type {
  OmnivyraRequest,
  OmnivyraBoundedResponse,
  OmnivyraUserProfile,
  OmnivyraConversationEntry,
} from './types';

/** Handoff payload shape from onboarding-concierge (verified_ready_for_omnivyra). */
export interface HandoffPayload {
  name?: string;
  age_range?: string;
  gender?: string;
  problem_statement?: string;
  language?: string;
  city?: string;
  state?: string;
  country?: string;
}

/** Message item from thread history (role + content). */
export interface ThreadMessage {
  role: string;
  content: string;
}

/**
 * Build OmnivyraRequest (contract input) from handoff_payload and conversation context.
 * Maps Drishiq handoff fields to the contract expected by the local engine.
 */
export function buildBoundedInputFromHandoff(params: {
  handoff: HandoffPayload;
  threadId: string;
  userId: string;
  currentMessage: string;
  history?: ThreadMessage[];
}): OmnivyraRequest {
  const { handoff, threadId, userId, currentMessage, history } = params;

  const user_profile: OmnivyraUserProfile | undefined =
    handoff.age_range || handoff.gender || handoff.city || handoff.country
      ? {
          age: handoff.age_range ? parseInt(handoff.age_range, 10) : undefined,
          gender: handoff.gender,
          location: [handoff.city, handoff.state, handoff.country].filter(Boolean).join(', ') || undefined,
        }
      : undefined;

  const conversation_history: OmnivyraConversationEntry[] | undefined =
    history && history.length > 0
      ? history.map((m) => ({
          role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.content,
          ts: new Date().toISOString(),
        }))
      : undefined;

  const request: OmnivyraRequest = {
    session_id: threadId,
    user_id: userId,
    company_id: null,
    domain: 'generic',
    problem_text: currentMessage || handoff.problem_statement || '',
    mode: 'bounded',
  };

  if (user_profile) request.user_profile = user_profile;
  if (handoff.language) request.language = handoff.language;
  if (conversation_history && conversation_history.length > 0) request.conversation_history = conversation_history;
  request.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  request.metadata = { channel: 'web' };

  return request;
}

export type RunLocalBoundedResult =
  | { success: true; data: OmnivyraBoundedResponse }
  | { success: false; error: string };

/**
 * Call the local Omnivyra bounded engine (omnivyra-main package).
 * Uses dynamic import so the app builds when the package is not yet present.
 * When the package is added, it must export runBounded(request) returning OmnivyraBoundedResponse.
 */
export async function runLocalBounded(request: OmnivyraRequest): Promise<RunLocalBoundedResult> {
  try {
    const pkg = await import('omnivyra-main');
    const runBounded = pkg.runBounded ?? pkg.processBounded ?? pkg.boundedTurn;
    if (typeof runBounded !== 'function') {
      return { success: false, error: 'Local engine runBounded not found' };
    }
    const data = await runBounded(request);
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Local engine returned invalid response' };
    }
    return { success: true, data: data as OmnivyraBoundedResponse };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}
