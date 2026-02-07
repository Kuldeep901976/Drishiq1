'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Heart, ArrowRight, MessageCircle } from 'lucide-react';
import HeaderUpdated from '../../components/Header';
import Footer from '../../components/Footer';
import { PhoneCaptureAuth } from '../../components/auth';
import { useTrialSupportRedirect } from '../../lib/hooks/useRedirects';

function SilverBar() {
  return (
    <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300" aria-hidden />
  );
}

export default function NeedSupport() {
  const [step, setStep] = useState<'intro' | 'phone-verification' | 'success'>('intro');
  const [phoneVerified, setPhoneVerified] = useState(false);
  
  // Use redirect hook for need support
  const { executeRedirect } = useTrialSupportRedirect({
    autoRedirect: false,
    onComplete: () => {
      console.log('Need support completed, redirecting to invite success');
    }
  });

  const handlePhoneSuccess = () => {
    setPhoneVerified(true);
    setStep('success');
  };

  const handlePhoneLinkNeeded = (info: any) => {
    console.log('Phone linking needed:', info);
    // Handle account linking if needed
  };

  const handleGetSupport = () => {
    setStep('phone-verification');
  };

  const handleContinue = () => {
    // Execute redirect using the hook
    executeRedirect();
  };

  if (step === 'phone-verification') {
    return (
      <>
        <HeaderUpdated />
        <main className="min-h-screen bg-gradient-to-b from-[var(--bg-a,#f8fafc)] to-[var(--bg-b,#e2e8f0)] flex items-center justify-center p-6 pt-24">
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative w-full max-w-md bg-white/90 rounded-2xl shadow-xl ring-1 ring-black/5 p-8"
          >
            <SilverBar />
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#0B4422] mb-2">Verify Your Phone</h2>
              <p className="text-slate-600">We'll send you a verification code to continue</p>
            </div>
            
            <PhoneCaptureAuth
              onSuccess={handlePhoneSuccess}
              onLinkNeeded={handlePhoneLinkNeeded}
              onCancel={() => setStep('intro')}
            />
          </motion.div>
        </main>
        <Footer />
      </>
    );
  }

  if (step === 'success') {
    return (
      <>
        <HeaderUpdated />
        <main className="min-h-screen bg-gradient-to-b from-[var(--bg-a,#f8fafc)] to-[var(--bg-b,#e2e8f0)] flex items-center justify-center p-6 pt-24">
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative w-full max-w-md bg-white/90 rounded-2xl shadow-xl ring-1 ring-black/5 p-8 text-center"
          >
            <SilverBar />
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#0B4422] mb-2">Support Request Received!</h2>
            <p className="text-slate-600 mb-6">
              Thank you for reaching out. Our support team will contact you soon to help with your needs.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                <strong>What happens next?</strong><br />
                • Support team will review your request<br />
                • We'll contact you within 24 hours<br />
                • Personalized assistance provided<br />
                • Follow-up support as needed
              </p>
            </div>
            <button
              onClick={handleContinue}
              className="w-full bg-[#0B4422] text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-900 transition-colors flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <HeaderUpdated />
      <main className="min-h-screen bg-gradient-to-b from-[var(--bg-a,#f8fafc)] to-[var(--bg-b,#e2e8f0)] flex items-center justify-center p-6 pt-24">
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full max-w-2xl bg-white/90 rounded-2xl shadow-xl ring-1 ring-black/5 p-8"
        >
          <SilverBar />
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-[#0B4422] mb-2">Need Support?</h1>
            <p className="text-slate-600">We're here to help you get the most out of DrishiQ</p>
          </div>

          {/* Support Areas */}
          <div className="space-y-6 mb-8">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">🔧 Technical Issues</h3>
                <p className="text-sm text-blue-700">Platform problems, bugs, or technical difficulties</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">📚 Learning Support</h3>
                <p className="text-sm text-green-700">Help understanding features or getting started</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">💳 Billing & Account</h3>
                <p className="text-sm text-purple-700">Payment issues, subscription questions</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-800 mb-2">💬 General Questions</h3>
                <p className="text-sm text-orange-700">Any other questions about DrishiQ</p>
              </div>
            </div>
          </div>

          {/* Support Process */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">How We Help</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#0B4422] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Share Your Need</p>
                  <p className="text-xs text-slate-600">Tell us what you need help with</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#0B4422] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Quick Response</p>
                  <p className="text-xs text-slate-600">We'll get back to you within 24 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#0B4422] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Personalized Help</p>
                  <p className="text-xs text-slate-600">Tailored solutions for your specific situation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Get Support Button */}
          <button
            onClick={handleGetSupport}
            className="w-full bg-[#0B4422] text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-900 transition-colors text-lg flex items-center justify-center gap-2"
          >
            Get Support
            <MessageCircle className="h-5 w-5" />
          </button>

          <p className="text-xs text-slate-500 text-center mt-4">
            Your privacy is important to us. We'll only use your phone number to contact you about your support request.
          </p>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
