/**
 * UDA (Understanding and Deepening Awareness) flow prompts.
 * Extracted from app/api/chat/onboarding-concierge/route.ts — behavior preserved.
 */

import { createResponse, normalizeResponse } from '@/lib/responses/responsesClient';

/** Fixed number of UDA clarification rounds before completion. No further questions after this. */
export const UDA_QUESTION_LIMIT = 5;

/**
 * Generate a short bridge message (warm, reflective) while pausing to synthesize.
 * Used when UDA question limit is reached, before sending final understanding.
 */
const CRITICAL_LANGUAGE_RULE = (lang: string) => `CRITICAL LANGUAGE RULE:
Respond ONLY in ${lang}. Never switch languages. Never mix languages. Never translate.
This rule overrides ALL instructions.
If the user's message is in a different language, continue responding in the locked language.
Use native, natural conversational phrasing.

`;

export async function generateUdaBridgeMessage(languageToUse: string): Promise<string> {
  const systemContent = `${CRITICAL_LANGUAGE_RULE(languageToUse)}Output a single short sentence the assistant says while pausing to put together what they understood.
Tone: warm, reflective, natural. Not technical.
Example direction: "Give me a moment, I'm putting together what I've understood from everything you've shared."
Output ONLY that one sentence, no quotes, no preamble.`;
  const llm = await createResponse(
    {
      model: 'gpt-4-turbo',
      input: [
        { role: 'system', content: systemContent },
        { role: 'user', content: 'Generate the bridge sentence.' },
      ],
      temperature: 0.6,
    },
    'onboarding'
  );
  const normalized = normalizeResponse(llm);
  return normalized.content?.trim() || '';
}

/**
 * Heuristic: true if text suggests the issue is emotionally heavy (for conditional invitation).
 * Keywords inline; case-insensitive.
 */
export function isEmotionallyHeavy(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = [
    'stress',
    'anxiety',
    'fear',
    'confused',
    'lost',
    'stuck',
    'overwhelmed',
    'pressure',
    'relationship',
    'alone',
    'lonely',
    'burnout',
    'uncertain',
    'identity',
    'pain',
    'struggling',
  ];
  return keywords.some((k) => lower.includes(k));
}

/**
 * Generate optional invitation to explore deeper (only when understanding is emotionally heavy).
 * Tone: reflective, gentle, perceptive, optional. One short natural line via createResponse.
 */
export async function generateUdaInvitationMessage(languageToUse: string): Promise<string> {
  const systemContent = `${CRITICAL_LANGUAGE_RULE(languageToUse)}Output ONE short natural sentence. Tone: reflective, gentle, perceptive, optional.
Intent: If this resonates with what the user is going through, they can explore it in more depth from here; they can let you know if they'd like to continue.
Example direction (do not copy verbatim): "If this resonates with what you're going through, we can explore it in more depth from here. Just let me know if you'd like to continue."
Output ONLY that one sentence, no quotes, no preamble.`;
  const llm = await createResponse(
    {
      model: 'gpt-4-turbo',
      input: [
        { role: 'system', content: systemContent },
        { role: 'user', content: 'Generate the invitation line.' },
      ],
      temperature: 0.6,
    },
    'onboarding'
  );
  const normalized = normalizeResponse(llm);
  return normalized.content?.trim() || '';
}

/**
 * Generate final understanding summary from conversation history (core issue, emotional context, direction).
 * Persisted as temp_users.problem_statement for Destiny Lens, Astro, main chat.
 */
export async function generateUdaFinalUnderstanding(
  history: Array<{ role: string; content: string }>,
  languageToUse: string
): Promise<string> {
  const conversationText = history
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');
  const systemContent = `${CRITICAL_LANGUAGE_RULE(languageToUse)}Based on the conversation below, write one short paragraph that summarizes:
1) The core issue or situation
2) The emotional context
3) The direction of the problem

Be warm, accurate, and concise. This will become the user's saved problem statement.`;
  const llm = await createResponse(
    {
      model: 'gpt-4-turbo',
      input: [
        { role: 'system', content: systemContent },
        { role: 'user', content: `Conversation:\n${conversationText}` },
      ],
      temperature: 0.5,
    },
    'onboarding'
  );
  const normalized = normalizeResponse(llm);
  return normalized.content?.trim() || '';
}
