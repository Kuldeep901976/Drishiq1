/**
 * Types for DDSA replay engine.
 */

export interface ReplayOptions {
  mode?: 'full' | 'summary' | 'dry';
  skipExternalCalls?: boolean;
  debugFlags?: Record<string, boolean | string>;
  requestingUser?: { id: string; email?: string } | null;
}
