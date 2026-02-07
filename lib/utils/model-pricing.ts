/**
 * Model pricing utilities
 * Calculates costs based on token usage for different AI models
 */

// Pricing per 1M tokens (input/output) in USD
// Based on OpenAI pricing as of 2024
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // GPT-3.5 models
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  'gpt-3.5-turbo-0125': { input: 0.50, output: 1.50 },
  'gpt-3.5-turbo-16k': { input: 3.00, output: 4.00 },
  
  // GPT-4 models
  'gpt-4': { input: 30.00, output: 60.00 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-4-turbo-preview': { input: 10.00, output: 30.00 },
  'gpt-4-0125-preview': { input: 10.00, output: 30.00 },
  'gpt-4-32k': { input: 60.00, output: 120.00 },
  
  // GPT-4o models
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4o-2024-05-13': { input: 2.50, output: 10.00 },
  
  // GPT-5 models (estimated pricing)
  'gpt-5-mini': { input: 0.20, output: 0.80 },
  
  // O1 models
  'o1-preview': { input: 15.00, output: 60.00 },
  'o1-mini': { input: 3.00, output: 12.00 },
  
  // Anthropic Claude models
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  'claude-3-sonnet': { input: 3.00, output: 15.00 },
  'claude-3-opus': { input: 15.00, output: 75.00 },
  'claude-3.5-sonnet': { input: 3.00, output: 15.00 },
  
  // Grok models
  'grok-beta': { input: 0.10, output: 0.10 },
  'llama3-8b-8192': { input: 0.05, output: 0.05 },
  'llama3-70b-8192': { input: 0.20, output: 0.20 },
};

/**
 * Calculate cost for token usage
 * @param tokensIn - Input tokens (prompt)
 * @param tokensOut - Output tokens (completion)
 * @param model - Model name (e.g., 'gpt-4', 'gpt-3.5-turbo')
 * @returns Object with cost_in, cost_out, and total_cost in USD
 */
export function calculateCost(
  tokensIn: number,
  tokensOut: number,
  model: string = 'gpt-3.5-turbo'
): { cost_in: number; cost_out: number; total_cost: number } {
  // Normalize model name (remove version suffixes for matching)
  const normalizedModel = model.toLowerCase().trim();
  
  // Find matching pricing (exact match or prefix match)
  let pricing = MODEL_PRICING[normalizedModel];
  
  if (!pricing) {
    // Try to match by prefix (e.g., 'gpt-4-turbo-*' matches 'gpt-4-turbo')
    for (const [key, value] of Object.entries(MODEL_PRICING)) {
      if (normalizedModel.startsWith(key) || key.startsWith(normalizedModel.split('-').slice(0, 2).join('-'))) {
        pricing = value;
        break;
      }
    }
  }
  
  // Default to gpt-3.5-turbo pricing if model not found
  if (!pricing) {
    console.warn(`Unknown model pricing for "${model}", using gpt-3.5-turbo pricing`);
    pricing = MODEL_PRICING['gpt-3.5-turbo'];
  }
  
  // Calculate costs (pricing is per 1M tokens)
  const cost_in = (tokensIn / 1_000_000) * pricing.input;
  const cost_out = (tokensOut / 1_000_000) * pricing.output;
  const total_cost = cost_in + cost_out;
  
  return {
    cost_in,
    cost_out,
    total_cost
  };
}




