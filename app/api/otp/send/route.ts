/**
 * POST /api/otp/send — Send OTP to visitor phone (intake verification).
 * Provider-agnostic; uses lib/otp/otp-provider. Updates temp_users.phone if not set.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getTempUser, updateTempUser } from '@/lib/onboarding-concierge/data-store';
import { sendOtp } from '@/lib/otp/otp-provider';
import {
  getOtpState,
  setOtpState,
  cooldownRemainingMs,
  getExpiryMs,
  getCooldownMs,
} from '@/lib/otp/otp-store';

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function isValidPhone(phoneDigits: string): boolean {
  return phoneDigits.length >= 10 && phoneDigits.length <= 15;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const tempUserId = typeof body.tempUserId === 'string' ? body.tempUserId.trim() : '';
    const phoneRaw = typeof body.phone === 'string' ? body.phone.trim() : '';

    if (!tempUserId) {
      return NextResponse.json(
        { status: 'error', error: 'tempUserId is required' },
        { status: 400 }
      );
    }

    const phoneDigits = normalizePhone(phoneRaw);
    if (!isValidPhone(phoneDigits)) {
      return NextResponse.json(
        { status: 'error', error: 'Invalid phone; use 10–15 digits' },
        { status: 400 }
      );
    }

    const cooldownMs = cooldownRemainingMs(tempUserId, phoneDigits);
    if (cooldownMs > 0) {
      return NextResponse.json({
        status: 'cooldown',
        seconds_remaining: Math.ceil(cooldownMs / 1000),
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const now = Date.now();
    const expiresAt = now + getExpiryMs();

    setOtpState(tempUserId, phoneDigits, {
      otpHash,
      expiresAt,
      attemptsUsed: 0,
      lastSentAt: now,
    });

    await sendOtp(phoneRaw, otp);

    const tempUser = await getTempUser(tempUserId);
    if (tempUser && (!tempUser.phone || tempUser.phone.trim() !== phoneRaw)) {
      await updateTempUser(tempUserId, { phone: phoneRaw });
    }

    return NextResponse.json({
      status: 'otp_sent',
      cooldown_seconds_remaining: Math.ceil(getCooldownMs() / 1000),
      expires_in_seconds: Math.ceil(getExpiryMs() / 1000),
    });
  } catch (err) {
    console.error('[OTP send]', err);
    return NextResponse.json(
      { status: 'error', error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
