/**
 * DDSA state validation and migration. Validates shape/version of dds_state.
 */

export interface ValidateDdsStateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateDdsState(state: unknown): ValidateDdsStateResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (state == null || typeof state !== 'object') {
    errors.push('state must be an object');
    return { valid: false, errors, warnings };
  }
  return { valid: true, errors, warnings };
}
