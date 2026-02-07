/**
 * AI memory layer: section summaries per thread.
 * Independent of old summary/stage/domain logic. Sits on chat_threads + chat_messages.
 */

import { createServiceClient } from '@/lib/supabase';
import { PersistentThreadManager } from '@/packages/core/persistent-thread-manager';
import { createResponse, normalizeResponse } from '@/lib/responses/responsesClient';

export const MAX_CHARS_PER_CHUNK = 4000;

export const SECTION_CODES = {
  G1_IDENTITY: 'G1_IDENTITY',
  G2_CONTACT: 'G2_CONTACT',
  G3_PROBLEM: 'G3_PROBLEM',
  G4_CONTEXT: 'G4_CONTEXT',
  G5_EXPECTATION: 'G5_EXPECTATION',
  M1_PROBLEM_DEEP: 'M1_PROBLEM_DEEP',
  M2_BACKGROUND_FACTORS: 'M2_BACKGROUND_FACTORS',
  M3_GOALS_CONSTRAINTS: 'M3_GOALS_CONSTRAINTS',
  M4_ACTION_PLAN: 'M4_ACTION_PLAN',
  M5_PROGRESS_LOG: 'M5_PROGRESS_LOG',
};

/**
 * Build prompt for LLM to summarize conversation history into a section.
 */
export async function buildSectionSummaryFromHistory(
  threadId: string,
  sectionCode: string
): Promise<string> {
  const tm = new PersistentThreadManager();
  const messages = await tm.getMessages(threadId, 200);

  const conversation = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  return `
You are summarizing a conversation into a structured memory section.

Section: ${sectionCode}

Rules:
- Do NOT include phone numbers or emails
- Capture facts, context, emotions, intent
- Keep it concise but complete
- This will be used by another AI later

Conversation:
${conversation}

Structured summary:
`;
}

/**
 * Split text into chunks of at most MAX_CHARS_PER_CHUNK characters.
 */
export function splitIntoChunks(text: string): string[] {
  if (!text || text.length === 0) return [];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += MAX_CHARS_PER_CHUNK) {
    chunks.push(text.slice(i, i + MAX_CHARS_PER_CHUNK));
  }
  return chunks;
}

export function resolveSectionForGreeter(text: string): string {
  if (/name|i am|i'm/i.test(text)) return SECTION_CODES.G1_IDENTITY;
  if (/phone|email|contact/i.test(text)) return SECTION_CODES.G2_CONTACT;
  if (text.length > 40) return SECTION_CODES.G3_PROBLEM;
  return SECTION_CODES.G4_CONTEXT;
}

export function resolveSectionForMainChat(text: string): string {
  if (/goal|want|need/i.test(text)) return SECTION_CODES.M3_GOALS_CONSTRAINTS;
  if (/plan|step|action/i.test(text)) return SECTION_CODES.M4_ACTION_PLAN;
  return SECTION_CODES.M1_PROBLEM_DEEP;
}

/**
 * Save a section summary: build from history via LLM, then delete existing rows and insert chunks.
 */
export async function saveSectionSummary(
  threadId: string,
  sectionCode: string,
  _summary: string
): Promise<void> {
  const prompt = await buildSectionSummaryFromHistory(threadId, sectionCode);

  const llm = await createResponse(
    {
      model: 'gpt-4-turbo',
      input: prompt,
      temperature: 0.2,
    },
    'section-memory'
  );

  let summary = normalizeResponse(llm).content || '';

  const chunks = splitIntoChunks(summary);
  const supabase = createServiceClient();

  await supabase
    .from('chat_section_summaries')
    .delete()
    .eq('thread_id', threadId)
    .eq('section_code', sectionCode);

  if (chunks.length === 0) return;

  const now = new Date().toISOString();
  const rows = chunks.map((chunk, i) => ({
    thread_id: threadId,
    section_code: sectionCode,
    chunk_index: i + 1,
    content: chunk,
    token_estimate: Math.ceil(chunk.length / 4),
    created_at: now,
    updated_at: now,
  }));

  const { error } = await supabase.from('chat_section_summaries').insert(rows);
  if (error) throw error;
}

/**
 * Load a single section: select by thread + section, order by chunk_index, join content.
 */
export async function loadSectionSummary(
  threadId: string,
  sectionCode: string
): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('chat_section_summaries')
    .select('content')
    .eq('thread_id', threadId)
    .eq('section_code', sectionCode)
    .order('chunk_index', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return '';
  return data.map((row) => row.content ?? '').join('');
}

/**
 * Load all sections for a thread as Record<section_code, concatenated content>.
 */
export async function loadAllSections(
  threadId: string
): Promise<Record<string, string>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('chat_section_summaries')
    .select('section_code, content, chunk_index')
    .eq('thread_id', threadId)
    .order('section_code', { ascending: true })
    .order('chunk_index', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return {} as Record<string, string>;

  const out: Record<string, string> = {};
  for (const row of data) {
    const code = row.section_code ?? '';
    if (!out[code]) out[code] = '';
    out[code] += row.content ?? '';
  }
  return out;
}
