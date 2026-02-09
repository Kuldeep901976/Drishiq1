/**
 * In-memory transient OTP state for visitor phone verification.
 * Keyed by tempUserId + phone. Not persisted; process restart clears all.
 * No new tables. State must NOT persist long-term.
 */

export interface OtpState {
  /** SHA-256 hash of the OTP (never store plain). */
  otpHash: string;
  /** Unix ms; OTP invalid after this. */
  expiresAt: number;
  /** Number of verify attempts used (max 5). */
  attemptsUsed: number;
  /** Unix ms; used for 30s resend cooldown. */
  lastSentAt: number;
}

const store = new Map<string, OtpState>();

const COOLDOWN_MS = 30 * 1000;
const EXPIRY_MS = 2 * 60 * 1000;
export const MAX_ATTEMPTS = 5;

export function otpKey(tempUserId: string, phoneDigits: string): string {
  return `${tempUserId}:${phoneDigits}`;
}

/** Get state and clear if expired (for send/cooldown). */
export function getOtpState(tempUserId: string, phoneDigits: string): OtpState | null {
  const key = otpKey(tempUserId, phoneDigits);
  const state = store.get(key);
  if (!state) return null;
  if (Date.now() > state.expiresAt) {
    store.delete(key);
    return null;
  }
  return state;
}

/** Get state without auto-delete (for verify route to return "expired" vs "no_active_otp"). */
export function peekOtpState(tempUserId: string, phoneDigits: string): OtpState | null {
  return store.get(otpKey(tempUserId, phoneDigits)) ?? null;
}

export function setOtpState(
  tempUserId: string,
  phoneDigits: string,
  state: OtpState
): void {
  const key = otpKey(tempUserId, phoneDigits);
  store.set(key, state);
}

export function deleteOtpState(tempUserId: string, phoneDigits: string): void {
  store.delete(otpKey(tempUserId, phoneDigits));
}

export function cooldownRemainingMs(tempUserId: string, phoneDigits: string): number {
  const key = otpKey(tempUserId, phoneDigits);
  const state = store.get(key);
  if (!state) return 0;
  const elapsed = Date.now() - state.lastSentAt;
  return Math.max(0, COOLDOWN_MS - elapsed);
}

export function getExpiryMs(): number {
  return EXPIRY_MS;
}

export function getCooldownMs(): number {
  return COOLDOWN_MS;
}
