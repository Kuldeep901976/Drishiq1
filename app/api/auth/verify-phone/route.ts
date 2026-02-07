import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServiceClient } from '@/lib/supabase';
import { withAuth, validateEmail, sanitizeInput, createSecureErrorResponse } from '@/lib/auth-middleware';

/**
 * POST /api/auth/verify-email
 * Updates email_verified flag after user confirms their email
 * 
 * This can be called from:
 * 1. Supabase webhook (after email confirmation)
 * 2. Client after successful email verification
 * 3. Admin panel for manual verification
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const { email } = body;

      // Validate required fields
      if (!email) {
        return NextResponse.json({ 
          error: 'Missing required field: email' 
        }, { status: 400 });
      }

      // Sanitize and validate email
      const sanitizedEmail = sanitizeInput(email);
      if (!validateEmail(sanitizedEmail)) {
        return NextResponse.json({ 
          error: 'Invalid email format' 
        }, { status: 400 });
      }

      // Verify the email belongs to the authenticated user
      if (user.email !== sanitizedEmail) {
        return NextResponse.json({ 
          error: 'Email does not match your account' 
        }, { status: 403 });
      }

      // Check if user exists and get current status
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email, email_verified')
        .eq('id', user.id)
        .single();

      if (!existingUser) {
        return NextResponse.json({ 
          error: 'User profile not found' 
        }, { status: 404 });
      }

      // If already verified, return success
      if (existingUser.email_verified) {
        return NextResponse.json({
          success: true,
          data: {
            email_verified: true,
            message: 'Email already verified'
          }
        });
      }

      // Use service client only for the update operation
      const serviceClient = createServiceClient();
      const { data: userData, error: updateError } = await serviceClient
        .from('users')
        .update({
          email_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating email verification:', updateError);
        return createSecureErrorResponse('Failed to update email verification status');
      }

      // Log verification event for audit trail
      try {
        await serviceClient
          .from('token_usage_audit')
          .insert({
            user_id: user.id,
            tokens_used: 0,
            purpose: 'email_verification',
            source: 'user_action',
            metadata: {
              email: sanitizedEmail,
              verified_at: new Date().toISOString()
            }
          });
      } catch (auditError) {
        console.error('Audit logging error:', auditError);
        // Don't fail the request if audit logging fails
      }

      // Determine next step based on verification status
      let nextStep = '/dashboard'; // Default
      
      if (!userData.phone_verified) {
        nextStep = '/onboarding/phone'; // Phone verification needed
      } else if (!userData.is_profile_complete) {
        nextStep = '/profile-completion'; // Profile completion needed
      }

      // Queue phone verification reminder if phone not verified
      if (!userData.phone_verified) {
        try {
          await serviceClient
            .from('email_queue')
            .insert({
              user_id: user.id,
              recipient_email: sanitizedEmail,
              template_id: 'phone_verification_reminder',
              subject: 'Verify Your Phone Number to Complete Setup',
              template_variables: {
                user_name: userData.full_name || 'User',
                verify_phone_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/phone`,
                skip_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
                support_email: process.env.SUPPORT_EMAIL || 'support@drishiq.com',
              },
              priority: 'high',
              status: 'pending',
              created_at: new Date().toISOString(),
            });
        } catch (emailError) {
          console.error('Error queuing phone verification reminder:', emailError);
          // Don't fail the request if email queuing fails
        }
      }

      // Queue welcome email if both email and phone verified
      if (userData.phone_verified) {
        try {
          await serviceClient
            .from('email_queue')
            .insert({
              user_id: user.id,
              recipient_email: sanitizedEmail,
              template_id: 'welcome_email',
              subject: `Welcome to DrishiQ, ${userData.full_name || 'User'}! 🎉`,
              template_variables: {
                user_name: userData.full_name || 'User',
                welcome_message: 'Welcome to DrishiQ! We\'re excited to have you on board.',
                dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
                get_started_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
              },
              priority: 'high',
              status: 'pending',
              created_at: new Date().toISOString(),
            });
        } catch (emailError) {
          console.error('Error queuing welcome email:', emailError);
          // Don't fail the request if email queuing fails
        }
      }

      // Update onboarding progress
      try {
        await serviceClient
          .from('user_onboarding_progress')
          .upsert({
            user_id: user.id,
            email_verified: true,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });
      } catch (progressError) {
        console.error('Error updating onboarding progress:', progressError);
        // Don't fail the request if progress tracking fails
      }

      return NextResponse.json({
        success: true,
        data: {
          email_verified: true,
          phone_verified: userData.phone_verified,
          is_profile_complete: userData.is_profile_complete,
          next_step: nextStep,
          message: 'Email verification successful'
        }
      });

    } catch (error) {
      console.error('Email verification error:', error);
      return createSecureErrorResponse('Email verification failed');
    }
  }, {
    rateLimit: { maxRequests: 5, windowMs: 300000 } // 5 requests per 5 minutes
  });
}

/**
 * GET /api/auth/verify-email?token=xxx
 * Handles email verification from link clicks
 * This is for custom email verification flows
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ 
        error: 'Missing verification token' 
      }, { status: 400 });
    }

    // TODO: Implement token-based verification if needed
    // For now, Supabase handles email verification automatically
    
    return NextResponse.redirect(new URL('/auth/email-verified', request.url));

  } catch (error) {
    console.error('Email verification GET error:', error);
    return NextResponse.redirect(new URL('/auth/email-verification-failed', request.url));
  }
}