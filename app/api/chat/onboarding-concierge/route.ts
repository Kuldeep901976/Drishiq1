/**
 * Onboarding Concierge — Pre-chat greeter.
 * Uses PersistentThreadManager + chat_threads + chat_messages only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PersistentThreadManager } from '@/packages/core/persistent-thread-manager';
import {
  getOrCreateTempUser,
  updateTempUser,
  ensureTenantForTempUser,
  computeIdentityHash,
} from '@/lib/onboarding-concierge/data-store';
import { createServiceClient } from '@/lib/supabase';
import { createResponse, normalizeResponse } from '@/lib/responses/responsesClient';
import { getVisitorContext } from '@/lib/visitor/getVisitorContext';
import { normalizeLanguage, getLanguageForIndiaCity, getRegionLanguages } from '../../../../lib/onboarding-concierge/regional-languages';
import { saveSectionSummary, resolveSectionForGreeter } from '@/lib/chat/sectionMemory';

export async function generateGreeterMessage(prompt: string, languageToUse: string): Promise<string> {
  const llm = await createResponse(
    {
      model: 'gpt-4-turbo',
      input: [
        {
          role: 'system',
          content: `You MUST respond ONLY in this language: ${languageToUse}.

You are DrishiQ.

You are not a chatbot. You are a perceptive, emotionally intelligent human guide.

Within at most 6 exchanges, naturally understand:
- Why they came
- Name
- Life stage
- Gender (only if needed)

Never ask like a form.
Max 2 sentences per reply.
Warm, dignified, slightly witty tone.`,
        },
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

    // Persist geo from frontend (detect-location) so DB has correct region for language rules
    if (visitorId !== 'anon' && deviceId) {
      const ensureHeaders: Record<string, string> = {
        'x-visitor-id': visitorId,
        'x-device-id': deviceId,
        'x-client-ip': clientIp,
      };
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

    const cookieLang = req.cookies.get('drishiq_lang')?.value;
    const browserLangHeader = req.headers.get('accept-language');
    const browserLang = browserLangHeader
      ? browserLangHeader.split(',')[0]?.split('-')[0]
      : null;

    // Derive geo language from headers (region_code is source of truth). Use for hint when DB is wrong or not yet updated.
    let headerGeoLang: string | null = null;
    if (headerCountryCode && headerRegionCode) {
      headerGeoLang = normalizeLanguage(getRegionLanguages(headerCountryCode, headerRegionCode).primary);
    } else if (headerCountry?.trim().toLowerCase() === 'india' && headerCity) {
      headerGeoLang = normalizeLanguage(getLanguageForIndiaCity(headerCity));
    }

    console.log('[Onboarding] Language sources detected:', {
      cookieLang,
      browserLang,
      geoLangFromDB: ctx.language,
      geoSuggestedLanguage: ctx.geoSuggestedLanguage,
      cityFromDB: ctx.city,
      countryFromDB: ctx.country,
      headerCity,
      headerCountry,
      headerGeoLang,
    });

    // ------------------------------------------------
    // FINAL CHAT + HINT LANGUAGE DECISION
    // (1) Cookie/browser language = geo → chat = geo, hint = English
    // (2) Cookie/browser = English → chat = English, hint = geo language
    // (3) Cookie/browser = geo = English → hint = English
    // ------------------------------------------------

    let chatLanguage = 'en';
    let hintLanguage = 'en';
    let langSource = 'fallback';

    const effectiveGeoLang = ctx.language || headerGeoLang || null;
    // For hint: prefer geo language (from headers or DB); when cookie/browser = English, hint = regional language.
    const geoLangForHint = (headerGeoLang && headerGeoLang !== 'en') ? headerGeoLang : (ctx.language && ctx.language !== 'en') ? ctx.language : (ctx.geoSuggestedLanguage && ctx.geoSuggestedLanguage !== 'en') ? ctx.geoSuggestedLanguage : 'en';

    // 1) Cookie → chat = cookie
    if (cookieLang) {
      chatLanguage = normalizeLanguage(cookieLang);
      langSource = 'cookie';
      if (chatLanguage === effectiveGeoLang) {
        hintLanguage = 'en';
      } else {
        hintLanguage = geoLangForHint;
      }
    }

    // 2) No cookie → browser → chat = browser
    else if (browserLang) {
      chatLanguage = normalizeLanguage(browserLang);
      langSource = 'browser';
      if (chatLanguage === effectiveGeoLang) {
        hintLanguage = 'en';
      } else {
        hintLanguage = geoLangForHint;
      }
    }

    // 3) No cookie, no browser → geo = chat, hint = English
    else if (ctx.language) {
      chatLanguage = normalizeLanguage(ctx.language);
      hintLanguage = 'en';
      langSource = 'geo';
    }

    console.log('[Onboarding] Final language decision:', {
      chosenChatLanguage: chatLanguage,
      hintLanguage,
      langSource,
    });

    const showLanguageHelper = true;

    const threadManager = new PersistentThreadManager();
    let thread = await threadManager.getActiveThreadByVisitor('pre_chat', visitorId);
    if (!thread) {
      thread = await threadManager.createThread('pre_chat', { visitorId });
    }

    const threadId = thread.id;

    const tempUser = await getOrCreateTempUser(visitorId, deviceId);
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

    const prompt = `
City: ${ctx.city ?? 'unknown'}
Country: ${ctx.country ?? 'unknown'}
Visit count: ${ctx.visit_count}

Greet naturally.
`;

    const message = await generateGreeterMessage(prompt, chatLanguage);

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

  let name: string | undefined;
  let issue: string | undefined;
  let age: string | undefined;
  let gender: string | undefined;

  if (/^[a-zA-Z ]{2,30}$/.test(text)) name = text;
  if (text.length > 25) issue = text;
  if (/\b(20s|30s|40s|50\+|\d{2})\b/i.test(text)) age = text;
  if (/(male|female|man|woman|guy|girl)/i.test(text)) gender = text;

  const tempUser = await getOrCreateTempUser(visitorId, deviceId, name ?? null, age ?? null, gender ?? null);

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
  }

  const replyPrompt = `User said: "${text}"`;

  const languageToUse = normalizeLanguage(
    body.language ||
    req.cookies.get('drishiq_lang')?.value ||
    ctx.language ||
    'en'
  );

  const reply = await generateGreeterMessage(replyPrompt, languageToUse);

  await threadManager.addMessage(threadId, { role: 'assistant', content: reply });

  const section = resolveSectionForGreeter(text);
  await saveSectionSummary(threadId, section, '');

  return NextResponse.json({ success: true, threadId, message: reply });
}
