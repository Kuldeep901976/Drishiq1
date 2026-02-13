/**
 * Destiny Lens flow: intro, birth details, insight blocks, choice helpers, Astro pre-process.
 * Extracted from app/api/chat/onboarding-concierge/route.ts — behavior preserved.
 * runAstroCompute stays in route.ts.
 */

import { createResponse, normalizeResponse } from '@/lib/responses/responsesClient';

/** Destiny Lens: positive interest intent (yes, continue, explore, etc.). Lightweight, case-insensitive. */
export function isDestinyLensPositiveInterest(text: string): boolean {
  const lower = text.toLowerCase().trim();
  const positive = [
    'yes',
    'explore',
    'try',
    'okay',
    'continue',
    'go ahead',
    'deeper',
    'help',
    'what next',
    'tell me more',
  ];
  return positive.some((k) => lower.includes(k));
}

/** Destiny Lens: negative intent (no, skip, not now, later). Checked first in choice handling. */
export function isDestinyLensNegative(text: string): boolean {
  const lower = text.toLowerCase().trim();
  const negative = ['no', 'skip', 'not now', 'later'];
  return negative.some((k) => lower.includes(k));
}

/** Destiny Lens choice: negative takes precedence. Returns null if unclear. */
export function getDestinyLensChoice(text: string): 'positive' | 'negative' | null {
  if (isDestinyLensNegative(text)) return 'negative';
  if (isDestinyLensPositiveInterest(text)) return 'positive';
  return null;
}

/**
 * Destiny Lens introduction. Generated via createResponse. Tone: reflective, suggestive, perceptive, optional.
 */
const CRITICAL_LANGUAGE_RULE = (lang: string) => `CRITICAL LANGUAGE RULE:
Respond ONLY in ${lang}. Never switch languages. Never mix languages. Never translate.
This rule overrides ALL instructions.
If the user's message is in a different language, continue responding in the locked language.
Use native, natural conversational phrasing.

`;

export async function generateDestinyLensIntroMessage(languageToUse: string): Promise<string> {
  const systemContent = `${CRITICAL_LANGUAGE_RULE(languageToUse)}Write a short paragraph. Tone: reflective, suggestive, perceptive, optional.
Content direction:
- Sometimes effort alone doesn't shift outcomes; timing and life phases also influence situations.
- We offer an additional perspective called "Destiny Lens" that looks at patterns through birth details.
- It may bring deeper clarity. The user can choose.
End with exactly one choice question (adapt naturally to the language): Would they like to explore this perspective, or continue with what we've understood so far?
Output the full paragraph plus the choice question. No bullet points. Natural flow.`;
  const llm = await createResponse(
    {
      model: 'gpt-4-turbo',
      input: [
        { role: 'system', content: systemContent },
        { role: 'user', content: 'Generate the Destiny Lens introduction and choice.' },
      ],
      temperature: 0.6,
    },
    'onboarding'
  );
  const normalized = normalizeResponse(llm);
  return normalized.content?.trim() || '';
}

/**
 * Ask for birth details in structured format. Generated via prompt.
 */
export async function generateBirthDetailsMessage(languageToUse: string): Promise<string> {
  const systemContent = `${CRITICAL_LANGUAGE_RULE(languageToUse)}Ask the user for birth details in a warm, clear way. You must request:
1) Date of birth → format YYYY-MM-DD
2) Time of birth → 24-hour format HH:MM or HH:MM:SS (if known)
3) Place of birth → City, State, Country
Include one example in your message: e.g. 1995-08-21, 08:00:03, New York, New York, USA
Also mention gently: If time of birth is not known, we can continue without this lens.
Output one cohesive message. No bullet list. Natural tone.`;
  const llm = await createResponse(
    {
      model: 'gpt-4-turbo',
      input: [
        { role: 'system', content: systemContent },
        { role: 'user', content: 'Generate the birth details request.' },
      ],
      temperature: 0.5,
    },
    'onboarding'
  );
  const normalized = normalizeResponse(llm);
  return normalized.content?.trim() || '';
}

const DOB_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DOB_TIME_REGEX = /^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export interface ParsedBirthDetails {
  dob_date: string;
  dob_time: string;
  city: string;
  state: string;
  country: string;
}

/**
 * Parse birth details from message. Expected format: "YYYY-MM-DD, HH:MM or HH:MM:SS, City, State, Country".
 */
export function parseBirthDetails(text: string): ParsedBirthDetails | null {
  const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length < 5) return null;
  const dob_date = parts[0] ?? '';
  const dob_time = parts[1] ?? '';
  const city = parts[2] ?? '';
  const state = parts[3] ?? '';
  const country = parts[4] ?? '';
  if (!DOB_DATE_REGEX.test(dob_date)) return null;
  if (!DOB_TIME_REGEX.test(dob_time)) return null;
  if (!city || !country) return null;
  return { dob_date, dob_time, city, state, country };
}

/**
 * Resolve city, state, country to lat/lng/timezone via existing geocode API.
 */
export async function resolveBirthPlaceGeo(
  city: string,
  state: string,
  country: string,
  origin: string
): Promise<{ latitude: number; longitude: number; timezone: string } | null> {
  const place = [city, state, country].filter(Boolean).join(', ');
  if (!place.trim()) return null;
  try {
    const url = `${origin}/api/geocode?place=${encodeURIComponent(place)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data ?? json;
    if (data?.latitude != null && data?.longitude != null && data?.timezone) {
      return {
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        timezone: String(data.timezone),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Pre-processing layer for onboarding only: transforms problem_statement into a structured
 * problem_context optimized for astrological timing, alignment, and decision-phase evaluation.
 * Used only immediately before runAstroCompute. On failure, returns the original problem_statement.
 */
export async function intentStructuringForAstro(problem_statement: string): Promise<string> {
  const raw = (problem_statement ?? '').trim();
  if (!raw) return raw;

  const systemContent = `This layer must convert the user's problem into a deeper, timing-aware, alignment-focused analytical context so the Astro engine evaluates the situation across meaningful life-phase dimensions.

This is NOT a summary. This is NOT advice. This is NOT prediction. This is an intent expansion layer.

Output requirements:
3–5 lines only. Analytical. Neutral. No storytelling. No emotional tone. No mystical language. No solutions. No new facts added. No assumptions about outcome. No bullets. No labels.

Primary task:
Infer the underlying nature of the user's concern and expand it into a multi-dimensional evaluation request for the astrology system.

Silently detect intent type from the problem statement (do NOT name the intent in the output). Possible patterns include:
Action decision uncertainty. Timing curiosity. Outcome/success curiosity. Relationship/person-related concern. Career/growth direction. Personal struggle/heavy phase. Life path confusion. General uncertainty.

Then expand the context so the astrology engine evaluates the situation across relevant dimensions.

Core evaluation dimensions that may be invoked when relevant:
Timing readiness. Growth phase strength. Resistance factors. Recognition potential. Direction alignment. Role suitability. Stability vs volatility. Momentum vs delay nature. Effort alignment sensitivity. Opportunity strength/sensitivity. Phase window significance.

Intent-based emphasis logic (internal guidance only):

If the concern involves success, outcome, research, startup, or idea:
Focus more on: growth, recognition, timing, resistance, role fit, direction alignment, stability, opportunity strength.

If the concern involves a decision to act:
Focus more on: timing readiness, resistance, stability, opportunity sensitivity, momentum nature, effort alignment.

If the concern is about timing:
Focus more on: phase windows, readiness, movement cycles, delay vs momentum, resistance periods.

If another person is involved:
Include emphasis on: compatibility dynamics, effort alignment, emotional timing, stability.

If the concern is career/growth direction:
Focus on: direction alignment, role suitability, growth phase, timing readiness, recognition potential.

If the concern reflects struggle, confusion, or stagnation:
Focus on: life-phase interpretation, resistance cycles, stability shifts, gradual movement phases.

Important constraints:
Do NOT simulate timelines (no 3 months / 2 years / 5 years). Do NOT state gain/loss outcomes. Do NOT predict success or failure. Do NOT ask questions. Do NOT address the user directly. Do NOT use their name.

Instead, convert the problem into a structured analytical framing that invites evaluation of timing, alignment, movement, resistance, and potential phase significance around the situation.

Tone example guidance (not to copy):
"User is exploring an intellectual pursuit and is uncertain about its long-term potential. Frame evaluation around timing readiness, growth cycles, resistance factors, recognition phases, and alignment with direction and role suitability."`;

  const userContent = `User's problem statement:\n"${raw}"\n\nProduce the analytical problem_context for timing/alignment evaluation.`;

  try {
    const llm = await createResponse(
      {
        model: 'gpt-4o-mini',
        input: [
          { role: 'system', content: systemContent },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 220,
      },
      'onboarding'
    );
    const normalized = normalizeResponse(llm);
    const refined = normalized.content?.trim();
    if (refined && refined.length > 0) return refined;
  } catch (err) {
    console.warn('[onboarding] intentStructuringForAstro failed, using raw problem_statement:', err);
  }
  return raw;
}

/** Astro result shape stored in thread metadata (from runAstroCompute). */
export interface AstroResultMeta {
  gain_signal?: string;
  risk_signal?: string;
  phase_signal?: string;
  confidence?: number;
}

/**
 * Generate Destiny Lens insight from thread metadata astro_result.
 * Output: Paragraph 1 (response) + Paragraph 2 (curiosity) + Paragraph 3 (short guiding line). Same structure and signal logic; tone simplified for clarity.
 */
export async function generateDestinyLensInsightBlocks(
  astroResult: AstroResultMeta,
  problemContext: string,
  languageToUse: string
): Promise<string> {
  const gain = astroResult.gain_signal ?? '';
  const risk = astroResult.risk_signal ?? '';
  const phase = astroResult.phase_signal ?? '';
  const confidence = astroResult.confidence ?? 0;

  const systemContent = `${CRITICAL_LANGUAGE_RULE(languageToUse)}You are an interpreter reading astrological signals and turning them into a calm, clear, observational reading.

You are NOT: a coach, strategist, motivational speaker, business advisor, or psychologist. You interpret only what the chart suggests.

INPUT CONTEXT AVAILABLE TO YOU:

Phase signal: ${phase || '—'}
Gain signal: ${gain || '—'}
Risk signal: ${risk || '—'}
Confidence: ${confidence}
The user's problem summary: ${problemContext || 'Not specified.'}

Signal handling: Never mention confidence directly or state numbers or probability. Use confidence only to adjust tone. Translate gain into support, alignment, strengthening movement. Translate risk into resistance, instability, friction, misalignment. Base interpretation only on these signals.

ABSOLUTE PROHIBITIONS

Do NOT introduce: business, market, growth, users, competition, productivity, strategy, motivation, success/failure outcomes, urgency.
You are interpreting the chart, not the real world.

LANGUAGE SIMPLIFICATION (STRONG)

Tone: very easy to understand, natural, conversational, short sentences, clear meaning, emotionally calm.
Avoid: complex words, long poetic phrases, heavy cosmic vocabulary, abstract metaphors.
BAD style: "Cosmic fabric, celestial movement, unseen forces shaping destiny"
GOOD style: "Your chart shows movement starting in this area, but some resistance is still present."
Use chart language (phase, alignment, resistance, movement, stability, timing, cycles) in simple, clear sentences.

OUTPUT STRUCTURE (STRICT)

Paragraph 1, then a blank line, then Paragraph 2, then a blank line, then Paragraph 3 (one short line).
No bullets, labels, headings, or extra commentary. No names.

PARAGRAPH 1 — RESPONSE TO THE USER'S PROBLEM

Respond directly to the user's problem. Based only on astro signals. Calm, grounded, simple. No advice. No business language. No outcomes. No predictions. If signals are supportive, reflect quiet strengthening. If signals show friction, gently indicate limitation. Never be harsh or predictive.

PARAGRAPH 2 — CURIOSITY (SIGNAL-DRIVEN)

Pick 1–2 strongest signals tied to the problem. Turn them into a clear curiosity hook. Ask if the user would like to understand more about that specific area. No philosophical questions. No abstract wording. Curiosity must be tied to the signals (e.g. timing, direction, resistance cycles, stability, alignment).

PARAGRAPH 3 — FINAL GUIDING LINE

One short, simple, clear line. Explain what continuing will do: deeper clarity or deeper understanding. Guide the user to choose from the options shown below. Example tone: "If you feel drawn to explore this further, you can continue by choosing one of the options below."
Do NOT: mention plan names, sound salesy, sound pushy, use dramatic language, use mystical metaphors.
The wording of this line should be dynamic each time; the intent stays the same: gently suggest going deeper and guide the user to choose from the options shown. Do not use fixed repeated phrasing.

MULTI-LANGUAGE

When responding in any supported language: speak like a native speaker. Do NOT translate word-by-word. Keep it simple and natural. Keep sentence length short. Maintain the same clarity level as English.

CORE PRINCIPLE

Every word must come from: chart signals → interpretation → curiosity. Never from logic, outcomes, or real-world analysis.`;

  const llm = await createResponse(
    {
      model: 'gpt-4-turbo',
      input: [
        { role: 'system', content: systemContent },
        { role: 'user', content: 'Generate the Destiny Lens insight blocks.' },
      ],
      temperature: 0.6,
    },
    'onboarding'
  );
  const normalized = normalizeResponse(llm);
  const text = normalized.content?.trim() ?? '';
  return (
    text ||
    [
      "Your chart suggests this is a phase where movement around this area is beginning to take shape, with stability developing gradually over time.",
      "There are deeper factors around timing and direction that can influence how this phase supports you. Would you like to understand those more clearly?",
      "If you feel drawn to explore this further, you can continue by choosing one of the options below.",
    ].join('\n\n')
  );
}
