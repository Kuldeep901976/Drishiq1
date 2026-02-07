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
import { normalizeLanguage } from '@/lib/onboarding-concierge/regional-languages';
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

Your job in this conversation is subtle:

Within at most 6 exchanges, you must naturally understand:
- What brought this person here
- What their name is
- Their age or life stage
- Their gender (only if naturally needed)

You are NEVER allowed to ask for these like a form.

You must behave like a thoughtful human having a real conversation.

Rules:
1. First priority is understanding what brought them here.
2. Name should be asked only after they share something personal.
3. Age should be asked as context ("Are you in your 20s, 30s, or later phase?").
4. Gender should be asked only if needed and respectfully.
5. If the user is vague, gently steer them to speak about what is going on in their life.
6. Never sound like a survey or data collection.
7. Maximum 2 sentences per reply.
8. Speak warm, dignified, and slightly witty.
9. Use the user's name once you know it.

Never argue. Never correct harshly. Never escalate.`,
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
    const visitorId = req.headers.get('x-visitor-id') || 'anon';
    const deviceId = req.headers.get('x-device-id') ?? '';
    const clientIp =
      req.headers.get('x-client-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      'unknown';

    const headerCity = req.headers.get('x-geo-city');
    const headerCountry = req.headers.get('x-geo-country');

    if (visitorId !== 'anon' && deviceId) {
      await fetch(`${req.nextUrl.origin}/api/visitor/ensure`, {
        method: 'POST',
        headers: {
          'x-visitor-id': visitorId,
          'x-device-id': deviceId,
          'x-client-ip': clientIp,
        },
      });
    }

    const ctx = await getVisitorContext(visitorId);

    // hydrate geo from frontend if DB empty
    if (!ctx.city && headerCity) ctx.city = headerCity;
    if (!ctx.country && headerCountry) ctx.country = headerCountry;

    const cookieLang = req.cookies.get('drishiq_lang')?.value;
    const browserLangHeader = req.headers.get('accept-language');
    const browserLang = browserLangHeader
      ? browserLangHeader.split(',')[0]?.split('-')[0]
      : null;

    console.log('[Onboarding] Language sources detected:', {
      cookieLang,
      browserLang,
      geoLangFromDB: ctx.language,
      geoSuggestedLanguage: ctx.geoSuggestedLanguage,
      cityFromDB: ctx.city,
      countryFromDB: ctx.country,
      headerCity,
      headerCountry,
    });

    const languageToUse = normalizeLanguage(
      cookieLang ||
      browserLang ||
      ctx.language ||
      'en'
    );

    const langSource = cookieLang
      ? 'cookie'
      : browserLang
        ? 'browser'
        : ctx.language
          ? 'geo'
          : 'fallback';

    console.log('[Onboarding] Final language decision:', {
      chosenChatLanguage: languageToUse,
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
You are DrishiQ greeting someone for the first time.

City: ${ctx.city ?? 'unknown'}
Country: ${ctx.country ?? 'unknown'}
Visit count: ${ctx.visit_count}

Greet naturally.
`;
    const message = await generateGreeterMessage(prompt, languageToUse);

    await threadManager.addMessage(threadId, { role: 'assistant', content: message });

    return NextResponse.json({
      success: true,
      threadId,
      message,
      showLanguageHelper,
      language: languageToUse,
      // 🔧 GENERIC FIX: use suggested regional language for hint if available
      geoLanguage: ctx.geoSuggestedLanguage || ctx.language || 'en',
      geoSuggestedLanguage: ctx.geoSuggestedLanguage || 'en',
      langSource,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[onboarding-concierge GET]', err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
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
    return NextResponse.json(
      { success: false, error: 'threadId is required' },
      { status: 400 }
    );
  }

  const threadManager = new PersistentThreadManager();
  const thread = await threadManager.getThread(threadId);
  if (!thread) {
    return NextResponse.json(
      { success: false, error: 'Thread not found' },
      { status: 404 }
    );
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

  const tempUser = await getOrCreateTempUser(
    visitorId,
    deviceId,
    name ?? null,
    age ?? null,
    gender ?? null
  );

  if (tempUser) {
    const identity_status =
      name && (issue || age || gender) ? 'complete' : 'partial';
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

  const replyPrompt = `
User said: "${text}"

Respond like a perceptive human. Max 2 sentences.
`;
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
