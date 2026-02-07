'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { LinkNeededInfo, AuthSuccess, AuthError } from '../types';

export interface LinkingOptions {
  mergeData?: boolean;
  overwriteData?: boolean;
  preserveExisting?: boolean;
}

export interface LinkingResult {
  success: boolean;
  user?: any;
  session?: any;
  error?: AuthError;
  linkedProviders?: string[];
}

export function useProviderLinking() {
  const [isLinking, setIsLinking] = useState(false);
  const [linkingError, setLinkingError] = useState<AuthError | null>(null);

  // Link phone number to existing account
  const linkPhone = useCallback(async (
    phone: string,
    userId: string,
    options: LinkingOptions = {}
  ): Promise<LinkingResult> => {
    setIsLinking(true);
    setLinkingError(null);

    try {
      // First, verify the phone number with OTP
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          shouldCreateUser: false, // Don't create new user
        }
      });

      if (otpError) {
        throw new Error(`Failed to send OTP: ${otpError.message}`);
      }

      // For now, we'll simulate the linking process
      // In a real implementation, you'd need to:
      // 1. Verify OTP
      // 2. Update user profile with phone
      // 3. Handle data merging based on options

      const result: LinkingResult = {
        success: true,
        linkedProviders: ['phone'],
        user: { id: userId, phone },
        session: {}
      };

      return result;
    } catch (error: any) {
      const authError: AuthError = {
        code: 'PHONE_LINKING_FAILED',
        message: error.message || 'Failed to link phone number'
      };
      
      setLinkingError(authError);
      return {
        success: false,
        error: authError
      };
    } finally {
      setIsLinking(false);
    }
  }, []);

  // Link email to existing account
  const linkEmail = useCallback(async (
    email: string,
    userId: string,
    options: LinkingOptions = {}
  ): Promise<LinkingResult> => {
    setIsLinking(true);
    setLinkingError(null);

    try {
      // Send magic link to verify email ownership
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Don't create new user
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (magicLinkError) {
        throw new Error(`Failed to send magic link: ${magicLinkError.message}`);
      }

      // For now, we'll simulate the linking process
      // In a real implementation, you'd need to:
      // 1. Verify magic link
      // 2. Update user profile with email
      // 3. Handle data merging based on options

      const result: LinkingResult = {
        success: true,
        linkedProviders: ['email'],
        user: { id: userId, email },
        session: {}
      };

      return result;
    } catch (error: any) {
      const authError: AuthError = {
        code: 'EMAIL_LINKING_FAILED',
        message: error.message || 'Failed to link email'
      };
      
      setLinkingError(authError);
      return {
        success: false,
        error: authError
      };
    } finally {
      setIsLinking(false);
    }
  }, []);

  // Link social provider to existing account
  const linkSocial = useCallback(async (
    provider: 'google' | 'apple' | 'github' | 'linkedin',
    userId: string,
    options: LinkingOptions = {}
  ): Promise<LinkingResult> => {
    setIsLinking(true);
    setLinkingError(null);

    try {
      // Initiate OAuth flow for linking
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            link_user_id: userId // Pass user ID for linking
          }
        }
      });

      if (oauthError) {
        throw new Error(`Failed to initiate OAuth: ${oauthError.message}`);
      }

      // For now, we'll simulate the linking process
      // In a real implementation, you'd need to:
      // 1. Handle OAuth callback
      // 2. Link accounts in Supabase
      // 3. Handle data merging based on options

      const result: LinkingResult = {
        success: true,
        linkedProviders: [provider],
        user: { id: userId, provider },
        session: {}
      };

      return result;
    } catch (error: any) {
      const authError: AuthError = {
        code: 'SOCIAL_LINKING_FAILED',
        message: error.message || `Failed to link ${provider} account`
      };
      
      setLinkingError(authError);
      return {
        success: false,
        error: authError
      };
    } finally {
      setIsLinking(false);
    }
  }, []);

  // Unlink a provider from account
  const unlinkProvider = useCallback(async (
    provider: 'phone' | 'email' | 'google' | 'apple' | 'github' | 'linkedin',
    userId: string
  ): Promise<LinkingResult> => {
    setIsLinking(true);
    setLinkingError(null);

    try {
      // This would typically involve:
      // 1. Removing the provider from user metadata
      // 2. Updating the user profile
      // 3. Ensuring at least one auth method remains

      // For now, we'll simulate the unlinking process
      const result: LinkingResult = {
        success: true,
        linkedProviders: [],
        user: { id: userId },
        session: {}
      };

      return result;
    } catch (error: any) {
      const authError: AuthError = {
        code: 'PROVIDER_UNLINKING_FAILED',
        message: error.message || `Failed to unlink ${provider}`
      };
      
      setLinkingError(authError);
      return {
        success: false,
        error: authError
      };
    } finally {
      setIsLinking(false);
    }
  }, []);

  // Get linked providers for a user
  const getLinkedProviders = useCallback(async (userId: string): Promise<string[]> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return [];
      }

      const providers: string[] = [];
      
      if (user.email) providers.push('email');
      if (user.phone) providers.push('phone');
      if (user.app_metadata?.provider) {
        providers.push(user.app_metadata.provider);
      }

      return providers;
    } catch (error) {
      console.error('Failed to get linked providers:', error);
      return [];
    }
  }, []);

  // Check if a provider is linked
  const isProviderLinked = useCallback(async (
    provider: string,
    userId: string
  ): Promise<boolean> => {
    const linkedProviders = await getLinkedProviders(userId);
    return linkedProviders.includes(provider);
  }, [getLinkedProviders]);

  // Merge user data from different providers
  const mergeUserData = useCallback((
    existingData: Record<string, any>,
    newData: Record<string, any>,
    options: LinkingOptions = {}
  ): Record<string, any> => {
    if (options.overwriteData) {
      return { ...existingData, ...newData };
    }

    if (options.preserveExisting) {
      return { ...newData, ...existingData };
    }

    // Default: merge intelligently
    const merged = { ...existingData };
    
    for (const [key, value] of Object.entries(newData)) {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value) && Array.isArray(merged[key])) {
          // Merge arrays, removing duplicates
          merged[key] = [...new Set([...merged[key], ...value])];
        } else if (typeof value === 'object' && typeof merged[key] === 'object') {
          // Recursively merge objects
          merged[key] = mergeUserData(merged[key] || {}, value, options);
        } else {
          // Use new value if existing is null/undefined
          if (merged[key] === null || merged[key] === undefined) {
            merged[key] = value;
          }
        }
      }
    }

    return merged;
  }, []);

  // Handle linking resolution from auth components
  const resolveLinking = useCallback(async (
    linkInfo: LinkNeededInfo,
    userId: string,
    options: LinkingOptions = {}
  ): Promise<LinkingResult> => {
    switch (linkInfo.type) {
      case 'phone':
        return linkPhone(linkInfo.identifier, userId, options);
      case 'email':
        return linkEmail(linkInfo.identifier, userId, options);
      case 'social':
        return linkSocial(linkInfo.suggestedProvider as any || 'google', userId, options);
      default:
        return {
          success: false,
          error: {
            code: 'UNKNOWN_PROVIDER_TYPE',
            message: `Unknown provider type: ${linkInfo.type}`
          }
        };
    }
  }, [linkPhone, linkEmail, linkSocial]);

  return {
    // State
    isLinking,
    linkingError,

    // Core linking functions
    linkPhone,
    linkEmail,
    linkSocial,
    unlinkProvider,
    resolveLinking,

    // Utility functions
    getLinkedProviders,
    isProviderLinked,
    mergeUserData,

    // Clear error
    clearLinkingError: () => setLinkingError(null)
  };
}
