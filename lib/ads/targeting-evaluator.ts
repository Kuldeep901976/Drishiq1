/**
 * Targeting Rule Evaluator
 * Evaluates JSON-based targeting rules against user context
 */

export interface TargetingRule {
  op: 'AND' | 'OR' | 'NOT';
  rules?: TargetingRule[];
  field?: string;
  operator?: '==' | '!=' | 'IN' | 'NOT_IN' | 'BETWEEN' | '>=' | '<=' | '>' | '<' | 'CONTAINS' | 'STARTS_WITH' | 'ENDS_WITH';
  value?: any;
}

export interface UserContext {
  country?: string;
  region?: string;
  city?: string;
  device?: 'mobile' | 'desktop' | 'tablet';
  user?: {
    is_subscribed?: boolean;
    subscription_tier?: string;
    is_logged_in?: boolean;
    user_id?: string;
  };
  time?: {
    hour?: number;
    day_of_week?: number; // 0 = Sunday, 6 = Saturday
  };
  page?: {
    path?: string;
    query_params?: Record<string, string>;
  };
  referrer?: string;
  custom?: Record<string, any>;
}

/**
 * Evaluate a targeting rule against user context
 */
export function evaluateTargeting(rule: TargetingRule | null, context: UserContext): boolean {
  if (!rule) {
    return true; // No rule means match all
  }

  // Handle logical operators
  if (rule.op === 'AND') {
    if (!rule.rules || rule.rules.length === 0) return true;
    return rule.rules.every(r => evaluateTargeting(r, context));
  }

  if (rule.op === 'OR') {
    if (!rule.rules || rule.rules.length === 0) return false;
    return rule.rules.some(r => evaluateTargeting(r, context));
  }

  if (rule.op === 'NOT') {
    if (!rule.rules || rule.rules.length === 0) return true;
    return !evaluateTargeting(rule.rules[0], context);
  }

  // Handle field-based rules
  if (rule.field && rule.operator && rule.value !== undefined) {
    return evaluateFieldRule(rule.field, rule.operator, rule.value, context);
  }

  return false;
}

/**
 * Evaluate a single field rule
 */
function evaluateFieldRule(
  field: string,
  operator: string,
  value: any,
  context: UserContext
): boolean {
  const fieldValue = getFieldValue(field, context);

  switch (operator) {
    case '==':
      return fieldValue === value;
    case '!=':
      return fieldValue !== value;
    case 'IN':
      return Array.isArray(value) && value.includes(fieldValue);
    case 'NOT_IN':
      return Array.isArray(value) && !value.includes(fieldValue);
    case 'BETWEEN':
      if (!Array.isArray(value) || value.length !== 2) return false;
      return fieldValue >= value[0] && fieldValue <= value[1];
    case '>=':
      return fieldValue >= value;
    case '<=':
      return fieldValue <= value;
    case '>':
      return fieldValue > value;
    case '<':
      return fieldValue < value;
    case 'CONTAINS':
      return String(fieldValue).includes(String(value));
    case 'STARTS_WITH':
      return String(fieldValue).startsWith(String(value));
    case 'ENDS_WITH':
      return String(fieldValue).endsWith(String(value));
    default:
      return false;
  }
}

/**
 * Get field value from context using dot notation
 */
function getFieldValue(field: string, context: UserContext): any {
  const parts = field.split('.');
  let value: any = context;

  for (const part of parts) {
    if (value === null || value === undefined) {
      return null;
    }
    value = value[part];
  }

  return value;
}

/**
 * Compile targeting rule for faster evaluation (caching, optimization)
 */
export function compileTargetingRule(rule: TargetingRule | null): TargetingRule | null {
  if (!rule) return null;

  // For now, just return the rule as-is
  // In production, could optimize by:
  // - Pre-computing field paths
  // - Reordering rules for short-circuit evaluation
  // - Caching compiled rules
  return rule;
}

/**
 * Validate targeting rule structure
 */
export function validateTargetingRule(rule: any): { valid: boolean; error?: string } {
  if (!rule || typeof rule !== 'object') {
    return { valid: false, error: 'Rule must be an object' };
  }

  if (!rule.op) {
    return { valid: false, error: 'Rule must have an "op" field' };
  }

  if (rule.op === 'AND' || rule.op === 'OR') {
    if (!Array.isArray(rule.rules)) {
      return { valid: false, error: 'AND/OR rules must have a "rules" array' };
    }
    if (rule.rules.length === 0) {
      return { valid: false, error: 'AND/OR rules must have at least one rule' };
    }
    for (const subRule of rule.rules) {
      const result = validateTargetingRule(subRule);
      if (!result.valid) {
        return result;
      }
    }
  } else if (rule.op === 'NOT') {
    if (!Array.isArray(rule.rules) || rule.rules.length !== 1) {
      return { valid: false, error: 'NOT rule must have exactly one sub-rule' };
    }
    return validateTargetingRule(rule.rules[0]);
  } else {
    // Field-based rule
    if (!rule.field) {
      return { valid: false, error: 'Field rule must have a "field"' };
    }
    if (!rule.operator) {
      return { valid: false, error: 'Field rule must have an "operator"' };
    }
    if (rule.value === undefined) {
      return { valid: false, error: 'Field rule must have a "value"' };
    }
  }

  return { valid: true };
}

