'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export interface CreatePasswordFormProps {
  /** Redirect URL after successful password creation */
  redirectUrl?: string;
  /** Whether to check if user already exists */
  checkExistingUser?: boolean;
  /** Minimum password length */
  minPasswordLength?: number;
  /** Custom class names for the form container */
  className?: string;
  /** Show footer with sign-in link */
  showFooter?: boolean;
  /** Sign-in redirect URL */
  signInUrl?: string;
}

export default function CreatePasswordForm({
  redirectUrl = '/profile?source=signup',
  checkExistingUser = true,
  minPasswordLength = 8,
  className = '',
  showFooter = true,
  signInUrl = '/signin'
}: CreatePasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);

  useEffect(() => {
    // Check if passwords are stored in sessionStorage (from error redirect)
    const storedPassword = typeof window !== 'undefined' 
      ? sessionStorage.getItem('pending_password') 
      : null;
    const storedConfirmPassword = typeof window !== 'undefined' 
      ? sessionStorage.getItem('pending_confirm_password') 
      : null;
    
    if (storedPassword && storedConfirmPassword) {
      setPassword(storedPassword);
      setConfirmPassword(storedConfirmPassword);
      sessionStorage.removeItem('pending_password');
      sessionStorage.removeItem('pending_confirm_password');
      setError('There was an error completing your profile. Please try submitting your password again.');
    }

    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        setCheckingUser(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError('Invalid or expired link. Please request a new password creation link.');
          setCheckingUser(false);
          return;
        }

        // Check if user exists in users table
        if (checkExistingUser) {
          const userEmail = session.user.email;
          if (userEmail) {
            const checkResponse = await fetch('/api/auth/check-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: userEmail.toLowerCase().trim() }),
            });

            if (checkResponse.ok) {
              const checkResult = await checkResponse.json();
              if (checkResult.exists) {
                setError('An account with this email already exists. Redirecting to sign in...');
                setTimeout(() => router.push(signInUrl), 2000);
                setCheckingUser(false);
                return;
              }
            }
          }
        }
        setCheckingUser(false);
      } catch (err) {
        console.error('Error checking user:', err);
        setCheckingUser(false);
      }
    };
    checkAuth();
  }, [router, checkExistingUser, signInUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password.length < minPasswordLength) {
      setError(`Password must be at least ${minPasswordLength} characters long`);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Store passwords in sessionStorage (in case profile page errors)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pending_password', password);
        sessionStorage.setItem('pending_confirm_password', confirmPassword);
      }

      setSuccess(true);
      
      // Clean up and redirect
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('signup_user_type');
          sessionStorage.removeItem('signup_category');
          sessionStorage.removeItem('signup_flow');
        }
        router.push(redirectUrl);
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingUser) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422] mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your link...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#0B4422] mb-2">Password Created Successfully!</h2>
        <p className="text-gray-600">Redirecting you to complete your profile...</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-semibold">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`Enter your password (min ${minPasswordLength} characters)`}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4422]/20 focus:border-[#0B4422] text-sm"
            required
            minLength={minPasswordLength}
          />
        </div>

        <div>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4422]/20 focus:border-[#0B4422] text-sm"
            required
          />
        </div>

        <button
          type="submit"
          disabled={!password || !confirmPassword || isLoading}
          className="w-full bg-[#0B4422] text-white py-3 rounded-lg hover:bg-[#0d5429] transition-colors duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Password...' : 'Create Password'}
        </button>
      </form>

      {showFooter && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => router.push(signInUrl)}
              className="text-[#0B4422] hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
