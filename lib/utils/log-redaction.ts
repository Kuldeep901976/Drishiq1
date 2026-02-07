/**
 * Log Redaction Utility
 * Redacts PII from logs based on tenant privacy configuration
 */

import type { TenantConfig } from '@/lib/tenant/types';

/**
 * Redact PII from log message
 * Honors tenantConfig.privacy.redactPIIInLogs
 */
export function redactPII(
  message: string,
  tenantConfig?: TenantConfig
): string {
  if (!tenantConfig?.privacy?.redactPIIInLogs) {
    return message;
  }

  let redacted = message;

  // Email patterns
  redacted = redacted.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');

  // Phone patterns (various formats)
  redacted = redacted.replace(/\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE_REDACTED]');

  // Credit card patterns
  redacted = redacted.replace(/\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g, '[CARD_REDACTED]');

  // SSN patterns
  redacted = redacted.replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, '[SSN_REDACTED]');

  // UUIDs (may contain user IDs)
  redacted = redacted.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[UUID_REDACTED]');

  return redacted;
}

/**
 * Redact PII from object (recursively)
 */
export function redactPIIFromObject(
  obj: any,
  tenantConfig?: TenantConfig
): any {
  if (!tenantConfig?.privacy?.redactPIIInLogs) {
    return obj;
  }

  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? redactPII(obj, tenantConfig) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactPIIFromObject(item, tenantConfig));
  }

  const redacted: any = {};
  const piiFields = ['email', 'phone', 'ssn', 'credit_card', 'password', 'api_key', 'token', 'secret'];

  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    const isPIIField = piiFields.some(field => keyLower.includes(field));

    if (isPIIField && typeof value === 'string') {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redactPIIFromObject(value, tenantConfig);
    }
  }

  return redacted;
}

