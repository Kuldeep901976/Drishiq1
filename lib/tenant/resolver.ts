// lib/tenant/resolver.ts
/**
 * Tenant Configuration Resolver
 * Combines global defaults, stage defaults, tenant overrides, and experiment flags
 */

import type { TenantConfig } from './types';
import { getTenantConfig } from './registry';

/**
 * Resolved Tenant Configuration
 * Fully materialized config with all overrides applied
 */
export interface ResolvedTenantConfig extends TenantConfig {
  _resolved_at?: string;
  _source?: {
    global?: boolean;
    tenant?: boolean;
    experiment?: boolean;
    environment?: boolean;
  };
}

/**
 * Global Defaults
 */
const GLOBAL_DEFAULTS: Partial<ResolvedTenantConfig> = {
  ai: {
    model: 'gpt-4-turbo',
    temperature: 0.7,
    maxTokens: 2000,
    requestsPerMinute: 60
  },
  gating: {
    enableIntentConfirmation: true,
    enableScopeLock: true,
    requireConfirmation: false,
    enableKindHonesty: true
  }
};

/**
 * Stage Defaults
 */
const STAGE_DEFAULTS: Record<string, Partial<ResolvedTenantConfig>> = {
  greeting: {
    ai: { model: 'gpt-4o-mini' }
  },
  intent: {
    ai: { model: 'gpt-4-turbo' }
  },
  plan: {
    ai: { model: 'gpt-4o' }
  }
};

/**
 * Resolve tenant configuration
 * Combines all sources in priority order
 */
export async function resolveTenantConfig(
  tenantId: string,
  stageId?: string
): Promise<ResolvedTenantConfig> {
  // 1. Start with global defaults
  let resolved: ResolvedTenantConfig = {
    ...GLOBAL_DEFAULTS,
    id: tenantId,
    name: 'default'
  } as ResolvedTenantConfig;

  // 2. Apply stage defaults (if stageId provided)
  if (stageId && STAGE_DEFAULTS[stageId]) {
    resolved = deepMerge(resolved, STAGE_DEFAULTS[stageId]);
  }

  // 3. Load tenant config
  const tenantConfig = await getTenantConfig(tenantId);
  if (tenantConfig) {
    resolved = deepMerge(resolved, tenantConfig);
  }

  // 4. Apply environment overrides (from process.env)
  const envOverrides = getEnvironmentOverrides();
  if (envOverrides) {
    resolved = deepMerge(resolved, envOverrides);
  }

  // 5. Apply experiment flags (if any)
  const experimentFlags = await getExperimentFlags(tenantId);
  if (experimentFlags) {
    resolved = deepMerge(resolved, experimentFlags);
  }

  // Add metadata
  resolved._resolved_at = new Date().toISOString();
  resolved._source = {
    global: true,
    tenant: !!tenantConfig,
    experiment: !!experimentFlags,
    environment: !!envOverrides
  };

  return resolved;
}

/**
 * Deep merge utility
 */
function deepMerge(target: any, source: any): any {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Get environment overrides
 */
function getEnvironmentOverrides(): Partial<ResolvedTenantConfig> | null {
  // Example: Override model in staging
  if (process.env.NODE_ENV === 'staging') {
    return {
      ai: {
        model: process.env.STAGING_MODEL || 'gpt-4o-mini' // Use cheaper model in staging
      }
    };
  }

  return null;
}

/**
 * Get experiment flags for tenant
 * In production, this would query an experiments service
 */
async function getExperimentFlags(tenantId: string): Promise<Partial<ResolvedTenantConfig> | null> {
  // Example: A/B test different models
  // In production, use feature flag service (LaunchDarkly, etc.)
  const experimentId = process.env.EXPERIMENT_ID;
  if (experimentId) {
    // Check if tenant is in experiment
    // For now, return null (no experiments)
    return null;
  }

  return null;
}

/**
 * Cache for resolved configs (in-memory, TTL-based)
 */
const configCache = new Map<string, { config: ResolvedTenantConfig; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached or resolve tenant config
 */
export async function getResolvedTenantConfig(
  tenantId: string,
  stageId?: string
): Promise<ResolvedTenantConfig> {
  const cacheKey = `${tenantId}:${stageId || 'default'}`;
  const cached = configCache.get(cacheKey);

  if (cached && cached.expires > Date.now()) {
    return cached.config;
  }

  const resolved = await resolveTenantConfig(tenantId, stageId);
  configCache.set(cacheKey, {
    config: resolved,
    expires: Date.now() + CACHE_TTL_MS
  });

  return resolved;
}

/**
 * Invalidate cache for tenant
 */
export function invalidateTenantCache(tenantId: string): void {
  const keysToDelete: string[] = [];
  configCache.forEach((_, key) => {
    if (key.startsWith(`${tenantId}:`)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => configCache.delete(key));
}

/**
 * Clear all cache
 */
export function clearConfigCache(): void {
  configCache.clear();
}

