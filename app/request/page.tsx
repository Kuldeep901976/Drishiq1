'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Footer from '../../components/Footer';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/drishiq-i18n';
import { motion } from 'framer-motion';
import CountryCodeSelector from '@/components/CountryCodeSelector';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { Smartphone, KeyRound, User, MessageSquare, Target, Heart, Loader2 } from 'lucide-react';
import { isValidEmail } from '@/lib/validation';

// Helper function to get request type label
function getTypeLabel(type: string, t: (key: string) => string): string {
  return type === 'trial_access' ? t('request.tabs.trialAccess.label').replace('🎯 ', '') : t('request.tabs.sponsorSupport.label').replace('💚 ', '');
}

// Comprehensive country list
const COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'NP', name: 'Nepal' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'EG', name: 'Egypt' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'KR', name: 'South Korea' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'IE', name: 'Ireland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'RU', name: 'Russia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'IL', name: 'Israel' },
  { code: 'OTHER', name: 'Other' },
];

interface RequestForm {
  // Common fields
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  location: string; // City
  comments: string;
  
}

export default function RequestPage() {
  const router = useRouter();
  const { t, locale } = useLanguage(['request']);
  const [activeTab, setActiveTab] = useState<'trial' | 'sponsor'>('trial');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Step-based flow state - matching signup flow
  const [currentStep, setCurrentStep] = useState<'form' | 'frozen' | 'otp' | 'success'>('form');
  
  // Phone verification state
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(''); // Single string like signup flow
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [phoneCheckError, setPhoneCheckError] = useState<string | null>(null);
  const [emailCheckError, setEmailCheckError] = useState<string | null>(null);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const [otpSentTime, setOtpSentTime] = useState<number | null>(null);
  const [billingError, setBillingError] = useState(false); // Track if billing error occurred
  const [allowBypass, setAllowBypass] = useState(false); // Allow bypass for development
  
  // Firebase phone verification
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  
  const [formData, setFormData] = useState<RequestForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'IN',
    location: '',
    comments: ''
  });

  // Separate state for country code and phone number
  const [phoneCountryCode, setPhoneCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Track if we're on sponsor-support route or trial-access route
  const [isSponsorSupportRoute, setIsSponsorSupportRoute] = useState(false);
  const [isTrialAccessRoute, setIsTrialAccessRoute] = useState(false);

  // Handle hash-based tab selection (e.g., /request#sponsor-support)
  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.slice(1); // Remove the # symbol
        if (hash === 'sponsor-support' || hash === 'sponsor') {
          setActiveTab('sponsor');
          setIsSponsorSupportRoute(true);
          setIsTrialAccessRoute(false);
          // Scroll to top of form section after a brief delay to ensure tab is set
          setTimeout(() => {
            const formSection = document.querySelector('.max-w-4xl');
            if (formSection) {
              formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        } else if (hash === 'trial-access' || hash === 'trial') {
          setActiveTab('trial');
          setIsSponsorSupportRoute(false);
          setIsTrialAccessRoute(true);
        } else {
          setIsSponsorSupportRoute(false);
          setIsTrialAccessRoute(false);
        }
      }
    };

    // Initial check
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-update phone country code when country changes
    if (name === 'country') {
      // Map country code to phone country code (simplified mapping)
      const countryToPhoneCode: Record<string, string> = {
        'IN': '+91', 'US': '+1', 'GB': '+44', 'CA': '+1', 'AU': '+61',
        'DE': '+49', 'FR': '+33', 'ES': '+34', 'IT': '+39', 'JP': '+81',
        'CN': '+86', 'BR': '+55', 'MX': '+52', 'AE': '+971', 'SA': '+966',
        'SG': '+65', 'BD': '+880', 'PK': '+92', 'LK': '+94', 'NP': '+977',
        'ZA': '+27', 'NG': '+234', 'KE': '+254', 'EG': '+20', 'AR': '+54',
        'CL': '+56', 'CO': '+57', 'PE': '+51', 'PH': '+63', 'ID': '+62',
        'MY': '+60', 'TH': '+66', 'VN': '+84', 'KR': '+82', 'TW': '+886',
        'HK': '+852', 'NZ': '+64', 'IE': '+353', 'PT': '+351', 'NL': '+31',
        'BE': '+32', 'CH': '+41', 'AT': '+43', 'SE': '+46', 'NO': '+47',
        'DK': '+45', 'FI': '+358', 'PL': '+48', 'RU': '+7', 'TR': '+90',
        'IL': '+972'
      };
      const phoneCode = countryToPhoneCode[value] || '+1';
      setPhoneCountryCode(phoneCode);
    }
  };


  const validateForm = (): boolean => {
    // All fields are mandatory for both trial and sponsor support
    if (!formData.firstName.trim()) {
      setSubmitError(t('request.errors.validation.firstNameRequired'));
      return false;
    }
    if (!formData.lastName.trim()) {
      setSubmitError(t('request.errors.validation.lastNameRequired'));
      return false;
    }
    if (!formData.email.trim() || !isValidEmail(formData.email)) {
      setSubmitError(t('request.errors.validation.emailRequired'));
      return false;
    }
    if (!phoneNumber.trim()) {
      setSubmitError(t('request.errors.validation.phoneRequired'));
      return false;
    }
    if (!formData.country) {
      setSubmitError(t('request.errors.validation.countryRequired'));
      return false;
    }
    if (!formData.location.trim()) {
      setSubmitError(t('request.errors.validation.locationRequired'));
      return false;
    }
    if (!formData.comments.trim()) {
      setSubmitError(t('request.errors.validation.commentsRequired'));
      return false;
    }
    
    
    setSubmitError(null);
    return true;
  };

  // Check if email or phone already exists in users table
  const checkUserExists = async (email: string, phone: string): Promise<boolean> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPhone = phone.trim().replace(/\s+/g, '');
      
      const response = await fetch('/api/request/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: normalizedEmail,
          phone: normalizedPhone 
        })
      });

      const data = await response.json();
      
      if (response.status === 409) {
        // User exists
        if (data.emailExists) {
          setEmailCheckError(data.message || t('request.errors.userExists.email'));
        }
        if (data.phoneExists) {
          setPhoneCheckError(data.message || t('request.errors.userExists.phone'));
        }
        
        // Show sign in link
        if (data.signInUrl) {
          setSubmitError(`${data.message} ${t('request.errors.userExists.message')}`);
        }
        return true;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check user');
      }

      // User doesn't exist
      setPhoneCheckError(null);
      setEmailCheckError(null);
      return false;
    } catch (error: any) {
      console.error('Error checking user:', error);
      setSubmitError(t('request.errors.submission.phoneCheckFailed'));
      return true; // Assume exists to prevent submission
    }
  };


  // Initialize Firebase Recaptcha (invisible - required by Firebase but hidden from users)
  const initializeRecaptcha = () => {
    if (typeof window === 'undefined' || recaptchaVerifierRef.current) {
      return;
    }

    try {
      // Create a hidden container for reCAPTCHA if it doesn't exist
      let container = document.getElementById('recaptcha-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'recaptcha-container';
        container.style.display = 'none'; // Hide it completely
        document.body.appendChild(container);
      } else {
        container.innerHTML = '';
      }

      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible', // Invisible reCAPTCHA - users won't see it
        callback: () => {
          console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          if (recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current.clear();
            recaptchaVerifierRef.current = null;
          }
        }
      });
    } catch (error: any) {
      console.error('Error initializing RecaptchaVerifier:', error);
    }
  };

  // Step 1: Validate and move to phone confirmation step
  const handleSendVerificationCode = async () => {
    if (!validateForm()) {
      return;
    }

    const fullPhone = `${phoneCountryCode}${phoneNumber.trim()}`.replace(/\s+/g, '');
    
    // Check if user exists
    const userExists = await checkUserExists(formData.email.trim(), fullPhone);
    if (userExists) {
      return; // Error message already set by checkUserExists
    }

    // Move to frozen phone confirmation step (matching signup flow)
    setCurrentStep('frozen');
    setSubmitError(null);
  };

  // Step 2: Send OTP and move to OTP entry step
  const handleSendOTP = async () => {
    const fullPhone = `${phoneCountryCode}${phoneNumber.trim()}`.replace(/\s+/g, '');
    
    setPhoneVerifying(true);
    setPhoneCheckError(null);
    setEmailCheckError(null);
    setSubmitError(null);

    try {
      // Check phone availability via API
      const checkResponse = await fetch('/api/request/verify-phone-firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          action: 'check'
        })
      });

      const checkData = await checkResponse.json();

      if (!checkResponse.ok || checkData.exists) {
        if (checkResponse.status === 409) {
          setPhoneCheckError(checkData.message || 'This phone number is already registered');
          if (checkData.signInUrl) {
            setSubmitError(`${checkData.message} Please sign in or use different credentials.`);
          }
        } else {
          throw new Error(checkData.error || 'Failed to verify phone number');
        }
        setPhoneVerifying(false);
        return;
      }

      // Initialize reCAPTCHA if not already done (invisible - users won't see it)
      if (!recaptchaVerifierRef.current) {
        initializeRecaptcha();
        
        // If still not initialized, wait a bit and retry
        if (!recaptchaVerifierRef.current) {
          await new Promise(resolve => setTimeout(resolve, 500));
          initializeRecaptcha();
        }
        
        if (!recaptchaVerifierRef.current) {
          throw new Error('reCAPTCHA initialization failed. Please refresh the page and try again.');
        }
      }

      // Send OTP using Firebase
      const confirmation = await signInWithPhoneNumber(
        auth,
        fullPhone,
        recaptchaVerifierRef.current
      );

      setConfirmationResult(confirmation);
      setOtpSent(true);
      setPhoneVerifying(false);
      setSubmitError(null);
      setOtpSentTime(Date.now());
      setCanResendOtp(false);
      setResendCountdown(20);
      
      // Move to OTP entry step
      setCurrentStep('otp');
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      let errorMessage = t('request.errors.submission.sendOtpFailed');
      
      if (error?.code === 'auth/invalid-phone-number') {
        errorMessage = t('request.errors.submission.invalidPhone');
      } else if (error?.code === 'auth/too-many-requests') {
        errorMessage = t('request.errors.submission.tooManyRequests');
      } else if (error?.code === 'auth/quota-exceeded') {
        errorMessage = t('request.errors.submission.quotaExceeded');
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Handle billing error specifically
      if (error?.code === 'auth/billing-not-enabled') {
        setBillingError(true);
        setSubmitError(
          `${t('request.phoneVerification.errors.billing.title')} ${t('request.phoneVerification.errors.billing.message')}`
        );
        setPhoneVerifying(false);
        // Stay on frozen step to show error and allow retry or bypass
      } else {
        setSubmitError(errorMessage);
        setPhoneVerifying(false);
      }
    }
  };

  // Step 3: Verify OTP and submit request
  const verifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setSubmitError(t('request.errors.validation.invalidOtp'));
      return;
    }

    if (!confirmationResult) {
      setSubmitError(t('request.errors.validation.otpExpired'));
      setCanResendOtp(true);
      setCurrentStep('frozen');
      return;
    }

    setVerifyingOtp(true);
    setSubmitError(null);

    try {
      // Verify OTP with Firebase
      const result = await confirmationResult.confirm(otpCode);

      if (result.user) {
        // Phone verified successfully
        setPhoneVerified(true);
        setVerifyingOtp(false);
        
        // Submit the request
        await submitRequest();
      } else {
        throw new Error('Verification failed');
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      let errorMessage = t('request.errors.otp.invalid');
      
      if (error?.code === 'auth/invalid-verification-code') {
        errorMessage = t('request.errors.otp.invalidCode');
      } else if (error?.code === 'auth/code-expired') {
        errorMessage = t('request.errors.otp.expired');
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setSubmitError(errorMessage);
      setOtpCode('');
      setVerifyingOtp(false);
      // Enable resend on wrong OTP
      setCanResendOtp(true);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    setOtpCode('');
    setSubmitError(null);
    setCanResendOtp(false);
    setResendCountdown(20);
    await handleSendOTP();
  };

  // Timer for resend countdown (matching signup flow)
  useEffect(() => {
    if (otpSentTime && currentStep === 'otp') {
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
  }, [otpSentTime, currentStep]);

  // Submit request after phone verification
  const submitRequest = async () => {
    // Allow bypass only in development mode and if billing error occurred
    if (!phoneVerified && !(allowBypass && process.env.NODE_ENV === 'development')) {
      setSubmitError(t('request.errors.validation.phoneNotVerified'));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const requestType = activeTab === 'trial' ? 'trial_access' : 'sponsor_support';
      
      // Combine country code and phone number for storage
      const fullPhone = `${phoneCountryCode}${phoneNumber.trim()}`.replace(/\s+/g, '');
      
      const requestData: any = {
        request_type: requestType,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: fullPhone, // Combined phone number with country code
        country: formData.country,
        location: formData.location.trim() || null,
        comments: formData.comments.trim() || null,
      };

      // Add sponsor support specific fields
      if (activeTab === 'sponsor') {
        requestData.challenge_domain = null;
        requestData.challenge_sub_category = null;
        requestData.challenge_specific = null;
        requestData.challenge_issues = null;
        requestData.challenge_other_text = null;
        requestData.challenge_description = null;
        requestData.challenge_combined_value = null;
      }

      const { data, error } = await supabase
        .from('requests')
        .insert([requestData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log activity for request submission (if user_activities table exists)
      if (data) {
        try {
          const { error: activityError } = await supabase
            .from('user_activities')
            .insert({
              user_id: null, // No user yet, will be created when invitation is sent
              activity_type: 'request_submitted',
              activity_category: 'request_management',
              actor_type: 'user',
              actor_id: null,
              actor_email: formData.email.trim(),
              target_type: 'request',
              target_id: data.id,
              title: 'Request Submitted',
              description: `${getTypeLabel(requestType, t)} request submitted by ${formData.firstName} ${formData.lastName} (${formData.email})`,
              request_id: data.id,
              status: 'completed',
              metadata: {
                request_type: requestType,
                email: formData.email.trim(),
                phone: `${phoneCountryCode}${phoneNumber.trim()}`,
                country: formData.country
              }
            });
          
          if (activityError) {
            // Activity table may not exist yet - log but don't fail request submission
            console.warn('Could not log request submission activity:', activityError);
          }
        } catch (err) {
          // Activity table may not exist yet - log but don't fail request submission
          console.warn('Could not log request submission activity:', err);
        }
      }

      // Success - move to success step
      setCurrentStep('success');
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        country: 'IN',
        location: '',
        comments: ''
      });

      // Reset phone fields
      setPhoneCountryCode('+91');
      setPhoneNumber('');

      // Reset verification state
      setPhoneVerified(false);
      setOtpSent(false);
      setOtpCode('');
      setCanResendOtp(false);
      setResendCountdown(0);
      setOtpSentTime(null);

    } catch (error: any) {
      console.error('Error submitting request:', error);
      setSubmitError(error.message || t('request.errors.submission.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission is handled by "Verify Phone First" button
    // This prevents accidental form submission without verification
    if (currentStep === 'form' && !phoneVerified) {
      setSubmitError(t('request.errors.validation.phoneNotVerifiedDetails'));
      // Scroll to phone verification section
      setTimeout(() => {
        const phoneSection = document.querySelector('[data-phone-verification]');
        if (phoneSection) {
          phoneSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // Render different steps - matching signup flow
  if (currentStep === 'frozen') {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
            >
              <div className="text-center mb-8">
                <div className="mb-4 flex justify-center">
                  <Smartphone size={48} className="text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('request.phoneVerification.frozen.title')}</h2>
                <p className="text-gray-600">{t('request.phoneVerification.frozen.subtitle')}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('request.phoneVerification.frozen.phoneLabel')}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex items-center px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed">
                      <span className="text-gray-700 font-medium">{phoneCountryCode}</span>
                      <span className="ml-2 text-gray-700">{phoneNumber}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {t('request.phoneVerification.frozen.info')}
                </p>
              </div>

              {submitError && (
                <div className={`border-2 rounded-xl p-4 mb-6 ${
                  submitError.includes('billing') 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className={`text-sm ${
                    submitError.includes('billing') 
                      ? 'text-yellow-800' 
                      : 'text-red-600'
                  }`}>
                    {submitError}
                  </p>
                  {submitError.includes('billing') && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-yellow-700 font-semibold">{t('request.phoneVerification.errors.billing.steps.title')}</p>
                      <ol className="text-xs text-yellow-700 list-decimal list-inside space-y-1 ml-2">
                        <li>{t('request.phoneVerification.errors.billing.steps.step1')}</li>
                        <li>{t('request.phoneVerification.errors.billing.steps.step2')}</li>
                        <li>{t('request.phoneVerification.errors.billing.steps.step3')}</li>
                        <li>{t('request.phoneVerification.errors.billing.steps.step4')}</li>
                      </ol>
                      <p className="text-xs text-yellow-700 mt-2">
                        {t('request.phoneVerification.errors.billing.contact', { email: 'support@drishiq.com' })}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {phoneCheckError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-red-600 text-sm">{phoneCheckError}</p>
                  <Link href="/signin" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                    {t('request.errors.userExists.signInLink')}
                  </Link>
                </div>
              )}

              <div className="flex gap-4">
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={phoneVerifying || !phoneNumber}
                className="w-full px-6 py-3 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-3"
                style={{ backgroundColor: '#0B4422' }}
                onMouseEnter={(e) => !phoneVerifying && phoneNumber && ((e.target as HTMLButtonElement).style.backgroundColor = '#1a5f3a')}
                onMouseLeave={(e) => !phoneVerifying && phoneNumber && ((e.target as HTMLButtonElement).style.backgroundColor = '#0B4422')}
              >
                {phoneVerifying ? t('request.phoneVerification.frozen.sendingOtp') : t('request.phoneVerification.frozen.sendOtp')}
              </button>

              {/* Show bypass option only if billing error occurred (for development/testing) */}
              {billingError && process.env.NODE_ENV === 'development' && (
                <button
                  type="button"
                  onClick={async () => {
                    // Bypass verification for development - mark as verified and submit
                    setPhoneVerified(true);
                    setAllowBypass(true);
                    await submitRequest();
                  }}
                  className="w-full px-6 py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors mb-3"
                >
                  {t('request.phoneVerification.frozen.bypassDev')}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setCurrentStep('form');
                  setBillingError(false);
                }}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                {t('request.phoneVerification.frozen.backToForm')}
              </button>
              </div>

            </motion.div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (currentStep === 'otp') {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
            >
              <div className="text-center mb-8">
                <div className="mb-4 flex justify-center">
                  <KeyRound size={48} className="text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('request.phoneVerification.otp.title')}</h2>
                <p className="text-gray-600 text-sm mb-4">
                  {t('request.phoneVerification.otp.subtitle')}
                </p>
              </div>

              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('request.phoneVerification.otp.label')}
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder={t('request.phoneVerification.otp.placeholder')}
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center text-2xl tracking-widest"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {t('request.phoneVerification.otp.sentTo', { phone: `${phoneCountryCode}${phoneNumber}` })}
                </p>
              </div>

              <button
                type="button"
                onClick={verifyOTP}
                disabled={verifyingOtp || otpCode.length !== 6}
                className="w-full px-6 py-3 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-3"
                style={{ backgroundColor: '#0B4422' }}
                onMouseEnter={(e) => !verifyingOtp && otpCode.length === 6 && ((e.target as HTMLButtonElement).style.backgroundColor = '#1a5f3a')}
                onMouseLeave={(e) => !verifyingOtp && otpCode.length === 6 && ((e.target as HTMLButtonElement).style.backgroundColor = '#0B4422')}
              >
                {verifyingOtp ? t('request.phoneVerification.otp.verifying') : t('request.phoneVerification.otp.verify')}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={verifyingOtp || !canResendOtp}
                className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-200 mb-3 ${
                  canResendOtp
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg transform hover:scale-[1.02]'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {canResendOtp ? t('request.phoneVerification.otp.resend') : t('request.phoneVerification.otp.resendCountdown', { countdown: resendCountdown })}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep('frozen');
                  setOtpCode('');
                }}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm"
              >
                {t('request.phoneVerification.otp.back')}
              </button>

            </motion.div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (currentStep === 'success') {
    const requestTypeParam = activeTab === 'trial' ? 'trial' : 'sponsor';
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header with gradient */}
              <div className={`px-8 py-12 text-center relative overflow-hidden ${
                activeTab === 'trial'
                  ? 'bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600'
                  : 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600'
              }`}>
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full"></div>
                  <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white rounded-full"></div>
                </div>
                
                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg"
                  >
                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-5xl font-bold text-white mb-3"
                  >
                    {activeTab === 'trial' ? t('request.success.title.trial') : t('request.success.title.sponsor')}
                  </motion.h1>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl text-white/90 mb-2"
                  >
                    {t('request.success.phoneVerified')}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-lg text-white/80 mb-2"
                  >
                    {phoneCountryCode}{phoneNumber}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-lg text-white/80"
                  >
                    {formData.email}
                  </motion.p>
                </div>
              </div>

              {/* Content */}
              <div className="px-8 py-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-center mb-8"
                >
                  <p className="text-lg text-gray-700 mb-6">
                    {activeTab === 'trial'
                      ? t('request.success.message.trial')
                      : t('request.success.message.sponsor')
                    }
                  </p>

                  <div className={`rounded-xl p-6 mb-6 text-left ${
                    activeTab === 'trial'
                      ? 'bg-emerald-50 border-2 border-emerald-200'
                      : 'bg-purple-50 border-2 border-purple-200'
                  }`}>
                    <p className={`text-base font-semibold mb-3 ${
                      activeTab === 'trial' ? 'text-emerald-900' : 'text-purple-900'
                    }`}>
                      {t('request.success.whatHappensNext.title')}
                    </p>
                    {activeTab === 'trial' ? (
                      <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                        <li>{t('request.success.whatHappensNext.trial.item1')}</li>
                        <li>{t('request.success.whatHappensNext.trial.item2')}</li>
                        <li>{t('request.success.whatHappensNext.trial.item3')}</li>
                        <li>{t('request.success.whatHappensNext.trial.item4')}</li>
                        <li>{t('request.success.whatHappensNext.trial.item5')}</li>
                      </ul>
                    ) : (
                      <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                        <li>{t('request.success.whatHappensNext.sponsor.item1')}</li>
                        <li>{t('request.success.whatHappensNext.sponsor.item2')}</li>
                        <li>{t('request.success.whatHappensNext.sponsor.item3')}</li>
                        <li>{t('request.success.whatHappensNext.sponsor.item4')}</li>
                        <li>{t('request.success.whatHappensNext.sponsor.item5')}</li>
                      </ul>
                    )}
                  </div>

                  {/* YouTube Playlist Embed */}
                  <div className="mt-8 mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                      {t('request.success.youtube.title')}
                    </h3>
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        className="absolute top-0 left-0 w-full h-full rounded-xl shadow-lg"
                        src="https://www.youtube.com/embed/videoseries?list=PLkvOieJ_pAbDGUm6laWiJtbxTGoNZjKkN"
                        title="DrishiQ YouTube Playlist"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                    <Link
                      href="/"
                      className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                        activeTab === 'trial'
                          ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:from-emerald-600 hover:to-blue-600'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                      } shadow-lg hover:shadow-xl transform hover:scale-105`}
                    >
                      {t('request.success.buttons.returnHome')}
                    </Link>
                    
                    <Link
                      href="/blog"
                      className="px-6 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all shadow-md hover:shadow-lg"
                    >
                      {t('request.success.buttons.learnMore')}
                    </Link>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Step 'form' - show the form
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Hero Section */}
        <section className="relative pt-24 pb-12 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-black text-gray-900 mb-6"
            >
              {isTrialAccessRoute ? (
                <>
                  {t('request.hero.trialAccess.title').split(' ')[0]}{' '}
                  <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {t('request.hero.trialAccess.title').split(' ').slice(1).join(' ')}
                  </span>
                </>
              ) : isSponsorSupportRoute ? (
                <>
                  {t('request.hero.sponsorSupport.title').split(' ')[0]}{' '}
                  <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                    {t('request.hero.sponsorSupport.title').split(' ').slice(1).join(' ')}
                  </span>
                </>
              ) : (
                <>
                  {t('request.hero.default.title').split(' ')[0]}{' '}
                  <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {t('request.hero.default.title').split(' ').slice(1).join(' ')}
                  </span>
                </>
              )}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 mb-12"
            >
              {isTrialAccessRoute
                ? t('request.hero.trialAccess.subtitle')
                : isSponsorSupportRoute
                ? t('request.hero.sponsorSupport.subtitle')
                : t('request.hero.default.subtitle')
              }
            </motion.p>
          </div>
        </section>

        {/* Main Form Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8"
          >
            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b-2 border-gray-200">
              <button
                type="button"
                onClick={() => {
                  if (!isSponsorSupportRoute) {
                    setActiveTab('trial');
                    setSubmitError(null);
                  }
                }}
                disabled={isSponsorSupportRoute}
                className={`flex-1 py-4 px-6 text-lg font-semibold rounded-t-xl transition-all duration-300 ${
                  isSponsorSupportRoute
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                    : activeTab === 'trial'
                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                title={isSponsorSupportRoute ? t('request.tabs.trialAccess.title') : t('request.tabs.trialAccess.title')}
              >
                {t('request.tabs.trialAccess.label')}
                {isSponsorSupportRoute && <span className="ml-2 text-xs">{t('request.tabs.trialAccess.unavailable')}</span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isTrialAccessRoute) {
                    setActiveTab('sponsor');
                    setSubmitError(null);
                  }
                }}
                disabled={isTrialAccessRoute}
                className={`flex-1 py-4 px-6 text-lg font-semibold rounded-t-xl transition-all duration-300 ${
                  isTrialAccessRoute
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                    : activeTab === 'sponsor'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                title={isTrialAccessRoute ? t('request.tabs.sponsorSupport.title') : t('request.tabs.sponsorSupport.title')}
              >
                {t('request.tabs.sponsorSupport.label')}
                {isTrialAccessRoute && <span className="ml-2 text-xs">{t('request.tabs.sponsorSupport.unavailable')}</span>}
              </button>
            </div>

            {/* Tab Content Description */}
            <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50/50 to-blue-50/50 border-2 border-emerald-100 rounded-2xl">
              {activeTab === 'trial' ? (
                <p className="text-lg text-gray-700">
                  {t('request.tabs.trialAccess.description')}
                </p>
              ) : (
                <p className="text-lg text-gray-700">
                  {t('request.tabs.sponsorSupport.description')}
                </p>
              )}
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <p className="text-red-700 font-medium">{submitError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information Section */}
              <div className="bg-gradient-to-r from-emerald-50/50 to-blue-50/50 border-2 border-emerald-100 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <User size={28} className="text-emerald-600" />
                  {t('request.form.sections.personalInfo.title')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('request.form.sections.personalInfo.fields.firstName.label')} <span className="text-red-500">{t('request.form.sections.personalInfo.fields.firstName.required')}</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder={t('request.form.sections.personalInfo.fields.firstName.placeholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('request.form.sections.personalInfo.fields.lastName.label')} <span className="text-red-500">{t('request.form.sections.personalInfo.fields.lastName.required')}</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder={t('request.form.sections.personalInfo.fields.lastName.placeholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('request.form.sections.personalInfo.fields.email.label')} <span className="text-red-500">{t('request.form.sections.personalInfo.fields.email.required')}</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder={t('request.form.sections.personalInfo.fields.email.placeholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('request.form.sections.personalInfo.fields.phone.label')} <span className="text-red-500">{t('request.form.sections.personalInfo.fields.phone.required')}</span>
                    </label>
                    <CountryCodeSelector
                      value={phoneCountryCode}
                      onChange={setPhoneCountryCode}
                      phoneValue={phoneNumber}
                      onPhoneChange={setPhoneNumber}
                      placeholder={t('request.form.sections.personalInfo.fields.phone.placeholder')}
                      required
                      className="w-full"
                    />
                    {phoneCheckError && (
                      <div className="mt-2">
                        <p className="text-red-600 text-sm">{phoneCheckError}</p>
                        <Link 
                          href="/signin" 
                          className="text-blue-600 hover:underline text-sm mt-1 inline-block"
                        >
                          {t('request.errors.userExists.signInLink')}
                        </Link>
                      </div>
                    )}
                    {emailCheckError && (
                      <div className="mt-2">
                        <p className="text-red-600 text-sm">{emailCheckError}</p>
                        <Link 
                          href="/signin" 
                          className="text-blue-600 hover:underline text-sm mt-1 inline-block"
                        >
                          {t('request.errors.userExists.signInLink')}
                        </Link>
                      </div>
                    )}
                    {/* Hidden container for Firebase Recaptcha */}
                    <div id="recaptcha-container"></div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('request.form.sections.personalInfo.fields.country.label')} <span className="text-red-500">{t('request.form.sections.personalInfo.fields.country.required')}</span>
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    >
                      <option value="">{t('request.form.sections.personalInfo.fields.country.placeholder')}</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('request.form.sections.personalInfo.fields.location.label')} <span className="text-red-500">{t('request.form.sections.personalInfo.fields.location.required')}</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder={t('request.form.sections.personalInfo.fields.location.placeholder')}
                    />
                  </div>
                </div>
              </div>


              {/* Comments Section */}
              <div className="bg-gradient-to-r from-yellow-50/50 to-orange-50/50 border-2 border-yellow-100 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <MessageSquare size={28} className="text-amber-600" />
                  {t('request.form.sections.comments.title')} <span className="text-red-500">{t('request.form.sections.comments.required')}</span>
                </h3>
                <textarea
                  name="comments"
                  value={formData.comments}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                  placeholder={t('request.form.sections.comments.placeholder')}
                />
              </div>

              {/* Phone Verification Section - Informational Only */}
              {!phoneVerified && (
                <div data-phone-verification className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 border-2 border-blue-100 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Smartphone size={28} className="text-blue-600" />
                    {t('request.form.sections.phoneVerification.title')} <span className="text-red-500">{t('request.form.sections.phoneVerification.required')}</span>
                  </h3>
                  
                  <div>
                    <p className="text-lg text-gray-700 mb-4">
                      {t('request.form.sections.phoneVerification.description')}
                    </p>
                    <p className="text-sm text-gray-600 mb-6">
                      {t('request.form.sections.phoneVerification.info')}
                    </p>
                    <button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={!phoneNumber.trim() || !formData.email.trim() || !formData.firstName.trim() || !formData.lastName.trim()}
                      className={`w-full px-6 py-4 rounded-xl font-semibold transition-all ${
                        !phoneNumber.trim() || !formData.email.trim() || !formData.firstName.trim() || !formData.lastName.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : activeTab === 'trial'
                          ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                      }`}
                    >
                      {t('request.form.sections.phoneVerification.button')}
                    </button>
                  </div>
                </div>
              )}

            </form>
            
            {/* Submit Button - Only show if phone is verified */}
            {phoneVerified && (
              <div className="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-8 py-4 border-2 border-gray-300 bg-white text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all shadow-lg"
                >
                  {t('request.form.buttons.cancel')}
                </button>
                <button
                  type="button"
                  onClick={submitRequest}
                  disabled={isSubmitting}
                  className={`px-8 py-4 rounded-2xl font-bold text-white transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : activeTab === 'trial'
                        ? 'bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="inline-block animate-spin mr-2" size={20} />
                      {t('request.form.buttons.submitting')}
                    </>
                  ) : (
                    <>
                      {activeTab === 'trial' ? t('request.form.buttons.submitTrial') : t('request.form.buttons.submitSponsor')}
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
}

