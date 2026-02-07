'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthError } from '../types';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

export interface UserClaims {
  email?: string;
  phone?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  role?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
}

export function useAuthState() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  });

  const [claims, setClaims] = useState<UserClaims | null>(null);

  // Get user claims from JWT
  const getUserClaims = useCallback(async (user: User): Promise<UserClaims | null> => {
    try {
      const { data: { user: userData }, error } = await supabase.auth.getUser();
      
      if (error || !userData) {
        return null;
      }

      // Extract claims from user metadata
      const userClaims: UserClaims = {
        email: userData.email,
        phone: userData.phone,
        email_verified: userData.email_confirmed_at ? true : false,
        phone_verified: userData.phone_confirmed_at ? true : false,
        role: userData.user_metadata?.role,
        permissions: userData.user_metadata?.permissions,
        metadata: userData.user_metadata
      };

      return userClaims;
    } catch (error) {
      console.error('Failed to get user claims:', error);
      return null;
    }
  }, []);

  // Update auth state
  const updateAuthState = useCallback((user: User | null, session: Session | null) => {
    setState(prev => ({
      ...prev,
      user,
      session,
      loading: false,
      error: null
    }));

    if (user) {
      getUserClaims(user).then(setClaims);
    } else {
      setClaims(null);
    }
  }, [getUserClaims]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      updateAuthState(null, null);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: {
          code: 'SIGNOUT_FAILED',
          message: error.message || 'Failed to sign out'
        }
      }));
    }
  }, [updateAuthState]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        throw error;
      }

      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        updateAuthState(user, session);
      } else {
        updateAuthState(null, null);
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: {
          code: 'REFRESH_FAILED',
          message: error.message || 'Failed to refresh user data'
        }
      }));
    }
  }, [updateAuthState]);

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const { data: { user }, error } = await supabase.auth.updateUser(updates);
      
      if (error) {
        throw error;
      }

      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        updateAuthState(user, session);
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: {
          code: 'PROFILE_UPDATE_FAILED',
          message: error.message || 'Failed to update profile'
        }
      }));
    }
  }, [updateAuthState]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (mounted) {
          if (session?.user) {
            updateAuthState(session.user, session);
          } else {
            setState(prev => ({ ...prev, loading: false }));
          }
        }
      } catch (error: any) {
        if (mounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: {
              code: 'INIT_FAILED',
              message: error.message || 'Failed to initialize auth'
            }
          }));
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          if (event === 'SIGNED_IN' && session?.user) {
            updateAuthState(session.user, session);
          } else if (event === 'SIGNED_OUT') {
            updateAuthState(null, null);
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            updateAuthState(session.user, session);
          } else if (event === 'USER_UPDATED' && session?.user) {
            updateAuthState(session.user, session);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [updateAuthState]);

  return {
    // State
    user: state.user,
    session: state.session,
    loading: state.loading,
    error: state.error,
    
    // Claims
    claims,
    
    // Actions
    signOut,
    refreshUser,
    updateProfile,
    
    // Computed values
    isAuthenticated: !!state.user,
    isEmailVerified: claims?.email_verified || false,
    isPhoneVerified: claims?.phone_verified || false,
    hasRole: (role: string) => claims?.role === role,
    hasPermission: (permission: string) => claims?.permissions?.includes(permission) || false
  };
}
