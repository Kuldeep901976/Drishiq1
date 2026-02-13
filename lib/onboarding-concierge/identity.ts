/**
 * Identity collection logic — backbone of intake sequencing.
 * Extracted from app/api/chat/onboarding-concierge/route.ts — behavior preserved.
 * DO NOT change field order or logic.
 */

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

/** Order for identity collection. */
export const IDENTITY_ORDER = [
  { key: 'name' as const, label: 'Name' },
  { key: 'issue' as const, label: 'Why they came' },
  { key: 'age' as const, label: 'Life stage' },
  { key: 'gender' as const, label: 'Gender (if needed)' },
];

export function getIdentityCollectionState(
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

export function resolveNextIdentityField(values: {
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
export function shouldSkipOtp(tempUser: { phone_verified?: boolean; updated_at?: string } | null): boolean {
  if (!tempUser) return false;
  if (tempUser.phone_verified !== true) return false;
  const updatedAt = tempUser.updated_at ? new Date(tempUser.updated_at).getTime() : 0;
  return updatedAt >= Date.now() - SEVEN_DAYS_MS;
}

/** Build Known / Missing identity block for system prompt. Only known values go under Known; only missing labels under Missing. Email/Phone listed after Name, Problem, Age, Gender. */
export function buildIdentityValuesBlock(
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
