/**
 * SDEP engine: stakeholder discovery. Stub implementation.
 */

export interface Stakeholder {
  name: string;
  role: string;
  influence: number;
  interest: number;
  type: 'primary' | 'secondary';
}

export interface SDEPContext {
  messages?: Array<{ content?: string; text?: string }>;
  bundled_intake?: { who?: string[] };
}

export function discoverStakeholders(context: SDEPContext): Stakeholder[] {
  return [];
}
