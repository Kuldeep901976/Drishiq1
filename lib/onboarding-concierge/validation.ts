/**
 * Onboarding validation helpers. Zero external dependencies.
 * Extracted from app/api/chat/onboarding-concierge/route.ts — behavior preserved.
 */

/** Email: something@something.domain (safe, non-capturing beyond the match). */
export const EMAIL_REGEX = /\S+@\S+\.\S+/;

/** Phone: 10–15 digits; allow spaces, +, -, () in the string; take longest digit run in that range. */
export function detectPhoneFromText(text: string): string | null {
  const digitRuns = text.split(/\D+/).filter(Boolean);
  const run = digitRuns.find((r) => r.length >= 10 && r.length <= 15);
  return run ?? null;
}

export function detectEmailFromText(text: string): string | null {
  const m = text.match(EMAIL_REGEX);
  return m ? m[0].trim() : null;
}

const invalidNames = [
  'noone',
  'nobody',
  'none',
  'no name',
  'anonymous',
  'test',
  'test123',
  'xyz',
  'unknown',
  'nothing',
  'na',
  'n/a',
  'user',
  'user123',
  'visitor',
  'hi',
  'hello',
  'ok',
  'hey',
  'yo',
  'temp',
  'random',
];

/**
 * Extract name from message if it matches valid name pattern and is not in blacklist.
 * Behavior preserved from route.ts POST handler.
 */
export function extractNameFromMessage(text: string): string | undefined {
  if (
    /^[a-zA-Z][a-zA-Z ]{1,29}$/.test(text) &&
    !invalidNames.includes(text.toLowerCase().trim())
  ) {
    return text;
  }
  return undefined;
}
