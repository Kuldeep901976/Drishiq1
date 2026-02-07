"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useRedirects() {
  const router = useRouter();

  const redirectTo = (path: string) => {
    router.push(path);
  };

  const redirectToLogin = () => {
    redirectTo('/auth/login');
  };

  const redirectToDashboard = () => {
    redirectTo('/user/dashboard');
  };

  return {
    redirectTo,
    redirectToLogin,
    redirectToDashboard
  };
}

export function useDualAuthRedirect(options?: { 
  requirePhone?: boolean; 
  requireEmail?: boolean; 
  autoRedirect?: boolean;
  onComplete?: () => void;
}) {
  const router = useRouter();
  
  return {
    redirectToAuth: () => router.push('/auth/login'),
    redirectToSignup: () => router.push('/user/signup'),
    phoneVerified: false,
    emailVerified: false,
    bothComplete: false,
    setPhoneVerified: (value: boolean) => {},
    setEmailVerified: (value: boolean) => {}
  };
}

export function useTrialSupportRedirect(options?: { 
  autoRedirect?: boolean;
  onComplete?: () => void;
}) {
  const router = useRouter();
  
  return {
    redirectToTrial: () => router.push('/trial-access'),
    redirectToSupport: () => router.push('/support'),
    executeRedirect: () => router.push('/trial-access')
  };
}
