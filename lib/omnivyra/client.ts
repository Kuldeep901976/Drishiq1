/**
 * Omnivyra API Client
 * Handles all communication between Drishiq and Omnivyra middleware
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  OmnivyraRequest,
  OmnivyraResponse,
  OmnivyraBoundedResponse,
  OmnivyraOpenSolutionResponse,
  OmnivyraClientConfig,
  OmnivyraHeaders,
  OmnivyraResult,
  OmnivyraErrorType,
  OmnivyraConversationEntry,
  OmnivyraUserProfile,
} from './types';

// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_CONFIG: OmnivyraClientConfig = {
  baseUrl: process.env.OMNIVYRA_BASE_URL || 'https://api.omnivyra.com',
  apiKey: process.env.OMNIVYRA_API_KEY,
  timeoutMs: parseInt(process.env.OMNIVYRA_TIMEOUT_MS || '25000', 10),
  companyId: process.env.OMNIVYRA_COMPANY_ID || null,
};

const CLIENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Categorize HTTP error into OmnivyraErrorType
 */
function categorizeError(status: number | undefined, error: any): OmnivyraErrorType {
  if (!status) {
    if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
      return 'timeout';
    }
    return 'network_error';
  }
  
  if (status === 400 || status === 422) return 'validation_error';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server_error';
  
  return 'unknown';
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(type: OmnivyraErrorType, originalMessage?: string): string {
  switch (type) {
    case 'validation_error':
      return originalMessage || 'Invalid request. Please check your input.';
    case 'rate_limited':
      return 'Service is busy. Please try again in a moment.';
    case 'server_error':
      return 'Service temporarily unavailable. Please try again later.';
    case 'timeout':
      return 'Request timed out. Please try again.';
    case 'network_error':
      return 'Network error. Please check your connection.';
    default:
      return originalMessage || 'An unexpected error occurred.';
  }
}

/**
 * Determine if error is retryable
 */
function isRetryable(type: OmnivyraErrorType): boolean {
  return type === 'timeout' || type === 'network_error' || type === 'server_error';
}

// ============================================
// OMNIVYRA CLIENT CLASS
// ============================================

export class OmnivyraClient {
  private config: OmnivyraClientConfig;

  constructor(config?: Partial<OmnivyraClientConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Build request headers
   */
  private buildHeaders(
    userId: string,
    sessionId: string,
    requestId: string,
    companyId?: string | null
  ): OmnivyraHeaders {
    const headers: OmnivyraHeaders = {
      'Content-Type': 'application/json',
      'X-Company-ID': companyId || this.config.companyId || '',
      'X-User-ID': userId,
      'X-Session-ID': sessionId,
      'X-Request-ID': requestId,
      'X-Client-Version': CLIENT_VERSION,
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  /**
   * Make API request to Omnivyra
   */
  private async makeRequest<T extends OmnivyraResponse>(
    endpoint: string,
    request: OmnivyraRequest,
    requestId: string
  ): Promise<OmnivyraResult<T>> {
    const startTime = Date.now();
    const url = `${this.config.baseUrl}${endpoint}`;

    console.log(`📤 [Omnivyra] Calling ${endpoint}`, {
      requestId,
      sessionId: request.session_id,
      userId: request.user_id,
    });

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.buildHeaders(
          request.user_id,
          request.session_id,
          requestId,
          request.company_id
        ),
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const durationMs = Date.now() - startTime;

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorBody = await response.json();
          errorMessage = errorBody.message || errorBody.error || errorMessage;
        } catch {
          // Ignore JSON parse errors
        }

        const errorType = categorizeError(response.status, null);
        
        console.error(`❌ [Omnivyra] Error from ${endpoint}`, {
          requestId,
          status: response.status,
          errorType,
          durationMs,
        });

        return {
          success: false,
          error: {
            type: errorType,
            message: getErrorMessage(errorType, errorMessage),
            statusCode: response.status,
            retryable: isRetryable(errorType),
          },
          requestId,
          durationMs,
        };
      }

      // Parse successful response
      const data = await response.json() as T;

      console.log(`✅ [Omnivyra] Success from ${endpoint}`, {
        requestId,
        sessionId: data.session_id,
        confidenceScore: data.confidence_score,
        exit: data.exit,
        durationMs,
      });

      return {
        success: true,
        data,
        requestId,
        durationMs,
      };

    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      const errorType = categorizeError(undefined, error);

      console.error(`❌ [Omnivyra] Request failed for ${endpoint}`, {
        requestId,
        error: error.message,
        errorType,
        durationMs,
      });

      return {
        success: false,
        error: {
          type: errorType,
          message: getErrorMessage(errorType, error.message),
          retryable: isRetryable(errorType),
        },
        requestId,
        durationMs,
      };
    }
  }

  /**
   * Call bounded endpoint (home page chat)
   * Used for 6-9 rounds of clarification before solutions
   */
  async callBounded(request: OmnivyraRequest): Promise<OmnivyraResult<OmnivyraBoundedResponse>> {
    const requestId = uuidv4();
    return this.makeRequest<OmnivyraBoundedResponse>(
      '/api/uda/bounded',
      { ...request, mode: 'bounded' },
      requestId
    );
  }

  /**
   * Call open-solution endpoint (main chat)
   * Provides alignment first, then solutions when confidence threshold is met
   */
  async callOpenSolution(request: OmnivyraRequest): Promise<OmnivyraResult<OmnivyraOpenSolutionResponse>> {
    const requestId = uuidv4();
    return this.makeRequest<OmnivyraOpenSolutionResponse>(
      '/api/uda/open-solution',
      { ...request, mode: 'open_solution' },
      requestId
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create Omnivyra client with default configuration
 */
export function createOmnivyraClient(config?: Partial<OmnivyraClientConfig>): OmnivyraClient {
  return new OmnivyraClient(config);
}

/**
 * Convert Drishiq user profile to Omnivyra format
 */
export function toOmnivyraUserProfile(profile: any): OmnivyraUserProfile | undefined {
  if (!profile || Object.keys(profile).length === 0) {
    return undefined;
  }

  return {
    age: profile.age ? parseInt(profile.age, 10) : undefined,
    gender: profile.gender,
    location: [profile.city, profile.country].filter(Boolean).join(', ') || undefined,
    role: profile.role || profile.user_type,
  };
}

/**
 * Convert Drishiq messages to Omnivyra conversation history format
 */
export function toOmnivyraConversationHistory(
  messages: Array<{ role: string; content: string; created_at?: string; createdAt?: string | Date }>
): OmnivyraConversationEntry[] {
  return messages
    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    .map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      ts: (msg.created_at || msg.createdAt || new Date()).toString(),
    }));
}

/**
 * Build Omnivyra request from Drishiq context
 */
export function buildOmnivyraRequest(params: {
  sessionId: string;
  userId: string;
  companyId?: string | null;
  message: string;
  userProfile?: any;
  language?: string;
  conversationHistory?: Array<{ role: string; content: string; created_at?: string; createdAt?: string | Date }>;
}): OmnivyraRequest {
  const {
    sessionId,
    userId,
    companyId,
    message,
    userProfile,
    language,
    conversationHistory,
  } = params;

  const request: OmnivyraRequest = {
    session_id: sessionId,
    user_id: userId,
    company_id: companyId || null,
    domain: 'generic',
    problem_text: message,
  };

  // Add optional fields if present
  if (userProfile) {
    request.user_profile = toOmnivyraUserProfile(userProfile);
  }

  if (language) {
    request.language = language;
  }

  // Only include history if explicitly provided
  if (conversationHistory && conversationHistory.length > 0) {
    request.conversation_history = toOmnivyraConversationHistory(conversationHistory);
  }

  // Add metadata
  request.metadata = {
    channel: 'web',
  };

  // Add timezone
  request.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  return request;
}

/**
 * Format Omnivyra response for display to user
 */
export function formatOmnivyraResponseForUser(response: OmnivyraResponse): {
  message: string;
  questions?: string[];
  solutions?: Array<{ option: number; description: string }>;
  nextStep?: string;
  isComplete: boolean;
} {
  let message = response.alignment_statement || '';
  
  // Add problem understood if different from alignment
  if (response.problem_understood && response.problem_understood !== response.alignment_statement) {
    message += '\n\n' + response.problem_understood;
  }

  // Format questions if present
  const questions = response.questions?.length > 0 ? response.questions : undefined;

  // Format solutions if present
  const solutions = response.solutions?.length > 0 ? response.solutions : undefined;

  // Add next step
  const nextStep = response.next_step || undefined;

  return {
    message: message.trim(),
    questions,
    solutions,
    nextStep,
    isComplete: response.exit,
  };
}

// ============================================
// SINGLETON EXPORT
// ============================================

// Default client instance
let defaultClient: OmnivyraClient | null = null;

export function getOmnivyraClient(): OmnivyraClient {
  if (!defaultClient) {
    defaultClient = createOmnivyraClient();
  }
  return defaultClient;
}

export default OmnivyraClient;
