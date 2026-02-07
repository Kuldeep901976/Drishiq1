// lib/db/auditLogs.ts
/**
 * Audit logs persistence adapter
 * Writes audit events to audit_logs table for durable, queryable records
 */

import type { PoolClient } from 'pg';
import { getPgClient, withTenantContext } from '@/lib/db/postgres-pool';
import { createServiceClient } from '@/lib/supabase';

export interface AuditLogInsert {
  event: string;
  tenantId?: string | null;
  userId?: string | null;
  threadId?: string | null;
  stageId?: string | null;
  promptHash?: string | null;
  responseHash?: string | null;
  costTokens?: number | null;
  latencyMs?: number | null;
  data?: any | null;
}

/**
 * Insert an audit log entry
 * Uses PostgreSQL with RLS if tenantId is provided, falls back to Supabase
 */
export async function insertAuditLog(payload: AuditLogInsert): Promise<any | null> {
  const {
    event,
    tenantId,
    userId,
    threadId,
    stageId,
    promptHash,
    responseHash,
    costTokens,
    latencyMs,
    data: auditData
  } = payload;

  // Handle onboarding thread IDs (they're TEXT, not UUID)
  // For audit_logs, we'll store them as-is if they're onboarding threads
  // The thread_id column should accept TEXT, but if it's UUID-only, we'll skip thread_id for onboarding
  const isOnboardingThread = threadId?.startsWith('onboarding_');
  const auditThreadId = isOnboardingThread ? null : threadId; // Skip thread_id for onboarding threads if column is UUID-only

  // Handle user_id: if it's "anon" or not a valid UUID, set to null
  // The user_id column expects UUID, so we skip it for anonymous users
  const isValidUUID = (str: string | null | undefined): boolean => {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };
  const auditUserId = (userId && userId !== 'anon' && isValidUUID(userId)) ? userId : null;

  try {
    if (tenantId) {
      // Use PostgreSQL with RLS context
      return await withTenantContext(tenantId, async (client: PoolClient) => {
        const q = `
          INSERT INTO audit_logs (
            event, tenant_id, user_id, thread_id, stage_id,
            prompt_hash, response_hash, cost_tokens, latency_ms, data
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *;
        `;
        const params = [
          event,
          tenantId,
          auditUserId, // Use validated user_id
          auditThreadId || null,
          stageId || null,
          promptHash || null,
          responseHash || null,
          costTokens || null,
          latencyMs || null,
          auditData ? JSON.stringify(auditData) : null
        ];
        const r = await client.query(q, params);
        return r.rows[0];
      });
    } else {
      // Use direct PostgreSQL connection (no RLS)
      const client = await getPgClient();
      try {
        const q = `
          INSERT INTO audit_logs (
            event, tenant_id, user_id, thread_id, stage_id,
            prompt_hash, response_hash, cost_tokens, latency_ms, data
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *;
        `;
        const params = [
          event,
          tenantId || null,
          auditUserId, // Use validated user_id
          auditThreadId || null,
          stageId || null,
          promptHash || null,
          responseHash || null,
          costTokens || null,
          latencyMs || null,
          auditData ? JSON.stringify(auditData) : null
        ];
        const r = await client.query(q, params);
        return r.rows[0];
      } finally {
        client.release();
      }
    }
  } catch (pgErr: any) {
    // Fallback to Supabase
    try {
      const supabase = createServiceClient();
      const { data: result, error } = await supabase
        .from('audit_logs')
          .insert({
            event,
            tenant_id: tenantId || null,
            user_id: auditUserId, // Use validated user_id
            thread_id: auditThreadId || null, // Use auditThreadId (null for onboarding threads)
            stage_id: stageId || null,
            prompt_hash: promptHash || null,
            response_hash: responseHash || null,
            cost_tokens: costTokens || null,
            latency_ms: latencyMs || null,
            data: auditData ? JSON.stringify(auditData) : null
          })
        .select()
        .single();

      if (error) {
        console.warn('⚠️ insertAuditLog supabase fallback error:', error);
        return null;
      }
      return result;
    } catch (supabaseErr) {
      console.error('❌ insertAuditLog fallback failed:', supabaseErr);
      return null;
    }
  }
}

