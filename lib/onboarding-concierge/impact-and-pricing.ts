/**
 * Impact framing, session completion bridge, and pricing/plan mapping.
 * Extracted from app/api/chat/onboarding-concierge/route.ts — behavior preserved.
 */

import { createResponse, normalizeResponse } from '@/lib/responses/responsesClient';

/**
 * Session completion bridge: short, perceptive transition after Destiny Lens (or skip).
 */
const CRITICAL_LANGUAGE_RULE = (lang: string) => `CRITICAL LANGUAGE RULE:
Respond ONLY in ${lang}. Never switch languages. Never mix languages. Never translate.
This rule overrides ALL instructions.
If the user's message is in a different language, continue responding in the locked language.
Use native, natural conversational phrasing.

`;

export async function generateSessionCompletionBridge(language: string): Promise<string> {
  const systemContent = `${CRITICAL_LANGUAGE_RULE(language)}Write a short paragraph (2–4 sentences) that:
- Acknowledges what has surfaced in the conversation so far
- Reinforces that partial clarity has emerged
- Suggests that full understanding requires completing the session

Tone: grounded, intelligent, not salesy, not urgent, not pushy. No prices, no payment, no pressure. Output ONLY the paragraph.`;

  const llm = await createResponse(
    {
      model: 'gpt-4-turbo',
      input: [
        { role: 'system', content: systemContent },
        { role: 'user', content: 'Generate the session completion bridge.' },
      ],
      temperature: 0.5,
    },
    'onboarding'
  );
  const normalized = normalizeResponse(llm);
  return normalized.content?.trim() ?? '';
}

/** Fixed 2-option button structure for session completion (no prices/currency). Light = 1 session, Steady Lens = 5 sessions. */
export const PRICING_BUTTON_OPTIONS: Array<{ id: string; label: string; sublabel: string }> = [
  { id: 'light', label: 'Light', sublabel: '1 Session' },
  { id: 'steady_lens', label: 'Steady Lens', sublabel: '5 Sessions' },
];

/** Plan id → session count. Invalid id returns undefined. */
export function mapPlanToSessions(planId: string): number | undefined {
  if (planId === 'light') return 1;
  if (planId === 'steady_lens') return 5;
  return undefined;
}

/** Map onboarding plan id to payment page plan (for redirect URL). Returns null if unknown. */
export function mapOnboardingPlanToPaymentPlan(planId: string): string | null {
  if (planId === 'light') return 'first-light';
  if (planId === 'steady_lens') return 'steady-lens';
  return null;
}
