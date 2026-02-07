/**
 * Audit logging module
 * Provides audit logging functionality for DDSA operations
 * Now includes PII redaction based on tenant privacy settings and database persistence
 */

import { redactPIIFromObject } from '@/lib/utils/log-redaction';
import { getTenantConfig } from '@/lib/tenant/registry';
import { insertAuditLog } from '@/lib/db/auditLogs';

interface AuditData {
  [key: string]: any;
}

/**
 * Log an audit event
 * @param event - Event name
 * @param data - Audit data (will be redacted if tenant requires)
 * @param tenantId - Optional tenant ID for privacy-aware redaction
 */
async function log(event: string, data: AuditData = {}, tenantId?: string): Promise<void> {
  try {
    // Get tenant config for privacy settings
    const tenantConfig = tenantId ? await getTenantConfig(tenantId) : null;
    
    // Redact PII if tenant requires it
    const redactedData = redactPIIFromObject(data, tenantConfig);
    
    // Log to console (for immediate visibility)
    console.log(`[AUDIT] ${event}:`, JSON.stringify(redactedData, null, 2));
    
    // Persist to database (best-effort, non-blocking)
    try {
      await insertAuditLog({
        event,
        tenantId: tenantId || null,
        userId: data.userId || data.user_id || null,
        threadId: data.threadId || data.thread_id || null,
        stageId: data.stageId || data.stage_id || null,
        promptHash: data.prompt_hash || data.promptHash || null,
        responseHash: data.response_hash || data.responseHash || null,
        costTokens: data.cost_tokens || data.costTokens || data.total_tokens || data.totalTokens || null,
        latencyMs: data.latency_ms || data.latencyMs || null,
        data: redactedData
      });
    } catch (dbError) {
      // Non-blocking: log error but don't fail the operation
      console.warn(`[AUDIT] Failed to persist ${event} to database:`, dbError);
    }
  } catch (error) {
    console.error(`[AUDIT] Failed to log event ${event}:`, error);
  }
}

export default {
  log
};






