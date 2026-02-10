/**
 * DDSA DB adapters for stages, instruction sets, messages, and AI response insert.
 * Stub implementations; replace with real Supabase/DB calls.
 */

export async function getStageById(_id: string): Promise<Record<string, unknown> | null> {
  return null;
}

export async function getStageByName(_name: string): Promise<Record<string, unknown> | null> {
  return null;
}

export async function getInstructionSetById(_id: string): Promise<Record<string, unknown> | null> {
  return null;
}

export async function getRecentMessages(
  _threadId: string,
  _limit?: number
): Promise<Array<Record<string, unknown>>> {
  return [];
}

export async function insertAiResponse(_payload: {
  thread_id?: string;
  stage_id?: string;
  content?: string;
  [key: string]: unknown;
}): Promise<{ id?: string }> {
  return {};
}
