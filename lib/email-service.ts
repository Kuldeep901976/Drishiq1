// lib/email-service.ts
// Email service for sending welcome and notification emails

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Email Templates
 */
export const EmailTemplates = {
  WELCOME: 'welcome_email',
  EMAIL_VERIFICATION_REMINDER: 'email_verification_reminder',
  PHONE_VERIFICATION_REMINDER: 'phone_verification_reminder',
  VERIFICATION_COMPLETE: 'verification_complete',
  ONBOARDING_TIPS: 'onboarding_tips',
  ACCOUNT_CREATED: 'account_created',
};

/**
 * Email template data structure
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_template: string;
  text_template: string;
  variables: string[]; // e.g., ['user_name', 'activation_link']
}

/**
 * Queue email for sending
 */
export async function queueEmail(options: {
  user_id: string;
  recipient_email: string;
  template_id: string;
  subject: string;
  variables?: Record<string, string>;
  priority?: 'high' | 'normal' | 'low';
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('email_queue')
      .insert({
        user_id: options.user_id,
        recipient_email: options.recipient_email,
        template_id: options.template_id,
        subject: options.subject,
        template_variables: options.variables || {},
        priority: options.priority || 'normal',
        status: 'pending',
        created_at: new Date().toISOString(),
        retry_count: 0,
      });

    if (error) {
      console.error('Error queuing email:', error);
      return { success: false, error: error.message };
    }

    console.log(`📧 Email queued: ${options.template_id} → ${options.recipient_email}`);
    return { success: true };

  } catch (error) {
    console.error('Email queuing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send welcome email after email verification
 * Called when user completes email verification during signup
 */
export async function sendWelcomeEmail(options: {
  user_id: string;
  email: string;
  user_name?: string;
  user_type?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user data for personalization
    const { data: user } = await supabase
      .from('users')
      .select('full_name, email, user_type, created_at')
      .eq('id', options.user_id)
      .single();

    const userName = options.user_name || user?.full_name || 'User';
    const userType = options.user_type || user?.user_type || 'regular';

    // Determine welcome message based on user type
    const welcomeMessages = {
      regular: 'Welcome to DrishiQ! We\'re excited to have you on board.',
      grow: 'Welcome to DrishiQ Growth! Let\'s accelerate your journey.',
      enterprise: 'Welcome to DrishiQ Enterprise! Let\'s transform your business.',
    };

    const welcomeMessage =
      welcomeMessages[userType as keyof typeof welcomeMessages] ||
      welcomeMessages.regular;

    // Queue welcome email
    const result = await queueEmail({
      user_id: options.user_id,
      recipient_email: options.email,
      template_id: EmailTemplates.WELCOME,
      subject: `Welcome to DrishiQ, ${userName}! 🎉`,
      variables: {
        user_name: userName,
        welcome_message: welcomeMessage,
        user_type: userType,
        signup_date: new Date().toLocaleDateString(),
        dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        get_started_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
      },
      priority: 'high',
    });

    if (result.success) {
      // Log this event
      await supabase
        .from('user_events')
        .insert({
          user_id: options.user_id,
          event_type: 'welcome_email_queued',
          created_at: new Date().toISOString(),
        });
    }

    return result;

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send email verification reminder
 * Called when user verifies phone but hasn't verified email yet
 */
export async function sendEmailVerificationReminder(options: {
  user_id: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    return await queueEmail({
      user_id: options.user_id,
      recipient_email: options.email,
      template_id: EmailTemplates.EMAIL_VERIFICATION_REMINDER,
      subject: 'Complete Your Email Verification',
      variables: {
        verify_email_url: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`,
        support_email: process.env.SUPPORT_EMAIL || 'support@drishiq.com',
      },
      priority: 'high',
    });

  } catch (error) {
    console.error('Error sending email verification reminder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send phone verification reminder
 * Called when user verifies email but hasn't verified phone yet
 */
export async function sendPhoneVerificationReminder(options: {
  user_id: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    return await queueEmail({
      user_id: options.user_id,
      recipient_email: options.email,
      template_id: EmailTemplates.PHONE_VERIFICATION_REMINDER,
      subject: 'Verify Your Phone Number to Unlock Full Access',
      variables: {
        verify_phone_url: `${process.env.NEXT_PUBLIC_APP_URL}/verify-phone`,
        skip_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        support_email: process.env.SUPPORT_EMAIL || 'support@drishiq.com',
      },
      priority: 'high',
    });

  } catch (error) {
    console.error('Error sending phone verification reminder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send verification complete email
 * Called when user completes both email AND phone verification
 */
export async function sendVerificationCompleteEmail(options: {
  user_id: string;
  email: string;
  user_name?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', options.user_id)
      .single();

    const userName = options.user_name || user?.full_name || 'User';

    return await queueEmail({
      user_id: options.user_id,
      recipient_email: options.email,
      template_id: EmailTemplates.VERIFICATION_COMPLETE,
      subject: `You're All Set, ${userName}! 🚀`,
      variables: {
        user_name: userName,
        dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        onboarding_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
      },
      priority: 'high',
    });

  } catch (error) {
    console.error('Error sending verification complete email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send onboarding tips email
 * Called 24 hours after signup to guide user through features
 */
export async function sendOnboardingTipsEmail(options: {
  user_id: string;
  email: string;
  user_type?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    return await queueEmail({
      user_id: options.user_id,
      recipient_email: options.email,
      template_id: EmailTemplates.ONBOARDING_TIPS,
      subject: 'Get the Most Out of DrishiQ - Quick Tips',
      variables: {
        dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        help_url: `${process.env.NEXT_PUBLIC_APP_URL}/help`,
        tutorial_url: `${process.env.NEXT_PUBLIC_APP_URL}/tutorials`,
        support_email: process.env.SUPPORT_EMAIL || 'support@drishiq.com',
      },
      priority: 'normal',
    });

  } catch (error) {
    console.error('Error sending onboarding tips email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send account created confirmation
 * Called immediately after signup, before any verification
 */
export async function sendAccountCreatedEmail(options: {
  user_id: string;
  email: string;
  user_name?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', options.user_id)
      .single();

    const userName = options.user_name || user?.full_name || 'User';

    return await queueEmail({
      user_id: options.user_id,
      recipient_email: options.email,
      template_id: EmailTemplates.ACCOUNT_CREATED,
      subject: 'Welcome! Complete Your Signup',
      variables: {
        user_name: userName,
        verify_email_url: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`,
        help_url: `${process.env.NEXT_PUBLIC_APP_URL}/help`,
      },
      priority: 'high',
    });

  } catch (error) {
    console.error('Error sending account created email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Schedule delayed email sending
 * For emails that should be sent later (e.g., onboarding tips after 24 hours)
 */
export async function scheduleDelayedEmail(options: {
  user_id: string;
  email: string;
  template_id: string;
  subject: string;
  variables?: Record<string, string>;
  delay_minutes: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const scheduled_time = new Date(Date.now() + options.delay_minutes * 60 * 1000);

    const { error } = await supabase
      .from('email_queue')
      .insert({
        user_id: options.user_id,
        recipient_email: options.email,
        template_id: options.template_id,
        subject: options.subject,
        template_variables: options.variables || {},
        status: 'scheduled',
        scheduled_time: scheduled_time.toISOString(),
        created_at: new Date().toISOString(),
        retry_count: 0,
      });

    if (error) {
      console.error('Error scheduling email:', error);
      return { success: false, error: error.message };
    }

    console.log(
      `📅 Email scheduled: ${options.template_id} → ${options.email} (${options.delay_minutes} min)`
    );
    return { success: true };

  } catch (error) {
    console.error('Email scheduling error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}