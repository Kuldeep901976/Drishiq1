'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/drishiq-i18n';

export default function LoadProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage(['chat', 'common']);
  const mode = searchParams.get('mode'); // 'other' or null (for myself)
  
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [showAstroPrompt, setShowAstroPrompt] = useState(false);
  const [formStep, setFormStep] = useState(1); // For 'other' mode: 1=form, 2=astro question, 3=astro details
  const [formData, setFormData] = useState({
    firstName: '',
    relationship: '',
    dob: '',
    gender: '',
    tob: '',
    pob: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // FOR MYSELF PATH - Fetch from profiles table
        if (mode !== 'other') {
          // Clear any caregiver-related data to ensure we use registered user details
          sessionStorage.removeItem('recipientName');
          sessionStorage.removeItem('recipientProfile');
          sessionStorage.removeItem('currentThreadId');
          sessionStorage.removeItem('initialGreeting');
          
          // Always fetch fresh profile from database for registered user
          const response = await fetch('/api/profile/get-for-chat');
          const data = await response.json();

          if (data.success && data.profile) {
            setUserData(data.profile);
            sessionStorage.setItem('userInfo', JSON.stringify(data.profile));
            
            // Send to chat with profile data
            await initiateChatForMyself(data.profile);
          } else {
            setError(t('chat.astro.errors.profileNotFound'));
            setLoading(false);
          }
        } else {
          // FOR OTHERS PATH - Clear any previous caregiver data and reset form
          // This ensures user must submit details every time for "for someone I care"
          sessionStorage.removeItem('recipientName');
          sessionStorage.removeItem('recipientProfile');
          sessionStorage.removeItem('currentThreadId');
          sessionStorage.removeItem('initialGreeting');
          
          // Reset form data to empty
          setFormData({
            firstName: '',
            relationship: '',
            dob: '',
            gender: '',
            tob: '',
            pob: ''
          });
          setFormStep(1);
          setError('');
          
          // Just get user data for reference (logged-in user)
          const response = await fetch('/api/user/profile');
          const data = await response.json();
          if (data.success && data.user) {
            setUserData(data.user);
          }
          setLoading(false);
          console.log('🧹 Cleared previous caregiver data - form reset for new "for someone I care" entry');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError(t('chat.astro.errors.loadFailed'));
        setLoading(false);
      }
    };

    loadProfile();
  }, [mode, router]);

  const initiateChatForMyself = async (profile: any) => {
    try {
      // Check astro_interest field
      const astroInterest = profile.astro_interest === 'interested' || profile.astro_interest === 'yes';
      
      // Prepare profile data to send to chat
      const profileDataToSend: any = {
        first_name: profile.first_name,
        last_name: profile.last_name || '',
        email: profile.email,
        phone: profile.phone,
        dob: profile.dob || profile.date_of_birth,
        gender: profile.gender,
        city: profile.city,
        country: profile.country,
      };

      // Include astro fields only if interested
      if (astroInterest) {
        profileDataToSend.time_of_birth = profile.time_of_birth;
        profileDataToSend.place_of_birth = profile.place_of_birth;
        profileDataToSend.place_of_birth_latitude = profile.place_of_birth_latitude;
        profileDataToSend.place_of_birth_longitude = profile.place_of_birth_longitude;
        profileDataToSend.place_of_birth_timezone = profile.place_of_birth_timezone;
        profileDataToSend.place_of_birth_country = profile.place_of_birth_country;
      }

      // Send to assistant with profile data (with/without astro based on interest)
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'start_conversation',
          mode: 'personal',
          profileData: profileDataToSend
        })
      });

      if (chatResponse.ok) {
        // Deduct 1 credit - get user id from Supabase auth
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await fetch('/api/credit/deduct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id
            })
          }).catch(err => console.error('Credit deduction error:', err));
        }

        // Go to chat
        router.push('/apps/chat');
      } else {
        const errorData = await chatResponse.json();
        setError(errorData.error || t('chat.astro.errors.chatFailed'));
        setLoading(false);
      }
    } catch (error) {
      console.error('Error initiating chat:', error);
      setError(t('chat.astro.errors.chatFailed'));
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.relationship || !formData.dob || !formData.gender) {
      setError(t('chat.astro.form.errors.required'));
      return;
    }

    setError('');
    setFormStep(2); // Go to astro question
  };

  const handleAstroDecision = async (interested: boolean) => {
    if (interested) {
      setFormStep(3); // Go to astro details form
    } else {
      // Submit without astro
      await submitCaregiverProfile(interested);
    }
  };

  const handleAstroDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tob || !formData.pob) {
      setError(t('chat.astro.details.errors.required'));
      return;
    }

    await submitCaregiverProfile(true);
  };

  const submitCaregiverProfile = async (withAstro: boolean) => {
    setSubmitting(true);
    setError('');

    try {
      // Get logged-in user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError(t('chat.astro.errors.loginRequired'));
        setSubmitting(false);
        return;
      }

      // If interested, calculate astro data (lat/long/timezone) using geocode API
      let astroData: any = null;
      if (withAstro && formData.tob && formData.pob) {
        // Use POST endpoint to get final geocoded data with lat/long/timezone
        const geocodeResponse = await fetch('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ place: formData.pob })
        });

        if (!geocodeResponse.ok) {
          setError(t('chat.astro.details.errors.geocodeFailed'));
          setSubmitting(false);
          return;
        }

        const geocodeResult = await geocodeResponse.json();
        
        // POST endpoint returns flat object: { latitude, longitude, timezone, country, formatted }
        if (geocodeResult.latitude && geocodeResult.longitude && geocodeResult.timezone) {
          astroData = {
            latitude: geocodeResult.latitude,
            longitude: geocodeResult.longitude,
            timezone: geocodeResult.timezone,
            country: geocodeResult.country,
            formatted: geocodeResult.formatted,
            place_of_birth_country: geocodeResult.country || '',
            // Note: place_of_birth_state and place_of_birth_city would need additional parsing
            // from the formatted address, but we'll use country for now
            place_of_birth_state: '',
            place_of_birth_city: ''
          };
        } else {
          setError(t('chat.astro.details.errors.geocodeInvalid'));
          setSubmitting(false);
          return;
        }

        // Validate all required astro fields are present
        if (!astroData.latitude || !astroData.longitude || !astroData.timezone) {
          setError(t('chat.astro.details.errors.incomplete'));
          setSubmitting(false);
          return;
        }
      }

      // Create profile for caregiver recipient
      const profilePayload: any = {
        firstName: formData.firstName,
        relationship: formData.relationship,
        dob: formData.dob,
        gender: formData.gender,
        profile_type: 'caregiver_recipient',
        withAstro: withAstro
      };

      // Add astro fields ONLY if interested and data is available
      if (withAstro && astroData && formData.tob && formData.pob) {
        profilePayload.tob = formData.tob;
        profilePayload.pob = formData.pob;
        profilePayload.latitude = astroData.latitude;
        profilePayload.longitude = astroData.longitude;
        profilePayload.timezone = astroData.timezone;
        
        if (astroData.place_of_birth_country) profilePayload.place_of_birth_country = astroData.place_of_birth_country;
        if (astroData.place_of_birth_state) profilePayload.place_of_birth_state = astroData.place_of_birth_state;
        if (astroData.place_of_birth_city) profilePayload.place_of_birth_city = astroData.place_of_birth_city;
      }

      // Create profile entry in profiles table (and update users table) via API
      const createProfileResponse = await fetch('/api/profile/create-caregiver-recipient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload)
      });

      if (!createProfileResponse.ok) {
        const errorData = await createProfileResponse.json().catch(() => ({ error: 'Unknown error' }));
        setError(errorData.error || t('chat.astro.errors.createFailed'));
        setSubmitting(false);
        return;
      }

      const profileResult = await createProfileResponse.json();

      if (!profileResult.success || !profileResult.data) {
        setError(profileResult.error || 'Failed to create profile');
        setSubmitting(false);
        return;
      }

      const recipientProfileId = profileResult.data.id; // Profile ID of the recipient

      // Send to assistant with recipient's profile ID for personalized greeting
      // API route expects text/plain format with headers, not JSON
      // Pass mode='other' and recipient profile ID - chat API will fetch recipient's profile
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'x-user-id': user.id,
          'x-language': 'en',
          'x-mode': 'other', // Indicates this is for someone the user cares about
          'x-recipient-profile-id': recipientProfileId // Profile ID of the person they care about
        },
        body: 'start_conversation'
      });

      if (!chatResponse.ok) {
        const errorData = await chatResponse.json().catch(() => ({ error: 'Unknown error' }));
        setError(errorData.error || t('chat.astro.errors.chatFailed'));
        setSubmitting(false);
        return;
      }

      // Get the response data (contains threadId and AI greeting message)
      const chatData = await chatResponse.json();
      
      if (chatData.success || chatData.message) {
        // Store threadId and initial greeting message for chat page
        if (chatData.threadId) {
          sessionStorage.setItem('currentThreadId', chatData.threadId);
        }
        
        // Store the AI's greeting message so chat page can display it
        if (chatData.message) {
          sessionStorage.setItem('initialGreeting', chatData.message);
        }
        
        console.log('✅ Chat initiated successfully for caregiver:', {
          threadId: chatData.threadId,
          hasGreeting: !!chatData.message
        });
      }

      // Store recipient info in session
      sessionStorage.setItem('recipientName', formData.firstName);
      sessionStorage.setItem('recipientProfile', JSON.stringify(newProfileData));
      
      // Navigate to chat page - it will pick up the threadId and greeting from sessionStorage
      router.push('/apps/chat?mode=caregiver');
    } catch (error) {
      console.error('Error submitting profile:', error);
      setError(t('chat.astro.errors.createFailed'));
      setSubmitting(false);
    }
  };

  // FOR MYSELF - Loading state
  if (mode !== 'other' && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-teal-600 text-white mb-6 shadow-lg">
            <span className="text-4xl">✨</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{t('chat.astro.loading.title')}</h1>
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="text-gray-600 text-lg">{t('chat.astro.loading.message')}</p>
          </div>
        </div>
      </div>
    );
  }

  // FOR OTHERS - STEP 1: Form
  if (mode === 'other' && formStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('chat.astro.form.title')}</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('chat.astro.form.fields.firstName.label')}
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder={t('chat.astro.form.fields.firstName.placeholder')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('chat.astro.form.fields.relationship.label')}
              </label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">{t('chat.astro.form.fields.relationship.placeholder')}</option>
                <option value="spouse">{t('chat.astro.form.fields.relationship.options.spouse')}</option>
                <option value="child">{t('chat.astro.form.fields.relationship.options.child')}</option>
                <option value="parent">{t('chat.astro.form.fields.relationship.options.parent')}</option>
                <option value="sibling">{t('chat.astro.form.fields.relationship.options.sibling')}</option>
                <option value="friend">{t('chat.astro.form.fields.relationship.options.friend')}</option>
                <option value="other">{t('chat.astro.form.fields.relationship.options.other')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('chat.astro.form.fields.dob.label')}
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('chat.astro.form.fields.gender.label')}
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">{t('chat.astro.form.fields.gender.placeholder')}</option>
                <option value="Male">{t('chat.astro.form.fields.gender.options.male')}</option>
                <option value="Female">{t('chat.astro.form.fields.gender.options.female')}</option>
                <option value="Other">{t('chat.astro.form.fields.gender.options.other')}</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 px-6 py-3 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#0B4422' }}
            >
              {t('chat.astro.form.next')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // FOR OTHERS - STEP 2: Astro Question
  if (mode === 'other' && formStep === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">🔮</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('chat.astro.question.title')}</h2>
          <p className="text-gray-600 mb-8">
            {t('chat.astro.question.message').replace('{name}', formData.firstName)}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {t('chat.astro.question.subtitle')}
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => handleAstroDecision(false)}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              {t('chat.astro.question.notInterested')}
            </button>
            <button
              onClick={() => handleAstroDecision(true)}
              disabled={submitting}
              className="flex-1 px-6 py-3 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#0B4422' }}
            >
              {t('chat.astro.question.includeIt')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FOR OTHERS - STEP 3: Astro Details
  if (mode === 'other' && formStep === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('chat.astro.details.title').replace('{name}', formData.firstName)}</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAstroDetailsSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('chat.astro.details.fields.placeOfBirth.label')}
              </label>
              <input
                type="text"
                value={formData.pob}
                onChange={(e) => setFormData({ ...formData, pob: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder={t('chat.astro.details.fields.placeOfBirth.placeholder')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('chat.astro.details.fields.timeOfBirth.label')}
              </label>
              <input
                type="time"
                value={formData.tob}
                onChange={(e) => setFormData({ ...formData, tob: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 px-6 py-3 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#0B4422' }}
            >
              {submitting ? t('chat.astro.details.processing') : t('chat.astro.details.submit')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
}