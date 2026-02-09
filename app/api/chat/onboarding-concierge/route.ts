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

  const text = (messageText ?? '').trim();
  await threadManager.addMessage(threadId, { role: 'user', content: text });

  const visitorId = req.headers.get('x-visitor-id') || 'anon';
  const deviceId = req.headers.get('x-device-id') ?? '';
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

  const reply = await generateGreeterMessage(
    replyPrompt,
    languageToUse,
    collectionState,
    identityValuesBlock,
    effectiveGoal,
    rapportContext
  );

  await threadManager.addMessage(threadId, { role: 'assistant', content: reply });

  const section = resolveSectionForGreeter(text);
  await saveSectionSummary(threadId, section, '');

  return NextResponse.json({
    success: true,
    threadId,
    message: reply,
    flow_state,
    ...(handoff_ready && { handoff_ready: true, handoff_payload }),
  });
}
