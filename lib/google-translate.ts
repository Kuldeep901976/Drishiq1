/**
 * Client-side Google Translate overlay for t().
 * Calls our /api/translate-google so GOOGLE_TRANSLATE_API_KEY stays server-side.
 * In-memory cache: key = targetLang + "|" + text.
 */

const cache = new Map<string, string>();

function cacheKey(targetLang: string, text: string): string {
  return `${targetLang}|${text}`;
}

/**
 * Translate text to target language via Google Translate API (proxied by our API).
 * Returns original text on failure. Results are cached in memory.
 */
export async function translateWithGoogle(
  text: string,
  targetLang: string
): Promise<string> {
  const key = cacheKey(targetLang, text);
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  try {
    const res = await fetch('/api/translate-google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang }),
    });
    const data = await res.json();
    if (data?.success && typeof data.translatedText === 'string') {
      cache.set(key, data.translatedText);
      return data.translatedText;
    }
  } catch {
    // fall through to return original
  }
  return text;
}
