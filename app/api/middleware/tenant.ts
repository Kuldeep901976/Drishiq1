/**
 * Tenant Resolution Middleware
 * Resolves tenant_id from various sources (header, subdomain, session)
 */

import { NextRequest } from 'next/server';

/**
 * Resolve tenant ID from request
 * Priority:
 * 1. x-tenant-id header
 * 2. Subdomain ({tenant}.yourapp.com)
 * 3. Session claims (from auth)
 * 4. Query parameter (for testing)
 */
export function resolveTenantId(req: NextRequest): string | undefined {
  // 1. Check header first
  const byHeader = req.headers.get('x-tenant-id');
  if (byHeader) {
    return byHeader;
  }

  // 2. Check subdomain
  const host = req.headers.get('host') || '';
  const subdomainMatch = host.match(/^([^.]+)\./);
  if (subdomainMatch && subdomainMatch[1] !== 'www' && subdomainMatch[1] !== 'api') {
    return subdomainMatch[1];
  }

  // 3. Check query parameter (for testing/development)
  const url = new URL(req.url);
  const byQuery = url.searchParams.get('tenant_id');
  if (byQuery) {
    return byQuery;
  }

  // 4. TODO: Check session claims (when auth is integrated)
  // const session = await getSession(req);
  // if (session?.user?.tenant_id) {
  //   return session.user.tenant_id;
  // }

  return undefined;
}

/**
 * Extract tenant context from request
 * Returns tenant ID and attaches it to request context
 */
export async function getTenantContext(req: NextRequest): Promise<{
  tenantId?: string;
}> {
  const tenantId = resolveTenantId(req);
  return { tenantId };
}

/**
 * Set tenant ID in PostgreSQL session for RLS
 * Call this after resolving tenantId to ensure RLS policies apply
 */
export async function setTenantRLS(
  tenantId: string | undefined
): Promise<void> {
  if (!tenantId) {
    return;
  }

  try {
    const { setPostgresTenant } = await import('@/lib/db/rls-session');
    const { createServiceClient } = await import('@/lib/supabase');
    const supabase = createServiceClient();
    
    await setPostgresTenant(supabase, tenantId);
  } catch (error: any) {
    console.error('❌ [Tenant Middleware] Failed to set RLS session:', error);
    // Don't throw - allow request to continue
  }
}







