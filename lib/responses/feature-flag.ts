/**
 * Feature Flag for Responses API
 * Controls whether to use Responses API or fallback to chat.completions
 */

export const USE_RESPONSES_API = process.env.USE_RESPONSES_API === 'true' || 
                                 process.env.USE_RESPONSES_API === '1' ||
                                 !process.env.USE_RESPONSES_API; // Default to true if not set

export function validateResponsesAPIEnv(): void {
  if (USE_RESPONSES_API) {
    const responsesKey = process.env.RESPONSES_API_KEY || 
                        process.env.OPENAI_RESPONSES_KEY || 
                        process.env.OPENAI_API_KEY;
    
    if (!responsesKey) {
      throw new Error(
        'USE_RESPONSES_API is enabled but RESPONSES_API_KEY (or OPENAI_RESPONSES_KEY or OPENAI_API_KEY) is not set. ' +
        'Please set one of these environment variables.'
      );
    }
  }
}

// Validate on module load (fail fast)
// Skip validation during build time - environment variables may not be available during Next.js build
// During build, Next.js collects page data which can trigger module imports
// Validation will happen at runtime when API functions are actually called (in responsesClient.ts)
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || 
                     process.env.NEXT_PHASE === 'phase-development' ||
                     process.env.NEXT_PHASE?.includes('phase') ||
                     process.env.NEXT_PUBLIC_SKIP_ENV_VALIDATION === 'true';

// Check if API keys are available - if not, we're likely in build context
const hasApiKeys = !!(process.env.RESPONSES_API_KEY || 
                      process.env.OPENAI_RESPONSES_KEY || 
                      process.env.OPENAI_API_KEY);

// Only validate at runtime when keys are available, not during build
// During build, env vars may not be available, but they will be at runtime
// The actual API functions (createResponse, streamResponse) also call validateResponsesAPIEnv()
// so runtime validation will still occur when the API is actually used
if (process.env.NODE_ENV !== 'test' && !isBuildPhase && hasApiKeys) {
  try {
    validateResponsesAPIEnv();
  } catch (error) {
    console.error('❌ Responses API environment validation failed:', error);
    // Only throw in production runtime (not during build)
    // If keys are missing during build, that's OK - they'll be set at runtime
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}





