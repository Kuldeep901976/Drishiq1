'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Footer from '../../components/Footer';
import { useAuthState } from '@/components/auth/hooks/useAuthState';
import { supabase } from '@/lib/supabase';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import CountryCodeSelector from '@/components/CountryCodeSelector';

interface ExperienceForm {
  name: string;
  email: string;
  phone: string; // Keep for backward compatibility during transition
  countryCode: string;
  phoneNumber: string;
  profession: string;
  preferredLanguage: string;
  category: string;
  story: string;
  image: File | null;
  rating: number;
  user_role: string;
}

export default function ShareExperiencePage() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuthState();
  const [directAuthCheck, setDirectAuthCheck] = useState<boolean | null>(null);

  // Direct session check as fallback
  useEffect(() => {
    const checkDirectSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setDirectAuthCheck(!!session?.user);
      console.log('Auth State:', { 
        isAuthenticated, 
        authLoading, 
        hasUser: !!user, 
        userId: user?.id,
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        directAuthCheck: !!session?.user
      });
    };
    checkDirectSession();
  }, [isAuthenticated, authLoading, user]);

  // Use direct auth check if available, otherwise fall back to useAuthState
  // Prioritize directAuthCheck once it's been set (not null)
  const effectiveIsAuthenticated = authLoading 
    ? (directAuthCheck !== null ? directAuthCheck : false)
    : (directAuthCheck !== null ? directAuthCheck : isAuthenticated);
  const [formData, setFormData] = useState<ExperienceForm>({
    name: '',
    email: '',
    phone: '', // Keep for backward compatibility
    countryCode: '+1',
    phoneNumber: '',
    profession: '',
    preferredLanguage: '',
    category: '',
    story: '',
    image: null,
    rating: 5,
    user_role: ''
  });
  const [showPhoneValidation, setShowPhoneValidation] = useState(false);
  const [phoneVerificationStep, setPhoneVerificationStep] = useState<'frozen' | 'otp'>('frozen');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [userIdFromUsersTable, setUserIdFromUsersTable] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSentTime, setOtpSentTime] = useState<number | null>(null);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const recaptchaVerifierRef = useRef<any>(null);

  // Fetch user profile data from users table (base table) to get display name and auto-populate form
  // IMPORTANT: users.id is the source of truth - same ID used across all tables
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (effectiveIsAuthenticated && user) {
        try {
          // Get user from users table using auth user email (users table is the base)
          const { data: profile, error } = await supabase
            .from('users')
            .select('id, first_name, last_name, email, phone, preferred_language, occupation, user_role')
            .eq('email', user.email)
            .single();

          if (!error && profile) {
            // Store the users table ID - this is the ID we'll use across all tables
            setUserIdFromUsersTable(profile.id);
            
            // Calculate display name matching header logic
            const displayName = profile.first_name 
              ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
              : profile.email?.split('@')[0] || null;
            setUserDisplayName(displayName);
            
            // Auto-populate form fields from user profile
            setFormData(prev => ({
              ...prev,
              name: displayName || '',
              email: profile.email || '',
              phone: profile.phone || '',
              preferredLanguage: profile.preferred_language || '',
              user_role: profile.user_role || profile.occupation || ''
            }));
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [effectiveIsAuthenticated, user]);

  const languages = [
    'English',
    'Hindi',
    'Arabic',
    'German',
    'Spanish',
    'French',
    'Chinese',
    'Japanese',
    'Russian',
    'Tamil'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB = 5 * 1024 * 1024 bytes)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('Image size must be less than 5MB. Please choose a smaller image.');
        e.target.value = ''; // Reset input
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPG, PNG, or WEBP).');
        e.target.value = ''; // Reset input
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!effectiveIsAuthenticated) {
      setShowPhoneValidation(true);
      return;
    }
    
    await submitExperience();
  };

  // Initialize reCAPTCHA verifier
  useEffect(() => {
    if (showPhoneValidation && !recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          auth,
          'recaptcha-container-guest',
          {
            size: 'invisible',
            callback: () => {
              // Silently handle
            },
            'expired-callback': () => {
              recaptchaVerifierRef.current = null;
            },
          }
        );
      } catch (err: any) {
        console.warn('reCAPTCHA initialization:', err.message);
        if (recaptchaVerifierRef.current?.clear) {
          recaptchaVerifierRef.current.clear();
        }
        recaptchaVerifierRef.current = null;
      }
    }

    return () => {
      if (recaptchaVerifierRef.current?.clear) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [showPhoneValidation]);

  // Timer for resend countdown (matching trial access pattern)
  useEffect(() => {
    if (otpSentTime && phoneVerificationStep === 'otp') {
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
  }, [otpSentTime, phoneVerificationStep]);

  const sendOTP = async () => {
    if (!formData.phoneNumber || !formData.countryCode) {
      setPhoneError('Please enter your phone number and select country code');
      return;
    }

    setPhoneVerifying(true);
    setPhoneError('');
    
    try {
      // Combine country code and phone number
      const fullPhone = `${formData.countryCode}${formData.phoneNumber.replace(/\D/g, '')}`;

      console.log('📱 Sending OTP to:', fullPhone);

      // Initialize reCAPTCHA if not already done
      if (!recaptchaVerifierRef.current) {
        try {
          if (recaptchaVerifierRef.current?.clear) {
            recaptchaVerifierRef.current.clear();
          }
          
          recaptchaVerifierRef.current = new RecaptchaVerifier(
            auth,
            'recaptcha-container-guest',
            {
              size: 'invisible',
              callback: () => {},
              'expired-callback': () => {
                recaptchaVerifierRef.current = null;
              },
            }
          );
        } catch (err: any) {
          console.warn('reCAPTCHA initialization:', err.message);
          if (recaptchaVerifierRef.current?.clear) {
            recaptchaVerifierRef.current.clear();
          }
          recaptchaVerifierRef.current = null;
        }
      }

      if (!recaptchaVerifierRef.current) {
        throw new Error('Verification system not ready. Please refresh and try again.');
      }

      // Send OTP using Firebase
      const confirmation = await signInWithPhoneNumber(
        auth,
        fullPhone,
        recaptchaVerifierRef.current
      );
      
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setOtpSentTime(Date.now());
      setCanResendOtp(false);
      setResendCountdown(20);
      setPhoneVerificationStep('otp');
      setPhoneError('');
      console.log('✅ OTP sent successfully');
    } catch (error: any) {
      console.error('❌ Firebase OTP send error:', error);
      setPhoneError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setPhoneVerifying(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setPhoneError('Please enter a valid 6-digit OTP');
      return;
    }

    if (!confirmationResult) {
      setPhoneError('OTP session expired. Please request a new code.');
      return;
    }

    setPhoneVerifying(true);
    setPhoneError('');

    try {
      // Verify OTP using Firebase
      const result = await confirmationResult.confirm(otp);
      
      console.log('✅ Firebase phone verified:', result);
      
      // Phone is already verified, just mark as verified
      setPhoneVerified(true);
      setShowPhoneValidation(false);
      
      // Submit the experience after verification
      await submitExperience();
    } catch (error: any) {
      console.error('❌ Firebase OTP verification error:', error);
      let errorMessage = 'Invalid OTP code';
      if (error?.code === 'auth/invalid-verification-code' || error?.code === 'invalid-verification-code') {
        errorMessage = 'Invalid OTP code. Please check and try again.';
      } else if (error?.code === 'auth/code-expired' || error?.code === 'code-expired') {
        errorMessage = 'OTP code expired. Please request a new one.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      setPhoneError(errorMessage);
      setOtp('');
    } finally {
      setPhoneVerifying(false);
    }
  };

  const submitExperience = async () => {
    setIsSubmitting(true);
    
    try {
      if (effectiveIsAuthenticated && user && userIdFromUsersTable) {
        // For authenticated users: Save to testimonials table
        // IMPORTANT: Use users.id (from users table) as the base ID for all tables
        // Get user profile info for testimonial from users table
        const { data: userProfile } = await supabase
          .from('users')
          .select('id, first_name, last_name, profile_image, avatar_selection, user_role, occupation')
          .eq('id', userIdFromUsersTable)
          .single();

        if (!userProfile) {
          throw new Error('User not found in users table');
        }

        const submissionData: any = {
          user_id: userIdFromUsersTable, // Use users.id - same ID across all tables (testimonials, transactions, user_credits_balance, etc.)
          content: formData.story,
          status: 'pending',
          is_approved: false,
          is_published: false,
          consent_given: true,
          rating: formData.rating, // Capture rating from form
          // Populate user info from profile (auto-filled from users table)
          user_name: userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : null,
          user_role: formData.user_role || userProfile?.user_role || userProfile?.occupation || null,
          user_image: userProfile?.profile_image || userProfile?.avatar_selection || null,
          selected_avatar: userProfile?.avatar_selection || null,
        };

        const { data, error } = await supabase
          .from('testimonials')
          .insert(submissionData)
          .select()
          .single();

        if (error) throw error;

        alert('Thank you for sharing your testimonial! We will review it and get back to you soon.');
        router.push('/');
      } else {
        // For guest users: Save to testimonials_stories table (not guest_stories)
        let imageUrl = null;
        
        // Upload image if provided
        if (formData.image) {
          const fileExt = formData.image.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `testimonials-stories/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('public')
            .upload(filePath, formData.image);

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('public')
              .getPublicUrl(filePath);
            imageUrl = urlData.publicUrl;
          }
        }

        // Combine country code and phone number for full phone
        const fullPhone = `${formData.countryCode}${formData.phoneNumber.replace(/\D/g, '')}`;

        const submissionData: any = {
          name: formData.name,
          email: formData.email,
          phone: fullPhone,
          country_code: formData.countryCode,
          phone_number: formData.phoneNumber.replace(/\D/g, ''),
          profession: formData.profession || null,
          phone_verified: phoneVerified,
          content: formData.story,
          preferred_language: formData.preferredLanguage || null,
          category: formData.category || null,
          image_url: imageUrl || null,
          status: 'pending',
          is_approved: false,
          is_published: false,
          consent_given: true,
        };

        console.log('📤 Submitting to testimonials_stories via API:', submissionData);

        // Use API route to bypass RLS (uses service role)
        const response = await fetch('/api/testimonials-stories/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData),
        });

        const result = await response.json();

        if (!response.ok || result.error) {
          console.error('❌ API error:', result);
          let errorMessage = 'Failed to submit your story. ';
          if (result.details) {
            errorMessage += result.details;
          } else if (result.error) {
            errorMessage += result.error;
          } else {
            errorMessage += 'Please try again or contact support.';
          }
          alert(errorMessage);
          throw new Error(result.error || 'Failed to submit story');
        }

        const data = result.data;

        // Redirect to thank you page
        router.push('/share-experience/thank-you');
      }
    } catch (error) {
      console.error('Error submitting experience:', error);
      alert('Error submitting your experience. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-grow bg-gradient-to-b from-gray-50 via-white to-gray-50">
        <main className="content-safe-area">
          {/* Hero Section - Modernized */}
          <div className={`relative overflow-hidden ${effectiveIsAuthenticated 
            ? 'bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700' 
            : 'bg-gradient-to-br from-[#0B4422] via-emerald-600 to-teal-700'} text-white`}>
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}></div>
            </div>
            
            {/* Gradient Orbs */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
              <div className="text-center space-y-6">
                <div className={`inline-flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-full px-6 py-3 mb-4 border border-white/30 shadow-lg transition-all hover:bg-white/30`}>
                  <span className="text-2xl animate-bounce">{effectiveIsAuthenticated ? '💬' : '✨'}</span>
                  <span className="text-sm font-semibold tracking-wide">{effectiveIsAuthenticated ? 'Share Your Testimonial' : 'Share Your Unique Challenge'}</span>
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
                  {effectiveIsAuthenticated ? (
                    <>
                      <span className="block bg-gradient-to-r from-purple-100 via-white to-indigo-100 bg-clip-text text-transparent drop-shadow-lg">
                        Your Testimonial Matters.
                      </span>
                      <span className="block text-white mt-2">Help Others Discover DrishiQ.</span>
                    </>
                  ) : (
                    <>
                      <span className="block bg-gradient-to-r from-emerald-100 via-white to-teal-100 bg-clip-text text-transparent drop-shadow-lg">
                        Share Your Unique Challenge.
                      </span>
                      <span className="block text-white mt-2">We'll Offer If It's Really Unique.</span>
                    </>
                  )}
                </h1>
                <p className={`text-lg md:text-xl ${effectiveIsAuthenticated ? 'text-purple-50' : 'text-emerald-50'} max-w-3xl mx-auto leading-relaxed font-light`}>
                  {effectiveIsAuthenticated 
                    ? 'Share your authentic experience with DrishiQ. Your testimonial helps others discover how we can transform their lives.'
                    : 'Tell us about your unique challenge. If it\'s truly unique, we\'ll offer you a personalized solution to help you overcome it.'}
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 -mt-8">
            <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2">
                 <div className={`bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border ${effectiveIsAuthenticated ? 'border-purple-100/50' : 'border-gray-100/50'} p-6 md:p-10 transition-all hover:shadow-3xl`}>
                  <div className="mb-8">
                    <h2 className={`text-2xl font-bold ${effectiveIsAuthenticated ? 'text-purple-700' : 'text-[#0B4422]'} mb-2`}>
                      {effectiveIsAuthenticated ? 'Share Your Testimonial' : 'Share Your Unique Challenge'}
                    </h2>
                    <p className="text-gray-600">
                      {effectiveIsAuthenticated 
                        ? 'Help others discover how DrishiQ can transform their lives by sharing your authentic experience.'
                        : 'Tell us about your unique challenge. If it\'s truly unique, we\'ll offer you a personalized solution.'}
                    </p>
                  </div>

                  {showPhoneValidation ? (
                    <div className="max-w-lg mx-auto">
                      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-emerald-50 border-2 border-blue-200/50 rounded-3xl p-8 md:p-10 mb-6 shadow-xl backdrop-blur-sm">
                        <div className="text-center mb-8">
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <span className="text-3xl">🔐</span>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Phone Verification Required
                          </h3>
                          <p className="text-gray-600 text-base leading-relaxed">
                            {phoneVerificationStep === 'frozen' 
                              ? 'Please confirm your phone number to receive the verification code'
                              : 'Enter the OTP code sent to your phone'}
                          </p>
                        </div>
                        
                        {/* reCAPTCHA container (hidden) */}
                        <div id="recaptcha-container-guest"></div>

                        {/* Error Message */}
                        {phoneError && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{phoneError}</p>
                          </div>
                        )}

                        {/* Step 1: Frozen Phone Display (matching trial access pattern) */}
                        {phoneVerificationStep === 'frozen' && (
                          <div className="space-y-6">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                                <span className="flex items-center gap-2">
                                  <span className="text-lg">📞</span>
                                  Phone Number
                                </span>
                              </label>
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center px-5 py-3.5 border-2 border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed">
                                    <span className="text-gray-700 font-semibold">{formData.countryCode}</span>
                                    <span className="ml-2 text-gray-700">{formData.phoneNumber || 'Enter phone number'}</span>
                                  </div>
                                </div>
                              </div>
                              {!formData.phoneNumber && (
                                <div className="mt-3">
                                  <CountryCodeSelector
                                    value={formData.countryCode}
                                    onChange={(code) => {
                                      setFormData(prev => ({ ...prev, countryCode: code }));
                                      setPhoneError('');
                                    }}
                                    phoneValue={formData.phoneNumber}
                                    onPhoneChange={(phone) => {
                                      setFormData(prev => ({ ...prev, phoneNumber: phone }));
                                      setPhoneError('');
                                    }}
                                    placeholder="Enter phone number"
                                    required={true}
                                    className="w-full"
                                  />
                                </div>
                              )}
                              <p className="text-xs text-gray-500 mt-2.5">
                                ℹ️ Verify this phone number to continue with your story submission.
                              </p>
                            </div>

                            <button
                              onClick={sendOTP}
                              disabled={phoneVerifying || !formData.phoneNumber || !formData.countryCode}
                              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:via-indigo-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              <span className="flex items-center gap-2 justify-center">
                                {phoneVerifying ? (
                                  <span className="animate-spin">⏳</span>
                                ) : (
                                  <span>📱</span>
                                )}
                                {phoneVerifying ? 'Sending OTP...' : 'Send Verification Code'}
                              </span>
                            </button>

                            <button
                              onClick={() => {
                                setShowPhoneValidation(false);
                                setPhoneVerificationStep('frozen');
                                setOtpSent(false);
                                setOtp('');
                                setPhoneError('');
                                setConfirmationResult(null);
                              }}
                              disabled={phoneVerifying}
                              className="w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 disabled:opacity-50"
                            >
                              <span className="flex items-center gap-2 justify-center">
                                <span>←</span>
                                Back to Form
                              </span>
                            </button>
                          </div>
                        )}

                        {/* Step 2: OTP Input (matching trial access pattern) */}
                        {phoneVerificationStep === 'otp' && (
                          <div className="space-y-6">
                            {/* Frozen Phone Display */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                                <span className="flex items-center gap-2">
                                  <span className="text-lg">📞</span>
                                  Phone Number
                                </span>
                              </label>
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center px-5 py-3.5 border-2 border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed">
                                    <span className="text-gray-700 font-semibold">{formData.countryCode}</span>
                                    <span className="ml-2 text-gray-700">{formData.phoneNumber}</span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-2.5">
                                ℹ️ This number is locked for verification. Contact support if you need to change it.
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                                <span className="flex items-center gap-2">
                                  <span className="text-lg">🔢</span>
                                  Enter 6-Digit Code
                                </span>
                              </label>
                              <input
                                type="text"
                                value={otp}
                                onChange={(e) => {
                                  setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
                                  setPhoneError('');
                                }}
                                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-2xl outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-center tracking-[0.5em] font-semibold bg-white shadow-sm"
                                placeholder="000000"
                                maxLength={6}
                                autoFocus
                              />
                              <p className="text-xs text-gray-500 mt-2.5 text-center font-medium">
                                OTP sent to <span className="font-semibold">{formData.countryCode}{formData.phoneNumber}</span>
                              </p>
                            </div>
                              
                            <div className="flex flex-col gap-3">
                              <button
                                onClick={verifyOTP}
                                disabled={phoneVerifying || otp.length !== 6}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                              >
                                <span className="flex items-center gap-2 justify-center">
                                  {phoneVerifying ? (
                                    <span className="animate-spin">⏳</span>
                                  ) : (
                                    <span>✅</span>
                                  )}
                                  {phoneVerifying ? 'Verifying...' : 'Verify & Submit Story'}
                                </span>
                              </button>
                              
                              <button
                                onClick={async () => {
                                  setOtp('');
                                  setPhoneError('');
                                  setCanResendOtp(false);
                                  setResendCountdown(20);
                                  // Resend OTP with same phone number (phone stays frozen)
                                  await sendOTP();
                                }}
                                disabled={phoneVerifying || !canResendOtp}
                                className={`w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 ${
                                  canResendOtp && !phoneVerifying
                                    ? 'hover:bg-gray-50 hover:border-gray-400'
                                    : 'cursor-not-allowed'
                                }`}
                              >
                                <span className="flex items-center gap-1.5 justify-center">
                                  {phoneVerifying ? (
                                    <span className="animate-spin">⏳</span>
                                  ) : (
                                    <span>↩️</span>
                                  )}
                                  {phoneVerifying 
                                    ? 'Sending...' 
                                    : canResendOtp 
                                      ? '🔄 Resend OTP (Click Here)' 
                                      : `Resend OTP (${resendCountdown}s)`}
                                </span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  setShowPhoneValidation(false);
                                  setPhoneVerificationStep('frozen');
                                  setOtpSent(false);
                                  setOtp('');
                                  setPhoneError('');
                                  setConfirmationResult(null);
                                  setCanResendOtp(false);
                                  setResendCountdown(0);
                                }}
                                disabled={phoneVerifying}
                                className="w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 disabled:opacity-50 text-sm"
                              >
                                <span className="flex items-center gap-1.5 justify-center">
                                  <span>←</span>
                                  Back to Form
                                </span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                      {/* Personal Information - Only shown to guests */}
                      {!effectiveIsAuthenticated && (
                        <div className="bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 border-2 border-emerald-200/50 rounded-3xl p-6 md:p-8 shadow-lg backdrop-blur-sm">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-md">
                              <span className="text-white text-xl">👤</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Your Information</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">
                                <span className="flex items-center gap-2">
                                  <span>✨</span>
                                  Full Name *
                                </span>
                              </label>
                              <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl text-base outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-white shadow-sm"
                                placeholder="Enter your full name"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">
                                <span className="flex items-center gap-2">
                                  <span>📧</span>
                                  Email Address *
                                </span>
                              </label>
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl text-base outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-white shadow-sm"
                                placeholder="your.email@example.com"
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <label className="block text-sm font-semibold text-gray-700">
                                <span className="flex items-center gap-2">
                                  <span>📞</span>
                                  Phone Number *
                                </span>
                              </label>
                              <CountryCodeSelector
                                value={formData.countryCode}
                                onChange={(code) => setFormData(prev => ({ ...prev, countryCode: code }))}
                                phoneValue={formData.phoneNumber}
                                onPhoneChange={(phone) => setFormData(prev => ({ ...prev, phoneNumber: phone }))}
                                placeholder="Enter phone number"
                                required={true}
                                className="w-full"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">
                                <span className="flex items-center gap-2">
                                  <span>💼</span>
                                  Profession / Role
                                </span>
                              </label>
                              <input
                                type="text"
                                name="profession"
                                value={formData.profession}
                                onChange={handleInputChange}
                                className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl text-base outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-white shadow-sm"
                                placeholder="e.g., Software Engineer, Student, Entrepreneur"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">
                                <span className="flex items-center gap-2">
                                  <span>🌍</span>
                                  Preferred Language *
                                </span>
                              </label>
                              <div className="relative">
                                <select
                                  name="preferredLanguage"
                                  value={formData.preferredLanguage}
                                  onChange={handleInputChange}
                                  required
                                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl text-base outline-none transition-all bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 appearance-none shadow-sm"
                                >
                                  <option value="">Select your preferred language</option>
                                  {languages.map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                  ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}


                      {/* Story Section */}
                      <div className={`bg-gradient-to-br ${effectiveIsAuthenticated 
                        ? 'from-purple-50 via-indigo-50 to-purple-100 border-2 border-purple-200/50' 
                        : 'from-yellow-50 via-orange-50 to-amber-50 border-2 border-yellow-200/50'} rounded-3xl p-6 md:p-8 shadow-lg backdrop-blur-sm`}>
                        <div className="flex items-center gap-4 mb-6">
                          {/* Photo Section */}
                          <div className="flex-shrink-0">
                            {effectiveIsAuthenticated ? (
                              // Authenticated User: Show initial matching header behavior
                              <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center border-2 border-gray-300 shadow-md">
                                  <span className="text-2xl font-bold text-white">
                                    {userDisplayName 
                                      ? userDisplayName[0].toUpperCase() 
                                      : user?.email?.[0]?.toUpperCase() || 'U'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              // Guest: Show upload option with preview
                              <div className="relative group">
                                <label htmlFor="profile-image-upload" className="cursor-pointer">
                                  <input
                                    type="file"
                                    id="profile-image-upload"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={handleImageChange}
                                    className="hidden"
                                  />
                                  {imagePreview ? (
                                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md relative group">
                                      <img
                                        src={imagePreview}
                                        alt="Profile preview"
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                          Change
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-300 hover:bg-gray-200 hover:border-emerald-400 transition-all">
                                      <span className="text-3xl">👤</span>
                                    </div>
                                  )}
                                </label>
                                {/* Hover Tooltip */}
                                {!imagePreview && (
                                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                                      Click to Upload Photo<br />JPG, PNG up to 5MB
                                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {/* Heading */}
                          <h3 className={`text-xl font-bold ${effectiveIsAuthenticated ? 'text-purple-700' : 'text-[#0B4422]'}`}>
                            {effectiveIsAuthenticated ? 'Your Testimonial' : 'Your Unique Challenge'}
                          </h3>
                        </div>
                        
                        {/* Rating Section - Only for authenticated users */}
                        {effectiveIsAuthenticated && (
                          <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              <span className="flex items-center gap-2">
                                <span className="text-lg">⭐</span>
                                Rating *
                              </span>
                            </label>
                            <div className="flex items-center gap-3">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                                  className={`text-5xl transition-all transform hover:scale-125 active:scale-95 ${
                                    star <= formData.rating 
                                      ? 'text-yellow-400 drop-shadow-lg' 
                                      : 'text-gray-300 hover:text-yellow-200'
                                  }`}
                                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                            <p className="text-sm font-medium text-gray-600 mt-3">
                              {formData.rating === 5 && '⭐ Excellent'}
                              {formData.rating === 4 && '👍 Very Good'}
                              {formData.rating === 3 && '👍 Good'}
                              {formData.rating === 2 && '👌 Fair'}
                              {formData.rating === 1 && '👌 Poor'}
                            </p>
                          </div>
                        )}

                        {/* Role Section - Only for authenticated users */}
                        {effectiveIsAuthenticated && (
                          <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              <span className="flex items-center gap-2">
                                <span className="text-lg">💼</span>
                                Your Role *
                              </span>
                            </label>
                            <input
                              type="text"
                              name="user_role"
                              value={formData.user_role}
                              onChange={handleInputChange}
                              required
                              className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl text-base outline-none transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 bg-white shadow-sm"
                              placeholder="e.g., Software Engineer, Student, Entrepreneur, etc."
                            />
                          </div>
                        )}

                        {/* Textarea Section - Full Width */}
                        <div className="w-full max-w-full space-y-3">
                          <textarea
                            name="story"
                            value={formData.story}
                            onChange={handleInputChange}
                            required
                            rows={8}
                            className={`w-full max-w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-base outline-none transition-all ${effectiveIsAuthenticated 
                              ? 'focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20' 
                              : 'focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20'} resize-none bg-white shadow-sm`}
                            placeholder={effectiveIsAuthenticated 
                              ? "Share your authentic experience with DrishiQ. How has it helped you? What challenges did it help you overcome? What would you tell others about your journey?"
                              : "Describe your unique challenge in detail. What makes it unique? What have you tried so far? What specific help are you looking for?"}
                          />
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500 font-medium">
                              {effectiveIsAuthenticated 
                                ? "Minimum 100 characters. Be as detailed as you'd like to help others."
                                : "Minimum 100 characters. Be specific about what makes your challenge unique."}
                            </p>
                            <span className={`text-sm font-semibold ${formData.story.length >= 100 ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {formData.story.length}/1000
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200/50">
                        <button
                          type="button"
                          onClick={() => router.push('/testimonials')}
                          className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Back to Stories
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none ${
                            isSubmitting 
                              ? 'bg-gray-400 text-white cursor-not-allowed' 
                              : effectiveIsAuthenticated
                                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white hover:from-purple-700 hover:via-indigo-700 hover:to-purple-800'
                                : 'bg-gradient-to-r from-[#0B4422] via-emerald-600 to-teal-600 text-white hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700'
                          }`}
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <span className="text-lg">{effectiveIsAuthenticated ? '💬' : '✨'}</span>
                              {effectiveIsAuthenticated ? 'Submit Testimonial' : 'Share My Challenge'}
                            </>
                          )}
                        </button>
                      </div>

                      {/* Info Note - Only shown to guests (non-authenticated users) */}
                      {!effectiveIsAuthenticated && (
                        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-emerald-50 border-2 border-blue-200/50 rounded-3xl p-6 shadow-lg backdrop-blur-sm">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                              <span className="text-2xl">💡</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 mb-2 text-lg">What happens next?</h4>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                Since you are not logged in, we will verify your phone number to ensure authenticity. After verification, your challenge will be reviewed by our team. If it's truly unique, we'll offer you a personalized solution.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </form>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Guidelines */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-6 md:p-8 transition-all hover:shadow-2xl">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-2xl">📝</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Story Guidelines</h3>
                    <p className="text-gray-600 text-sm">Tips for sharing your experience</p>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { icon: '🎯', text: 'Be specific about the challenge you faced' },
                      { icon: '💡', text: 'Describe how DrishiQ helped you find clarity' },
                      { icon: '✨', text: 'Share the positive changes you experienced' },
                      { icon: '💬', text: 'Use your own words and authentic voice' },
                      { icon: '❤️', text: 'Consider how your story might help others' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all cursor-default group">
                        <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">{item.icon}</span>
                        <span className="text-gray-700 font-medium text-sm leading-relaxed">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impact Stats */}
                <div className="bg-gradient-to-br from-[#0B4422] via-emerald-600 to-teal-700 text-white rounded-3xl p-6 md:p-8 text-center shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <div className="text-5xl mb-4 animate-bounce">🌟</div>
                    <h3 className="text-xl font-bold mb-2">Your Story Matters</h3>
                    <p className="text-emerald-100 mb-6 text-sm leading-relaxed">Stories like yours have helped thousands of people take their first step</p>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="text-3xl font-bold mb-1">50+</div>
                        <div className="text-xs text-emerald-100 font-medium">Stories Shared</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="text-3xl font-bold mb-1">140+</div>
                        <div className="text-xs text-emerald-100 font-medium">People Inspired</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
} 