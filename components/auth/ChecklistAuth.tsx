'use client';

import React, { useState, useCallback } from 'react';
import { CheckCircle, XCircle, Phone, Mail } from 'lucide-react';
import PhoneCaptureAuth from './PhoneCaptureAuthSimple';
import EmailAuth from './EmailAuth';
import { AuthSuccess, LinkNeededInfo, AuthError } from './types';

export interface ChecklistAuthProps {
  requirePhone?: boolean;
  requireEmail?: boolean;
  onPhoneSuccess?: (result: AuthSuccess) => void;
  onEmailSuccess?: (result: AuthSuccess) => void;
  onPhoneLinkNeeded?: (info: LinkNeededInfo) => void;
  onEmailLinkNeeded?: (info: LinkNeededInfo) => void;
  onCancel?: () => void;
  submitButtonText?: string;
  onSubmit?: () => void;
  canSubmit?: boolean;
}

export default function ChecklistAuth({
  requirePhone = true,
  requireEmail = true,
  onPhoneSuccess,
  onEmailSuccess,
  onPhoneLinkNeeded,
  onEmailLinkNeeded,
  onCancel,
  submitButtonText = "Continue",
  onSubmit,
  canSubmit = false
}: ChecklistAuthProps) {
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneError, setPhoneError] = useState<AuthError | null>(null);
  const [emailError, setEmailError] = useState<AuthError | null>(null);

  const handlePhoneSuccess = useCallback((result: AuthSuccess) => {
    setPhoneVerified(true);
    setPhoneError(null);
    onPhoneSuccess?.(result);
  }, [onPhoneSuccess]);

  const handleEmailSuccess = useCallback((result: AuthSuccess) => {
    setEmailVerified(true);
    setEmailError(null);
    onEmailSuccess?.(result);
  }, [onEmailSuccess]);

  const handlePhoneLinkNeeded = useCallback((info: LinkNeededInfo) => {
    onPhoneLinkNeeded?.(info);
  }, [onPhoneLinkNeeded]);

  const handleEmailLinkNeeded = useCallback((info: LinkNeededInfo) => {
    onEmailLinkNeeded?.(info);
  }, [onEmailLinkNeeded]);

  const handlePhoneFailure = useCallback((error: AuthError) => {
    setPhoneError(error);
    setPhoneVerified(false);
  }, []);

  const handleEmailFailure = useCallback((error: AuthError) => {
    setEmailError(error);
    setEmailVerified(false);
  }, []);

  const resetPhone = useCallback(() => {
    setPhoneVerified(false);
    setPhoneError(null);
  }, []);

  const resetEmail = useCallback(() => {
    setEmailVerified(false);
    setEmailError(null);
  }, []);

  const isPhoneRequired = requirePhone;
  const isEmailRequired = requireEmail;
  const canProceed = (!isPhoneRequired || phoneVerified) && (!isEmailRequired || emailVerified);

  return (
    <div className="space-y-6">
      {/* Checklist Header */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">Verification Checklist</h3>
        <div className="space-y-3">
          {/* Phone Verification Status */}
          {isPhoneRequired && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Phone Verification</span>
              </div>
              <div className="flex items-center gap-2">
                {phoneVerified ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500">
                    <XCircle className="h-5 w-5" />
                    <span className="text-sm">Required</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Email Verification Status */}
          {isEmailRequired && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Email Verification</span>
              </div>
              <div className="flex items-center gap-2">
                {emailVerified ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500">
                    <XCircle className="h-5 w-5" />
                    <span className="text-sm">Required</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Phone Verification */}
      {isPhoneRequired && !phoneVerified && (
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-semibold text-slate-800">Verify Your Phone</h4>
            {phoneError && (
              <button
                onClick={resetPhone}
                className="text-sm text-slate-500 hover:text-slate-700 underline"
              >
                Reset
              </button>
            )}
          </div>
          
          <PhoneCaptureAuth
            onSuccess={handlePhoneSuccess}
            onLinkNeeded={handlePhoneLinkNeeded}
            onCancel={onCancel}
          />
          
          {phoneError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{phoneError.message}</p>
            </div>
          )}
        </div>
      )}

      {/* Email Verification */}
      {isEmailRequired && !emailVerified && (
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-semibold text-slate-800">Verify Your Email</h4>
            {emailError && (
              <button
                onClick={resetEmail}
                className="text-sm text-slate-500 hover:text-slate-700 underline"
              >
                Reset
              </button>
            )}
          </div>
          
          <EmailAuth
            onSuccess={handleEmailSuccess}
            onLinkNeeded={handleEmailLinkNeeded}
            onCancel={onCancel}
          />
          
          {emailError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{emailError.message}</p>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      {canProceed && onSubmit && (
        <div className="pt-4">
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="w-full bg-[#0B4422] text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitButtonText}
          </button>
        </div>
      )}

      {/* Success Message */}
      {canProceed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">
              All verifications complete! You can now proceed.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
