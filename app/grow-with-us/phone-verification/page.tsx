"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { Headset, Heart, Rocket, RefreshCcw } from "lucide-react";
import Footer from "../../../components/Footer";
import { useLanguage } from "../../../lib/drishiq-i18n";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const roleMessages = {
  investor: {
    title: "🎉 Investment Application Submitted!",
    subtitle: "Verify your phone to complete your investment application",
    successTitle: "Investment Application Complete!",
    successMessage: "Thank you for your interest in investing in DrishiQ. Our team will review your application and contact you within 24-48 hours."
  },
  promoter: {
    title: "📢 Promoter Application Submitted!",
    subtitle: "Verify your phone to complete your promoter application",
    successTitle: "Promoter Application Complete!",
    successMessage: "Thank you for your interest in promoting DrishiQ. Our team will review your application and contact you within 24-48 hours."
  },
  ambassador: {
    title: "🌍 Ambassador Application Submitted!",
    subtitle: "Verify your phone to complete your ambassador application",
    successTitle: "Ambassador Application Complete!",
    successMessage: "Thank you for your interest in becoming a DrishiQ ambassador. Our team will review your application and contact you within 24-48 hours."
  },
  creator: {
    title: "🎨 Creator Application Submitted!",
    subtitle: "Verify your phone to complete your creator application",
    successTitle: "Creator Application Complete!",
    successMessage: "Thank you for your interest in creating with DrishiQ. Our team will review your application and contact you within 24-48 hours."
  },
  affiliate: {
    title: "🤝 Affiliate Application Submitted!",
    subtitle: "Verify your phone to complete your affiliate application",
    successTitle: "Affiliate Application Complete!",
    successMessage: "Thank you for your interest in our affiliate program. Our team will review your application and contact you within 24-48 hours."
  },
  referral: {
    title: "🔗 Referral Application Submitted!",
    subtitle: "Verify your phone to complete your referral application",
    successTitle: "Referral Application Complete!",
    successMessage: "Thank you for your interest in referring others to DrishiQ. Our team will review your application and contact you within 24-48 hours."
  }
};

export default function HeadsetVerificationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage(['growwithus1']);
  const role = searchParams.get('role') || 'general';
  const phone = searchParams.get('phone') || '';

  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);


  const roleInfo = roleMessages[role as keyof typeof roleMessages] || roleMessages.investor;

  useEffect(() => {
    // Auto-send OTP when page loads
    sendOtp();
  }, []);

  async function sendOtp() {
    try {
      setResending(true);
      setError(null);
      
      // TODO: Implement actual OTP sending API
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error("Failed to send OTP");
      }
    } catch (e: any) {
      setError(e.message || "Could not send OTP. Please try again.");
    } finally {
      setResending(false);
    }
  }

  async function verifyOtp() {
    try {
      setError(null);
      setVerifying(true);
      const code = otpCode.join("");
      
      // TODO: Implement actual OTP verification API
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error("Invalid code. Please try again.");
      }
      
      setVerified(true);
      
      // Redirect to success page after 2 seconds
      setTimeout(() => {
        router.push(`/grow-with-us/success?role=${role}`);
      }, 2000);
      
    } catch (e: any) {
      setError(e.message || "Verification failed. Try again.");
    } finally {
      setVerifying(false);
    }
  }

  function handleOtpChange(idx: number, val: string) {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otpCode];
    next[idx] = val;
    setOtpCode(next);
    
    // Auto-focus next input
    if (val && idx < 5) {
      const nextInput = document.querySelector(`input[data-index="${idx + 1}"]`) as HTMLInputElement;
      nextInput?.focus();
    }
  }

  if (verified) {
    return (
      <>
        <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6 pt-24">
          <motion.div
            {...fadeUp}
            className="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl ring-1 ring-black/5 p-8 md:p-12 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl mx-auto mb-6">
              <Heart className="h-12 w-12 text-white" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4">
              {roleInfo.successTitle}
            </h1>
            
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              {roleInfo.successMessage}
            </p>
            
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">What's next?</span> You'll receive a confirmation email shortly, and our team will contact you within 24-48 hours with next steps.
              </p>
            </div>
          </motion.div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-6 pt-24">
        <motion.div
          {...fadeUp}
          className="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl ring-1 ring-black/5 p-8 md:p-12"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg mx-auto mb-4">
              <Headset className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              {t(`growwithus1.phone_verification.${role}.title`) || roleInfo.title}
            </h1>
            <p className="text-lg text-slate-600">
              {t(`growwithus1.phone_verification.${role}.subtitle`) || roleInfo.subtitle}
            </p>
          </div>

          {/* Headset Verification Form */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
              <p className="text-center text-slate-700 mb-4">
                We've sent a 6-digit verification code to:
                <br />
                <span className="font-semibold text-slate-900 text-lg">{phone}</span>
              </p>
              
              <div className="flex items-center justify-center gap-3 mb-6">
                {otpCode.map((v, i) => (
                  <input
                    key={i}
                    data-index={i}
                    inputMode="numeric"
                    maxLength={1}
                    className="w-12 h-12 text-center text-xl font-bold rounded-lg border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={v}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={verifyOtp}
                  disabled={verifying || otpCode.join("").length !== 6}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {verifying ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Verifying...
                    </span>
                  ) : "Verify Code"}
                </button>
                
                <button
                  onClick={sendOtp}
                  disabled={resending}
                  className="px-4 py-3 text-slate-500 hover:text-slate-700 font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <RefreshCcw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
                  {resending ? "Sending..." : "Resend"}
                </button>
              </div>
              
              {error && (
                <p className="mt-4 text-sm text-red-600 text-center bg-red-50 p-3 rounded-lg">{error}</p>
              )}
            </div>
            
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
              <p className="text-sm text-slate-700 text-center">
                <span className="font-semibold">Didn't receive the code?</span> Check your spam folder or try resending. The code expires in 10 minutes.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
