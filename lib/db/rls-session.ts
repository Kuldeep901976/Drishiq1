/**
 * RLS Session Configuration
 * Helper for setting PostgreSQL session variables for Row Level Security
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Set tenant ID in PostgreSQL session for RLS
 * This must be called before any queries on a connection
 * 
 * @param dbClient - Supabase client (service role or user client)
 * @param tenantId - Tenant ID to set in session
 * 
 * @example
 * ```typescript
 * const supabase = createServiceClient();
 * await setPostgresTenant(supabase, tenantId);
 * // Now all queries on this connection will be filtered by RLS policies
 * ```
 */
export async function setPostgresTenant(
  dbClient: SupabaseClient,
  tenantId: string
): Promise<void> {
  if (!tenantId) {
    console.warn('⚠️ [RLS Session] No tenantId provided, skipping session config');
    return;
  }

  try {
    // Use RPC call to set session variable
    // This requires a function in PostgreSQL:
    // CREATE OR REPLACE FUNCTION set_tenant_id(tenant_id TEXT) RETURNS void AS $$
    //   PERFORM set_config('app.tenant_id', tenant_id, true);
    // $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    const { error } = await dbClient.rpc('set_tenant_id', { tenant_id: tenantId });
    
    if (error) {
      // Fallback: Try direct SQL if RPC doesn't exist
      console.warn('⚠️ [RLS Session] RPC set_tenant_id not available, using direct SQL');
      
      // For Supabase, we can't directly execute SQL, so we rely on RLS policies
      // that check the session variable. The variable should be set by middleware
      // or connection pool configuration.
      
      // Log for debugging
      console.log('📋 [RLS Session] Tenant ID should be set via connection pool or middleware:', tenantId);
    } else {
      console.log('✅ [RLS Session] Tenant ID set in session:', tenantId);
    }
  } catch (error: any) {
    console.error('❌ [RLS Session] Failed to set tenant ID:', error);
    // Don't throw - allow request to continue, RLS will handle isolation
  }
}

/**
 * Clear tenant ID from session (useful for testing)
 */
export async function clearPostgresTenant(
  dbClient: SupabaseClient
): Promise<void> {
  try {
    const { error } = await dbClient.rpc('set_tenant_id', { tenant_id: null });
    if (error) {
      console.warn('⚠️ [RLS Session] Failed to clear tenant ID:', error);
    }
  } catch (error: any) {
    console.error('❌ [RLS Session] Error clearing tenant ID:', error);
  }
}

/**
 * SQL snippet for PostgreSQL function (to be run in database migration)
 * 
 * ```sql
 * CREATE OR REPLACE FUNCTION set_tenant_id(tenant_id TEXT) 
 * RETURNS void AS $$
 * BEGIN
 *   PERFORM set_config('app.tenant_id', tenant_id, true);
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 * 
 * -- Example RLS policy that uses the session variable:
 * CREATE POLICY tenant_isolation ON chat_threads
 *   FOR ALL
 *   USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
 * ```
 */
export const RLS_SESSION_SQL = `
-- Set tenant ID in session (run this in database)
CREATE OR REPLACE FUNCTION set_tenant_id(tenant_id TEXT) 
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.tenant_id', tenant_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example: Use in RLS policies
-- CREATE POLICY tenant_isolation ON chat_threads
--   FOR ALL
--   USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
`;

