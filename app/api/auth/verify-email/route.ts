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

      return NextResponse.json({
        success: true,
        data: {
          email_verified: true,
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




