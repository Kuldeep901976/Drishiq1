/**
 * Onboarding Concierge — Pre-chat greeter.
 * Uses PersistentThreadManager + chat_threads + chat_messages only.
 *
 * RELIABILITY RULE:
 * Never await external I/O directly in request handlers.
 * Always wrap with withTimeout().
 * This endpoint must NEVER block longer than 15s.
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
import { getVisitorContext, type VisitorContext } from '@/lib/visitor/getVisitorContext';
import { getTimeOfDay } from '@/lib/visitor/timezone';
import { withTimeout } from '@/lib/utils/withTimeout';
import { timedStep } from '@/lib/utils/timedStep';
import { normalizeLanguage, getLanguageForIndiaCity, getRegionLanguages } from '../../../../lib/onboarding-concierge/regional-languages';
import { saveSectionSummary, resolveSectionForGreeter } from '@/lib/chat/sectionMemory';
import { formatOmnivyraResponseForUser } from '@/lib/omnivyra';
import {
  buildBoundedInputFromHandoff,
  runLocalBounded,
} from '@/lib/omnivyra/local-bounded';
import { runAstroCompute } from '@/lib/astro/astro-client';
import {
  getIdentityCollectionState,
  resolveNextIdentityField,
  buildIdentityValuesBlock,
  shouldSkipOtp,
  type NextIdentityGoal,
} from '@/lib/onboarding-concierge/identity';
import { generateGreeterMessage, FIRST_GREETING_USER_PROMPT, type RapportContext } from '@/lib/onboarding-concierge/greeter-prompts';
import {
  UDA_QUESTION_LIMIT,
  generateUdaBridgeMessage,
  isEmotionallyHeavy,
  generateUdaInvitationMessage,
  generateUdaFinalUnderstanding,
} from '@/lib/onboarding-concierge/uda-prompts';
import {
  isDestinyLensPositiveInterest,
  getDestinyLensChoice,
  generateDestinyLensIntroMessage,
  generateBirthDetailsMessage,
  parseBirthDetails,
  resolveBirthPlaceGeo,
  intentStructuringForAstro,
  generateDestinyLensInsightBlocks,
  type ParsedBirthDetails,
  type AstroResultMeta,
} from '@/lib/onboarding-concierge/destiny-lens';
import {
  generateSessionCompletionBridge,
  PRICING_BUTTON_OPTIONS,
  mapPlanToSessions,
  mapOnboardingPlanToPaymentPlan,
} from '@/lib/onboarding-concierge/impact-and-pricing';
import {
  detectPhoneFromText,
  detectEmailFromText,
  extractNameFromMessage,
} from '@/lib/onboarding-concierge/validation';

/** Fallback when LLM fails. Non-English: short neutral line only (no name request). No translation. */
function getSimpleFallback(language: string): string {
  if (language === 'en') return "Hi. I'm DrishiQ. What should I call you?";
  return "Hello. I'm DrishiQ.";
}
const VISITOR_ENSURE_TIMEOUT_MS = 8000;
const THREAD_TEMPUSER_TIMEOUT_MS = 8000;
const GREETER_LLM_TIMEOUT_MS = 15000;

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

    // --- STEP 1+2: visitor/ensure and getVisitorContext in parallel (both time-bounded) ---
    const ensurePromise =
      visitorId !== 'anon' && deviceId
        ? withTimeout(
            (async () => {
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
                signal: AbortSignal.timeout(VISITOR_ENSURE_TIMEOUT_MS),
              });
            })(),
            VISITOR_ENSURE_TIMEOUT_MS + 1000,
            'visitor/ensure'
          ).catch((err) => {
            console.warn('[Onboarding GET] visitor/ensure failed (non-blocking):', err);
          })
        : Promise.resolve();

    const [, ctx] = await Promise.all([
      ensurePromise,
      timedStep('getVisitorContext', () => getVisitorContext(visitorId)),
    ]);

    // Hydrate display-only geo if DB empty
    if (ctx && !ctx.city && headerCity) ctx.city = headerCity;
    if (ctx && !ctx.country && headerCountry) ctx.country = headerCountry;

    // --- STEP 3: thread + tempUser + chat_threads update (time-bounded) ---
    const threadManager = new PersistentThreadManager();
    const { thread, threadId, tempUser: tempUserFromStep } = await timedStep('thread+tempUser', () =>
      withTimeout(
        (async () => {
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
          return { thread, threadId, tempUser };
        })(),
        THREAD_TEMPUSER_TIMEOUT_MS,
        'thread+tempUser'
      )
    );
    let tempUser = tempUserFromStep ?? null;

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
    const effectiveGeoLang = ctx?.language || headerGeoLang || null;
    const geoLangForHint =
      (headerGeoLang && headerGeoLang !== 'en')
        ? headerGeoLang
        : (ctx?.language && ctx?.language !== 'en')
          ? ctx?.language
          : (ctx?.geoSuggestedLanguage && ctx?.geoSuggestedLanguage !== 'en')
            ? ctx?.geoSuggestedLanguage
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
      } else if (ctx?.language) {
        chatLanguage = normalizeLanguage(ctx.language);
        hintLanguage = 'en';
        langSource = 'geo';
      }
      if (tempUser) {
        await withTimeout(
          updateTempUser(tempUser.id, {
            locked_language: chatLanguage,
            language_locked: true,
            language_source: langSource,
          }),
          5000,
          'updateTempUser language'
        );
      }
    }

    const showLanguageHelper = true;

    const collectionState = getIdentityCollectionState(
      tempUser?.name ?? null,
      tempUser?.problem_statement ?? null,
      tempUser?.age_range ?? null,
      tempUser?.gender ?? null
    );

    const timeOfDay = getTimeOfDay(ctx?.timezone ?? null);

    const identityValuesBlock = buildIdentityValuesBlock(
      tempUser?.name ?? null,
      tempUser?.problem_statement ?? null,
      tempUser?.age_range ?? null,
      tempUser?.gender ?? null,
      ctx?.city ?? null,
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

    const isFirstGreeting =
      collectionState.alreadyCollected.length === 0 && nextIdentityGoal === 'name';
    const prompt = isFirstGreeting
      ? `
Timezone: ${ctx?.timezone ?? 'unknown'}
Time of day (visitor): ${timeOfDay}

${FIRST_GREETING_USER_PROMPT}

Use a natural conversational tone in the selected language.`
      : `
City: ${ctx?.city ?? 'unknown'}
Country: ${ctx?.country ?? 'unknown'}
Region: ${ctx?.region_code ?? 'unknown'}
Timezone: ${ctx?.timezone ?? 'unknown'}
Time of day (visitor): ${timeOfDay}
Visit count: ${ctx?.visit_count ?? 1}

${FIRST_GREETING_USER_PROMPT}
`;

    const rapportContext: RapportContext = {
      city: ctx?.city ?? null,
      timeOfDay,
      visit_count: ctx?.visit_count ?? 1,
      isReturningVisit: (ctx?.visit_count ?? 1) > 1,
    };

    let message: string;
    try {
      message = await timedStep('generateGreeterMessage', () =>
        withTimeout(
          generateGreeterMessage(
            prompt,
            chatLanguage,
            collectionState,
            identityValuesBlock,
            nextIdentityGoal,
            rapportContext
          ),
          GREETER_LLM_TIMEOUT_MS,
          'generateGreeterMessage'
        )
      );
    } catch (err) {
      console.error('GREETER_LLM_ERROR:', err);
      message = getSimpleFallback(chatLanguage);
    }
    if (!message?.trim()) {
      message = getSimpleFallback(chatLanguage);
    }

    await withTimeout(
      threadManager.addMessage(threadId, { role: 'assistant', content: message }),
      5000,
      'addMessage'
    );

    return NextResponse.json({
      success: true,
      threadId,
      message,
      showLanguageHelper,
      language: chatLanguage,
      geoLanguage: ctx?.language || 'en',
      geoSuggestedLanguage: hintLanguage,
      langSource,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const errObj = err && typeof err === 'object' ? (err as { message?: string; code?: string; details?: string }) : {};
    console.error('[onboarding-concierge GET]', errObj.code ?? message, errObj.message ?? '', errObj.details ?? '');
    const body: { success: false; error: string; details?: unknown } = { success: false, error: message };
    if (process.env.NODE_ENV === 'development' && err && typeof err === 'object') {
      body.details = (err as { code?: string; details?: string }).code
        ? { code: (err as { code?: string }).code, details: (err as { details?: string }).details }
        : err;
    }
    return NextResponse.json(body, { status: 500 });
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
    const planConfirmSystem = `CRITICAL LANGUAGE RULE:
Respond ONLY in ${planLang}. Never switch languages. Never mix languages. This rule overrides ALL instructions.
If the user's message is in a different language, continue responding in the locked language.

Write a short confirmation (2–3 sentences): acknowledge their plan choice, reinforce that they're moving forward, and prepare them for the next step. Warm, no payment or pricing details.`;
    const confirmLlm = await createResponse(
      {
        model: 'gpt-4-turbo',
        input: [
          { role: 'system', content: planConfirmSystem },
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
  const ctx = await getVisitorContext(visitorId);

  // Step A — Fetch temp_user early for language lock
  let tempUser =
    thread.temp_user_id
      ? await getTempUser(thread.temp_user_id)
      : await getOrCreateTempUser(visitorId, deviceId);

  // Step B — Language: decided once per thread. POST uses ONLY body override or locked_language. Never recalc from GEO/headers/cookie.
  let languageToUse: string;
  if (body.language != null && String(body.language).trim() !== '') {
    languageToUse = normalizeLanguage(String(body.language).trim());
    if (tempUser) {
      await updateTempUser(tempUser.id, {
        locked_language: languageToUse,
        language_locked: true,
        language_source: 'manual_override',
      });
    }
  } else if (tempUser?.locked_language) {
    languageToUse = normalizeLanguage(tempUser.locked_language);
    if (!tempUser.language_locked) {
      await updateTempUser(tempUser.id, { language_locked: true });
    }
  } else {
    languageToUse = 'en';
    if (tempUser) {
      await updateTempUser(tempUser.id, {
        locked_language: languageToUse,
        language_locked: true,
        language_source: 'fallback',
      });
    }
  }

  console.log('[LANG CHECK]', {
    locked: tempUser?.locked_language ?? null,
    used: languageToUse,
  });

  // Language-change only: re-ask the same (next) question in the new language; no user message added to thread
  if (text === '' && body.language != null && String(body.language).trim() !== '') {
    const currentName = tempUser?.name ?? null;
    const currentIssue = tempUser?.problem_statement ?? null;
    const currentAge = tempUser?.age_range ?? null;
    const currentGender = tempUser?.gender ?? null;
    const currentEmail = tempUser?.email ?? null;
    const currentPhone = tempUser?.phone ?? null;
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
    const rapportContext: RapportContext = {
      city: ctx.city ?? null,
      timeOfDay: getTimeOfDay(ctx.timezone),
      visit_count: ctx.visit_count ?? 1,
      isReturningVisit: (ctx.visit_count ?? 1) > 1,
    };
    const reAskPrompt = `The user switched the chat language. Respond ONLY in language: ${languageToUse}. Ask only for the next missing identity item (current goal: ${nextIdentityGoal}). One short question only. No preamble, no confirmation of the language change.`;
    const reAskMessage = await generateGreeterMessage(
      reAskPrompt,
      languageToUse,
      collectionState,
      identityValuesBlock,
      nextIdentityGoal,
      rapportContext
    );
    const finalMessage = reAskMessage?.trim() || getSimpleFallback(languageToUse);
    await threadManager.addMessage(threadId, { role: 'assistant', content: finalMessage });
    return NextResponse.json({ success: true, threadId, message: finalMessage, language: languageToUse });
  }

  await threadManager.addMessage(threadId, { role: 'user', content: text });

  let name: string | undefined = extractNameFromMessage(text);
  let issue: string | undefined;
  let age: string | undefined;
  let gender: string | undefined;

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

    const udaBoundedComplete = (thread.metadata?.uda_bounded_complete as boolean) === true;
    await updateTempUser(tempUser.id, {
      name,
      age_range: age,
      gender,
      ...(!udaBoundedComplete && issue !== undefined && { problem_statement: issue }),
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
        const bridge = await generateSessionCompletionBridge(languageToUse);
        reply = bridge || '';
        pricingOptions = [...PRICING_BUTTON_OPTIONS];
        await threadManager.updateMetadata(threadId, {
          impact_framing_shown: true,
          pricing_presented: true,
        });
      } else if (destinyLensInterested) {
        const existingAstroResult = thread.metadata?.astro_result;
        const hasAstroResult =
          existingAstroResult != null &&
          typeof existingAstroResult === 'object' &&
          'gain_signal' in (existingAstroResult as object);

        if (hasAstroResult && destinyLensInsightRendered) {
          const bridge = await generateSessionCompletionBridge(languageToUse);
          reply = bridge || '';
          pricingOptions = [...PRICING_BUTTON_OPTIONS];
          await threadManager.updateMetadata(threadId, {
            impact_framing_shown: true,
            pricing_presented: true,
          });
        } else if (hasAstroResult) {
          const originalProblem =
            tempUser?.problem_statement ?? currentIssue ?? '';
          const refinedContext = await intentStructuringForAstro(originalProblem);
          const problemContext =
            (refinedContext?.trim() && refinedContext) || originalProblem;
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

// Re-exports for backward compatibility (e.g. app/api/chat/route.ts)
export { generateGreeterMessage } from '@/lib/onboarding-concierge/greeter-prompts';
export type { RapportContext } from '@/lib/onboarding-concierge/greeter-prompts';
export type { NextIdentityGoal } from '@/lib/onboarding-concierge/identity';
