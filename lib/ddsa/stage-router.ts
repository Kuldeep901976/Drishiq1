/**
 * DDSA stage routing and input types.
 */

export interface StageInput {
  threadId: string;
  userId?: string;
  message?: string;
  ddsState?: Record<string, unknown>;
  userProfile?: Record<string, unknown>;
  userType?: string;
  language?: string;
  mode?: string;
}
