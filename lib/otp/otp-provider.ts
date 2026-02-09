/**
 * Pluggable OTP send adapter. Replace implementation for Twilio/MSG91 etc.
 * Stub logs to server console in dev only; do NOT log OTP in production.
 */

export interface OtpProvider {
  sendOtp(phone: string, code: string): Promise<void>;
}

async function stubSendOtp(phone: string, code: string): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[OTP] ${phone}: ${code}`);
  }
  // In production, no log. Integrate real provider here later.
}

export const defaultOtpProvider: OtpProvider = {
  sendOtp: stubSendOtp,
};

export async function sendOtp(phone: string, code: string): Promise<void> {
  await defaultOtpProvider.sendOtp(phone, code);
}
