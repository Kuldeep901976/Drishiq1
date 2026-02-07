"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  PhoneCaptureAuthProps,
  PhoneAuthState,
  AuthSuccess,
  CountryCode,
} from "./types";
import { auth } from "@/lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";

// Common country codes (your list)
const COUNTRY_CODES: CountryCode[] = [
  { code: "+1", label: "United States (+1)" },
  { code: "+44", label: "United Kingdom (+44)" },
  { code: "+91", label: "India (+91)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+49", label: "Germany (+49)" },
  { code: "+33", label: "France (+33)" },
  { code: "+81", label: "Japan (+81)" },
  { code: "+86", label: "China (+86)" },
  { code: "+7", label: "Russia (+7)" },
  { code: "+55", label: "Brazil (+55)" },
  { code: "+34", label: "Spain (+34)" },
  { code: "+27", label: "South Africa (+27)" },
  { code: "+82", label: "South Korea (+82)" },
  { code: "+62", label: "Indonesia (+62)" },
  { code: "+234", label: "Nigeria (+234)" },
  { code: "+92", label: "Pakistan (+92)" },
  { code: "+880", label: "Bangladesh (+880)" },
  { code: "+20", label: "Egypt (+20)" },
  { code: "+966", label: "Saudi Arabia (+966)" },
  { code: "+971", label: "United Arab Emirates (+971)" },
  { code: "+63", label: "Philippines (+63)" },
  { code: "+60", label: "Malaysia (+60)" },
  { code: "+65", label: "Singapore (+65)" },
  { code: "+64", label: "New Zealand (+64)" },
  { code: "+351", label: "Portugal (+351)" },
  { code: "+90", label: "Turkey (+90)" },
  { code: "+98", label: "Iran (+98)" },
  { code: "+212", label: "Morocco (+212)" },
  { code: "+254", label: "Kenya (+254)" },
  { code: "+94", label: "Sri Lanka (+94)" },
  { code: "+977", label: "Nepal (+977)" },
  { code: "+855", label: "Cambodia (+855)" },
  { code: "+66", label: "Thailand (+66)" },
  { code: "+84", label: "Vietnam (+84)" },
  { code: "+380", label: "Ukraine (+380)" },
  { code: "+994", label: "Azerbaijan (+994)" },
  { code: "+374", label: "Armenia (+374)" },
  { code: "+995", label: "Georgia (+995)" },
  { code: "+961", label: "Lebanon (+961)" },
  { code: "+962", label: "Jordan (+962)" },
  { code: "+964", label: "Iraq (+964)" },
  { code: "+965", label: "Kuwait (+965)" },
  { code: "+968", label: "Oman (+968)" },
  { code: "+973", label: "Bahrain (+973)" },
  { code: "+974", label: "Qatar (+974)" },
  { code: "+975", label: "Bhutan (+975)" },
  { code: "+976", label: "Mongolia (+976)" },
  { code: "+960", label: "Maldives (+960)" },
  { code: "+93", label: "Afghanistan (+93)" },
  { code: "+967", label: "Yemen (+967)" },
  { code: "+972", label: "Israel (+972)" },
  { code: "+992", label: "Tajikistan (+992)" },
  { code: "+993", label: "Turkmenistan (+993)" },
  { code: "+996", label: "Kyrgyzstan (+996)" },
  { code: "+998", label: "Uzbekistan (+998)" },
];

export default function PhoneCaptureAuthFirebase({
  prefilledPhone = "",
  onSuccess,
  onCancel,
  onLinkNeeded,
  className = "",
}: Omit<PhoneCaptureAuthProps, "requireRecaptcha">) {
  const [state, setState] = useState<PhoneAuthState>({
    step: "phone",
    phone: prefilledPhone,
    countryCode: "+1",
    otp: ["", "", "", "", "", ""],
    isResending: false,
    resendCooldown: 0,
    error: undefined,
  });

  const [verificationId, setVerificationId] = useState<string>("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Prefill phone if needed
  useEffect(() => {
    if (!prefilledPhone) return;
    const phoneMatch = prefilledPhone.match(/^(\+\d{1,4})(.+)$/);
    if (phoneMatch) {
      setState((prev) => ({ ...prev, countryCode: phoneMatch[1], phone: phoneMatch[2] }));
    } else {
      setState((prev) => ({ ...prev, phone: prefilledPhone }));
    }
  }, [prefilledPhone]);

  // Force phone step on mount
  useEffect(() => {
    setState((prev) => ({ ...prev, step: "phone" }));
    setVerificationId("");
    setConfirmationResult(null);
    // eslint-disable-next-line no-console
    console.log("🔄 Component reset to phone step");
  }, []);

  // resend cooldown timer
  useEffect(() => {
    if (state.resendCooldown <= 0) return;
    const t = setTimeout(() => {
      setState((prev) => ({ ...prev, resendCooldown: Math.max(prev.resendCooldown - 1, 0) }));
    }, 1000);
    return () => clearTimeout(t);
  }, [state.resendCooldown]);

  // Initialize reCAPTCHA (client only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!recaptchaRef.current || recaptchaVerifierRef.current) return;

    try {
      // Workaround typing mismatch in modular SDK - cast constructor to any
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
      setState((prev) => ({
        ...prev,
        error: { code: "RECAPTCHA_INIT_FAILED", message: "Failed to initialize reCAPTCHA." },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhoneSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!state.phone.trim()) {
        setState((prev) => ({ ...prev, error: { code: "INVALID_PHONE", message: "Please enter a valid phone number" } }));
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

      const fullPhoneNumber = `${state.countryCode}${state.phone.trim()}`;
      setState((prev) => ({ ...prev, error: undefined, isResending: true }));

      try {
        // render may return a widget id; ignore non-fatal render errors
        try {
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

        console.log("✅ Firebase OTP sent successfully", { verificationId: (confirmation as any).verificationId });
      } catch (err: any) {
        console.error("❌ Firebase OTP send error:", err);
        let errorMessage = "Failed to send OTP";
        if (err?.code === "auth/invalid-phone-number") errorMessage = "Invalid phone number format";
        else if (err?.code === "auth/too-many-requests") errorMessage = "Too many requests. Please try again later.";
        else if (err?.code === "auth/quota-exceeded") errorMessage = "SMS quota exceeded. Please try again later.";
        else if (err?.message) errorMessage = err.message;

        setState((prev) => ({ ...prev, error: { code: "OTP_SEND_FAILED", message: errorMessage }, isResending: false }));
      }
    },
    [state.countryCode, state.phone]
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
        // persist cross-page session info
        if (typeof window !== "undefined") {
          sessionStorage.setItem("phone_number", `${state.countryCode}${state.phone.trim()}`);
          sessionStorage.setItem("user_uid", result.user.uid);
          sessionStorage.setItem("firebase_verification_id", (confirmationResult as any).verificationId || "");
        }

        const authResult: AuthSuccess = { user: result.user as any, session: null, provider: "phone" };
        onSuccess?.(authResult);

        if (typeof window !== "undefined") {
          window.location.href = "/early-access/auth/firebase-phone-success";
        }
      } else {
        throw new Error("No user returned from Firebase");
      }
    } catch (err: any) {
      console.error("❌ Firebase OTP verification error:", err);
      let errorMessage = "Failed to verify OTP";
      if (err?.code === "auth/invalid-verification-code" || err?.code === "invalid-verification-code") errorMessage = "Invalid OTP code. Please check and try again.";
      else if (err?.code === "auth/code-expired" || err?.code === "code-expired") errorMessage = "OTP code expired. Please request a new one.";
      else if (err?.message) errorMessage = err.message;

      setState((prev) => ({ ...prev, step: "otp", error: { code: "OTP_VERIFY_FAILED", message: errorMessage } }));
    }
  }, [confirmationResult, onSuccess, state.countryCode, state.phone]);

  const handleResendOtp = useCallback(async () => {
    if (state.resendCooldown > 0) return;

    setState((prev) => ({ ...prev, isResending: true }));

    try {
      // Clear existing verifier if any
      if (recaptchaVerifierRef.current) {
        try {
          // clear may exist on older compat; guard it
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (recaptchaVerifierRef.current as any).clear?.();
        } catch { /* ignore */ }
        recaptchaVerifierRef.current = null;
      }

      if (typeof window !== "undefined") {
        recaptchaVerifierRef.current = new (RecaptchaVerifier as any)(
          "recaptcha-container",
          {
            size: "invisible",
            callback: () => console.log("✅ reCAPTCHA verified for resend"),
            "expired-callback": () => console.log("❌ reCAPTCHA expired for resend"),
          },
          auth
        );
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (recaptchaVerifierRef.current as any).render();
      } catch (renderErr) {
        console.warn("recaptcha render warning (resend):", renderErr);
      }

      const fullPhoneNumber = `${state.countryCode}${state.phone.trim()}`;
      const newConfirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifierRef.current as RecaptchaVerifier);

      setConfirmationResult(newConfirmation);
      setVerificationId((newConfirmation as any).verificationId || "");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("firebase_verification_id", (newConfirmation as any).verificationId || "");
        sessionStorage.setItem("firebase_phone", fullPhoneNumber);
      }

      setState((prev) => ({ ...prev, isResending: false, resendCooldown: 60, error: undefined }));
      console.log("✅ New OTP sent successfully (resend)", { verificationId: (newConfirmation as any).verificationId });
    } catch (err: any) {
      console.error("❌ Error resending OTP:", err);
      const msg = err?.message || "Failed to resend OTP. Please try again.";
      setState((prev) => ({ ...prev, isResending: false, error: { code: "RESEND_FAILED", message: msg } }));
    }
  }, [state.resendCooldown, state.countryCode, state.phone]);

  const resetToPhone = useCallback(() => {
    setState((prev) => ({ ...prev, step: "phone", otp: ["", "", "", "", "", ""], error: undefined }));
    setVerificationId("");
    setConfirmationResult(null);
  }, []);

  return (
    <div className={className}>
      {/* reCAPTCHA container (invisible) */}
      <div id="recaptcha-container" ref={recaptchaRef}></div>

      {/* Notice */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="text-green-800 text-sm">
          <strong>🚀 Real Firebase Mode:</strong> Using Firebase phone authentication.
          <br />
          <strong>Note:</strong> You will receive a real SMS with OTP code.
        </div>
      </div>

      {state.step === "phone" && (
        <form onSubmit={handlePhoneSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Phone Number</label>
            <div className="flex gap-3">
              <select
                value={state.countryCode}
                onChange={(e) => setState((prev) => ({ ...prev, countryCode: e.target.value }))}
                className="w-40 px-4 py-4 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all duration-200"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>

              <input
                type="tel"
                value={state.phone}
                onChange={(e) => setState((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                className="flex-1 px-4 py-4 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
          </div>

          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="text-red-600 text-sm font-medium">{state.error.message}</div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={state.isResending}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.isResending ? "Sending..." : "Send OTP"}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {state.step === "otp" && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Enter Verification Code</h3>
            <p className="text-gray-600">We've sent a 6-digit code to <span className="font-medium">{state.countryCode}{state.phone}</span></p>
            <p className="text-green-600 text-sm mt-2"><strong>Real SMS:</strong> Check your phone for the actual OTP code</p>
          </div>

          <div className="flex justify-center gap-3">
            {state.otp.map((digit, i) => (
              <input
                key={i}
                name={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value.replace(/\D/g, ""))}
                className="w-14 h-14 text-center border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-xl font-bold transition-colors duration-200"
                autoFocus={i === 0}
              />
            ))}
          </div>

          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="text-red-600 text-sm text-center font-medium">{state.error.message}</div>
            </div>
          )}

          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={handleOtpVerify}
              disabled={state.otp.some((d) => d === "") || state.otp.join("").length !== 6}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-4 px-8 rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              Verify OTP
            </button>
          </div>

          <div className="flex justify-center gap-6 pt-4">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={state.isResending || state.resendCooldown > 0}
              className="text-emerald-600 hover:text-emerald-700 disabled:text-gray-400 disabled:cursor-not-allowed font-medium transition-colors duration-200"
            >
              {state.isResending ? "Sending..." : state.resendCooldown > 0 ? `Resend in ${state.resendCooldown}s` : "Resend Code"}
            </button>

            <button
              type="button"
              onClick={resetToPhone}
              className="text-gray-600 hover:text-gray-700 font-medium transition-colors duration-200"
            >
              Change Phone
            </button>
          </div>
        </div>
      )}

      {state.step === "verifying" && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Verifying your code...</p>
        </div>
      )}
    </div>
  );
}
