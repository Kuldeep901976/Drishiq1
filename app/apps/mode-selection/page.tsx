'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/drishiq-i18n';

// Dynamic import for Supabase to avoid SSR issues
let supabase: any = null;
const getSupabase = async () => {
  if (!supabase) {
    const { supabase: supabaseClient } = await import('@/lib/supabase');
    supabase = supabaseClient;
  }
  return supabase;
};

export default function ModeSelectionPage() {
  const router = useRouter();
  const { t } = useLanguage(['payment', 'common', 'chat']);
  const [isLoading, setIsLoading] = useState(false);
  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);
  const [checkingCredits, setCheckingCredits] = useState(true);
  const [creditsError, setCreditsError] = useState<string>('');
  const [pendingSession, setPendingSession] = useState<{ hasPending: boolean; sessionId?: string | null; threadId?: string | null }>({ hasPending: false });
  const [showPendingPopup, setShowPendingPopup] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Clear caregiver-related sessionStorage items when mode-selection page loads
    // This ensures new chats start with registered user details, not "for someone I care" details
    sessionStorage.removeItem('recipientName');
    sessionStorage.removeItem('recipientProfile');
    sessionStorage.removeItem('currentThreadId');
    sessionStorage.removeItem('initialGreeting');
    console.log('🧹 Cleared caregiver-related sessionStorage items on mode-selection page load');
    
    const checkCredits = async () => {
      try {
        // Get Supabase client dynamically
        const supabaseClient = await getSupabase();
        
        // First, try to get user from Supabase auth (logged in user)
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        
        let userId: string | null = null;
        
        if (!authError && user) {
          // User is logged in via Supabase auth
          userId = user.id;
          console.log('🔐 Logged in user found via Supabase auth:', userId);
        } else {
          // Fallback to sessionStorage
          const userInfoData = sessionStorage.getItem('userInfo');
          if (userInfoData) {
            try {
              const userData = JSON.parse(userInfoData);
              userId = userData.id || userData.userId;
              if (userId) {
                console.log('📦 User ID found in sessionStorage:', userId);
              }
            } catch (parseError) {
              console.warn('Failed to parse sessionStorage userInfo:', parseError);
            }
          }
        }
        
        if (!userId) {
          console.warn('⚠️ No user ID found - user not logged in');
          setCreditsBalance(0);
          setCreditsError(t('payment.credits.pleaseLogin'));
          setCheckingCredits(false);
          return;
        }
        
        // Check credits from user_credits_balance table
        const response = await fetch(`/api/chat/check-credits?userId=${userId}`);
        
        const result = await response.json();
        
        if (result.success) {
          setCreditsBalance(result.data.currentBalance);
          setCreditsError('');
          console.log('✅ Credits checked successfully:', result.data.currentBalance);
        } else {
          setCreditsBalance(0);
          setCreditsError(result.error || t('payment.credits.couldNotCheck'));
          console.error('❌ Credit check failed:', result.error);
        }

        // Check if a pending session exists (not expired)
        const pendingRes = await fetch(`/api/chat/pending-session?userId=${userId}`);
        const pendingData = await pendingRes.json();
        const hasPending = !!pendingData?.hasPending;
        setPendingSession({
          hasPending,
          sessionId: pendingData?.sessionId || null,
          threadId: pendingData?.threadId || null
        });

        // Decide whether to show the pending-session popup (respect local suppression)
        const suppressKey = `suppressPendingPopup:${userId}`;
        const suppressed = typeof window !== 'undefined' ? localStorage.getItem(suppressKey) === '1' : false;
        if (hasPending && !suppressed) {
          setShowPendingPopup(true);
        }
      } catch (error) {
        console.error('Error checking credits:', error);
        setCreditsBalance(0);
        setCreditsError(t('payment.credits.unableToCheck'));
      } finally {
        setCheckingCredits(false);
      }
    };
    
    checkCredits();
  }, []);

  const handleModeSelect = async (mode: 'myself' | 'other') => {
    // No need to check credits here - buttons are already disabled if creditsBalance < 1
    setIsLoading(true);
    try {
      sessionStorage.setItem('selectedMode', mode);
      document.cookie = `selectedMode=${mode}; path=/; max-age=86400; SameSite=Lax`;
      
      if (mode === 'myself') {
        // FOR MYSELF: Clear any caregiver-related data to ensure we use registered user details
        sessionStorage.removeItem('recipientName');
        sessionStorage.removeItem('recipientProfile');
        sessionStorage.removeItem('currentThreadId');
        sessionStorage.removeItem('initialGreeting');
        console.log('🧹 Cleared caregiver-related sessionStorage items for "For Myself" mode');
        
        // FOR MYSELF: Fetch profile from profiles table and directly start chat
        await initiateChatForMyself();
      } else {
        // FOR OTHERS: Go to load-profile page to collect their details
        router.push('/apps/load-profile?mode=other');
      }
    } catch (error) {
      console.error('Error in handleModeSelect:', error);
      setIsLoading(false);
    }
  };

  const initiateChatForMyself = async () => {
    try {
      // Get Supabase client dynamically
      const supabaseClient = await getSupabase();
      
      // Get user ID first
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        setError(t('chat.astro.errors.loginRequired'));
        setIsLoading(false);
        return;
      }

      // Fetch profile from profiles table for logged-in user (pass userId as param)
      const profileResponse = await fetch(`/api/profile/get-for-chat?userId=${user.id}`);
      
      // Always read the response body to get error details
      const profileData = await profileResponse.json();

      if (!profileResponse.ok || !profileData.success || !profileData.profile) {
        const errorMessage = profileData.error || 'Failed to fetch profile. Please try again.';
        console.error('Profile API error:', profileResponse.status, profileResponse.statusText, errorMessage);
        
        // If profile not found (404), redirect to profile page
        if (profileResponse.status === 404 || errorMessage.includes('not found')) {
          setError(t('chat.astro.errors.profileNotFound'));
          setIsLoading(false);
          router.push('/profile');
          return;
        }
        
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      const profile = profileData.profile;
      
      // Log profile data for debugging
      console.log('📋 Profile data fetched:', {
        hasFirstName: !!profile.first_name,
        hasLastName: !!profile.last_name,
        hasEmail: !!profile.email,
        hasPhone: !!profile.phone,
        hasDob: !!(profile.dob || profile.date_of_birth),
        hasGender: !!profile.gender,
        hasCity: !!profile.city,
        hasCountry: !!profile.country,
        astroInterest: profile.astro_interest,
        hasAstroFields: {
          time_of_birth: !!profile.time_of_birth,
          place_of_birth: !!profile.place_of_birth,
          place_of_birth_latitude: !!profile.place_of_birth_latitude,
          place_of_birth_longitude: !!profile.place_of_birth_longitude,
          place_of_birth_timezone: !!profile.place_of_birth_timezone,
          place_of_birth_country: !!profile.place_of_birth_country,
          place_of_birth_city: !!profile.place_of_birth_city,
          place_of_birth_state: !!profile.place_of_birth_state,
        }
      });
      
      // Store profile in sessionStorage for chat
      sessionStorage.setItem('userInfo', JSON.stringify(profile));

      // Prepare profile data with DDSA stage information for AI greeting
      // Calculate age if DOB is available
      let age: string | undefined;
      if (profile.dob || profile.date_of_birth) {
        const dob = new Date(profile.dob || profile.date_of_birth);
        const today = new Date();
        let calculatedAge = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          calculatedAge--;
        }
        age = calculatedAge.toString();
      }

      // Build CHIE header with profile data following the expected format:
      // Format: <language>|<age>|<gender>|<city>|<country>|<DOB>|<TimeOfBirth>|<PlaceOfBirth>, <FirstName> <IssueSummary>
      const metadataParts: string[] = [];
      metadataParts.push(profile.language || 'en'); // language (position 0)
      metadataParts.push(age || ''); // age (position 1)
      metadataParts.push(profile.gender || ''); // gender (position 2)
      metadataParts.push(profile.city || ''); // city (position 3)
      metadataParts.push(profile.country || ''); // country (position 4)
      
      // DOB (position 5)
      if (profile.dob || profile.date_of_birth) {
        const dobStr = profile.dob || profile.date_of_birth;
        metadataParts.push(dobStr);
      } else {
        metadataParts.push('');
      }
      
      // TimeOfBirth (position 6) - only if astro interest
      if (profile.astro_interest === 'interested' || profile.astro_interest === 'yes') {
        metadataParts.push(profile.time_of_birth || '');
      } else {
        metadataParts.push('');
      }
      
      // PlaceOfBirth (position 7) - build from available fields
      let placeOfBirth = '';
      if (profile.astro_interest === 'interested' || profile.astro_interest === 'yes') {
        const placeParts: string[] = [];
        if (profile.place_of_birth_city) placeParts.push(profile.place_of_birth_city);
        if (profile.place_of_birth_state) placeParts.push(profile.place_of_birth_state);
        if (profile.place_of_birth_country) placeParts.push(profile.place_of_birth_country);
        if (placeParts.length === 0 && profile.place_of_birth) {
          placeParts.push(profile.place_of_birth);
        }
        placeOfBirth = placeParts.join(', ');
      }
      metadataParts.push(placeOfBirth);

      // Build the full header: metadata, <FirstName>
      const metadataStr = metadataParts.join('|');
      const firstName = profile.first_name || '';
      const chieHeader = `${metadataStr}, ${firstName}`;
      const requestBody = `${chieHeader}::start_conversation`;

      // Initiate chat with profile data and DDSA stage info
      // API route expects text/plain format with CHIE header
      // Pass mode='myself' to indicate this is for the user themselves
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'x-user-id': user.id,
          'x-language': 'en',
          'x-mode': 'myself' // Indicates this is for the user themselves
        },
        body: requestBody
      });

      // Read response body once (can only be read once)
      const responseText = await chatResponse.text();
      
      // Robust error handling - always try to parse JSON
      let responseData: any = null;
      try {
        if (!responseText || responseText.trim() === '') {
          throw new Error('Empty response body');
        }
        responseData = JSON.parse(responseText);
      } catch (jsonError: any) {
        // Response is not JSON or is empty - log raw response
        console.error('❌ Chat API returned non-JSON or empty response:', {
          status: chatResponse.status,
          statusText: chatResponse.statusText,
          response: responseText?.substring(0, 500) || 'Empty response',
          parseError: jsonError?.message
        });
        responseData = {
          status: 'error',
          code: 'INVALID_RESPONSE',
          message: 'Server returned invalid or empty response format',
          requestId: null,
          details: {
            status: chatResponse.status,
            statusText: chatResponse.statusText,
            responsePreview: responseText?.substring(0, 100)
          }
        };
      }

      if (!chatResponse.ok) {
        // Extract error information from structured response
        const errorMessage = responseData?.message || responseData?.error || 'Failed to initiate chat';
        const errorCode = responseData?.code || 'UNKNOWN_ERROR';
        const requestId = responseData?.requestId || null;
        const errorDetails = responseData?.details || '';
        
        console.error('❌ Chat API error:', {
          status: chatResponse.status,
          statusText: chatResponse.statusText,
          code: errorCode,
          message: errorMessage,
          requestId: requestId,
          details: errorDetails,
          fullError: responseData,
          profileData: {
            firstName: profile.first_name,
            lastName: profile.last_name,
            email: profile.email,
            phone: profile.phone,
            city: profile.city,
            country: profile.country,
            astroInterest: profile.astro_interest,
            hasAstroFields: {
                time_of_birth: !!profile.time_of_birth,
                place_of_birth: !!profile.place_of_birth,
                place_of_birth_city: !!profile.place_of_birth_city,
                place_of_birth_state: !!profile.place_of_birth_state,
              }
            }
          });

        // Build user-friendly error message with support reference
        let userMessage = errorMessage;
        if (requestId) {
          userMessage += ` (Reference: ${requestId.substring(0, 8)}...)`;
        }
        
        // Add specific guidance based on error code
        if (errorCode === 'THREAD_NOT_FOUND') {
          userMessage = 'Session not found. Please try starting a new conversation.';
        } else if (errorCode === 'THREAD_FORBIDDEN') {
          userMessage = 'Access denied. Please log in again.';
        } else if (errorCode === 'UNAUTHORIZED') {
          userMessage = 'Please log in to continue.';
        } else if (errorCode === 'INVALID_CONTENT_TYPE' || errorCode === 'INVALID_REQUEST_BODY') {
          userMessage = 'Invalid request. Please refresh and try again.';
        }
        
        setError(userMessage);
        setIsLoading(false);
        return;
      }

      // Use the already parsed response data (contains threadId and AI greeting message)
      const chatData = responseData;
      
      // Debug: Log the full response to understand structure
      console.log('📦 [CHAT DEBUG] Full API response:', {
        success: chatData.success,
        hasMessage: !!chatData.message,
        hasResponse: !!chatData.response,
        hasGreeting: !!chatData.greeting,
        threadId: chatData.threadId,
        keys: Object.keys(chatData),
        messagePreview: chatData.message ? chatData.message.substring(0, 200) : null,
        responsePreview: chatData.response ? chatData.response.substring(0, 200) : null
      });
      
      // Check for message in multiple possible fields (message, response, or greeting)
      const greetingMessage = chatData.message || chatData.response || (chatData.greeting ? chatData.greeting.message : null);
      
      if (chatData.success || greetingMessage || chatData.greeting) {
        // Store threadId and initial greeting message for chat page
        if (chatData.threadId) {
          sessionStorage.setItem('currentThreadId', chatData.threadId);
          console.log('✅ Stored threadId:', chatData.threadId);
        }
        
        // Store the AI's greeting message so chat page can display it
        // Note: Greeting stage generates natural greeting (no CFQ blocks)
        // CFQ blocks are added later in the CFQ stage
        if (greetingMessage) {
          sessionStorage.setItem('initialGreeting', greetingMessage);
          console.log('✅ Stored initial greeting from DDSA:', {
            length: greetingMessage.length,
            hasCFQBlock: greetingMessage.includes('<BLOCK'),
            preview: greetingMessage.substring(0, 150),
            isPersonalized: !greetingMessage.includes('Hello there!') && !greetingMessage.includes('Hello!')
          });
        } else {
          console.warn('⚠️ No greeting message found in response:', {
            hasMessage: !!chatData.message,
            hasResponse: !!chatData.response,
            hasGreeting: !!chatData.greeting
          });
        }
        
        console.log('✅ DDSA chat initiated successfully:', {
          threadId: chatData.threadId,
          hasGreeting: !!greetingMessage,
          greetingType: chatData.greeting ? 'DDSA CFQ' : 'none',
          messageLength: greetingMessage?.length || 0,
          hasCFQBlock: greetingMessage?.includes('<BLOCK') || false
        });
      } else {
        console.warn('⚠️ Chat response missing expected data:', {
          chatData,
          responseKeys: Object.keys(chatData),
          responseStatus: chatResponse.status,
          responseStatusText: chatResponse.statusText
        });
      }

      // Navigate to chat page - it will pick up the threadId and greeting from sessionStorage
      // Even if greeting wasn't found, proceed to chat page - it will handle the greeting generation
      setIsLoading(false); // Reset loading before navigation
      
      // If no greeting was stored, log a warning but still proceed
      if (!sessionStorage.getItem('initialGreeting') && !sessionStorage.getItem('currentThreadId')) {
        console.warn('⚠️ [CHAT DEBUG] No greeting or threadId stored - chat page will need to generate greeting');
      }
      
      router.push('/apps/chat');
    } catch (error) {
      console.error('Error initiating chat for myself:', error);
      setError(t('chat.astro.errors.chatFailed'));
      setIsLoading(false);
    }
  };

  // Show error message if any
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('chat.modeSelection.errors.title')}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setError('');
              // If credits >= 1, go to mode-selection, otherwise go back
              if (creditsBalance !== null && creditsBalance >= 1) {
                // Stay on mode-selection page (refresh to clear error)
                window.location.href = '/apps/mode-selection';
              } else {
                router.back();
              }
            }}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            {t('chat.modeSelection.errors.goBack')}
          </button>
        </div>
      </div>
    );
  }

  // Show loading while checking credits
  if (checkingCredits) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-teal-600 text-white mb-6 shadow-lg">
            <span className="text-4xl">✨</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{t('chat.modeSelection.title')}</h1>
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="text-gray-600 text-lg">{t('chat.modeSelection.loading.checkingCredits')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Safeguard: if no credits info or error, show no credits popup
  if (creditsBalance === null || creditsBalance < 1 || creditsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">💳</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('chat.modeSelection.errors.noCredits.title')}</h2>
          <p className="text-gray-600 mb-6">
            {creditsError || t('chat.modeSelection.errors.noCredits.message')}
          </p>
          <button
            onClick={() => router.push('/priceplan#main-plans')}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors mb-3"
          >
            {t('chat.modeSelection.errors.noCredits.buyCredits')}
          </button>
          <button
            onClick={() => router.back()}
            className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
          >
            {t('chat.modeSelection.errors.noCredits.goBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-teal-600 text-white mb-6 shadow-lg">
            <span className="text-4xl">✨</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{t('chat.modeSelection.title')}</h1>
          <p className="text-gray-600 text-lg">{t('chat.modeSelection.subtitle')}</p>
          <p className="text-gray-500 text-sm mt-2">{t('chat.modeSelection.description')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl bg-opacity-95">
          <div className="bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 px-8 py-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">{t('chat.modeSelection.header.title')}</h2>
            <p className="text-green-100 text-sm">{t('chat.modeSelection.header.subtitle')}</p>
            {creditsBalance !== null && (
              <div className="mt-3 flex items-center gap-2 justify-center flex-wrap">
                <p className="text-green-100 text-xs bg-white bg-opacity-20 inline-block px-4 py-2 rounded-full">
                  💳 {t('chat.modeSelection.header.credits')}: {creditsBalance}
                </p>
                {creditsBalance < 2 && (
                  <button
                    onClick={() => router.push('/priceplan#main-plans')}
                    className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-full font-semibold transition-colors"
                  >
                    {t('chat.modeSelection.header.buyMore')}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="p-8 space-y-4">
            <button
              onClick={() => handleModeSelect('myself')}
              disabled={
                isLoading || checkingCredits ||
                (creditsBalance !== null && creditsBalance < 1) ||
                // Freeze both buttons if no balance and a pending session exists
                (creditsBalance === 0 && pendingSession.hasPending)
              }
              className="w-full group p-6 rounded-xl border-2 border-gray-200 hover:border-green-500 transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-left relative overflow-hidden"
              type="button"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-start gap-4">
                <div className="text-4xl group-hover:scale-110 transition-transform duration-300">📖</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-700 transition-colors">
                    {t('chat.modeSelection.options.myself.title')}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('chat.modeSelection.options.myself.description')}
                  </p>
                  <p className="text-xs text-green-600 mt-2 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    {t('chat.modeSelection.options.myself.feature')}
                  </p>
                </div>
                <div className="text-xl group-hover:translate-x-1 transition-transform">→</div>
              </div>
            </button>

            <button
              onClick={() => handleModeSelect('other')}
              disabled={
                isLoading || checkingCredits ||
                (creditsBalance !== null && creditsBalance < 1) ||
                (creditsBalance === 0 && pendingSession.hasPending)
              }
              className="w-full group p-6 rounded-xl border-2 border-gray-200 hover:border-pink-500 transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-left relative overflow-hidden"
              type="button"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-50 to-red-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-start gap-4">
                <div className="text-4xl group-hover:scale-110 transition-transform duration-300">❤️</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-pink-700 transition-colors">
                    {t('chat.modeSelection.options.other.title')}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('chat.modeSelection.options.other.description')}
                  </p>
                  <p className="text-xs text-pink-600 mt-2 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    {t('chat.modeSelection.options.other.feature')}
                  </p>
                </div>
                <div className="text-xl group-hover:translate-x-1 transition-transform">→</div>
              </div>
            </button>
          </div>

          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-600">
              {t('chat.modeSelection.footer.security')}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {t('chat.modeSelection.footer.copyright')}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white bg-opacity-70 rounded-lg p-4 backdrop-blur">
            <p className="text-2xl mb-2">🌟</p>
            <p className="text-xs font-semibold text-gray-700">{t('chat.modeSelection.features.personalized')}</p>
          </div>
          <div className="bg-white bg-opacity-70 rounded-lg p-4 backdrop-blur">
            <p className="text-2xl mb-2">🔮</p>
            <p className="text-xs font-semibold text-gray-700">{t('chat.modeSelection.features.accurate')}</p>
          </div>
          <div className="bg-white bg-opacity-70 rounded-lg p-4 backdrop-blur">
            <p className="text-2xl mb-2">💡</p>
            <p className="text-xs font-semibold text-gray-700">{t('chat.modeSelection.features.insightful')}</p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3 shadow-lg">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
            <span className="text-gray-700 font-semibold">{t('chat.modeSelection.loading.loading')}</span>
          </div>
        </div>
      )}

      {showPendingPopup && pendingSession.hasPending && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-5xl mb-3">⏳</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t('chat.modeSelection.pendingSession.title')}</h3>
            <p className="text-gray-600 mb-4">
              {t('chat.modeSelection.pendingSession.message')}
            </p>
            <div className="flex flex-col gap-3">
              {pendingSession.sessionId && (
                <button
                  onClick={() => {
                    setShowPendingPopup(false);
                    // Deep-link to the same session
                    const threadParam = pendingSession.threadId ? `&threadId=${encodeURIComponent(pendingSession.threadId)}` : '';
                    window.location.href = `/apps/chat?sessionId=${pendingSession.sessionId}${threadParam}`;
                  }}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                >
                  {t('chat.modeSelection.pendingSession.resume')}
                </button>
              )}
              <button
                onClick={() => setShowPendingPopup(false)}
                className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold transition-colors"
              >
                {t('chat.modeSelection.pendingSession.close')}
              </button>
              <button
                onClick={async () => {
                  try {
                    const supabaseClient = await getSupabase();
                    const { data: { user } } = await supabaseClient.auth.getUser();
                    if (user) {
                      const suppressKey = `suppressPendingPopup:${user.id}`;
                      localStorage.setItem(suppressKey, '1');
                    }
                  } catch {}
                  setShowPendingPopup(false);
                }}
                className="w-full px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-sm"
              >
                {t('chat.modeSelection.pendingSession.dontShowAgain')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}