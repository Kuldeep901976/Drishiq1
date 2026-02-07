/**
 * Tenant-Aware AI Client
 * Factory for creating tenant-specific Responses API clients
 * Resolves API keys via secret manager aliases and applies tenant config
 * 
 * This is the canonical entry point for all tenant-aware AI calls.
 * Replaces direct usage of process.env.OPENAI_API_KEY or global Responses API client.
 */

import type { TenantConfig } from '@/lib/tenant/types';
import { createResponse, normalizeResponse, type ResponsesRequest, type ResponsesResponse } from '@/lib/responses/responsesClient';
import { getTenantConfig } from '@/lib/tenant/registry';
import { resolveApiKeyAliasCached } from '@/lib/tenant/secrets';
import { resolveModelForStage } from '@/lib/ddsa/model-config';

/**
 * Resolve API key from tenant config or fallback to global
 * TODO: Integrate with secret manager to resolve keyAlias
 * For now, falls back to environment variables
 */
async function resolveApiKey(keyAlias?: string): Promise<string> {
  if (keyAlias) {
    const secret = await resolveApiKeyAliasCached(keyAlias);
    if (secret) {
      return secret;
    }
    // Fall through to global key if alias resolution fails
  }
  
  // Fallback to environment variables
  const globalKey = process.env.RESPONSES_API_KEY || 
                    process.env.OPENAI_RESPONSES_KEY || 
                    process.env.OPENAI_API_KEY;
  
  if (!globalKey) {
    throw new Error('No API key available: OPENAI_API_KEY or OPENAI_RESPONSES_KEY must be set');
  }
  
  return globalKey;
}

/**
 * Create tenant-aware Responses API client factory
 * Returns a client that respects tenant-specific AI settings
 */
export function createTenantResponsesClient(tenantConfig?: TenantConfig) {
  return {
    /**
     * Respond with tenant-aware configuration
     */
    async respond(opts: {
      threadId?: string;
      systemBrief?: string;
      userText: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stageId?: string; // Added for stage-specific model resolution
    }): Promise<{ content: string; responseId?: string | null; promptHash?: string | null; responseHash?: string | null; raw?: any }> {
      // Resolve model: stage-specific > request override > tenant default > global default
      let model = opts.model;
      if (!model && opts.stageId) {
        model = await resolveModelForStage(opts.stageId, tenantConfig?.id);
      }
      if (!model) {
        model = tenantConfig?.ai?.model ?? 'gpt-4-turbo';
      }
      const temperature = typeof opts.temperature === 'number' 
        ? opts.temperature 
        : tenantConfig?.ai?.temperature ?? 0.7;
      const maxTokens = opts.maxTokens ?? tenantConfig?.ai?.maxTokens ?? 2000;
      
      // Build input array
      const input: Array<{ role: string; content: string }> = [];
      
      if (opts.systemBrief) {
        input.push({ role: 'system', content: opts.systemBrief });
      }
      
      input.push({ role: 'user', content: opts.userText });
      
      // Create request
      const responsesRequest: ResponsesRequest = {
        model,
        input,
        temperature,
        max_tokens: maxTokens,
        metadata: {
          tenant_id: tenantConfig?.id,
          thread_id: opts.threadId,
          source: 'tenant-aware-client'
        }
      };
      
      // Resolve API key
      const apiKey = await resolveApiKey(tenantConfig?.ai?.keyAlias);
      
      // Call Responses API with tenant-specific key
      // Pass tenantId to createResponse so key routing works end-to-end
      const response = await createResponse(responsesRequest, tenantConfig?.id);
      const normalized = normalizeResponse(response);
      
      return {
        content: normalized.content,
        responseId: normalized.id ?? response?.id ?? null,
        promptHash: response?._prompt_hash ?? null,
        responseHash: response?._response_hash ?? null,
        raw: response
      };
    }
  };
}

/**
 * Create tenant-aware Responses API request (legacy function - use createTenantResponsesClient)
 * @deprecated Use createTenantResponsesClient().respond() instead
 */
export async function respondWithTenantConfig(
  tenantConfig: TenantConfig,
  request: {
    threadId?: string;
    systemBrief?: string;
    userText: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const client = createTenantResponsesClient(tenantConfig);
  const result = await client.respond(request);
  return result.content; // Return only content for backward compatibility
}

/**
 * Legacy implementation (kept for backward compatibility)
 */
async function _legacyRespondWithTenantConfig(
  tenantConfig: TenantConfig,
  request: {
    systemBrief?: string;
    userText: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  // Use tenant config defaults or request overrides
  const model = request.model || tenantConfig.ai?.model || 'gpt-4-turbo';
  const temperature = request.temperature ?? tenantConfig.ai?.temperature ?? 0.7;
  const maxTokens = request.maxTokens ?? tenantConfig.ai?.maxTokens ?? 2000;

  // Build input array
  const input: Array<{ role: string; content: string }> = [];
  
  if (request.systemBrief) {
    input.push({ role: 'system', content: request.systemBrief });
  }
  
  input.push({ role: 'user', content: request.userText });

  // Create request
  const responsesRequest: ResponsesRequest = {
    model,
    input,
    temperature,
    max_tokens: maxTokens,
    metadata: {
      tenant_id: tenantConfig.id,
      source: 'tenant-aware-client'
    }
  };

  // Call Responses API
  // Note: createResponse uses global RESPONSES_KEY, but we should ideally pass tenant key
  // For now, we'll use the global client but with tenant-specific config
  // TODO: Enhance responsesClient to accept per-request API key
  const response = await createResponse(responsesRequest);
  const normalized = normalizeResponse(response);
  
  return normalized.content;
}

/**
 * Get tenant-specific model configuration
 */
export function getTenantModelConfig(tenantConfig: TenantConfig): {
  model: string;
  temperature: number;
  maxTokens: number;
} {
  return {
    model: tenantConfig.ai?.model || 'gpt-4-turbo',
    temperature: tenantConfig.ai?.temperature ?? 0.7,
    maxTokens: tenantConfig.ai?.maxTokens ?? 2000,
  };
}

