'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/drishiq-i18n';
import { User, Sprout, Building2 } from 'lucide-react';

// User types configuration
const ROLE_OPTIONS = [
  { value: 'user', label: 'Regular User', category: 'regular', tagline: 'Personal dashboard access' },
  { value: 'client_admin', label: 'Company Admin', category: 'grow', tagline: 'Manage company accounts' },
  { value: 'mentor', label: 'Mentor', category: 'grow', tagline: 'Guide and support others' },
  { value: 'coach', label: 'Coach', category: 'grow', tagline: 'Professional coaching services' },
  { value: 'therapist', label: 'Therapist', category: 'grow', tagline: 'Mental health support' },
  { value: 'consultant', label: 'Consultant', category: 'grow', tagline: 'Business consulting' },
  { value: 'investor', label: 'Investor', category: 'grow', tagline: 'Investment opportunities' },
  { value: 'partner', label: 'Partner', category: 'grow', tagline: 'Strategic partnerships' },
  { value: 'sponsor', label: 'Sponsor', category: 'grow', tagline: 'Support causes and initiatives' },
  { value: 'volunteer', label: 'Volunteer', category: 'grow', tagline: 'Community contribution' },
  { value: 'affiliate', label: 'Affiliate', category: 'grow', tagline: 'Referral partnerships' },
  { value: 'enterprise_admin', label: 'Enterprise Admin', category: 'enterprise', tagline: 'Manage company employees' }
];

type AuthTab = 'social' | 'email' | 'magic';

interface CreditCheckResult {
  exists: boolean;
  credits_available: number;
  total_credits: number;
  credits_used: number;
  message?: string;
}

export default function UnifiedLoginPage() {
  const router = useRouter();
  const { t } = useLanguage(['payment', 'common', 'chat', 'signup_signin']);
  const [category, setCategory] = useState<'regular' | 'grow' | 'enterprise'>('regular');
  const [selectedUserType, setSelectedUserType] = useState('user');
  const [growRole, setGrowRole] = useState('client_admin');
  const [enterpriseRole, setEnterpriseRole] = useState('enterprise_admin');
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<AuthTab>('social');
  const [showDropdown, setShowDropdown] = useState<'grow' | 'enterprise' | null>(null);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Credit check states
  const [showCreditsUI, setShowCreditsUI] = useState(false);
  const [creditsData, setCreditsData] = useState<CreditCheckResult | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [userNotFoundError, setUserNotFoundError] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);

  // Update selectedUserType when category changes
  useEffect(() => {
    if (category === 'regular') setSelectedUserType('user');
    if (category === 'grow') setSelectedUserType(growRole);
    if (category === 'enterprise') setSelectedUserType(enterpriseRole);
  }, [category, growRole, enterpriseRole]);

  // Clear any sign-up related sessionStorage to ensure clean sign-in flow
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Remove any sign-up related items
      sessionStorage.removeItem('signup_user_type');
      sessionStorage.removeItem('signup_category');
      sessionStorage.removeItem('signup_flow');
      sessionStorage.removeItem('signup_completed');
    }
  }, []);

  // Update database when role changes (for authenticated users)
  const updateUserRole = async (newRole: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            user_type: newRole,
            role: newRole,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating user role:', updateError);
        } else {
          console.log('✅ User role updated in database:', newRole);
        }
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  // Handle role category change
  const handleCategoryChange = (newCategory: 'regular' | 'grow' | 'enterprise') => {
    if (newCategory === 'regular') {
      setCategory(newCategory);
      setShowDropdown(null);
      updateUserRole('user');
    } else {
      if (category === newCategory && showDropdown === newCategory) {
        setShowDropdown(null);
      } else {
        setCategory(newCategory);
        setShowDropdown(newCategory);
      }
    }
  };

  // Handle specific role change from dropdown
  const handleRoleChange = (newRole: string) => {
    if (category === 'grow') {
      setGrowRole(newRole);
    } else if (category === 'enterprise') {
      setEnterpriseRole(newRole);
    }
    updateUserRole(newRole);
    setShowDropdown(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.role-dropdown-container')) {
        setShowDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ==========================================
  // NEW: Check user existence in users table AND fetch credits
  // ==========================================
  const checkUserAndCredits = async (userId: string, userEmail: string): Promise<CreditCheckResult> => {
    try {
      setCreditsLoading(true);
      
      // FIRST: Check if user exists in YOUR users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      // If user NOT found in users table
      if (!userData) {
        // SECOND: Check if they're in temporary_signup
        const { data: tempSignupData, error: tempError } = await supabase
          .from('temporary_signup')
          .select('*')
          .eq('email', userEmail)
          .single();

        if (tempError && tempError.code !== 'PGRST116') {
          throw tempError;
        }

        // If found in temporary_signup - ask to complete registration
        if (tempSignupData) {
          return {
            exists: false,
            credits_available: 0,
            total_credits: 0,
            credits_used: 0,
            message: 'Please complete your registration to continue.'
          };
        }

        // Not in users table AND not in temporary_signup - ask to sign up
        return {
          exists: false,
          credits_available: 0,
          total_credits: 0,
          credits_used: 0,
          message: "User doesn't exist, please sign up"
        };
      }

      // User exists in users table, now check credits
      const { data: creditData, error: creditError } = await supabase
        .from('user_credit_balance')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (creditError && creditError.code !== 'PGRST116') {
        throw creditError;
      }

      // If no credit record exists, user has 0 credits
      if (!creditData) {
        return {
          exists: true,
          credits_available: 0,
          total_credits: 0,
          credits_used: 0,
          message: t('payment.credits.noCredits')
        };
      }

      // User exists and has credits
      return {
        exists: true,
        credits_available: creditData.credits_available || 0,
        total_credits: creditData.total_credits || 0,
        credits_used: creditData.credits_used || 0
      };
    } catch (error) {
      console.error('Error checking user and credits:', error);
      return {
        exists: false,
        credits_available: 0,
        total_credits: 0,
        credits_used: 0,
        message: t('payment.credits.errorVerifying')
      };
    } finally {
      setCreditsLoading(false);
    }
  };

  // ==========================================
  // NEW: Handle navigation for For Myself/Others
  // ==========================================
  const handleForMyself = () => {
    router.push('/apps/load-profile');
  };

  const handleForOthers = () => {
    router.push('/apps/load-profile?mode=other');
  };

  const handleBuyCredits = () => {
    router.push('/priceplan#main-plans');
  };

  // ==========================================
  // UPDATED: Auth success handler
  // ==========================================
  const handleAuthSuccess = async (result: any) => {
    console.log('Auth success:', result);
    
    try {
      if (result.user) {
        const userId = result.user.id;
        const userEmail = result.user.email;

        // Store user info
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!profileError && profileData) {
          console.log('✅ Profile loaded:', profileData);
          sessionStorage.setItem('userInfo', JSON.stringify({
            id: userId,
            email: userEmail,
            ...profileData
          }));
        } else {
          console.log('No profile found, storing basic user info');
          sessionStorage.setItem('userInfo', JSON.stringify({
            id: userId,
            email: userEmail
          }));
        }

        // Update user role in database
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            user_type: selectedUserType,
            role: selectedUserType,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating user role:', updateError);
        } else {
          console.log('✅ User role updated successfully:', selectedUserType);
        }

        // ==========================================
        // NEW: Check user existence and credits
        // ==========================================
        setAuthUser(result.user);
        const creditCheck = await checkUserAndCredits(userId, userEmail);

        if (!creditCheck.exists) {
          // User doesn't exist in credit system - could be new user
          // Depending on your business logic, you might want to:
          // 1. Show sign-up message to complete profile
          // 2. Initialize credits for new user
          // 3. Block access until purchase
          
          console.warn('User not found in credit system:', userEmail);
          setUserNotFoundError(true);
          setError({
            code: 'USER_NOT_FOUND',
            message: t('signup_signin.signIn.errors.userNotFound')
          });
          // Optionally redirect to profile setup
          setTimeout(() => router.push('/apps/complete-profile'), 2000);
          return;
        }

        // User exists, check credits and redirect accordingly
        console.log('✅ Credits check complete:', creditCheck);
        
        // Store credits in sessionStorage
        sessionStorage.setItem('userCredits', JSON.stringify({
          credits_available: creditCheck.credits_available,
          total_credits: creditCheck.total_credits,
          credits_used: creditCheck.credits_used
        }));
        
        // Get user details to determine redirect
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, user_role, user_category, user_type, role, company_id')
          .eq('id', userId)
          .maybeSingle();
        
        let redirectPath = '/apps/mode-selection'; // Default for regular users with credits
        
        if (userData && !userError) {
          const userRole = userData.role || userData.user_role || '';
          const userType = userData.user_type || userData.user_category || '';
          // Enterprise admin - redirect to company admin dashboard (will be added later)
          const isEnterpriseAdmin = userType === 'enterprise_admin' || userType === 'enterprise' || (userRole === 'admin' && userData.company_id);
          const isGrow = userType === 'grow' || userData.user_category === 'grow';
          
          if (isEnterpriseAdmin && userData.company_id) {
            // Enterprise admin - redirect to company admin dashboard (future feature)
            redirectPath = `/enterprise/${userData.company_id}/admin/dashboard`;
            console.log('🏢 Enterprise admin detected, redirecting to company dashboard');
          } else if (isGrow) {
            // Grow user - redirect to grow dashboard
            redirectPath = '/apps/grow/dashboard';
            console.log('🌱 Grow user detected, redirecting to grow dashboard');
          } else {
            // Regular user - check credit balance
            // If credits available, go to mode-selection; otherwise check phone verification before going to pricing
            if (creditCheck.credits_available > 0) {
              redirectPath = '/apps/mode-selection';
              console.log('👤 Regular user with credits detected, redirecting to mode-selection');
            } else {
              // Check phone verification before redirecting to priceplan
              const isPhoneVerified = userData?.phone_verified;
              if (isPhoneVerified) {
                redirectPath = '/priceplan#main-plans';
                console.log('👤 Regular user with no credits, phone verified - redirecting to pricing');
              } else {
                redirectPath = '/apps/phone-verification';
                console.log('👤 Regular user with no credits, phone not verified - redirecting to phone verification');
              }
            }
          }
        } else {
          // Fallback: if user data fetch failed but credits are available, go to mode-selection
          if (creditCheck.credits_available > 0) {
            redirectPath = '/apps/mode-selection';
          } else {
            // Check phone verification before redirecting to priceplan
            const { data: fallbackUserData } = await supabase
              .from('users')
              .select('phone_verified')
              .eq('id', userId)
              .maybeSingle();
            const isPhoneVerified = fallbackUserData?.phone_verified;
            if (isPhoneVerified) {
              redirectPath = '/priceplan#main-plans';
            } else {
              redirectPath = '/apps/phone-verification';
            }
          }
        }
        
        // Redirect based on user type and credit balance
        router.push(redirectPath);
      }
    } catch (error) {
      console.error('Error in auth success:', error);
      setError({
        code: 'AUTH_ERROR',
        message: t('signup_signin.signIn.errors.authError')
      });
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  // ==========================================
  // Email/Password authentication
  // ==========================================
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUserNotFoundError(false);

    try {
      // SIGN-IN ONLY: Check if user exists in users table FIRST
      const { data: userCheck, error: userCheckError } = await supabase
        .from('users')
        .select('id, email, is_active')
        .eq('email', email)
        .maybeSingle();

      // If user doesn't exist in users table, show error and suggest sign-up
      if (!userCheck && (!userCheckError || userCheckError.code === 'PGRST116')) {
          setError({
            code: 'USER_NOT_FOUND',
            message: t('signup_signin.signIn.errors.accountNotFound')
          });
        setLoading(false);
        return;
      }

      // User exists - proceed with authentication
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // Handle authentication errors
      if (signInError) {
        // User exists but password is wrong
        if (signInError.message.includes('Invalid login credentials') || 
            signInError.message.includes('Email not confirmed') ||
            signInError.code === 'invalid_credentials') {
          setError({
            code: 'INVALID_CREDENTIALS',
            message: t('signup_signin.signIn.errors.invalidCredentials')
          });
        } else {
          throw signInError;
        }
        setLoading(false);
        return;
      }

      // Authentication successful - redirect to callback-signin for email check
      if (data.user) {
        console.log('✅ Email/password sign-in successful, redirecting to callback-signin');
        // Redirect to callback-signin to check email in users table and forward to mode-selection
        router.push('/auth/callback-signin');
        return;
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      // Set error if not already set by specific handlers above
      setError({
        code: err.code || 'AUTH_ERROR',
        message: err.message || 'Authentication failed'
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Magic Link authentication
  // ==========================================
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUserNotFoundError(false);

    try {
      // SIGN-IN ONLY: Magic link for sign-in (not sign-up)
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback-signin`
        }
      });
      if (magicLinkError) throw magicLinkError;
      alert('Magic link sent! Check your email.');
    } catch (err: any) {
      setError({
        code: err.code || 'MAGIC_LINK_ERROR',
        message: err.message || t('signup_signin.signIn.errors.magicLinkError')
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Social authentication
  // ==========================================
  const handleSocialAuth = async (provider: 'google' | 'linkedin') => {
    setLoading(true);
    setError(null);
    setUserNotFoundError(false);

    try {
      console.log(`🔐 Starting ${provider} OAuth...`);
      const { data, error: socialError } = await supabase.auth.signInWithOAuth({
        provider: provider === 'linkedin' ? 'linkedin_oidc' : provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback-signin`
        }
      });
      
      if (socialError) {
        console.error(`❌ ${provider} OAuth error:`, socialError);
        setLoading(false);
        throw socialError;
      }
      
      console.log(`✅ ${provider} OAuth response:`, data);
      console.log(`📋 Data URL:`, data?.url);
      console.log(`📋 Has URL:`, !!data?.url);
      
      // CRITICAL: Redirect IMMEDIATELY - don't let anything else run
      if (data?.url) {
        console.log(`🚀 IMMEDIATE REDIRECT to:`, data.url);
        console.log(`🔍 Full URL (first 200 chars):`, data.url.substring(0, 200));
        console.log(`🔍 URL contains 'google':`, data.url.toLowerCase().includes('google'));
        console.log(`🔍 URL contains 'accounts.google.com':`, data.url.includes('accounts.google.com'));
        console.log(`🔍 URL type check:`, typeof data.url);
        console.log(`🔍 URL length:`, data.url?.length);
        
        // Verify URL is valid before redirecting
        if (data.url && data.url.startsWith('http')) {
          // Log the URL before redirect to debug
          console.log(`🔍 About to redirect to:`, data.url);
          
          // FORCE redirect - try multiple methods to ensure it works
          // Stop ALL React state updates that could interfere
          setLoading(false); // Clear loading state immediately
          
          // Use both replace and href to ensure redirect happens
          try {
            window.location.replace(data.url);
          } catch (e) {
            console.warn('Replace failed, using href:', e);
            window.location.href = data.url;
          }
          
          // Exit immediately - don't let any other code run
          return;
        } else {
          console.error(`❌ Invalid URL format:`, data.url);
          throw new Error('Invalid OAuth URL received from Supabase');
        }
      }
      
      // Fallback: If no URL but no error, Supabase should handle it
      console.warn(`⚠️ No URL in response for ${provider}:`, data);
      console.log(`⏳ Waiting for Supabase automatic redirect...`);
    } catch (err: any) {
      console.error(`❌ ${provider} auth failed:`, err);
      setError({
        code: err.code || 'SOCIAL_AUTH_ERROR',
        message: err.message || t('signup_signin.signIn.errors.socialAuthError', { provider: provider === 'linkedin' ? 'LinkedIn' : 'Google' })
      });
      setLoading(false);
    }
  };

  const tagline = ROLE_OPTIONS.find(option => option.value === selectedUserType)?.tagline || '';

  // ==========================================
  // RENDER: Credits UI (after auth success)
  // ==========================================
  if (showCreditsUI && creditsData && authUser) {
    const { credits_available } = creditsData;
    const hasEnoughCredits = credits_available >= 1;
    const needsMoreCredits = credits_available >= 1 && credits_available < 2;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
          <div className="w-full max-w-lg">
            {/* Main Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-8 pt-10 pb-6 text-center bg-gradient-to-r from-green-50 to-emerald-50">
                <h1 className="text-3xl font-bold text-[#0B4422] mb-2">
                  {t('signup_signin.signIn.welcome.title', { username: authUser.email?.split('@')[0] || 'User' })}
                </h1>
              </div>

              <div className="px-8 pb-8">
                {/* Credits Display Section */}
                <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">{t('signup_signin.signIn.welcome.credits')}</h2>
                    <span className="text-3xl">💳</span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">{t('signup_signin.signIn.welcome.availableCredits')}</p>
                    <p className="text-4xl font-bold text-[#0B4422]">{credits_available}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('signup_signin.signIn.welcome.total')}: {creditsData.total_credits} | {t('signup_signin.signIn.welcome.used')}: {creditsData.credits_used}
                    </p>
                  </div>

                  {/* Credit Status Indicator */}
                  {credits_available < 1 && (
                    <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                      <p className="text-sm text-red-700 font-semibold">
                        ⚠️ {t('payment.credits.needCredits')}
                      </p>
                    </div>
                  )}
                  {needsMoreCredits && (
                    <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                      <p className="text-sm text-yellow-700 font-semibold">
                        {t('signup_signin.signIn.welcome.limitedCredits')}
                      </p>
                    </div>
                  )}
                  {credits_available >= 2 && (
                    <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
                      <p className="text-sm text-green-700 font-semibold">
                        {t('signup_signin.signIn.welcome.sufficientCredits')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Mode Selection Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">{t('signup_signin.signIn.welcome.whoAreYouSeeking')}</h3>
                  
                  <div className="space-y-3">
                    {/* For Myself Button */}
                    <button
                      onClick={handleForMyself}
                      disabled={!hasEnoughCredits || creditsLoading}
                      className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        hasEnoughCredits
                          ? 'border-[#0B4422] hover:bg-[#0B4422] hover:text-white bg-[#0B4422]/5 cursor-pointer'
                          : 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📖</span>
                          <div>
                            <p className="font-bold">{t('signup_signin.signIn.welcome.forMyself.title')}</p>
                            <p className="text-sm opacity-75">{t('signup_signin.signIn.welcome.forMyself.description')}</p>
                          </div>
                        </div>
                        <span className="text-xl">→</span>
                      </div>
                    </button>

                    {/* For Others Button */}
                    <button
                      onClick={handleForOthers}
                      disabled={!hasEnoughCredits || creditsLoading}
                      className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        hasEnoughCredits
                          ? 'border-pink-500 hover:bg-pink-500 hover:text-white bg-pink-50 cursor-pointer'
                          : 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">❤️</span>
                          <div>
                            <p className="font-bold">{t('signup_signin.signIn.welcome.forOthers.title')}</p>
                            <p className="text-sm opacity-75">{t('signup_signin.signIn.welcome.forOthers.description')}</p>
                          </div>
                        </div>
                        <span className="text-xl">→</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Credit Purchase Section */}
                {credits_available < 1 && (
                  <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 mb-3 font-semibold">
                      {t('signup_signin.signIn.welcome.needCredits')}
                    </p>
                    <button
                      onClick={handleBuyCredits}
                      className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      {t('signup_signin.signIn.welcome.buyCredits')}
                    </button>
                  </div>
                )}

                {needsMoreCredits && (
                  <div className="mb-6 flex gap-2">
                    <button
                      onClick={handleBuyCredits}
                      className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors text-sm"
                    >
                      {t('signup_signin.signIn.welcome.buyMoreCredits')}
                    </button>
                  </div>
                )}

                {/* Logout Button */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCreditsUI(false);
                      setCreditsData(null);
                      setAuthUser(null);
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                  >
                    {t('signup_signin.signIn.welcome.back')}
                  </button>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      router.push('/auth/signin');
                    }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                  >
                    {t('signup_signin.signIn.welcome.signOut')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // ==========================================
  // RENDER: Auth UI (before auth success)
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-10 pb-6 text-center">
              <h1 className="text-3xl font-bold text-[#0B4422] mb-2">
                {t('signup_signin.signIn.title')}
              </h1>
            </div>

            <div className="px-8 pb-8">
              {/* Error Messages */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-semibold">{error.message}</p>
                  {userNotFoundError && (
                    <p className="text-xs text-red-600 mt-2">
                      {t('signup_signin.signIn.errors.signUpPrompt')}
                    </p>
                  )}
                </div>
              )}

              {/* Role Selection - Three Buttons in a Row with Inline Dropdowns */}
              <div className="mb-6 role-dropdown-container">
                <div className="grid grid-cols-3 gap-3">
                  {/* Regular Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => handleCategoryChange('regular')}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all duration-200 ${
                        category === 'regular'
                          ? 'border-[#0B4422] bg-[#0B4422]/5 shadow-sm'
                          : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                      }`}
                    >
                      <User size={18} className="text-emerald-600" />
                      <span className="text-sm font-medium text-gray-900">{t('signup_signin.signIn.roleCategories.regular')}</span>
                    </button>
                  </div>

                  {/* Grow Button with Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => handleCategoryChange('grow')}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all duration-200 ${
                        category === 'grow'
                          ? 'border-[#0B4422] bg-[#0B4422]/5 shadow-sm'
                          : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                      }`}
                    >
                      <Sprout size={18} className="text-emerald-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {category === 'grow' 
                          ? t(`signup_signin.signIn.roles.${growRole}`).split(' ')[0] || t('signup_signin.signIn.roleCategories.grow')
                          : t('signup_signin.signIn.roleCategories.grow')}
                      </span>
                      {category === 'grow' && (
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                    
                    {/* Grow Dropdown Menu */}
                    {showDropdown === 'grow' && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                        {ROLE_OPTIONS.filter(option => option.category === 'grow').map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleRoleChange(option.value)}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                              growRole === option.value ? 'bg-[#0B4422]/5 text-[#0B4422] font-medium' : 'text-gray-700'
                            }`}
                          >
                            {t(`signup_signin.signIn.roles.${option.value}`)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Enterprise Button with Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => handleCategoryChange('enterprise')}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all duration-200 ${
                        category === 'enterprise'
                          ? 'border-[#0B4422] bg-[#0B4422]/5 shadow-sm'
                          : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                      }`}
                    >
                      <Building2 size={18} className="text-emerald-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {category === 'enterprise'
                          ? t(`signup_signin.signIn.roles.${enterpriseRole}`).split(' ')[0] || t('signup_signin.signIn.roleCategories.enterprise')
                          : t('signup_signin.signIn.roleCategories.enterprise')}
                      </span>
                      {category === 'enterprise' && (
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                    
                    {/* Enterprise Dropdown Menu */}
                    {showDropdown === 'enterprise' && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                        {ROLE_OPTIONS.filter(option => option.category === 'enterprise').map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleRoleChange(option.value)}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                              enterpriseRole === option.value ? 'bg-[#0B4422]/5 text-[#0B4422] font-medium' : 'text-gray-700'
                            }`}
                          >
                            {t(`signup_signin.signIn.roles.${option.value}`)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Auth Tabs */}
              <div className="mb-6 border-b border-gray-200">
                <div className="flex gap-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('social')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                      activeTab === 'social'
                        ? 'text-[#0B4422] border-b-2 border-[#0B4422]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t('signup_signin.signIn.tabs.social')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('email')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                      activeTab === 'email'
                        ? 'text-[#0B4422] border-b-2 border-[#0B4422]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t('signup_signin.signIn.tabs.email')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('magic')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                      activeTab === 'magic'
                        ? 'text-[#0B4422] border-b-2 border-[#0B4422]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t('signup_signin.signIn.tabs.magic')}
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {/* Social Tab */}
                {activeTab === 'social' && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => handleSocialAuth('google')}
                      disabled={loading}
                      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="text-sm font-medium text-gray-700">{t('signup_signin.signIn.socialAuth.google')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialAuth('linkedin')}
                      disabled={loading}
                      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5 mr-3" fill="#0077B5" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                      <span className="text-sm font-medium text-gray-700">{t('signup_signin.signIn.socialAuth.linkedin')}</span>
                    </button>
                  </div>
                )}

                {/* Email/Password Tab */}
                {activeTab === 'email' && (
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('signup_signin.signIn.form.email.placeholder')}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4422]/20 focus:border-[#0B4422] text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('signup_signin.signIn.form.password.placeholder')}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4422]/20 focus:border-[#0B4422] text-sm"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading || creditsLoading}
                        className="flex-1 bg-[#0B4422] text-white py-3 rounded-lg hover:bg-[#0d5429] transition-colors duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? t('signup_signin.signIn.form.submit.signingIn') : t('signup_signin.signIn.form.submit.signIn')}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={loading || creditsLoading}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('signup_signin.signIn.form.submit.cancel')}
                      </button>
                    </div>
                  </form>
                )}

                {/* Magic Link Tab */}
                {activeTab === 'magic' && (
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('signup_signin.signIn.form.email.placeholder')}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4422]/20 focus:border-[#0B4422] text-sm"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading || creditsLoading}
                        className="flex-1 bg-[#0B4422] text-white py-3 rounded-lg hover:bg-[#0d5429] transition-colors duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? t('signup_signin.signIn.form.submit.sending') : t('signup_signin.signIn.form.submit.sendMagicLink')}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={loading || creditsLoading}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('signup_signin.signIn.form.submit.cancel')}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Footer Links */}
              <div className="mt-6 flex items-center justify-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => router.push('/signup')}
                  className="text-[#0B4422] hover:underline font-medium"
                >
                  {t('signup_signin.signIn.footer.noAccount')}
                </button>
                <span className="text-gray-400">•</span>
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-[#0B4422] hover:underline font-medium"
                >
                  {t('signup_signin.signIn.footer.forgotPassword')}
                </button>
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 flex items-start">
                  <span className="mr-2">ℹ️</span>
                  <span>{t('signup_signin.signIn.footer.info')}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}