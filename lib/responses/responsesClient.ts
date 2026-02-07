/**
 * Responses API Client
 * Central adapter for OpenAI Responses API
 * 
 * This adapter provides a unified interface for calling the Responses API,
 * handling both streaming and non-streaming responses.
 */

// Use global fetch (available in Next.js/Node.js 18+)
import { createHash } from 'crypto';
import { USE_RESPONSES_API, validateResponsesAPIEnv } from './feature-flag';
import type { TenantConfig } from '@/lib/tenant/types';
import { getTenantConfig } from '@/lib/tenant/registry';
import { resolveApiKeyAliasCached } from '@/lib/tenant/secrets';
import { checkRateLimit, RateLimitError } from '@/lib/middleware/rate-limit';
import { fetchWithTimeout, RequestTimeoutError } from '@/lib/utils/fetchWithTimeout';

// Responses API endpoint - use /responses (plural) - confirmed working
// Auto-fix if user set /response (singular) by mistake
let RESPONSES_BASE = process.env.RESPONSES_API_URL || 
                     process.env.OPENAI_RESPONSES_BASE_URL || 
                     "https://api.openai.com/v1/responses";

// Auto-correct common mistakes
if (RESPONSES_BASE.endsWith('/response') && !RESPONSES_BASE.endsWith('/responses')) {
  console.warn(`⚠️ Correcting endpoint: ${RESPONSES_BASE} → ${RESPONSES_BASE + 's'}`);
  RESPONSES_BASE = RESPONSES_BASE + 's';
}
const RESPONSES_KEY = process.env.RESPONSES_API_KEY || process.env.OPENAI_RESPONSES_KEY || process.env.OPENAI_API_KEY;

export type ResponsesRequest = {
  model: string;
  input?: string | Array<{ role?: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  metadata?: Record<string, any>;
  stream?: boolean;
};

export interface ResponsesResponse {
  id: string;
  model: string;
  output?: string | Array<{ role?: string; content: string }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  metadata?: Record<string, any>;
  _prompt_hash?: string | null;
  _response_hash?: string | null;
  _fetched_at?: string;
}

/**
 * Test if Responses API endpoint is available
 * Returns true if endpoint exists, false otherwise
 */
export async function testResponsesAPIEndpoint(): Promise<{ available: boolean; error?: string; details?: any }> {
  if (!RESPONSES_KEY) {
    return {
      available: false,
      error: 'No API key configured'
    };
  }

  try {
    // Try a minimal test request
    let testRes;
    try {
      testRes = await fetchWithTimeout(RESPONSES_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESPONSES_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          input: [{ role: "user", content: "test" }],
          max_tokens: 10
        }),
      }, { timeoutMs: 2500, retries: 1 });
    } catch (err) {
      if (err instanceof RequestTimeoutError) {
        return { available: false, error: 'Request timed out', details: { timeoutMs: err.timeoutMs } };
      }
      // bubble up
      throw err;
    }

    const responseText = await testRes.text();
    
    if (testRes.status === 404) {
      return {
        available: false,
        error: 'Endpoint not found (404)',
        details: {
          status: testRes.status,
          url: RESPONSES_BASE,
          response: responseText.substring(0, 200),
          possibleReasons: [
            'Responses API may require v1 preview feature flag',
            'Endpoint might not be publicly available yet',
            'API key might not have access to Responses API',
            'Incorrect endpoint URL'
          ]
        }
      };
    }

    if (testRes.status === 401 || testRes.status === 403) {
      return {
        available: false,
        error: `Authentication failed (${testRes.status})`,
        details: {
          status: testRes.status,
          response: responseText.substring(0, 200)
        }
      };
    }

    if (!testRes.ok) {
      return {
        available: false,
        error: `API error (${testRes.status})`,
        details: {
          status: testRes.status,
          response: responseText.substring(0, 200)
        }
      };
    }

    // If we get here, the endpoint exists and responded
    try {
      const json = JSON.parse(responseText);
      return {
        available: true,
        details: {
          status: testRes.status,
          hasResponse: !!json
        }
      };
    } catch {
      return {
        available: true,
        details: {
          status: testRes.status,
          responseType: 'non-json'
        }
      };
    }
  } catch (error: any) {
    return {
      available: false,
      error: error.message || 'Unknown error',
      details: {
        errorType: error.constructor.name
      }
    };
  }
}

// Note: resolveApiKeyAlias is now imported from lib/tenant/secrets

/**
 * Create a non-streaming response using the Responses API
 * Automatically falls back to ChatCompletion if Responses API is unavailable (404)
 * 
 * @param req - Responses API request
 * @param tenantId - Optional tenant ID for tenant-specific configuration
 */
export async function createResponse(
  req: ResponsesRequest,
  tenantId?: string
): Promise<ResponsesResponse> {
  if (!USE_RESPONSES_API) {
    throw new Error("Responses API is disabled via USE_RESPONSES_API feature flag");
  }
  
  validateResponsesAPIEnv();
  
  // Resolve API key from tenant config or fallback to global
  let apiKey = RESPONSES_KEY;
  let model = req.model;
  let temperature = req.temperature;
  let tenantConfig = null;
  
  if (tenantId) {
    tenantConfig = await getTenantConfig(tenantId);
    
    // Resolve API key from tenant config
    if (tenantConfig.ai?.keyAlias) {
      const tenantKey = await resolveApiKeyAliasCached(tenantConfig.ai.keyAlias);
      if (tenantKey) {
        apiKey = tenantKey;
      }
    }
    
    // Use tenant-specific model/temperature if provided
    if (tenantConfig.ai?.model) {
      model = tenantConfig.ai.model;
    }
    if (tenantConfig.ai?.temperature !== undefined) {
      temperature = tenantConfig.ai.temperature;
    }
    
    // Check rate limit before making API call
    const providerName = 'openai'; // Could be dynamic based on model
    const rateLimitKey = `tenant:${tenantId}:provider:${providerName}`;
    const capacity = tenantConfig?.ai?.requestsPerMinute || 60;
    const refillPerSec = capacity / 60; // Refill at rate of capacity per minute
    
    try {
      checkRateLimit(rateLimitKey, capacity, refillPerSec);
    } catch (rateLimitErr) {
      if (rateLimitErr instanceof RateLimitError) {
        console.warn(`⚠️ Rate limit exceeded for ${rateLimitKey}`);
        throw new Error(`RATE_LIMIT_EXCEEDED: ${rateLimitErr.retryAfter ? `Retry after ${rateLimitErr.retryAfter}s` : 'Too many requests'}`);
      }
      throw rateLimitErr;
    }
  }
  
  if (!apiKey) {
    throw new Error("RESPONSES_API_KEY or OPENAI_RESPONSES_KEY environment variable is not set");
  }

  // Log request details for debugging
  console.log('📡 [Responses API] Request:', {
    endpoint: RESPONSES_BASE,
    model: req.model,
    inputType: typeof req.input === 'string' ? 'string' : Array.isArray(req.input) ? `array[${req.input.length}]` : 'undefined',
    hasKey: !!RESPONSES_KEY,
    keyPrefix: RESPONSES_KEY?.substring(0, 7) + '...'
  });

  // Build request body - Responses API format (does NOT accept max_tokens)
  // Use max_output_tokens instead if token limit is needed
  const requestBody: any = {
    model: model || req.model,
    input: req.input,
  };

  // Add optional parameters if provided (use tenant-specific values if set)
  if (temperature !== undefined) {
    requestBody.temperature = temperature;
  } else if (req.temperature !== undefined) {
    requestBody.temperature = req.temperature;
  }
  
  // Responses API uses max_output_tokens instead of max_tokens
  if (req.max_tokens !== undefined) {
    requestBody.max_output_tokens = req.max_tokens;
  }
  
  if (req.metadata) {
    requestBody.metadata = req.metadata;
  }

  let res;
  try {
    res = await fetchWithTimeout(RESPONSES_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // Add OpenAI-Organization header if set
        ...(process.env.OPENAI_ORGANIZATION ? { "OpenAI-Organization": process.env.OPENAI_ORGANIZATION } : {}),
      },
      body: JSON.stringify(requestBody),
    }, { timeoutMs: 12000, retries: 1, backoffBaseMs: 500 });
  } catch (err) {
    if (err instanceof RequestTimeoutError) {
      // Treat as expected transient - upstream will catch and show friendly message
      // Option: throw a normalized error to be caught by route / pipeline
      throw new Error('Request timed out. The server is taking longer than expected. Please try again in a moment.');
    }
    // Not a timeout - rethrow for existing error handling
    throw err;
  }

  const responseText = await res.text();

  // Handle HTTP errors
  if (!res.ok) {
    // Handle 404 - Responses API endpoint doesn't exist yet
    if (res.status === 404) {
      console.error(`❌ Responses API endpoint not found (404): ${RESPONSES_BASE}`);
      console.error(`Response: ${responseText.substring(0, 500)}`);
      
      // Run diagnostic test
      const diagnostic = await testResponsesAPIEndpoint();
      if (diagnostic.details) {
        console.error('🔍 Diagnostic details:', JSON.stringify(diagnostic.details, null, 2));
      }
      
      // Throw a special error that can be caught and handled by callers
      const error: any = new Error('Responses API endpoint not available (404)');
      error.statusCode = 404;
      error.shouldFallback = true;
      error.diagnostic = diagnostic;
      throw error;
    }

    // Handle authentication errors
    if (res.status === 401 || res.status === 403) {
      console.error(`❌ Responses API authentication failed (${res.status})`);
      console.error(`Response: ${responseText.substring(0, 500)}`);
      throw new Error(`Responses API authentication failed: ${res.status} ${responseText.substring(0, 200)}`);
    }

    // Handle other errors
    console.error(`❌ Responses API error (${res.status}): ${responseText.substring(0, 500)}`);
    throw new Error(`Responses API error: ${res.status} ${responseText.substring(0, 200)}`);
  }

  // Parse successful response
  let json: any;
  try {
    json = JSON.parse(responseText);
  } catch (parseError: any) {
    console.error('❌ Failed to parse Responses API response:', parseError);
    throw new Error(`Invalid JSON response from Responses API: ${parseError.message}`);
  }

  // Compute prompt hash from the input used
  try {
    const inputPayload = requestBody.input ?? requestBody;
    const promptHash = createHash('sha256').update(JSON.stringify(inputPayload)).digest('hex');
    json._prompt_hash = promptHash;
  } catch (e) {
    // best-effort; do not break main flow
    json._prompt_hash = null;
  }

  // Compute response hash from raw response body
  try {
    const responseHash = createHash('sha256').update(responseText).digest('hex');
    json._response_hash = responseHash;
  } catch (e) {
    json._response_hash = null;
  }

  // Attach a timestamp
  json._fetched_at = new Date().toISOString();

  console.log('✅ [Responses API] Success:', {
    id: json.id,
    model: json.model,
    hasOutput: !!json.output,
    hasPromptHash: !!json._prompt_hash,
    hasResponseHash: !!json._response_hash
  });

  return json;
}

/**
 * Stream a response using the Responses API
 */
export async function streamResponse(
  req: ResponsesRequest,
  onDelta: (delta: string) => void
): Promise<void> {
  if (!USE_RESPONSES_API) {
    throw new Error("Responses API is disabled via USE_RESPONSES_API feature flag");
  }
  
  validateResponsesAPIEnv();
  
  if (!RESPONSES_KEY) {
    throw new Error("RESPONSES_API_KEY or OPENAI_RESPONSES_KEY environment variable is not set");
  }

  const res = await fetch(`${RESPONSES_BASE}?stream=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESPONSES_KEY}`,
      ...(process.env.OPENAI_ORGANIZATION ? { "OpenAI-Organization": process.env.OPENAI_ORGANIZATION } : {}),
    },
    body: JSON.stringify({
      model: req.model,
      input: req.input,
      temperature: req.temperature,
      ...(req.max_tokens !== undefined ? { max_output_tokens: req.max_tokens } : {}),
      ...(req.metadata ? { metadata: req.metadata } : {}),
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text();
    throw new Error(`Responses API stream error: ${res.status} ${text}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let done = false;

  while (!done) {
    const { value, done: d } = await reader.read();
    done = d;

    if (value) {
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          // Handle SSE format: "data: {...}"
          const jsonLine = line.startsWith("data: ") ? line.slice(6) : line;
          
          // Skip "data: [DONE]" marker
          if (jsonLine === "[DONE]") continue;

          const parsed = JSON.parse(jsonLine);
          
          // Extract delta from various possible response shapes
          if (parsed.delta) {
            onDelta(parsed.delta);
          } else if (parsed.output) {
            if (typeof parsed.output === "string") {
              onDelta(parsed.output);
            } else if (Array.isArray(parsed.output)) {
              // Handle array of message objects
              const content = parsed.output
                .map((msg: any) => msg.content || "")
                .join("");
              if (content) onDelta(content);
            }
          } else if (parsed.choices?.[0]?.delta?.content) {
            // OpenAI-compatible shape
            onDelta(parsed.choices[0].delta.content);
          } else if (parsed.choices?.[0]?.text) {
            // Alternative OpenAI-compatible shape
            onDelta(parsed.choices[0].text);
          } else {
            // Fallback: send the whole line if we can't parse it
            onDelta(line);
          }
        } catch (e) {
          // If JSON parsing fails, send the raw line
          onDelta(line);
        }
      }
    }
  }
}

/**
 * Normalize Responses API output to a consistent format
 * Responses API returns: { output: [{ content: [{ type: "output_text", text: "..." }] }] }
 */
export function normalizeResponse(response: any): {
  content: string;
  id: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
} {
  let content = "";
  let id = response.id || `resp_${Date.now()}`;
  let usage = response.usage || {};

  // Responses API format: output is array of message objects
  if (Array.isArray(response.output)) {
    for (const msg of response.output) {
      if (msg.type === "message" && Array.isArray(msg.content)) {
        // Extract text from content array
        for (const contentItem of msg.content) {
          if (contentItem.type === "output_text" && contentItem.text) {
            content += contentItem.text;
          } else if (typeof contentItem === "string") {
            content += contentItem;
          } else if (contentItem.text) {
            content += contentItem.text;
          }
        }
      } else if (typeof msg === "string") {
        content += msg;
      } else if (msg.content) {
        content += typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
      }
    }
  } else if (typeof response.output === "string") {
    content = response.output;
  } else if (response.choices?.[0]?.message?.content) {
    // OpenAI chat completions shape (fallback)
    content = response.choices[0].message.content;
    id = response.id || id;
    usage = response.usage || usage;
  } else if (response.choices?.[0]?.text) {
    // Alternative OpenAI shape (fallback)
    content = response.choices[0].text;
    id = response.id || id;
    usage = response.usage || usage;
  } else if (typeof response === "string") {
    content = response;
  }

  // Map Responses API usage format to standard format
  const inputTokens = usage.input_tokens || usage.prompt_tokens || 0;
  const outputTokens = usage.output_tokens || usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || (inputTokens + outputTokens);

  return {
    content: content || "",
    id,
    usage: {
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
      total_tokens: totalTokens,
    },
  };
}
