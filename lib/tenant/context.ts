/**
 * Tenant Context
 * Functions for managing tenant/organization context and membership
 */

import { createServiceClient } from '@/lib/supabase';

/**
 * Get tenant ID for a user
 * Returns the tenant_id from user_tenants table
 */
export async function getTenantId(userId: string): Promise<string | null> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[TenantContext] Error getting tenant ID:', error);
      return null;
    }

    return data?.tenant_id || null;
  } catch (error: any) {
    console.error('[TenantContext] Error in getTenantId:', error);
    return null;
  }
}

/**
 * Ensure tenant exists for user
 * Creates a personal tenant if user doesn't have one
 */
export async function ensureTenant(userId: string): Promise<string> {
  try {
    const supabase = createServiceClient();

    // Check if user already has a tenant
    const existingTenantId = await getTenantId(userId);
    if (existingTenantId) {
      return existingTenantId;
    }

    // Create personal tenant (using user_id as tenant_id for personal tenants)
    // Or create an organization and link user to it
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: `Personal Tenant for ${userId}`,
        admin_user_id: userId,
        is_active: true,
      })
      .select('id')
      .single();

    if (orgError || !org) {
      // Fallback: use user_id as tenant_id for personal tenants
      const tenantId = userId;
      
      // Link user to tenant
      await supabase
        .from('user_tenants')
        .upsert({
          user_id: userId,
          tenant_id: tenantId,
          role: 'owner',
          is_active: true,
        }, {
          onConflict: 'user_id,tenant_id',
        });

      return tenantId;
    }

    // Link user to organization
    await supabase
      .from('user_tenants')
      .upsert({
        user_id: userId,
        tenant_id: org.id,
        role: 'owner',
        is_active: true,
      }, {
        onConflict: 'user_id,tenant_id',
      });

    return org.id;
  } catch (error: any) {
    console.error('[TenantContext] Error ensuring tenant:', error);
    // Fallback to user_id as tenant_id
    return userId;
  }
}

/**
 * Get tenant information
 */
export async function getTenantInfo(tenantId: string): Promise<any> {
  if (!tenantId) {
    return null;
  }

  try {
    const supabase = createServiceClient();

    // Try organizations table first
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', tenantId)
      .maybeSingle();

    if (!orgError && org) {
      return {
        id: org.id,
        name: org.name,
        is_active: org.is_active,
        created_at: org.created_at,
        settings: org.settings,
      };
    }

    // Fallback: return basic info
    return {
      id: tenantId,
      name: `Tenant ${tenantId}`,
      is_active: true,
    };
  } catch (error: any) {
    console.error('[TenantContext] Error getting tenant info:', error);
    return null;
  }
}

/**
 * Get user's role in a tenant
 */
export async function getUserTenantRole(
  userId: string,
  tenantId: string
): Promise<string | null> {
  if (!userId || !tenantId) {
    return null;
  }

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('user_tenants')
      .select('role')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('[TenantContext] Error getting user role:', error);
      return null;
    }

    return data?.role || null;
  } catch (error: any) {
    console.error('[TenantContext] Error in getUserTenantRole:', error);
    return null;
  }
}





