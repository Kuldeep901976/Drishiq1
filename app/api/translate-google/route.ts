import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side proxy for Google Cloud Translation API.
 * Keeps GOOGLE_TRANSLATE_API_KEY out of the client.
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'GOOGLE_TRANSLATE_API_KEY not configured' },
      { status: 503 }
    );
  }

  try {
    const { text, targetLang } = await request.json();
    if (typeof text !== 'string' || typeof targetLang !== 'string') {
      return NextResponse.json(
        { success: false, error: 'text and targetLang required' },
        { status: 400 }
      );
    }

    const url = new URL('https://translation.googleapis.com/language/translate/v2');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('q', text);
    url.searchParams.set('target', targetLang);
    url.searchParams.set('format', 'text');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { success: false, error: errText || res.statusText },
        { status: res.status }
      );
    }

    const data = await res.json();
    const translatedText =
      data?.data?.translations?.[0]?.translatedText ?? text;
    return NextResponse.json({ success: true, translatedText });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Translation failed' },
      { status: 500 }
    );
  }
}
