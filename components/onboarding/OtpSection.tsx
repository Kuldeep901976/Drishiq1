'use client';

import React from 'react';

export interface PhoneVerificationState {
  phoneNumber: string;
  otpSent: boolean;
  otpCode: string[];
  confirmationResult: any;
  verifying: boolean;
}

export interface OtpSectionProps {
  currentStage: string | null;
  phoneVerificationState: PhoneVerificationState;
  onPhoneNumberChange: (phoneNumber: string) => void;
  onOtpCodeChange: (otpCode: string[]) => void;
  onPhoneSubmit: (phoneNumber: string) => void;
  onOtpVerify: () => void;
}

export function OtpSection({
  currentStage,
  phoneVerificationState,
  onPhoneNumberChange,
  onOtpCodeChange,
  onPhoneSubmit,
  onOtpVerify,
}: OtpSectionProps) {
  if (currentStage !== 'onboarding_phone_verification' || phoneVerificationState.otpSent) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      <input
        type="tel"
        value={phoneVerificationState.phoneNumber}
        onChange={(e) => onPhoneNumberChange(e.target.value)}
        placeholder="Enter phone number with country code"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <button
        onClick={() => onPhoneSubmit(phoneVerificationState.phoneNumber)}
        disabled={!phoneVerificationState.phoneNumber || phoneVerificationState.otpSent}
        className="w-full bg-[#0B4422] text-white px-4 py-2 rounded-lg hover:bg-[#10B981] disabled:bg-gray-300 font-medium"
      >
        Send OTP
      </button>
      <div id="recaptcha-container"></div>
    </div>
  );
}

export function OtpVerifySection({
  phoneVerificationState,
  onOtpCodeChange,
  onOtpVerify,
}: {
  phoneVerificationState: PhoneVerificationState;
  onOtpCodeChange: (otpCode: string[]) => void;
  onOtpVerify: () => void;
}) {
  if (!phoneVerificationState.otpSent) return null;

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-gray-600">Enter the 6-digit code sent to your phone:</p>
      <div className="flex gap-2">
        {phoneVerificationState.otpCode.map((digit, index) => (
          <input
            key={index}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => {
              const newCode = [...phoneVerificationState.otpCode];
              newCode[index] = e.target.value;
              onOtpCodeChange(newCode);
              if (e.target.value && index < 5) {
                const nextInput = e.target.parentElement?.children[index + 1] as HTMLInputElement;
                nextInput?.focus();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !phoneVerificationState.otpCode[index] && index > 0) {
                const prevInput = e.target.parentElement?.children[index - 1] as HTMLInputElement;
                prevInput?.focus();
              }
            }}
            className="w-12 h-12 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        ))}
      </div>
      <button
        onClick={onOtpVerify}
        disabled={phoneVerificationState.otpCode.join('').length !== 6 || phoneVerificationState.verifying}
        className="w-full bg-[#0B4422] text-white px-4 py-2 rounded-lg hover:bg-[#10B981] disabled:bg-gray-300 font-medium"
      >
        {phoneVerificationState.verifying ? 'Verifying...' : 'Verify OTP'}
      </button>
    </div>
  );
}
