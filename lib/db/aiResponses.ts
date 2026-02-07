/**
 * AI Responses Database Adapter
 * Handles insertion of AI response metadata into ai_responses table
 * Uses Postgres with tenant RLS context, falls back to Supabase
 */

import type { PoolClient } from 'pg';
import { withTenantContext } from '@/lib/db/postgres-pool';
import { createServiceClient } from '@/lib/supabase';

export interface InsertAiResponsePayload {
  responseId?: string | null;
  threadId: string;
  tenantId?: string | null;
  stageRef?: string | null;
  model?: string | null;
  requestPayload?: any | null;
  responsePayload?: any | null;
  promptHash?: string | null;
  responseHash?: string | null;
  tokensIn?: number | null;
  tokensOut?: number | null;
  totalTokens?: number | null;
  latencyMs?: number | null;
}

/**
 * Insert an ai_responses row. Best-effort: tries Postgres with tenant RLS, falls back to Supabase.
 * 
 * @param payload - AI response metadata to store
 * @returns Inserted row or null on failure
 * 
 * @example
 * ```typescript
 * const row = await insertAiResponse({
 *   responseId: 'resp_123',
 *   threadId: 'thread-uuid',
 *   tenantId: 'tenant-uuid',
 *   stageRef: 'intent',
 *   model: 'gpt-4-turbo',
 *   promptHash: 'abc...',
 *   responseHash: 'def...',
 *   tokensIn: 100,
 *   tokensOut: 50,
 *   totalTokens: 150
 * });
 * ```
 */
export async function insertAiResponse(
  payload: InsertAiResponsePayload
): Promise<any | null> {
  const {
    responseId,
    threadId,
    tenantId,
    stageRef,
    model,
    requestPayload,
    responsePayload,
    promptHash,
    responseHash,
    tokensIn,
    tokensOut,
    totalTokens,
    latencyMs
  } = payload;

  // Try Postgres with tenant context if tenantId supplied
  if (tenantId) {
    try {
      return await withTenantContext(tenantId, async (client: PoolClient) => {
        const q = `
          INSERT INTO ai_responses
            (response_id, thread_id, tenant_id, stage_ref, model, request_payload, response_payload,
             prompt_hash, response_hash, tokens_in, tokens_out, total_tokens, latency_ms)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *;
        `;
        const params = [
          responseId || null,
          threadId,
          tenantId || null,
          stageRef || null,
          model || null,
          requestPayload ? JSON.stringify(requestPayload) : null,
          responsePayload ? JSON.stringify(responsePayload) : null,
          promptHash || null,
          responseHash || null,
          tokensIn ?? null,
          tokensOut ?? null,
          totalTokens ?? null,
          latencyMs ?? null
        ];
        const r = await client.query(q, params);
        return r.rows[0];
      });
    } catch (pgErr: any) {
      console.warn('⚠️ [aiResponses] Postgres insert failed, falling back to Supabase:', pgErr.message);
      // Fall through to Supabase fallback
    }
  }

  // Fallback to Supabase (best-effort)
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('ai_responses')
      .insert([{
        response_id: responseId || null,
        thread_id: threadId,
        tenant_id: tenantId || null,
        stage_ref: stageRef || null,
        model: model || null,
        request_payload: requestPayload || null,
        response_payload: responsePayload || null,
        prompt_hash: promptHash || null,
        response_hash: responseHash || null,
        tokens_in: tokensIn ?? null,
        tokens_out: tokensOut ?? null,
        total_tokens: totalTokens ?? null,
        latency_ms: latencyMs ?? null
      }])
      .select()
      .single();

    if (error) {
      console.warn('⚠️ [aiResponses] Supabase insert error:', error);
      return null;
    }

    return data;
  } catch (supabaseErr: any) {
    console.error('❌ [aiResponses] All insert methods failed:', supabaseErr);
    return null;
  }
}

/**
 * Get AI responses for a thread (for debugging/analytics)
 * 
 * @param threadId - Thread ID to query
 * @param tenantId - Optional tenant ID for RLS
 * @param limit - Maximum number of results
 * @returns Array of AI response records
 */
export async function getAiResponsesForThread(
  threadId: string,
  tenantId?: string | null,
  limit: number = 100
): Promise<any[]> {
  try {
    const supabase = createServiceClient();
    
    let query = supabase
      .from('ai_responses')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply tenant filter if provided
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('⚠️ [aiResponses] Query error:', error);
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.error('❌ [aiResponses] Query failed:', err);
    return [];
  }
}

