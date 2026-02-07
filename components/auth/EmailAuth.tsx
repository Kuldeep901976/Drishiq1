'use client';

import React, { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  EmailAuthProps, 
  EmailAuthState, 
  AuthSuccess, 
  LinkNeededInfo, 
  AuthError,
  SocialProvider,
  SocialProviderConfig
} from './types';

// Social provider configurations
const SOCIAL_PROVIDERS: Record<SocialProvider, SocialProviderConfig> = {
  google: {
    key: 'google',
    name: 'Google',
    icon: '/assets/social-icons/google.jpg',
    color: '#4285F4',
    enabled: true
  },
  apple: {
    key: 'apple',
    name: 'Apple',
    icon: '/assets/social-icons/apple.png',
    color: '#000000',
    enabled: true
  },
  github: {
    key: 'github',
    name: 'GitHub',
    icon: '/assets/social-icons/github.png',
    color: '#333333',
    enabled: true
  },
  linkedin: {
    key: 'linkedin',
    name: 'LinkedIn',
    icon: '/assets/social-icons/linkedin.png',
    color: '#0A66C2',
    enabled: true
  }
};

export default function EmailAuth({
  enablePassword = true,
  enableMagicLink = true,
  socialProviders = ['google', 'apple', 'github'],
  onSuccess,
  onLinkNeeded,
  onCancel,
  className = ''
}: EmailAuthProps) {
  const [state, setState] = useState<EmailAuthState>({
    step: 'email',
    email: '',
    password: '',
    error: undefined
  });

  const [activeTab, setActiveTab] = useState<'password' | 'magic-link' | 'social'>('password');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, email: e.target.value, error: undefined }));
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, password: e.target.value, error: undefined }));
  }, []);

  const handlePasswordSignIn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.email.trim() || !state.password.trim()) {
      setState(prev => ({
        ...prev,
        error: { code: 'INVALID_INPUT', message: 'Please enter both email and password' }
      }));
      return;
    }

    setIsLoading(true);
    setState(prev => ({ ...prev, error: undefined }));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: state.email,
        password: state.password
      });

      if (error) {
        // Check if user exists with different provider
        if (error.message.includes('Invalid login credentials')) {
          const linkInfo: LinkNeededInfo = {
            type: 'email',
            identifier: state.email,
            suggestedProvider: 'password'
          };
          onLinkNeeded(linkInfo);
          return;
        }
        throw error;
      }

      if (data.user && data.session) {
        // Map Supabase user to our User interface
        const mappedUser: any = {
          uid: data.user.id,
          email: data.user.email,
          emailVerified: data.user.email_confirmed_at ? true : false,
          displayName: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          photoURL: data.user.user_metadata?.avatar_url,
          metadata: data.user.user_metadata,
          providerData: [],
          refreshToken: data.session.refresh_token,
          tenantId: null,
          isAnonymous: false,
          providerId: 'supabase'
        };
        
        const result: AuthSuccess = {
          user: mappedUser,
          session: data.session,
          provider: 'email'
        };
        onSuccess(result);
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: {
          code: 'PASSWORD_SIGNIN_FAILED',
          message: error.message || 'Failed to sign in with password'
        }
      }));
    } finally {
      setIsLoading(false);
    }
  }, [state.email, state.password, onSuccess, onLinkNeeded]);

  const handleMagicLinkSignIn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.email.trim()) {
      setState(prev => ({
        ...prev,
        error: { code: 'INVALID_EMAIL', message: 'Please enter a valid email address' }
      }));
      return;
    }

    setIsLoading(true);
    setState(prev => ({ ...prev, error: undefined }));

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: state.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        // Check if user exists with different provider
        if (error.message.includes('User already registered')) {
          const linkInfo: LinkNeededInfo = {
            type: 'email',
            identifier: state.email,
            suggestedProvider: 'magic-link'
          };
          onLinkNeeded(linkInfo);
          return;
        }
        throw error;
      }

      // Magic link sent successfully
      setState(prev => ({ ...prev, step: 'magic-link' }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: {
          code: 'MAGIC_LINK_FAILED',
          message: error.message || 'Failed to send magic link'
        }
      }));
    } finally {
      setIsLoading(false);
    }
  }, [state.email, onLinkNeeded]);

  const handleSocialSignIn = useCallback(async (provider: SocialProvider) => {
    if (!state.email.trim()) {
      setState(prev => ({
        ...prev,
        error: { code: 'INVALID_EMAIL', message: 'Please enter your email first' }
      }));
      return;
    }

    setIsLoading(true);
    setState(prev => ({ ...prev, error: undefined }));

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            email: state.email
          }
        }
      });

      if (error) {
        // Check if user exists with different provider
        if (error.message.includes('User already registered')) {
          const linkInfo: LinkNeededInfo = {
            type: 'social',
            identifier: state.email,
            suggestedProvider: provider
          };
          onLinkNeeded(linkInfo);
          return;
        }
        throw error;
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: {
          code: 'SOCIAL_SIGNIN_FAILED',
          message: `Failed to sign in with ${provider}: ${error.message}`
        }
      }));
    } finally {
      setIsLoading(false);
    }
  }, [state.email, onLinkNeeded]);

  const resetToEmail = useCallback(() => {
    setState(prev => ({
      ...prev,
      step: 'email',
      password: '',
      error: undefined
    }));
  }, []);

  // Filter enabled social providers
  const enabledSocialProviders = socialProviders
    .filter(provider => SOCIAL_PROVIDERS[provider]?.enabled)
    .map(provider => SOCIAL_PROVIDERS[provider]);

  if (state.step === 'magic-link') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">📧</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Check Your Email</h3>
          <p className="text-sm text-gray-600">
            We've sent a magic link to <strong>{state.email}</strong>
          </p>
          <p className="text-xs text-gray-500">
            Click the link in your email to sign in
          </p>
          <button
            type="button"
            onClick={resetToEmail}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Email Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={state.email}
          onChange={handleEmailChange}
          placeholder="Enter your email"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{state.error.message}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        {enablePassword && (
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'password'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Password
          </button>
        )}
        {enableMagicLink && (
          <button
            type="button"
            onClick={() => setActiveTab('magic-link')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'magic-link'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Magic Link
          </button>
        )}
        {enabledSocialProviders.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('social')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'social'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Social
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'password' && enablePassword && (
        <form onSubmit={handlePasswordSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={state.password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isLoading || !state.email.trim() || !state.password.trim()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {activeTab === 'magic-link' && enableMagicLink && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            We'll send you a secure link to sign in without a password
          </p>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleMagicLinkSignIn}
              disabled={isLoading || !state.email.trim()}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Magic Link'}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'social' && enabledSocialProviders.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Sign in with your social account
          </p>

          <div className="grid grid-cols-2 gap-3">
            {enabledSocialProviders.map((provider) => (
              <button
                key={provider.key}
                type="button"
                onClick={() => handleSocialSignIn(provider.key)}
                disabled={isLoading || !state.email.trim()}
                className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: provider.color }}
              >
                <img
                  src={provider.icon}
                  alt={provider.name}
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm font-medium">{provider.name}</span>
              </button>
            ))}
          </div>

          {onCancel && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
