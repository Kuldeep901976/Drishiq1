// lib/sentry-config.ts
// Sentry error tracking configuration for authentication

import * as Sentry from "@sentry/nextjs";

/**
 * Initialize Sentry for error tracking
 * Call this in your app's root (_app.tsx or layout.tsx)
 */
export function initializeSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Tracing
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',

    // Integrations
    integrations: [
      // Auto-capture unhandled exceptions
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
      // Capture console errors
      new Sentry.CaptureConsole({
        levels: ['error', 'warn'],
      }),
    ],

    // Replay settings
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Allowlist URLs to capture (auth-related)
    allowUrls: [
      /https:\/\/.*drishiq\.com/,
      /https:\/\/.*supabase\.co/,
      /https:\/\/.*firebase\.google\.com/,
    ],

    beforeSend(event, hint) {
      // Filter out certain errors (optional)
      if (event.exception) {
        const error = hint.originalException;

        // Don't send network errors in development
        if (process.env.NODE_ENV === 'development' && 
            error instanceof Error && 
            error.message.includes('fetch')) {
          return null;
        }
      }

      return event;
    },

    // Auth-specific tags
    initialScope: {
      tags: {
        'feature': 'authentication',
        'service': 'auth',
      },
    },
  });
}

/**
 * Auth Error Categories
 * Use these to categorize different auth errors
 */
export const AuthErrorCategories = {
  SIGNUP_ERROR: 'signup_error',
  SIGNIN_ERROR: 'signin_error',
  EMAIL_VERIFICATION_ERROR: 'email_verification_error',
  PHONE_VERIFICATION_ERROR: 'phone_verification_error',
  OAUTH_ERROR: 'oauth_error',
  SESSION_ERROR: 'session_error',
  PASSWORD_RESET_ERROR: 'password_reset_error',
  RATE_LIMIT_ERROR: 'rate_limit_error',
  VALIDATION_ERROR: 'validation_error',
  INTERNAL_ERROR: 'internal_error',
};

/**
 * Capture authentication errors with context
 */
export function captureAuthError(
  error: Error | string,
  context: {
    category: string;
    action: string;
    user_id?: string;
    email?: string;
    additional_context?: Record<string, any>;
  }
) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  Sentry.captureException(error, {
    tags: {
      'auth_category': context.category,
      'auth_action': context.action,
    },
    extra: {
      ...context.additional_context,
    },
    user: context.user_id
      ? {
          id: context.user_id,
          email: context.email,
        }
      : undefined,
  });

  console.error(`[${context.category}] ${context.action}: ${errorMessage}`, context);
}

/**
 * Capture auth events (not errors) for monitoring
 */
export function captureAuthEvent(
  event: string,
  context: {
    user_id?: string;
    email?: string;
    method?: string;
    status?: 'success' | 'failure';
    metadata?: Record<string, any>;
  }
) {
  Sentry.captureMessage(event, {
    level: 'info',
    tags: {
      'auth_event': event,
      'auth_status': context.status || 'unknown',
    },
    extra: {
      ...context.metadata,
    },
    user: context.user_id
      ? {
          id: context.user_id,
          email: context.email,
        }
      : undefined,
  });

  console.info(`[AUTH_EVENT] ${event}`, context);
}

/**
 * Wrapper for API route handlers with automatic error tracking
 */
export function withErrorTracking(
  handler: (request: any) => Promise<any>,
  context: { route: string; action: string }
) {
  return async (request: any) => {
    try {
      return await handler(request);
    } catch (error) {
      captureAuthError(error as Error, {
        category: AuthErrorCategories.INTERNAL_ERROR,
        action: context.action,
        additional_context: {
          route: context.route,
          method: request.method,
        },
      });
      throw error;
    }
  };
}

// ---

// app/api/auth/signup/route.ts
// Example usage in your signup API route:

import { NextRequest, NextResponse } from 'next/server';
import { 
  captureAuthError, 
  captureAuthEvent, 
  AuthErrorCategories,
  withErrorTracking,
} from '@/lib/sentry-config';

async function signupHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, user_type } = body;

    // Validate inputs
    if (!email || !password) {
      captureAuthError('Missing required fields', {
        category: AuthErrorCategories.VALIDATION_ERROR,
        action: 'signup_validation',
        email: email || 'unknown',
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Email and password are required',
        },
        { status: 400 }
      );
    }

    // Attempt signup with Supabase
    // ... your signup logic ...

    // Capture successful signup
    captureAuthEvent('user_signup_successful', {
      email,
      method: 'email_password',
      status: 'success',
      metadata: {
        user_type,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Signup successful',
      },
      { status: 201 }
    );

  } catch (error) {
    // Capture error automatically
    captureAuthError(error as Error, {
      category: AuthErrorCategories.SIGNUP_ERROR,
      action: 'signup',
      email: body?.email,
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Signup failed',
      },
      { status: 500 }
    );
  }
}

// Export with error tracking wrapper
export const POST = withErrorTracking(signupHandler, {
  route: '/api/auth/signup',
  action: 'signup',
});

// ---

/**
 * Usage in frontend components:
 * 
 * import { captureAuthError, AuthErrorCategories } from '@/lib/sentry-config';
 * 
 * try {
 *   const response = await supabase.auth.signUp({...});
 * } catch (error) {
 *   captureAuthError(error, {
 *     category: AuthErrorCategories.SIGNUP_ERROR,
 *     action: 'supabase_signup',
 *     email: email,
 *   });
 * }
 */

/**
 * Environment variables needed in .env.local:
 * 
 * # Sentry Configuration
 * NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
 * NEXT_PUBLIC_APP_VERSION=1.0.0
 */