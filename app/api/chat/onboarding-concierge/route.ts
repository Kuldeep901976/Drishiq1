/**
 * Onboarding Concierge — Pre-chat greeter.
 * Uses PersistentThreadManager + chat_threads + chat_messages only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PersistentThreadManager } from '@/packages/core/persistent-thread-manager';
import {
  getOrCreateTempUser,
  getTempUser,
  updateTempUser,
  ensureTenantForTempUser,
  computeIdentityHash,
  type LanguageSource,
} from '@/lib/onboarding-concierge/data-store';
import { createServiceClient } from '@/lib/supabase';
import { createResponse, normalizeResponse } from '@/lib/responses/responsesClient';
import { getVisitorContext } from '@/lib/visitor/getVisitorContext';
import { getTimeOfDay } from '@/lib/visitor/timezone';
import { normalizeLanguage, getLanguageForIndiaCity, getRegionLanguages } from '../../../../lib/onboarding-concierge/regional-languages';
import { saveSectionSummary, resolveSectionForGreeter } from '@/lib/chat/sectionMemory';
import { formatOmnivyraResponseForUser } from '@/lib/omnivyra';
import {
  buildBoundedInputFromHandoff,
  runLocalBounded,
} from '@/lib/omnivyra/local-bounded';
import { runAstroCompute } from '@/lib/astro/astro-client';

/** Email: something@something.domain (safe, non-capturing beyond the match). */
const EMAIL_REGEX = /\S+@\S+\.\S+/;
/** Phone: 10–15 digits; allow spaces, +, -, () in the string; take longest digit run in that range. */
function detectPhoneFromText(text: string): string | null {
  const digitRuns = text.split(/\D+/).filter(Boolean);
  const run = digitRuns.find((r) => r.length >= 10 && r.length <= 15);
  return run ?? null;
}
function detectEmailFromText(text: string): string | null {
  const m = text.match(EMAIL_REGEX);
  return m ? m[0].trim() : null;
}

/** Fixed number of UDA clarification rounds before completion. No further questions after this. */
const UDA_QUESTION_LIMIT = 5;

/** Order for identity collection. */
const IDENTITY_ORDER = [
  { key: 'name' as const, label: 'Name' },
  { key: 'issue' as const, label: 'Why they came' },
  { key: 'age' as const, label: 'Life stage' },
  { key: 'gender' as const, label: 'Gender (if needed)' },
];

function getIdentityCollectionState(
  name: string | null | undefined,
  issue: string | null | undefined,
  age: string | null | undefined,
  gender: string | null | undefined
): { alreadyCollected: string[]; stillNeed: string[] } {
  const values = { name: name?.trim(), issue: issue?.trim(), age: age?.trim(), gender: gender?.trim() };
  const alreadyCollected = IDENTITY_ORDER.filter((o) => values[o.key]).map((o) => o.label);
  const stillNeed = IDENTITY_ORDER.filter((o) => !values[o.key]).map((o) => o.label);
  return { alreadyCollected, stillNeed };
}

/** Next identity field to collect (deterministic). Includes phone verification checkpoint: phone_required, awaiting_otp, verified_ready_for_omnivyra. */
export type NextIdentityGoal =
  | 'name'
  | 'problem'
  | 'age'
  | 'gender_confirm'
  | 'email'
  | 'phone'
  | 'complete'
  | 'phone_required'
  | 'awaiting_otp'
  | 'verified_ready_for_omnivyra';

function resolveNextIdentityField(values: {
  name?: string | null;
  problem?: string | null;
  age_range?: string | null;
  gender?: string | null;
  email?: string | null;
  phone?: string | null;
}): NextIdentityGoal {
  const name = values.name?.trim() || null;
  const problem = values.problem?.trim() || null;
  const age_range = values.age_range?.trim() || null;
  const gender = values.gender?.trim() || null;
  const email = values.email?.trim() || null;
  const phone = values.phone?.trim() || null;

  if (!name) return 'name';
  if (!problem) return 'problem';
  if (!age_range) return 'age';
  if (!gender) return 'gender_confirm';

  // Email only after name, problem, age_range, gender all exist
  if (!email) return 'email';
  // Phone only after email exists
  if (!phone) return 'phone';
  return 'complete';
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Skip OTP only if phone is verified and last interaction within last 7 days. */
function shouldSkipOtp(tempUser: { phone_verified?: boolean; updated_at?: string } | null): boolean {
  if (!tempUser) return false;
  if (tempUser.phone_verified !== true) return false;
  const updatedAt = tempUser.updated_at ? new Date(tempUser.updated_at).getTime() : 0;
  return updatedAt >= Date.now() - SEVEN_DAYS_MS;
}

/** Build Known / Missing identity block for system prompt. Only known values go under Known; only missing labels under Missing. Email/Phone listed after Name, Problem, Age, Gender. */
function buildIdentityValuesBlock(
  name: string | null | undefined,
  problemStatement: string | null | undefined,
  ageRange: string | null | undefined,
  gender: string | null | undefined,
  city: string | null | undefined,
  email?: string | null,
  phone?: string | null
): string {
  const n = name?.trim() || null;
  const p = problemStatement?.trim() || null;
  const a = ageRange?.trim() || null;
  const g = gender?.trim() || null;
  const c = city?.trim() || null;
  const e = email?.trim() || null;
  const ph = phone?.trim() || null;

  const knownLines: string[] = [];
  if (n) knownLines.push(`* Name: ${n}`);
  if (a) knownLines.push(`* Age range: ${a}`);
  if (g) knownLines.push(`* Gender: ${g}`);
  if (p) knownLines.push(`* Problem: ${p}`);
  if (c) knownLines.push(`* City: ${c}`);
  if (e) knownLines.push(`* Email: ${e}`);
  if (ph) knownLines.push(`* Phone: ${ph}`);

  const missingLabels: string[] = [];
  if (!n) missingLabels.push('Name');
  if (!p) missingLabels.push('Why they came');
  if (!a) missingLabels.push('Life stage');
  if (!g) missingLabels.push('Gender (if needed)');
  if (!e) missingLabels.push('Email');
  if (!ph) missingLabels.push('Phone');

  const knownBlock =
    knownLines.length > 0
      ? `Known identity details:\n${knownLines.join('\n')}`
      : '';
  const missingBlock =
    missingLabels.length > 0
      ? `Missing identity details:\n${missingLabels.map((l) => `* ${l}`).join('\n')}`
      : 'Missing identity details: None.';

  if (!knownBlock) return missingBlock;
  return `${knownBlock}\n\n${missingBlock}`;
}

/** Optional context for time-aware and geo rapport. Passed into generateGreeterMessage for prompt intelligence only. */
export interface RapportContext {
  city?: string | null;
  timeOfDay?: string;
  visit_count?: number;
  isReturningVisit?: boolean;
}

export async function generateGreeterMessage(
  prompt: string,
  languageToUse: string,
  collectionContext?: { alreadyCollected: string[]; stillNeed: string[] },
  identityValuesBlock?: string,
  nextIdentityGoal?: NextIdentityGoal,
  rapportContext?: RapportContext
): Promise<string> {
  const collectionInstruction =
    collectionContext &&
    `Collect in this order: 1) Name, 2) Why they came, 3) Life stage, 4) Gender (only if needed).
Already collected: ${collectionContext.alreadyCollected.length ? collectionContext.alreadyCollected.join(', ') : 'None'}.
Still need: ${collectionContext.stillNeed.length ? collectionContext.stillNeed.join(', ') : 'None'}.
When "Still need" is not empty, ask naturally for the next missing item without repeating what is already collected.`;

  const identityBlockSection =
    identityValuesBlock && identityValuesBlock.trim()
      ? `\n${identityValuesBlock.trim()}\n\nNever ask again for any identity detail that already has a value.\nUse known values naturally in conversation when appropriate.\nAsk only for the next missing identity detail.\n\nEmail and phone are sensitive fields.\nOnly ask for them after trust is built and identity basics are known.\nIf already provided, do not ask again.\n`
      : '';

  const goal = nextIdentityGoal ?? 'name';
  const goalBlock = `Current collection goal: ${goal}

Focus on collecting ONLY the current goal.
Do not jump ahead.
Do not ask for email or phone before identity basics are known.`;

  const goalSpecificInstruction =
    goal === 'gender_confirm'
      ? `\nDo not ask "What is your gender?". Instead confirm naturally using context. Example: "I may be mistaken, but should I refer to you as he?"`
      : goal === 'complete' || goal === 'verified_ready_for_omnivyra'
        ? `\nStop asking identity questions. Shift to guidance and support. You may summarize what you know about the user naturally.`
        : goal === 'phone_required'
          ? `\nAsk naturally for a phone number so we can reach them. One sentence.`
          : goal === 'awaiting_otp'
            ? `\nDo not ask for more identity. The user is verifying their phone via OTP. Acknowledge briefly and wait.`
            : '';

  const identityConfirmationBlock =
    goal === 'gender_confirm' || goal === 'email'
      ? `

IDENTITY CONFIRMATION RULE:
If name, problem, and age_range are known, and this confirmation has not yet been done in this session, briefly reflect what you understand about the user in one natural sentence and allow them to correct you.

Example tone:
"So if I understood right, Ram — you're in your mid-20s and dealing with work stress. Did I get that right?"

Rules:
- Do NOT sound like a form summary
- Do NOT list fields
- Keep it conversational
- Do this only once per session
- If the user corrects something, accept and continue naturally

City: If city is known, you may include it lightly (e.g. "...from Roorkee..."). Optional, not required.

Gender: If gender is NOT known, do NOT include it. If gender is inferred but not confirmed, you may phrase neutrally.

Do not repeat identity confirmation later in the session.

If the user corrects: accept the correction naturally and continue with the next goal.`
      : '';

  const empathicReflectionBlock = `

EMPATHIC REFLECTION RULE:
Before asking the next question, briefly acknowledge what the user just shared in one natural sentence.

Examples:
- "That sounds stressful."
- "I can see why that would feel overwhelming."
- "Got it, that makes sense."
- "Thanks for sharing that."

Guidelines:
- Keep it to one short sentence.
- Do not repeat the user's words verbatim.
- Do not summarize in a robotic way.
- Do not be overly emotional.
- Then smoothly continue toward the current collection goal.

Sound warm, present, and attentive. The user should feel heard, not processed.

Do not reflect in every single message if the user's message was only a short factual answer like a name or age. Use judgment.

Example patterns by context:
- If user shares problem: reflect emotion (e.g. "That sounds really hard.").
- If user gives name: light social acknowledgment (e.g. "Nice to meet you.").
- If user corrects info: appreciative acknowledgment (e.g. "Thanks for the correction.").`;

  const rc = rapportContext;
  const rapportContextBlock =
    rc &&
    `Rapport context (use for situational awareness only):
City: ${rc.city ?? 'unknown'}
Time of day (user's local): ${rc.timeOfDay ?? 'unknown'}
Visit count: ${rc.visit_count ?? 1}
Returning visit: ${rc.isReturningVisit ? 'yes' : 'no'}`;

  const rapportInstructions = `
Opening: Use the user's local time and city to open naturally. Do this only once at the start of a session. Examples: "Good morning in Roorkee." "Good evening in Ghaziabad."

Location: If this is within the first 3–4 assistant replies, and a city is known, you may include one brief, natural observation related to the user's location (e.g. growth pace, lifestyle, climate, student or work culture). Do this only once per session. Do NOT repeat location observations later.

Self-introduction: If the user has shared why they came (problem_statement), briefly introduce your role in one sentence before asking the next question. Example: "I help people make sense of situations like this." Do NOT introduce before the problem is known.

Capability: After the user has shared why they came, you may add one soft capability line (e.g. "I can help you break this down and figure out next steps."). No product pitch, no features, no technical claims, no long descriptions.`;

  const systemContent = `You MUST respond ONLY in this language: ${languageToUse}.

You are DrishiQ.

You are not a chatbot. You are a perceptive, emotionally intelligent human guide.

Within at most 6 exchanges, naturally understand (in this order): Name, why they came, life stage, gender (only if needed).
${collectionInstruction ? `\n${collectionInstruction}\n` : ''}${identityBlockSection}

${goalBlock}${goalSpecificInstruction}${identityConfirmationBlock}${empathicReflectionBlock}
${rapportContextBlock ? `\n${rapportContextBlock}\n${rapportInstructions}` : ''}

Never ask like a form.
Max 2 sentences per reply.
Warm, dignified, slightly witty tone.`;

  const llm = await createResponse(
    {
      model: 'gpt-4-turbo',
      input: [
        { role: 'system', content: systemContent },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    },
    'onboarding'
  );

  const normalized = normalizeResponse(llm);
  return normalized.content?.trim() || '';
}

/**
 * Generate a short bridge message (warm, reflective) while pausing to synthesize.
 * Used when UDA question limit is reached, before sending final understanding.
 */
async function generateUdaBridgeMessage(languageToUse: string): Promise<string> {
  const systemContent = `You MUST respond ONLY in this language: ${languageToUse}.
Output a single short sentence the assistant says while pausing to put together what they understood.
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
function isEmotionallyHeavy(text: string): boolean {
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
async function generateUdaInvitationMessage(languageToUse: string): Promise<string> {
  const systemContent = `You MUST respond ONLY in this language: ${languageToUse}.
Output ONE short natural sentence. Tone: reflective, gentle, perceptive, optional.
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
 * Destiny Lens: positive interest intent (yes, continue, explore, etc.). Lightweight, case-insensitive.
 */
function isDestinyLensPositiveInterest(text: string): boolean {
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

/**
 * Destiny Lens: negative intent (no, skip, not now, later). Checked first in choice handling.
 */
function isDestinyLensNegative(text: string): boolean {
  const lower = text.toLowerCase().trim();
  const negative = ['no', 'skip', 'not now', 'later'];
  return negative.some((k) => lower.includes(k));
}

/**
 * Destiny Lens choice: negative takes precedence. Returns null if unclear.
 */
function getDestinyLensChoice(text: string): 'positive' | 'negative' | null {
  if (isDestinyLensNegative(text)) return 'negative';
  if (isDestinyLensPositiveInterest(text)) return 'positive';
  return null;
}

/**
 * Destiny Lens introduction. Generated via createResponse. Tone: reflective, suggestive, perceptive, optional.
 * Content: timing/life phases, offer "Destiny Lens" (patterns through birth details), deeper clarity, user can choose.
 * End with choice: "Would you like to explore this perspective, or should we continue with what we've understood so far?"
 */
async function generateDestinyLensIntroMessage(languageToUse: string): Promise<string> {
  const systemContent = `You MUST respond ONLY in this language: ${languageToUse}.
Write a short paragraph. Tone: reflective, suggestive, perceptive, optional.
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
 * Must ask for: date (YYYY-MM-DD), time (24h HH:MM or HH:MM:SS), place (City, State, Country).
 * Include one example: 1995-08-21, 08:00:03, New York, New York, USA.
 * Mention gently: if time of birth is not known, we can continue without this lens.
 */
async function generateBirthDetailsMessage(languageToUse: string): Promise<string> {
  const systemContent = `You MUST respond ONLY in this language: ${languageToUse}.
Ask the user for birth details in a warm, clear way. You must request:
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

/** Parsed birth details from user message (comma-separated: date, time, city, state, country). */
const DOB_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
/** 24-hour HH:MM or HH:MM:SS. */
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
 * Supports extra spaces; trims all parts. Returns null if not exactly 5 parts or validation fails.
 */
function parseBirthDetails(text: string): ParsedBirthDetails | null {
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
 * origin = request origin (e.g. new URL(req.url).origin).
 */
async function resolveBirthPlaceGeo(
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
 * Does not change UDA, Greeter, or data collection. Used only immediately before runAstroCompute.
 * On failure, returns the original problem_statement so the Astro call still succeeds.
 */
async function intentStructuringForAstro(problem_statement: string): Promise<string> {
  const raw = (problem_statement ?? '').trim();
  if (!raw) return raw;

  const systemContent = `You are an intent expansion layer. Your only job is to convert the user's problem statement into a deeper, timing-aware, alignment-focused analytical context so the Astro engine can evaluate the situation across meaningful life-phase dimensions.

This is NOT a summary. This is NOT advice. This is NOT prediction. This is an intent expansion layer.

OUTPUT REQUIREMENTS:
3–5 lines only. Analytical. Neutral. No storytelling. No emotional tone. No mystical language. No solutions. No new facts added. No assumptions about outcome. No bullets. No labels.

PRIMARY TASK:
Infer the underlying nature of the user's concern and expand it into a multi-dimensional evaluation request for the astrology system.

Silently detect intent type from the problem statement (do NOT name the intent in the output). Possible patterns include:
Action decision uncertainty; timing curiosity; outcome/success curiosity; relationship/person-related concern; career/growth direction; personal struggle/heavy phase; life path confusion; general uncertainty.

Then expand the context so the astrology engine evaluates the situation across relevant dimensions.

CORE EVALUATION DIMENSIONS (invoke when relevant):
Timing readiness; growth phase strength; resistance factors; recognition potential; direction alignment; role suitability; stability vs volatility; momentum vs delay nature; effort alignment sensitivity; opportunity strength/sensitivity; phase window significance.

INTENT-BASED EMPHASIS (internal guidance only; do not label in output):

If the concern involves success, outcome, research, startup, or idea: focus more on growth, recognition, timing, resistance, role fit, direction alignment, stability, opportunity strength.

If the concern involves a decision to act: focus more on timing readiness, resistance, stability, opportunity sensitivity, momentum nature, effort alignment.

If the concern is about timing: focus more on phase windows, readiness, movement cycles, delay vs momentum, resistance periods.

If another person is involved: include emphasis on compatibility dynamics, effort alignment, emotional timing, stability.

If the concern is career/growth direction: focus on direction alignment, role suitability, growth phase, timing readiness, recognition potential.

If the concern reflects struggle, confusion, or stagnation: focus on life-phase interpretation, resistance cycles, stability shifts, gradual movement phases.

CONSTRAINTS:
Do NOT simulate timelines (no 3 months / 2 years / 5 years). Do NOT state gain/loss outcomes. Do NOT predict success or failure. Do NOT ask questions. Do NOT address the user directly. Do NOT use their name.

Convert the problem into a structured analytical framing that invites evaluation of timing, alignment, movement, resistance, and potential phase significance around the situation.

Tone example (style guidance only; do not copy): "User is exploring an intellectual pursuit and is uncertain about its long-term potential. Frame evaluation around timing readiness, growth cycles, resistance factors, recognition phases, and alignment with direction and role suitability."`;

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
interface AstroResultMeta {
  gain_signal?: string;
  risk_signal?: string;
  phase_signal?: string;
  confidence?: number;
}

/**
 * Impact Framing Layer: 2–3 blocks after UDA + Destiny Lens path (skipped or insights shown).
 * Block 1: Gain frame (relief, clarity, direction, emotional lightness, forward momentum).
 * Block 2: Loss frame (continued pressure, repeated cycles, missed timing, emotional fatigue, opportunity cost).
 * Block 3: Short transition line: "To gain complete clarity, continue and complete your session."
 * Tone: larger than life, personal, perceptive, grounded in their problem; not dramatic, spiritual, or salesy.
 * No headings; blocks separated by blank lines.
 */
async function generateImpactFramingBlocks(
  problemContext: string,
  language: string
): Promise<string> {
  const systemContent = `You MUST respond ONLY in this language: ${language}.

Generate 2–3 short blocks that frame the emotional decision moment for the user. They have already seen their UDA understanding and/or Destiny Lens insights. Do NOT add headings or labels. Separate each block with a blank line.

Tone: Larger than life, personal, perceptive, grounded in their problem. NOT dramatic, NOT spiritual, NOT salesy.

User's situation (ground the framing in this): ${problemContext || 'Not specified.'}

Block 1 — Gain Frame (what they gain if they address the issue now):
Weave in: relief, clarity, regained direction, emotional lightness, forward momentum. One short paragraph. Second person ("you") where natural.

Block 2 — Loss Frame (what they risk if they let it continue):
Weave in: continued pressure, repeated cycles, missed timing, emotional fatigue, opportunity cost. One short paragraph. Second person where natural.

Block 3 — Transition (exactly one short line):
Write a neutral reinforcement line. The meaning must be: "To gain complete clarity, continue and complete your session." Phrase it naturally in the same tone; do not quote that sentence verbatim unless it fits the language.

Output ONLY the 2–3 blocks with blank lines between. No preamble, no bullets.`;

  const llm = await createResponse(
    {
      model: 'gpt-4-turbo',
      input: [
        { role: 'system', content: systemContent },
        { role: 'user', content: 'Generate the impact framing blocks.' },
      ],
      temperature: 0.6,
    },
    'onboarding'
  );
  const normalized = normalizeResponse(llm);
  const text = normalized.content?.trim() ?? '';
  return (
    text ||
    "Addressing this now can bring real relief and clarity—and a sense of direction you can build on. Letting it continue often means more of the same pressure and missed timing. To gain complete clarity, continue and complete your session."
  );
}

/**
 * Generate 2–3 separated Destiny Lens insight blocks from thread metadata astro_result.
 * Phase 2 response layer: converts Astro signals into star-anchored interpretation (timing, alignment, phases).
 * Tone: calm, grounded, slightly cosmic; never salesy or motivational.
 */
async function generateDestinyLensInsightBlocks(
  astroResult: AstroResultMeta,
  problemContext: string,
  languageToUse: string
): Promise<string> {
  const gain = astroResult.gain_signal ?? '';
  const risk = astroResult.risk_signal ?? '';
  const phase = astroResult.phase_signal ?? '';
  const confidence = astroResult.confidence ?? 0;

  const systemContent = `You MUST respond ONLY in this language: ${languageToUse}.

You are interpreting astrological timing and alignment signals for the user. Your response must feel rooted in cosmic timing and life phases, create curiosity, and hint at deeper insight—without sounding like life coaching, motivation, or a sales pitch.

Astro signals (interpret these in the new style; do not quote verbatim):
- Gain signal: ${gain || '—'}
- Risk signal: ${risk || '—'}
- Phase signal: ${phase || '—'}
- Confidence: ${confidence}

User's situation summary (use for personal anchoring): ${problemContext || 'Not specified.'}

MANDATORY RESPONSE STRUCTURE — follow this flow in 2–3 short paragraphs:

1) Personal anchoring: Acknowledge the user's area of concern using the situation summary above. If a first name is available in that context, you may use it; otherwise refer to "the area you're focused on" or "your situation." Example tone: "The area you're focused on is entering a phase of movement…"

2) Star/phase interpretation: Speak in terms of alignment, forming movement, resistance, transition, slow build, support phases. USE: "phase," "alignment," "timing," "movement," "cycle," "readiness," "shifts." DO NOT use: hype, dreams, regret, motivational language, or business-coaching tone. Weave in the astro signals above in this language.

3) Timing sensitivity: Introduce that timing matters. Examples: "Such phases don't stay open forever." "Movement begins subtly before it becomes visible." "The strength of this period can shape what unfolds next."

4) Curiosity hook: Hint that more clarity exists around exact timing, deeper alignment, hidden factors, direction, or compatibility (if relationship). Examples: "There is more to understand about when this energy strengthens." "The deeper timing of this shift can change how you move forward."

5) Closing invitation (MANDATORY): End with a gentle path invitation. Use adaptive, non-sales language. Base meaning: "If you wish to understand the timing and direction of this path more clearly, step forward with intent — choose First Light for a single glimpse, or Steady Lens for a deeper journey." Phrase it naturally in the response language. Do NOT say: buy, purchase, subscribe, credits, sign up. This must feel like guidance, not selling.

TONE: Calm, grounded, slightly cosmic, insightful. Never pushy, never threatening, no extreme fear language. Length: 2–3 short paragraphs max. Do NOT promise success, predict outcomes, claim certainty, sound like a coach, or sound like marketing. You are interpreting signals, not guaranteeing results.

Output ONLY the 2–3 paragraphs with blank lines between. No preamble, no bullet points, no labels.`;

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
    "The area you're focused on is in a phase where alignment and timing matter. Such phases don't stay open forever; there is more to understand about when this energy strengthens. If you wish to understand the timing and direction of this path more clearly, step forward with intent — choose First Light for a single glimpse, or Steady Lens for a deeper journey."
  );
}

/**
 * Session completion bridge: short, perceptive transition after impact framing.
 * Acknowledges what has surfaced, reinforces partial clarity, suggests full understanding requires completing the session.
 * Tone: grounded, intelligent, not salesy, not urgent, not pushy.
 */
async function generateSessionCompletionBridge(language: string): Promise<string> {
  const systemContent = `You MUST respond ONLY in this language: ${language}.

Write a short paragraph (2–4 sentences) that:
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
const PRICING_BUTTON_OPTIONS: Array<{ id: string; label: string; sublabel: string }> = [
  { id: 'light', label: 'Light', sublabel: '1 Session' },
  { id: 'steady_lens', label: 'Steady Lens', sublabel: '5 Sessions' },
];

/** Plan id → session count. Invalid id returns undefined. */
function mapPlanToSessions(planId: string): number | undefined {
  if (planId === 'light') return 1;
  if (planId === 'steady_lens') return 5;
  return undefined;
}

/** Map onboarding plan id to payment page plan (for redirect URL). Returns null if unknown. */
function mapOnboardingPlanToPaymentPlan(planId: string): string | null {
  if (planId === 'light') return 'first-light';
  if (planId === 'steady_lens') return 'steady-lens';
  return null;
}

/**
 * Generate final understanding summary from conversation history (core issue, emotional context, direction).
 * Persisted as temp_users.problem_statement for Destiny Lens, Astro, main chat.
 */
async function generateUdaFinalUnderstanding(
  history: Array<{ role: string; content: string }>,
  languageToUse: string
): Promise<string> {
  const conversationText = history
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');
  const systemContent = `You MUST respond ONLY in this language: ${languageToUse}.
Based on the conversation below, write one short paragraph that summarizes:
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

// ------------------------------------------------
// GET — First greeting
// ------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Onboarding] GET /api/chat/onboarding-concierge called');
    }
    const visitorId = req.headers.get('x-visitor-id') || 'anon';
    const deviceId = req.headers.get('x-device-id') ?? '';
    const clientIp =
      req.headers.get('x-client-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      'unknown';

    const headerCity = req.headers.get('x-geo-city');
    const headerCountry = req.headers.get('x-geo-country');
    const headerCountryCode = req.headers.get('x-geo-country-code');
    const headerRegionCode = req.headers.get('x-geo-region-code');

    // Persist geo from frontend (detect-location) so DB has correct region for language rules; forward session + cookie for first-touch
    if (visitorId !== 'anon' && deviceId) {
      const ensureHeaders: Record<string, string> = {
        'x-visitor-id': visitorId,
        'x-device-id': deviceId,
        'x-client-ip': clientIp,
      };
      const sessionId = req.headers.get('x-session-id');
      const cookieLang = req.cookies.get('drishiq_lang')?.value;
      if (sessionId) ensureHeaders['x-session-id'] = sessionId;
      if (cookieLang) ensureHeaders['x-cookie-lang'] = cookieLang;
      if (headerCity) ensureHeaders['x-geo-city'] = headerCity;
      if (headerCountry) ensureHeaders['x-geo-country'] = headerCountry;
      if (headerCountryCode) ensureHeaders['x-geo-country-code'] = headerCountryCode;
      if (headerRegionCode) ensureHeaders['x-geo-region-code'] = headerRegionCode;
      await fetch(`${req.nextUrl.origin}/api/visitor/ensure`, {
        method: 'POST',
        headers: ensureHeaders,
      });
    }

    const ctx = await getVisitorContext(visitorId);

    // Hydrate display-only geo if DB empty
    if (!ctx.city && headerCity) ctx.city = headerCity;
    if (!ctx.country && headerCountry) ctx.country = headerCountry;

    // Fetch temp_user early for language lock (resolve once per temp_user/thread)
    const threadManager = new PersistentThreadManager();
    let thread = await threadManager.getActiveThreadByVisitor('pre_chat', visitorId);
    if (!thread) {
      thread = await threadManager.createThread('pre_chat', { visitorId });
    }
    const threadId = thread.id;

    let tempUser = await getOrCreateTempUser(visitorId, deviceId);
    if (tempUser) {
      const supabase = createServiceClient();
      await supabase
        .from('chat_threads')
        .update({
          temp_user_id: tempUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', threadId);
    }

    // Language: use locked if set, else resolve once and save (stops recomputing every request)
    let chatLanguage = 'en';
    let hintLanguage = 'en';
    let langSource: LanguageSource | string = 'fallback';

    const cookieLang = req.cookies.get('drishiq_lang')?.value;
    const browserLangHeader = req.headers.get('accept-language');
    const browserLang = browserLangHeader
      ? browserLangHeader.split(',')[0]?.split('-')[0]
      : null;
    let headerGeoLang: string | null = null;
    if (headerCountryCode && headerRegionCode) {
      headerGeoLang = normalizeLanguage(getRegionLanguages(headerCountryCode, headerRegionCode).primary);
    } else if (headerCountry?.trim().toLowerCase() === 'india' && headerCity) {
      headerGeoLang = normalizeLanguage(getLanguageForIndiaCity(headerCity));
    }
    const effectiveGeoLang = ctx.language || headerGeoLang || null;
    const geoLangForHint =
      (headerGeoLang && headerGeoLang !== 'en')
        ? headerGeoLang
        : (ctx.language && ctx.language !== 'en')
          ? ctx.language
          : (ctx.geoSuggestedLanguage && ctx.geoSuggestedLanguage !== 'en')
            ? ctx.geoSuggestedLanguage
            : 'en';

    if (tempUser?.language_locked && tempUser?.locked_language) {
      chatLanguage = normalizeLanguage(tempUser.locked_language);
      langSource = (tempUser.language_source as LanguageSource) ?? 'fallback';
      hintLanguage = chatLanguage === effectiveGeoLang ? 'en' : geoLangForHint;
    } else {
      // Resolve once: cookie → browser → geo → fallback
      if (cookieLang) {
        chatLanguage = normalizeLanguage(cookieLang);
        langSource = 'cookie';
        hintLanguage = chatLanguage === effectiveGeoLang ? 'en' : geoLangForHint;
      } else if (browserLang) {
        chatLanguage = normalizeLanguage(browserLang);
        langSource = 'browser';
        hintLanguage = chatLanguage === effectiveGeoLang ? 'en' : geoLangForHint;
      } else if (ctx.language) {
        chatLanguage = normalizeLanguage(ctx.language);
        hintLanguage = 'en';
        langSource = 'geo';
      }
      if (tempUser) {
        await updateTempUser(tempUser.id, {
          locked_language: chatLanguage,
          language_locked: true,
          language_source: langSource,
        });
      }
    }

    const showLanguageHelper = true;

    const collectionState = getIdentityCollectionState(
      tempUser?.name ?? null,
      tempUser?.problem_statement ?? null,
      tempUser?.age_range ?? null,
      tempUser?.gender ?? null
    );

    const timeOfDay = getTimeOfDay(ctx.timezone);

    const prompt = `
City: ${ctx.city ?? 'unknown'}
Country: ${ctx.country ?? 'unknown'}
Region: ${ctx.region_code ?? 'unknown'}
Timezone: ${ctx.timezone ?? 'unknown'}
Time of day (visitor): ${timeOfDay}
Visit count: ${ctx.visit_count}

Greet naturally.
`;

    const identityValuesBlock = buildIdentityValuesBlock(
      tempUser?.name ?? null,
      tempUser?.problem_statement ?? null,
      tempUser?.age_range ?? null,
      tempUser?.gender ?? null,
      ctx.city ?? null,
      tempUser?.email ?? null,
      tempUser?.phone ?? null
    );

    const nextIdentityGoal = resolveNextIdentityField({
      name: tempUser?.name ?? null,
      problem: tempUser?.problem_statement ?? null,
      age_range: tempUser?.age_range ?? null,
      gender: tempUser?.gender ?? null,
      email: tempUser?.email ?? null,
      phone: tempUser?.phone ?? null,
    });

    const rapportContext: RapportContext = {
      city: ctx.city ?? null,
      timeOfDay,
      visit_count: ctx.visit_count,
      isReturningVisit: (ctx.visit_count ?? 1) > 1,
    };

    const message = await generateGreeterMessage(
      prompt,
      chatLanguage,
      collectionState,
      identityValuesBlock,
      nextIdentityGoal,
      rapportContext
    );

    await threadManager.addMessage(threadId, { role: 'assistant', content: message });

    return NextResponse.json({
      success: true,
      threadId,
      message,
      showLanguageHelper,
      language: chatLanguage,
      geoLanguage: ctx.language || 'en',
      geoSuggestedLanguage: hintLanguage,
      langSource,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[onboarding-concierge GET]', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ------------------------------------------------
// POST — Conversation turn
// ------------------------------------------------
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const threadId = body.threadId;
  const messageText = body.message;

  if (!threadId) {
    return NextResponse.json({ success: false, error: 'threadId is required' }, { status: 400 });
  }

  const threadManager = new PersistentThreadManager();
  const thread = await threadManager.getThread(threadId);
  if (!thread) {
    return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 });
  }

  let origin = '';
  try {
    origin = new URL(req.url).origin;
  } catch {
    origin = process.env.NEXT_PUBLIC_APP_URL ?? '';
  }

  const visitorId = req.headers.get('x-visitor-id') || 'anon';
  const deviceId = req.headers.get('x-device-id') ?? '';

  const planSelected = body.plan_selected != null ? String(body.plan_selected).trim() : '';
  const sessionCount = planSelected ? mapPlanToSessions(planSelected) : undefined;
  if (planSelected && (planSelected === 'light' || planSelected === 'steady_lens') && sessionCount !== undefined) {
    const planTempUser = thread.temp_user_id
      ? await getTempUser(thread.temp_user_id)
      : await getOrCreateTempUser(visitorId, deviceId);
    const planLang = body.language != null && String(body.language).trim() !== ''
      ? normalizeLanguage(String(body.language).trim())
      : (planTempUser?.locked_language ? normalizeLanguage(planTempUser.locked_language) : 'en');
    const timestamp = new Date().toISOString();
    await threadManager.updateMetadata(threadId, {
      selected_plan_id: planSelected,
      selected_session_count: sessionCount,
      plan_selected_at: timestamp,
    });
    if (planTempUser) {
      await updateTempUser(planTempUser.id, {
        selected_plan_id: planSelected,
        selected_session_count: sessionCount,
        purchase_intent_at: timestamp,
      });
    }
    // Direct payment redirect: same geo-based pricing as priceplan; /payment recalculates amount + currency.
    const mappedPlan = mapOnboardingPlanToPaymentPlan(planSelected);
    let payment_redirect_url: string | undefined;
    let signup_redirect_url: string | undefined;
    if (mappedPlan) {
      const ctx = await getVisitorContext(visitorId);
      const rawCountry =
        ctx.country_code
        ?? (ctx.country && ctx.country.length === 2 ? ctx.country : null)
        ?? (planTempUser && 'country' in planTempUser ? (planTempUser as { country?: string }).country : null)
        ?? 'IN';
      const country = String(rawCountry).toUpperCase().slice(0, 2) || 'IN';
      payment_redirect_url = `/payment?plan=${mappedPlan}&category=prelaunch&country=${country}`;
      signup_redirect_url = `/auth/signup?redirect=${encodeURIComponent(payment_redirect_url)}`;
    }
    const confirmLlm = await createResponse(
      {
        model: 'gpt-4-turbo',
        input: [
          {
            role: 'system',
            content: `Respond ONLY in language: ${planLang}. Write a short confirmation (2–3 sentences): acknowledge their plan choice, reinforce that they're moving forward, and prepare them for the next step. Warm, no payment or pricing details.`,
          },
          { role: 'user', content: 'Generate plan selection confirmation.' },
        ],
        temperature: 0.5,
      },
      'onboarding'
    );
    const confirmNorm = normalizeResponse(confirmLlm);
    const confirmMessage =
      confirmNorm.content?.trim() ||
      "You're all set. We'll take you to the next step to complete your session.";
    await threadManager.addMessage(threadId, { role: 'assistant', content: confirmMessage });
    const json: {
      success: boolean;
      threadId: string;
      message: string;
      payment_ready: boolean;
      selected_plan: string;
      session_count: number;
      flow_state: string;
      payment_redirect_url?: string;
      signup_redirect_url?: string;
    } = {
      success: true,
      threadId,
      message: confirmMessage,
      payment_ready: true,
      selected_plan: planSelected,
      session_count: sessionCount,
      flow_state: 'verified_ready_for_omnivyra',
    };
    if (payment_redirect_url !== undefined) json.payment_redirect_url = payment_redirect_url;
    if (signup_redirect_url !== undefined) json.signup_redirect_url = signup_redirect_url;
    return NextResponse.json(json);
  }

  const text = (messageText ?? '').trim();
  await threadManager.addMessage(threadId, { role: 'user', content: text });

  const ctx = await getVisitorContext(visitorId);

  // Step A — Fetch temp_user early for language lock
  let tempUser =
    thread.temp_user_id
      ? await getTempUser(thread.temp_user_id)
      : await getOrCreateTempUser(visitorId, deviceId);

  // Step B — Language: body override > locked > detect once and save
  let languageToUse: string;
  const cookieLang = req.cookies.get('drishiq_lang')?.value;
  const browserLangHeader = req.headers.get('accept-language');
  const browserLang = browserLangHeader ? browserLangHeader.split(',')[0]?.split('-')[0] : null;

  if (body.language != null && String(body.language).trim() !== '') {
    languageToUse = normalizeLanguage(String(body.language).trim());
    if (tempUser) {
      await updateTempUser(tempUser.id, {
        locked_language: languageToUse,
        language_locked: true,
        language_source: 'manual_override',
      });
    }
  } else if (tempUser?.language_locked && tempUser?.locked_language) {
    languageToUse = normalizeLanguage(tempUser.locked_language);
  } else {
    languageToUse = normalizeLanguage(
      cookieLang || browserLang || ctx.language || 'en'
    );
    const language_source: LanguageSource = cookieLang
      ? 'cookie'
      : browserLang
        ? 'browser'
        : ctx.language
          ? 'geo'
          : 'first_message';
    if (tempUser) {
      await updateTempUser(tempUser.id, {
        locked_language: languageToUse,
        language_locked: true,
        language_source,
      });
    }
  }

  let name: string | undefined;
  let issue: string | undefined;
  let age: string | undefined;
  let gender: string | undefined;

  if (/^[a-zA-Z ]{2,30}$/.test(text)) name = text;
  if (text.length > 25) issue = text;
  if (/\b(20s|30s|40s|50\+|\d{2})\b/i.test(text)) age = text;
  if (/(male|female|man|woman|guy|girl)/i.test(text)) gender = text;

  tempUser = await getOrCreateTempUser(visitorId, deviceId, name ?? null, age ?? null, gender ?? null);

  let currentEmail: string | null = null;
  let currentPhone: string | null = null;

  if (tempUser) {
    const identity_status = name && (issue || age || gender) ? 'complete' : 'partial';
    const identity_hash =
      visitorId && deviceId && name && age && gender
        ? computeIdentityHash(visitorId, deviceId, name, age, gender)
        : undefined;

    await updateTempUser(tempUser.id, {
      name,
      age_range: age,
      gender,
      problem_statement: issue,
      identity_status,
      identity_hash,
    });

    if (identity_status === 'complete') {
      await ensureTenantForTempUser(tempUser.id);
    }

    // Contact fields: detect from message; save only if not already present (no overwrite)
    const detectedEmail = detectEmailFromText(text);
    const detectedPhone = detectPhoneFromText(text);
    const hasExistingEmail = !!(tempUser.email?.trim());
    const hasExistingPhone = !!(tempUser.phone?.trim());
    const emailToSave = detectedEmail && !hasExistingEmail ? detectedEmail : undefined;
    const phoneToSave = detectedPhone && !hasExistingPhone ? detectedPhone : undefined;
    currentEmail = emailToSave ?? tempUser.email ?? null;
    currentPhone = phoneToSave ?? tempUser.phone ?? null;
    const contact_status =
      currentEmail && currentPhone ? 'both' : currentEmail ? 'email_only' : currentPhone ? 'phone_only' : 'none';

    if (emailToSave !== undefined || phoneToSave !== undefined || contact_status !== (tempUser.contact_status ?? 'none')) {
      await updateTempUser(tempUser.id, {
        ...(emailToSave !== undefined && { email: emailToSave }),
        ...(phoneToSave !== undefined && { phone: phoneToSave }),
        contact_status,
      });
    }
  }

  const currentName = name ?? tempUser?.name ?? null;
  const currentIssue = issue ?? tempUser?.problem_statement ?? null;
  const currentAge = age ?? tempUser?.age_range ?? null;
  const currentGender = gender ?? tempUser?.gender ?? null;
  if (currentEmail === null) currentEmail = tempUser?.email ?? null;
  if (currentPhone === null) currentPhone = tempUser?.phone ?? null;
  const collectionState = getIdentityCollectionState(currentName, currentIssue, currentAge, currentGender);

  const identityValuesBlock = buildIdentityValuesBlock(
    currentName,
    currentIssue,
    currentAge,
    currentGender,
    ctx.city ?? null,
    currentEmail,
    currentPhone
  );

  const nextIdentityGoal = resolveNextIdentityField({
    name: currentName,
    problem: currentIssue,
    age_range: currentAge,
    gender: currentGender,
    email: currentEmail,
    phone: currentPhone,
  });

  // Phone verification checkpoint: after identity basics, gate on phone + phone_verified (7-day skip)
  const basicsComplete = !!(currentName && currentIssue && currentAge && currentGender);
  let effectiveGoal: NextIdentityGoal = nextIdentityGoal;
  if (basicsComplete) {
    if (!currentPhone) effectiveGoal = 'phone_required';
    else if (!tempUser?.phone_verified || !shouldSkipOtp(tempUser)) effectiveGoal = 'awaiting_otp';
    else effectiveGoal = 'verified_ready_for_omnivyra';
  }

  const flow_state: 'collecting_identity' | 'phone_required' | 'awaiting_otp' | 'verified_ready_for_omnivyra' =
    effectiveGoal === 'phone_required'
      ? 'phone_required'
      : effectiveGoal === 'awaiting_otp'
        ? 'awaiting_otp'
        : effectiveGoal === 'verified_ready_for_omnivyra'
          ? 'verified_ready_for_omnivyra'
          : 'collecting_identity';

  const handoff_ready = effectiveGoal === 'verified_ready_for_omnivyra';
  const handoff_payload = handoff_ready
    ? {
        name: currentName ?? undefined,
        age_range: currentAge ?? undefined,
        gender: currentGender ?? undefined,
        problem_statement: currentIssue ?? undefined,
        language: languageToUse,
        city: ctx.city ?? undefined,
        state: ctx.region_code ?? undefined,
        country: ctx.country ?? undefined,
      }
    : undefined;

  const timeOfDayPost = getTimeOfDay(ctx.timezone);
  const rapportContext: RapportContext = {
    city: ctx.city ?? null,
    timeOfDay: timeOfDayPost,
    visit_count: ctx.visit_count,
    isReturningVisit: (ctx.visit_count ?? 1) > 1,
  };

  const replyPrompt = `User said: "${text}"`;

  let reply: string;
  /** When true, assistant message(s) were already persisted in this request (e.g. completion branch). */
  let repliesAlreadyPersisted = false;
  /** When set, response includes pricing_options for frontend to render 2 buttons (Light, Steady Lens). */
  let pricingOptions: Array<{ id: string; label: string; sublabel: string }> | null = null;

  if (flow_state === 'verified_ready_for_omnivyra' && handoff_payload) {
    const history = await threadManager.getMessages(threadId);
    const udaBoundedComplete =
      (thread.metadata?.uda_bounded_complete as boolean) === true;
    const udaRoundCount =
      (thread.metadata?.uda_round_count as number) ?? 0;

    if (udaBoundedComplete) {
      const destinyLensSkipped =
        (thread.metadata?.destiny_lens_skipped as boolean) === true;
      const destinyLensInterested =
        (thread.metadata?.destiny_lens_interested as boolean) === true;
      const destinyLensIntroShown =
        (thread.metadata?.destiny_lens_intro_shown as boolean) === true;
      const udaEmotionalInvitationShown =
        (thread.metadata?.uda_emotional_invitation_shown as boolean) === true;
      const impactFramingShown =
        (thread.metadata?.impact_framing_shown as boolean) === true;
      const pricingPresented =
        (thread.metadata?.pricing_presented as boolean) === true;
      const destinyLensInsightRendered =
        (thread.metadata?.destiny_lens_insight_rendered as boolean) === true;

      if (impactFramingShown && !pricingPresented) {
        const bridge = await generateSessionCompletionBridge(languageToUse);
        reply = bridge || '';
        pricingOptions = [...PRICING_BUTTON_OPTIONS];
        await threadManager.updateMetadata(threadId, {
          pricing_presented: true,
        });
      } else if (impactFramingShown && pricingPresented) {
        const holdLlm = await createResponse(
          {
            model: 'gpt-4-turbo',
            input: [
              {
                role: 'system',
                content: `Respond ONLY in language: ${languageToUse}. One short sentence: we'll move to the next step once they choose how they'd like to continue. Warm, no questions.`,
              },
              { role: 'user', content: 'Generate.' },
            ],
            temperature: 0.5,
          },
          'onboarding'
        );
        const holdNorm = normalizeResponse(holdLlm);
        reply =
          holdNorm.content?.trim() ||
          "We'll move to the next step once you choose how you'd like to continue.";
      } else if (destinyLensSkipped) {
        const problemContext =
          tempUser?.problem_statement ?? currentIssue ?? '';
        reply = await generateImpactFramingBlocks(
          problemContext,
          languageToUse
        );
        await threadManager.updateMetadata(threadId, {
          impact_framing_shown: true,
        });
      } else if (destinyLensInterested) {
        const existingAstroResult = thread.metadata?.astro_result;
        const hasAstroResult =
          existingAstroResult != null &&
          typeof existingAstroResult === 'object' &&
          'gain_signal' in (existingAstroResult as object);

        if (hasAstroResult && destinyLensInsightRendered) {
          const problemContext =
            tempUser?.problem_statement ?? currentIssue ?? '';
          reply = await generateImpactFramingBlocks(
            problemContext,
            languageToUse
          );
          await threadManager.updateMetadata(threadId, {
            impact_framing_shown: true,
          });
        } else if (hasAstroResult) {
          const problemContext =
            tempUser?.problem_statement ?? currentIssue ?? '';
          reply = await generateDestinyLensInsightBlocks(
            existingAstroResult as AstroResultMeta,
            problemContext,
            languageToUse
          );
          await threadManager.updateMetadata(threadId, {
            destiny_lens_insight_rendered: true,
          });
        } else {
          const parsed = parseBirthDetails(text);
          if (!parsed) {
            await threadManager.updateMetadata(threadId, {
              destiny_lens_skipped: true,
            });
            const graceLlm = await createResponse(
              {
                model: 'gpt-4-turbo',
                input: [
                  {
                    role: 'system',
                    content: `Respond ONLY in language: ${languageToUse}. One short sentence: we'll continue with what we've understood so far. Warm, no questions.`,
                  },
                  { role: 'user', content: 'Generate.' },
                ],
                temperature: 0.5,
              },
              'onboarding'
            );
            const graceNorm = normalizeResponse(graceLlm);
            reply =
              graceNorm.content?.trim() ||
              "We'll continue with what we've understood so far.";
          } else {
            const geo = await resolveBirthPlaceGeo(
              parsed.city,
              parsed.state,
              parsed.country,
              origin
            );
            if (!geo) {
              await threadManager.updateMetadata(threadId, {
                destiny_lens_skipped: true,
              });
              const fallbackLlm = await createResponse(
                {
                  model: 'gpt-4-turbo',
                  input: [
                    {
                      role: 'system',
                      content: `Respond ONLY in language: ${languageToUse}. One short sentence: we couldn't resolve the place; we'll continue with what we've understood. Warm.`,
                    },
                    { role: 'user', content: 'Generate.' },
                  ],
                  temperature: 0.5,
                },
                'onboarding'
              );
              const fallbackNorm = normalizeResponse(fallbackLlm);
              reply =
                fallbackNorm.content?.trim() ||
                "We couldn't resolve that place. We'll continue with what we've understood so far.";
            } else {
              const problemStatement =
                tempUser?.problem_statement ?? currentIssue ?? '';
              const problem_context = await intentStructuringForAstro(problemStatement);
              const astroCall = await runAstroCompute({
                dob_date: parsed.dob_date,
                dob_time: parsed.dob_time,
                latitude: geo.latitude,
                longitude: geo.longitude,
                timezone: geo.timezone,
                problem_context,
                uda_summary: problemStatement,
              });
              const astroPayload =
                astroCall.success && astroCall.data
                  ? {
                      gain_signal: astroCall.data.gain_signal,
                      risk_signal: astroCall.data.risk_signal,
                      phase_signal: astroCall.data.phase_signal,
                      confidence: astroCall.data.confidence,
                    }
                  : null;
              await threadManager.updateMetadata(threadId, {
                astro_result: astroPayload,
              });
              reply =
                "Give me a moment while I look at this through the Destiny Lens.";
            }
          }
        }
      } else if (destinyLensIntroShown) {
        const choice = getDestinyLensChoice(text);
        if (choice === 'positive') {
          await threadManager.updateMetadata(threadId, {
            destiny_lens_interested: true,
          });
          reply = await generateBirthDetailsMessage(languageToUse);
          await threadManager.addMessage(threadId, {
            role: 'assistant',
            content: reply,
          });
          repliesAlreadyPersisted = true;
        } else if (choice === 'negative') {
          await threadManager.updateMetadata(threadId, {
            destiny_lens_skipped: true,
          });
          const holdLlm = await createResponse(
            {
              model: 'gpt-4-turbo',
              input: [
                {
                  role: 'system',
                  content: `Respond ONLY in language: ${languageToUse}. One short sentence: acknowledge their choice and say we'll continue with what we've understood. Warm, no questions.`,
                },
                { role: 'user', content: 'Generate.' },
              ],
              temperature: 0.5,
            },
            'onboarding'
          );
          const holdNorm = normalizeResponse(holdLlm);
          reply =
            holdNorm.content?.trim() ||
            "No problem. We'll continue with what we've understood so far.";
        } else {
          const askLlm = await createResponse(
            {
              model: 'gpt-4-turbo',
              input: [
                {
                  role: 'system',
                  content: `Respond ONLY in language: ${languageToUse}. One short sentence: gently ask whether they'd like to explore the Destiny Lens perspective or continue with what we've understood.`,
                },
                { role: 'user', content: 'Generate.' },
              ],
              temperature: 0.5,
            },
            'onboarding'
          );
          const askNorm = normalizeResponse(askLlm);
          reply =
            askNorm.content?.trim() ||
            "Would you like to explore this perspective, or continue with what we've understood so far?";
        }
      } else if (udaEmotionalInvitationShown) {
        if (isDestinyLensPositiveInterest(text)) {
          const destinyLensIntro = await generateDestinyLensIntroMessage(languageToUse);
          if (destinyLensIntro) {
            await threadManager.addMessage(threadId, {
              role: 'assistant',
              content: destinyLensIntro,
            });
            await threadManager.updateMetadata(threadId, {
              destiny_lens_intro_shown: true,
            });
            reply = destinyLensIntro;
            repliesAlreadyPersisted = true;
          } else {
            reply = "You're all set. We'll look at next steps in a moment.";
          }
        } else {
          const waitLlm = await createResponse(
            {
              model: 'gpt-4-turbo',
              input: [
                {
                  role: 'system',
                  content: `Respond ONLY in language: ${languageToUse}. One short sentence: no pressure, whenever they're ready we can look at next steps. Warm.`,
                },
                { role: 'user', content: 'Generate.' },
              ],
              temperature: 0.5,
            },
            'onboarding'
          );
          const waitNorm = normalizeResponse(waitLlm);
          reply =
            waitNorm.content?.trim() ||
            "No problem. Whenever you're ready, we can look at next steps.";
        }
      } else {
        const holdLlm = await createResponse(
          {
            model: 'gpt-4-turbo',
            input: [
              {
                role: 'system',
                content: `Respond ONLY in language: ${languageToUse}. One short sentence: the user has already received their understanding summary; acknowledge and say we'll look at next steps soon. Warm, no questions.`,
              },
              { role: 'user', content: 'Generate.' },
            ],
            temperature: 0.5,
          },
          'onboarding'
        );
        const holdNorm = normalizeResponse(holdLlm);
        reply =
          holdNorm.content?.trim() ||
          "You're all set from my side. We'll look at next steps in a moment.";
      }
    } else if (udaRoundCount >= UDA_QUESTION_LIMIT) {
      const bridgeMessage = await generateUdaBridgeMessage(languageToUse);
      await threadManager.addMessage(threadId, {
        role: 'assistant',
        content: bridgeMessage,
      });
      await new Promise((r) => setTimeout(r, 1000));
      const finalUnderstanding = await generateUdaFinalUnderstanding(
        history,
        languageToUse
      );
      await threadManager.addMessage(threadId, {
        role: 'assistant',
        content: finalUnderstanding,
      });
      if (tempUser && finalUnderstanding) {
        await updateTempUser(tempUser.id, {
          problem_statement: finalUnderstanding,
        });
      }
      await threadManager.updateMetadata(threadId, {
        uda_bounded_complete: true,
        uda_round_count: UDA_QUESTION_LIMIT,
      });
      const parts: string[] = [bridgeMessage, finalUnderstanding];
      if (isEmotionallyHeavy(finalUnderstanding)) {
        const invitationMessage = await generateUdaInvitationMessage(languageToUse);
        if (invitationMessage) {
          await threadManager.addMessage(threadId, {
            role: 'assistant',
            content: invitationMessage,
          });
          parts.push(invitationMessage);
          await threadManager.updateMetadata(threadId, {
            uda_emotional_invitation_shown: true,
          });
        }
      } else {
        const destinyLensIntro = await generateDestinyLensIntroMessage(languageToUse);
        if (destinyLensIntro) {
          await threadManager.addMessage(threadId, {
            role: 'assistant',
            content: destinyLensIntro,
          });
          parts.push(destinyLensIntro);
          await threadManager.updateMetadata(threadId, {
            destiny_lens_intro_shown: true,
          });
        }
      }
      reply = parts.filter(Boolean).join('\n\n');
      repliesAlreadyPersisted = true;
    } else {
      const boundedInput = buildBoundedInputFromHandoff({
        handoff: handoff_payload,
        threadId,
        userId: tempUser?.id ?? visitorId,
        currentMessage: text,
        history,
      });
      const boundedResult = await runLocalBounded(boundedInput);
      if (boundedResult.success && boundedResult.data) {
        const formatted = formatOmnivyraResponseForUser(boundedResult.data);
        const parts: string[] = [formatted.message?.trim() ?? ''];
        if (formatted.questions?.length) {
          parts.push(formatted.questions.map((q) => `• ${q}`).join('\n'));
        }
        if (formatted.nextStep?.trim()) parts.push(formatted.nextStep.trim());
        reply = parts.filter(Boolean).join('\n\n');
        await threadManager.updateMetadata(threadId, {
          uda_round_count: udaRoundCount + 1,
        });
      } else {
        reply = await generateGreeterMessage(
          replyPrompt,
          languageToUse,
          collectionState,
          identityValuesBlock,
          effectiveGoal,
          rapportContext
        );
      }
    }
  } else {
    reply = await generateGreeterMessage(
      replyPrompt,
      languageToUse,
      collectionState,
      identityValuesBlock,
      effectiveGoal,
      rapportContext
    );
  }

  if (!repliesAlreadyPersisted) {
    await threadManager.addMessage(threadId, { role: 'assistant', content: reply });
  }

  const section = resolveSectionForGreeter(text);
  await saveSectionSummary(threadId, section, '');

  return NextResponse.json({
    success: true,
    threadId,
    message: reply,
    flow_state,
    ...(handoff_ready && { handoff_ready: true, handoff_payload }),
    ...(pricingOptions && { pricing_options: pricingOptions }),
  });
}
