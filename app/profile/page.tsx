'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AstroBlock from './components/AstroBlock';
import UnlockModal from './components/UnlockModal';
import CustomDatePicker from './components/CustomDatePicker';

const COUNTRIES = [
  { code: 'IN', name: 'India', phoneCode: '+91' },
  { code: 'US', name: 'United States', phoneCode: '+1' },
  { code: 'GB', name: 'United Kingdom', phoneCode: '+44' },
  { code: 'CA', name: 'Canada', phoneCode: '+1' },
  { code: 'AU', name: 'Australia', phoneCode: '+61' },
  { code: 'DE', name: 'Germany', phoneCode: '+49' },
  { code: 'FR', name: 'France', phoneCode: '+33' },
  { code: 'ES', name: 'Spain', phoneCode: '+34' },
  { code: 'JP', name: 'Japan', phoneCode: '+81' },
  { code: 'CN', name: 'China', phoneCode: '+86' },
];

const GENDERS = [
  'Male',
  'Female',
  'Non-binary',
  'Prefer not to say',
];

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get('source');
  
  const [session, setSession] = useState<any>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [validatingPhone, setValidatingPhone] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [hoveredAvatar, setHoveredAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Simple formData state - no API calls
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    phoneCountryCode: '+91',
    city: '',
    country: 'IN',
    gender: '',
    dob: '',
    astroOptIn: false,
    timeOfBirth: '',
    placeOfBirth: '',
    latitude: '',
    longitude: '',
    timezone: '',
    consentProvided: false,
    freezeBirthData: false,
    avatarUrl: '',
  });

  const [errors, setErrors] = useState<any>({});

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.astroOptIn && formData.placeOfBirth?.trim()) {
        geocodePlaceOfBirth(formData.placeOfBirth);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.placeOfBirth, formData.astroOptIn]);

  useEffect(() => {
    const initSession = async () => {
      try {
        setIsSessionLoading(true);
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession?.user) {
          // If coming from signup flow, redirect back to create-password with preserved passwords
          if (source === 'signup') {
            const storedPassword = typeof window !== 'undefined' 
              ? sessionStorage.getItem('pending_password') 
              : null;
            const storedConfirmPassword = typeof window !== 'undefined' 
              ? sessionStorage.getItem('pending_confirm_password') 
              : null;
            
            if (storedPassword && storedConfirmPassword) {
              // Passwords are already stored, just redirect back
              router.push('/create-password');
              setIsSessionLoading(false);
              return;
            }
          }
          router.push('/auth/signin');
          setIsSessionLoading(false);
          return;
        }

        setSession(currentSession);
        
        // Check if user already exists in users table (completed account)
        const { data: existingUser, error: selectError } = await supabase
          .from('users')
          .select('id')
          .eq('email', currentSession.user.email)
          .maybeSingle();

        if (existingUser) {
          console.log('👤 Existing user found - this is a signin, not signup');
          // If coming from signup flow, redirect back to create-password
          if (source === 'signup') {
            const storedPassword = typeof window !== 'undefined' 
              ? sessionStorage.getItem('pending_password') 
              : null;
            const storedConfirmPassword = typeof window !== 'undefined' 
              ? sessionStorage.getItem('pending_confirm_password') 
              : null;
            
            if (storedPassword && storedConfirmPassword) {
              router.push('/create-password');
              setIsSessionLoading(false);
              return;
            }
          }
          setError('This email is already registered. Please sign in instead.');
          setIsSessionLoading(false);
          return;
        }

        // New user - proceed with profile completion
        console.log('📝 New user - profile completion required');
        setIsNewUser(true);
        
        // Extract OAuth metadata from social platform
        const metadata = currentSession.user.user_metadata || {};
        console.log('📱 OAuth Metadata:', metadata);

        // Prefill form with OAuth data - batch all updates
        const updates: any = {
          email: currentSession.user.email,
        };

        if (metadata.full_name) {
          const nameParts = metadata.full_name.split(' ');
          updates.firstName = nameParts[0];
          if (nameParts.length > 1) {
            updates.lastName = nameParts.slice(1).join(' ');
          }
        }

        if (metadata.picture) {
          setAvatarPreview(metadata.picture);
          updates.avatarUrl = metadata.picture;
        } else if (metadata.avatar_url) {
          setAvatarPreview(metadata.avatar_url);
          updates.avatarUrl = metadata.avatar_url;
        }

        // Batch update formData
        setFormData(prev => ({ ...prev, ...updates }));
        
        setIsSessionLoading(false);
      } catch (err) {
        console.error('Error initializing session:', err);
        setIsSessionLoading(false);
        
        // If coming from signup flow, redirect back to create-password with preserved passwords
        if (source === 'signup') {
          const storedPassword = typeof window !== 'undefined' 
            ? sessionStorage.getItem('pending_password') 
            : null;
          const storedConfirmPassword = typeof window !== 'undefined' 
            ? sessionStorage.getItem('pending_confirm_password') 
            : null;
          
          if (storedPassword && storedConfirmPassword) {
            router.push('/create-password');
            return;
          }
        }
        
        router.push('/auth/signin');
      }
    };

    initSession();
  }, [router, source]);

  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const age = calculateAge(formData.dob);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        updateField('avatarUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    updateField('phone', phone);
    
    const timer = setTimeout(() => {
      validatePhoneRealtime(phone);
    }, 500);

    return () => clearTimeout(timer);
  };

  const validateEmailOnBlur = async (email: string) => {
    if (!email) return true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSaveError('Please enter a valid email format');
      return false;
    }

    try {
      // Check if email exists in users table (completed accounts)
      const { data: emailInUsers } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (emailInUsers) {
        setError('This email is already registered. Please sign in instead.');
        return false;
      }

      // Email in temporary_signups is OK - we'll overwrite it
      console.log('✅ Email validated - ready to proceed');
      return true;
    } catch (err) {
      console.error('Email validation error:', err);
      return true;
    }
  };

  const geocodePlaceOfBirth = async (place: string) => {
    if (!place?.trim()) {
      updateField('latitude', '');
      updateField('longitude', '');
      updateField('timezone', '');
      return;
    }

    try {
      console.log('🌍 Geocoding place of birth:', place);
      
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place })
      });
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const result = await response.json();
      
      if (!result.latitude || !result.longitude) {
        console.warn('❌ Geocoding returned no results');
        return;
      }

      console.log('✅ Geocoding result:', result);

      updateField('latitude', typeof result.latitude === 'number' ? result.latitude.toString() : parseFloat(result.latitude)?.toString() || '');
      updateField('longitude', typeof result.longitude === 'number' ? result.longitude.toString() : parseFloat(result.longitude)?.toString() || '');
      updateField('timezone', result.timezone || '');

    } catch (err) {
      console.error('❌ Geocoding error:', err);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    // MANDATORY FIELDS (all required except astro details)
    if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phone?.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.dob?.trim()) newErrors.dob = 'Date of birth is required';
    if (!formData.gender?.trim()) newErrors.gender = 'Gender is required';
    if (!formData.country?.trim()) newErrors.country = 'Country is required';

    // Astro details are OPTIONAL - only validate if user opted in
    // But even if opted in, these are not blocking for phone verification
    if (formData.astroOptIn) {
      if (!formData.timeOfBirth?.trim()) newErrors.timeOfBirth = 'Time of birth is required if you opted for astro services';
      if (!formData.placeOfBirth?.trim()) newErrors.placeOfBirth = 'Place of birth is required if you opted for astro services';
      if (!formData.consentProvided) newErrors.consentProvided = 'You must provide consent for astro data';
    }

    setErrors(newErrors);
    
    // For phone verification, only check mandatory fields (not astro)
    const mandatoryFields = ['firstName', 'lastName', 'phone', 'dob', 'gender', 'country'];
    const mandatoryErrors = Object.keys(newErrors).filter(key => mandatoryFields.includes(key));
    
    // Return false if any mandatory field is missing
    return mandatoryErrors.length === 0;
  };

  const validatePhoneRealtime = async (phone: string) => {
    if (!phone) {
      setPhoneError(null);
      return true;
    }

    const countryCode = formData.phoneCountryCode || '';
    const fullPhone = countryCode + phone;

    const phoneRegex = /^\d{5,}$/;
    if (!phoneRegex.test(fullPhone.replace(/\D/g, ''))) {
      setPhoneError('Please enter a valid phone number (at least 5 digits)');
      return false;
    }

    setValidatingPhone(true);
    try {
      const { data: phoneInUsers } = await supabase
        .from('users')
        .select('id, email, phone')
        .eq('phone', fullPhone)
        .maybeSingle();

      if (phoneInUsers) {
        setPhoneError('This phone number is already registered with a completed account.');
        setValidatingPhone(false);
        return false;
      }

      const { data: phoneInTemp } = await supabase
        .from('temporary_signups')
        .select('id, email, phone')
        .eq('phone', fullPhone)
        .maybeSingle();

      if (phoneInTemp) {
        if (phoneInTemp.email === formData.email) {
          setPhoneError(null);
          setValidatingPhone(false);
          return true;
        } else {
          setPhoneError('This phone number is already in use by another incomplete signup.');
          setValidatingPhone(false);
          return false;
        }
      }

      setPhoneError(null);
      setValidatingPhone(false);
      return true;
    } catch (err) {
      console.error('Phone validation error:', err);
      setValidatingPhone(false);
      return true;
    }
  };

  const handleSave = async () => {
    setSaveError(null);
    setError(null);

    // Validate form first
    if (!validateForm()) {
      setSaveError('Please fill in all required fields');
      setIsSaving(false);
      return;
    }

    if (!termsAccepted) {
      setSaveError('Please accept the Terms and Conditions to continue.');
      setIsSaving(false);
      return;
    }

    setIsSaving(true);

    // Validate email before saving
    const emailValid = await validateEmailOnBlur(formData.email);
    if (!emailValid) {
      setIsSaving(false);
      return;
    }

    if (phoneError) {
      setSaveError('Please fix the phone number error above before saving.');
      setIsSaving(false);
      return;
    }

    try {

      console.log('📝 Saving to temporary_signups via API...');

      const fullPhone = (formData.phoneCountryCode || '') + formData.phone;
      const userCategory = typeof window !== 'undefined' 
        ? sessionStorage.getItem('signup_category') || 'regular'
        : 'regular';
      const userType = typeof window !== 'undefined' 
        ? sessionStorage.getItem('signup_user_type') || 'user'
        : 'user';

      // Use API route to bypass RLS
      const response = await fetch('/api/profile/save-temporary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: fullPhone,
          gender: formData.gender,
          dob: formData.dob,
          country: formData.country,
          city: formData.city,
          timeOfBirth: formData.timeOfBirth,
          placeOfBirth: formData.placeOfBirth,
          latitude: formData.latitude,
          longitude: formData.longitude,
          timezone: formData.timezone,
          astroOptIn: formData.astroOptIn,
          oauthId: session.user.id,
          authProvider: session.user.app_metadata?.provider || 'email',
          emailVerified: session.user.email_confirmed_at ? true : false,
          phoneVerified: false,
          avatarUrl: avatarPreview || null,
          consentProvided: formData.consentProvided,
          freezeBirthData: formData.freezeBirthData,
          userCategory: userCategory,
          userRole: userType
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save profile';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (jsonError) {
          // If response is not JSON, get text
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log(`✅ Profile saved: ${result.action}`);

      // Validate all mandatory fields before allowing phone verification
      // Note: validateForm() already ensures mandatory fields are filled
      const mandatoryFieldsValid = validateForm();
      if (!mandatoryFieldsValid) {
        setSaveError('Please fill in all required fields before continuing to phone verification');
        setIsSaving(false);
        return;
      }

      setSaveSuccess(true);
      
      // Clear stored passwords on successful profile save
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pending_password');
        sessionStorage.removeItem('pending_confirm_password');
      }
      
      // If redirect param (e.g. payment URL from onboarding) — go there after save
      const redirectUrl = typeof window !== 'undefined'
        ? searchParams.get('redirect') || sessionStorage.getItem('post_signup_redirect')
        : null;
      if (redirectUrl) {
        if (typeof window !== 'undefined') sessionStorage.removeItem('post_signup_redirect');
        setTimeout(() => router.push(redirectUrl), 1500);
      } else {
        setTimeout(() => router.push('/apps/phone-verification'), 1500);
      }

    } catch (err: any) {
      console.error('Save error:', err);
      setSaveError(err.message || 'Failed to save profile');
      setIsSaving(false);
      
      // If coming from signup flow and there's an error, redirect back to create-password
      if (source === 'signup') {
        const storedPassword = typeof window !== 'undefined' 
          ? sessionStorage.getItem('pending_password') 
          : null;
        const storedConfirmPassword = typeof window !== 'undefined' 
          ? sessionStorage.getItem('pending_confirm_password') 
          : null;
        
        if (storedPassword && storedConfirmPassword) {
          // Redirect after a short delay to show the error message
          setTimeout(() => {
            router.push('/create-password');
          }, 2000);
          return;
        }
      }
    }
  };

  const handleUnlock = async (confirmation: string) => {
    // Implement unlock logic
    return true;
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-green-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {isNewUser ? 'Complete Your Profile' : 'Your Profile'}
            </h1>
          </div>

          {/* Error Toast - Existing User */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <span className="text-red-600 text-xl">✕</span>
              <span className="text-red-700 font-medium">{error}</span>
              <button
                onClick={() => router.push('/auth/signin')}
                className="ml-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Success Toast */}
          {saveSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 animate-fade-in">
              <span className="text-green-600 text-xl">✓</span>
              <span className="text-green-700 font-medium">Profile saved successfully! Redirecting to phone verification...</span>
            </div>
          )}

          {/* Error Toast */}
          {saveError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <span className="text-red-600 text-xl">✕</span>
              <span className="text-red-700 font-medium">{saveError}</span>
            </div>
          )}

          {/* Avatar Section - Center aligned, reduced 30% */}
          <div className="mb-8 pb-8 border-b border-gray-200 flex flex-col items-center text-center">
            <div 
              className="relative group cursor-pointer mb-4"
              onMouseEnter={() => setHoveredAvatar(true)}
              onMouseLeave={() => setHoveredAvatar(false)}
              onClick={handleAvatarClick}
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center overflow-hidden border-4 border-green-200 flex-shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              
              {hoveredAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full">
                  <div className="text-center text-white text-xs">
                    <p className="font-semibold">JPG, PNG</p>
                    <p>Max 5MB</p>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />

            {formData.firstName && (
              <div className="mt-4">
                <h2 className="text-2xl font-bold text-gray-800">{formData.firstName} {formData.lastName}</h2>
                <div className="flex gap-2 justify-center mt-2 text-sm text-gray-600">
                  {age !== null && <span><strong>{age}</strong> years</span>}
                  {formData.gender && age !== null && <span>|</span>}
                  {formData.gender && <span>{formData.gender}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Main Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            {/* Name Row - First and Last */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </label>
                </div>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                </div>
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </label>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">From OAuth</span>
              </div>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  readOnly
                  onBlur={() => validateEmailOnBlur(formData.email)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed focus:outline-none"
                />
                <svg className="absolute right-3 top-3 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 00-6 0V9h6z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Country & City Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="country">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) => {
                    const selectedCountry = COUNTRIES.find(c => c.code === e.target.value);
                    updateField('country', e.target.value);
                    // Auto-update phone country code
                    if (selectedCountry) {
                      updateField('phoneCountryCode', selectedCountry.phoneCode);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="phone">
                Phone Number
              </label>
              <div className="flex gap-2">
                <div className="w-32">
                  <input
                    type="text"
                    value={formData.phoneCountryCode}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div className="flex-1 relative">
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="1234567890"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      phoneError ? 'border-red-500' : errors.phone ? 'border-red-500' : 'border-gray-300 focus:ring-green-500'
                    }`}
                  />
                  {validatingPhone && (
                    <span className="absolute right-3 top-3 text-blue-500">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </span>
                  )}
                </div>
              </div>
              {phoneError && (
                <p className="text-xs text-red-500 mt-1">✕ {phoneError}</p>
              )}
            </div>

            {/* DOB & Gender Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="dob">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <CustomDatePicker
                  id="dob"
                  value={formData.dob}
                  onChange={(date: string) => updateField('dob', date)}
                  maxDate={new Date().toISOString().split('T')[0]}
                  minDate="1900-01-01"
                  placeholder="Select date of birth"
                  className={`w-full ${errors.dob ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.dob && (
                  <p className="text-xs text-red-500 mt-1">{errors.dob}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="gender">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select...</option>
                  {GENDERS.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
                {errors.gender && (
                  <p className="text-xs text-red-500 mt-1">{errors.gender}</p>
                )}
              </div>
            </div>

            {/* Astrology Block */}
            <AstroBlock
              astroOptIn={formData.astroOptIn}
              timeOfBirth={formData.timeOfBirth}
              placeOfBirth={formData.placeOfBirth}
              consentProvided={formData.consentProvided}
              freezeBirthData={formData.freezeBirthData}
              onToggleAstro={() => updateField('astroOptIn', !formData.astroOptIn)}
              onTimeChange={(value) => updateField('timeOfBirth', value)}
              onPlaceChange={(value) => updateField('placeOfBirth', value)}
              onConsentChange={(checked) => updateField('consentProvided', checked)}
              onFreezeChange={() => setShowUnlockModal(true)}
              errors={errors}
              isGeocoding={false}
              latitude={parseFloat(formData.latitude) || 0}
              longitude={parseFloat(formData.longitude) || 0}
              timezone={formData.timezone}
            />

            {/* Terms and Conditions */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">
                  I accept the <a href="/terms" target="_blank" className="text-green-600 hover:underline font-medium">Terms and Conditions</a> <span className="text-red-500">*</span>
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => window.location.reload()}
                disabled={isSaving}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Reset
              </button>
              
              <button
                type="submit"
                disabled={
                  isSaving || 
                  !termsAccepted ||
                  !formData.firstName?.trim() ||
                  !formData.lastName?.trim() ||
                  !formData.phone?.trim() ||
                  !formData.gender?.trim() ||
                  !formData.dob?.trim() ||
                  !formData.country?.trim() ||
                  (formData.astroOptIn && !formData.timeOfBirth?.trim()) ||
                  (formData.astroOptIn && !formData.placeOfBirth?.trim()) ||
                  (formData.astroOptIn && !formData.consentProvided)
                }
                className="flex-1 px-6 py-3 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: '#0B4422' }}
              >
                {isSaving ? 'Saving...' : 'Personalize Your Experience'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Unlock Modal */}
      <UnlockModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onConfirm={handleUnlock}
      />
    </div>
  );
}