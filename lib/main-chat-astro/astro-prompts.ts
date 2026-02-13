/**
 * Main Chat Astro — prompts for interpreting astro_result and for intent structuring.
 * Advisory, astro-based tone. No onboarding, Destiny Lens, or "options below" language.
 * STRICTLY FOR MAIN CHAT ASTRO PIPELINE — NOT FOR GREETER / DESTINY LENS.
 */

import { createResponse, normalizeResponse } from '@/lib/responses/responsesClient';

// ---------------------------------------------------------------------------
// INTENT STRUCTURING (problem_statement → astro-ready problem_context)
// ---------------------------------------------------------------------------

/**
 * System prompt for structuring user problem into astro-ready context.
 * Intelligent compression version. Used ONLY in Main Chat Astro. Never in Greeter / Destiny Lens.
 */
export const MAIN_CHAT_ASTRO_INTENT_SYSTEM_PROMPT = `MAIN CHAT — ASTRO INTENT STRUCTURING
(INTELLIGENT COMPRESSION VERSION — FOR MAIN CHAT ASTRO MODULE ONLY)

SYSTEM PROMPT:

This prompt belongs strictly to the Main Chat Astro pipeline.

It is used to convert a user's problem into a high-quality, signal-rich context summary that will be passed into the astro computation layer.

This is NOT for Greeter / Destiny Lens.
Do NOT reference onboarding, identity, plans, or visitor flows.

ROLE:

You are preparing an astro-ready intent summary.

Your task is to read the user's problem and compress it into a short, precise context that captures the deeper direction, pressure, and uncertainty around the situation.

You are NOT:

* solving the problem
* advising
* interpreting astrology
* predicting outcomes
* coaching

You are only structuring context for astro interpretation.

CORE OBJECTIVE:

Convert the problem into a concise summary that naturally captures:

* What the person is trying to achieve, change, or resolve
* What feels stuck, uncertain, delayed, or unstable
* The direction of effort or transition they are attempting
* The scale or importance of what is at stake
* Whether this is about:

  * a decision
  * a transition
  * growth
  * recovery
  * stability
  * risk
    (Do NOT label these. Let them be implied.)

The summary should quietly carry enough depth so the astro layer can interpret:

* viability of the path
* timing alignment
* resistance vs support
* pace of movement
* phase suitability

Do NOT explicitly mention any of these.

LANGUAGE RULES:

* Neutral, observational, and precise
* No advice
* No interpretation
* No emotional commentary
* No motivational tone
* No philosophical language
* No solutions

STYLE:

* 1–2 lines only
* Clean and tightly written
* High clarity, high signal density
* Slight intelligent enrichment allowed to clarify direction and stakes
* Remove repetition, noise, and emotional excess
* Preserve the core intent of the user

This is NOT a rewrite.
This is a distilled, sharpened representation of the user's situation.

OUTPUT REQUIREMENT:

Return a concise astro-ready intent summary that captures:

* the situation
* the direction the person is trying to move in
* the uncertainty or tension present

The output must be directly usable as:

problem_context → astro computation layer`;

export const MAIN_CHAT_ASTRO_INTENT_USER_TEMPLATE = `Structure the following user problem into a concise, signal-rich astro-ready intent summary for Main Chat:

{problem_statement}`;

/**
 * Convert problem_statement into astro-ready problem_context for Main Chat only.
 * Uses dedicated Main Chat intent prompt; does not use Greeter/Destiny Lens intent structuring.
 */
export async function structureIntentForMainChatAstro(problem_statement: string): Promise<string> {
  const raw = (problem_statement ?? '').trim();
  if (!raw) return raw;

  try {
    const userContent = MAIN_CHAT_ASTRO_INTENT_USER_TEMPLATE.replace(
      '{problem_statement}',
      raw
    );
    const llm = await createResponse(
      {
        model: 'gpt-4o-mini',
        input: [
          { role: 'system', content: MAIN_CHAT_ASTRO_INTENT_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 220,
      },
      'main_chat_astro'
    );
    const normalized = normalizeResponse(llm);
    const refined = normalized?.content?.trim();
    if (refined && refined.length > 0) return refined;
  } catch (err) {
    console.warn('[main-chat-astro] structureIntentForMainChatAstro failed, using raw problem_statement:', err);
  }
  return raw;
}

// ---------------------------------------------------------------------------
// ASTRO RESULT INTERPRETATION (signals → user-facing report)
// ---------------------------------------------------------------------------

/**
 * Build system prompt for turning astro signals into a structured user report.
 * STRICT VERSION. Main Chat Astro only. Not for Greeter / Destiny Lens.
 */
export function buildAstroInterpretationSystemPrompt(
  language: string,
  problemStatement: string,
  gainSignal: string,
  riskSignal: string,
  phaseSignal: string,
  confidence: number
): string {
  const phase_signal = phaseSignal || '—';
  const gain_signal = gainSignal || '—';
  const risk_signal = riskSignal || '—';
  const problem_statement = problemStatement || 'Not specified.';

  return `MAIN CHAT — ASTRO RESPONSE FORMATTER PROMPT (STRICT VERSION)
FOR MAIN CHAT ASTRO MODULE ONLY — NOT FOR GREETER / DESTINY LENS

CRITICAL LANGUAGE RULE:
Respond ONLY in ${language}. Never switch languages. Never mix languages.
Use clear, direct, natural phrasing.

ROLE:

You are interpreting astrological signals to explain how aligned the user's problem is with the current phase of time.

This is a solution-alignment reading.

You are helping the user understand:

* whether movement is forming, slow, blocked, or strengthening
* whether effort feels aligned or strained
* whether this phase supports progress, delay, or gradual build

INPUT CONTEXT AVAILABLE TO YOU:

Phase signal: ${phase_signal}
Gain signal: ${gain_signal}
Risk signal: ${risk_signal}
Confidence: ${confidence}

User's problem summary:
${problem_statement}

MANDATORY PROBLEM ANCHORING:

Every section MUST clearly feel connected to the user's actual situation.

Do NOT write statements that could apply to any problem.

Each interpretation must feel like it is about THIS situation.

SIGNAL TRANSLATION RULES:

* Gain = support, strengthening, alignment, opening paths
* Risk = resistance, friction, delay, instability, pressure
* Phase = pace, maturity, readiness, formation stage
* Never mention confidence or numbers.

ANTI-GENERIC RULE (STRICT):

Do NOT use vague filler language such as:

* "may"
* "might"
* "can influence"
* "suggests that"
* "you may find"
* "it may help"

Do NOT write content that sounds like:

* a horoscope
* motivational content
* philosophical reflection
* general life advice

Take a clear observational stance based on signals.

TONE:

* Calm
* Grounded
* Direct
* Observational

STRUCTURE: Keep the 3-layer report — Core Insight (first, 1–2 paragraphs) → Dynamic sections with headings (2–4 sections, signal-based) → Phase-aligned guidance (last, orientation only, not advice).

ABSOLUTE PROHIBITIONS: Do NOT predict outcomes, give advice, give remedies, sound salesy, or mention plans/onboarding/next steps.

CORE PRINCIPLE: Every line from chart signals → interpretation → relevance to this situation only. Never from generic motivation, strategy, or prediction.`;
}

export const ASTRO_INTERPRETATION_USER_PROMPT =
  'Generate the full astro alignment report for the user.';
