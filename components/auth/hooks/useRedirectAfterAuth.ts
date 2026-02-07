'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface RedirectOptions {
  defaultPath?: string;
  allowedDomains?: string[];
  allowedPaths?: string[];
  preserveQueryParams?: boolean;
  addAuthParams?: boolean;
}

export interface RedirectResult {
  success: boolean;
  targetPath: string;
  error?: string;
}

const DEFAULT_OPTIONS: RedirectOptions = {
  defaultPath: '/dashboard',
  allowedDomains: [],
  allowedPaths: ['/dashboard', '/profile', '/settings', '/'],
  preserveQueryParams: true,
  addAuthParams: false
};

export function useRedirectAfterAuth(options: RedirectOptions = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const config = { ...DEFAULT_OPTIONS, ...options };

  // Sanitize and validate returnTo URL
  const sanitizeReturnTo = useCallback((returnTo: string): string | null => {
    try {
      // Remove protocol and domain if present
      let path = returnTo;
      
      // If it's a full URL, extract just the path
      if (returnTo.startsWith('http://') || returnTo.startsWith('https://')) {
        const url = new URL(returnTo);
        path = url.pathname + url.search;
      }

      // Ensure it starts with /
      if (!path.startsWith('/')) {
        path = '/' + path;
      }

      // Check if path is allowed
      if (config.allowedPaths && !config.allowedPaths.includes(path)) {
        console.warn(`Redirect path not allowed: ${path}`);
        return null;
      }

      // Check if domain is allowed (if it was a full URL)
      if (returnTo.startsWith('http://') || returnTo.startsWith('https://')) {
        const url = new URL(returnTo);
        if (config.allowedDomains && config.allowedDomains.length > 0) {
          if (!config.allowedDomains.includes(url.hostname)) {
            console.warn(`Redirect domain not allowed: ${url.hostname}`);
            return null;
          }
        }
      }

      return path;
    } catch (error) {
      console.error('Failed to sanitize returnTo URL:', error);
      return null;
    }
  }, [config.allowedPaths, config.allowedDomains]);

  // Get returnTo from various sources
  const getReturnTo = useCallback((): string | null => {
    // 1. Check URL search params
    const returnToParam = searchParams.get('returnTo');
    if (returnToParam) {
      const sanitized = sanitizeReturnTo(returnToParam);
      if (sanitized) return sanitized;
    }

    // 2. Check localStorage (for cross-page redirects)
    if (typeof window !== 'undefined') {
      const storedReturnTo = localStorage.getItem('auth_returnTo');
      if (storedReturnTo) {
        const sanitized = sanitizeReturnTo(storedReturnTo);
        if (sanitized) {
          localStorage.removeItem('auth_returnTo');
          return sanitized;
        }
      }
    }

    // 3. Check sessionStorage (for same-session redirects)
    if (typeof window !== 'undefined') {
      const sessionReturnTo = sessionStorage.getItem('auth_returnTo');
      if (sessionReturnTo) {
        const sanitized = sanitizeReturnTo(sessionReturnTo);
        if (sanitized) {
          sessionStorage.removeItem('auth_returnTo');
          return sanitized;
        }
      }
    }

    return null;
  }, [searchParams, sanitizeReturnTo]);

  // Set returnTo for future redirects
  const setReturnTo = useCallback((returnTo: string, storage: 'local' | 'session' = 'session') => {
    const sanitized = sanitizeReturnTo(returnTo);
    if (!sanitized) return false;

    try {
      if (storage === 'local') {
        localStorage.setItem('auth_returnTo', sanitized);
      } else {
        sessionStorage.setItem('auth_returnTo', sanitized);
      }
      return true;
    } catch (error) {
      console.error('Failed to set returnTo:', error);
      return false;
    }
  }, [sanitizeReturnTo]);

  // Clear returnTo
  const clearReturnTo = useCallback((storage: 'local' | 'session' | 'both' = 'both') => {
    try {
      if (storage === 'local' || storage === 'both') {
        localStorage.removeItem('auth_returnTo');
      }
      if (storage === 'session' || storage === 'both') {
        sessionStorage.removeItem('auth_returnTo');
      }
    } catch (error) {
      console.error('Failed to clear returnTo:', error);
    }
  }, []);

  // Perform redirect
  const redirect = useCallback(async (
    returnTo?: string,
    additionalParams?: Record<string, string>
  ): Promise<RedirectResult> => {
    setIsRedirecting(true);

    try {
      // Determine target path
      let targetPath = returnTo || getReturnTo() || config.defaultPath || '/dashboard';

      // Sanitize the target path
      const sanitized = sanitizeReturnTo(targetPath);
      if (!sanitized) {
        targetPath = config.defaultPath || '/dashboard';
      } else {
        targetPath = sanitized;
      }

      // Add query parameters if requested
      if (config.preserveQueryParams && searchParams.toString()) {
        const separator = targetPath.includes('?') ? '&' : '?';
        targetPath += separator + searchParams.toString();
      }

      // Add auth parameters if requested
      if (config.addAuthParams) {
        const authParams = new URLSearchParams();
        authParams.set('auth_success', 'true');
        authParams.set('timestamp', Date.now().toString());
        
        const separator = targetPath.includes('?') ? '&' : '?';
        targetPath += separator + authParams.toString();
      }

      // Add additional parameters
      if (additionalParams && Object.keys(additionalParams).length > 0) {
        const additionalParamsString = new URLSearchParams(additionalParams).toString();
        const separator = targetPath.includes('?') ? '&' : '?';
        targetPath += separator + additionalParamsString;
      }

      // Perform redirect
      router.push(targetPath);

      const result: RedirectResult = {
        success: true,
        targetPath
      };

      // Clear returnTo after successful redirect
      clearReturnTo('both');

      return result;
    } catch (error: any) {
      const result: RedirectResult = {
        success: false,
        targetPath: config.defaultPath || '/dashboard',
        error: error.message || 'Redirect failed'
      };

      // Fallback to default path
      router.push(result.targetPath);
      return result;
    } finally {
      setIsRedirecting(false);
    }
  }, [router, searchParams, getReturnTo, sanitizeReturnTo, config, clearReturnTo]);

  // Redirect with delay
  const redirectWithDelay = useCallback(async (
    delayMs: number,
    returnTo?: string,
    additionalParams?: Record<string, string>
  ): Promise<RedirectResult> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const result = await redirect(returnTo, additionalParams);
        resolve(result);
      }, delayMs);
    });
  }, [redirect]);

  // Redirect to specific path
  const redirectTo = useCallback(async (
    path: string,
    additionalParams?: Record<string, string>
  ): Promise<RedirectResult> => {
    return redirect(path, additionalParams);
  }, [redirect]);

  // Redirect to default path
  const redirectToDefault = useCallback(async (
    additionalParams?: Record<string, string>
  ): Promise<RedirectResult> => {
    return redirect(undefined, additionalParams);
  }, [redirect]);

  // Check if we have a valid returnTo
  const hasValidReturnTo = useCallback((): boolean => {
    const returnTo = getReturnTo();
    return returnTo !== null;
  }, [getReturnTo]);

  // Get current returnTo value
  const getCurrentReturnTo = useCallback((): string | null => {
    return getReturnTo();
  }, [getReturnTo]);

  return {
    // State
    isRedirecting,
    
    // Core functions
    redirect,
    redirectWithDelay,
    redirectTo,
    redirectToDefault,
    
    // ReturnTo management
    getReturnTo,
    setReturnTo,
    clearReturnTo,
    hasValidReturnTo,
    getCurrentReturnTo,
    
    // Utility functions
    sanitizeReturnTo,
    
    // Configuration
    config
  };
}
