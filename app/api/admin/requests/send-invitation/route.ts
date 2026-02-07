import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Helper function to get request type label
function getTypeLabel(type: string): string {
  return type === 'trial_access' ? 'Trial Access' : 'Sponsor Support';
}

// Send invitation to approved requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestIds } = body;

    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json(
        { error: 'Request IDs are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const results = [];

    for (const requestId of requestIds) {
      try {
        // Fetch the request
        const { data: requestData, error: fetchError } = await supabase
          .from('requests')
          .select('*')
          .eq('id', requestId)
          .single();

        if (fetchError || !requestData) {
          results.push({
            requestId,
            success: false,
            error: 'Request not found'
          });
          continue;
        }

        // Check if request is approved
        if (requestData.status !== 'approved') {
          results.push({
            requestId,
            success: false,
            error: 'Request must be approved before sending invitation'
          });
          continue;
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', requestData.email)
          .maybeSingle();

        if (existingUser) {
          results.push({
            requestId,
            success: false,
            error: 'User already exists with this email'
          });
          continue;
        }

        // Create auth user and send magic link
        const supabaseAuth = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Create auth user
        const { data: authData, error: authError } = await supabaseAuth.auth.admin.createUser({
          email: requestData.email,
          email_confirm: false, // User will confirm via magic link
          user_metadata: {
            first_name: requestData.first_name,
            last_name: requestData.last_name,
            phone: requestData.phone,
            request_id: requestId,
            request_type: requestData.request_type
          }
        });

        if (authError || !authData.user) {
          results.push({
            requestId,
            success: false,
            error: `Failed to create auth user: ${authError?.message || 'Unknown error'}`
          });
          continue;
        }

        // Create user record in users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: requestData.email,
            first_name: requestData.first_name,
            last_name: requestData.last_name,
            phone: requestData.phone,
            country: requestData.country,
            location: requestData.location,
            role: 'user',
            is_active: true,
            auth_provider: 'email',
            login_method: 'magic_link',
            email_verified: false,
            phone_verified: requestData.phone ? true : false,
            is_profile_complete: false,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (userError) {
          // Clean up auth user if user creation fails
          await supabaseAuth.auth.admin.deleteUser(authData.user.id);
          results.push({
            requestId,
            success: false,
            error: `Failed to create user record: ${userError.message}`
          });
          continue;
        }

        // Add 1 credit to user using the add_credits_to_user function
        // Use 'granted' as transaction_type (matches credit_transactions schema)
        const { data: transactionData, error: creditError } = await supabase.rpc('add_credits_to_user', {
          p_user_id: authData.user.id,
          p_credits: 1,
          p_transaction_type: 'granted',
          p_description: `Free trial access credit granted from ${requestData.request_type} request (Request ID: ${requestId})`
        });

        let transactionId = null;
        if (creditError) {
          console.error('Error adding credits:', creditError);
          // Continue even if credit addition fails - user is created
        } else {
          transactionId = transactionData;
        }

        // Send magic link email using signInWithOtp
        // Since user is already created, we'll use inviteUserByEmail or send OTP
        const { data: linkData, error: magicLinkError } = await supabaseAuth.auth.admin.generateLink({
          type: 'magiclink',
          email: requestData.email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback?invitation=true&request_id=${requestId}`
          }
        });

        if (magicLinkError || !linkData) {
          console.error('Error generating magic link:', magicLinkError);
          // Try alternative: send OTP email directly
          const { error: otpError } = await supabaseAuth.auth.admin.inviteUserByEmail(requestData.email, {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback?invitation=true&request_id=${requestId}`
          });
          
          if (otpError) {
            console.error('Error sending invitation email:', otpError);
            // User is created, but email sending failed - log for manual follow-up
          }
        } else if (linkData.properties?.action_link) {
          // If generateLink returns a link, you could send it via your email service
          // For now, Supabase should send it automatically, but you may want to use a custom email service
          console.log('Magic link generated:', linkData.properties.action_link);
        }

        // Update request status to completed
        await supabase
          .from('requests')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
            notes: requestData.notes 
              ? `${requestData.notes}\n\nInvitation sent on ${new Date().toISOString()}`
              : `Invitation sent on ${new Date().toISOString()}`
          })
          .eq('id', requestId);

        // Log activity in user_activities table
        // Get admin user ID from request headers or session if available
        const adminUserId = request.headers.get('x-admin-user-id') || null;
        
        await supabase
          .from('user_activities')
          .insert({
            user_id: authData.user.id,
            activity_type: 'invitation_sent',
            activity_category: 'request_management',
            actor_type: 'admin',
            actor_id: adminUserId,
            actor_email: null, // Can be populated from admin session
            target_type: 'user',
            target_id: authData.user.id,
            title: 'Invitation Sent for Trial Access',
            description: `Invitation sent to ${requestData.email} for ${getTypeLabel(requestData.request_type)}. User created with 1 free credit.`,
            request_id: requestId,
            transaction_id: transactionId,
            status: 'completed',
            metadata: {
              request_type: requestData.request_type,
              credits_granted: 1,
              invitation_method: 'magic_link'
            }
          });

        // Also log credit grant activity
        if (transactionId) {
          await supabase
            .from('user_activities')
            .insert({
              user_id: authData.user.id,
              activity_type: 'credit_granted',
              activity_category: 'credit_management',
              actor_type: 'admin',
              actor_id: adminUserId,
              target_type: 'credit',
              target_id: transactionId,
              title: 'Credit Granted',
              description: `1 credit granted as free trial access from ${requestData.request_type} request`,
              request_id: requestId,
              transaction_id: transactionId,
              status: 'completed',
              metadata: {
                credits: 1,
                transaction_type: 'granted',
                source: 'trial_access_request'
              }
            });
        }

        results.push({
          requestId,
          success: true,
          userId: authData.user.id,
          email: requestData.email,
          transactionId
        });

      } catch (error: any) {
        results.push({
          requestId,
          success: false,
          error: error.message || 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Processed ${requestIds.length} request(s): ${successCount} successful, ${failureCount} failed`,
      results
    });

  } catch (error: any) {
    console.error('Error in POST /api/admin/requests/send-invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

