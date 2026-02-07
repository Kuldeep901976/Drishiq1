'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { useLanguage } from '@/lib/drishiq-i18n';

export default function PhoneVerificationPage() {
  const router = useRouter();
  const { t } = useLanguage(['payment', 'common', 'chat']);
  const [userPhone, setUserPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [step, setStep] = useState<'frozen' | 'otp'>('frozen');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState('');
  const [otpSentTime, setOtpSentTime] = useState<number | null>(null);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const recaptchaVerifierRef = useRef<any>(null);

  useEffect(() => {
    // Always fetch fresh phone from database to ensure we have the latest
    // Don't rely on sessionStorage which may have stale data
    const fetchPhoneFromDatabase = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/profile?source=signup');
          return;
        }

        // Always fetch latest phone from users table first (most recent)
        const { data: userData, error } = await supabase
          .from('users')
          .select('phone')
          .eq('id', session.user.id)
          .single();

        let phoneFull = null;

        if (!error && userData?.phone) {
          // Use phone from users table (most recent)
          phoneFull = userData.phone;
          console.log('✅ Using phone from users table:', phoneFull);
        } else {
          // Fallback to temporary_signups if not in users table
          console.log('No phone found in users table, checking temporary_signups...');
          
          const { data: tempData, error: tempError } = await supabase
            .from('temporary_signups')
            .select('phone')
            .eq('email', session.user.email)
            .maybeSingle();

          if (tempError || !tempData?.phone) {
            console.log('No phone found, redirecting to profile');
            router.push('/profile?source=signup');
            return;
          }

          phoneFull = tempData.phone;
          console.log('✅ Using phone from temporary_signups:', phoneFull);
        }

        // Extract country code and phone number
        if (phoneFull) {
          const codeMatch = phoneFull.match(/^(\+\d{1,4})/);
          if (codeMatch) {
            setCountryCode(codeMatch[1]);
            setUserPhone(phoneFull.replace(codeMatch[1], '').trim());
          } else {
            setUserPhone(phoneFull);
          }

          // Update sessionStorage with latest phone
          sessionStorage.setItem('userInfo', JSON.stringify({
            ...JSON.parse(sessionStorage.getItem('userInfo') || '{}'),
            phone: phoneFull,
            phoneVerified: false
          }));
        }

      } catch (err) {
        console.error('Error fetching phone from database:', err);
        router.push('/profile?source=signup');
      }
    };

    fetchPhoneFromDatabase();
  }, [router]);

  const handleSendOtp = async () => {
    setLoading(true);
    setError('');

    try {
      const fullPhone = `${countryCode}${userPhone}`;
      
      console.log('📱 Sending OTP to:', fullPhone);

      // Initialize reCAPTCHA verifier if not already done
      // Firebase requires reCAPTCHA for phone auth, but we'll use invisible mode
      if (!recaptchaVerifierRef.current) {
        try {
          // Clean up any existing verifier first
          if (recaptchaVerifierRef.current?.clear) {
            recaptchaVerifierRef.current.clear();
          }
          
          recaptchaVerifierRef.current = new RecaptchaVerifier(
            auth,
            'recaptcha-container',
            {
              size: 'invisible',
              callback: () => {
                // Silently handle - no console log to avoid CSP issues
              },
              'expired-callback': () => {
                // Handle expiration silently
                recaptchaVerifierRef.current = null;
              },
            }
          );
        } catch (err: any) {
          // If reCAPTCHA fails, try to continue anyway
          console.warn('reCAPTCHA initialization:', err.message);
          // Clear and retry
          if (recaptchaVerifierRef.current?.clear) {
            recaptchaVerifierRef.current.clear();
          }
          recaptchaVerifierRef.current = null;
        }
      }

      // Send OTP using Firebase with verifier
      // Handle case where verifier might be null
      let confirmation;
      if (recaptchaVerifierRef.current) {
        confirmation = await signInWithPhoneNumber(
          auth,
          fullPhone,
          recaptchaVerifierRef.current
        );
      } else {
        // Fallback: try without verifier (may not work, but attempt)
        throw new Error(t('chat.phoneVerification.errors.verifierNotReady'));
      }
      
      setConfirmationResult(confirmation);
      setOtpSentTime(Date.now());
      setCanResendOtp(false);
      setResendCountdown(20);
      console.log('✅ OTP sent successfully');
      
      // Move to OTP input step
      setStep('otp');
    } catch (err: any) {
      console.error('❌ Firebase OTP send error:', err);
      setError(err.message || t('chat.phoneVerification.errors.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError(t('chat.phoneVerification.errors.invalidOtp'));
      return;
    }

    if (!confirmationResult) {
      setError(t('chat.phoneVerification.errors.otpExpired'));
      setCanResendOtp(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify OTP using Firebase
      const result = await confirmationResult.confirm(otpCode);
      
      console.log('✅ Firebase phone verified:', result);
      const fullPhone = `${countryCode}${userPhone}`;
      
      // Update user profile in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Update users table
        await supabase
          .from('users')
          .update({ phone_verified: true, phone: fullPhone })
          .eq('id', user.id);

        // Update temporary_signups table
        await supabase
          .from('temporary_signups')
          .update({ phone_verified: true, phone: fullPhone })
          .eq('email', user.email || '');
      }

      // Update sessionStorage
      const userInfoData = sessionStorage.getItem('userInfo');
      if (userInfoData) {
        const userInfo = JSON.parse(userInfoData);
        sessionStorage.setItem('userInfo', JSON.stringify({
          ...userInfo,
          phone: fullPhone,
          phone_verified: true,
          phoneVerified: true
        }));
      }

      // Redirect to pricing page - main plans section
      router.push('/priceplan#main-plans');
    } catch (err: any) {
      console.error('Firebase OTP verification error:', err);
      setError(err.message || t('chat.phoneVerification.errors.invalidCode'));
      setOtpCode('');
      // Enable resend on wrong OTP
      setCanResendOtp(true);
    } finally {
      setLoading(false);
    }
  };


  const handleBack = () => {
    // Navigate to profile page - form will be pre-filled from sessionStorage
    router.push('/profile');
  };

  // Reset countdown when OTP is resent
  const handleResendOtp = async () => {
    setOtpCode('');
    setError('');
    setCanResendOtp(false);
    setResendCountdown(20);
    await handleSendOtp();
  };

  // Timer for 20-second resend countdown
  useEffect(() => {
    if (otpSentTime && step === 'otp') {
      const checkResendTimer = () => {
        const elapsed = Date.now() - otpSentTime;
        const remaining = Math.max(0, 20000 - elapsed);
        
        if (remaining <= 0) {
          setCanResendOtp(true);
          setResendCountdown(0);
        } else {
          setCanResendOtp(false);
          setResendCountdown(Math.ceil(remaining / 1000));
        }
      };

      const interval = setInterval(checkResendTimer, 1000);
      checkResendTimer(); // Check immediately

      return () => clearInterval(interval);
    }
  }, [otpSentTime, step]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-teal-600 text-white mb-4">
            <span className="text-2xl">📱</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('chat.phoneVerification.title')}</h1>
          <p className="text-gray-600 text-sm">
            {step === 'frozen' 
              ? t('chat.phoneVerification.subtitle.frozen')
              : t('chat.phoneVerification.subtitle.otp')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Frozen Phone Display */}
        {step === 'frozen' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('chat.phoneVerification.form.phoneNumber.label')}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed">
                    <span className="text-gray-700 font-medium">{countryCode}</span>
                    <span className="ml-2 text-gray-700">{userPhone}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t('chat.phoneVerification.form.phoneNumber.locked')}
              </p>
            </div>

            {/* reCAPTCHA container (hidden) */}
            <div id="recaptcha-container"></div>

            <button
              onClick={handleSendOtp}
              disabled={loading || !userPhone}
              className="w-full px-6 py-3 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: '#0B4422' }}
              onMouseEnter={(e) => !loading && !(!userPhone) && ((e.target as HTMLButtonElement).style.backgroundColor = '#1a5f3a')}
              onMouseLeave={(e) => !loading && !(!userPhone) && ((e.target as HTMLButtonElement).style.backgroundColor = '#0B4422')}
            >
              {loading ? t('chat.phoneVerification.form.submit.sendingOtp') : t('chat.phoneVerification.form.submit.sendOtp')}
            </button>

            <button
              onClick={handleBack}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              {t('chat.phoneVerification.form.submit.backToProfile')}
            </button>
          </div>
        )}

        {/* Step 2: OTP Input */}
        {step === 'otp' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('chat.phoneVerification.form.otp.label')}
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder={t('chat.phoneVerification.form.otp.placeholder')}
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-2xl tracking-widest"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                {t('chat.phoneVerification.form.otp.sentTo', { phone: `${countryCode}${userPhone}` })}
              </p>
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otpCode.length !== 6}
              className="w-full px-6 py-3 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: '#0B4422' }}
              onMouseEnter={(e) => !loading && otpCode.length === 6 && ((e.target as HTMLButtonElement).style.backgroundColor = '#1a5f3a')}
              onMouseLeave={(e) => !loading && otpCode.length === 6 && ((e.target as HTMLButtonElement).style.backgroundColor = '#0B4422')}
            >
              {loading ? t('chat.phoneVerification.form.submit.verifying') : t('chat.phoneVerification.form.submit.verifyOtp')}
            </button>

            <button
              onClick={handleResendOtp}
              disabled={loading || !canResendOtp}
              className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                canResendOtp
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg transform hover:scale-[1.02]'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {canResendOtp ? t('chat.phoneVerification.form.submit.resendOtp') : t('chat.phoneVerification.form.submit.resendOtpCountdown', { countdown: resendCountdown })}
            </button>

            <button
              onClick={handleBack}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm"
            >
              {t('chat.phoneVerification.form.submit.backToProfile')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

