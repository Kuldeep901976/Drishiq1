/**
 * POST /api/otp/verify — Verify OTP for visitor phone (intake verification).
 * On success: markPhoneVerified(tempUserId). No auth/users tables touched.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getTempUser, markPhoneVerified } from '@/lib/onboarding-concierge/data-store';
import {
  peekOtpState,
  setOtpState,
  deleteOtpState,
  MAX_ATTEMPTS,
} from '@/lib/otp/otp-store';

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp.trim()).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const tempUserId = typeof body.tempUserId === 'string' ? body.tempUserId.trim() : '';
    const phoneRaw = typeof body.phone === 'string' ? body.phone.trim() : '';
    const otpEntered = typeof body.otp_entered === 'string' ? body.otp_entered : '';

    if (!tempUserId || !phoneRaw) {
      return NextResponse.json(
        { status: 'error', error: 'tempUserId and phone are required' },
        { status: 400 }
      );
    }

    const phoneDigits = normalizePhone(phoneRaw);
    const state = peekOtpState(tempUserId, phoneDigits);

    if (!state) {
      return NextResponse.json({ status: 'no_active_otp' });
    }

    if (Date.now() > state.expiresAt) {
      deleteOtpState(tempUserId, phoneDigits);
      return NextResponse.json({ status: 'expired' });
    }

    if (state.attemptsUsed >= MAX_ATTEMPTS) {
      return NextResponse.json({ status: 'max_attempts_exceeded' });
    }

    const enteredHash = hashOtp(otpEntered);
    if (enteredHash !== state.otpHash) {
      state.attemptsUsed += 1;
      setOtpState(tempUserId, phoneDigits, state);
      return NextResponse.json({
        status: 'invalid_otp',
        attempts_left: MAX_ATTEMPTS - state.attemptsUsed,
      });
    }

    const tempUser = await getTempUser(tempUserId);
    if (!tempUser) {
      return NextResponse.json(
        { status: 'error', error: 'temp_user not found' },
        { status: 404 }
      );
    }

    deleteOtpState(tempUserId, phoneDigits);
    await markPhoneVerified(tempUserId);

    return NextResponse.json({ status: 'verified' });
  } catch (err) {
    console.error('[OTP verify]', err);
    return NextResponse.json(
      { status: 'error', error: 'Verification failed' },
      { status: 500 }
    );
  }
}
