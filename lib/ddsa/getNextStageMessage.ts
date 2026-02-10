/**
 * Get next stage message (e.g. greeting) for DDSA. Stub; wire to template when ready.
 */

export interface GetNextStageMessageInput {
  tenantId?: string | null;
  stage: string;
  state: Record<string, unknown>;
  profile: Record<string, unknown>;
  traceId?: string;
}

export interface GetNextStageMessageResult {
  text?: string;
  meta?: Record<string, unknown>;
}

export async function getNextStageMessage(
  input: GetNextStageMessageInput
): Promise<GetNextStageMessageResult> {
  if (input.stage === 'greeting' && input.profile?.name) {
    return {
      text: `Hello, ${(input.profile as any).name}!`,
      meta: { stage: input.stage },
    };
  }
  return { text: '', meta: { stage: input.stage } };
}
