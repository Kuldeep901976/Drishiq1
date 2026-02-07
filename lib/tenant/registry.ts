/**
 * Tenant Registry
 * Manages tenant configuration and feature flags with in-memory caching
 */

import { createServiceClient } from '@/lib/supabase';
import type { TenantConfig } from './types';

/**
 * Default tenant configuration
 * Used when tenant is not found or config is missing
 */
const DEFAULT_TENANT_CONFIG: TenantConfig = {
  gating: {
    useProfileGreeting: false,
    disableLegacyCfq: false,
    enableKindHonesty: true,
    enableHardQuestions: true,
  },
  ai: {
    model: 'gpt-4-turbo',
    temperature: 0.7,
    maxTokens: 2000,
  },
  templates: {
    fallbackToDefault: true,
  },
  privacy: {
    redactPIIInLogs: false,
    allowDataSharing: true,
    retentionDays: 365,
  },
};

/**
 * In-memory cache for tenant configurations
 * Key: tenantId, Value: { config, timestamp }
 */
const tenantConfigCache = new Map<string, { config: TenantConfig; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Clear tenant cache (useful for tests)
 */
export function clearTenantCache(tenantId?: string): void {
  if (tenantId) {
    tenantConfigCache.delete(tenantId);
  } else {
    tenantConfigCache.clear();
  }
}

/**
 * Get tenant configuration by tenant ID
 * Fetches from tenant_config table, falls back to defaults
 * 
 * @param tenantId - The tenant/organization ID
 * @returns Tenant configuration object with gating flags
 */
export async function getTenantConfig(
  tenantId: string | undefined | null
): Promise<TenantConfig> {
  if (!tenantId) {
    return DEFAULT_TENANT_CONFIG;
  }

  // Check cache first
  const cached = tenantConfigCache.get(tenantId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached.config;
  }

  try {
    const supabase = createServiceClient();

    // Try tenant_config table first
    const { data: tenantConfig, error: configError } = await supabase
      .from('tenant_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!configError && tenantConfig) {
      // Parse config JSONB if it exists
      const config = tenantConfig.config as Record<string, any> || {};
      const gating = config.gating || tenantConfig.gating || {};
      const ai = config.ai || tenantConfig.ai || {};
      const templates = config.templates || tenantConfig.templates || {};
      const privacy = config.privacy || tenantConfig.privacy || {};

      const mergedConfig: TenantConfig = {
        id: tenantId,
        name: tenantConfig.name || tenantConfig.tenant_name,
        locale: config.locale || tenantConfig.locale,
        timezone: config.timezone || tenantConfig.timezone,
        brand: config.brand || tenantConfig.brand,
        gating: {
          useProfileGreeting: gating.useProfileGreeting ?? DEFAULT_TENANT_CONFIG.gating?.useProfileGreeting ?? false,
          disableLegacyCfq: gating.disableLegacyCfq ?? DEFAULT_TENANT_CONFIG.gating?.disableLegacyCfq ?? false,
          enableKindHonesty: gating.enableKindHonesty ?? DEFAULT_TENANT_CONFIG.gating?.enableKindHonesty ?? true,
          enableHardQuestions: gating.enableHardQuestions ?? DEFAULT_TENANT_CONFIG.gating?.enableHardQuestions ?? true,
          ...gating,
        },
        ai: {
          ...DEFAULT_TENANT_CONFIG.ai,
          ...ai,
        },
        templates: {
          ...DEFAULT_TENANT_CONFIG.templates,
          ...templates,
        },
        privacy: {
          ...DEFAULT_TENANT_CONFIG.privacy,
          ...privacy,
        },
        ...config,
      };

      // Cache the result
      tenantConfigCache.set(tenantId, { config: mergedConfig, timestamp: Date.now() });
      return mergedConfig;
    }

    // Fallback: Try organizations table if tenant_config doesn't exist
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', tenantId)
      .maybeSingle();

    if (!orgError && org) {
      const config = (org.config as Record<string, any>) || {};
      const gating = config.gating || {};
      const ai = config.ai || {};
      const templates = config.templates || {};
      const privacy = config.privacy || {};

      const mergedConfig: TenantConfig = {
        id: tenantId,
        name: org.name || org.organization_name,
        locale: config.locale,
        timezone: config.timezone,
        brand: config.brand,
        gating: {
          useProfileGreeting: gating.useProfileGreeting ?? DEFAULT_TENANT_CONFIG.gating?.useProfileGreeting ?? false,
          disableLegacyCfq: gating.disableLegacyCfq ?? DEFAULT_TENANT_CONFIG.gating?.disableLegacyCfq ?? false,
          enableKindHonesty: gating.enableKindHonesty ?? DEFAULT_TENANT_CONFIG.gating?.enableKindHonesty ?? true,
          enableHardQuestions: gating.enableHardQuestions ?? DEFAULT_TENANT_CONFIG.gating?.enableHardQuestions ?? true,
          ...gating,
        },
        ai: {
          ...DEFAULT_TENANT_CONFIG.ai,
          ...ai,
        },
        templates: {
          ...DEFAULT_TENANT_CONFIG.templates,
          ...templates,
        },
        privacy: {
          ...DEFAULT_TENANT_CONFIG.privacy,
          ...privacy,
        },
        ...config,
      };

      // Cache the result
      tenantConfigCache.set(tenantId, { config: mergedConfig, timestamp: Date.now() });
      return mergedConfig;
    }

    // Return defaults if nothing found
    const defaultConfig = { ...DEFAULT_TENANT_CONFIG, id: tenantId };
    tenantConfigCache.set(tenantId, { config: defaultConfig, timestamp: Date.now() });
    return defaultConfig;
  } catch (error: any) {
    console.error('[TenantRegistry] Error fetching tenant config:', {
      tenantId,
      error: error.message,
    });
    
    // Return defaults on error
    return DEFAULT_TENANT_CONFIG;
  }
}

/**
 * Get multiple tenant configurations
 * Useful for batch operations
 */
export async function getTenantConfigs(
  tenantIds: (string | undefined | null)[]
): Promise<Map<string, TenantConfig>> {
  const configs = new Map<string, TenantConfig>();
  
  await Promise.all(
    tenantIds
      .filter((id): id is string => !!id)
      .map(async (tenantId) => {
        const config = await getTenantConfig(tenantId);
        configs.set(tenantId, config);
      })
  );

  return configs;
}