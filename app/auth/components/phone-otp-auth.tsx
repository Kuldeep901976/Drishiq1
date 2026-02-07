'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function PhoneOTPAuth() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (timer > 0) {
      const interval = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(interval);
    }
  }, [timer]);

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    setError(null);
  };

  const validatePhone = (phoneNumber: string): boolean => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError('Phone number must be 10 digits');
      return false;
    }
    return true;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validatePhone(phone)) return;

    setLoading(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Not authenticated. Please sign up again.');
      }

      setUserId(user.id);

      // Format phone: add country code if not present
      const cleanedPhone = phone.replace(/\D/g, '');
      const phoneWithCode = cleanedPhone.startsWith('1') 
        ? `+${cleanedPhone}` 
        : `+1${cleanedPhone}`;

      console.log(`📱 Sending OTP to ${phoneWithCode}`);

      // Send OTP via Supabase
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: phoneWithCode,
      });

      if (otpError) {
        throw otpError;
      }

      setSuccess(`✅ OTP sent to ${phone}`);
      setStep('otp');
      setTimer(60); // 60 seconds to resend
      setOtp('');

    } catch (err: any) {
      console.error('❌ Error sending OTP:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);

    try {
      const cleanedPhone = phone.replace(/\D/g, '');
      const phoneWithCode = cleanedPhone.startsWith('1') 
        ? `+${cleanedPhone}` 
        : `+1${cleanedPhone}`;

      console.log(`✅ Verifying OTP for ${phoneWithCode}`);

      // Verify OTP
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: phoneWithCode,
        token: otp,
        type: 'sms',
      });

      if (verifyError) {
        throw verifyError;
      }

      // Update user profile with phone number
      const { error: updateError } = await supabase
        .from('users')
        .update({
          phone: phoneWithCode,
          phone_verified: true,
          phone_confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      console.log('✅ Phone verified successfully');
      setSuccess('✅ Phone verified! Redirecting...');
      
      // Redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (err: any) {
      console.error('❌ Error verifying OTP:', err);
      setError(err.message || 'Invalid OTP. Please try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError(null);
    setSuccess(null);
    setTimer(60);

    try {
      const cleanedPhone = phone.replace(/\D/g, '');
      const phoneWithCode = cleanedPhone.startsWith('1') 
        ? `+${cleanedPhone}` 
        : `+1${cleanedPhone}`;

      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneWithCode,
      });

      if (error) throw error;

      setSuccess('✅ OTP resent to your phone');
      setOtp('');
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    }
  };

  const handleEditPhone = () => {
    setStep('phone');
    setOtp('');
    setSuccess(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0B4422] to-emerald-600 px-8 py-8 text-white">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">Verify Phone Number</h1>
              <p className="text-emerald-100 text-sm mt-2">
                {step === 'phone' 
                  ? 'Enter your phone number to receive an OTP'
                  : 'Enter the OTP sent to your phone'}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">❌ {error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">✅ {success}</p>
              </div>
            )}

            {/* Phone Step */}
            {step === 'phone' && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-600 font-medium">+1</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="(123) 456-7890"
                      maxLength={12}
                      autoFocus
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4422]/20 focus:border-[#0B4422] text-sm"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    We'll send a verification code to this number
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.replace(/\D/g, '').length !== 10}
                  className="w-full bg-[#0B4422] text-white py-3 rounded-lg hover:bg-[#0d5429] transition-colors duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>

                <div className="text-center text-sm text-gray-600">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-[#0B4422] hover:underline"
                  >
                    Back to signup
                  </button>
                </div>
              </form>
            )}

            {/* OTP Step */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                
                {/* Phone Display */}
                <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-700">{phone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleEditPhone}
                    className="text-xs text-[#0B4422] hover:underline font-medium"
                  >
                    Edit
                  </button>
                </div>

                {/* OTP Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(value);
                      setError(null);
                    }}
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                    className="w-full px-4 py-3 text-center text-2xl letter-spacing tracking-[0.5em] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4422]/20 focus:border-[#0B4422] font-mono"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Enter the 6-digit code sent to your phone
                  </p>
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-[#0B4422] text-white py-3 rounded-lg hover:bg-[#0d5429] transition-colors duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>

                {/* Resend OTP */}
                <div className="text-center text-xs">
                  <span className="text-gray-600">Didn't receive code?</span>{' '}
                  {timer > 0 ? (
                    <span className="text-gray-500 font-medium">Resend in {timer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-[#0B4422] hover:underline font-medium disabled:opacity-50"
                    >
                      Resend
                    </button>
                  )}
                </div>

                {/* Change Phone */}
                <button
                  type="button"
                  onClick={handleEditPhone}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium text-sm"
                >
                  Use Different Number
                </button>
              </form>
            )}

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700 flex items-start">
                <span className="mr-2">ℹ️</span>
                <span>Standard SMS rates may apply. We'll never share your phone number with third parties.</span>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}