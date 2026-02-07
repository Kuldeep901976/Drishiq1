/**
 * Omnivyra Integration Types
 * Types for Drishiq ↔ Omnivyra API communication
 */

// ============================================
// REQUEST TYPES
// ============================================

/**
 * User profile information sent to Omnivyra
 */
export interface OmnivyraUserProfile {
  age?: number;
  gender?: string;
  location?: string;
  role?: string;
}

/**
 * Conversation history entry
 */
export interface OmnivyraConversationEntry {
  role: 'user' | 'assistant';
  content: string;
  ts: string; // ISO-8601 timestamp
}

/**
 * CHIE (Case Handling Information Exchange) data
 */
export interface OmnivyraCHIE {
  case_id?: string;
  case_type?: string;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Request metadata
 */
export interface OmnivyraMetadata {
  channel?: 'web' | 'mobile';
  device?: string;
}

/**
 * Domain types supported by Omnivyra
 */
export type OmnivyraDomain = 'proposal' | 'virality' | 'generic' | 'book';

/**
 * Mode types
 */
export type OmnivyraMode = 'bounded' | 'open_solution';

/**
 * Base request fields (required)
 */
export interface OmnivyraBaseRequest {
  session_id: string;
  user_id: string;
  company_id: string | null;
  domain: OmnivyraDomain;
  problem_text: string;
}

/**
 * Extended request with optional fields
 */
export interface OmnivyraRequest extends OmnivyraBaseRequest {
  mode?: OmnivyraMode;
  user_profile?: OmnivyraUserProfile;
  language?: string;
  timezone?: string;
  conversation_history?: OmnivyraConversationEntry[];
  chie?: OmnivyraCHIE;
  metadata?: OmnivyraMetadata;
}

// ============================================
// RESPONSE TYPES
// ============================================

/**
 * Diagnostic information (bounded mode)
 */
export interface OmnivyraDiagnostic {
  missing_info?: string;
  opportunities_lost?: string;
  benefits_of_solving_now?: string;
  risks_of_delaying?: string;
  areas_still_unclear?: string;
  readiness_to_move_forward?: string;
}

/**
 * Solution option (open_solution mode)
 */
export interface OmnivyraSolution {
  option: number;
  description: string;
}

/**
 * Plan structure
 */
export interface OmnivyraPlan {
  [key: string]: any;
}

/**
 * Base response fields (common to both modes)
 */
export interface OmnivyraBaseResponse {
  session_id: string;
  company_id: string | null;
  domain: string;
  mode: OmnivyraMode;
  alignment_statement: string;
  problem_understood: string;
  questions: string[];
  solutions: OmnivyraSolution[];
  plan: OmnivyraPlan;
  next_step: string;
  confidence_score: number;
  exit: boolean;
  exit_reason: string | null;
}

/**
 * Bounded mode response (home page chat)
 */
export interface OmnivyraBoundedResponse extends OmnivyraBaseResponse {
  mode: 'bounded';
  diagnostic: OmnivyraDiagnostic;
}

/**
 * Open solution mode response (main chat)
 */
export interface OmnivyraOpenSolutionResponse extends OmnivyraBaseResponse {
  mode: 'open_solution';
  constraints: string[];
  risks: string[];
  recommendation: string;
  limitations: string;
}

/**
 * Union type for all responses
 */
export type OmnivyraResponse = OmnivyraBoundedResponse | OmnivyraOpenSolutionResponse;

// ============================================
// ERROR TYPES
// ============================================

/**
 * Omnivyra API error response
 */
export interface OmnivyraErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Error types for handling
 */
export type OmnivyraErrorType = 
  | 'validation_error'    // 400/422
  | 'rate_limited'        // 429
  | 'server_error'        // 500
  | 'timeout'             // Request timeout
  | 'network_error'       // Network issues
  | 'unknown';

// ============================================
// CLIENT TYPES
// ============================================

/**
 * Omnivyra client configuration
 */
export interface OmnivyraClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeoutMs: number;
  companyId?: string | null;
}

/**
 * Request headers for Omnivyra API
 */
export interface OmnivyraHeaders {
  'Authorization'?: string;
  'Content-Type': string;
  'X-Company-ID': string;
  'X-User-ID': string;
  'X-Session-ID': string;
  'X-Request-ID': string;
  'X-Client-Version': string;
}

/**
 * Result wrapper for API calls
 */
export interface OmnivyraResult<T> {
  success: boolean;
  data?: T;
  error?: {
    type: OmnivyraErrorType;
    message: string;
    statusCode?: number;
    retryable: boolean;
  };
  requestId: string;
  durationMs: number;
}
