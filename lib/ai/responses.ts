/**
 * AI Responses
 * Utilities for handling AI response formatting and processing
 */

export interface AIResponse {
  content: string;
  metadata?: {
    model?: string;
    tokens?: number;
    finishReason?: string;
    [key: string]: any;
  };
}

export interface FormattedResponse {
  text: string;
  structured?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Format AI response content
 */
export function formatAIResponse(response: AIResponse): FormattedResponse {
  return {
    text: response.content || '',
    metadata: response.metadata,
  };
}

/**
 * Extract structured data from response
 */
export function extractStructuredData(response: AIResponse): Record<string, any> | null {
  try {
    // Try to parse JSON from response content
    const content = response.content.trim();
    if (content.startsWith('{') || content.startsWith('[')) {
      return JSON.parse(content);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate response format
 */
export function validateResponse(response: AIResponse): boolean {
  return !!response.content && typeof response.content === 'string';
}
