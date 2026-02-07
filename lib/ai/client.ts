/**
 * AI Client
 * Centralized OpenAI client creation and management
 */

import OpenAI from 'openai';

let clientInstance: OpenAI | null = null;

/**
 * Get or create OpenAI client instance
 */
export function getAIClient(): OpenAI {
  if (!clientInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    const timeout = parseInt(process.env.OPENAI_TIMEOUT || '60000', 10);
    const maxRetries = parseInt(process.env.OPENAI_MAX_RETRIES || '3', 10);

    clientInstance = new OpenAI({
      apiKey,
      timeout,
      maxRetries,
    });
  }

  return clientInstance;
}

/**
 * Create a new OpenAI client with custom configuration
 */
export function createAIClient(config?: {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}): OpenAI {
  const apiKey = config?.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('API key is required');
  }

  return new OpenAI({
    apiKey,
    baseURL: config?.baseURL,
    timeout: config?.timeout || parseInt(process.env.OPENAI_TIMEOUT || '60000', 10),
    maxRetries: config?.maxRetries || parseInt(process.env.OPENAI_MAX_RETRIES || '3', 10),
  });
}

/**
 * Reset client instance (useful for testing or reconfiguration)
 */
export function resetClient(): void {
  clientInstance = null;
}





