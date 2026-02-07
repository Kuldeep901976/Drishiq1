"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  PhoneCaptureAuthProps,
  PhoneAuthState,
  AuthSuccess,
} from "./types";
import CountryCodeDropdown from "./CountryCodeDropdown";
import { auth } from "@/lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";

export default function PhoneCaptureAuthSimple({
  prefilledPhone = "",
  onSuccess,
  onCancel,
  onLinkNeeded,
  className = "",
  redirectToInvitationSuccess = false,
}: Omit<PhoneCaptureAuthProps, "requireRecaptcha"> & {
  redirectToInvitationSuccess?: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<PhoneAuthState>({
    step: "phone",
    phone: "",
    countryCode: "+91",
    otp: ["", "", "", "", "", ""],
    isResending: false,
    resendCooldown: 0,
    error: undefined,
  });

  const [verificationId, setVerificationId] = useState<string>("");
  const [confirmationResult, setConfirmationResult] = useState<
    ConfirmationResult | null
  >(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Initialize reCAPTCHA (client-only)
  useEffect(() => {
    if (typeof window === "undefined") return; // only run on client
    if (recaptchaRef.current && !recaptchaVerifierRef.current) {
      try {
        // Workaround TS constructor-signature mismatch: cast constructor to any
        recaptchaVerifierRef.current = new (RecaptchaVerifier as any)(
          "recaptcha-container",
          {
            size: "invisible",
            callback: () => {
              console.log("✅ reCAPTCHA verified successfully");
            },
            "expired-callback": () => {
              console.log("❌ reCAPTCHA expired");
              setState((prev) => ({
                ...prev,
                error: { code: "RECAPTCHA_EXPIRED", message: "reCAPTCHA expired. Please try again." },
              }));
            },
          },
          auth
        );
        console.log("✅ reCAPTCHA initialized");
      } catch (err) {
        console.error("❌ reCAPTCHA initialization failed:", err);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefill phone
  useEffect(() => {
    if (prefilledPhone) {
      const match = prefilledPhone.match(/^(\+\d{1,4})(.*)$/);
      if (match) {
        setState((prev) => ({ ...prev, countryCode: match[1], phone: match[2].trim() }));
      } else {
        setState((prev) => ({ ...prev, phone: prefilledPhone }));
      }
    }
  }, [prefilledPhone]);

  useEffect(() => {
    setState((prev) => ({ ...prev, step: "phone" }));
    setVerificationId("");
    setConfirmationResult(null);
  }, []);

  useEffect(() => {
    if (state.resendCooldown > 0) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, resendCooldown: Math.max(prev.resendCooldown - 1, 0) }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.resendCooldown]);

  const handlePhoneSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!state.phone.trim()) {
        setState((prev) => ({
          ...prev,
          error: { code: "INVALID_PHONE", message: "Please enter a valid phone number" },
        }));
        return;
      }

      if (typeof window === "undefined") {
        setState((prev) => ({ ...prev, error: { code: "SSR_CALL", message: "Phone verification must run in the browser" } }));
        return;
      }

      if (!recaptchaVerifierRef.current) {
        setState((prev) => ({ ...prev, error: { code: "RECAPTCHA_NOT_READY", message: "reCAPTCHA not ready. Please refresh the page." } }));
        return;
      }

      const fullPhoneNumber = state.countryCode + state.phone.trim();
      setState((prev) => ({ ...prev, error: undefined, isResending: true }));

      try {
        try {
          // render may return widget id — call safely
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (recaptchaVerifierRef.current as any).render();
        } catch (renderErr) {
          console.warn("recaptcha render warning:", renderErr);
        }

        const confirmation: ConfirmationResult = await signInWithPhoneNumber(
          auth,
          fullPhoneNumber,
          recaptchaVerifierRef.current as RecaptchaVerifier
        );

        setConfirmationResult(confirmation);
        setVerificationId((confirmation as any).verificationId || "");
        setState((prev) => ({ ...prev, step: "otp", isResending: false, resendCooldown: 30 }));

        if (typeof window !== "undefined") {
          sessionStorage.setItem("firebase_verification_id", (confirmation as any).verificationId || "");
          sessionStorage.setItem("firebase_phone", fullPhoneNumber);
        }
      } catch (error: any) {
        console.error("❌ Firebase OTP send error:", error);
        let errorMessage = "Failed to send OTP";
        if (error?.code === "auth/invalid-phone-number") errorMessage = "Invalid phone number format";
        else if (error?.code === "auth/too-many-requests") errorMessage = "Too many requests. Please try again later.";
        else if (error?.code === "auth/quota-exceeded") errorMessage = "SMS quota exceeded. Please try again later.";
        else if (error?.message) errorMessage = error.message;

        setState((prev) => ({ ...prev, error: { code: "OTP_SEND_FAILED", message: errorMessage }, isResending: false }));
      }
    },
    [state.phone, state.countryCode]
  );

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (value.length > 1) return;
      const newOtp = [...state.otp];
      newOtp[index] = value;
      setState((prev) => ({ ...prev, otp: newOtp, error: undefined }));
      if (value && index < 5) {
        const nextInput = document.querySelector(`input[name="otp-${index + 1}"]`) as HTMLInputElement | null;
        if (nextInput) nextInput.focus();
      }
    },
    [state.otp]
  );

  const handleOtpVerify = useCallback(async () => {
    const otpCode = state.otp.join("");
    if (otpCode.length !== 6) {
      setState((prev) => ({ ...prev, error: { code: "INVALID_OTP_LENGTH", message: "Please enter the complete 6-digit OTP" } }));
      return;
    }

    if (!confirmationResult) {
      setState((prev) => ({ ...prev, error: { code: "NO_VERIFICATION", message: "No verification session found. Please try again." } }));
      return;
    }

    setState((prev) => ({ ...prev, step: "verifying" }));

    try {
      const result = await confirmationResult.confirm(otpCode);
      if (result.user) {
        const authResult: AuthSuccess = { user: result.user as any, session: null, provider: "phone" };
        onSuccess(authResult);
        if (redirectToInvitationSuccess) router.push("/invitation-success");
        else setState((prev) => ({ ...prev, step: "success" }));
      } else {
        throw new Error("Verification failed");
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      let errorMessage = "Failed to verify OTP";
      if (error?.code === "auth/invalid-verification-code" || error?.code === "invalid-verification-code")
        errorMessage = "Invalid OTP code. Please check and try again.";
      else if (error?.code === "auth/code-expired" || error?.code === "code-expired") errorMessage = "OTP code expired. Please request a new one.";
      else if (error?.message) errorMessage = error.message;

      setState((prev) => ({ ...prev, step: "otp", error: { code: "OTP_VERIFY_FAILED", message: errorMessage } }));
    }
  }, [state.otp, confirmationResult, onSuccess, redirectToInvitationSuccess, router]);

  const handleResendOtp = useCallback(async () => {
    if (state.resendCooldown > 0) return;
    setState((prev) => ({ ...prev, isResending: true }));

    try {
      if (recaptchaVerifierRef.current) {
        try {
          (recaptchaVerifierRef.current as any).clear?.();
        } catch {}
        recaptchaVerifierRef.current = null;
      }

      if (typeof window !== "undefined") {
        recaptchaVerifierRef.current = new (RecaptchaVerifier as any)(
          "recaptcha-container",
          {
            size: "invisible",
            callback: () => {
              console.log("✅ reCAPTCHA verified for resend");
            },
            "expired-callback": () => {
              console.log("❌ reCAPTCHA expired for resend");
            }
          },
          auth
        );
      }

      try {
        await (recaptchaVerifierRef.current as any).render();
      } catch (e) {
        console.warn("render warning (resend):", e);
      }

      const fullPhoneNumber = state.countryCode + state.phone.trim();
      const newConfirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifierRef.current as RecaptchaVerifier);

      setConfirmationResult(newConfirmation);
      setVerificationId((newConfirmation as any).verificationId || "");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("firebase_verification_id", (newConfirmation as any).verificationId || "");
        sessionStorage.setItem("firebase_phone", fullPhoneNumber);
      }

      setState((prev) => ({ ...prev, isResending: false, resendCooldown: 60, error: undefined }));
    } catch (error: any) {
      console.error("Error resending OTP:", error);
      let errorMessage = "Failed to resend OTP";
      if (error?.code === "auth/too-many-requests") errorMessage = "Too many requests. Please try again later.";
      else if (error?.message) errorMessage = error.message;
      setState((prev) => ({ ...prev, isResending: false, error: { code: "RESEND_FAILED", message: errorMessage } }));
    }
  }, [state.resendCooldown, state.countryCode, state.phone]);

  const resetToPhone = useCallback(() => {
    setState((prev) => ({ ...prev, step: "phone", otp: ["", "", "", "", "", ""], error: undefined }));
    setVerificationId("");
    setConfirmationResult(null);
  }, []);

  if (state.step === "success") {
    return (
      <div className={`bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center ${className}`}>
        <div className="text-emerald-600 text-lg font-medium">✅ Phone verified successfully!</div>
        <div className="text-emerald-500 text-sm mt-2">Firebase authentication completed successfully</div>
      </div>
    );
  }

  const formatPhoneDisplay = (countryCode: string, phone: string) => `${countryCode} ${phone.replace(/\D/g, "")}`;

  return (
    <div className={`${className}`}>
      {state.step === "phone" && (
        <form onSubmit={handlePhoneSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Phone Number</label>
            <div className="flex gap-3">
              <CountryCodeDropdown value={state.countryCode} onChange={(value) => setState((prev) => ({ ...prev, countryCode: value }))} />
              <input type="tel" value={state.phone} onChange={(e) => setState((prev) => ({ ...prev, phone: e.target.value }))} placeholder="(555) 123-4567" className="flex-1 px-4 py-4 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all duration-200" required />
            </div>
          </div>

          <div id="recaptcha-container" ref={recaptchaRef}></div>

          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="text-red-600 text-sm font-medium">{state.error.message}</div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={state.isResending} className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">{state.isResending ? "Sending..." : "Send OTP"}</button>
            {onCancel && (<button type="button" onClick={onCancel} className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200">Cancel</button>)}
          </div>
        </form>
      )}

      {state.step === "otp" && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Enter Verification Code</h3>
            <p className="text-gray-600">We've sent a 6-digit code to <span className="font-medium">{formatPhoneDisplay(state.countryCode, state.phone)}</span></p>
            <p className="text-blue-600 text-sm mt-2"><strong>💡 Tip:</strong> Check your phone SMS for the verification code</p>
          </div>

          <div className="flex justify-center gap-3">
            {state.otp.map((digit, index) => (
              <input key={index} name={`otp-${index}`} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ""))} className="w-14 h-14 text-center border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-xl font-bold transition-colors duration-200" autoFocus={index === 0} />
            ))}
          </div>

          {state.error && (<div className="bg-red-50 border border-red-200 rounded-xl p-4"><div className="text-red-600 text-sm text-center font-medium">{state.error.message}</div></div>)}

          <div className="flex justify-center pt-4"><button type="button" onClick={handleOtpVerify} disabled={state.otp.some((d) => d === "") || state.otp.join("").length !== 6} className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-4 px-8 rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none">Verify OTP</button></div>

          <div className="flex justify-center gap-6 pt-4">
            <button type="button" onClick={handleResendOtp} disabled={state.isResending || state.resendCooldown > 0} className="text-emerald-600 hover:text-emerald-700 disabled:text-gray-400 disabled:cursor-not-allowed font-medium transition-colors duration-200">{state.isResending ? "Sending..." : state.resendCooldown > 0 ? `Resend in ${state.resendCooldown}s` : "Resend Code"}</button>
            <button type="button" onClick={resetToPhone} className="text-gray-600 hover:text-gray-700 font-medium transition-colors duration-200">Change Phone</button>
          </div>
        </div>
      )}

      {state.step === "verifying" && (<div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-6"></div><p className="text-gray-600 text-lg font-medium">Verifying your code...</p></div>)}
    </div>
  );
}
