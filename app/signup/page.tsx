'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/drishiq-i18n';
import { User, Sprout, Building2 } from 'lucide-react';

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
  { value: 'enterprise_admin', label: 'Enterprise Admin', category: 'enterprise', tagline: 'Platform administration' }
];

type AuthTab = 'social' | 'email' | 'magic';

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage(['payment', 'common', 'chat', 'signup_signin']);
  const [category, setCategory] = useState<'regular' | 'grow' | 'enterprise'>('regular');
  const [selectedUserType, setSelectedUserType] = useState('user');
  const [growRole, setGrowRole] = useState('client_admin');
  const [enterpriseRole, setEnterpriseRole] = useState('enterprise_admin');
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<AuthTab>('social');
  const [showDropdown, setShowDropdown] = useState<'grow' | 'enterprise' | null>(null);
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (category === 'regular') setSelectedUserType('user');
    if (category === 'grow') setSelectedUserType(growRole);
    if (category === 'enterprise') setSelectedUserType(enterpriseRole);
  }, [category, growRole, enterpriseRole]);

  // Check for error in URL parameters (from callback redirect)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    
    if (errorParam === 'user_exists' && messageParam) {
      setError({
        code: 'USER_EXISTS',
        message: decodeURIComponent(messageParam)
      });
      // Clear the error from URL to prevent showing it again on refresh
      if (typeof window !== 'undefined') {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('error');
        newUrl.searchParams.delete('message');
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  }, [searchParams]);

  // Handle hash-based category selection (e.g., /signup#grow) and tab query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for tab query parameter first (from middleware redirect)
      const tabParam = searchParams.get('tab');
      if (tabParam === 'enterprise') {
        setCategory('enterprise');
        setShowDropdown('enterprise');
        // Set hash for visual indication
        window.location.hash = 'enterprise';
        return;
      }
      
      // Then check hash-based category selection (e.g., /signup#grow)
      const hash = window.location.hash.slice(1); // Remove the # symbol
      if (hash === 'grow') {
        setCategory('grow');
        setShowDropdown('grow');
        // Scroll to category section after a brief delay to ensure category is set
        setTimeout(() => {
          const categorySection = document.querySelector('.grid.grid-cols-3.gap-3');
          if (categorySection) {
            categorySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else if (hash === 'enterprise') {
        setCategory('enterprise');
        setShowDropdown('enterprise');
      } else if (hash === 'regular') {
        setCategory('regular');
      }
    }
  }, [searchParams]);

  // Preserve redirect param for post-signup (e.g. /payment?plan=... from onboarding)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const redirect = searchParams.get('redirect');
      if (redirect) {
        sessionStorage.setItem('post_signup_redirect', redirect);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Store BOTH category and role
      sessionStorage.setItem('signup_user_type', selectedUserType);
      sessionStorage.setItem('signup_category', category);
      sessionStorage.setItem('signup_flow', 'true');
    }
  }, [selectedUserType, category]);

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

  // Check for super admin session - super admin should never see signup page
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (typeof window === 'undefined') return;

      const superAdminToken = localStorage.getItem('admin_session_token');
      const superAdminExpires = localStorage.getItem('admin_session_expires');

      if (superAdminToken && superAdminExpires) {
        // Check if session is still valid (not expired)
        const expiresAt = new Date(superAdminExpires);
        if (expiresAt > new Date()) {
          // Verify session with admin-auth service
          try {
            const verifyRes = await fetch('/api/admin-auth/auth/verify', {
              headers: { 'Authorization': `Bearer ${superAdminToken}` }
            });

            if (verifyRes.ok) {
              // Super admin session is valid, redirect to admin dashboard
              // Super admin should never see signup page
              router.replace('/admin/dashboard');
              return;
            }
          } catch (error) {
            // Verification failed, clear invalid session
            localStorage.removeItem('admin_session_token');
            localStorage.removeItem('admin_session_expires');
          }
        } else {
          // Session expired, clear it
          localStorage.removeItem('admin_session_token');
          localStorage.removeItem('admin_session_expires');
        }
      }
    };

    checkSuperAdmin();
  }, [router]);


  const handleAuthSuccess = async (result: any) => {
    console.log('Sign up success:', result);
    
    try {
      if (result.user) {
        console.log('✅ OAuth successful');
      }
      
      sessionStorage.setItem('signup_completed', 'true');
      sessionStorage.setItem('user_type', selectedUserType);
      
      console.log('✅ Waiting for callback redirect...');
      
    } catch (error) {
      console.error('Error in sign up success:', error);
    }
  };

  // Check if user exists in users table by email using API route (avoids RLS issues)
  const checkUserExists = async (email: string): Promise<boolean> => {
    try {
      console.log('🔍 Checking if user exists:', email);
      
      const response = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      if (!response.ok) {
        console.error('API error checking user:', response.status);
        return false;
      }

      const result = await response.json();
      console.log('🔍 User existence check result:', result);
      
      return result.exists === true;
    } catch (err) {
      console.error('Error checking user existence:', err);
      return false;
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'linkedin') => {
    setSocialLoading(provider);
    setError(null);

    try {
      // Store user type AND category before OAuth redirect
      sessionStorage.setItem('signup_user_type', selectedUserType);
      sessionStorage.setItem('signup_category', category);
      sessionStorage.setItem('signup_flow', 'true');

      const providerMap: Record<string, string> = {
        google: 'google',
        linkedin: 'linkedin_oidc'
      };

      const redirectUrl = `${window.location.origin}/auth/callback?signup=true`;
      console.log(`🔐 Starting ${provider} OAuth with user type: ${selectedUserType}, category: ${category}`);
      console.log(`📍 Redirect URL: ${redirectUrl}`);
      console.log(`📍 Current origin: ${window.location.origin}`);
      console.log(`📍 Current port: ${window.location.port}`);

      // Note: Email check for social auth happens in callback after OAuth
      // because we don't have email until after OAuth completes
      console.log(`🔐 Calling signInWithOAuth for ${provider}...`);
      const { data, error: socialError } = await supabase.auth.signInWithOAuth({
        provider: providerMap[provider] as any,
        options: {
          redirectTo: redirectUrl,
        }
      });
      
      if (socialError) {
        console.error(`❌ ${provider} OAuth error:`, socialError);
        setSocialLoading(null);
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
        console.log(`🔍 URL contains 'supabase.co':`, data.url.includes('supabase.co'));
        console.log(`🔍 URL type check:`, typeof data.url);
        console.log(`🔍 URL length:`, data.url?.length);
        
        // Verify URL is valid before redirecting
        if (data.url && data.url.startsWith('http')) {
          // Log the URL before redirect to debug
          console.log(`🔍 About to redirect to:`, data.url);
          
          // Check if this is a Supabase URL (which should redirect to Google)
          // or if it's already going to Google
          const isSupabaseUrl = data.url.includes('supabase.co');
          const isGoogleUrl = data.url.includes('accounts.google.com');
          
          console.log(`🔍 URL Analysis:`, {
            isSupabaseUrl,
            isGoogleUrl,
            shouldRedirectToGoogle: isSupabaseUrl && !isGoogleUrl
          });
          
          // Store redirect info for debugging
          sessionStorage.setItem('oauth_redirect_url', data.url);
          sessionStorage.setItem('oauth_provider', provider);
          sessionStorage.setItem('oauth_redirect_time', Date.now().toString());
          
          // FORCE redirect - try multiple methods to ensure it works
          // Stop ALL React state updates that could interfere
          setSocialLoading(null); // Clear loading state immediately
          
          // Log that we're about to redirect
          console.log('🔀 Browser redirect initiated...');
          console.log('🔀 Current URL:', window.location.href);
          console.log('🔀 Target URL:', data.url);
          
          // CRITICAL: Force immediate redirect - prevent any React interference
          // Stop all React operations first
          try {
            // Use location.assign for explicit navigation
            // This is more explicit than href and less likely to be blocked
            window.location.assign(data.url);
            
            // If assign doesn't work, try href
            // Note: This code should NOT execute if assign works (page navigates away)
            console.warn('⚠️ assign() did not redirect - trying href...');
            window.location.href = data.url;
            
            // If we still haven't redirected, something is blocking it
            console.error('❌ All redirect methods failed - redirect may be blocked');
          } catch (e) {
            console.error('❌ Redirect exception:', e);
            // Last resort: try replace
            window.location.replace(data.url);
          }
          
          // Exit immediately - don't let any other code run
          // Note: This return may not execute if redirect works
          return;
        } else {
          console.error(`❌ Invalid URL format:`, data.url);
          throw new Error('Invalid OAuth URL received from Supabase');
        }
      }
      
      // Fallback: If no URL but no error, Supabase should handle it
      // But log it so we can see what's happening
      console.warn(`⚠️ No URL in response for ${provider}:`, data);
      console.log(`⏳ Waiting for Supabase automatic redirect...`);
      
    } catch (err: any) {
      setError({
        code: err.code || 'SOCIAL_AUTH_ERROR',
        message: err.message || t('signup_signin.signUp.errors.socialAuthError', { provider: provider === 'linkedin' ? 'LinkedIn' : 'Google' })
      });
      setSocialLoading(null);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.trim()) {
      setError({
        code: 'EMAIL_REQUIRED',
        message: t('signup_signin.signUp.errors.emailRequired')
      });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      // Store user type and category before sending link
      sessionStorage.setItem('signup_user_type', selectedUserType);
      sessionStorage.setItem('signup_category', category);
      sessionStorage.setItem('signup_flow', 'true');

      // Send OTP link for password creation (similar to magic link)
      // This will redirect to /create-password where user sets password
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/create-password`,
          shouldCreateUser: true, // This allows creating new users
          data: { 
            user_type: selectedUserType, 
            user_category: category 
          }
        },
      });

      if (otpError) throw otpError;

      setSuccessMessage(t('signup_signin.signUp.success.passwordLinkSent', { email }));
      setEmail('');
    } catch (err: any) {
      setError({
        code: err.code || 'EMAIL_SIGNUP_ERROR',
        message: err.message || t('signup_signin.signUp.errors.emailSignupError')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.trim()) {
      setError({
        code: 'EMAIL_REQUIRED',
        message: t('signup_signin.signUp.errors.emailRequired')
      });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      // Store user type and category before sending magic link
      sessionStorage.setItem('signup_user_type', selectedUserType);
      sessionStorage.setItem('signup_category', category);
      sessionStorage.setItem('signup_flow', 'true');

      // Send magic link - user existence check will happen AFTER clicking link (in callback)
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?signup=true`,
          shouldCreateUser: true,
          data: { 
            user_type: selectedUserType, 
            user_category: category 
          }
        },
      });

      if (magicLinkError) throw magicLinkError;

      setSuccessMessage(t('signup_signin.signUp.success.magicLinkSent', { email }));
      setEmail('');
    } catch (err: any) {
      setError({
        code: err.code || 'MAGIC_LINK_ERROR',
        message: err.message || t('signup_signin.signUp.errors.magicLinkError')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEmail('');
    setError(null);
    setSuccessMessage('');
  };

  const handleCategoryChange = (newCategory: 'regular' | 'grow' | 'enterprise') => {
    if (newCategory === 'regular') {
      setCategory(newCategory);
      setShowDropdown(null);
    } else {
      if (category === newCategory && showDropdown === newCategory) {
        setShowDropdown(null);
      } else {
        setCategory(newCategory);
        setShowDropdown(newCategory);
      }
    }
  };

  const handleRoleChange = (newRole: string) => {
    if (category === 'grow') {
      setGrowRole(newRole);
    } else if (category === 'enterprise') {
      setEnterpriseRole(newRole);
    }
    setShowDropdown(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-10 pb-6 text-center">
              <h1 className="text-3xl font-bold text-[#0B4422] mb-2">
                {t('signup_signin.signUp.title')}
              </h1>
            </div>

            <div className="px-8 pb-8">
              {/* Error Messages */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm text-red-700 font-semibold mb-1">{error.message}</p>
                      {error.code === 'USER_EXISTS' && (
                        <p className="text-xs text-red-600 mt-1">
                          {t('signup_signin.signUp.errors.userExistsTip')}{' '}
                          <button
                            type="button"
                            onClick={() => router.push('/signin')}
                            className="underline font-medium hover:text-red-800"
                          >
                            {t('signup_signin.signUp.errors.signInInstead')}
                          </button>
                          {' '}instead.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Success Messages */}
              {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-semibold">✅ {successMessage}</p>
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
                      <span className="text-sm font-medium text-gray-900">{t('signup_signin.signUp.roleCategories.regular')}</span>
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
                          ? t(`signup_signin.signUp.roles.${growRole}`).split(' ')[0] || t('signup_signin.signUp.roleCategories.grow')
                          : t('signup_signin.signUp.roleCategories.grow')}
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
                            {t(`signup_signin.signUp.roles.${option.value}`)}
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
                          ? t(`signup_signin.signUp.roles.${enterpriseRole}`).split(' ')[0] || t('signup_signin.signUp.roleCategories.enterprise')
                          : t('signup_signin.signUp.roleCategories.enterprise')}
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
                            {t(`signup_signin.signUp.roles.${option.value}`)}
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
                    onClick={() => { setActiveTab('social'); setError(null); }}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                      activeTab === 'social'
                        ? 'text-[#0B4422] border-b-2 border-[#0B4422]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t('signup_signin.signUp.tabs.social')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('email'); setError(null); }}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                      activeTab === 'email'
                        ? 'text-[#0B4422] border-b-2 border-[#0B4422]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t('signup_signin.signUp.tabs.email')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('magic'); setError(null); }}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                      activeTab === 'magic'
                        ? 'text-[#0B4422] border-b-2 border-[#0B4422]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t('signup_signin.signUp.tabs.magic')}
                  </button>
                </div>
              </div>

                {/* Social Tab */}
                {activeTab === 'social' && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => handleSocialAuth('google')}
                      disabled={socialLoading !== null}
                      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="text-sm font-medium text-gray-700">{t('signup_signin.signUp.socialAuth.google')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialAuth('linkedin')}
                      disabled={socialLoading !== null}
                      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5 mr-3" fill="#0077B5" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                      <span className="text-sm font-medium text-gray-700">{t('signup_signin.signUp.socialAuth.linkedin')}</span>
                    </button>
                  </div>
                )}

                {/* Email/Password Tab */}
                {activeTab === 'email' && (
                  <form onSubmit={handleEmailSignUp} className="space-y-4">
                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('signup_signin.signUp.form.email.placeholder')}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4422]/20 focus:border-[#0B4422] text-sm"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-[#0B4422] text-white py-3 rounded-lg hover:bg-[#0d5429] transition-colors duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? t('signup_signin.signUp.form.submit.sending') : t('signup_signin.signUp.form.submit.sendPasswordLink')}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={loading}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('signup_signin.signUp.form.submit.cancel')}
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
                        placeholder={t('signup_signin.signUp.form.email.placeholder')}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4422]/20 focus:border-[#0B4422] text-sm"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-[#0B4422] text-white py-3 rounded-lg hover:bg-[#0d5429] transition-colors duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? t('signup_signin.signUp.form.submit.sending') : t('signup_signin.signUp.form.submit.sendMagicLink')}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={loading}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('signup_signin.signUp.form.submit.cancel')}
                      </button>
                    </div>
                  </form>
                )}

              {/* Footer Links */}
              <div className="mt-6 flex items-center justify-center gap-2 text-sm">
                <span className="text-gray-600">{t('signup_signin.signUp.footer.hasAccount')}</span>
                <button
                  type="button"
                  onClick={() => router.push('/signin')}
                  className="text-[#0B4422] hover:underline font-medium"
                >
                  {t('signup_signin.signUp.footer.signIn')}
                </button>
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 flex items-start">
                  <span className="mr-2">ℹ️</span>
                  <span>{t('signup_signin.signUp.footer.info')}</span>
                </p>
              </div>

              {/* Terms */}
              <div className="mt-4 text-xs text-center text-gray-500">
                {t('signup_signin.signUp.footer.terms')}{' '}
                <button onClick={() => router.push('/terms')} className="text-[#0B4422] hover:underline">
                  {t('signup_signin.signUp.footer.termsLink')}
                </button>
                {' '}{t('signup_signin.signUp.footer.and')}{' '}
                <button onClick={() => router.push('/privacy')} className="text-[#0B4422] hover:underline">
                  {t('signup_signin.signUp.footer.privacyLink')}
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