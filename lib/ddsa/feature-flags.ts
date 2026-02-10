/**
 * DDSA feature flags (admin UI). Stored in memory; replace with DB/Redis for production.
 */

export interface DDSAFeatureFlags {
  useModularPipeline?: boolean;
  [key: string]: boolean | string | number | undefined;
}

let flags: DDSAFeatureFlags = {
  useModularPipeline: true,
};

export async function getFeatureFlags(): Promise<DDSAFeatureFlags> {
  return { ...flags };
}

export async function updateFeatureFlags(updates: Partial<DDSAFeatureFlags>): Promise<boolean> {
  flags = { ...flags, ...updates };
  return true;
}
