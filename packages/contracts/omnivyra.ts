/**
 * Omnivyra bounded API contract (shared between Drishiq and omnivyra-main).
 * Used for runBounded(request) → OmnivyraBoundedResponse.
 */

export interface OmnivyraUserProfile {
  age?: number;
  gender?: string;
  location?: string;
  role?: string;
}

export interface OmnivyraConversationEntry {
  role: 'user' | 'assistant';
  content: string;
  ts: string;
}

export interface OmnivyraMetadata {
  channel?: 'web' | 'mobile';
  device?: string;
}

export type OmnivyraDomain = 'proposal' | 'virality' | 'generic' | 'book';
export type OmnivyraMode = 'bounded' | 'open_solution';

export interface OmnivyraRequest {
  session_id: string;
  user_id: string;
  company_id: string | null;
  domain: OmnivyraDomain;
  problem_text: string;
  mode?: OmnivyraMode;
  user_profile?: OmnivyraUserProfile;
  language?: string;
  timezone?: string;
  conversation_history?: OmnivyraConversationEntry[];
  metadata?: OmnivyraMetadata;
}

export interface OmnivyraDiagnostic {
  missing_info?: string;
  opportunities_lost?: string;
  benefits_of_solving_now?: string;
  risks_of_delaying?: string;
  areas_still_unclear?: string;
  readiness_to_move_forward?: string;
}

export interface OmnivyraSolution {
  option: number;
  description: string;
}

export interface OmnivyraPlan {
  [key: string]: unknown;
}

export interface OmnivyraBoundedResponse {
  session_id: string;
  company_id: string | null;
  domain: string;
  mode: 'bounded';
  alignment_statement: string;
  problem_understood: string;
  questions: string[];
  solutions: OmnivyraSolution[];
  plan: OmnivyraPlan;
  next_step: string;
  confidence_score: number;
  exit: boolean;
  exit_reason: string | null;
  diagnostic: OmnivyraDiagnostic;
}
