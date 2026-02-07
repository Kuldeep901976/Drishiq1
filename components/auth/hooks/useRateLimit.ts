'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { RateLimitState } from '../types';

export interface RateLimitConfig {
  otp: {
    maxAttempts: number;
    cooldownSeconds: number;
    windowMinutes: number;
  };
  email: {
    maxAttempts: number;
    cooldownSeconds: number;
    windowMinutes: number;
  };
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  cooldownRemaining: number;
  nextAllowedTime: Date | null;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  otp: {
    maxAttempts: 5,
    cooldownSeconds: 60,
    windowMinutes: 15
  },
  email: {
    maxAttempts: 3,
    cooldownSeconds: 300, // 5 minutes
    windowMinutes: 60
  }
};

export function useRateLimit(config: RateLimitConfig = DEFAULT_CONFIG) {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    otp: {
      lastSent: 0,
      attempts: 0,
      cooldown: 0
    },
    email: {
      lastSent: 0,
      attempts: 0,
      cooldown: 0
    }
  });

  const cooldownTimers = useRef<{
    otp: NodeJS.Timeout | null;
    email: NodeJS.Timeout | null;
  }>({
    otp: null,
    email: null
  });

  // Clear cooldown timer
  const clearCooldownTimer = useCallback((type: 'otp' | 'email') => {
    if (cooldownTimers.current[type]) {
      clearTimeout(cooldownTimers.current[type]!);
      cooldownTimers.current[type] = null;
    }
  }, []);

  // Start cooldown timer
  const startCooldownTimer = useCallback((type: 'otp' | 'email') => {
    clearCooldownTimer(type);
    
    const cooldownMs = config[type].cooldownSeconds * 1000;
    cooldownTimers.current[type] = setTimeout(() => {
      setRateLimitState(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          cooldown: 0
        }
      }));
    }, cooldownMs);
  }, [config, clearCooldownTimer]);

  // Check if action is allowed
  const checkRateLimit = useCallback((type: 'otp' | 'email'): RateLimitResult => {
    const now = Date.now();
    const state = rateLimitState[type];
    const configType = config[type];

    // Check if we're in cooldown
    if (state.cooldown > 0) {
      const cooldownRemaining = Math.ceil(state.cooldown / 1000);
      const nextAllowedTime = new Date(now + (cooldownRemaining * 1000));
      
      return {
        allowed: false,
        remainingAttempts: 0,
        cooldownRemaining,
        nextAllowedTime
      };
    }

    // Check if we're within the time window
    const windowMs = configType.windowMinutes * 60 * 1000;
    const withinWindow = (now - state.lastSent) < windowMs;

    if (withinWindow) {
      // Within window, check attempts
      if (state.attempts >= configType.maxAttempts) {
        // Max attempts reached, start cooldown
        const cooldownRemaining = configType.cooldownSeconds;
        const nextAllowedTime = new Date(now + (cooldownRemaining * 1000));
        
        setRateLimitState(prev => ({
          ...prev,
          [type]: {
            ...prev[type],
            cooldown: cooldownRemaining
          }
        }));

        startCooldownTimer(type);

        return {
          allowed: false,
          remainingAttempts: 0,
          cooldownRemaining,
          nextAllowedTime
        };
      }

      // Still have attempts remaining
      return {
        allowed: true,
        remainingAttempts: configType.maxAttempts - state.attempts,
        cooldownRemaining: 0,
        nextAllowedTime: null
      };
    } else {
      // Outside window, reset attempts
      setRateLimitState(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          attempts: 0
        }
      }));

      return {
        allowed: true,
        remainingAttempts: configType.maxAttempts,
        cooldownRemaining: 0,
        nextAllowedTime: null
      };
    }
  }, [rateLimitState, config, startCooldownTimer]);

  // Record an attempt
  const recordAttempt = useCallback((type: 'otp' | 'email') => {
    const now = Date.now();
    
    setRateLimitState(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        lastSent: now,
        attempts: prev[type].attempts + 1
      }
    }));
  }, []);

  // Reset rate limit for a type
  const resetRateLimit = useCallback((type: 'otp' | 'email') => {
    clearCooldownTimer(type);
    
    setRateLimitState(prev => ({
      ...prev,
      [type]: {
        lastSent: 0,
        attempts: 0,
        cooldown: 0
      }
    }));
  }, [clearCooldownTimer]);

  // Reset all rate limits
  const resetAllRateLimits = useCallback(() => {
    clearCooldownTimer('otp');
    clearCooldownTimer('email');
    
    setRateLimitState({
      otp: {
        lastSent: 0,
        attempts: 0,
        cooldown: 0
      },
      email: {
        lastSent: 0,
        attempts: 0,
        cooldown: 0
      }
    });
  }, [clearCooldownTimer]);

  // Get formatted time remaining
  const getFormattedTimeRemaining = useCallback((seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.ceil(seconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.ceil(seconds / 3600);
      return `${hours}h`;
    }
  }, []);

  // Check OTP rate limit
  const checkOtpRateLimit = useCallback((): RateLimitResult => {
    return checkRateLimit('otp');
  }, [checkRateLimit]);

  // Check email rate limit
  const checkEmailRateLimit = useCallback((): RateLimitResult => {
    return checkRateLimit('email');
  }, [checkRateLimit]);

  // Record OTP attempt
  const recordOtpAttempt = useCallback(() => {
    recordAttempt('otp');
  }, [recordAttempt]);

  // Record email attempt
  const recordEmailAttempt = useCallback(() => {
    recordAttempt('email');
  }, [recordAttempt]);

  // Reset OTP rate limit
  const resetOtpRateLimit = useCallback(() => {
    resetRateLimit('otp');
  }, [resetRateLimit]);

  // Reset email rate limit
  const resetEmailRateLimit = useCallback(() => {
    resetRateLimit('email');
  }, [resetRateLimit]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearCooldownTimer('otp');
      clearCooldownTimer('email');
    };
  }, [clearCooldownTimer]);

  return {
    // State
    rateLimitState,
    
    // Core functions
    checkRateLimit,
    recordAttempt,
    resetRateLimit,
    resetAllRateLimits,
    
    // Type-specific functions
    checkOtpRateLimit,
    checkEmailRateLimit,
    recordOtpAttempt,
    recordEmailAttempt,
    resetOtpRateLimit,
    resetEmailRateLimit,
    
    // Utility functions
    getFormattedTimeRemaining,
    
    // Computed values
    isOtpAllowed: checkOtpRateLimit().allowed,
    isEmailAllowed: checkEmailRateLimit().allowed,
    otpCooldownRemaining: rateLimitState.otp.cooldown,
    emailCooldownRemaining: rateLimitState.email.cooldown
  };
}
