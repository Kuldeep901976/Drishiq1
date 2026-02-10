/**
 * Lightweight interface: submit problem + details, get a response.
 * Used by greeter chat and main chat; response shape/tone differs by source.
 * Response is returned for further customization by the caller.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateGreeterMessage } from '@/app/api/chat/onboarding-concierge/route';
import { createResponse, normalizeResponse } from '@/lib/responses/responsesClient';
import { normalizeLanguage } from '@/lib/onboarding-concierge/regional-languages';
import { runAstroCompute } from '@/lib/astro/astro-client';

export type ProblemResponseSource = 'greeter' | 'main_chat';

export interface ProblemResponseDetails {
  name?: string | null;
  age_range?: string | null;
  gender?: string | null;
  language?: string | null;
  /** Birth date YYYY-MM-DD (aligned with greeter/astro). */
  dob_date?: string | null;
  /** Birth time HH:MM or HH:MM:SS 24h (aligned with greeter/astro). */
  dob_time?: string | null;
  /** Place of birth (e.g. city, or "City, State, Country"). */
  place_of_birth?: string | null;
  /** From geocode: latitude for place of birth. */
  latitude?: number | null;
  /** From geocode: longitude for place of birth. */
  longitude?: number | null;
  /** From geocode: timezone for place of birth. */
  timezone?: string | null;
  city?: string | null;
  [key: string]: string | number | null | undefined;
}

export interface ProblemResponseRequestBody {
  /** What the user shared (why they came, issue, problem). */
  problem: string;
  /** Optional details for context; used in prompt only. */
  details?: ProblemResponseDetails;
  /** Who is requesting: greeter = short conversational; main_chat = guidance-style. */
  source: ProblemResponseSource;
  /** Language code for response (default en). */
  language?: string;
}

export interface ProblemResponseResponseBody {
  /** Generated response text; caller may further customize. */
  response: string;
  source: ProblemResponseSource;
  /** Hint that the response is intended for optional editing/override. */
  customizable?: boolean;
  /** True when the response came from the astro layer (Swiss Ephemeris + LLM flavour). False or omitted when it's the greeter fallback. */
  from_astro_layer?: boolean;
  /** When source=greeter and birth details were sent: Swiss Ephemeris signals from astro service. */
  astro_signals?: {
    gain_signal: number | string;
    risk_signal: number | string;
    phase_signal: number | string;
    confidence: number;
  } | null;
}

/** Build the normal greeter conversational reply (when astro is not used or failed). */
async function buildGreeterReply(
  problem: string,
  language: string,
  dobDate: string,
  dobTime: string,
  placeOfBirth: string,
  lat: number | null,
  lon: number | null,
  tz: string,
  name: string,
  age: string,
  gender: string,
  city: string
): Promise<string> {
  const parts: string[] = [];
  if (name) parts.push(`Name: ${name}`);
  if (age) parts.push(`Age: ${age}`);
  if (gender) parts.push(`Gender: ${gender}`);
  if (city) parts.push(`City: ${city}`);
  if (dobDate) parts.push(`DOB date: ${dobDate}`);
  if (dobTime) parts.push(`DOB time: ${dobTime}`);
  if (placeOfBirth) parts.push(`Place of birth: ${placeOfBirth}`);
  if (lat != null && lon != null && !Number.isNaN(lat) && !Number.isNaN(lon)) parts.push(`Birth place coords: ${lat}, ${lon}`);
  if (tz) parts.push(`Birth place timezone: ${tz}`);
  const userBlock = parts.length > 0 ? `User context: ${parts.join(', ')}.` : '';
  const prompt = `The user just shared why they came:

"${problem}"
${userBlock ? `\n${userBlock}\n` : ''}

Respond in one short, warm, human sentence. Acknowledge what they shared and offer to help. Do not ask for more details. Do not list options. Max 2 sentences.`;
  return generateGreeterMessage(
    prompt,
    language,
    { alreadyCollected: ['Why they came'], stillNeed: [] },
    undefined,
    'complete'
  );
}

/**
 * POST /api/chat/problem-response
 *
 * Submit a problem with optional details; get a response tailored to source (greeter vs main_chat).
 * When source=greeter and birth details are present, the response is from the astro layer (Swiss Ephemeris), for the greeter to share with the user.
 */
export async function POST(req: NextRequest): Promise<NextResponse<ProblemResponseResponseBody | { error: string }>> {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<ProblemResponseRequestBody>;
    const problem = typeof body.problem === 'string' ? body.problem.trim() : '';
    const details = body.details && typeof body.details === 'object' ? body.details : {};
    const source: ProblemResponseSource =
      body.source === 'greeter' || body.source === 'main_chat' ? body.source : 'greeter';
    const language = normalizeLanguage(body.language ?? details.language ?? 'en');

    if (!problem) {
      return NextResponse.json({ error: 'problem is required' }, { status: 400 });
    }

    let response: string;
    let astroSignals: ProblemResponseResponseBody['astro_signals'] = null;
    let fromAstroLayer = false;

    if (source === 'greeter') {
      // Greeter: single supportive reply; context aligned with greeter (name, age, gender, dob, place of birth, lat/long/timezone).
      const name = details.name?.trim() || '';
      const age = details.age_range?.trim() || '';
      const gender = details.gender?.trim() || '';
      const city = details.city?.trim() || '';
      const dobDate = details.dob_date?.trim() || '';
      const dobTime = details.dob_time?.trim() || '';
      const placeOfBirth = details.place_of_birth?.trim() || '';
      const lat = details.latitude != null ? Number(details.latitude) : null;
      const lon = details.longitude != null ? Number(details.longitude) : null;
      const tz = details.timezone?.trim() || '';

      // When birth details + coords + timezone are present: LLM/Omnivyra defines perspective → astro → LLM gives user that perspective.
      const hasAstroInput = dobDate && dobTime && lat != null && lon != null && !Number.isNaN(lat) && !Number.isNaN(lon) && tz;
      if (hasAstroInput) {
        // 1) Request: LLM/Omnivyra defines what we need for greeter — loss/gain/opportunity cost perspective to give user "why this matters".
        let perspectiveForAstro = problem;
        try {
          const requestFlavourLlm = await createResponse(
            {
              model: 'gpt-4o-mini',
              input: [
                {
                  role: 'system',
                  content: `You are the layer before the astro service. For a request from greeter chat (user confirmed they want astro advice), define the perspective we need to give the user. Output a single block of text that includes:
1) What the user will MISS if the problem is not resolved — from 3 months, 1 year, and 5 years standpoint.
2) What the user will GAIN if the problem is solved now.
3) Opportunity cost: how things can change positively or negatively if not worked on now.
Use this to form problem_context and uda_summary for the astro layer. Language: ${language}. Write in 3–5 short sentences. No bullet labels. Concise, personal, perspective-giving.`,
                },
                {
                  role: 'user',
                  content: `User's problem: "${problem}". Context: ${name ? `name ${name}` : ''}${age ? `, age ${age}` : ''}${placeOfBirth ? `, place of birth ${placeOfBirth}` : ''}. Produce the perspective block (what they will miss at 3m/1y/5y, what they will gain if solved now, opportunity cost and positive/negative outcomes if not worked on now).`,
                },
              ],
              temperature: 0.35,
              max_tokens: 280,
            },
            'greeter'
          );
          const requestNorm = normalizeResponse(requestFlavourLlm);
          const requestText = requestNorm.content?.trim() || '';
          if (requestText) perspectiveForAstro = requestText;
        } catch (err) {
          console.warn('[problem-response] request perspective LLM failed, using raw problem:', err);
        }

        const astroCall = await runAstroCompute({
          dob_date: dobDate,
          dob_time: dobTime,
          latitude: lat,
          longitude: lon,
          timezone: tz,
          problem_context: perspectiveForAstro,
          uda_summary: perspectiveForAstro,
        });
        if (astroCall.success && astroCall.data) {
          astroSignals = {
            gain_signal: astroCall.data.gain_signal,
            risk_signal: astroCall.data.risk_signal,
            phase_signal: astroCall.data.phase_signal,
            confidence: astroCall.data.confidence,
          };
          const d = astroCall.data;
          // 2) Response: LLM gives user the perspective (why it's important, opportunity cost, positive/negative if not worked on now) using astro signals.
          try {
            const responseFlavourLlm = await createResponse(
              {
                model: 'gpt-4o-mini',
                input: [
                  {
                    role: 'system',
                    content: `You are the astro layer's voice. You have: (1) four signals from Swiss Ephemeris (gain, risk, phase, confidence 0-1), and (2) a perspective on what the user will miss if the problem is not resolved (3m/1y/5y), what they will gain if solved now, and opportunity cost. Write 2–3 short sentences in the user's language (${language}) that give them this perspective: why this is important, what is the opportunity cost, and how things can change positively or negatively if not worked on now. Warm, clear, no numbers or jargon. Destiny Lens tone.`,
                  },
                  {
                    role: 'user',
                    content: `Perspective for this user: "${perspectiveForAstro}". Astro signals: gain=${d.gain_signal}, risk=${d.risk_signal}, phase=${d.phase_signal}, confidence=${d.confidence}. Original problem: "${problem}". Respond in language: ${language}.`,
                  },
                ],
                temperature: 0.4,
                max_tokens: 180,
              },
              'greeter'
            );
            const responseNorm = normalizeResponse(responseFlavourLlm);
            const flavoured = responseNorm.content?.trim();
            if (flavoured) {
              response = flavoured;
            } else {
              response = `gain_signal: ${d.gain_signal}, risk_signal: ${d.risk_signal}, phase_signal: ${d.phase_signal}, confidence: ${d.confidence}`;
            }
          } catch (err) {
            console.warn('[problem-response] response flavour LLM failed, using raw signals:', err);
            response = `gain_signal: ${d.gain_signal}, risk_signal: ${d.risk_signal}, phase_signal: ${d.phase_signal}, confidence: ${d.confidence}`;
          }
          fromAstroLayer = true;
        } else {
          // Astro call failed: fall back to conversational greeter reply.
          response = await buildGreeterReply(problem, language, dobDate, dobTime, placeOfBirth, lat, lon, tz, name, age, gender, city);
        }
      } else {
        // No astro input: use normal greeter conversational reply.
        response = await buildGreeterReply(problem, language, dobDate, dobTime, placeOfBirth, lat, lon, tz, name, age, gender, city);
      }
    } else {
      // main_chat: 2–3 sentences, guidance/next-step tone; context includes dob and place of birth when present.
      const name = details.name?.trim() || 'User';
      const age = details.age_range?.trim() || '';
      const dobDate = details.dob_date?.trim() || '';
      const dobTime = details.dob_time?.trim() || '';
      const placeOfBirth = details.place_of_birth?.trim() || '';
      const tz = details.timezone?.trim() || '';
      const extra = [age, details.gender?.trim(), details.city?.trim(), dobDate && `DOB: ${dobDate} ${dobTime}`.trim(), placeOfBirth && `Place of birth: ${placeOfBirth}`, tz && `Timezone: ${tz}`].filter(Boolean).join('; ');
      const contextLine = extra ? `Context: ${name}; ${extra}.` : `Context: ${name}.`;

      try {
        const llm = await createResponse(
          {
            model: 'gpt-4o-mini',
            input: [
              {
                role: 'system',
                content: `You are a supportive guide. Respond ONLY in the language indicated by the user (language code: ${language}). Be concise: 2–3 sentences. Offer clarity or a next step. No form, no list of questions. Tone: main conversation, not onboarding.`,
              },
              {
                role: 'user',
                content: `Problem shared: "${problem}"\n${contextLine}\n\nRespond in language: ${language}.`,
              },
            ],
            temperature: 0.6,
            max_tokens: 180,
          },
          'main_chat'
        );
        const normalized = normalizeResponse(llm);
        response = normalized.content?.trim() || 'Thanks for sharing. I can help you work through this.';
      } catch (err) {
        console.warn('[problem-response] main_chat LLM failed, using fallback:', err);
        response = 'Thanks for sharing. I can help you work through this—we can go step by step.';
      }
    }

    return NextResponse.json({
      response,
      source,
      customizable: true,
      ...(source === 'greeter' && { from_astro_layer: fromAstroLayer }),
      ...(astroSignals != null && { astro_signals: astroSignals }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[problem-response]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
