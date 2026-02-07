/**
 * DDSA State Management
 * Safe stub implementation - reversible
 * TODO: Replace with full database-backed implementation
 */

import { createServiceClient } from './supabase';
import { validateDdsState } from './ddsa/state-migrator';
import { DdsaConcurrencyError } from './errors/ddsa-errors';

// In-memory fallback for local dev (non-persistent)
const inMemoryState: Map<string, any> = new Map();

/**
 * Load DDS state for a thread
 * Safe stub: attempts DB read, falls back to in-memory if DB unavailable
 */
export async function loadDdsState(threadId: string): Promise<any | null> {
  try {
    const supabase = createServiceClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('chat_threads')
        .select('metadata')
        .eq('id', threadId)
        .maybeSingle();
      
      if (!error && data?.metadata) {
        return data.metadata.dds_state || null;
      }
    }
  } catch (err) {
    console.warn('⚠️ [DDS-STATE] DB load failed, using in-memory fallback:', err);
  }
  
  // Fallback to in-memory
  return inMemoryState.get(threadId) || null;
}

/**
 * Save DDS state for a thread
 * Safe stub: attempts DB write, falls back to in-memory if DB unavailable
 * @param threadId - Thread ID
 * @param state - State to save
 * @param tenantId - Optional tenant ID for RLS context
 */
export async function saveDdsState(
  threadId: string,
  state: any,
  tenantId?: string
): Promise<void> {
  // Validate state schema
  const validation = validateDdsState(state);
  if (!validation.valid) {
    throw new Error(`Invalid state schema: ${validation.errors.join(', ')}`);
  }
  if (validation.warnings.length > 0) {
    console.warn(`State validation warnings: ${validation.warnings.join(', ')}`);
  }

  // Load current state to determine _version
  const current = await loadDdsState(threadId);
  const currentVersion = (current && typeof current._version === 'number') ? current._version : 0;

  // Ensure schema version and incremented _version
  const stateWithMeta = {
    ...state,
    _schema_version: state._schema_version ?? '1.0.0',
    _version: (state._version && state._version > currentVersion) ? state._version : currentVersion + 1,
    _tenant_id: tenantId ?? state._tenant_id ?? null,
    _updated_at: new Date().toISOString()
  };

  if (tenantId) {
    // Use direct Postgres pool to set session RLS context for this operation
    try {
      const { withTenantContext } = await import('@/lib/db/postgres-pool');
      await withTenantContext(tenantId, async (client) => {
        const res = await client.query(
          `UPDATE chat_threads
           SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{dds_state}', $1::jsonb)
           WHERE id = $2 AND (
             (metadata->'dds_state'->>'_version') IS NULL
             OR (metadata->'dds_state'->>'_version')::int < $3
           )`,
          [JSON.stringify(stateWithMeta), threadId, stateWithMeta._version]
        );

        if (res.rowCount === 0) {
          // Version conflict — throw structured error
          throw new DdsaConcurrencyError(
            'State version conflict - another process updated the state',
            currentVersion,
            stateWithMeta._version
          );
        }
      });
      return;
    } catch (pgError: any) {
      console.warn('⚠️ [DDS-STATE] Direct Postgres failed, falling back to Supabase:', pgError.message);
      // Fall through to Supabase fallback
    }
  }

  // Fallback: update only metadata so visitor_id / temp_user_id / thread_phase are not overwritten
  try {
    const supabase = createServiceClient();
    if (supabase) {
      const { data: row } = await supabase
        .from('chat_threads')
        .select('metadata')
        .eq('id', threadId)
        .maybeSingle();
      const metadata = (row?.metadata as Record<string, unknown>) || {};
      const { error } = await supabase
        .from('chat_threads')
        .update({
          metadata: { ...metadata, dds_state: stateWithMeta },
          updated_at: new Date().toISOString(),
        })
        .eq('id', threadId);
      if (!error) return;
    }
  } catch (err) {
    console.warn('⚠️ [DDS-STATE] DB save failed, using in-memory fallback:', err);
  }
  
  // Fallback to in-memory
  inMemoryState.set(threadId, stateWithMeta);
}

// Default export for compatibility
export default { loadDdsState, saveDdsState };






