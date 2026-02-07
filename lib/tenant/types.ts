/**
 * Tenant Types
 * Common type definitions for tenant/organization management
 */

/**
 * Tenant role types
 */
export type TenantRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Tenant/organization information
 */
export interface TenantInfo {
  id: string;
  name: string;
  tenant_id?: string;
  organization_id?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  settings?: Record<string, any>;
  config?: Record<string, any>;
}

/**
 * User-tenant relationship
 */
export interface UserTenant {
  user_id: string;
  tenant_id: string;
  role: TenantRole;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Tenant context from request
 */
export interface TenantContext {
  tenantId?: string;
  userId?: string;
  role?: TenantRole;
}

/**
 * Tenant membership information
 */
export interface TenantMembership {
  tenant_id: string;
  tenant_name?: string;
  role: TenantRole;
  is_active: boolean;
  joined_at?: string;
}

/**
 * Tenant feature gating configuration
 */
export interface TenantGating {
  useProfileGreeting?: boolean;
  disableLegacyCfq?: boolean;
  enableKindHonesty?: boolean;
  enableHardQuestions?: boolean;
  combineWithinBoundary?: boolean;
  [key: string]: any;
}

/**
 * Stage override configuration
 */
export interface StageOverride {
  skip?: boolean;
  parallelSafe?: boolean;
  severityThreshold?: 'low' | 'medium' | 'high' | 'any';
  [key: string]: any;
}

/**
 * Expert routing configuration
 * Maps category to expert role(s)
 */
export interface ExpertRouting {
  [category: string]: string | string[]; // Expert role(s)
}

/**
 * Tenant AI configuration
 */
export interface TenantAIConfig {
  keyAlias?: string; // Secret manager alias for API key
  model?: string; // Default model (e.g., 'gpt-4-turbo')
  temperature?: number; // Default temperature
  maxTokens?: number; // Default max tokens
  baseURL?: string; // Custom API endpoint
  organization?: string; // OpenAI organization ID
  intentConfirmThreshold?: number; // Default: 0.85 (0.0-1.0)
}

/**
 * Tenant template configuration
 */
export interface TenantTemplateConfig {
  greeting?: string; // Template ID or path
  question?: string;
  response?: string;
  error?: string;
  fallbackToDefault?: boolean; // Whether to fallback to default templates
}

/**
 * Tenant privacy configuration
 */
export interface TenantPrivacyConfig {
  redactPIIInLogs?: boolean; // Redact PII in logs
  allowDataSharing?: boolean;
  retentionDays?: number;
}

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
 * Complete tenant configuration
 */
export interface TenantConfig {
  id?: string;
  name?: string;
  locale?: string; // e.g., 'en', 'hi'
  timezone?: string; // e.g., 'Asia/Kolkata'
  brand?: {
    name?: string;
    logo?: string;
    colors?: Record<string, string>;
    voice?: string; // Brand voice for prompts
  };
  gating?: TenantGating;
  ai?: TenantAIConfig;
  templates?: TenantTemplateConfig;
  privacy?: TenantPrivacyConfig;
  stageOverrides?: Record<string, StageOverride>; // Per-stage overrides
  expertRouting?: ExpertRouting; // Custom expert routing
  [key: string]: any;
}
